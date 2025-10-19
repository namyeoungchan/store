import { supabase } from '../firebase/config';
import { User, UserWithSchedule, SalaryType } from '../types';
import { PasswordUtils } from '../utils/passwordUtils';

export class UserService {
  private static tableName = 'users';

  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(userData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('이미 존재하는 사용자입니다.');
        }
        throw error;
      }

      const result = { ...data, password_temp: passwordTemp };
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  static async getUsersWithCurrentSchedule(): Promise<UserWithSchedule[]> {
    try {
      const currentWeekStart = this.getCurrentWeekStart();
      const { data: users, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      const usersWithSchedule: UserWithSchedule[] = [];

      for (const user of users || []) {
        const userWithSchedule = user as UserWithSchedule;

        // 현재 주 스케줄 조회
        const { data: schedules } = await supabase
          .from('work_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start_date', currentWeekStart);

        if (schedules && schedules.length > 0) {
          const schedule = schedules[0];
          userWithSchedule.current_schedule = {
            user_id: user.id!,
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
        const weeklyHours = await this.getUserWeeklyHours(user.id!, currentWeekStart);
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

      const { data: workRecords } = await supabase
        .from('work_records')
        .select('*')
        .eq('user_id', userId)
        .gte('work_date', weekStart)
        .lte('work_date', weekEndStr);

      const totalHours = (workRecords || []).reduce((sum, record) => sum + (record.total_hours || 0), 0);
      const totalPay = (workRecords || []).reduce((sum, record) => sum + (record.total_pay || 0), 0);

      return { total_hours: totalHours, total_pay: totalPay };
    } catch (error) {
      console.error('Error getting user weekly hours:', error);
      return { total_hours: 0, total_pay: 0 };
    }
  }

  // 로그인 관련 메서드들
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from(this.tableName)
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async resetPassword(userId: string): Promise<string> {
    const tempPassword = PasswordUtils.generateTempPassword();
    const passwordHash = await PasswordUtils.hashPassword(tempPassword);

    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          password_hash: passwordHash,
          password_temp: tempPassword,
          is_password_temp: true
        })
        .eq('id', userId);

      if (error) throw error;
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
      const { error } = await supabase
        .from(this.tableName)
        .update({
          password_hash: passwordHash,
          password_temp: null,
          is_password_temp: false
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  static async toggleUserLoginAccess(userId: string, hasAccess: boolean): Promise<void> {
    try {
      if (hasAccess) {
        // 로그인 권한 부여 - 임시 비밀번호 생성
        const tempPassword = PasswordUtils.generateTempPassword();
        const passwordHash = await PasswordUtils.hashPassword(tempPassword);

        const { error } = await supabase
          .from(this.tableName)
          .update({
            password_hash: passwordHash,
            password_temp: tempPassword,
            is_password_temp: true
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        // 로그인 권한 제거
        const { error } = await supabase
          .from(this.tableName)
          .update({
            password_hash: null,
            password_temp: null,
            is_password_temp: true
          })
          .eq('id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling user login access:', error);
      throw error;
    }
  }

}