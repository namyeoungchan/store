import React, { useState, useEffect } from 'react';
import { User, SalaryType } from '../../types';

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
    salary_type: 'HOURLY' as SalaryType,
    hourly_wage: 0,
    monthly_salary: 0,
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
        salary_type: user.salary_type,
        hourly_wage: user.hourly_wage || 0,
        monthly_salary: user.monthly_salary || 0,
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
        salary_type: 'HOURLY',
        hourly_wage: 0,
        monthly_salary: 0,
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

    if (formData.salary_type === 'HOURLY' && formData.hourly_wage <= 0) {
      newErrors.hourly_wage = '시급을 입력해주세요.';
    }

    if (formData.salary_type === 'MONTHLY' && formData.monthly_salary <= 0) {
      newErrors.monthly_salary = '월급을 입력해주세요.';
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
    <div className="modern-modal-overlay">
      <div className="modern-modal-backdrop" onClick={onCancel}></div>
      <div className="modern-modal">
        {/* Modal Header */}
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">{user ? '직원 정보 수정' : '새 직원 등록'}</h2>
              <p className="modal-subtitle">
                {user ? '기존 직원의 정보를 수정합니다' : '새로운 팀 멤버를 추가합니다'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="modern-close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modern-modal-content">
          <form onSubmit={handleSubmit} className="modern-user-form">
            {/* Form Sections */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">👤</span>
                기본 정보
              </h3>
              <div className="form-row">
                <div className="modern-form-group">
                  <label htmlFor="full_name" className="modern-label">
                    이름 <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={`modern-input ${errors.full_name ? 'error' : ''}`}
                      placeholder="실명을 입력하세요"
                    />
                  </div>
                  {errors.full_name && <span className="modern-error">{errors.full_name}</span>}
                </div>

                <div className="modern-form-group">
                  <label htmlFor="username" className="modern-label">
                    사용자명 <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"></path>
                    </svg>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`modern-input ${errors.username ? 'error' : ''}`}
                      placeholder="@username"
                    />
                  </div>
                  {errors.username && <span className="modern-error">{errors.username}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="modern-form-group">
                  <label htmlFor="position" className="modern-label">
                    직책 <span className="required">*</span>
                  </label>
                  <div className="select-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    <select
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className={`modern-select ${errors.position ? 'error' : ''}`}
                    >
                      <option value="">직책을 선택하세요</option>
                      {positionOptions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                    <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </div>
                  {errors.position && <span className="modern-error">{errors.position}</span>}
                </div>

                <div className="modern-form-group">
                  <label htmlFor="hire_date" className="modern-label">
                    입사일 <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input
                      type="date"
                      id="hire_date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleChange}
                      className={`modern-input ${errors.hire_date ? 'error' : ''}`}
                    />
                  </div>
                  {errors.hire_date && <span className="modern-error">{errors.hire_date}</span>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📞</span>
                연락처 정보
              </h3>
              <div className="form-row">
                <div className="modern-form-group">
                  <label htmlFor="email" className="modern-label">
                    이메일 <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`modern-input ${errors.email ? 'error' : ''}`}
                      placeholder="example@email.com"
                    />
                  </div>
                  {errors.email && <span className="modern-error">{errors.email}</span>}
                </div>

                <div className="modern-form-group">
                  <label htmlFor="phone" className="modern-label">
                    연락처 <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`modern-input ${errors.phone ? 'error' : ''}`}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  {errors.phone && <span className="modern-error">{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">💰</span>
                급여 정보
              </h3>

              {/* Salary Type Selection */}
              <div className="form-row single">
                <div className="modern-form-group">
                  <label htmlFor="salary_type" className="modern-label">
                    급여 유형 <span className="required">*</span>
                  </label>
                  <div className="select-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <select
                      id="salary_type"
                      name="salary_type"
                      value={formData.salary_type}
                      onChange={handleChange}
                      className="modern-select"
                    >
                      <option value="HOURLY">시급제</option>
                      <option value="MONTHLY">월급제</option>
                    </select>
                    <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Salary Amount Fields */}
              {formData.salary_type === 'HOURLY' ? (
                <div className="form-row single">
                  <div className="modern-form-group">
                    <label htmlFor="hourly_wage" className="modern-label">
                      시급 <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <input
                        type="number"
                        id="hourly_wage"
                        name="hourly_wage"
                        value={formData.hourly_wage}
                        onChange={handleChange}
                        className={`modern-input ${errors.hourly_wage ? 'error' : ''}`}
                        placeholder="시간당 급여"
                        min="0"
                        step="100"
                      />
                      <span className="input-suffix">원</span>
                    </div>
                    {errors.hourly_wage && <span className="modern-error">{errors.hourly_wage}</span>}
                  </div>
                </div>
              ) : (
                <div className="form-row single">
                  <div className="modern-form-group">
                    <label htmlFor="monthly_salary" className="modern-label">
                      월급 <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                      <input
                        type="number"
                        id="monthly_salary"
                        name="monthly_salary"
                        value={formData.monthly_salary}
                        onChange={handleChange}
                        className={`modern-input ${errors.monthly_salary ? 'error' : ''}`}
                        placeholder="월 급여"
                        min="0"
                        step="10000"
                      />
                      <span className="input-suffix">원</span>
                    </div>
                    {errors.monthly_salary && <span className="modern-error">{errors.monthly_salary}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">⚙️</span>
                설정
              </h3>
              <div className="settings-grid">
                <div className="modern-toggle-group">
                  <div className="toggle-header">
                    <label className="toggle-label">
                      활성 상태
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          className="toggle-input"
                        />
                        <span className="toggle-slider"></span>
                      </div>
                    </label>
                  </div>
                  <p className="toggle-description">
                    비활성화하면 스케줄 및 근무 기록에서 제외됩니다
                  </p>
                </div>

                <div className="modern-toggle-group">
                  <div className="toggle-header">
                    <label className="toggle-label">
                      로그인 권한
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          name="generate_login"
                          checked={formData.generate_login}
                          onChange={handleChange}
                          className="toggle-input"
                        />
                        <span className="toggle-slider"></span>
                      </div>
                    </label>
                  </div>
                  <p className="toggle-description">
                    직원이 개인 앱에 로그인할 수 있는 권한을 부여합니다
                  </p>
                  {user && formData.generate_login && user.password_temp && (
                    <div className="temp-password-display">
                      <div className="temp-password-label">현재 임시 비밀번호</div>
                      <div className="temp-password-value">{user.password_temp}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="modern-form-actions">
              <button type="button" onClick={onCancel} className="modern-secondary-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                취소
              </button>
              <button type="submit" className="modern-primary-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                {user ? '수정 완료' : '직원 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;