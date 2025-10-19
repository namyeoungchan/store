import React, { useState, Suspense, lazy } from 'react';

// 탭 기반으로 조건부 렌더링되는 큰 컴포넌트들은 lazy loading 적용
const OrderSystem = lazy(() => import('../components/OrderSystem'));
const OrderManagement = lazy(() => import('../components/OrderManagement'));

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'order' | 'manage'>('order');
  const [refreshKey, setRefreshKey] = useState(0);

  // 컴포넌트 로딩을 위한 fallback
  const ComponentLoader = () => (
    <div className="component-loading">
      <div className="loading-spinner"></div>
      <p>컴포넌트를 불러오는 중...</p>
    </div>
  );

  const handleOrderComplete = () => {
    setRefreshKey(prev => prev + 1);
    // 주문 완료 후 관리 탭으로 자동 전환 (선택사항)
    // setActiveTab('manage');
  };

  const handleOrderUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="modern-orders-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🍽️</span>
            주문 시스템
          </h1>
          <p className="page-subtitle">메뉴 주문과 주문 내역을 관리하세요</p>
        </div>
        <div className="tab-navigation">
          <button
            className={`nav-tab ${activeTab === 'order' ? 'active' : ''}`}
            onClick={() => setActiveTab('order')}
          >
            <span className="tab-icon">📝</span>
            <span className="tab-text">새 주문</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">주문 관리</span>
          </button>
        </div>
      </div>

      <div className="page-content">
        {activeTab === 'order' && (
          <Suspense fallback={<ComponentLoader />}>
            <OrderSystem
              key={`order-${refreshKey}`}
              onOrderComplete={handleOrderComplete}
            />
          </Suspense>
        )}
        {activeTab === 'manage' && (
          <Suspense fallback={<ComponentLoader />}>
            <OrderManagement
              key={`manage-${refreshKey}`}
              onOrderUpdate={handleOrderUpdate}
            />
          </Suspense>
        )}
      </div>

      <style>{`
        .modern-orders-page {
          padding: var(--space-8);
          background: var(--gray-50);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .page-header {
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-200);
          padding: var(--space-8);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .tab-navigation {
          display: flex;
          gap: var(--space-2);
          background: var(--gray-100);
          padding: var(--space-1);
          border-radius: var(--radius-lg);
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: var(--gray-600);
          transition: all var(--transition-fast);
          position: relative;
        }

        .nav-tab:hover {
          color: var(--gray-800);
          background: var(--gray-200);
        }

        .nav-tab.active {
          background: var(--primary-600);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .nav-tab.active:hover {
          background: var(--primary-700);
          color: white;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-text {
          font-size: 0.95rem;
        }

        .page-content {
          flex: 1;
          min-height: 600px;
        }

        @media (max-width: 768px) {
          .modern-orders-page {
            padding: var(--space-4);
            gap: var(--space-4);
          }

          .page-header {
            flex-direction: column;
            gap: var(--space-6);
            align-items: stretch;
          }

          .tab-navigation {
            justify-content: center;
          }

          .nav-tab {
            flex: 1;
            justify-content: center;
            min-width: 120px;
          }

          .page-title {
            font-size: 1.5rem;
            justify-content: center;
          }

          .page-subtitle {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;