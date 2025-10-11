import React, { useState, useEffect } from 'react';
import { WorkTimeService, WorkTime } from '../services/workTimeService';
import { UserAuthService } from '../services/userAuthService';
import '../styles/components/WorkTimeInput.css';

const WorkTimeInput: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakTime, setBreakTime] = useState(60);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState<WorkTime | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const currentUser = UserAuthService.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      checkExistingRecord();
    }
  }, [date, currentUser]);

  const checkExistingRecord = () => {
    if (!currentUser) return;

    const existing = WorkTimeService.getWorkTimeByDate(currentUser.id, date);
    if (existing) {
      setExistingRecord(existing);
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setBreakTime(existing.breakTime);
      setNotes(existing.notes || '');
    } else {
      setExistingRecord(null);
      setStartTime('09:00');
      setEndTime('18:00');
      setBreakTime(60);
      setNotes('');
    }
  };

  const calculateHours = (start: string, end: string, breakMinutes: number): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    return Math.max(0, totalMinutes / 60);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const workTime = WorkTimeService.addWorkTime(
        currentUser.id,
        date,
        startTime,
        endTime,
        breakTime,
        notes.trim() || undefined
      );

      const actionText = existingRecord ? '수정' : '등록';
      showToast(`근무시간이 성공적으로 ${actionText}되었습니다.`, 'success');
      setExistingRecord(workTime);

      // 새로운 날짜로 이동하여 다음 입력 준비
      if (!existingRecord) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateString = nextDay.toISOString().split('T')[0];

        // 미래 날짜가 아닌 경우에만 이동
        const today = new Date().toISOString().split('T')[0];
        if (nextDateString <= today) {
          setDate(nextDateString);
        }
      }
    } catch (error) {
      showToast('근무시간 저장에 실패했습니다.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickTimeSet = (startH: number, endH: number, breakMin: number) => {
    setStartTime(`${startH.toString().padStart(2, '0')}:00`);
    setEndTime(`${endH.toString().padStart(2, '0')}:00`);
    setBreakTime(breakMin);
  };

  const currentHours = calculateHours(startTime, endTime, breakTime);
  const isValidTime = currentHours > 0 && currentHours <= 24;

  return (
    <div className="work-time-input">
      <div className="input-header">
        <div className="input-title">
          <span className="input-icon">⏰</span>
          <div>
            <h2>근무시간 입력</h2>
            <p>정확한 근무시간을 기록해주세요</p>
          </div>
        </div>
        {existingRecord && (
          <div className="edit-indicator">
            <span className="edit-icon">✏️</span>
            <span>수정 모드</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="work-form">
        <div className="form-section">
          <h3 className="section-title">📅 기본 정보</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date" className="form-label">날짜</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="form-input"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">🕐 근무시간</h3>

          <div className="quick-times">
            <div className="quick-times-header">빠른 설정</div>
            <div className="quick-time-buttons">
              <button
                type="button"
                className="quick-time-btn"
                onClick={() => quickTimeSet(9, 18, 60)}
              >
                09:00-18:00 (1시간 휴게)
              </button>
              <button
                type="button"
                className="quick-time-btn"
                onClick={() => quickTimeSet(10, 19, 60)}
              >
                10:00-19:00 (1시간 휴게)
              </button>
              <button
                type="button"
                className="quick-time-btn"
                onClick={() => quickTimeSet(14, 22, 30)}
              >
                14:00-22:00 (30분 휴게)
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime" className="form-label">시작 시간</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime" className="form-label">종료 시간</label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="breakTime" className="form-label">휴게시간 (분)</label>
              <select
                id="breakTime"
                value={breakTime}
                onChange={(e) => setBreakTime(Number(e.target.value))}
                className="form-input"
                required
              >
                <option value={0}>0분</option>
                <option value={30}>30분</option>
                <option value={60}>1시간</option>
                <option value={90}>1시간 30분</option>
                <option value={120}>2시간</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">총 근무시간</label>
              <div className={`work-hours-display ${!isValidTime ? 'invalid' : ''}`}>
                {isValidTime ? `${currentHours.toFixed(1)}시간` : '잘못된 시간'}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">📝 메모</h3>
          <div className="form-group">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항, 업무 내용 등을 기록해주세요 (선택사항)"
              className="form-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className={`submit-btn ${!isValidTime ? 'disabled' : ''}`}
            disabled={isLoading || !isValidTime}
          >
            {isLoading ? (
              <>
                <span className="loading-icon">⟳</span>
                저장 중...
              </>
            ) : (
              <>
                <span className="submit-icon">💾</span>
                {existingRecord ? '수정하기' : '등록하기'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`work-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✅' : '❌'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default WorkTimeInput;