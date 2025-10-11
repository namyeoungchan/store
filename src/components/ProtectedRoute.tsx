import React from 'react';
import { AuthService } from '../services/authService';
import AdminLogin from './AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    // 초기 인증 상태 확인
    const checkAuth = () => {
      const authStatus = AuthService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setIsChecking(false);
    };

    checkAuth();

    // 세션 만료를 주기적으로 체크 (1분마다)
    const interval = setInterval(() => {
      const authStatus = AuthService.isAuthenticated();
      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // 초기 로딩 상태
  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.25rem',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            fontSize: '3rem',
            animation: 'spin 2s linear infinite'
          }}>
            ⚙️
          </div>
          <div>시스템 로딩 중...</div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 인증된 경우 보호된 컴포넌트 표시
  return <>{children}</>;
};

export default ProtectedRoute;