import React from 'react';
import { ScheduleService } from '../../services/scheduleService';

interface WeekSelectorProps {
  selectedWeek: string;
  onWeekChange: (week: string) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ selectedWeek, onWeekChange }) => {
  const formatWeekLabel = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

    return `${startStr} ~ ${endStr}`;
  };

  const goToPreviousWeek = () => {
    const currentStart = new Date(selectedWeek);
    const previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - 7);
    onWeekChange(previousStart.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const currentStart = new Date(selectedWeek);
    const nextStart = new Date(currentStart);
    nextStart.setDate(currentStart.getDate() + 7);
    onWeekChange(nextStart.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    onWeekChange(ScheduleService.getCurrentWeekStart());
  };

  const isCurrentWeek = selectedWeek === ScheduleService.getCurrentWeekStart();

  return (
    <div className="week-selector">
      <button onClick={goToPreviousWeek} className="week-nav-btn">
        ⬅️ 이전 주
      </button>

      <div className="week-display">
        <div className="week-label">{formatWeekLabel(selectedWeek)}</div>
        {!isCurrentWeek && (
          <button onClick={goToCurrentWeek} className="current-week-btn">
            이번 주로
          </button>
        )}
      </div>

      <button onClick={goToNextWeek} className="week-nav-btn">
        다음 주 ➡️
      </button>
    </div>
  );
};

export default WeekSelector;