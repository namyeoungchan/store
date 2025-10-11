import React, { useState, useEffect } from 'react';
import { DepositSchedule, PaymentType } from '../types';
import { SalesService } from '../services/salesService';
import './DepositScheduleWidget.css';

interface DepositScheduleWidgetProps {
  className?: string;
  onRefresh?: () => void;
}


// 결제 타입별 색상 클래스
const getPaymentColorClass = (type: PaymentType): string => {
  const colors: Record<PaymentType, string> = {
    'CARD': 'card',
    'COUPANG': 'coupang',
    'BAEMIN': 'baemin',
    'YOGIYO': 'yogiyo'
  };
  return colors[type];
};

// 결제 유형별 표시명 (SalesService와 동일)
const getPaymentTypeDisplayName = (paymentType: PaymentType): string => {
  return SalesService.getPaymentTypeDisplayName(paymentType);
};

export const DepositScheduleWidget: React.FC<DepositScheduleWidgetProps> = ({ className = '', onRefresh }) => {
  const [depositSchedules, setDepositSchedules] = useState<DepositSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadDepositSchedules = async () => {
    setLoading(true);
    try {
      // SalesService에서 실제 입금 예정 데이터 가져오기
      const data = SalesService.getDepositSchedule();
      setDepositSchedules(data);
      onRefresh?.(); // 부모 컴포넌트 새로고침 알림
    } catch (error) {
      console.error('입금 예정 데이터를 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepositSchedules();
  }, []);

  const handleMarkAsDeposited = async (expectedDate: string) => {
    try {
      const changedCount = SalesService.markDateAsDeposited(expectedDate);
      if (changedCount > 0) {
        await loadDepositSchedules(); // 데이터 새로고침
        setSelectedDate(null); // 상세 보기 닫기
      }
    } catch (error) {
      console.error('입금 완료 처리 실패:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '내일';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const getTotalPendingAmount = (): number => {
    return depositSchedules.reduce((sum, schedule) => sum + schedule.total_amount, 0);
  };

  const selectedSchedule = selectedDate
    ? depositSchedules.find(schedule => schedule.date === selectedDate)
    : null;

  if (loading) {
    return (
      <div className={`deposit-schedule-widget ${className}`}>
        <div className="widget-header">
          <div className="header-title">
            <span className="title-icon">💰</span>
            <span className="title-text">입금 예정</span>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`deposit-schedule-widget ${className}`}>
      <div className="widget-header">
        <div className="header-title">
          <span className="title-icon">💰</span>
          <span className="title-text">입금 예정</span>
        </div>
        <div className="total-amount">
          <span className="amount-label">총</span>
          <span className="amount-value">{formatCurrency(getTotalPendingAmount())}</span>
        </div>
      </div>

      <div className="schedule-list">
        {depositSchedules.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>예정된 입금이 없습니다</p>
          </div>
        ) : (
          depositSchedules.map((schedule) => (
            <div
              key={schedule.date}
              className={`schedule-item ${selectedDate === schedule.date ? 'active' : ''}`}
              onClick={() => setSelectedDate(selectedDate === schedule.date ? null : schedule.date)}
            >
              <div className="schedule-date">
                <span className="date-text">{formatDate(schedule.date)}</span>
                <span className="date-full">{schedule.date}</span>
              </div>
              <div className="schedule-amount">
                {formatCurrency(schedule.total_amount)}
              </div>
              <div className="schedule-count">
                {schedule.orders.length}건
              </div>
              <div className="expand-icon">
                {selectedDate === schedule.date ? '▼' : '▶'}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSchedule && (
        <div className="schedule-details">
          <div className="details-header">
            <div className="details-title">
              <h4>{formatDate(selectedSchedule.date)} 입금 상세</h4>
              <div className="details-actions">
                <button
                  className="deposit-complete-btn"
                  onClick={() => handleMarkAsDeposited(selectedSchedule.date)}
                  disabled={loading}
                >
                  💰 입금완료
                </button>
                <button
                  className="close-btn"
                  onClick={() => setSelectedDate(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          <div className="orders-list">
            {selectedSchedule.orders.map((order) => (
              <div key={order.id} className={`order-item ${getPaymentColorClass(order.payment_type)}`}>
                <div className="order-payment">
                  <span className="payment-icon">{SalesService.getPaymentTypeIcon(order.payment_type)}</span>
                  <span className="payment-type">{getPaymentTypeDisplayName(order.payment_type)}</span>
                </div>
                <div className="order-amount">
                  {formatCurrency(order.amount)}
                </div>
                <div className="order-time">
                  {new Date(order.order_date).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};