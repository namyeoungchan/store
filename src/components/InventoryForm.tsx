import React, { useState } from 'react';
import { InventoryWithDetails } from '../types';

interface InventoryFormProps {
  inventory: InventoryWithDetails;
  onUpdateStock: (ingredientId: number, quantity: number, type: 'IN' | 'OUT', notes?: string) => void;
  onUpdateMinStock: (ingredientId: number, minStock: number) => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  inventory,
  onUpdateStock,
  onUpdateMinStock
}) => {
  const [quantity, setQuantity] = useState('');
  const [changeType, setChangeType] = useState<'IN' | 'OUT'>('IN');
  const [notes, setNotes] = useState('');
  const [minStock, setMinStock] = useState(inventory.min_stock.toString());

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const quantityValue = parseFloat(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      alert('올바른 수량을 입력하세요.');
      return;
    }

    onUpdateStock(inventory.ingredient_id, quantityValue, changeType, notes.trim() || undefined);
    setQuantity('');
    setNotes('');
  };

  const handleMinStockUpdate = () => {
    const minStockValue = parseFloat(minStock);
    if (isNaN(minStockValue) || minStockValue < 0) {
      alert('올바른 최소 재고량을 입력하세요.');
      return;
    }

    onUpdateMinStock(inventory.ingredient_id, minStockValue);
  };

  const isLowStock = inventory.current_stock <= inventory.min_stock;

  return (
    <div className="inventory-form">
      <div className="inventory-info">
        <h4>{inventory.ingredient_name}</h4>
        <div className={`current-stock ${isLowStock ? 'low-stock' : ''}`}>
          현재 재고: {inventory.current_stock} {inventory.ingredient_unit}
          {isLowStock && <span className="warning">⚠️ 재고 부족</span>}
        </div>
      </div>

      <form onSubmit={handleStockUpdate} className="stock-update-form">
        <div className="form-row">
          <div className="form-group">
            <label>수량:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="0"
              step="0.1"
              placeholder={inventory.ingredient_unit}
            />
          </div>

          <div className="form-group">
            <label>유형:</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value as 'IN' | 'OUT')}
            >
              <option value="IN">입고</option>
              <option value="OUT">출고</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>메모:</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: 납품, 폐기, 조정 등"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          재고 {changeType === 'IN' ? '입고' : '출고'}
        </button>
      </form>

      <div className="min-stock-setting">
        <div className="form-group">
          <label>최소 재고량:</label>
          <div className="min-stock-input">
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              min="0"
              step="0.1"
            />
            <span className="unit">{inventory.ingredient_unit}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleMinStockUpdate}
            >
              설정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};