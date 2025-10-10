import React, { useState } from 'react';
import OrderSystem from '../components/OrderSystem';
import OrderManagement from '../components/OrderManagement';

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'order' | 'manage'>('order');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOrderComplete = () => {
    setRefreshKey(prev => prev + 1);
    // 주문 완료 후 관리 탭으로 자동 전환 (선택사항)
    // setActiveTab('manage');
  };

  const handleOrderUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>🍽️ 주문 시스템</h1>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'order' ? 'active' : ''}`}
            onClick={() => setActiveTab('order')}
          >
            📝 새 주문
          </button>
          <button
            className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            📋 주문 관리
          </button>
        </div>
      </div>

      <div className="page-content">
        {activeTab === 'order' && (
          <OrderSystem
            key={`order-${refreshKey}`}
            onOrderComplete={handleOrderComplete}
          />
        )}
        {activeTab === 'manage' && (
          <OrderManagement
            key={`manage-${refreshKey}`}
            onOrderUpdate={handleOrderUpdate}
          />
        )}
      </div>

      <style>{`
        .orders-page {
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .page-header {
          background: white;
          padding: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin: 0 0 1.5rem 0;
          color: #333;
          text-align: center;
        }

        .tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .tab {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 25px;
          padding: 0.75rem 2rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #6c757d;
        }

        .tab:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }

        .tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .page-content {
          min-height: calc(100vh - 200px);
        }

        @media (max-width: 768px) {
          .page-header {
            padding: 1rem;
          }

          .tabs {
            flex-direction: column;
            align-items: center;
          }

          .tab {
            width: 200px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;