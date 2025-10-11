import React, { useState, useEffect } from 'react';
import { User, UserWithSchedule } from '../types';
import { UserService } from '../services/userService';
import UserList from '../components/UserManagement/UserList';
import UserForm from '../components/UserManagement/UserForm';
import ScheduleManagement from '../components/UserManagement/ScheduleManagement';
import WorkTimeAnalysis from '../components/UserManagement/WorkTimeAnalysis';
import ConfirmDialog from '../components/ConfirmDialog';

type TabType = 'users' | 'schedule' | 'analysis';

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1 className="page-title">👥 직원 관리</h1>
        <p className="page-subtitle">직원 정보, 스케줄 및 근무시간을 관리합니다</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👤</span>
          직원 관리
        </button>
        <button
          className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className="tab-icon">📅</span>
          스케줄 관리
        </button>
        <button
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <span className="tab-icon">📊</span>
          근무시간 분석
        </button>
      </div>

      <div className="tab-content">
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
          <ScheduleManagement
            users={usersWithSchedule}
            onScheduleUpdate={loadUsers}
          />
        )}

        {activeTab === 'analysis' && (
          <WorkTimeAnalysis />
        )}
      </div>

      {showUserForm && (
        <UserForm
          user={selectedUser}
          onSubmit={handleUserFormSubmit}
          onCancel={() => {
            setShowUserForm(false);
            setSelectedUser(null);
          }}
        />
      )}

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