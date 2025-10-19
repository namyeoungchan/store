import { db } from '../firebase/config';
import { WorkRecord, WeeklyWorkSummary } from '../types';

export class WorkRecordService {
  static async createWorkRecord(record: Omit<WorkRecord, 'id' | 'created_at'>): Promise<WorkRecord> {
    const insertData = {
      ...record,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db
      .from('work_records')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWorkRecordById(id: string): Promise<WorkRecord | null> {
    const { data, error } = await db
      .from('work_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getWorkRecords(options?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WorkRecord[]> {
    let query = db
      .from('work_records')
      .select('*')
      .order('work_date', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.startDate) {
      query = query.gte('work_date', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('work_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async updateWorkRecord(id: string, updates: Partial<WorkRecord>): Promise<void> {
    const { error } = await db
      .from('work_records')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteWorkRecord(id: string): Promise<void> {
    const { error } = await db
      .from('work_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getWeeklyWorkSummary(weekStartDate: string): Promise<WeeklyWorkSummary[]> {
    // Calculate week end date
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Get all work records for the week with user information
    const { data: records, error: recordsError } = await db
      .from('work_records')
      .select(`
        *,
        users:user_id (
          full_name
        )
      `)
      .gte('work_date', weekStartDate)
      .lte('work_date', endDate.toISOString().split('T')[0])
      .order('work_date', { ascending: true });

    if (recordsError) throw recordsError;

    // Get all users
    const { data: users, error: usersError } = await db
      .from('users')
      .select('id, full_name')
      .eq('is_active', true);

    if (usersError) throw usersError;

    // Group records by user
    const userRecordsMap = new Map<string, any[]>();

    (records || []).forEach(record => {
      const userId = record.user_id;
      if (!userRecordsMap.has(userId)) {
        userRecordsMap.set(userId, []);
      }
      userRecordsMap.get(userId)!.push(record);
    });

    // Create summaries for each user
    const summaries: WeeklyWorkSummary[] = (users || []).map(user => {
      const userRecords = userRecordsMap.get(user.id) || [];

      const total_hours = userRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);
      const total_pay = userRecords.reduce((sum, r) => sum + (r.total_pay || 0), 0);
      const work_days = userRecords.length;

      return {
        user_id: user.id,
        user_name: user.full_name,
        week_start_date: weekStartDate,
        total_hours,
        total_pay,
        work_days,
        records: userRecords.map(r => ({
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

    const { data, error } = await db
      .from('work_records')
      .select('*')
      .eq('user_id', userId)
      .gte('work_date', weekStartDate)
      .lte('work_date', endDate.toISOString().split('T')[0])
      .order('work_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getUserTotalHoursForPeriod(userId: string, startDate: string, endDate: string): Promise<number> {
    const { data, error } = await db
      .from('work_records')
      .select('total_hours')
      .eq('user_id', userId)
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (error) throw error;

    return (data || []).reduce((sum, record) => sum + (record.total_hours || 0), 0);
  }

  static async getUserTotalPayForPeriod(userId: string, startDate: string, endDate: string): Promise<number> {
    const { data, error } = await db
      .from('work_records')
      .select('total_pay')
      .eq('user_id', userId)
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (error) throw error;

    return (data || []).reduce((sum, record) => sum + (record.total_pay || 0), 0);
  }
}