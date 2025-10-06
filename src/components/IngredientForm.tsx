import React, { useState } from 'react';
import { Ingredient } from '../types';

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
    <form onSubmit={handleSubmit} className="ingredient-form">
      <div className="form-group">
        <label htmlFor="name">재료명:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="예: 양파, 쇠고기 등"
        />
      </div>

      <div className="form-group">
        <label htmlFor="unit">단위:</label>
        <select
          id="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          required
        >
          <option value="">단위를 선택하세요</option>
          {COMMON_UNITS.map(unitOption => (
            <option key={unitOption} value={unitOption}>
              {unitOption}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? '수정' : '등록'}
        </button>
        {isEditing && onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
};