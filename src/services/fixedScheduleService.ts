import { FirestoreService } from '../database/database';
import { FixedSchedule, FixedScheduleWithUser } from '../types';

export class FixedScheduleService {
  private static collectionName = FirestoreService.collections.fixedSchedules;

  static async createFixedSchedule(scheduleData: Omit<FixedSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<FixedSchedule> {
    const id = await FirestoreService.create(this.collectionName, scheduleData);
    const created = await FirestoreService.getById(this.collectionName, id);
    return created as FixedSchedule;
  }

  static async getFixedSchedulesByUser(userId: string): Promise<FixedSchedule[]> {
    const data = await FirestoreService.getWhere(this.collectionName, 'user_id', '==', userId);
    return data.sort((a, b) => (b.effective_from || '').localeCompare(a.effective_from || '')) as FixedSchedule[];
  }

  static async getAllFixedSchedules(): Promise<FixedScheduleWithUser[]> {
    return this.getAllFixedSchedulesWithUsers();
  }

  static async getAllFixedSchedulesWithUsers(): Promise<FixedScheduleWithUser[]> {
    const schedules = await FirestoreService.getOrderedBy(this.collectionName, 'effective_from', 'desc');

    const schedulesWithUsers: FixedScheduleWithUser[] = [];

    for (const schedule of schedules) {
      const user = await FirestoreService.getById(FirestoreService.collections.users, schedule.user_id);
      schedulesWithUsers.push({
        ...schedule,
        user_name: user?.full_name || '',
        user_position: user?.position || ''
      });
    }

    return schedulesWithUsers;
  }

  static async getActiveFixedScheduleByUser(userId: string): Promise<FixedSchedule | null> {
    const now = new Date().toISOString();
    const schedules = await FirestoreService.getWhere(this.collectionName, 'user_id', '==', userId);

    const activeSchedules = schedules
      .filter(s =>
        s.is_active === true &&
        s.effective_from <= now &&
        (s.effective_until === null || s.effective_until === undefined || s.effective_until >= now)
      )
      .sort((a, b) => (b.effective_from || '').localeCompare(a.effective_from || ''));

    return activeSchedules.length > 0 ? activeSchedules[0] as FixedSchedule : null;
  }

  static async updateFixedSchedule(id: string, updateData: Partial<FixedSchedule>): Promise<void> {
    await FirestoreService.update(this.collectionName, id, updateData);
  }

  static async deleteFixedSchedule(id: string): Promise<void> {
    await FirestoreService.delete(this.collectionName, id);
  }

  static async deactivateFixedSchedule(id: string, effectiveUntil: string): Promise<void> {
    const originalSchedule = await FirestoreService.getById(this.collectionName, id);
    if (!originalSchedule) throw new Error('Fixed schedule not found');

    // 현재 스케줄에 effective_until 설정
    await FirestoreService.update(this.collectionName, id, {
      effective_until: effectiveUntil
    });

    // 비활성 스케줄 생성
    const nextDay = new Date(effectiveUntil);
    nextDay.setDate(nextDay.getDate() + 1);

    await FirestoreService.create(this.collectionName, {
      user_id: originalSchedule.user_id,
      name: `${originalSchedule.name} (비활성화됨)`,
      description: originalSchedule.description,
      monday_start: null,
      monday_end: null,
      tuesday_start: null,
      tuesday_end: null,
      wednesday_start: null,
      wednesday_end: null,
      thursday_start: null,
      thursday_end: null,
      friday_start: null,
      friday_end: null,
      saturday_start: null,
      saturday_end: null,
      sunday_start: null,
      sunday_end: null,
      is_active: false,
      effective_from: nextDay.toISOString().split('T')[0],
      effective_until: null
    });
  }

  static async applyFixedScheduleToWeek(fixedScheduleId: string, weekStartDate: string): Promise<void> {
    const fixedSchedule = await FirestoreService.getById(this.collectionName, fixedScheduleId);
    if (!fixedSchedule) throw new Error('Fixed schedule not found');

    // 해당 주의 기존 스케줄 삭제
    const existingSchedules = await FirestoreService.getWithMultipleWhere(
      FirestoreService.collections.workSchedules,
      [
        { field: 'user_id', operator: '==', value: fixedSchedule.user_id },
        { field: 'week_start_date', operator: '==', value: weekStartDate }
      ]
    );

    for (const existing of existingSchedules) {
      await FirestoreService.delete(FirestoreService.collections.workSchedules, existing.id);
    }

    // 고정 스케줄 기반으로 새 스케줄 생성
    await FirestoreService.create(FirestoreService.collections.workSchedules, {
      user_id: fixedSchedule.user_id,
      week_start_date: weekStartDate,
      monday_start: fixedSchedule.monday_start,
      monday_end: fixedSchedule.monday_end,
      tuesday_start: fixedSchedule.tuesday_start,
      tuesday_end: fixedSchedule.tuesday_end,
      wednesday_start: fixedSchedule.wednesday_start,
      wednesday_end: fixedSchedule.wednesday_end,
      thursday_start: fixedSchedule.thursday_start,
      thursday_end: fixedSchedule.thursday_end,
      friday_start: fixedSchedule.friday_start,
      friday_end: fixedSchedule.friday_end,
      saturday_start: fixedSchedule.saturday_start,
      saturday_end: fixedSchedule.saturday_end,
      sunday_start: fixedSchedule.sunday_start,
      sunday_end: fixedSchedule.sunday_end
    });
  }

  static async getFixedScheduleById(id: string): Promise<FixedSchedule | null> {
    const data = await FirestoreService.getById(this.collectionName, id);
    return data as FixedSchedule | null;
  }

  static async activateFixedSchedule(id: string): Promise<void> {
    await FirestoreService.update(this.collectionName, id, {
      is_active: true
    });
  }

  static async cloneFixedSchedule(id: string, newData: Partial<FixedSchedule>): Promise<FixedSchedule> {
    const original = await this.getFixedScheduleById(id);
    if (!original) throw new Error('Original schedule not found');

    const cloneData = {
      ...original,
      ...newData,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };

    return this.createFixedSchedule(cloneData as any);
  }
}
