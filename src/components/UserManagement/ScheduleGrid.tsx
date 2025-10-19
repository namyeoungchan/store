import React, { useState } from 'react';
import { UserWithSchedule, WorkSchedule } from '../../types';

interface ScheduleGridProps {
  users: UserWithSchedule[];
  selectedWeek: string;
  getUserSchedule: (userId: string | number) => WorkSchedule | undefined;
  onScheduleSave: (userId: string | number, scheduleData: Partial<WorkSchedule>) => void;
  onScheduleDelete: (userId: string | number) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  users,
  selectedWeek,
  getUserSchedule,
  onScheduleSave,
  onScheduleDelete
}) => {
  const [editingUser, setEditingUser] = useState<string | number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Partial<WorkSchedule>>({});

  const weekDays = [
    { key: 'monday', label: '월' },
    { key: 'tuesday', label: '화' },
    { key: 'wednesday', label: '수' },
    { key: 'thursday', label: '목' },
    { key: 'friday', label: '금' },
    { key: 'saturday', label: '토' },
    { key: 'sunday', label: '일' }
  ];

  const startEditUser = (user: UserWithSchedule) => {
    const schedule = getUserSchedule(Number(user.id!));
    setEditingUser(Number(user.id!));
    setEditingSchedule({
      monday_start: schedule?.monday_start || '',
      monday_end: schedule?.monday_end || '',
      tuesday_start: schedule?.tuesday_start || '',
      tuesday_end: schedule?.tuesday_end || '',
      wednesday_start: schedule?.wednesday_start || '',
      wednesday_end: schedule?.wednesday_end || '',
      thursday_start: schedule?.thursday_start || '',
      thursday_end: schedule?.thursday_end || '',
      friday_start: schedule?.friday_start || '',
      friday_end: schedule?.friday_end || '',
      saturday_start: schedule?.saturday_start || '',
      saturday_end: schedule?.saturday_end || '',
      sunday_start: schedule?.sunday_start || '',
      sunday_end: schedule?.sunday_end || '',
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditingSchedule({});
  };

  const saveSchedule = () => {
    if (editingUser) {
      onScheduleSave(editingUser, editingSchedule);
      setEditingUser(null);
      setEditingSchedule({});
    }
  };

  const handleTimeChange = (field: string, value: string) => {
    setEditingSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '-';
    return time.slice(0, 5);
  };

  const hasSchedule = (schedule: WorkSchedule | undefined) => {
    if (!schedule) return false;

    return weekDays.some(day =>
      schedule[`${day.key}_start` as keyof WorkSchedule] ||
      schedule[`${day.key}_end` as keyof WorkSchedule]
    );
  };

  const calculateWeeklyHours = (schedule: WorkSchedule | undefined) => {
    if (!schedule) return 0;

    let totalMinutes = 0;

    weekDays.forEach(day => {
      const startTime = schedule[`${day.key}_start` as keyof WorkSchedule] as string;
      const endTime = schedule[`${day.key}_end` as keyof WorkSchedule] as string;

      if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        let diff = end.getTime() - start.getTime();

        if (diff < 0) {
          diff += 24 * 60 * 60 * 1000;
        }

        totalMinutes += diff / (1000 * 60);
      }
    });

    return Math.round(totalMinutes / 60 * 10) / 10;
  };

  return (
    <div className="schedule-grid">
      <div className="schedule-table">
        <div className="table-header">
          <div className="user-column-header">직원</div>
          {weekDays.map(day => (
            <div key={day.key} className="day-column-header">
              {day.label}
            </div>
          ))}
          <div className="actions-column-header">총 시간</div>
          <div className="actions-column-header">관리</div>
        </div>

        {users.map(user => {
          const schedule = getUserSchedule(Number(user.id!));
          const isEditing = editingUser === Number(user.id);
          const weeklyHours = calculateWeeklyHours(schedule);

          return (
            <div key={user.id} className="schedule-row">
              <div className="user-cell">
                <div className="user-info">
                  <div className="user-name">{user.full_name}</div>
                  <div className="user-position">{user.position}</div>
                </div>
              </div>

              {weekDays.map(day => (
                <div key={day.key} className="day-cell">
                  {isEditing ? (
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={editingSchedule[`${day.key}_start` as keyof typeof editingSchedule] || ''}
                        onChange={(e) => handleTimeChange(`${day.key}_start`, e.target.value)}
                        className="time-input"
                      />
                      <span className="time-separator">~</span>
                      <input
                        type="time"
                        value={editingSchedule[`${day.key}_end` as keyof typeof editingSchedule] || ''}
                        onChange={(e) => handleTimeChange(`${day.key}_end`, e.target.value)}
                        className="time-input"
                      />
                    </div>
                  ) : (
                    <div className="time-display">
                      {schedule?.[`${day.key}_start` as keyof WorkSchedule] && schedule?.[`${day.key}_end` as keyof WorkSchedule] ? (
                        <>
                          <span className="start-time">
                            {formatTime(schedule[`${day.key}_start` as keyof WorkSchedule] as string)}
                          </span>
                          <span className="time-separator">~</span>
                          <span className="end-time">
                            {formatTime(schedule[`${day.key}_end` as keyof WorkSchedule] as string)}
                          </span>
                        </>
                      ) : (
                        <span className="no-schedule">휴무</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="hours-cell">
                <span className="weekly-hours">{weeklyHours}시간</span>
              </div>

              <div className="actions-cell">
                {isEditing ? (
                  <div className="edit-actions">
                    <button onClick={saveSchedule} className="save-btn" title="저장">
                      ✅
                    </button>
                    <button onClick={cancelEdit} className="cancel-btn" title="취소">
                      ❌
                    </button>
                  </div>
                ) : (
                  <div className="view-actions">
                    <button
                      onClick={() => startEditUser(user)}
                      className="edit-btn"
                      title="편집"
                    >
                      ✏️
                    </button>
                    {hasSchedule(schedule) && (
                      <button
                        onClick={() => onScheduleDelete(Number(user.id!))}
                        className="delete-btn"
                        title="스케줄 삭제"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {users.length > 0 && (
        <div className="schedule-summary">
          <div className="summary-item">
            <span className="summary-label">총 직원:</span>
            <span className="summary-value">{users.length}명</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">스케줄 설정 완료:</span>
            <span className="summary-value">
              {users.filter(user => hasSchedule(getUserSchedule(Number(user.id!)))).length}명
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">전체 예상 근무시간:</span>
            <span className="summary-value">
              {users.reduce((total, user) => total + calculateWeeklyHours(getUserSchedule(Number(user.id!))), 0).toFixed(1)}시간
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGrid;