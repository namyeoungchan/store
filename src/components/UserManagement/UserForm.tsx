import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface UserFormProps {
  user: User | null;
  onSubmit: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>, generateLogin?: boolean) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    hire_date: '',
    position: '',
    hourly_wage: 0,
    is_active: true,
    generate_login: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        hire_date: user.hire_date,
        position: user.position,
        hourly_wage: user.hourly_wage,
        is_active: user.is_active,
        generate_login: !!user.password_hash, // 기존에 로그인 권한이 있으면 true
      });
    } else {
      setFormData({
        username: '',
        email: '',
        full_name: '',
        phone: '',
        hire_date: new Date().toISOString().split('T')[0],
        position: '',
        hourly_wage: 0,
        is_active: true,
        generate_login: true,
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자명을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = '이름을 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    }

    if (!formData.hire_date) {
      newErrors.hire_date = '입사일을 선택해주세요.';
    }

    if (!formData.position.trim()) {
      newErrors.position = '직책을 입력해주세요.';
    }

    if (formData.hourly_wage <= 0) {
      newErrors.hourly_wage = '시급을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const { generate_login, ...userData } = formData;
      onSubmit(userData, generate_login);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? parseFloat(value) || 0
        : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const positionOptions = [
    '매니저',
    '주방장',
    '주방보조',
    '서빙',
    '캐셔',
    '청소',
    '기타'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content user-form-modal">
        <div className="modal-header">
          <h2>{user ? '직원 정보 수정' : '새 직원 등록'}</h2>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username">사용자명 *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
                placeholder="사용자명을 입력하세요"
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="full_name">이름 *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={errors.full_name ? 'error' : ''}
                placeholder="실명을 입력하세요"
              />
              {errors.full_name && <span className="error-text">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">이메일 *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="example@email.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">연락처 *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'error' : ''}
                placeholder="010-1234-5678"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="position">직책 *</label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={errors.position ? 'error' : ''}
              >
                <option value="">직책을 선택하세요</option>
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              {errors.position && <span className="error-text">{errors.position}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hire_date">입사일 *</label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className={errors.hire_date ? 'error' : ''}
              />
              {errors.hire_date && <span className="error-text">{errors.hire_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hourly_wage">시급 (원) *</label>
              <input
                type="number"
                id="hourly_wage"
                name="hourly_wage"
                value={formData.hourly_wage}
                onChange={handleChange}
                className={errors.hourly_wage ? 'error' : ''}
                placeholder="시간당 급여를 입력하세요"
                min="0"
                step="100"
              />
              {errors.hourly_wage && <span className="error-text">{errors.hourly_wage}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="checkbox-text">활성 상태</span>
              </label>
              <p className="checkbox-help">비활성화하면 스케줄 및 근무 기록에서 제외됩니다.</p>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="generate_login"
                  checked={formData.generate_login}
                  onChange={handleChange}
                />
                <span className="checkbox-text">직원 앱 로그인 권한 부여</span>
              </label>
              <p className="checkbox-help">
                체크하면 임시 비밀번호가 생성되어 직원이 개인 앱에 로그인할 수 있습니다.
                {user && formData.generate_login && user.password_temp && (
                  <span className="temp-password-info">
                    <br />
                    <strong>현재 임시 비밀번호: {user.password_temp}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="secondary-button">
              취소
            </button>
            <button type="submit" className="primary-button">
              {user ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;