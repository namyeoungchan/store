import React, { useState, useEffect } from 'react';
import { WorkTimeService, WorkTime, WorkSummary } from '../services/workTimeService';
import { UserAuthService } from '../services/userAuthService';
import '../styles/components/WorkDashboard.css';

const WorkDashboard: React.FC = () => {
  const [summary, setSummary] = useState<WorkSummary | null>(null);
  const [recentWork, setRecentWork] = useState<WorkTime[]>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; hours: number; dayName: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<WorkTime | null>(null);

  const currentUser = UserAuthService.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = () => {
    if (!currentUser) return;

    const summaryData = WorkTimeService.getWorkSummary(currentUser.id);
    const recentWorkData = WorkTimeService.getUserWorkTimes(currentUser.id, 10);
    const weeklyChartData = WorkTimeService.getWeeklyData(currentUser.id);

    setSummary(summaryData);
    setRecentWork(recentWorkData);
    setWeeklyData(weeklyChartData);
  };

  const handleDateClick = (date: string) => {
    if (!currentUser) return;

    const work = WorkTimeService.getWorkTimeByDate(currentUser.id, date);
    setSelectedDate(date);
    setSelectedWork(work);
  };

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5); // HH:MM 형식으로 변환
  };

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}시간 ${m}분`;
  };

  const getWorkStatusColor = (hours: number): string => {
    if (hours === 0) return '#e5e7eb';
    if (hours < 4) return '#fca5a5';
    if (hours < 8) return '#fcd34d';
    return '#34d399';
  };

  const getWorkStatusText = (hours: number): string => {
    if (hours === 0) return '미등록';
    if (hours < 4) return '단시간';
    if (hours < 8) return '정상';
    return '장시간';
  };

  if (!currentUser || !summary) {
    return (
      <div className="work-dashboard loading">
        <div className="loading-content">
          <div className="loading-spinner">⟳</div>
          <p>대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="work-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">📊</span>
            <div>
              <h1>근무 대시보드</h1>
              <p>{currentUser.name}님의 근무 현황</p>
            </div>
          </div>
          <div className="refresh-button">
            <button onClick={loadDashboardData} className="refresh-btn">
              <span>🔄</span>
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card total">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-number">{summary.totalDays}</div>
            <div className="card-label">총 근무일</div>
          </div>
        </div>

        <div className="summary-card hours">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <div className="card-number">{summary.totalHours.toFixed(1)}</div>
            <div className="card-label">총 근무시간</div>
          </div>
        </div>

        <div className="summary-card average">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-number">{summary.averageHours.toFixed(1)}</div>
            <div className="card-label">평균 근무시간</div>
          </div>
        </div>

        <div className="summary-card week">
          <div className="card-icon">📆</div>
          <div className="card-content">
            <div className="card-number">{summary.thisWeekHours.toFixed(1)}</div>
            <div className="card-label">이번 주 근무</div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>📊 최근 7일 근무시간</h2>
          <p>일별 근무시간을 확인할 수 있습니다</p>
        </div>

        <div className="weekly-chart">
          {weeklyData.map((day, index) => {
            const maxHours = Math.max(...weeklyData.map(d => d.hours), 8);
            const height = day.hours > 0 ? Math.max((day.hours / maxHours) * 100, 10) : 5;
            const color = getWorkStatusColor(day.hours);

            return (
              <div
                key={index}
                className="chart-bar"
                onClick={() => handleDateClick(day.date)}
              >
                <div className="bar-container">
                  <div
                    className="bar"
                    style={{
                      height: `${height}%`,
                      backgroundColor: color
                    }}
                  >
                    <div className="bar-value">
                      {day.hours > 0 ? `${day.hours.toFixed(1)}h` : ''}
                    </div>
                  </div>
                </div>
                <div className="bar-label">
                  <div className="day-name">{day.dayName}</div>
                  <div className="date">{day.date.split('-')[2]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Work Records */}
      <div className="recent-work-section">
        <div className="section-header">
          <h2>📋 최근 근무 기록</h2>
          <p>최근 10일간의 근무 기록입니다</p>
        </div>

        <div className="work-records">
          {recentWork.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>등록된 근무 기록이 없습니다</h3>
              <p>근무시간을 입력하여 기록을 시작해보세요</p>
            </div>
          ) : (
            recentWork.map((work) => (
              <div
                key={work.id}
                className="work-record-card"
                onClick={() => {
                  setSelectedDate(work.date);
                  setSelectedWork(work);
                }}
              >
                <div className="record-header">
                  <div className="record-date">
                    <span className="date-icon">📅</span>
                    {new Date(work.date).toLocaleDateString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      weekday: 'short'
                    })}
                  </div>
                  <div className={`work-status ${getWorkStatusText(work.totalHours).toLowerCase()}`}>
                    {getWorkStatusText(work.totalHours)}
                  </div>
                </div>

                <div className="record-content">
                  <div className="time-info">
                    <span className="time-range">
                      {formatTime(work.startTime)} ~ {formatTime(work.endTime)}
                    </span>
                    <span className="break-time">
                      (휴게 {work.breakTime}분)
                    </span>
                  </div>
                  <div className="total-hours">
                    {formatHours(work.totalHours)}
                  </div>
                </div>

                {work.notes && (
                  <div className="record-notes">
                    <span className="notes-icon">📝</span>
                    {work.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Work Detail Modal */}
      {selectedDate && (
        <div className="work-detail-modal" onClick={() => setSelectedDate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} 근무 상세
              </h3>
              <button
                className="modal-close"
                onClick={() => setSelectedDate(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {selectedWork ? (
                <>
                  <div className="detail-section">
                    <h4>⏰ 근무 시간</h4>
                    <div className="detail-content">
                      <div className="time-detail">
                        <span className="label">시작:</span>
                        <span className="value">{formatTime(selectedWork.startTime)}</span>
                      </div>
                      <div className="time-detail">
                        <span className="label">종료:</span>
                        <span className="value">{formatTime(selectedWork.endTime)}</span>
                      </div>
                      <div className="time-detail">
                        <span className="label">휴게시간:</span>
                        <span className="value">{selectedWork.breakTime}분</span>
                      </div>
                      <div className="time-detail total">
                        <span className="label">총 근무시간:</span>
                        <span className="value">{formatHours(selectedWork.totalHours)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedWork.notes && (
                    <div className="detail-section">
                      <h4>📝 메모</h4>
                      <div className="detail-content">
                        <p className="notes-content">{selectedWork.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h4>📊 상태</h4>
                    <div className="detail-content">
                      <div className={`status-badge ${getWorkStatusText(selectedWork.totalHours).toLowerCase()}`}>
                        {getWorkStatusText(selectedWork.totalHours)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-work-data">
                  <div className="no-data-icon">📭</div>
                  <h4>해당 날짜에 등록된 근무 기록이 없습니다</h4>
                  <p>근무시간 입력 페이지에서 기록을 추가해보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkDashboard;