import React, { useState, useEffect } from 'react';
import { WeeklyWorkSummary } from '../../types';
import { WorkRecordService } from '../../services/workRecordService';
import { ScheduleService } from '../../services/scheduleService';
import WeekSelector from './WeekSelector';

const WorkTimeAnalysis: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<string>(ScheduleService.getCurrentWeekStart());
  const [weeklySummary, setWeeklySummary] = useState<WeeklyWorkSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<WeeklyWorkSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeklySummary();
  }, [selectedWeek]);

  const loadWeeklySummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await WorkRecordService.getWeeklyWorkSummary(selectedWeek);
      setWeeklySummary(summary);
      setSelectedUser(null);
    } catch (err) {
      setError('근무시간 분석 데이터를 불러오는데 실패했습니다.');
      console.error('Error loading work time analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getTotalStats = () => {
    return weeklySummary.reduce(
      (acc, user) => ({
        totalHours: acc.totalHours + user.total_hours,
        totalPay: acc.totalPay + user.total_pay,
        totalWorkDays: acc.totalWorkDays + user.work_days,
      }),
      { totalHours: 0, totalPay: 0, totalWorkDays: 0 }
    );
  };

  const totalStats = getTotalStats();

  return (
    <div className="work-time-analysis">
      <div className="analysis-header">
        <div className="analysis-title">
          <h2>📊 근무시간 분석</h2>
          <p className="analysis-subtitle">
            직원들의 주간 근무시간과 급여를 분석합니다
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

      <div className="analysis-info">
        <div className="week-info">
          <span className="week-label">분석 기간:</span>
          <span className="week-range">{formatWeekRange(selectedWeek)}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>근무시간 분석 중...</p>
        </div>
      ) : (
        <div className="analysis-content">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">👥</div>
              <div className="card-info">
                <div className="card-value">{weeklySummary.length}명</div>
                <div className="card-label">활동 직원</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">⏱️</div>
              <div className="card-info">
                <div className="card-value">{totalStats.totalHours.toFixed(1)}시간</div>
                <div className="card-label">총 근무시간</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-info">
                <div className="card-value">{formatCurrency(totalStats.totalPay)}</div>
                <div className="card-label">총 급여</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📅</div>
              <div className="card-info">
                <div className="card-value">{totalStats.totalWorkDays}일</div>
                <div className="card-label">총 근무일</div>
              </div>
            </div>
          </div>

          <div className="analysis-grid">
            <div className="user-list-section">
              <h3>직원별 근무 현황</h3>
              {weeklySummary.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h4>근무 기록이 없습니다</h4>
                  <p>이번 주에 등록된 근무 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="user-summary-list">
                  {weeklySummary.map(user => (
                    <div
                      key={user.user_id}
                      className={`user-summary-item ${selectedUser?.user_id === user.user_id ? 'selected' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="user-basic">
                        <div className="user-name">{user.user_name}</div>
                        <div className="work-days">{user.work_days}일 근무</div>
                      </div>
                      <div className="user-stats">
                        <div className="stat-item">
                          <span className="stat-value">{user.total_hours.toFixed(1)}시간</span>
                          <span className="stat-label">근무시간</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{formatCurrency(user.total_pay)}</span>
                          <span className="stat-label">급여</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="user-detail-section">
              {selectedUser ? (
                <div className="user-detail">
                  <h3>{selectedUser.user_name} 상세 근무 기록</h3>
                  {selectedUser.records.length === 0 ? (
                    <div className="no-records">
                      <p>이번 주에 근무 기록이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="work-records">
                      {selectedUser.records.map(record => (
                        <div key={record.id} className="work-record-item">
                          <div className="record-date">
                            {formatDate(record.work_date)}
                          </div>
                          <div className="record-time">
                            <span className="time-range">
                              {formatTime(record.start_time)} ~ {formatTime(record.end_time)}
                            </span>
                            <span className="break-time">
                              (휴게 {record.break_minutes}분)
                            </span>
                          </div>
                          <div className="record-stats">
                            <span className="hours">{record.total_hours.toFixed(1)}시간</span>
                            <span className="pay">{formatCurrency(record.total_pay)}</span>
                          </div>
                          {record.notes && (
                            <div className="record-notes">{record.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="select-user-prompt">
                  <div className="prompt-icon">👈</div>
                  <h4>직원을 선택하세요</h4>
                  <p>왼쪽 목록에서 직원을 클릭하면 상세 근무 기록을 확인할 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTimeAnalysis;