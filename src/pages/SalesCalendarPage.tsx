import React, { useState, useEffect } from 'react';
import { SalesService } from '../services/salesService';
import { OrderService } from '../services/orderService';
import { Order, PaymentType } from '../types';

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  salesAmount: number;
  orderCount: number;
  expectedDeposits: number;
  depositCount: number;
  orders: Order[];
}

interface DayDetailModal {
  show: boolean;
  day: CalendarDay | null;
}

const SalesCalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<DayDetailModal>({ show: false, day: null });

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // 캘린더 날짜 범위 계산 (이전/다음 달 일부 포함)
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // 주의 시작부터
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // 주의 끝까지

      // 모든 주문 데이터 가져오기
      const allOrders = await OrderService.getAllOrders();
      const depositSchedules = await SalesService.getDepositSchedule();

      // 날짜별 데이터 그룹화
      const dayDataMap = new Map<string, CalendarDay>();

      // 날짜 범위 내 모든 날짜 초기화
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        dayDataMap.set(dateStr, {
          date: dateStr,
          isCurrentMonth: current.getMonth() === month,
          isToday: dateStr === new Date().toISOString().split('T')[0],
          salesAmount: 0,
          orderCount: 0,
          expectedDeposits: 0,
          depositCount: 0,
          orders: []
        });
        current.setDate(current.getDate() + 1);
      }

      // 주문 데이터 매핑
      allOrders.forEach(order => {
        if (order.order_date) {
          const orderDate = order.order_date.split('T')[0];
          const dayData = dayDataMap.get(orderDate);
          if (dayData) {
            dayData.salesAmount += order.total_amount;
            dayData.orderCount += 1;
            dayData.orders.push(order);
          }
        }
      });

      // 입금 예정 데이터 매핑
      depositSchedules.forEach(schedule => {
        const dayData = dayDataMap.get(schedule.date);
        if (dayData) {
          dayData.expectedDeposits += schedule.total_amount;
          dayData.depositCount += schedule.orders.length;
        }
      });

      setCalendarDays(Array.from(dayDataMap.values()));
    } catch (error) {
      console.error('캘린더 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return '';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number): string => {
    if (amount === 0) return '';
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만원`;
    }
    return `${Math.floor(amount / 1000)}천원`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openDayDetail = (day: CalendarDay) => {
    if (day.isCurrentMonth && (day.salesAmount > 0 || day.expectedDeposits > 0)) {
      setDetailModal({ show: true, day });
    }
  };

  const closeDayDetail = () => {
    setDetailModal({ show: false, day: null });
  };

  const getPaymentTypeIcon = (type: PaymentType): string => {
    return SalesService.getPaymentTypeIcon(type);
  };

  const getPaymentTypeDisplayName = (type: PaymentType): string => {
    return SalesService.getPaymentTypeDisplayName(type);
  };

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="loading-spinner"></div>
        <p>캘린더를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="sales-calendar-page">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <h1>📅 매출 & 입금 캘린더</h1>
          <p>일자별 매출과 입금 예정 현황을 한눈에 확인하세요</p>
        </div>
        <div className="header-actions">
          <button className="today-btn" onClick={goToToday}>
            오늘
          </button>
          <button className="refresh-btn" onClick={loadCalendarData}>
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav">
        <button className="nav-btn" onClick={() => navigateMonth('prev')}>
          ◀ 이전
        </button>
        <h2 className="current-month">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        <button className="nav-btn" onClick={() => navigateMonth('next')}>
          다음 ▶
        </button>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color sales"></div>
          <span>매출</span>
        </div>
        <div className="legend-item">
          <div className="legend-color deposit"></div>
          <span>입금 예정</span>
        </div>
        <div className="legend-note">
          * 날짜를 클릭하면 상세 내역을 볼 수 있습니다
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Weekday Headers */}
          {weekdays.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${
                day.salesAmount > 0 || day.expectedDeposits > 0 ? 'has-data' : ''
              }`}
              onClick={() => openDayDetail(day)}
            >
              <div className="day-number">
                {new Date(day.date).getDate()}
              </div>

              {day.isCurrentMonth && (
                <div className="day-content">
                  {day.salesAmount > 0 && (
                    <div className="sales-info">
                      <div className="amount sales">
                        {formatCompactCurrency(day.salesAmount)}
                      </div>
                      <div className="count">
                        {day.orderCount}건
                      </div>
                    </div>
                  )}

                  {day.expectedDeposits > 0 && (
                    <div className="deposit-info">
                      <div className="amount deposit">
                        💰 {formatCompactCurrency(day.expectedDeposits)}
                      </div>
                      <div className="count">
                        {day.depositCount}건
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal.show && detailModal.day && (
        <div className="modal-overlay" onClick={closeDayDetail}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {new Date(detailModal.day.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} 상세
              </h3>
              <button className="close-modal-btn" onClick={closeDayDetail}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Summary */}
              <div className="day-summary">
                <div className="summary-item">
                  <div className="summary-icon">💰</div>
                  <div className="summary-details">
                    <div className="summary-title">총 매출</div>
                    <div className="summary-value">
                      {formatCurrency(detailModal.day.salesAmount)}
                    </div>
                    <div className="summary-subtitle">
                      {detailModal.day.orderCount}건 주문
                    </div>
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-icon">📅</div>
                  <div className="summary-details">
                    <div className="summary-title">입금 예정</div>
                    <div className="summary-value">
                      {formatCurrency(detailModal.day.expectedDeposits)}
                    </div>
                    <div className="summary-subtitle">
                      {detailModal.day.depositCount}건 대기
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              {detailModal.day.orders.length > 0 && (
                <div className="orders-section">
                  <h4>주문 내역</h4>
                  <div className="orders-list">
                    {detailModal.day.orders.map(order => (
                      <div key={order.id} className="order-item">
                        <div className="order-info">
                          <div className="order-id">주문 #{order.id}</div>
                          <div className="order-details">
                            <span className="payment-type">
                              {getPaymentTypeIcon(order.payment_type)}
                              {getPaymentTypeDisplayName(order.payment_type)}
                            </span>
                            <span className="order-time">
                              {order.order_date ?
                                new Date(order.order_date).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''
                              }
                            </span>
                          </div>
                        </div>
                        <div className="order-amount">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <div className={`order-status ${order.is_deposited ? 'deposited' : 'pending'}`}>
                          {order.is_deposited ? '입금완료' : '대기중'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sales-calendar-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: var(--space-6);
        }

        .calendar-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          color: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--space-4);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Header */
        .calendar-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: var(--space-6);
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .header-content h1 {
          margin: 0 0 var(--space-2) 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .header-actions {
          display: flex;
          gap: var(--space-3);
        }

        .today-btn,
        .refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          color: white;
          padding: var(--space-3) var(--space-4);
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          font-weight: 500;
        }

        .today-btn:hover,
        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        /* Calendar Navigation */
        .calendar-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-6);
          margin-bottom: var(--space-4);
        }

        .nav-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          padding: var(--space-3) var(--space-5);
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          font-weight: 500;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .current-month {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Legend */
        .calendar-legend {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-6);
          margin-bottom: var(--space-6);
          color: white;
          font-size: 0.9rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .legend-color.sales {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .legend-color.deposit {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .legend-note {
          opacity: 0.8;
          font-style: italic;
        }

        /* Calendar Container */
        .calendar-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: var(--space-6);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--gray-200);
          border-radius: 12px;
          overflow: hidden;
        }

        .weekday-header {
          background: var(--gray-100);
          padding: var(--space-3);
          text-align: center;
          font-weight: 600;
          color: var(--gray-600);
          font-size: 0.875rem;
        }

        .calendar-day {
          background: white;
          min-height: 120px;
          padding: var(--space-2);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.2s ease;
        }

        .calendar-day.other-month {
          background: var(--gray-50);
          opacity: 0.5;
        }

        .calendar-day.today {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border: 2px solid var(--primary-500);
        }

        .calendar-day.has-data {
          cursor: pointer;
        }

        .calendar-day.has-data:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          z-index: 1;
        }

        .day-number {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: var(--space-2);
        }

        .calendar-day.today .day-number {
          color: var(--primary-700);
          font-weight: 700;
        }

        .day-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .sales-info,
        .deposit-info {
          padding: var(--space-1);
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .sales-info {
          background: linear-gradient(135deg, #dcfdf7, #a7f3d0);
          border: 1px solid #6ee7b7;
        }

        .deposit-info {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #fbbf24;
        }

        .amount {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .amount.sales {
          color: var(--success-700);
        }

        .amount.deposit {
          color: var(--warning-700);
        }

        .count {
          font-size: 0.65rem;
          opacity: 0.8;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          color: white;
          padding: var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-modal-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          padding: var(--space-2);
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .close-modal-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: var(--space-6);
          overflow-y: auto;
          max-height: calc(80vh - 120px);
        }

        /* Day Summary */
        .day-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .summary-item {
          background: var(--gray-50);
          border-radius: 16px;
          padding: var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .summary-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-title {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-bottom: var(--space-1);
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-1);
        }

        .summary-subtitle {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        /* Orders Section */
        .orders-section h4 {
          margin: 0 0 var(--space-4) 0;
          color: var(--gray-900);
          font-size: 1.125rem;
          font-weight: 600;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .order-item {
          background: white;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          padding: var(--space-4);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .order-item:hover {
          border-color: var(--primary-300);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .order-info {
          flex: 1;
        }

        .order-id {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: var(--space-1);
        }

        .order-details {
          display: flex;
          gap: var(--space-3);
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .payment-type {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .order-amount {
          font-weight: 700;
          color: var(--gray-900);
          margin-right: var(--space-4);
        }

        .order-status {
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .order-status.deposited {
          background: var(--success-100);
          color: var(--success-700);
        }

        .order-status.pending {
          background: var(--warning-100);
          color: var(--warning-700);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .sales-calendar-page {
            padding: var(--space-4);
          }

          .calendar-header {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }

          .header-content h1 {
            font-size: 1.5rem;
          }

          .calendar-nav {
            gap: var(--space-4);
          }

          .current-month {
            font-size: 1.25rem;
          }

          .calendar-legend {
            flex-direction: column;
            gap: var(--space-2);
          }

          .calendar-day {
            min-height: 80px;
            padding: var(--space-1);
          }

          .day-content {
            gap: 2px;
          }

          .sales-info,
          .deposit-info {
            padding: 2px;
            font-size: 0.65rem;
          }

          .modal-content {
            width: 95%;
            margin: var(--space-4);
          }

          .day-summary {
            grid-template-columns: 1fr;
          }

          .order-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-2);
          }

          .order-details {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesCalendarPage;