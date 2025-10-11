import React, { useState, useEffect } from 'react';
import './App.css';
import { initDatabase } from './database/database';
import { insertDummyData } from './data/dummyData'; // 더미 데이터 - 나중에 삭제 예정
import { AuthService } from './services/authService';
import ProtectedRoute from './components/ProtectedRoute';
import UserApp from './components/UserApp';
import DashboardPage from './pages/DashboardPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { MenusPage } from './pages/MenusPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import SalesPage from './pages/SalesPage';
import SalesCalendarPage from "./pages/SalesCalendarPage";
import UserManagementPage from './pages/UserManagementPage';

type PageType = 'dashboard' | 'ingredients' | 'menus' | 'inventory' | 'orders' | 'sales' | 'sales-calendar' | 'users';
type AppMode = 'select' | 'admin' | 'user';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('select');
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ username: string; loginTime: number } | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');

        // 더미 데이터 추가 (실제 운영 시 삭제 예정)
        insertDummyData();

        // 현재 사용자 정보 설정
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('정말 로그아웃하시겠습니까?');
    if (confirmLogout) {
      AuthService.logout();
      setCurrentUser(null);
      window.location.reload(); // 페이지를 새로고침하여 로그인 화면으로 돌아감
    }
  };

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
      case 'sales-calendar':
        return <SalesCalendarPage/>
      case 'users':
        return <UserManagementPage/>
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

  // 앱 모드 선택 화면
  if (appMode === 'select') {
    return (
      <div className="app-mode-select">
        <div className="select-background">
          <div className="select-container">
            <div className="select-header">
              <h1 className="select-title">시스템 선택</h1>
              <p className="select-subtitle">접근할 시스템을 선택해주세요</p>
            </div>

            <div className="mode-options">
              <button
                className="mode-option admin"
                onClick={() => setAppMode('admin')}
              >
                <div className="option-icon">👨‍💼</div>
                <h3 className="option-title">관리자 시스템</h3>
                <p className="option-description">
                  매장 전체 운영 관리<br />
                  재고, 메뉴, 매출 등 종합 관리
                </p>
                <div className="option-features">
                  <span className="feature">📊 대시보드</span>
                  <span className="feature">📦 재고관리</span>
                  <span className="feature">🍽️ 메뉴관리</span>
                  <span className="feature">💰 매출관리</span>
                </div>
              </button>

              <button
                className="mode-option user"
                onClick={() => setAppMode('user')}
              >
                <div className="option-icon">👥</div>
                <h3 className="option-title">직원 시스템</h3>
                <p className="option-description">
                  개인 근무시간 관리<br />
                  출퇴근 및 근무 기록
                </p>
                <div className="option-features">
                  <span className="feature">⏰ 근무시간 입력</span>
                  <span className="feature">📊 근무 대시보드</span>
                  <span className="feature">📅 근무 기록</span>
                  <span className="feature">📈 근무 통계</span>
                </div>
              </button>
            </div>

            <div className="select-footer">
              <p className="footer-text">각 시스템은 별도의 인증이 필요합니다</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 사용자 앱
  if (appMode === 'user') {
    return <UserApp />;
  }

  // 관리자 앱 (기존 코드)
  return (
    <ProtectedRoute>
      <div className="App">
        <nav className="app-nav">
          <div className="nav-header">
            <div className="brand">
              <div className="brand-icon">🏪</div>
              <div className="brand-content">
                <h1 className="brand-title">매장 관리 시스템</h1>
                <p className="brand-subtitle">Store Management</p>
              </div>
            </div>
            <button
              className="back-to-select-btn"
              onClick={() => setAppMode('select')}
              title="시스템 선택으로 돌아가기"
            >
              🔙
            </button>
          </div>
          <div className="nav-menu">
            <div className="menu-section">
              <div className="menu-label">대시보드</div>
              <button
                className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">대시보드</span>
              </button>
            </div>

            <div className="menu-section">
              <div className="menu-label">운영 관리</div>
              <button
                className={`nav-item ${currentPage === 'ingredients' ? 'active' : ''}`}
                onClick={() => setCurrentPage('ingredients')}
              >
                <span className="nav-icon">🥬</span>
                <span className="nav-text">재료 관리</span>
              </button>
              <button
                className={`nav-item ${currentPage === 'menus' ? 'active' : ''}`}
                onClick={() => setCurrentPage('menus')}
              >
                <span className="nav-icon">🍽️</span>
                <span className="nav-text">메뉴 관리</span>
              </button>
              <button
                className={`nav-item ${currentPage === 'inventory' ? 'active' : ''}`}
                onClick={() => setCurrentPage('inventory')}
              >
                <span className="nav-icon">📦</span>
                <span className="nav-text">재고 관리</span>
              </button>
            </div>

            <div className="menu-section">
              <div className="menu-label">주문 & 매출</div>
              <button
                className={`nav-item ${currentPage === 'orders' ? 'active' : ''}`}
                onClick={() => setCurrentPage('orders')}
              >
                <span className="nav-icon">🛒</span>
                <span className="nav-text">주문 시스템</span>
              </button>
              <button
                className={`nav-item ${currentPage === 'sales' ? 'active' : ''}`}
                onClick={() => setCurrentPage('sales')}
              >
                <span className="nav-icon">💰</span>
                <span className="nav-text">매출 관리</span>
              </button>
              <button className={`nav-item ${currentPage === 'sales-calendar' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('sales-calendar')}
              >
                <span className="nav-icon">🗓️</span>
                <span className="nav-text">매출 달력</span>
              </button>
            </div>

            <div className="menu-section">
              <div className="menu-label">인사 관리</div>
              <button
                className={`nav-item ${currentPage === 'users' ? 'active' : ''}`}
                onClick={() => setCurrentPage('users')}
              >
                <span className="nav-icon">👥</span>
                <span className="nav-text">직원 관리</span>
              </button>
            </div>
          </div>

          <div className="nav-footer">
            {currentUser && (
              <div className="user-info">
                <div className="user-details">
                  <div className="user-avatar">👤</div>
                  <div className="user-text">
                    <span className="user-name">관리자 ({currentUser.username})</span>
                    <span className="login-time">
                      로그인: {new Date(currentUser.loginTime).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="로그아웃">
                  🚪
                </button>
              </div>
            )}
            <div className="version-info">
              <span className="version-text">v1.0.0</span>
              <span className="company">© Store System</span>
            </div>
          </div>
        </nav>

        <main className="app-main">
          {renderCurrentPage()}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default App;
