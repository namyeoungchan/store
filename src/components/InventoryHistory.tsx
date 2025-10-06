import React from 'react';
import { InventoryHistoryWithDetails } from '../types';

interface InventoryHistoryProps {
  history: InventoryHistoryWithDetails[];
  limit?: number;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({
  history,
  limit = 50
}) => {
  const displayHistory = limit ? history.slice(0, limit) : history;

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return '입고';
      case 'OUT':
        return '출고';
      case 'ADJUST':
        return '조정';
      default:
        return type;
    }
  };

  const getChangeTypeClass = (type: string) => {
    switch (type) {
      case 'IN':
        return 'change-in';
      case 'OUT':
        return 'change-out';
      case 'ADJUST':
        return 'change-adjust';
      default:
        return '';
    }
  };

  return (
    <div className="inventory-history">
      <h3>재고 변동 이력 {limit && `(최근 ${limit}건)`}</h3>

      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>일시</th>
              <th>재료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>이전 재고</th>
              <th>변경 후 재고</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {displayHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  재고 변동 이력이 없습니다.
                </td>
              </tr>
            ) : (
              displayHistory.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString('ko-KR')
                      : '-'
                    }
                  </td>
                  <td>{item.ingredient_name}</td>
                  <td>
                    <span className={`change-type ${getChangeTypeClass(item.change_type)}`}>
                      {getChangeTypeLabel(item.change_type)}
                    </span>
                  </td>
                  <td>
                    <span className={getChangeTypeClass(item.change_type)}>
                      {item.change_type === 'IN' ? '+' : '-'}{item.quantity} {item.ingredient_unit}
                    </span>
                  </td>
                  <td>{item.previous_stock} {item.ingredient_unit}</td>
                  <td>{item.new_stock} {item.ingredient_unit}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};