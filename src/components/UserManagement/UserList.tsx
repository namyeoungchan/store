import React from 'react';
import { User } from '../../types';

interface UserListProps {
  users: User[];
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetPassword?: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onResetPassword
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatWage = (wage: number) => {
    return `${wage.toLocaleString()}원`;
  };

  return (
    <div className="modern-user-list">
      {/* Header with Actions */}
      <div className="list-header-modern">
        <div className="header-left">
          <h2 className="list-title">팀 멤버</h2>
          <div className="list-stats">
            <span className="stat-item">
              <span className="stat-icon">👤</span>
              <span className="stat-text">{users.length}명</span>
            </span>
            <span className="stat-item">
              <span className="stat-icon">✅</span>
              <span className="stat-text">{users.filter(u => u.is_active).length}명 활성</span>
            </span>
          </div>
        </div>
        <button onClick={onCreateUser} className="modern-add-button">
          <svg className="add-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>새 직원 추가</span>
        </button>
      </div>

      {users.length === 0 ? (
        <div className="modern-empty-state">
          <div className="empty-illustration">
            <div className="empty-circle">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <h3 className="empty-title">아직 등록된 직원이 없어요</h3>
          <p className="empty-description">첫 번째 팀 멤버를 추가하여 시작해보세요</p>
          <button onClick={onCreateUser} className="modern-primary-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            첫 직원 등록하기
          </button>
        </div>
      ) : (
        <div className="modern-user-grid">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`modern-user-card ${!user.is_active ? 'inactive' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="user-avatar-modern">
                  <div className="avatar-gradient">
                    <span className="avatar-text">{user.full_name.charAt(0)}</span>
                  </div>
                  <div className="status-indicator">
                    <div className={`status-dot ${user.is_active ? 'active' : 'inactive'}`}></div>
                  </div>
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.full_name}</h3>
                  <span className="user-position">{user.position}</span>
                  <span className="user-id">@{user.username}</span>
                </div>
                <div className="card-menu">
                  <button className="menu-trigger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <div className="info-text">
                      <span className="info-label">이메일</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div className="info-text">
                      <span className="info-label">연락처</span>
                      <span className="info-value">{user.phone}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <div className="info-text">
                      <span className="info-label">입사일</span>
                      <span className="info-value">{formatDate(user.hire_date)}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="info-text">
                      <span className="info-label">시급</span>
                      <span className="info-value wage">{formatWage(user.hourly_wage)}</span>
                    </div>
                  </div>
                </div>

                {/* Login Status */}
                <div className="login-status">
                  <div className="status-item">
                    <span className="status-label">로그인 권한</span>
                    <div className={`status-badge ${user.password_hash ? 'enabled' : 'disabled'}`}>
                      <div className="badge-dot"></div>
                      {user.password_hash ? '활성' : '비활성'}
                      {user.password_hash && user.is_password_temp && (
                        <span className="temp-badge">임시</span>
                      )}
                    </div>
                  </div>
                  {user.last_login && (
                    <div className="last-login">
                      마지막 로그인: {formatDate(user.last_login)}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="card-actions">
                <button
                  onClick={() => onEditUser(user)}
                  className="action-button edit"
                  title="편집"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>편집</span>
                </button>

                {user.password_hash && onResetPassword && (
                  <button
                    onClick={() => onResetPassword(user)}
                    className="action-button reset"
                    title="비밀번호 재설정"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <polyline points="1 20 1 14 7 14"></polyline>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    <span>비밀번호</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteUser(user)}
                  className="action-button delete"
                  title="삭제"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                  </svg>
                  <span>삭제</span>
                </button>
              </div>

              {/* Card Footer */}
              <div className="card-footer">
                <span className="registration-date">
                  등록일: {formatDate(user.created_at || '')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;