import React, { useState, useEffect } from 'react';
import { UserWithSchedule, WorkSchedule } from '../../types';
import { ScheduleService } from '../../services/scheduleService';
import WeekSelector from './WeekSelector';
import ScheduleGrid from './ScheduleGrid';

interface ScheduleManagementProps {
  users: UserWithSchedule[];
  onScheduleUpdate: () => void;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  users,
  onScheduleUpdate
}) => {
  const [selectedWeek, setSelectedWeek] = useState<string>(ScheduleService.getCurrentWeekStart());
  const [weekSchedules, setWeekSchedules] = useState<(WorkSchedule & { user_name: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeekSchedules();
  }, [selectedWeek]);

  const loadWeekSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const schedules = await ScheduleService.getWeekSchedules(selectedWeek);
      setWeekSchedules(schedules);
    } catch (err) {
      setError('스케줄을 불러오는데 실패했습니다.');
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSave = async (userId: number, scheduleData: Partial<WorkSchedule>) => {
    try {
      await ScheduleService.createOrUpdateSchedule({
        user_id: userId,
        week_start_date: selectedWeek,
        ...scheduleData
      });
      await loadWeekSchedules();
      onScheduleUpdate();
    } catch (err) {
      setError('스케줄 저장에 실패했습니다.');
      console.error('Error saving schedule:', err);
    }
  };

  const handleScheduleDelete = async (userId: number) => {
    try {
      await ScheduleService.deleteSchedule(userId, selectedWeek);
      await loadWeekSchedules();
      onScheduleUpdate();
    } catch (err) {
      setError('스케줄 삭제에 실패했습니다.');
      console.error('Error deleting schedule:', err);
    }
  };

  const getUserSchedule = (userId: number): WorkSchedule | undefined => {
    return weekSchedules.find(schedule => schedule.user_id === userId);
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`;
  };

  return (
    <div className="schedule-management">
      <div className="schedule-header">
        <div className="schedule-title">
          <h2>📅 주간 스케줄 관리</h2>
          <p className="schedule-subtitle">
            직원들의 주간 근무 스케줄을 설정하고 관리합니다
          </p>
        </div>

        <WeekSelector
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="schedule-info">
        <div className="week-info">
          <span className="week-label">선택된 주:</span>
          <span className="week-range">{formatWeekRange(selectedWeek)}</span>
        </div>
        <div className="user-count">
          활성 직원: {users.length}명
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>스케줄을 불러오는 중...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>활성 직원이 없습니다</h3>
          <p>먼저 직원을 등록해주세요.</p>
        </div>
      ) : (
        <ScheduleGrid
          users={users}
          selectedWeek={selectedWeek}
          getUserSchedule={getUserSchedule}
          onScheduleSave={handleScheduleSave}
          onScheduleDelete={handleScheduleDelete}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;