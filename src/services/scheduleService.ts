import { getDatabase, persistDatabase } from '../database/database';
import { WorkSchedule } from '../types';

export class ScheduleService {
  private static getDb() {
    return getDatabase();
  }

  static async getScheduleByUserAndWeek(userId: number, weekStartDate: string): Promise<WorkSchedule | null> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT * FROM work_schedules
      WHERE user_id = ? AND week_start_date = ?
    `, [userId, weekStartDate]);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      user_id: row[1] as number,
      week_start_date: row[2] as string,
      monday_start: row[3] as string,
      monday_end: row[4] as string,
      tuesday_start: row[5] as string,
      tuesday_end: row[6] as string,
      wednesday_start: row[7] as string,
      wednesday_end: row[8] as string,
      thursday_start: row[9] as string,
      thursday_end: row[10] as string,
      friday_start: row[11] as string,
      friday_end: row[12] as string,
      saturday_start: row[13] as string,
      saturday_end: row[14] as string,
      sunday_start: row[15] as string,
      sunday_end: row[16] as string,
      created_at: row[17] as string,
      updated_at: row[18] as string,
    };
  }

  static async createOrUpdateSchedule(schedule: Omit<WorkSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<WorkSchedule> {
    const db = this.getDb();

    const existing = await this.getScheduleByUserAndWeek(schedule.user_id, schedule.week_start_date);

    if (existing) {
      const stmt = db.prepare(`
        UPDATE work_schedules SET
          monday_start = ?, monday_end = ?,
          tuesday_start = ?, tuesday_end = ?,
          wednesday_start = ?, wednesday_end = ?,
          thursday_start = ?, thursday_end = ?,
          friday_start = ?, friday_end = ?,
          saturday_start = ?, saturday_end = ?,
          sunday_start = ?, sunday_end = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND week_start_date = ?
      `);

      stmt.run([
        schedule.monday_start || null, schedule.monday_end || null,
        schedule.tuesday_start || null, schedule.tuesday_end || null,
        schedule.wednesday_start || null, schedule.wednesday_end || null,
        schedule.thursday_start || null, schedule.thursday_end || null,
        schedule.friday_start || null, schedule.friday_end || null,
        schedule.saturday_start || null, schedule.saturday_end || null,
        schedule.sunday_start || null, schedule.sunday_end || null,
        schedule.user_id, schedule.week_start_date
      ]);

      // 데이터베이스 변경사항 저장
      persistDatabase();

      return this.getScheduleByUserAndWeek(schedule.user_id, schedule.week_start_date) as Promise<WorkSchedule>;
    } else {
      const stmt = db.prepare(`
        INSERT INTO work_schedules (
          user_id, week_start_date,
          monday_start, monday_end,
          tuesday_start, tuesday_end,
          wednesday_start, wednesday_end,
          thursday_start, thursday_end,
          friday_start, friday_end,
          saturday_start, saturday_end,
          sunday_start, sunday_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        schedule.user_id, schedule.week_start_date,
        schedule.monday_start || null, schedule.monday_end || null,
        schedule.tuesday_start || null, schedule.tuesday_end || null,
        schedule.wednesday_start || null, schedule.wednesday_end || null,
        schedule.thursday_start || null, schedule.thursday_end || null,
        schedule.friday_start || null, schedule.friday_end || null,
        schedule.saturday_start || null, schedule.saturday_end || null,
        schedule.sunday_start || null, schedule.sunday_end || null
      ]);

      // 데이터베이스 변경사항 저장
      persistDatabase();

      return this.getScheduleByUserAndWeek(schedule.user_id, schedule.week_start_date) as Promise<WorkSchedule>;
    }
  }

  static async getWeekSchedules(weekStartDate: string): Promise<(WorkSchedule & { user_name: string })[]> {
    const db = this.getDb();
    const result = db.exec(`
      SELECT ws.*, u.full_name as user_name
      FROM work_schedules ws
      JOIN users u ON ws.user_id = u.id
      WHERE ws.week_start_date = ? AND u.is_active = 1
      ORDER BY u.full_name
    `, [weekStartDate]);

    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      user_id: row[1] as number,
      week_start_date: row[2] as string,
      monday_start: row[3] as string,
      monday_end: row[4] as string,
      tuesday_start: row[5] as string,
      tuesday_end: row[6] as string,
      wednesday_start: row[7] as string,
      wednesday_end: row[8] as string,
      thursday_start: row[9] as string,
      thursday_end: row[10] as string,
      friday_start: row[11] as string,
      friday_end: row[12] as string,
      saturday_start: row[13] as string,
      saturday_end: row[14] as string,
      sunday_start: row[15] as string,
      sunday_end: row[16] as string,
      created_at: row[17] as string,
      updated_at: row[18] as string,
      user_name: row[19] as string,
    }));
  }

  static async deleteSchedule(userId: number, weekStartDate: string): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM work_schedules WHERE user_id = ? AND week_start_date = ?');
    stmt.run([userId, weekStartDate]);

    // 데이터베이스 변경사항 저장
    persistDatabase();

    return true;
  }

  static getWeekDates(weekStartDate: string): string[] {
    const startDate = new Date(weekStartDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  static getCurrentWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  static getWeekStartByDate(date: string): string {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(targetDate.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}