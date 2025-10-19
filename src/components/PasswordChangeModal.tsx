import React, { useState } from 'react';
import { UserService } from '../services/userService';
import { PasswordUtils } from '../utils/passwordUtils';

interface PasswordChangeModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  userId,
  onClose,
  onSuccess
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    const validation = PasswordUtils.validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.errors.join(' '));
      return;
    }

    setIsLoading(true);

    try {
      // 현재 비밀번호 확인
      const user = await UserService.getUserById(userId);
      if (!user || !user.password_hash) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const isCurrentValid = await PasswordUtils.verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentValid) {
        setError('현재 비밀번호가 올바르지 않습니다.');
        return;
      }

      // 비밀번호 변경
      await UserService.changePassword(userId, newPassword);

      alert('비밀번호가 성공적으로 변경되었습니다.');
      onSuccess();
      onClose();
    } catch (err) {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content password-change-modal">
        <div className="modal-header">
          <h2>🔐 비밀번호 변경</h2>
          <button onClick={handleClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="password-change-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="currentPassword">현재 비밀번호 *</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">새 비밀번호 *</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              disabled={isLoading}
            />
            <p className="password-help">
              최소 4자리 이상, 최대 20자리 이하로 입력해주세요.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">새 비밀번호 확인 *</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="secondary-button"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading}
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;