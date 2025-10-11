import React, { useState, useEffect } from 'react';
import { SalesService } from '../services/salesService';
import { InventoryService } from '../services/inventoryService';
import { OrderService } from '../services/orderService';
import { IngredientService } from '../services/ingredientService';
import { MenuService } from '../services/menuService';
import { SalesAnalytics, InventoryWithDetails, Order } from '../types';
import { DepositScheduleWidget } from '../components/DepositScheduleWidget';

const DashboardPage: React.FC = () => {
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryWithDetails[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalMenus: 0,
    totalIngredients: 0,
    totalOrders: 0,
    totalInventoryItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 매출 분석 데이터
      const salesData = SalesService.getSalesAnalytics();
      setSalesAnalytics(salesData);

      // 낮은 재고 항목
      const lowStock = InventoryService.getLowStockItems();
      setLowStockItems(lowStock);

      // 최근 주문 (최근 5개)
      const orders = OrderService.getAllOrders().slice(0, 5);
      setRecentOrders(orders);

      // 시스템 통계
      const menus = MenuService.getAllMenus();
      const ingredients = IngredientService.getAllIngredients();
      const allOrders = OrderService.getAllOrders();
      const inventories = InventoryService.getAllInventoryWithDetails();

      setSystemStats({
        totalMenus: menus.length,
        totalIngredients: ingredients.length,
        totalOrders: allOrders.length,
        totalInventoryItems: inventories.length
      });

    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 비즈니스 대시보드</h1>
          <p>매장 운영 현황을 한눈에 확인하세요</p>
        </div>
        <button className="refresh-button" onClick={loadDashboardData}>
          <span>🔄</span>
          새로고침
        </button>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(salesAnalytics?.today_sales || 0)}</div>
            <div className="stat-label">오늘 매출</div>
            <div className="stat-change positive">
              {salesAnalytics?.today_sales && salesAnalytics.today_sales > 0 ? '+12.5%' : '시작'}
            </div>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.totalOrders}</div>
            <div className="stat-label">총 주문수</div>
            <div className="stat-change positive">+8.2%</div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(salesAnalytics?.pending_deposits || 0)}</div>
            <div className="stat-label">입금 대기</div>
            <div className="stat-change neutral">
              {salesAnalytics?.pending_deposits && salesAnalytics.pending_deposits > 0 ? '대기중' : '없음'}
            </div>
          </div>
        </div>

        <div className="stat-card alerts">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{lowStockItems.length}</div>
            <div className="stat-label">재고 알림</div>
            <div className={`stat-change ${lowStockItems.length > 0 ? 'negative' : 'positive'}`}>
              {lowStockItems.length > 0 ? '주의 필요' : '정상'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Sales Overview */}
        <div className="dashboard-card sales-overview">
          <div className="card-header">
            <h3>📈 매출 현황</h3>
            <span className="card-badge">실시간</span>
          </div>
          <div className="card-content">
            <div className="sales-metrics">
              <div className="metric">
                <div className="metric-label">이번 주</div>
                <div className="metric-value">{formatCurrency(salesAnalytics?.this_week_sales || 0)}</div>
              </div>
              <div className="metric">
                <div className="metric-label">이번 달</div>
                <div className="metric-value">{formatCurrency(salesAnalytics?.this_month_sales || 0)}</div>
              </div>
              <div className="metric">
                <div className="metric-label">전체</div>
                <div className="metric-value">{formatCurrency(salesAnalytics?.total_sales || 0)}</div>
              </div>
            </div>

            {salesAnalytics && salesAnalytics.payment_type_breakdown.length > 0 && (
              <div className="payment-breakdown">
                <h4>결제 채널별</h4>
                <div className="payment-list">
                  {salesAnalytics.payment_type_breakdown.map(item => (
                    <div key={item.type} className="payment-item">
                      <span className="payment-type">
                        {SalesService.getPaymentTypeIcon(item.type)}
                        {SalesService.getPaymentTypeDisplayName(item.type)}
                      </span>
                      <span className="payment-amount">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="dashboard-card inventory-alerts">
          <div className="card-header">
            <h3>🚨 재고 알림</h3>
            <span className={`card-badge ${lowStockItems.length > 0 ? 'warning' : 'success'}`}>
              {lowStockItems.length > 0 ? `${lowStockItems.length}건` : '정상'}
            </span>
          </div>
          <div className="card-content">
            {lowStockItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <p>모든 재고가 충분합니다</p>
              </div>
            ) : (
              <div className="alert-list">
                {lowStockItems.slice(0, 5).map(item => (
                  <div key={item.id} className="alert-item">
                    <div className="alert-info">
                      <div className="alert-name">{item.ingredient_name}</div>
                      <div className="alert-details">
                        현재: {item.current_stock}{item.ingredient_unit} /
                        최소: {item.min_stock}{item.ingredient_unit}
                      </div>
                    </div>
                    <div className="alert-status critical">
                      긴급
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <div className="more-alerts">
                    +{lowStockItems.length - 5}개 더 있음
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deposit Schedule */}
        <DepositScheduleWidget
          className="dashboard-deposit-widget"
          onRefresh={loadDashboardData}
        />

        {/* Recent Orders */}
        <div className="dashboard-card recent-orders">
          <div className="card-header">
            <h3>📋 최근 주문</h3>
            <button className="view-all-btn">전체보기</button>
          </div>
          <div className="card-content">
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p>최근 주문이 없습니다</p>
              </div>
            ) : (
              <div className="order-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div className="order-id">주문 #{order.id}</div>
                      <div className="order-details">
                        {SalesService.getPaymentTypeIcon(order.payment_type)}
                        {formatDate(order.order_date || '')}
                      </div>
                    </div>
                    <div className="order-amount">{formatCurrency(order.total_amount)}</div>
                    <div className={`order-status ${order.is_deposited ? 'completed' : 'pending'}`}>
                      {order.is_deposited ? '입금완료' : '대기중'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Overview */}
        <div className="dashboard-card system-overview">
          <div className="card-header">
            <h3>⚙️ 시스템 현황</h3>
          </div>
          <div className="card-content">
            <div className="system-stats">
              <div className="system-stat">
                <div className="stat-icon-sm">🍽️</div>
                <div className="stat-details">
                  <div className="stat-number">{systemStats.totalMenus}</div>
                  <div className="stat-text">등록된 메뉴</div>
                </div>
              </div>

              <div className="system-stat">
                <div className="stat-icon-sm">🥬</div>
                <div className="stat-details">
                  <div className="stat-number">{systemStats.totalIngredients}</div>
                  <div className="stat-text">관리 재료</div>
                </div>
              </div>

              <div className="system-stat">
                <div className="stat-icon-sm">📦</div>
                <div className="stat-details">
                  <div className="stat-number">{systemStats.totalInventoryItems}</div>
                  <div className="stat-text">재고 품목</div>
                </div>
              </div>

              <div className="system-stat">
                <div className="stat-icon-sm">💳</div>
                <div className="stat-details">
                  <div className="stat-number">{salesAnalytics?.payment_type_breakdown.length || 0}</div>
                  <div className="stat-text">결제 채널</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modern-dashboard {
          padding: var(--space-8);
          max-width: 1400px;
          margin: 0 auto;
          background: var(--gray-50);
          min-height: 100vh;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          color: var(--gray-600);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-8);
          padding: var(--space-8);
          background: white;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
        }

        .header-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-2);
        }

        .header-content p {
          color: var(--gray-600);
          font-size: 1.1rem;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          background: var(--primary-600);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .refresh-button:hover {
          background: var(--primary-700);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .stat-card {
          background: white;
          padding: var(--space-6);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-card.revenue::before {
          background: linear-gradient(90deg, var(--success-500), var(--success-600));
        }

        .stat-card.orders::before {
          background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
        }

        .stat-card.pending::before {
          background: linear-gradient(90deg, var(--warning-500), var(--warning-600));
        }

        .stat-card.alerts::before {
          background: linear-gradient(90deg, var(--error-500), var(--error-600));
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          color: var(--gray-600);
          font-size: 0.875rem;
          margin-bottom: var(--space-1);
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 600;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }

        .stat-change.positive {
          background: var(--success-50);
          color: var(--success-600);
        }

        .stat-change.negative {
          background: var(--error-50);
          color: var(--error-600);
        }

        .stat-change.neutral {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-6);
        }

        .dashboard-card {
          background: white;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
          overflow: hidden;
          transition: all var(--transition-fast);
        }

        .dashboard-card:hover {
          box-shadow: var(--shadow-lg);
        }

        .card-header {
          padding: var(--space-6);
          border-bottom: 1px solid var(--gray-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--gray-50);
        }

        .card-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--gray-900);
          margin: 0;
        }

        .card-badge {
          padding: var(--space-1) var(--space-3);
          background: var(--primary-100);
          color: var(--primary-700);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-badge.warning {
          background: var(--warning-100);
          color: var(--warning-700);
        }

        .card-badge.success {
          background: var(--success-100);
          color: var(--success-700);
        }

        .view-all-btn {
          background: none;
          border: none;
          color: var(--primary-600);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .view-all-btn:hover {
          background: var(--primary-50);
        }

        .card-content {
          padding: var(--space-6);
        }

        .sales-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .metric {
          text-align: center;
          padding: var(--space-4);
          background: var(--gray-50);
          border-radius: var(--radius-lg);
        }

        .metric-label {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-bottom: var(--space-1);
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .payment-breakdown h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: var(--space-4);
        }

        .payment-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .payment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3);
          background: var(--gray-50);
          border-radius: var(--radius-md);
        }

        .payment-type {
          font-size: 0.875rem;
          color: var(--gray-700);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .payment-amount {
          font-weight: 600;
          color: var(--gray-900);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
          color: var(--gray-500);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-4);
        }

        .alert-list,
        .order-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .alert-item,
        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          background: var(--gray-50);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--error-500);
        }

        .order-item {
          border-left-color: var(--primary-500);
        }

        .alert-info,
        .order-info {
          flex: 1;
        }

        .alert-name,
        .order-id {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: var(--space-1);
        }

        .alert-details,
        .order-details {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .alert-status,
        .order-status {
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .alert-status.critical {
          background: var(--error-100);
          color: var(--error-700);
        }

        .order-status.completed {
          background: var(--success-100);
          color: var(--success-700);
        }

        .order-status.pending {
          background: var(--warning-100);
          color: var(--warning-700);
        }

        .order-amount {
          font-weight: 700;
          color: var(--gray-900);
          margin-right: var(--space-4);
        }

        .more-alerts {
          text-align: center;
          padding: var(--space-3);
          color: var(--gray-500);
          font-size: 0.875rem;
          background: var(--gray-100);
          border-radius: var(--radius-md);
        }

        .system-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
        }

        .system-stat {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--gray-50);
          border-radius: var(--radius-lg);
        }

        .stat-icon-sm {
          font-size: 1.5rem;
        }

        .stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .stat-text {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        /* Dashboard Deposit Widget Styles - Complete redesign for dashboard integration */
        .dashboard-deposit-widget {
          background: white;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
          overflow: hidden;
          transition: all var(--transition-fast);
        }

        .dashboard-deposit-widget:hover {
          box-shadow: var(--shadow-lg);
        }

        .dashboard-deposit-widget .widget-header {
          padding: var(--space-6);
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
          margin-bottom: 0;
        }

        .dashboard-deposit-widget .header-title {
          margin-bottom: var(--space-2);
        }

        .dashboard-deposit-widget .title-icon {
          font-size: 1.125rem;
        }

        .dashboard-deposit-widget .title-text {
          color: var(--gray-900);
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .dashboard-deposit-widget .total-amount {
          align-items: flex-end;
          gap: var(--space-1);
        }

        .dashboard-deposit-widget .amount-label {
          color: var(--gray-600);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .dashboard-deposit-widget .amount-value {
          color: var(--success-600);
          -webkit-text-fill-color: var(--success-600);
          font-size: 1.25rem;
          font-weight: 700;
        }

        .dashboard-deposit-widget .schedule-list {
          padding: var(--space-6);
          max-height: 350px;
          gap: var(--space-3);
        }

        .dashboard-deposit-widget .schedule-item {
          background: var(--gray-50);
          border: 2px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: all var(--transition-fast);
        }

        .dashboard-deposit-widget .schedule-item:hover {
          background: var(--gray-100);
          border-color: var(--primary-400);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .dashboard-deposit-widget .schedule-item.active {
          background: var(--primary-50);
          border-color: var(--primary-500);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
        }

        .dashboard-deposit-widget .date-text {
          color: var(--gray-900);
          font-weight: 600;
          font-size: 1rem;
        }

        .dashboard-deposit-widget .date-full {
          color: var(--gray-500);
          font-size: 0.75rem;
        }

        .dashboard-deposit-widget .schedule-amount {
          color: var(--success-600);
          font-weight: 700;
          font-size: 1rem;
        }

        .dashboard-deposit-widget .schedule-count {
          background: white;
          color: var(--gray-600);
          border: 1px solid var(--gray-200);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .dashboard-deposit-widget .expand-icon {
          color: var(--gray-500);
          font-size: 0.875rem;
        }

        .dashboard-deposit-widget .schedule-details {
          margin: 0;
          background: linear-gradient(135deg, var(--primary-50), var(--blue-50));
          border: 1px solid var(--primary-200);
          border-radius: 0;
          padding: var(--space-6);
          border-top: 1px solid var(--gray-200);
        }

        .dashboard-deposit-widget .details-header h4 {
          color: var(--primary-700);
          font-size: 1rem;
          font-weight: 600;
        }

        .dashboard-deposit-widget .deposit-complete-btn {
          background: linear-gradient(135deg, var(--success-500), var(--success-600));
          font-size: 0.75rem;
          padding: var(--space-2) var(--space-3);
        }

        .dashboard-deposit-widget .close-btn {
          padding: var(--space-2);
          font-size: 1rem;
        }

        .dashboard-deposit-widget .order-item {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }

        .dashboard-deposit-widget .loading-state,
        .dashboard-deposit-widget .empty-state {
          padding: var(--space-8);
          text-align: center;
          color: var(--gray-500);
        }

        .dashboard-deposit-widget .empty-icon {
          font-size: 2.5rem;
          margin-bottom: var(--space-4);
          opacity: 0.6;
        }

        .dashboard-deposit-widget .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--gray-200);
          border-top: 2px solid var(--primary-500);
          margin-bottom: var(--space-4);
        }

        @media (max-width: 768px) {
          .modern-dashboard {
            padding: var(--space-4);
          }

          .dashboard-header {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }

          .quick-stats {
            grid-template-columns: 1fr;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .sales-metrics {
            grid-template-columns: 1fr;
          }

          .system-stats {
            grid-template-columns: 1fr;
          }

          /* Mobile styles for deposit widget */
          .dashboard-deposit-widget .widget-header {
            padding: var(--space-4);
            flex-direction: column;
            gap: var(--space-2);
            align-items: stretch;
          }

          .dashboard-deposit-widget .total-amount {
            align-items: center;
          }

          .dashboard-deposit-widget .schedule-list {
            padding: var(--space-4);
            max-height: 300px;
          }

          .dashboard-deposit-widget .schedule-item {
            grid-template-columns: 1fr auto;
            gap: var(--space-2);
            padding: var(--space-3);
          }

          .dashboard-deposit-widget .schedule-count,
          .dashboard-deposit-widget .expand-icon {
            display: none;
          }

          .dashboard-deposit-widget .schedule-details {
            padding: var(--space-4);
          }

          .dashboard-deposit-widget .details-title {
            flex-direction: column;
            gap: var(--space-3);
            align-items: stretch;
          }

          .dashboard-deposit-widget .details-actions {
            justify-content: center;
          }

          .dashboard-deposit-widget .order-item {
            grid-template-columns: 1fr auto;
            gap: var(--space-2);
          }

          .dashboard-deposit-widget .order-time {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;