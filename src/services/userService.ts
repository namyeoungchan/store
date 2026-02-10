import { FirestoreService } from '../database/database';
import { User, UserWithSchedule } from '../types';
import { PasswordUtils } from '../utils/passwordUtils';

export class UserService {
  private static collectionName = FirestoreService.collections.users;

  static async getAllUsers(): Promise<User[]> {
    try {
      const data = await FirestoreService.getOrderedBy(this.collectionName, 'created_at', 'desc');
      return data as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const data = await FirestoreService.getById(this.collectionName, id);
      return data as User | null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
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
      ...user,
      password_hash: passwordHash,
      password_temp: passwordTemp,
      is_password_temp: isPasswordTemp,
      is_active: user.is_active ?? true,
      hourly_wage: user.hourly_wage || 0,
      monthly_salary: user.monthly_salary || 0,
      salary_type: user.salary_type || 'HOURLY',
    };

    try {
      const id = await FirestoreService.create(this.collectionName, userData);
      const created = await this.getUserById(id);

      if (!created) throw new Error('Failed to retrieve created user');

      const result = { ...created, password_temp: passwordTemp || undefined };
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
    try {
      // undefined 값 필터링
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      await FirestoreService.update(this.collectionName, id, cleanUpdates);
      return this.getUserById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      await FirestoreService.delete(this.collectionName, id);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  static async getUsersWithCurrentSchedule(): Promise<UserWithSchedule[]> {
    try {
      const currentWeekStart = this.getCurrentWeekStart();
      const users = await this.getAllUsers();
      const activeUsers = users.filter(user => user.is_active);

      const usersWithSchedule: UserWithSchedule[] = [];

      for (const user of activeUsers) {
        const userWithSchedule: UserWithSchedule = { ...user };

        // 현재 주 스케줄 조회
        const schedules = await FirestoreService.getWithMultipleWhere(
          FirestoreService.collections.workSchedules,
          [
            { field: 'user_id', operator: '==', value: String(user.id) },
            { field: 'week_start_date', operator: '==', value: currentWeekStart }
          ]
        );

        if (schedules.length > 0) {
          const schedule = schedules[0];
          userWithSchedule.current_schedule = {
            user_id: String(user.id!),
            week_start_date: currentWeekStart,
            monday_start: schedule.monday_start,
            monday_end: schedule.monday_end,
            tuesday_start: schedule.tuesday_start,
            tuesday_end: schedule.tuesday_end,
            wednesday_start: schedule.wednesday_start,
            wednesday_end: schedule.wednesday_end,
            thursday_start: schedule.thursday_start,
            thursday_end: schedule.thursday_end,
            friday_start: schedule.friday_start,
            friday_end: schedule.friday_end,
            saturday_start: schedule.saturday_start,
            saturday_end: schedule.saturday_end,
            sunday_start: schedule.sunday_start,
            sunday_end: schedule.sunday_end,
          };
        }

        // 주간 근무 시간 계산
        const weeklyHours = await this.getUserWeeklyHours(String(user.id!), currentWeekStart);
        userWithSchedule.total_hours_this_week = weeklyHours.total_hours;
        userWithSchedule.total_pay_this_week = weeklyHours.total_pay;

        usersWithSchedule.push(userWithSchedule);
      }

      return usersWithSchedule.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } catch (error) {
      console.error('Error getting users with current schedule:', error);
      return [];
    }
  }

  private static getCurrentWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  private static async getUserWeeklyHours(userId: string, weekStart: string): Promise<{total_hours: number, total_pay: number}> {
    try {
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
    } catch (error) {
      console.error('Error getting user weekly hours:', error);
      return { total_hours: 0, total_pay: 0 };
    }
  }

  // 로그인 관련 메서드들
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'email', operator: '==', value: email },
        { field: 'is_active', operator: '==', value: true }
      ]);

      if (users.length === 0) return null;
      return users[0] as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password_hash) return null;

    const isValid = await PasswordUtils.verifyPassword(password, user.password_hash);
    if (!isValid) return null;

    // 로그인 시간 업데이트
    await this.updateLastLogin(user.id!);

    return user;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await FirestoreService.update(this.collectionName, userId, {
        last_login: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async resetPassword(userId: string): Promise<string> {
    const tempPassword = PasswordUtils.generateTempPassword();
    const passwordHash = await PasswordUtils.hashPassword(tempPassword);

    try {
      await FirestoreService.update(this.collectionName, userId, {
        password_hash: passwordHash,
        password_temp: tempPassword,
        is_password_temp: true
      });

      return tempPassword;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const validation = PasswordUtils.validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const passwordHash = await PasswordUtils.hashPassword(newPassword);

    try {
      await FirestoreService.update(this.collectionName, userId, {
        password_hash: passwordHash,
        password_temp: null,
        is_password_temp: false
      });

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  static async toggleUserLoginAccess(userId: string, hasAccess: boolean): Promise<void> {
    try {
      if (hasAccess) {
        const tempPassword = PasswordUtils.generateTempPassword();
        const passwordHash = await PasswordUtils.hashPassword(tempPassword);

        await FirestoreService.update(this.collectionName, userId, {
          password_hash: passwordHash,
          password_temp: tempPassword,
          is_password_temp: true
        });
      } else {
        await FirestoreService.update(this.collectionName, userId, {
          password_hash: null,
          password_temp: null,
          is_password_temp: true
        });
      }
    } catch (error) {
      console.error('Error toggling user login access:', error);
      throw error;
    }
  }
}
