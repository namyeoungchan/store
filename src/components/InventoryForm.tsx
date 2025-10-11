import React, { useState, useEffect } from 'react';
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

      <style>{`
        .modern-inventory-form {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Stock Overview */
        .stock-overview {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          padding: 2rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .stock-info {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .stock-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .stock-number {
          font-size: 3rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1;
        }

        .stock-unit {
          font-size: 1.25rem;
          color: #64748b;
          font-weight: 500;
        }

        .stock-details {
          flex: 1;
        }

        .stock-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .stock-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .stock-status.good { color: #15803d; }
        .stock-status.low { color: #d97706; }
        .stock-status.out { color: #dc2626; }

        .stock-progress {
          margin-top: 1rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        /* Form Tabs */
        .form-tabs {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 1rem 1.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-bottom: 3px solid transparent;
        }

        .tab-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .tab-btn.active {
          background: white;
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-icon {
          font-size: 1.1rem;
        }

        /* Tab Content */
        .tab-content {
          padding: 2rem;
        }

        /* Type Selector */
        .type-selector {
          margin-bottom: 2rem;
        }

        .selector-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .type-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .type-btn {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .type-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .type-btn.active.in {
          background: linear-gradient(135deg, #dcfce7, #f0fdf4);
          border-color: #10b981;
          color: #15803d;
        }

        .type-btn.active.out {
          background: linear-gradient(135deg, #fef3c7, #fffbeb);
          border-color: #f59e0b;
          color: #d97706;
        }

        .type-icon {
          font-size: 1.5rem;
        }

        .type-text {
          font-weight: 600;
        }

        /* Quick Amounts */
        .quick-amounts {
          margin-bottom: 1.5rem;
        }

        .quick-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .quick-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .quick-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s ease;
        }

        .quick-btn:hover {
          background: #e0e7ff;
          border-color: #3b82f6;
          color: #1d4ed8;
        }

        /* Form Fields */
        .form-field {
          margin-bottom: 1.5rem;
        }

        .field-label {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .quantity-input,
        .minstock-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .quantity-field,
        .notes-field,
        .minstock-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
        }

        .quantity-field:focus,
        .notes-field:focus,
        .minstock-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-unit {
          position: absolute;
          right: 1rem;
          color: #64748b;
          font-weight: 500;
          pointer-events: none;
        }

        .quantity-field,
        .minstock-field {
          padding-right: 4rem;
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .submit-btn.in {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }

        .submit-btn.out {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Min Stock Tab */
        .minstock-info {
          margin-bottom: 2rem;
        }

        .info-card {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1rem;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .info-title {
          font-weight: 600;
          color: #0369a1;
        }

        .info-text {
          margin: 0;
          color: #0c4a6e;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .minstock-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .action-btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .action-btn.secondary {
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          color: #475569;
        }

        .action-btn.secondary:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .action-btn.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .stock-info {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .type-buttons {
            grid-template-columns: 1fr;
          }

          .quick-buttons {
            grid-template-columns: repeat(2, 1fr);
          }

          .minstock-actions {
            grid-template-columns: 1fr;
          }

          .tab-btn {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};