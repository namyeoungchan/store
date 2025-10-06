import React, { useState } from 'react';
import { InventoryWithDetails } from '../types';

interface InventoryListProps {
  inventory: InventoryWithDetails[];
  onSelectItem: (item: InventoryWithDetails) => void;
  selectedItem?: InventoryWithDetails;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  inventory,
  onSelectItem,
  selectedItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = showLowStockOnly ? item.current_stock <= item.min_stock : true;
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = inventory.filter(item => item.current_stock <= item.min_stock).length;

  return (
    <div className="inventory-list">
      <div className="list-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="재료 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            재고 부족만 보기 ({lowStockCount}개)
          </label>
        </div>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>재료명</th>
              <th>현재 재고</th>
              <th>최소 재고</th>
              <th>상태</th>
              <th>마지막 업데이트</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">
                  {searchTerm ? '검색 결과가 없습니다.' : '재고 정보가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredInventory.map(item => {
                const isLowStock = item.current_stock <= item.min_stock;
                const isSelected = selectedItem?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`${isSelected ? 'selected' : ''} ${isLowStock ? 'low-stock' : ''}`}
                    onClick={() => onSelectItem(item)}
                  >
                    <td>{item.ingredient_name}</td>
                    <td>
                      {item.current_stock} {item.ingredient_unit}
                    </td>
                    <td>
                      {item.min_stock} {item.ingredient_unit}
                    </td>
                    <td>
                      {isLowStock ? (
                        <span className="status status-warning">재고 부족</span>
                      ) : (
                        <span className="status status-normal">정상</span>
                      )}
                    </td>
                    <td>
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {lowStockCount > 0 && !showLowStockOnly && (
        <div className="warning-banner">
          ⚠️ {lowStockCount}개의 재료가 재고 부족 상태입니다.
        </div>
      )}
    </div>
  );
};