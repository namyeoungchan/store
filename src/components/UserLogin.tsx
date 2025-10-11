import React, { useState, useEffect } from 'react';
import { UserAuthService } from '../services/userAuthService';
import '../styles/components/UserLogin.css';

interface UserLoginProps {
  onLoginSuccess: () => void;
}

const UserLogin: React.FC<UserLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ email: string; name: string; hasTemp: boolean }>>([]);

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      const users = await UserAuthService.getLoginEnabledUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await UserAuthService.login(email, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || '로그인에 실패했습니다.');
        setPassword(''); // 실패시 비밀번호 필드 초기화
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(''); // 입력시 에러 메시지 제거
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(''); // 입력시 에러 메시지 제거
  };

  const quickLogin = (userEmail: string, isTemp: boolean) => {
    setEmail(userEmail);
    if (isTemp) {
      // 임시 비밀번호 사용자의 경우 비밀번호를 안내
      alert('이 사용자는 임시 비밀번호를 사용합니다.\n관리자에게 임시 비밀번호를 확인하세요.');
      setPassword('');
    } else {
      setPassword('');
    }
    setError('');
  };

  return (
    <div className="user-login-container">
      <div className="user-login-background">
        <div className="user-login-card">
          <div className="user-login-header">
            <div className="user-login-icon">👨‍💼</div>
            <h1>직원 로그인</h1>
            <p>근무시간 관리 시스템</p>
          </div>

          <form onSubmit={handleSubmit} className="user-login-form">
            <div className="user-form-group">
              <label htmlFor="email" className="user-form-label">
                이메일
              </label>
              <div className="user-input-wrapper">
                <span className="user-input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="이메일을 입력하세요"
                  className="user-form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="user-form-group">
              <label htmlFor="password" className="user-form-label">
                비밀번호
              </label>
              <div className="user-input-wrapper">
                <span className="user-input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="비밀번호를 입력하세요"
                  className="user-form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="user-error-message">
                <span className="user-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`user-login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              {isLoading ? (
                <>
                  <span className="user-loading-spinner">⟳</span>
                  로그인 중...
                </>
              ) : (
                <>
                  <span className="user-login-button-icon">🚀</span>
                  로그인
                </>
              )}
            </button>
          </form>

          {/* Quick Login Demo */}
          {availableUsers.length > 0 && (
            <div className="quick-login-section">
              <div className="quick-login-header">
                <span className="quick-login-icon">⚡</span>
                <span>빠른 로그인 (등록된 직원)</span>
              </div>
              <div className="quick-login-buttons">
                {availableUsers.slice(0, 4).map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    className={`quick-login-btn ${user.hasTemp ? 'temp-password' : ''}`}
                    onClick={() => quickLogin(user.email, user.hasTemp)}
                    disabled={isLoading}
                  >
                    {user.name}
                    {user.hasTemp && <span className="temp-badge">임시</span>}
                  </button>
                ))}
              </div>
              <div className="demo-info">
                <span className="demo-icon">💡</span>
                <span>
                  {availableUsers.some(u => u.hasTemp)
                    ? '임시 비밀번호가 있는 계정은 관리자에게 문의하세요'
                    : '관리자가 등록한 직원 계정들입니다'
                  }
                </span>
              </div>
            </div>
          )}

          <div className="user-login-footer">
            <div className="user-security-info">
              <span className="user-security-icon">🛡️</span>
              <span>안전한 근무시간 기록 시스템</span>
            </div>
          </div>
        </div>

        {/* Background Animation Elements */}
        <div className="user-bg-animation">
          <div className="user-floating-shape shape-1">⏰</div>
          <div className="user-floating-shape shape-2">📅</div>
          <div className="user-floating-shape shape-3">👥</div>
          <div className="user-floating-shape shape-4">💼</div>
          <div className="user-floating-shape shape-5">📊</div>
          <div className="user-floating-shape shape-6">🏢</div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;