import React, { useState, useEffect } from 'react';
import { UserAuthService, User } from '../services/userAuthService';
import UserLogin from './UserLogin';
import WorkDashboard from './WorkDashboard';
import WorkTimeInput from './WorkTimeInput';
import '../styles/components/UserApp.css';

type UserPageType = 'dashboard' | 'input';

const UserApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<(User & { loginTime: number }) | null>(null);
  const [currentPage, setCurrentPage] = useState<UserPageType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 인증 상태 확인
    const checkAuth = () => {
      const authStatus = UserAuthService.isAuthenticated();
      const user = UserAuthService.getCurrentUser();

      setIsAuthenticated(authStatus);
      setCurrentUser(user);
      setIsLoading(false);
    };

    checkAuth();

    // 세션 만료를 주기적으로 체크 (1분마다)
    const interval = setInterval(() => {
      const authStatus = UserAuthService.isAuthenticated();
      const user = UserAuthService.getCurrentUser();

      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus);
        setCurrentUser(user);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    const user = UserAuthService.getCurrentUser();
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('정말 로그아웃하시겠습니까?');
    if (confirmLogout) {
      UserAuthService.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentPage('dashboard');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <WorkDashboard />;
      case 'input':
        return <WorkTimeInput />;
      default:
        return <WorkDashboard />;
    }
  };

  // 초기 로딩 상태
  if (isLoading) {
    return (
      <div className="user-app-loading">
        <div className="loading-content">
          <div className="loading-icon">⚙️</div>
          <div className="loading-text">근무시간 관리 시스템 시작 중...</div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated || !currentUser) {
    return <UserLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 인증된 경우 메인 앱 표시
  return (
    <div className="user-app">
      {/* Navigation */}
      <nav className="user-nav">
        <div className="nav-header">
          <div className="brand">
            <div className="brand-icon">⏰</div>
            <div className="brand-content">
              <h1 className="brand-title">근무시간 관리</h1>
              <p className="brand-subtitle">Work Time Tracker</p>
            </div>
          </div>
        </div>

        <div className="nav-menu">
          <div className="menu-section">
            <div className="menu-label">메인 메뉴</div>
            <button
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">대시보드</span>
            </button>
            <button
              className={`nav-item ${currentPage === 'input' ? 'active' : ''}`}
              onClick={() => setCurrentPage('input')}
            >
              <span className="nav-icon">⏰</span>
              <span className="nav-text">근무시간 입력</span>
            </button>
          </div>
        </div>

        <div className="nav-footer">
          {/* User Info */}
          <div className="user-info">
            <div className="user-details">
              <div className="user-avatar">👤</div>
              <div className="user-text">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-email">{currentUser.email}</span>
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

          {/* Version Info */}
          <div className="version-info">
            <span className="version-text">v1.0.0</span>
            <span className="company">© Work Tracker</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="user-main">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default UserApp;