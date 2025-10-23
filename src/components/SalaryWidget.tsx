import React, { useState, useEffect } from 'react';
import { SalaryService, SalaryDashboardData, WeeklySalaryCalculation } from '../services/salaryService';

interface SalaryWidgetProps {
  className?: string;
  onRefresh?: () => void;
}

export const SalaryWidget: React.FC<SalaryWidgetProps> = ({ className = '', onRefresh }) => {
  const [salaryData, setSalaryData] = useState<SalaryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadSalaryData();
  }, []);

  const loadSalaryData = async () => {
    setLoading(true);
    try {
      const data = await SalaryService.getSalaryDashboardData();
      setSalaryData(data);
    } catch (error) {
      console.error('급여 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className={`dashboard-card salary-widget ${className}`}>
        <div className="card-header">
          <h3>💰 직원 임금 현황</h3>
        </div>
        <div className="card-content">
          <div className="loading-spinner"></div>
          <p>급여 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!salaryData) {
    return (
      <div className={`dashboard-card salary-widget ${className}`}>
        <div className="card-header">
          <h3>💰 직원 임금 현황</h3>
        </div>
        <div className="card-content">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>급여 데이터를 불러올 수 없습니다</p>
          </div>
        </div>
      </div>
    );
  }

  const monthlyProjection = SalaryService.calculateMonthlyProjection(salaryData.totalWeeklyPayroll);
  const nextPayday = SalaryService.getNextPayday();
  const daysUntilPayday = SalaryService.getDaysUntilPayday();

  return (
    <div className={`dashboard-card salary-widget ${className}`}>
      <div className="card-header">
        <h3>💰 직원 임금 현황</h3>
        <div className="header-actions">
          <button
            className="detail-toggle-btn"
            onClick={() => setShowDetail(!showDetail)}
          >
            {showDetail ? '요약보기' : '상세보기'}
          </button>
          <button className="refresh-btn-sm" onClick={() => { loadSalaryData(); onRefresh?.(); }}>
            🔄
          </button>
        </div>
      </div>

      <div className="card-content">
        {/* 요약 통계 */}
        <div className="salary-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-icon">👥</div>
              <div className="summary-details">
                <div className="summary-value">{salaryData.totalEmployees}명</div>
                <div className="summary-label">전체 직원</div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">💵</div>
              <div className="summary-details">
                <div className="summary-value">{formatCurrency(salaryData.totalWeeklyPayroll)}</div>
                <div className="summary-label">주간 총 급여</div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">🎁</div>
              <div className="summary-details">
                <div className="summary-value">{formatCurrency(salaryData.totalHolidayPay)}</div>
                <div className="summary-label">주휴수당</div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">📅</div>
              <div className="summary-details">
                <div className="summary-value">{daysUntilPayday}일</div>
                <div className="summary-label">급여일까지</div>
              </div>
            </div>
          </div>
        </div>

        {/* 월간 예상 급여 */}
        <div className="monthly-projection">
          <div className="projection-header">
            <h4>📊 이번 달 예상 급여</h4>
            <div className="projection-amount">{formatCurrency(monthlyProjection)}</div>
          </div>
          <div className="projection-details">
            <span>급여일: {new Date(nextPayday).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}일</span>
          </div>
        </div>

        {/* 상세 직원별 급여 현황 */}
        {showDetail && (
          <div className="salary-detail">
            <h4>👤 직원별 상세 현황</h4>
            {salaryData.employeeSalaries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>등록된 직원이 없습니다</p>
              </div>
            ) : (
              <div className="employee-salary-list">
                {salaryData.employeeSalaries.map((employee) => (
                  <div key={employee.userId} className="employee-salary-item">
                    <div className="employee-info">
                      <div className="employee-name">{employee.userName}</div>
                      <div className="employee-meta">
                        <span className="employee-position">{employee.position}</span>
                        <span className={`salary-type ${employee.salaryType.toLowerCase()}`}>
                          {employee.salaryType === 'HOURLY' ? '시급' : '월급'}
                        </span>
                      </div>
                    </div>

                    <div className="employee-hours">
                      <div className="hours-info">
                        <span className="regular-hours">기본: {formatHours(employee.regularHours)}</span>
                        {employee.overtimeHours > 0 && (
                          <span className="overtime-hours">연장: {formatHours(employee.overtimeHours)}</span>
                        )}
                      </div>
                      <div className="total-hours">총 {formatHours(employee.weeklyHours)}</div>
                    </div>

                    <div className="employee-pay">
                      <div className="pay-breakdown">
                        <div className="pay-item">
                          <span className="pay-label">기본급:</span>
                          <span className="pay-amount">{formatCurrency(employee.regularPay)}</span>
                        </div>
                        {employee.overtimePay > 0 && (
                          <div className="pay-item">
                            <span className="pay-label">연장수당:</span>
                            <span className="pay-amount">{formatCurrency(employee.overtimePay)}</span>
                          </div>
                        )}
                        {employee.weeklyHolidayPay > 0 && (
                          <div className="pay-item holiday-pay">
                            <span className="pay-label">주휴수당:</span>
                            <span className="pay-amount">{formatCurrency(employee.weeklyHolidayPay)}</span>
                          </div>
                        )}
                      </div>
                      <div className="total-pay">{formatCurrency(employee.totalWeeklyPay)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};