import React, { useState } from 'react';
import { Menu } from '../types';

interface MenuFormProps {
  onSubmit: (menu: Omit<Menu, 'id' | 'created_at'>) => void;
  initialData?: Menu;
  isEditing?: boolean;
  onCancel?: () => void;
}

export const MenuForm: React.FC<MenuFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false,
  onCancel
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price.trim()) {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue < 0) {
        alert('올바른 가격을 입력하세요.');
        return;
      }

      onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: priceValue
      });

      if (!isEditing) {
        setName('');
        setDescription('');
        setPrice('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="menu-form">
      <div className="form-group">
        <label htmlFor="name">메뉴명:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="예: 김치찌개, 비빔밥 등"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">설명:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="메뉴에 대한 간단한 설명 (선택사항)"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="price">가격:</label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="0"
          step="100"
          placeholder="원"
        />
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