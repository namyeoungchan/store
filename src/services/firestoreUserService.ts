import { FirestoreService } from '../firebase/firestoreService';
import { User, UserWithSchedule, SalaryType } from '../types';
import { PasswordUtils } from '../utils/passwordUtils';
import { where, orderBy } from 'firebase/firestore';

export class FirestoreUserService {
  private static collectionName = FirestoreService.collections.users;

  static async getAllUsers(): Promise<User[]> {
    const users = await FirestoreService.getOrderedBy(this.collectionName, 'created_at', 'desc');
    return users.map(this.mapFirestoreToUser);
  }

  static async getUserById(id: string): Promise<User | null> {
    const userData = await FirestoreService.getById(this.collectionName, id);
    if (!userData) return null;
    return this.mapFirestoreToUser(userData);
  }

  static async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>, generateLogin: boolean = true): Promise<User> {
    let passwordHash = null;
    let passwordTemp = null;
    let isPasswordTemp = false;

    if (generateLogin) {
      passwordTemp = PasswordUtils.generateTempPassword();
      passwordHash = await PasswordUtils.hashPassword(passwordTemp);
      isPasswordTemp = true;
    }

    const userData = {
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      hire_date: user.hire_date,
      position: user.position,
      salary_type: user.salary_type || 'HOURLY',
      hourly_wage: user.hourly_wage || 0,
      monthly_salary: user.monthly_salary || 0,
      password_hash: passwordHash,
      password_temp: passwordTemp,
      is_password_temp: isPasswordTemp,
      last_login: null,
      is_active: user.is_active !== false
    };

    const userId = await FirestoreService.create(this.collectionName, userData);
    return this.getUserById(userId) as Promise<User>;
  }

  static async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
    // Firestore에서는 undefined 값을 허용하지 않으므로 필터링
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await FirestoreService.update(this.collectionName, id, cleanUpdates);
    return this.getUserById(id);
  }

  static async deleteUser(id: string): Promise<boolean> {
    await FirestoreService.delete(this.collectionName, id);
    return true;
  }

  static async getUsersWithCurrentSchedule(): Promise<UserWithSchedule[]> {
    const currentWeekStart = this.getCurrentWeekStart();
    const users = await this.getAllUsers();
    const activeUsers = users.filter(user => user.is_active);

    // 각 유저별로 현재 주 스케줄 조회
    const usersWithSchedule = await Promise.all(
      activeUsers.map(async (user) => {
        const userWithSchedule: UserWithSchedule = { ...user };

        // 현재 주 스케줄 조회
        const schedules = await FirestoreService.getWhere(
          FirestoreService.collections.workSchedules,
          'user_id',
          '==',
          String(user.id)
        );

        const currentSchedule = schedules.find(s => s.week_start_date === currentWeekStart);
        if (currentSchedule) {
          userWithSchedule.current_schedule = {
            user_id: String(user.id!),
            week_start_date: currentWeekStart,
            monday_start: currentSchedule.monday_start,
            monday_end: currentSchedule.monday_end,
            tuesday_start: currentSchedule.tuesday_start,
            tuesday_end: currentSchedule.tuesday_end,
            wednesday_start: currentSchedule.wednesday_start,
            wednesday_end: currentSchedule.wednesday_end,
            thursday_start: currentSchedule.thursday_start,
            thursday_end: currentSchedule.thursday_end,
            friday_start: currentSchedule.friday_start,
            friday_end: currentSchedule.friday_end,
            saturday_start: currentSchedule.saturday_start,
            saturday_end: currentSchedule.saturday_end,
            sunday_start: currentSchedule.sunday_start,
            sunday_end: currentSchedule.sunday_end,
          };
        }

        // 주간 근무 시간 계산
        const weeklyHours = await this.getUserWeeklyHours(String(user.id!), currentWeekStart);
        userWithSchedule.total_hours_this_week = weeklyHours.total_hours;
        userWithSchedule.total_pay_this_week = weeklyHours.total_pay;

        return userWithSchedule;
      })
    );

    return usersWithSchedule.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  private static getCurrentWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  private static async getUserWeeklyHours(userId: string, weekStart: string): Promise<{total_hours: number, total_pay: number}> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const workRecords = await FirestoreService.getWithMultipleWhere(
      FirestoreService.collections.workRecords,
      [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'work_date', operator: '>=', value: weekStart },
        { field: 'work_date', operator: '<=', value: weekEndStr }
      ]
    );

    const totalHours = workRecords.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const totalPay = workRecords.reduce((sum, record) => sum + (record.total_pay || 0), 0);

    return { total_hours: totalHours, total_pay: totalPay };
  }

  // 로그인 관련 메서드들
  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await FirestoreService.getWithMultipleWhere(this.collectionName, [
      { field: 'email', operator: '==', value: email },
      { field: 'is_active', operator: '==', value: true }
    ]);

    if (users.length === 0) return null;
    return this.mapFirestoreToUser(users[0]);
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password_hash) return null;

    const isValid = await PasswordUtils.verifyPassword(password, user.password_hash);
    if (!isValid) return null;

    // 로그인 시간 업데이트
    await this.updateLastLogin(String(user.id!));

    return user;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await FirestoreService.update(this.collectionName, userId, {
      last_login: new Date().toISOString()
    });
  }

  static async resetPassword(userId: string): Promise<string> {
    const tempPassword = PasswordUtils.generateTempPassword();
    const passwordHash = await PasswordUtils.hashPassword(tempPassword);

    await FirestoreService.update(this.collectionName, userId, {
      password_hash: passwordHash,
      password_temp: tempPassword,
      is_password_temp: true
    });

    return tempPassword;
  }

  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const validation = PasswordUtils.validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const passwordHash = await PasswordUtils.hashPassword(newPassword);

    await FirestoreService.update(this.collectionName, userId, {
      password_hash: passwordHash,
      password_temp: null,
      is_password_temp: false
    });

    return true;
  }

  static async toggleUserLoginAccess(userId: string, hasAccess: boolean): Promise<void> {
    if (hasAccess) {
      // 로그인 권한 부여 - 임시 비밀번호 생성
      const tempPassword = PasswordUtils.generateTempPassword();
      const passwordHash = await PasswordUtils.hashPassword(tempPassword);

      await FirestoreService.update(this.collectionName, userId, {
        password_hash: passwordHash,
        password_temp: tempPassword,
        is_password_temp: true
      });
    } else {
      // 로그인 권한 제거
      await FirestoreService.update(this.collectionName, userId, {
        password_hash: null,
        password_temp: null,
        is_password_temp: true
      });
    }
  }

  // Firestore 데이터를 User 타입으로 변환
  private static mapFirestoreToUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      hire_date: data.hire_date,
      position: data.position,
      salary_type: (data.salary_type || 'HOURLY') as SalaryType,
      hourly_wage: data.hourly_wage || 0,
      monthly_salary: data.monthly_salary || 0,
      password_hash: data.password_hash,
      password_temp: data.password_temp,
      is_password_temp: Boolean(data.is_password_temp),
      last_login: data.last_login,
      is_active: Boolean(data.is_active),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}