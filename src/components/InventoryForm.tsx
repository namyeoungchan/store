import React, { useState, useEffect } from 'react';
import { InventoryWithDetails } from '../types';
import '../styles/components/InventoryForm.css';

interface InventoryFormProps {
  inventory: InventoryWithDetails;
  onUpdateStock: (ingredientId: string, quantity: number, type: 'IN' | 'OUT', notes?: string) => void;
  onUpdateMinStock: (ingredientId: string, minStock: number) => void;
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
  const [activeTab, setActiveTab] = useState<'stock' | 'minstock'>('stock');
  const [isLoading, setIsLoading] = useState(false);

  // Update minStock when inventory changes
  useEffect(() => {
    setMinStock(inventory.min_stock.toString());
  }, [inventory.min_stock]);

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const quantityValue = parseFloat(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      alert('올바른 수량을 입력하세요.');
      setIsLoading(false);
      return;
    }

    try {
      await onUpdateStock(inventory.ingredient_id, quantityValue, changeType, notes.trim() || undefined);
      setQuantity('');
      setNotes('');
    } catch (error) {
      console.error('재고 업데이트 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMinStockUpdate = async () => {
    setIsLoading(true);
    const minStockValue = parseFloat(minStock);
    if (isNaN(minStockValue) || minStockValue < 0) {
      alert('올바른 최소 재고량을 입력하세요.');
      setIsLoading(false);
      return;
    }

    try {
      await onUpdateMinStock(inventory.ingredient_id, minStockValue);
    } catch (error) {
      console.error('최소 재고 업데이트 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLowStock = inventory.current_stock <= inventory.min_stock;
  const isOutOfStock = inventory.current_stock === 0;

  const getStockStatus = () => {
    if (isOutOfStock) return 'out';
    if (isLowStock) return 'low';
    return 'good';
  };

  const getStockStatusColor = () => {
    const status = getStockStatus();
    switch (status) {
      case 'out': return '#ef4444';
      case 'low': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getStockStatusText = () => {
    const status = getStockStatus();
    switch (status) {
      case 'out': return '품절';
      case 'low': return '부족';
      default: return '충분';
    }
  };

  const quickQuantities = [1, 5, 10, 50];

  return (
    <div className="modern-inventory-form">
      {/* Current Stock Display */}
      <div className="stock-overview">
        <div className="stock-info">
          <div className="stock-display">
            <div className="stock-number">{inventory.current_stock}</div>
            <div className="stock-unit">{inventory.ingredient_unit}</div>
          </div>
          <div className="stock-details">
            <div className="stock-label">현재 재고</div>
            <div className={`stock-status ${getStockStatus()}`}>
              <span className="status-dot" style={{ backgroundColor: getStockStatusColor() }}></span>
              {getStockStatusText()}
            </div>
          </div>
        </div>

        <div className="stock-progress">
          <div className="progress-info">
            <span className="current-label">현재</span>
            <span className="min-label">최소: {inventory.min_stock}{inventory.ingredient_unit}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min((inventory.current_stock / (inventory.min_stock * 2)) * 100, 100)}%`,
                backgroundColor: getStockStatusColor()
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="form-tabs">
        <button
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <span className="tab-icon">📦</span>
          재고 관리
        </button>
        <button
          className={`tab-btn ${activeTab === 'minstock' ? 'active' : ''}`}
          onClick={() => setActiveTab('minstock')}
        >
          <span className="tab-icon">⚙️</span>
          최소재고 설정
        </button>
      </div>

      {/* Stock Management Tab */}
      {activeTab === 'stock' && (
        <div className="tab-content">
          {/* Change Type Selection */}
          <div className="type-selector">
            <div className="selector-label">작업 유형</div>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn in ${changeType === 'IN' ? 'active' : ''}`}
                onClick={() => setChangeType('IN')}
              >
                <span className="type-icon">📥</span>
                <span className="type-text">입고</span>
              </button>
              <button
                type="button"
                className={`type-btn out ${changeType === 'OUT' ? 'active' : ''}`}
                onClick={() => setChangeType('OUT')}
              >
                <span className="type-icon">📤</span>
                <span className="type-text">출고</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleStockUpdate} className="stock-form">
            {/* Quick Amount Buttons */}
            <div className="quick-amounts">
              <div className="quick-label">빠른 수량</div>
              <div className="quick-buttons">
                {quickQuantities.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    className="quick-btn"
                    onClick={() => setQuantity(amount.toString())}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Input */}
            <div className="form-field">
              <label className="field-label">수량</label>
              <div className="quantity-input">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="0"
                  step="0.1"
                  placeholder="수량을 입력하세요"
                  className="quantity-field"
                />
                <span className="input-unit">{inventory.ingredient_unit}</span>
              </div>
            </div>

            {/* Notes Input */}
            <div className="form-field">
              <label className="field-label">메모 (선택사항)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="예: 신규 납품, 폐기 처리, 재고 조정 등"
                className="notes-field"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`submit-btn ${changeType.toLowerCase()}`}
              disabled={isLoading || !quantity}
            >
              {isLoading ? (
                <span className="loading-spinner">⟳</span>
              ) : (
                <>
                  <span className="btn-icon">{changeType === 'IN' ? '📥' : '📤'}</span>
                  <span className="btn-text">
                    {quantity ? `${changeType === 'IN' ? '+' : '-'}${quantity}${inventory.ingredient_unit} ` : ''}
                    {changeType === 'IN' ? '입고' : '출고'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Min Stock Setting Tab */}
      {activeTab === 'minstock' && (
        <div className="tab-content">
          <div className="minstock-info">
            <div className="info-card">
              <div className="info-header">
                <span className="info-icon">ℹ️</span>
                <span className="info-title">최소 재고란?</span>
              </div>
              <p className="info-text">
                재고가 이 수치 이하로 떨어지면 부족 상태로 표시됩니다.
                적절한 값을 설정하여 재고 관리를 효율적으로 하세요.
              </p>
            </div>
          </div>

          <div className="minstock-form">
            <div className="form-field">
              <label className="field-label">최소 재고량</label>
              <div className="minstock-input">
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  min="0"
                  step="0.1"
                  placeholder="최소 재고량"
                  className="minstock-field"
                />
                <span className="input-unit">{inventory.ingredient_unit}</span>
              </div>
            </div>

            <div className="minstock-actions">
              <button
                type="button"
                className="action-btn secondary"
                onClick={() => setMinStock(inventory.current_stock.toString())}
              >
                <span className="btn-icon">🔄</span>
                현재 재고로 설정
              </button>
              <button
                type="button"
                className="action-btn primary"
                onClick={handleMinStockUpdate}
                disabled={isLoading || minStock === inventory.min_stock.toString()}
              >
                {isLoading ? (
                  <span className="loading-spinner">⟳</span>
                ) : (
                  <>
                    <span className="btn-icon">✅</span>
                    설정 완료
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};