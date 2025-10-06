import React, { useState, useEffect } from 'react';
import { InventoryForm } from '../components/InventoryForm';
import { InventoryList } from '../components/InventoryList';
import { InventoryHistory } from '../components/InventoryHistory';
import { InventoryService } from '../services/inventoryService';
import { InventoryWithDetails, InventoryHistoryWithDetails } from '../types';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryWithDetails | null>(null);
  const [history, setHistory] = useState<InventoryHistoryWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadInventory();
    loadHistory();
  }, []);

  const loadInventory = async () => {
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
      setError('재고 정보를 불러오는데 실패했습니다.');
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = InventoryService.getInventoryHistoryWithDetails();
      setHistory(data);
    } catch (err) {
      setError('재고 이력을 불러오는데 실패했습니다.');
      console.error(err);
    }
  };

  const handleUpdateStock = async (ingredientId: number, quantity: number, type: 'IN' | 'OUT', notes?: string) => {
    try {
      InventoryService.adjustStock(ingredientId, quantity, type, notes);
      loadInventory();
      loadHistory();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '재고 업데이트에 실패했습니다.');
    }
  };

  const handleUpdateMinStock = async (ingredientId: number, minStock: number) => {
    try {
      InventoryService.updateMinStock(ingredientId, minStock);
      loadInventory();
      setError('');
    } catch (err) {
      setError('최소 재고량 설정에 실패했습니다.');
      console.error(err);
    }
  };

  const handleSelectItem = (item: InventoryWithDetails) => {
    setSelectedItem(item);
  };

  const lowStockItems = inventory.filter(item => item.current_stock <= item.min_stock);

  // @ts-ignore
  return (
    <div className="inventory-page">
      <h2>재고 관리</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠️ 재고 부족 알림:</strong> {lowStockItems.length}개의 재료가 재고 부족 상태입니다.
          <ul className="low-stock-list">
            {lowStockItems.map(item => (
              <li key={item.id}>
                {item.ingredient_name}: {item.current_stock} {item.ingredient_unit}
                (최소: {item.min_stock} {item.ingredient_unit})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          재고 현황 ({inventory.length})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          변동 이력 ({history.length})
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="inventory-management">
          <div className="page-content">
            <div className="list-section">
              <InventoryList
                inventory={inventory}
                onSelectItem={handleSelectItem}
                // selectedItem={selectedItem}
              />
            </div>

            {selectedItem && (
              <div className="form-section">
                <h3>재고 관리 - {selectedItem.ingredient_name}</h3>
                <InventoryForm
                  inventory={selectedItem}
                  onUpdateStock={handleUpdateStock}
                  onUpdateMinStock={handleUpdateMinStock}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <InventoryHistory history={history} limit={100} />
        </div>
      )}
    </div>
  );
};

export default InventoryPage;