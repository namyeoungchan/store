import React, { useState, useEffect } from 'react';
import { InventoryForm } from '../components/InventoryForm';
import { InventoryList } from '../components/InventoryList';
import { InventoryHistory } from '../components/InventoryHistory';
import { InventoryService } from '../services/inventoryService';
import { InventoryWithDetails, InventoryHistoryWithDetails } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import LowStockAlert from '../components/LowStockAlert';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryWithDetails | null>(null);
  const [history, setHistory] = useState<InventoryHistoryWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadInventory();
    loadHistory();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = InventoryService.getAllInventoryWithDetails();
      setInventory(data);

      // 선택된 아이템이 있다면 업데이트
      if (selectedItem) {
        const updatedItem = data.find((item: InventoryWithDetails) => item.id === selectedItem.id);
        if (updatedItem) {
          setSelectedItem(updatedItem);
        }
      }
    } catch (err) {
      showToast('재고 정보를 불러오는데 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = InventoryService.getInventoryHistoryWithDetails();
      setHistory(data);
    } catch (err) {
      showToast('재고 이력을 불러오는데 실패했습니다.', 'error');
      console.error(err);
    }
  };

  const handleUpdateStock = async (ingredientId: number, quantity: number, type: 'IN' | 'OUT', notes?: string) => {
    setLoading(true);
    try {
      InventoryService.adjustStock(ingredientId, quantity, type, notes);
      await loadInventory();
      await loadHistory();
      const typeText = type === 'IN' ? '입고' : '출고';
      showToast(`재고가 성공적으로 ${typeText} 처리되었습니다.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '재고 업데이트에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMinStock = async (ingredientId: number, minStock: number) => {
    setLoading(true);
    try {
      InventoryService.updateMinStock(ingredientId, minStock);
      await loadInventory();
      showToast('최소 재고량이 성공적으로 설정되었습니다.', 'success');
    } catch (err) {
      showToast('최소 재고량 설정에 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: InventoryWithDetails) => {
    setSelectedItem(item);
  };

  const lowStockItems = inventory.filter(item => item.current_stock <= item.min_stock);
  const outOfStockItems = inventory.filter(item => item.current_stock === 0);

  if (loading && inventory.length === 0) {
    return <LoadingSpinner size="large" message="재고 정보를 불러오는 중..." overlay />;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📦 재고 관리</h1>
          <p className="page-description">재료별 재고 현황을 실시간으로 모니터링하고 관리합니다</p>
        </div>
        <div className="header-stats">
          <div className="stat-card stat-total">
            <div className="stat-number">{inventory.length}</div>
            <div className="stat-label">총 재료</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-number">{lowStockItems.length}</div>
            <div className="stat-label">부족 재고</div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-number">{outOfStockItems.length}</div>
            <div className="stat-label">재고 없음</div>
          </div>
        </div>
      </div>

      {/* 재고 부족 알림 */}
      <LowStockAlert showAll={true} />

      <div className="page-content">
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              📋 재고 현황 ({inventory.length})
            </button>
            <button
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📈 변동 이력 ({history.length})
            </button>
          </div>
        </div>

        {activeTab === 'inventory' && (
          <div className="inventory-management">
            <div className="content-grid">
              <div className="list-section">
                <div className="section-card">
                  <div className="section-header">
                    <h3>📋 재고 목록</h3>
                    <div className="section-info">
                      재료를 선택하여 재고를 관리하세요
                    </div>
                  </div>
                  {loading && (
                    <div className="loading-overlay">
                      <LoadingSpinner size="small" />
                    </div>
                  )}
                  <InventoryList
                    inventory={inventory}
                    onSelectItem={handleSelectItem}
                    selectedItem={selectedItem}
                  />
                </div>
              </div>

              {selectedItem && (
                <div className="form-section">
                  <div className="section-card">
                    <div className="section-header">
                      <h3>⚙️ 재고 관리</h3>
                      <div className="selected-item">
                        {selectedItem.ingredient_name} ({selectedItem.ingredient_unit})
                      </div>
                    </div>
                    <InventoryForm
                      inventory={selectedItem}
                      onUpdateStock={handleUpdateStock}
                      onUpdateMinStock={handleUpdateMinStock}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-card">
              <div className="section-header">
                <h3>📈 재고 변동 이력</h3>
                <div className="section-info">
                  최근 재고 변동 내역을 확인할 수 있습니다
                </div>
              </div>
              <InventoryHistory history={history} limit={100} />
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <style>{`
        .inventory-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          padding: 2rem;
        }

        .page-header {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
          font-size: 2rem;
          font-weight: 700;
        }

        .page-description {
          margin: 0;
          color: #718096;
          font-size: 1.1rem;
        }

        .header-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-card {
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          min-width: 120px;
          color: white;
        }

        .stat-total {
          background: linear-gradient(135deg, #2196f3, #1976d2);
        }

        .stat-warning {
          background: linear-gradient(135deg, #ff9800, #f57c00);
        }

        .stat-danger {
          background: linear-gradient(135deg, #f44336, #d32f2f);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .tabs-container {
          background: white;
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
        }

        .tab {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 12px;
          padding: 1rem 2rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #6c757d;
        }

        .tab:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }

        .tab.active {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          border-color: #2196f3;
          color: white;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f7fafc;
        }

        .section-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-info {
          color: #718096;
          font-size: 0.9rem;
        }

        .selected-item {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          z-index: 10;
        }

        .history-section {
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .header-stats {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .inventory-page {
            padding: 1rem;
          }

          .page-header {
            padding: 1.5rem;
          }

          .section-card {
            padding: 1.5rem;
          }

          .tabs {
            flex-direction: column;
          }

          .tab {
            text-align: center;
          }

          .header-stats {
            flex-direction: column;
            align-items: center;
          }

          .stat-card {
            width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryPage;