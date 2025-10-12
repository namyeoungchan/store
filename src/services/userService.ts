import { getDatabase, persistDatabase } from '../database/database';
import { User, UserWithSchedule } from '../types';
import { PasswordUtils } from '../utils/passwordUtils';

export class UserService {
  private static getDb() {
    return getDatabase();
  }

  static async getAllUsers(): Promise<User[]> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT * FROM users
      ORDER BY created_at DESC
    `);

    if (result.length === 0) return [];

    const [{ values }] = result;
    return values.map(row => ({
      id: row[0] as number,
      username: row[1] as string,
      email: row[2] as string,
      full_name: row[3] as string,
      phone: row[4] as string,
      hire_date: row[5] as string,
      position: row[6] as string,
      hourly_wage: row[7] as number,
      password_hash: row[8] as string,
      password_temp: row[9] as string,
      is_password_temp: Boolean(row[10]),
      last_login: row[11] as string,
      is_active: Boolean(row[12]),
      created_at: row[13] as string,
      updated_at: row[14] as string,
    }));
  }

  static async getUserById(id: number): Promise<User | null> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT * FROM users WHERE id = ?
    `, [id]);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      username: row[1] as string,
      email: row[2] as string,
      full_name: row[3] as string,
      phone: row[4] as string,
      hire_date: row[5] as string,
      position: row[6] as string,
      hourly_wage: row[7] as number,
      password_hash: row[8] as string,
      password_temp: row[9] as string,
      is_password_temp: Boolean(row[10]),
      last_login: row[11] as string,
      is_active: Boolean(row[12]),
      created_at: row[13] as string,
      updated_at: row[14] as string,
    };
  }

  static async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>, generateLogin: boolean = true): Promise<User> {
    const db = this.getDb();

    let passwordHash = null;
    let passwordTemp = null;
    let isPasswordTemp = false;

    if (generateLogin) {
      passwordTemp = PasswordUtils.generateTempPassword();
      passwordHash = await PasswordUtils.hashPassword(passwordTemp);
      isPasswordTemp = true;
    }

    const stmt = db.prepare(`
      INSERT INTO users (username, email, full_name, phone, hire_date, position, hourly_wage, password_hash, password_temp, is_password_temp, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      user.username,
      user.email,
      user.full_name,
      user.phone,
      user.hire_date,
      user.position,
      user.hourly_wage,
      passwordHash,
      passwordTemp,
      isPasswordTemp ? 1 : 0,
      user.is_active ? 1 : 0
    ]);

    const result = db.exec('SELECT last_insert_rowid()');
    const userId = result[0].values[0][0] as number;

    // 데이터베이스 변경사항 저장
    persistDatabase();

    return this.getUserById(userId) as Promise<User>;
  }

  static async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
    const db = this.getDb();

    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values: (string | number | null)[] = fields.map(field => {
      const value = updates[field as keyof typeof updates];
      if (field === 'is_active') {
        return Boolean(value) ? 1 : 0;
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      return null;
    });

    const stmt = db.prepare(`
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([...values, id]);

    // 데이터베이스 변경사항 저장
    persistDatabase();

    return this.getUserById(id);
  }

  static async deleteUser(id: number): Promise<boolean> {
    const db = this.getDb();

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run([id]);

    // 데이터베이스 변경사항 저장
    persistDatabase();

    return true;
  }

  static async getUsersWithCurrentSchedule(): Promise<UserWithSchedule[]> {
    const db = this.getDb();

    const currentWeekStart = this.getCurrentWeekStart();

    const result = db.exec(`
      SELECT
        u.*,
        ws.monday_start, ws.monday_end,
        ws.tuesday_start, ws.tuesday_end,
        ws.wednesday_start, ws.wednesday_end,
        ws.thursday_start, ws.thursday_end,
        ws.friday_start, ws.friday_end,
        ws.saturday_start, ws.saturday_end,
        ws.sunday_start, ws.sunday_end
      FROM users u
      LEFT JOIN work_schedules ws ON u.id = ws.user_id AND ws.week_start_date = ?
      WHERE u.is_active = 1
      ORDER BY u.full_name
    `, [currentWeekStart]);

    if (result.length === 0) return [];

    const users = result[0].values.map(row => {
      const user: UserWithSchedule = {
        id: row[0] as number,
        username: row[1] as string,
        email: row[2] as string,
        full_name: row[3] as string,
        phone: row[4] as string,
        hire_date: row[5] as string,
        position: row[6] as string,
        hourly_wage: row[7] as number,
        is_active: Boolean(row[8]),
        created_at: row[9] as string,
        updated_at: row[10] as string,
      };

      if (row[11]) {
        user.current_schedule = {
          user_id: user.id!,
          week_start_date: currentWeekStart,
          monday_start: row[11] as string,
          monday_end: row[12] as string,
          tuesday_start: row[13] as string,
          tuesday_end: row[14] as string,
          wednesday_start: row[15] as string,
          wednesday_end: row[16] as string,
          thursday_start: row[17] as string,
          thursday_end: row[18] as string,
          friday_start: row[19] as string,
          friday_end: row[20] as string,
          saturday_start: row[21] as string,
          saturday_end: row[22] as string,
          sunday_start: row[23] as string,
          sunday_end: row[24] as string,
        };
      }

      return user;
    });

    for (const user of users) {
      const weeklyHours = await this.getUserWeeklyHours(user.id!, currentWeekStart);
      user.total_hours_this_week = weeklyHours.total_hours;
      user.total_pay_this_week = weeklyHours.total_pay;
    }

    return users;
  }

  private static getCurrentWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  private static async getUserWeeklyHours(userId: number, weekStart: string): Promise<{total_hours: number, total_pay: number}> {
    const db = this.getDb();

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const result = db.exec(`
      SELECT COALESCE(SUM(total_hours), 0) as total_hours, COALESCE(SUM(total_pay), 0) as total_pay
      FROM work_records
      WHERE user_id = ? AND work_date BETWEEN ? AND ?
    `, [userId, weekStart, weekEndStr]);

    if (result.length === 0) return { total_hours: 0, total_pay: 0 };

    const row = result[0].values[0];
    return {
      total_hours: row[0] as number,
      total_pay: row[1] as number
    };
  }

  // 로그인 관련 메서드들
  static async getUserByEmail(email: string): Promise<User | null> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `, [email]);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      username: row[1] as string,
      email: row[2] as string,
      full_name: row[3] as string,
      phone: row[4] as string,
      hire_date: row[5] as string,
      position: row[6] as string,
      hourly_wage: row[7] as number,
      password_hash: row[8] as string,
      password_temp: row[9] as string,
      is_password_temp: Boolean(row[10]),
      last_login: row[11] as string,
      is_active: Boolean(row[12]),
      created_at: row[13] as string,
      updated_at: row[14] as string,
    };
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

  static async updateLastLogin(userId: number): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run([userId]);

    // 데이터베이스 변경사항 저장
    persistDatabase();
  }

  static async resetPassword(userId: number): Promise<string> {
    const db = this.getDb();
    const tempPassword = PasswordUtils.generateTempPassword();
    const passwordHash = await PasswordUtils.hashPassword(tempPassword);

    const stmt = db.prepare(`
      UPDATE users SET
        password_hash = ?,
        password_temp = ?,
        is_password_temp = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([passwordHash, tempPassword, userId]);

    // 데이터베이스 변경사항 저장
    persistDatabase();

    return tempPassword;
  }

  static async changePassword(userId: number, newPassword: string): Promise<boolean> {
    const validation = PasswordUtils.validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const db = this.getDb();
    const passwordHash = await PasswordUtils.hashPassword(newPassword);

    const stmt = db.prepare(`
      UPDATE users SET
        password_hash = ?,
        password_temp = NULL,
        is_password_temp = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run([passwordHash, userId]);

    // 데이터베이스 변경사항 저장
    persistDatabase();

    return true;
  }

  static async toggleUserLoginAccess(userId: number, hasAccess: boolean): Promise<void> {
    const db = this.getDb();

    if (hasAccess) {
      // 로그인 권한 부여 - 임시 비밀번호 생성
      const tempPassword = PasswordUtils.generateTempPassword();
      const passwordHash = await PasswordUtils.hashPassword(tempPassword);

      const stmt = db.prepare(`
        UPDATE users SET
          password_hash = ?,
          password_temp = ?,
          is_password_temp = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run([passwordHash, tempPassword, userId]);
    } else {
      // 로그인 권한 제거
      const stmt = db.prepare(`
        UPDATE users SET
          password_hash = NULL,
          password_temp = NULL,
          is_password_temp = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run([userId]);
    }

    // 데이터베이스 변경사항 저장
    persistDatabase();
  }
}