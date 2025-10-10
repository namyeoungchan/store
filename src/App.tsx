import React, { useState, useEffect } from 'react';
import './App.css';
import { initDatabase } from './database/database';
import { insertDummyData } from './data/dummyData'; // 더미 데이터 - 나중에 삭제 예정
import DashboardPage from './pages/DashboardPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { MenusPage } from './pages/MenusPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import SalesPage from './pages/SalesPage';

type PageType = 'dashboard' | 'ingredients' | 'menus' | 'inventory' | 'orders' | 'sales';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');

        // 더미 데이터 추가 (실제 운영 시 삭제 예정)
        insertDummyData();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'ingredients':
        return <IngredientsPage />;
      case 'menus':
        return <MenusPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'orders':
        return <OrdersPage />;
      case 'sales':
        return <SalesPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>매장 재고관리 시스템을 시작하는 중...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="app-nav">
        <div className="nav-header">
          <h1>🏪 매장 재고관리</h1>
        </div>
        <div className="nav-menu">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 대시보드
          </button>
          <button
            className={`nav-item ${currentPage === 'ingredients' ? 'active' : ''}`}
            onClick={() => setCurrentPage('ingredients')}
          >
            🥬 재료 관리
          </button>
          <button
            className={`nav-item ${currentPage === 'menus' ? 'active' : ''}`}
            onClick={() => setCurrentPage('menus')}
          >
            🍽️ 메뉴 관리
          </button>
          <button
            className={`nav-item ${currentPage === 'inventory' ? 'active' : ''}`}
            onClick={() => setCurrentPage('inventory')}
          >
            📦 재고 관리
          </button>
          <button
            className={`nav-item ${currentPage === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentPage('orders')}
          >
            🛒 주문 시스템
          </button>
          <button
            className={`nav-item ${currentPage === 'sales' ? 'active' : ''}`}
            onClick={() => setCurrentPage('sales')}
          >
            💰 매출 관리
          </button>
        </div>
      </nav>

      <main className="app-main">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
