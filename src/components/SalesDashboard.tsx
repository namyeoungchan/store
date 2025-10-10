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

  const loadData = () => {
    setLoading(true);
    try {
      const analyticsData = SalesService.getSalesAnalytics();
      const scheduleData = SalesService.getDepositSchedule();

      setAnalytics(analyticsData);
      setDepositSchedule(scheduleData);
    } catch (error) {
      showToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDeposited = async (orderId: number) => {
    try {
      SalesService.markAsDeposited(orderId);
      showToast('입금 완료 처리되었습니다.', 'success');
      loadData();
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
      <div className="sales-dashboard loading">
        <div className="loading-spinner">📊 매출 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <h2>💰 매출 관리 대시보드</h2>
        <button className="refresh-btn" onClick={loadData} disabled={loading}>
          {loading ? '🔄 새로고침 중...' : '🔄 새로고침'}
        </button>
      </div>

      {analytics && (
        <>
          {/* 매출 요약 */}
          <div className="analytics-section">
            <h3>📈 매출 현황</h3>
            <div className="analytics-grid">
              <div className="analytics-card total-sales">
                <div className="card-icon">💎</div>
                <div className="card-content">
                  <div className="card-value">₩{analytics.total_sales.toLocaleString()}</div>
                  <div className="card-label">총 매출</div>
                </div>
              </div>

              <div className="analytics-card pending-deposits">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                  <div className="card-value">₩{analytics.pending_deposits.toLocaleString()}</div>
                  <div className="card-label">입금 대기</div>
                </div>
              </div>

              <div className="analytics-card today-sales">
                <div className="card-icon">📅</div>
                <div className="card-content">
                  <div className="card-value">₩{analytics.today_sales.toLocaleString()}</div>
                  <div className="card-label">오늘 매출</div>
                </div>
              </div>

              <div className="analytics-card week-sales">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <div className="card-value">₩{analytics.this_week_sales.toLocaleString()}</div>
                  <div className="card-label">이번 주 매출</div>
                </div>
              </div>

              <div className="analytics-card month-sales">
                <div className="card-icon">🗓️</div>
                <div className="card-content">
                  <div className="card-value">₩{analytics.this_month_sales.toLocaleString()}</div>
                  <div className="card-label">이번 달 매출</div>
                </div>
              </div>
            </div>
          </div>

          {/* 결제 유형별 매출 */}
          <div className="payment-breakdown-section">
            <h3>🏪 결제 유형별 매출</h3>
            <div className="payment-breakdown-grid">
              {analytics.payment_type_breakdown.map(item => (
                <div key={item.type} className="payment-breakdown-card">
                  <div className="payment-icon">
                    {SalesService.getPaymentTypeIcon(item.type)}
                  </div>
                  <div className="payment-content">
                    <div className="payment-name">
                      {SalesService.getPaymentTypeDisplayName(item.type)}
                    </div>
                    <div className="payment-amount">
                      ₩{item.amount.toLocaleString()}
                    </div>
                    <div className="payment-count">
                      {item.count}건
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 입금 스케줄 */}
      <div className="deposit-schedule-section">
        <h3>💳 입금 예정 스케줄</h3>
        {depositSchedule.length === 0 ? (
          <div className="no-deposits">
            <div className="no-deposits-icon">✅</div>
            <p>입금 대기 중인 주문이 없습니다.</p>
          </div>
        ) : (
          <div className="deposit-schedule-list">
            {depositSchedule.map(schedule => (
              <div key={schedule.date} className="deposit-schedule-item">
                <div className="schedule-header">
                  <div className="schedule-date">
                    <span className="date-text">{schedule.date}</span>
                    <span className="date-relative">({formatDate(schedule.date)})</span>
                  </div>
                  <div className="schedule-total">
                    ₩{schedule.total_amount.toLocaleString()}
                  </div>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => handleMarkDateAsDeposited(schedule.date)}
                  >
                    일괄 입금완료
                  </button>
                </div>
                <div className="schedule-orders">
                  {schedule.orders.map(order => (
                    <div key={order.id} className="schedule-order">
                      <div className="order-info">
                        <span className="order-id">주문 #{order.id}</span>
                        <span className="order-payment-type">
                          {SalesService.getPaymentTypeIcon(order.payment_type)}
                          {SalesService.getPaymentTypeDisplayName(order.payment_type)}
                        </span>
                        <span className="order-date">
                          {new Date(order.order_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="order-amount">
                        ₩{order.amount.toLocaleString()}
                      </div>
                      <button
                        className="btn btn-secondary btn-small"
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

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <style>{`
        .sales-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8fafc;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .dashboard-header h2 {
          margin: 0;
          color: #1a202c;
          font-size: 1.75rem;
        }

        .refresh-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .analytics-section,
        .payment-breakdown-section,
        .deposit-schedule-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .analytics-section h3,
        .payment-breakdown-section h3,
        .deposit-schedule-section h3 {
          margin: 0 0 1.5rem 0;
          color: #1a202c;
          font-size: 1.25rem;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .analytics-card {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          border-radius: 10px;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .analytics-card.pending-deposits {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .analytics-card.today-sales {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .analytics-card.week-sales {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .analytics-card.month-sales {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .card-icon {
          font-size: 2rem;
          margin-right: 1rem;
        }

        .card-content {
          flex: 1;
        }

        .card-value {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .card-label {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .payment-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .payment-breakdown-card {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .payment-breakdown-card:hover {
          border-color: #4f46e5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
        }

        .payment-icon {
          font-size: 2rem;
          margin-right: 1rem;
        }

        .payment-content {
          flex: 1;
        }

        .payment-name {
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 0.25rem;
        }

        .payment-amount {
          font-size: 1.1rem;
          font-weight: bold;
          color: #4f46e5;
          margin-bottom: 0.25rem;
        }

        .payment-count {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .no-deposits {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .no-deposits-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .deposit-schedule-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .deposit-schedule-item {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .schedule-date {
          display: flex;
          flex-direction: column;
        }

        .date-text {
          font-weight: 600;
          color: #1a202c;
        }

        .date-relative {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .schedule-total {
          font-size: 1.1rem;
          font-weight: bold;
          color: #4f46e5;
        }

        .schedule-orders {
          padding: 1rem 1.5rem;
        }

        .schedule-order {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .schedule-order:last-child {
          border-bottom: none;
        }

        .order-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .order-id {
          font-weight: 600;
          color: #1a202c;
        }

        .order-payment-type {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .order-date {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .order-amount {
          font-weight: 600;
          color: #4f46e5;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 50vh;
        }

        .loading-spinner {
          font-size: 1.2rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .sales-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .payment-breakdown-grid {
            grid-template-columns: 1fr;
          }

          .schedule-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .order-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .schedule-order {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesDashboard;