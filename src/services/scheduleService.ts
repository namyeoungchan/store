import { supabase } from '../firebase/config';
import { WorkSchedule } from '../types';

export class ScheduleService {
  private static tableName = 'work_schedules';

  static async getScheduleByUserAndWeek(userId: string, weekStartDate: string): Promise<WorkSchedule | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error getting schedule by user and week:', error);
      return null;
    }
  }

  static async createOrUpdateSchedule(schedule: Omit<WorkSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<WorkSchedule> {
    try {
      const existing = await this.getScheduleByUserAndWeek(schedule.user_id, schedule.week_start_date);

      const scheduleData = {
        user_id: schedule.user_id,
        week_start_date: schedule.week_start_date,
        monday_start: schedule.monday_start || null,
        monday_end: schedule.monday_end || null,
        tuesday_start: schedule.tuesday_start || null,
        tuesday_end: schedule.tuesday_end || null,
        wednesday_start: schedule.wednesday_start || null,
        wednesday_end: schedule.wednesday_end || null,
        thursday_start: schedule.thursday_start || null,
        thursday_end: schedule.thursday_end || null,
        friday_start: schedule.friday_start || null,
        friday_end: schedule.friday_end || null,
        saturday_start: schedule.saturday_start || null,
        saturday_end: schedule.saturday_end || null,
        sunday_start: schedule.sunday_start || null,
        sunday_end: schedule.sunday_end || null
      };

      if (existing) {
        const { data, error } = await supabase
          .from(this.tableName)
          .update(scheduleData)
          .eq('id', existing.id!)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from(this.tableName)
          .insert(scheduleData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error creating or updating schedule:', error);
      throw error;
    }
  }

  static async getWeekSchedules(weekStartDate: string): Promise<(WorkSchedule & { user_name: string })[]> {
    try {
      const { data: schedules, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          users!inner(
            full_name,
            is_active
          )
        `)
        .eq('week_start_date', weekStartDate)
        .eq('users.is_active', true);

      if (error) throw error;

      const schedulesWithUsers = (schedules || []).map((schedule: any) => ({
        ...schedule,
        user_name: schedule.users.full_name
      }));

      return schedulesWithUsers.sort((a, b) => a.user_name.localeCompare(b.user_name));
    } catch (error) {
      console.error('Error getting week schedules:', error);
      return [];
    }
  }

  static async deleteSchedule(userId: string, weekStartDate: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return false;
    }
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