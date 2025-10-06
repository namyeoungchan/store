import React, { useState, useEffect } from 'react';
import { InventoryWithDetails } from '../types';
import { InventoryService } from '../services/inventoryService';

interface LowStockAlertProps {
  showAll?: boolean;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ showAll = false }) => {
  const [lowStockItems, setLowStockItems] = useState<InventoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockItems();
  }, []);

  const loadLowStockItems = async () => {
    try {
      const allInventory = InventoryService.getAllInventoryWithDetails();
      const lowStock = allInventory.filter((item: InventoryWithDetails) =>
        item.current_stock <= item.min_stock
      );
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error loading low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="low-stock-alert loading">재고 상태를 확인하는 중...</div>;
  }

  if (lowStockItems.length === 0) {
    return showAll ? (
      <div className="low-stock-alert success">
        ✅ 모든 재료의 재고가 충분합니다!
      </div>
    ) : null;
  }

  const criticalItems = lowStockItems.filter(item => item.current_stock === 0);
  const warningItems = lowStockItems.filter(item =>
    item.current_stock > 0 && item.current_stock <= item.min_stock
  );

  return (
    <div className="low-stock-alert">
      {criticalItems.length > 0 && (
        <div className="alert critical">
          <h4>🚨 재고 부족 (긴급)</h4>
          <ul>
            {criticalItems.map(item => (
              <li key={item.id}>
                <strong>{item.ingredient_name}</strong>:
                재고 없음 (최소 필요량: {item.min_stock} {item.ingredient_unit})
              </li>
            ))}
          </ul>
        </div>
      )}

      {warningItems.length > 0 && (
        <div className="alert warning">
          <h4>⚠️ 재고 부족 경고</h4>
          <ul>
            {warningItems.map(item => (
              <li key={item.id}>
                <strong>{item.ingredient_name}</strong>:
                {item.current_stock} {item.ingredient_unit}
                (최소 필요량: {item.min_stock} {item.ingredient_unit})
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .low-stock-alert {
          margin: 1rem 0;
        }

        .alert {
          margin: 0.5rem 0;
          padding: 1rem;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .alert.critical {
          background-color: #ffeaea;
          border-color: #d32f2f;
          color: #d32f2f;
        }

        .alert.warning {
          background-color: #fff8e1;
          border-color: #f57c00;
          color: #f57c00;
        }

        .alert.success {
          background-color: #e8f5e8;
          border-color: #4caf50;
          color: #4caf50;
        }

        .alert h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .alert ul {
          margin: 0;
          padding-left: 1.2rem;
        }

        .alert li {
          margin: 0.3rem 0;
        }

        .loading {
          padding: 1rem;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default LowStockAlert;