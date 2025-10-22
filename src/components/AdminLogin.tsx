import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import '../styles/components/AdminLogin.css';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 간단한 지연 효과로 로딩 상태 시뮬레이션
    setTimeout(() => {
      const isSuccess = AuthService.login(username, password);

      if (isSuccess) {
        onLoginSuccess();
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        setPassword(''); // 실패시 비밀번호 필드 초기화
      }

      setIsLoading(false);
    }, 800);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError(''); // 입력시 에러 메시지 제거
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(''); // 입력시 에러 메시지 제거
  };

  return (
    <div className="admin-login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">🔐</div>
            <h1>관리자 로그인</h1>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                관리자 ID
              </label>
              <div className="input-wrapper">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="관리자 아이디를 입력하세요"
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="비밀번호를 입력하세요"
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner">⟳</span>
                  로그인 중...
                </>
              ) : (
                <>
                  <span className="login-button-icon">🚀</span>
                  로그인
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="security-info">
              <span className="security-icon">🛡️</span>
              <span>보안 연결로 안전하게 보호됩니다</span>
            </div>
          </div>
        </div>

        {/* Background Animation Elements */}
        <div className="bg-animation">
          <div className="floating-shape shape-1">📦</div>
          <div className="floating-shape shape-2">📊</div>
          <div className="floating-shape shape-3">🏪</div>
          <div className="floating-shape shape-4">📈</div>
          <div className="floating-shape shape-5">💼</div>
          <div className="floating-shape shape-6">⚙️</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;