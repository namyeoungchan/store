import React, { useState, useEffect } from 'react';
import { User, FixedSchedule, FixedScheduleWithUser } from '../../types';
import { FixedScheduleService } from '../../services/fixedScheduleService';

interface FixedScheduleManagementProps {
  users: User[];
}

interface FixedScheduleFormData {
  user_id: string;
  name: string;
  description: string;
  monday_start: string;
  monday_end: string;
  tuesday_start: string;
  tuesday_end: string;
  wednesday_start: string;
  wednesday_end: string;
  thursday_start: string;
  thursday_end: string;
  friday_start: string;
  friday_end: string;
  saturday_start: string;
  saturday_end: string;
  sunday_start: string;
  sunday_end: string;
  effective_from: string;
  effective_until: string;
}

const DAYS = [
  { key: 'monday', label: '월요일' },
  { key: 'tuesday', label: '화요일' },
  { key: 'wednesday', label: '수요일' },
  { key: 'thursday', label: '목요일' },
  { key: 'friday', label: '금요일' },
  { key: 'saturday', label: '토요일' },
  { key: 'sunday', label: '일요일' }
];

const FixedScheduleManagement: React.FC<FixedScheduleManagementProps> = ({ users }) => {
  const [fixedSchedules, setFixedSchedules] = useState<FixedScheduleWithUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FixedSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FixedScheduleFormData>({
    user_id: '',
    name: '',
    description: '',
    monday_start: '',
    monday_end: '',
    tuesday_start: '',
    tuesday_end: '',
    wednesday_start: '',
    wednesday_end: '',
    thursday_start: '',
    thursday_end: '',
    friday_start: '',
    friday_end: '',
    saturday_start: '',
    saturday_end: '',
    sunday_start: '',
    sunday_end: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_until: ''
  });

  useEffect(() => {
    loadFixedSchedules();
  }, []);

  const loadFixedSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const schedules = await FixedScheduleService.getAllFixedSchedules();
      setFixedSchedules(schedules);
    } catch (err) {
      setError('고정 스케줄을 불러오는데 실패했습니다.');
      console.error('Error loading fixed schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingSchedule(null);
    setFormData({
      user_id: selectedUser || (users.length > 0 ? users[0].id! : ''),
      name: '',
      description: '',
      monday_start: '',
      monday_end: '',
      tuesday_start: '',
      tuesday_end: '',
      wednesday_start: '',
      wednesday_end: '',
      thursday_start: '',
      thursday_end: '',
      friday_start: '',
      friday_end: '',
      saturday_start: '',
      saturday_end: '',
      sunday_start: '',
      sunday_end: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_until: ''
    });
    setShowForm(true);
  };

  const handleEdit = (schedule: FixedSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      user_id: schedule.user_id,
      name: schedule.name,
      description: schedule.description || '',
      monday_start: schedule.monday_start || '',
      monday_end: schedule.monday_end || '',
      tuesday_start: schedule.tuesday_start || '',
      tuesday_end: schedule.tuesday_end || '',
      wednesday_start: schedule.wednesday_start || '',
      wednesday_end: schedule.wednesday_end || '',
      thursday_start: schedule.thursday_start || '',
      thursday_end: schedule.thursday_end || '',
      friday_start: schedule.friday_start || '',
      friday_end: schedule.friday_end || '',
      saturday_start: schedule.saturday_start || '',
      saturday_end: schedule.saturday_end || '',
      sunday_start: schedule.sunday_start || '',
      sunday_end: schedule.sunday_end || '',
      effective_from: schedule.effective_from,
      effective_until: schedule.effective_until || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSchedule) {
        await FixedScheduleService.updateFixedSchedule(editingSchedule.id!, {
          ...formData,
          user_id: String(formData.user_id),
          is_active: true
        });
      } else {
        await FixedScheduleService.createFixedSchedule({
          ...formData,
          user_id: String(formData.user_id),
          is_active: true
        });
      }

      await loadFixedSchedules();
      setShowForm(false);
      setEditingSchedule(null);
    } catch (err) {
      setError('고정 스케줄 저장에 실패했습니다.');
      console.error('Error saving fixed schedule:', err);
    }
  };

  const handleToggleActive = async (schedule: FixedSchedule) => {
    try {
      if (schedule.is_active) {
        await FixedScheduleService.deactivateFixedSchedule(schedule.id!, new Date().toISOString().split('T')[0]);
      } else {
        await FixedScheduleService.activateFixedSchedule(schedule.id!);
      }
      await loadFixedSchedules();
    } catch (err) {
      setError('스케줄 상태 변경에 실패했습니다.');
      console.error('Error toggling schedule status:', err);
    }
  };

  const handleDelete = async (schedule: FixedSchedule) => {
    if (window.confirm(`"${schedule.name}" 고정 스케줄을 삭제하시겠습니까?`)) {
      try {
        await FixedScheduleService.deleteFixedSchedule(schedule.id!);
        await loadFixedSchedules();
      } catch (err) {
        setError('고정 스케줄 삭제에 실패했습니다.');
        console.error('Error deleting fixed schedule:', err);
      }
    }
  };

  const handleClone = async (schedule: FixedSchedule) => {
    const newName = prompt('새로운 스케줄 이름을 입력하세요:', `${schedule.name} (복사본)`);
    if (newName) {
      try {
        await FixedScheduleService.cloneFixedSchedule(
          schedule.id!,
          { name: newName, effective_from: new Date().toISOString().split('T')[0] }
        );
        await loadFixedSchedules();
      } catch (err) {
        setError('고정 스케줄 복사에 실패했습니다.');
        console.error('Error cloning fixed schedule:', err);
      }
    }
  };

  const handleApplyToWeek = async (schedule: FixedSchedule) => {
    const weekStart = prompt('적용할 주의 시작일을 입력하세요 (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (weekStart) {
      try {
        await FixedScheduleService.applyFixedScheduleToWeek(schedule.id!, weekStart);
        alert('고정 스케줄이 해당 주에 적용되었습니다.');
      } catch (err) {
        setError('스케줄 적용에 실패했습니다.');
        console.error('Error applying schedule to week:', err);
      }
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time.substring(0, 5); // HH:MM 형식으로 표시
  };

  const filteredSchedules = selectedUser
    ? fixedSchedules.filter(schedule => schedule.user_id === selectedUser)
    : fixedSchedules;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>고정 스케줄을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="fixed-schedule-management">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-left">
          <h2 className="schedule-title">고정 스케줄 관리</h2>
          <p className="schedule-subtitle">직원별 고정 근무 스케줄을 관리하고 주간 스케줄에 적용할 수 있습니다</p>
        </div>
        <button onClick={handleCreateNew} className="modern-primary-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          새 고정 스케줄
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* User Filter */}
      <div className="user-filter">
        <label htmlFor="user-select">직원 필터:</label>
        <select
          id="user-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value === '0' ? '' : e.target.value)}
          className="modern-select"
        >
          <option value="">전체 직원</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.position})
            </option>
          ))}
        </select>
      </div>

      {/* Fixed Schedules List */}
      <div className="schedules-grid">
        {filteredSchedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>등록된 고정 스케줄이 없습니다</h3>
            <p>첫 번째 고정 스케줄을 생성해보세요.</p>
            <button onClick={handleCreateNew} className="modern-primary-button">
              고정 스케줄 만들기
            </button>
          </div>
        ) : (
          filteredSchedules.map(schedule => (
            <div key={schedule.id} className={`schedule-card ${!schedule.is_active ? 'inactive' : ''}`}>
              <div className="card-header">
                <div className="schedule-info">
                  <h3 className="schedule-name">{schedule.name}</h3>
                  <p className="schedule-user">{schedule.user_name} ({schedule.user_position})</p>
                  {schedule.description && (
                    <p className="schedule-description">{schedule.description}</p>
                  )}
                </div>
                <div className="schedule-status">
                  <span className={`status-badge ${schedule.is_active ? 'active' : 'inactive'}`}>
                    {schedule.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>

              <div className="schedule-details">
                <div className="schedule-period">
                  <span className="period-label">적용 기간:</span>
                  <span className="period-dates">
                    {new Date(schedule.effective_from).toLocaleDateString('ko-KR')}
                    {schedule.effective_until && (
                      <> ~ {new Date(schedule.effective_until).toLocaleDateString('ko-KR')}</>
                    )}
                    {!schedule.effective_until && <> ~ 계속</>}
                  </span>
                </div>

                <div className="weekly-schedule">
                  {DAYS.map(day => (
                    <div key={day.key} className="day-schedule">
                      <span className="day-label">{day.label}</span>
                      <span className="day-times">
                        {schedule[`${day.key}_start` as keyof FixedSchedule] && schedule[`${day.key}_end` as keyof FixedSchedule] ? (
                          <>
                            {formatTime(schedule[`${day.key}_start` as keyof FixedSchedule] as string)} ~{' '}
                            {formatTime(schedule[`${day.key}_end` as keyof FixedSchedule] as string)}
                          </>
                        ) : (
                          <span className="no-work">휴무</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => handleEdit(schedule)}
                  className="action-button edit"
                  title="편집"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>

                <button
                  onClick={() => handleClone(schedule)}
                  className="action-button clone"
                  title="복사"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>

                <button
                  onClick={() => handleApplyToWeek(schedule)}
                  className="action-button apply"
                  title="주간 적용"
                  disabled={!schedule.is_active}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9,22 9,12 15,12 15,22"></polyline>
                  </svg>
                </button>

                <button
                  onClick={() => handleToggleActive(schedule)}
                  className={`action-button toggle ${schedule.is_active ? 'deactivate' : 'activate'}`}
                  title={schedule.is_active ? '비활성화' : '활성화'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {schedule.is_active ? (
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    ) : (
                      <path d="M9 12l2 2 4-4"></path>
                    )}
                  </svg>
                </button>

                <button
                  onClick={() => handleDelete(schedule)}
                  className="action-button delete"
                  title="삭제"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fixed Schedule Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content fixed-schedule-modal">
            <div className="modal-header">
              <h2>{editingSchedule ? '고정 스케줄 수정' : '새 고정 스케줄 생성'}</h2>
              <button onClick={() => setShowForm(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
              {/* Basic Info */}
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="user_id">직원 *</label>
                    <select
                      id="user_id"
                      name="user_id"
                      value={formData.user_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                      className="modern-select"
                      required
                    >
                      <option value="">직원을 선택하세요</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="name">스케줄 이름 *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="modern-input"
                      placeholder="예: 정규 근무, 아르바이트 근무"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">설명</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="modern-textarea"
                    placeholder="스케줄에 대한 설명을 입력하세요"
                    rows={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="effective_from">적용 시작일 *</label>
                    <input
                      type="date"
                      id="effective_from"
                      name="effective_from"
                      value={formData.effective_from}
                      onChange={(e) => setFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                      className="modern-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="effective_until">적용 종료일</label>
                    <input
                      type="date"
                      id="effective_until"
                      name="effective_until"
                      value={formData.effective_until}
                      onChange={(e) => setFormData(prev => ({ ...prev, effective_until: e.target.value }))}
                      className="modern-input"
                      placeholder="비워두면 계속 적용됩니다"
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="form-section">
                <h3>주간 스케줄</h3>
                <div className="weekly-form">
                  {DAYS.map(day => (
                    <div key={day.key} className="day-form">
                      <label className="day-label">{day.label}</label>
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={formData[`${day.key}_start` as keyof FixedScheduleFormData] as string}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [`${day.key}_start`]: e.target.value
                          }))}
                          className="time-input"
                          placeholder="시작"
                        />
                        <span className="time-separator">~</span>
                        <input
                          type="time"
                          value={formData[`${day.key}_end` as keyof FixedScheduleFormData] as string}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [`${day.key}_end`]: e.target.value
                          }))}
                          className="time-input"
                          placeholder="종료"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="secondary-button">
                  취소
                </button>
                <button type="submit" className="primary-button">
                  {editingSchedule ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedScheduleManagement;