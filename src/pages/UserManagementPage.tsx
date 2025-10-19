import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, UserWithSchedule } from '../types';
import { UserService } from '../services/userService';
import UserList from '../components/UserManagement/UserList'; // 기본 탭이므로 즉시 로드
import ConfirmDialog from '../components/ConfirmDialog'; // 작은 컴포넌트이므로 즉시 로드
import '../styles/components/ModernEmployeeManagement.css';

// 조건부 렌더링되는 큰 컴포넌트들은 lazy loading 적용
const UserForm = lazy(() => import('../components/UserManagement/UserForm'));
const ScheduleManagement = lazy(() => import('../components/UserManagement/ScheduleManagement'));
const FixedScheduleManagement = lazy(() => import('../components/UserManagement/FixedScheduleManagement'));
const WorkTimeAnalysis = lazy(() => import('../components/UserManagement/WorkTimeAnalysis'));

type TabType = 'users' | 'schedule' | 'fixed-schedule' | 'analysis';

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [usersWithSchedule, setUsersWithSchedule] = useState<UserWithSchedule[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allUsers, usersWithSched] = await Promise.all([
        UserService.getAllUsers(),
        UserService.getUsersWithCurrentSchedule()
      ]);
      setUsers(allUsers);
      setUsersWithSchedule(usersWithSched);
    } catch (err) {
      setError('사용자 정보를 불러오는데 실패했습니다.');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowConfirmDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await UserService.deleteUser(userToDelete.id!);
      await loadUsers();
      setShowConfirmDialog(false);
      setUserToDelete(null);
    } catch (err) {
      setError('사용자 삭제에 실패했습니다.');
      console.error('Error deleting user:', err);
    }
  };

  const handleUserFormSubmit = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>, generateLogin?: boolean) => {
    try {
      if (selectedUser) {
        // 기존 사용자 업데이트
        await UserService.updateUser(selectedUser.id!, userData);

        // 로그인 권한 변경이 있으면 처리
        if (generateLogin !== undefined) {
          const hasCurrentAccess = !!selectedUser.password_hash;
          if (generateLogin !== hasCurrentAccess) {
            await UserService.toggleUserLoginAccess(selectedUser.id!, generateLogin);
          }
        }
      } else {
        // 새 사용자 생성
        const newUser = await UserService.createUser(userData, generateLogin);

        // 로그인 권한이 부여되었고 임시 비밀번호가 있으면 알림
        if (generateLogin && newUser.password_temp) {
          alert(`직원이 등록되었습니다.\n\n임시 로그인 정보:\n이메일: ${newUser.email}\n비밀번호: ${newUser.password_temp}\n\n이 정보를 직원에게 안전하게 전달해주세요.`);
        }
      }

      await loadUsers();
      setShowUserForm(false);
      setSelectedUser(null);
    } catch (err) {
      setError('사용자 정보 저장에 실패했습니다.');
      console.error('Error saving user:', err);
    }
  };

  const handleResetPassword = async (user: User) => {
    const confirmReset = window.confirm(`"${user.full_name}" 직원의 비밀번호를 재설정하시겠습니까?\n새로운 임시 비밀번호가 생성됩니다.`);

    if (confirmReset) {
      try {
        const newTempPassword = await UserService.resetPassword(user.id!);
        alert(`비밀번호가 재설정되었습니다.\n\n새로운 임시 비밀번호: ${newTempPassword}\n\n이 정보를 직원에게 안전하게 전달해주세요.`);
        await loadUsers();
      } catch (err) {
        setError('비밀번호 재설정에 실패했습니다.');
        console.error('Error resetting password:', err);
      }
    }
  };

  // 컴포넌트 로딩을 위한 fallback
  const ComponentLoader = () => (
    <div className="component-loading">
      <div className="loading-spinner"></div>
      <p>컴포넌트를 불러오는 중...</p>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="user-management-modern">
      {/* Background Effects */}
      <div className="background-effects">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Header Section */}
      <div className="modern-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="modern-title">
              <span className="title-icon">👥</span>
              직원 관리
            </h1>
            <p className="modern-subtitle">
              팀원들의 정보와 스케줄을 스마트하게 관리하세요
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{users.length}</div>
              <div className="stat-label">총 직원</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{users.filter(u => u.is_active).length}</div>
              <div className="stat-label">활성 직원</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="error-toast">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button onClick={() => setError(null)} className="error-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modern Tab Navigation */}
      <div className="modern-tabs">
        <div className="tab-container">
          {[
            { key: 'users', icon: '👤', label: '직원 관리', color: 'blue' },
            { key: 'schedule', icon: '📅', label: '주간 스케줄', color: 'purple' },
            { key: 'fixed-schedule', icon: '🔒', label: '고정 스케줄', color: 'orange' },
            { key: 'analysis', icon: '📊', label: '근무 분석', color: 'green' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`modern-tab ${activeTab === tab.key ? 'active' : ''} ${tab.color}`}
              onClick={() => setActiveTab(tab.key as TabType)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.key && <div className="tab-indicator"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="modern-content">
        <div className="content-wrapper">
          {activeTab === 'users' && (
            <UserList
              users={users}
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
            />
          )}

          {activeTab === 'schedule' && (
            <Suspense fallback={<ComponentLoader />}>
              <ScheduleManagement
                users={usersWithSchedule}
                onScheduleUpdate={loadUsers}
              />
            </Suspense>
          )}

          {activeTab === 'fixed-schedule' && (
            <Suspense fallback={<ComponentLoader />}>
              <FixedScheduleManagement
                users={users}
              />
            </Suspense>
          )}

          {activeTab === 'analysis' && (
            <Suspense fallback={<ComponentLoader />}>
              <WorkTimeAnalysis />
            </Suspense>
          )}
        </div>
      </div>

      {/* Modern User Form Modal */}
      {showUserForm && (
        <Suspense fallback={<ComponentLoader />}>
          <UserForm
            user={selectedUser}
            onSubmit={handleUserFormSubmit}
            onCancel={() => {
              setShowUserForm(false);
              setSelectedUser(null);
            }}
          />
        </Suspense>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="직원 삭제 확인"
        message={`정말로 "${userToDelete?.full_name}" 직원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setShowConfirmDialog(false);
          setUserToDelete(null);
        }}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
      />
    </div>
  );
};

export default UserManagementPage;