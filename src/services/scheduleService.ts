import { FirestoreService } from '../database/database';
import { WorkSchedule } from '../types';

export class ScheduleService {
  private static collectionName = FirestoreService.collections.workSchedules;

  static async getScheduleByUserAndWeek(userId: string, weekStartDate: string): Promise<WorkSchedule | null> {
    try {
      const schedules = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'week_start_date', operator: '==', value: weekStartDate }
      ]);

      if (schedules.length === 0) return null;
      return schedules[0] as WorkSchedule;
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
        await FirestoreService.update(this.collectionName, existing.id!, scheduleData);
        const updated = await FirestoreService.getById(this.collectionName, existing.id!);
        return updated as WorkSchedule;
      } else {
        const id = await FirestoreService.create(this.collectionName, scheduleData);
        const created = await FirestoreService.getById(this.collectionName, id);
        return created as WorkSchedule;
      }
    } catch (error) {
      console.error('Error creating or updating schedule:', error);
      throw error;
    }
  }

  static async getWeekSchedules(weekStartDate: string): Promise<(WorkSchedule & { user_name: string })[]> {
    try {
      const schedules = await FirestoreService.getWhere(this.collectionName, 'week_start_date', '==', weekStartDate);

      const schedulesWithUsers: (WorkSchedule & { user_name: string })[] = [];

      for (const schedule of schedules) {
        const user = await FirestoreService.getById(FirestoreService.collections.users, schedule.user_id);
        if (user && user.is_active) {
          schedulesWithUsers.push({
            ...schedule,
            user_name: user.full_name
          });
        }
      }

      return schedulesWithUsers.sort((a, b) => a.user_name.localeCompare(b.user_name));
    } catch (error) {
      console.error('Error getting week schedules:', error);
      return [];
    }
  }

  static async deleteSchedule(userId: string, weekStartDate: string): Promise<boolean> {
    try {
      const schedules = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'week_start_date', operator: '==', value: weekStartDate }
      ]);

      for (const schedule of schedules) {
        await FirestoreService.delete(this.collectionName, schedule.id);
      }
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
