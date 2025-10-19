import React, { useState, useEffect } from 'react';
import { SalesAnalytics, DepositSchedule } from '../types';
import { SalesService } from '../services/salesService';
import Toast from './Toast';

const SalesDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [depositSchedule, setDepositSchedule] = useState<DepositSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const analyticsData = await SalesService.getSalesAnalytics();
      const scheduleData = await SalesService.getDepositSchedule();

      setAnalytics(analyticsData);
      setDepositSchedule(scheduleData);
    } catch (error) {
      showToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDeposited = async (orderId: string) => {
    try {
      await SalesService.markAsDeposited(orderId);
      showToast('입금 완료 처리되었습니다.', 'success');
      await loadData();
    } catch (error) {
      showToast('입금 처리에 실패했습니다.', 'error');
    }
  };

  const handleMarkDateAsDeposited = async (date: string) => {
    try {
      const count = SalesService.markDateAsDeposited(date);
      showToast(`${count}개 주문이 입금 완료 처리되었습니다.`, 'success');
      loadData();
    } catch (error) {
      showToast('일괄 입금 처리에 실패했습니다.', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';
    if (diffDays > 0) return `${diffDays}일 후`;
    return `${Math.abs(diffDays)}일 전`;
  };

  if (loading && !analytics) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>매출 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="modern-sales-dashboard">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">💰</span>
            매출 관리 대시보드
          </h1>
          <p className="page-subtitle">실시간 매출 현황과 입금 스케줄을 확인하세요</p>
        </div>
        <button className="action-button primary" onClick={loadData} disabled={loading}>
          <span className="button-icon">🔄</span>
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      {analytics && (
        <>
          {/* 매출 요약 */}
          <div className="stats-grid">
            <div className="stat-card primary-gradient">
              <div className="stat-header">
                <span className="stat-icon">💎</span>
                <span className="stat-title">총 매출</span>
              </div>
              <div className="stat-value">₩{analytics.total_sales.toLocaleString()}</div>
              <div className="stat-trend positive">전체 누적 매출</div>
            </div>

            <div className="stat-card warning-gradient">
              <div className="stat-header">
                <span className="stat-icon">⏳</span>
                <span className="stat-title">입금 대기</span>
              </div>
              <div className="stat-value">₩{analytics.pending_deposits.toLocaleString()}</div>
              <div className="stat-trend">미입금 금액</div>
            </div>

            <div className="stat-card success-gradient">
              <div className="stat-header">
                <span className="stat-icon">📅</span>
                <span className="stat-title">오늘 매출</span>
              </div>
              <div className="stat-value">₩{analytics.today_sales.toLocaleString()}</div>
              <div className="stat-trend positive">일일 매출</div>
            </div>

            <div className="stat-card info-gradient">
              <div className="stat-header">
                <span className="stat-icon">📊</span>
                <span className="stat-title">이번 주</span>
              </div>
              <div className="stat-value">₩{analytics.this_week_sales.toLocaleString()}</div>
              <div className="stat-trend">주간 매출</div>
            </div>

            <div className="stat-card secondary-gradient">
              <div className="stat-header">
                <span className="stat-icon">🗓️</span>
                <span className="stat-title">이번 달</span>
              </div>
              <div className="stat-value">₩{analytics.this_month_sales.toLocaleString()}</div>
              <div className="stat-trend">월간 매출</div>
            </div>
          </div>

          {/* 결제 유형별 매출 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="title-icon">🏪</span>
                결제 유형별 매출
              </h2>
            </div>
            <div className="card-content">
              <div className="payment-grid">
                {analytics.payment_type_breakdown.map(item => (
                  <div key={item.type} className="payment-card">
                    <div className="payment-header">
                      <span className="payment-icon">
                        {SalesService.getPaymentTypeIcon(item.type)}
                      </span>
                      <span className="payment-name">
                        {SalesService.getPaymentTypeDisplayName(item.type)}
                      </span>
                    </div>
                    <div className="payment-amount">₩{item.amount.toLocaleString()}</div>
                    <div className="payment-count">{item.count}건</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 입금 스케줄 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span className="title-icon">💳</span>
            입금 예정 스케줄
          </h2>
        </div>
        <div className="card-content">
          {depositSchedule.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>모든 입금이 완료되었습니다</h3>
              <p>현재 입금 대기 중인 주문이 없습니다.</p>
            </div>
          ) : (
            <div className="deposit-list">
              {depositSchedule.map(schedule => (
                <div key={schedule.date} className="deposit-item">
                  <div className="deposit-header">
                    <div className="deposit-date">
                      <span className="date-main">{schedule.date}</span>
                      <span className="date-relative">{formatDate(schedule.date)}</span>
                    </div>
                    <div className="deposit-amount">₩{schedule.total_amount.toLocaleString()}</div>
                    <button
                      className="action-button primary small"
                      onClick={() => handleMarkDateAsDeposited(schedule.date)}
                    >
                      일괄 입금완료
                    </button>
                  </div>
                  <div className="order-list">
                    {schedule.orders.map(order => (
                      <div key={order.id} className="order-item">
                        <div className="order-details">
                          <span className="order-id">주문 #{order.id}</span>
                          <span className="order-type">
                            {SalesService.getPaymentTypeIcon(order.payment_type)}
                            {SalesService.getPaymentTypeDisplayName(order.payment_type)}
                          </span>
                          <span className="order-date">
                            {new Date(order.order_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="order-amount">₩{order.amount.toLocaleString()}</div>
                        <button
                          className="action-button secondary small"
                          onClick={() => handleMarkAsDeposited(order.id)}
                        >
                          입금완료
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <style>{`
        .modern-sales-dashboard {
          padding: var(--space-8);
          max-width: 1400px;
          margin: 0 auto;
          background: var(--gray-50);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: white;
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-200);
        }

        .header-content {
          flex: 1;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0 0 var(--space-2) 0;
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .title-icon {
          font-size: 2.5rem;
        }

        .page-subtitle {
          color: var(--gray-600);
          margin: 0;
          font-size: 1.1rem;
        }

        .action-button {
          background: var(--primary-600);
          color: white;
          border: none;
          padding: var(--space-4) var(--space-6);
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          box-shadow: var(--shadow-md);
        }

        .action-button:hover:not(:disabled) {
          background: var(--primary-700);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-button.small {
          padding: var(--space-2) var(--space-4);
          font-size: 0.85rem;
        }

        .action-button.secondary {
          background: var(--gray-600);
        }

        .action-button.secondary:hover:not(:disabled) {
          background: var(--gray-700);
        }

        .button-icon {
          font-size: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-6);
        }

        .stat-card {
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-200);
          position: relative;
          overflow: hidden;
          transition: all var(--transition-fast);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
        }

        .stat-card.warning-gradient::before {
          background: linear-gradient(90deg, var(--warning-500), var(--warning-600));
        }

        .stat-card.success-gradient::before {
          background: linear-gradient(90deg, var(--success-500), var(--success-600));
        }

        .stat-card.info-gradient::before {
          background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
        }

        .stat-card.secondary-gradient::before {
          background: linear-gradient(90deg, var(--gray-500), var(--gray-600));
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-title {
          font-weight: 600;
          color: var(--gray-700);
          font-size: 0.95rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-2);
        }

        .stat-trend {
          font-size: 0.85rem;
          color: var(--gray-600);
        }

        .stat-trend.positive {
          color: var(--success-600);
        }

        .card {
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-200);
          overflow: hidden;
        }

        .card-header {
          padding: var(--space-6) var(--space-8);
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
        }

        .card-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-900);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .card-content {
          padding: var(--space-8);
        }

        .payment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
        }

        .payment-card {
          padding: var(--space-6);
          border: 2px solid var(--gray-200);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          background: var(--gray-50);
        }

        .payment-card:hover {
          border-color: var(--primary-300);
          background: white;
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .payment-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .payment-icon {
          font-size: 1.5rem;
        }

        .payment-name {
          font-weight: 600;
          color: var(--gray-800);
        }

        .payment-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-600);
          margin-bottom: var(--space-1);
        }

        .payment-count {
          font-size: 0.85rem;
          color: var(--gray-600);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-20);
          color: var(--gray-600);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4);
        }

        .empty-state h3 {
          margin: 0 0 var(--space-2) 0;
          color: var(--gray-800);
          font-size: 1.25rem;
        }

        .empty-state p {
          margin: 0;
          color: var(--gray-600);
        }

        .deposit-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .deposit-item {
          border: 2px solid var(--gray-200);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all var(--transition-fast);
        }

        .deposit-item:hover {
          border-color: var(--primary-300);
          box-shadow: var(--shadow-md);
        }

        .deposit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-6);
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-200);
        }

        .deposit-date {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .date-main {
          font-weight: 700;
          color: var(--gray-900);
          font-size: 1.1rem;
        }

        .date-relative {
          font-size: 0.85rem;
          color: var(--gray-600);
        }

        .deposit-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-600);
        }

        .order-list {
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          background: var(--gray-50);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
        }

        .order-details {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          flex: 1;
        }

        .order-id {
          font-weight: 600;
          color: var(--gray-900);
        }

        .order-type {
          font-size: 0.9rem;
          color: var(--gray-600);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .order-date {
          font-size: 0.85rem;
          color: var(--gray-500);
        }

        .order-amount {
          font-weight: 600;
          color: var(--primary-600);
          margin-right: var(--space-4);
        }

        @media (max-width: 768px) {
          .modern-sales-dashboard {
            padding: var(--space-4);
            gap: var(--space-4);
          }

          .page-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .payment-grid {
            grid-template-columns: 1fr;
          }

          .deposit-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .order-details {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-1);
          }

          .order-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-3);
          }

          .order-amount {
            margin-right: 0;
            text-align: center;
          }

          .action-button {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesDashboard;