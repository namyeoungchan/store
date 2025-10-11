import React, { useState } from 'react';
import { Ingredient } from '../types';
import './IngredientForm.css';

interface IngredientFormProps {
  onSubmit: (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => void;
  initialData?: Ingredient;
  isEditing?: boolean;
  onCancel?: () => void;
}

const COMMON_UNITS = [
  'kg', 'g', 'L', 'ml', '개', '포', '캔', '병', '상자', '팩'
];

export const IngredientForm: React.FC<IngredientFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false,
  onCancel
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [unit, setUnit] = useState(initialData?.unit || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && unit.trim()) {
      onSubmit({ name: name.trim(), unit: unit.trim() });
      if (!isEditing) {
        setName('');
        setUnit('');
      }
    }
  };

  return (
    <div className="ingredient-form-container">
      <form onSubmit={handleSubmit} className="ingredient-form">
        <div className="form-header">
          <h3 className="form-title">
            {isEditing ? '재료 수정' : '새 재료 등록'}
          </h3>
          <div className="form-subtitle">
            {isEditing ? '재료 정보를 수정하세요' : '새로운 재료를 추가하세요'}
          </div>
        </div>

        <div className="form-body">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              <span className="label-text">재료명</span>
              <span className="label-required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="예: 양파, 쇠고기, 토마토 등"
                className="form-input"
              />
              <div className="input-icon">🥬</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="unit" className="form-label">
              <span className="label-text">단위</span>
              <span className="label-required">*</span>
            </label>
            <div className="select-wrapper">
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="form-select"
              >
                <option value="">단위를 선택하세요</option>
                {COMMON_UNITS.map(unitOption => (
                  <option key={unitOption} value={unitOption}>
                    {unitOption}
                  </option>
                ))}
              </select>
              <div className="select-icon">📏</div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <span className="btn-icon">{isEditing ? '✏️' : '➕'}</span>
            <span className="btn-text">{isEditing ? '수정하기' : '등록하기'}</span>
          </button>
          {isEditing && onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              <span className="btn-icon">❌</span>
              <span className="btn-text">취소</span>
            </button>
          )}
        </div>
      </form>

    </div>
  );
};