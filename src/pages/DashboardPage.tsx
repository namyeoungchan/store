import React, { useState, useEffect } from 'react';
import { SalesService } from '../services/salesService';
import { InventoryService } from '../services/inventoryService';
import { OrderService } from '../services/orderService';
import { IngredientService } from '../services/ingredientService';
import { MenuService } from '../services/menuService';
// DashboardPage.scss import
import '@Style/pages/DashboardPage.scss';

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
      const salesData = await SalesService.getSalesAnalytics();
      setSalesAnalytics(salesData);

      // 낮은 재고 항목
      const lowStock = await InventoryService.getLowStockItems();
      setLowStockItems(lowStock);

      // 최근 주문 (최근 5개)
      const orders = await OrderService.getAllOrders();
      setRecentOrders(orders.slice(0, 5));

      // 시스템 통계
      const menus = await MenuService.getAllMenus();
      const ingredients = await IngredientService.getAllIngredients();
      const allOrders = await OrderService.getAllOrders();
      const inventories = await InventoryService.getAllInventoryWithDetails();

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
    </div>
  );
};

export default DashboardPage;