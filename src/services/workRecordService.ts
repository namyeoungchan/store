import { getDatabase } from '../database/database';
import { WorkRecord, WeeklyWorkSummary } from '../types';

export class WorkRecordService {
  private static getDb() {
    return getDatabase();
  }

  static async createWorkRecord(record: Omit<WorkRecord, 'id' | 'created_at'>): Promise<WorkRecord> {
    const db = this.getDb();

    const stmt = db.prepare(`
      INSERT INTO work_records (user_id, work_date, start_time, end_time, break_minutes, total_hours, total_pay, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      record.user_id,
      record.work_date,
      record.start_time,
      record.end_time,
      record.break_minutes,
      record.total_hours,
      record.total_pay,
      record.notes || null
    ]);

    const result = db.exec('SELECT last_insert_rowid()');
    const recordId = result[0].values[0][0] as number;

    return this.getWorkRecordById(recordId) as Promise<WorkRecord>;
  }

  static async getWorkRecordById(id: number): Promise<WorkRecord | null> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT * FROM work_records WHERE id = ?
    `, [id]);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      user_id: row[1] as number,
      work_date: row[2] as string,
      start_time: row[3] as string,
      end_time: row[4] as string,
      break_minutes: row[5] as number,
      total_hours: row[6] as number,
      total_pay: row[7] as number,
      notes: row[8] as string,
      created_at: row[9] as string,
    };
  }

  static async getWorkRecordsByUser(userId: number, startDate?: string, endDate?: string): Promise<WorkRecord[]> {
    const db = this.getDb();

    let query = 'SELECT * FROM work_records WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (startDate && endDate) {
      query += ' AND work_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY work_date DESC';

    const result = db.exec(query, params);

    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      user_id: row[1] as number,
      work_date: row[2] as string,
      start_time: row[3] as string,
      end_time: row[4] as string,
      break_minutes: row[5] as number,
      total_hours: row[6] as number,
      total_pay: row[7] as number,
      notes: row[8] as string,
      created_at: row[9] as string,
    }));
  }

  static async updateWorkRecord(id: number, updates: Partial<Omit<WorkRecord, 'id' | 'user_id' | 'created_at'>>): Promise<WorkRecord | null> {
    const db = this.getDb();

    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values: (string | number | null)[] = fields.map(field => {
      const value = updates[field as keyof typeof updates];
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      return null;
    });

    const stmt = db.prepare(`
      UPDATE work_records
      SET ${setClause}
      WHERE id = ?
    `);

    stmt.run([...values, id]);

    return this.getWorkRecordById(id);
  }

  static async deleteWorkRecord(id: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM work_records WHERE id = ?');
    stmt.run([id]);
    return true;
  }

  static async getWeeklyWorkSummary(weekStartDate: string): Promise<WeeklyWorkSummary[]> {
    const db = this.getDb();

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    const result = db.exec(`
      SELECT
        u.id as user_id,
        u.full_name as user_name,
        COALESCE(SUM(wr.total_hours), 0) as total_hours,
        COALESCE(SUM(wr.total_pay), 0) as total_pay,
        COUNT(CASE WHEN wr.id IS NOT NULL THEN 1 END) as work_days
      FROM users u
      LEFT JOIN work_records wr ON u.id = wr.user_id
        AND wr.work_date BETWEEN ? AND ?
      WHERE u.is_active = 1
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name
    `, [weekStartDate, weekEnd]);

    if (result.length === 0) return [];

    const summaries: WeeklyWorkSummary[] = [];

    for (const row of result[0].values) {
      const userId = row[0] as number;
      const records = await this.getWorkRecordsByUser(userId, weekStartDate, weekEnd);

      summaries.push({
        user_id: userId,
        user_name: row[1] as string,
        week_start_date: weekStartDate,
        total_hours: row[2] as number,
        total_pay: row[3] as number,
        work_days: row[4] as number,
        records: records
      });
    }

    return summaries;
  }

  static async getWorkRecordByUserAndDate(userId: number, workDate: string): Promise<WorkRecord | null> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT * FROM work_records WHERE user_id = ? AND work_date = ?
    `, [userId, workDate]);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      user_id: row[1] as number,
      work_date: row[2] as string,
      start_time: row[3] as string,
      end_time: row[4] as string,
      break_minutes: row[5] as number,
      total_hours: row[6] as number,
      total_pay: row[7] as number,
      notes: row[8] as string,
      created_at: row[9] as string,
    };
  }

  static calculateWorkHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const totalMinutes = diffMs / (1000 * 60);
    const workMinutes = totalMinutes - breakMinutes;

    return Math.max(0, workMinutes / 60);
  }

  static calculatePay(hours: number, hourlyWage: number): number {
    return Math.round(hours * hourlyWage);
  }
}