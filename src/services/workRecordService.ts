import { FirestoreService } from '../database/database';
import { WorkRecord, WeeklyWorkSummary } from '../types';

export class WorkRecordService {
  private static collectionName = FirestoreService.collections.workRecords;

  static async createWorkRecord(record: Omit<WorkRecord, 'id' | 'created_at'>): Promise<WorkRecord> {
    const id = await FirestoreService.create(this.collectionName, record);
    const created = await FirestoreService.getById(this.collectionName, id);
    return created as WorkRecord;
  }

  static async getWorkRecordById(id: string): Promise<WorkRecord | null> {
    const data = await FirestoreService.getById(this.collectionName, id);
    return data as WorkRecord | null;
  }

  static async getWorkRecords(options?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WorkRecord[]> {
    let records = await FirestoreService.getOrderedBy(this.collectionName, 'work_date', 'desc');

    if (options?.userId) {
      records = records.filter(r => r.user_id === options.userId);
    }
    if (options?.startDate) {
      records = records.filter(r => r.work_date >= options.startDate!);
    }
    if (options?.endDate) {
      records = records.filter(r => r.work_date <= options.endDate!);
    }

    return records as WorkRecord[];
  }

  static async updateWorkRecord(id: string, updates: Partial<WorkRecord>): Promise<void> {
    await FirestoreService.update(this.collectionName, id, updates);
  }

  static async deleteWorkRecord(id: string): Promise<void> {
    await FirestoreService.delete(this.collectionName, id);
  }

  static async getWeeklyWorkSummary(weekStartDate: string): Promise<WeeklyWorkSummary[]> {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split('T')[0];

    // 해당 주의 모든 근무 기록 조회
    const records = await this.getWorkRecords({
      startDate: weekStartDate,
      endDate: endDateStr
    });

    // 모든 활성 사용자 조회
    const users = await FirestoreService.getWhere(
      FirestoreService.collections.users,
      'is_active',
      '==',
      true
    );

    // 사용자별 기록 그룹화
    const userRecordsMap = new Map<string, any[]>();
    records.forEach(record => {
      const userId = record.user_id;
      if (!userRecordsMap.has(userId)) {
        userRecordsMap.set(userId, []);
      }
      userRecordsMap.get(userId)!.push(record);
    });

    // 각 사용자별 요약 생성
    const summaries: WeeklyWorkSummary[] = users.map(user => {
      const userRecords = userRecordsMap.get(user.id) || [];

      const total_hours = userRecords.reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0);
      const total_pay = userRecords.reduce((sum: number, r: any) => sum + (r.total_pay || 0), 0);
      const work_days = userRecords.length;

      return {
        user_id: user.id,
        user_name: user.full_name,
        week_start_date: weekStartDate,
        total_hours,
        total_pay,
        work_days,
        records: userRecords.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          work_date: r.work_date,
          start_time: r.start_time,
          end_time: r.end_time,
          break_minutes: r.break_minutes,
          total_hours: r.total_hours,
          total_pay: r.total_pay,
          notes: r.notes,
          created_at: r.created_at
        }))
      };
    });

    return summaries;
  }

  static async getUserWorkRecordsForWeek(userId: string, weekStartDate: string): Promise<WorkRecord[]> {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return this.getWorkRecords({
      userId,
      startDate: weekStartDate,
      endDate: endDate.toISOString().split('T')[0]
    });
  }

  static async getUserTotalHoursForPeriod(userId: string, startDate: string, endDate: string): Promise<number> {
    const records = await this.getWorkRecords({ userId, startDate, endDate });
    return records.reduce((sum, record) => sum + (record.total_hours || 0), 0);
  }

  static async getUserTotalPayForPeriod(userId: string, startDate: string, endDate: string): Promise<number> {
    const records = await this.getWorkRecords({ userId, startDate, endDate });
    return records.reduce((sum, record) => sum + (record.total_pay || 0), 0);
  }
}
