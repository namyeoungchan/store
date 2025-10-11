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
    <div className="user-list-container">
      <div className="list-header">
        <div className="list-title">
          <h2>직원 목록</h2>
          <span className="user-count">총 {users.length}명</span>
        </div>
        <button onClick={onCreateUser} className="primary-button">
          <span className="button-icon">➕</span>
          새 직원 등록
        </button>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>등록된 직원이 없습니다</h3>
          <p>새 직원을 등록해주세요.</p>
          <button onClick={onCreateUser} className="primary-button">
            첫 직원 등록하기
          </button>
        </div>
      ) : (
        <div className="user-grid">
          {users.map(user => (
            <div key={user.id} className={`user-card ${!user.is_active ? 'inactive' : ''}`}>
              <div className="user-card-header">
                <div className="user-avatar">
                  <span className="avatar-text">
                    {user.full_name.charAt(0)}
                  </span>
                  {!user.is_active && (
                    <div className="inactive-badge">비활성</div>
                  )}
                </div>
                <div className="user-basic-info">
                  <h3 className="user-name">{user.full_name}</h3>
                  <span className="user-position">{user.position}</span>
                  <span className="user-username">@{user.username}</span>
                </div>
              </div>

              <div className="user-details">
                <div className="detail-item">
                  <span className="detail-label">📧 이메일</span>
                  <span className="detail-value">{user.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📞 연락처</span>
                  <span className="detail-value">{user.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📅 입사일</span>
                  <span className="detail-value">{formatDate(user.hire_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💰 시급</span>
                  <span className="detail-value">{formatWage(user.hourly_wage)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🔐 로그인 권한</span>
                  <span className={`detail-value ${user.password_hash ? 'login-enabled' : 'login-disabled'}`}>
                    {user.password_hash ? '활성' : '비활성'}
                    {user.password_hash && user.is_password_temp && (
                      <span className="temp-password-badge">임시</span>
                    )}
                  </span>
                </div>
                {user.last_login && (
                  <div className="detail-item">
                    <span className="detail-label">⏰ 마지막 로그인</span>
                    <span className="detail-value">{formatDate(user.last_login)}</span>
                  </div>
                )}
              </div>

              <div className="user-card-actions">
                <button
                  onClick={() => onEditUser(user)}
                  className="secondary-button"
                  title="편집"
                >
                  <span className="button-icon">✏️</span>
                  편집
                </button>
                {user.password_hash && onResetPassword && (
                  <button
                    onClick={() => onResetPassword(user)}
                    className="warning-button"
                    title="비밀번호 재설정"
                  >
                    <span className="button-icon">🔄</span>
                    비밀번호
                  </button>
                )}
                <button
                  onClick={() => onDeleteUser(user)}
                  className="danger-button"
                  title="삭제"
                >
                  <span className="button-icon">🗑️</span>
                  삭제
                </button>
              </div>

              <div className="user-meta">
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