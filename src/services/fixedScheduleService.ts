import { db } from '../firebase/config';
import { FixedSchedule, FixedScheduleWithUser } from '../types';

export class FixedScheduleService {
  static async createFixedSchedule(scheduleData: Omit<FixedSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<FixedSchedule> {
    const insertData = {
      ...scheduleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await db
      .from('fixed_schedules')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFixedSchedulesByUser(userId: string): Promise<FixedSchedule[]> {
    const { data, error } = await db
      .from('fixed_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('effective_from', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAllFixedSchedules(): Promise<FixedScheduleWithUser[]> {
    return this.getAllFixedSchedulesWithUsers();
  }

  static async getAllFixedSchedulesWithUsers(): Promise<FixedScheduleWithUser[]> {
    const { data, error } = await db
      .from('fixed_schedules')
      .select(`
        *,
        users:user_id (
          full_name,
          position
        )
      `)
      .order('effective_from', { ascending: false });

    if (error) throw error;

    return (data || []).map(schedule => ({
      ...schedule,
      user_name: schedule.users?.full_name || '',
      user_position: schedule.users?.position || ''
    }));
  }

  static async getActiveFixedScheduleByUser(userId: string): Promise<FixedSchedule | null> {
    const { data, error } = await db
      .from('fixed_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('effective_from', new Date().toISOString())
      .or(`effective_until.is.null,effective_until.gte.${new Date().toISOString()}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateFixedSchedule(id: string, updateData: Partial<FixedSchedule>): Promise<void> {
    const { error } = await db
      .from('fixed_schedules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteFixedSchedule(id: string): Promise<void> {
    const { error } = await db
      .from('fixed_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async deactivateFixedSchedule(id: string, effectiveUntil: string): Promise<void> {
    // Get the original schedule
    const { data: originalSchedule, error: fetchError } = await db
      .from('fixed_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!originalSchedule) throw new Error('Fixed schedule not found');

    // Update the current schedule to set effective_until
    const { error: updateError } = await db
      .from('fixed_schedules')
      .update({
        effective_until: effectiveUntil,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Create a new inactive schedule starting from the effective_until date
    const nextDay = new Date(effectiveUntil);
    nextDay.setDate(nextDay.getDate() + 1);

    const newScheduleData = {
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
      effective_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await db
      .from('fixed_schedules')
      .insert(newScheduleData);

    if (insertError) throw insertError;
  }

  static async applyFixedScheduleToWeek(fixedScheduleId: string, weekStartDate: string): Promise<void> {
    // Get the fixed schedule
    const { data: fixedSchedule, error: fetchError } = await db
      .from('fixed_schedules')
      .select('*')
      .eq('id', fixedScheduleId)
      .single();

    if (fetchError) throw fetchError;
    if (!fixedSchedule) throw new Error('Fixed schedule not found');

    // Delete existing schedule for this week
    const { error: deleteError } = await db
      .from('work_schedules')
      .delete()
      .eq('user_id', fixedSchedule.user_id)
      .eq('week_start_date', weekStartDate);

    if (deleteError) throw deleteError;

    // Insert new schedule based on fixed schedule
    const newScheduleData = {
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
      sunday_end: fixedSchedule.sunday_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await db
      .from('work_schedules')
      .insert(newScheduleData);

    if (insertError) throw insertError;
  }

  static async getFixedScheduleById(id: string): Promise<FixedSchedule | null> {
    const { data, error } = await db
      .from('fixed_schedules')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async activateFixedSchedule(id: string): Promise<void> {
    const { error } = await db
      .from('fixed_schedules')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async cloneFixedSchedule(id: string, newData: Partial<FixedSchedule>): Promise<FixedSchedule> {
    // Get the original schedule
    const original = await this.getFixedScheduleById(id);
    if (!original) throw new Error('Original schedule not found');

    // Create new schedule with data from original and override with newData
    const cloneData = {
      ...original,
      ...newData,
      id: undefined, // Remove ID so it creates a new one
      created_at: undefined,
      updated_at: undefined
    };

    return this.createFixedSchedule(cloneData);
  }
}