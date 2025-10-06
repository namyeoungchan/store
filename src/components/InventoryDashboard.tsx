import React, { useState, useEffect } from 'react';
import { InventoryWithDetails } from '../types';
import { InventoryService } from '../services/inventoryService';
import { IngredientService } from '../services/ingredientService';
import LowStockAlert from './LowStockAlert';

interface DashboardStats {
  totalIngredients: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentUpdates: InventoryWithDetails[];
}

const InventoryDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalIngredients: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    recentUpdates: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [allInventory, allIngredients] = await Promise.all([
        Promise.resolve(InventoryService.getAllInventoryWithDetails()),
        Promise.resolve(IngredientService.getAllIngredients())
      ]);

      const lowStockItems = allInventory.filter((item: InventoryWithDetails) =>
        item.current_stock <= item.min_stock
      );
      const outOfStockItems = allInventory.filter((item: InventoryWithDetails) =>
        item.current_stock === 0
      );

      // 최근 업데이트된 재고 (상위 5개)
      const recentUpdates = [...allInventory]
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || 0).getTime();
          const dateB = new Date(b.updated_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setStats({
        totalIngredients: allIngredients.length,
        totalInventoryValue: allInventory.reduce((sum: number, item: InventoryWithDetails) => sum + item.current_stock, 0),
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        recentUpdates
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="dashboard-loading">대시보드 로딩 중...</div>;
  }

  return (
    <div className="inventory-dashboard">
      <h2>📊 재고 대시보드</h2>

      {/* 알림 섹션 */}
      <div className="alerts-section">
        <LowStockAlert showAll={true} />
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalIngredients}</div>
            <div className="stat-label">등록된 재료</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalInventoryValue.toFixed(1)}</div>
            <div className="stat-label">총 재고량</div>
          </div>
        </div>

        <div className={`stat-card ${stats.lowStockCount > 0 ? 'warning' : ''}`}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.lowStockCount}</div>
            <div className="stat-label">부족 재고</div>
          </div>
        </div>

        <div className={`stat-card ${stats.outOfStockCount > 0 ? 'critical' : ''}`}>
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <div className="stat-value">{stats.outOfStockCount}</div>
            <div className="stat-label">재고 없음</div>
          </div>
        </div>
      </div>

      {/* 최근 업데이트 */}
      <div className="recent-updates">
        <h3>🕒 최근 재고 업데이트</h3>
        {stats.recentUpdates.length > 0 ? (
          <div className="updates-list">
            {stats.recentUpdates.map(item => (
              <div key={item.id} className="update-item">
                <div className="update-info">
                  <strong>{item.ingredient_name}</strong>
                  <span className="current-stock">
                    {item.current_stock} {item.ingredient_unit}
                  </span>
                </div>
                <div className="update-meta">
                  <span className="update-date">
                    {formatDate(item.updated_at)}
                  </span>
                  <span className={`stock-status ${
                    item.current_stock === 0 ? 'critical' :
                    item.current_stock <= item.min_stock ? 'warning' : 'good'
                  }`}>
                    {item.current_stock === 0 ? '재고없음' :
                     item.current_stock <= item.min_stock ? '부족' : '충분'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">최근 업데이트된 재고가 없습니다.</p>
        )}
      </div>

      <style>{`
        .inventory-dashboard {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .inventory-dashboard h2 {
          margin-bottom: 2rem;
          color: #333;
        }

        .alerts-section {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card.warning {
          border-left: 4px solid #f57c00;
        }

        .stat-card.critical {
          border-left: 4px solid #d32f2f;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .recent-updates {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .recent-updates h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .updates-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .update-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid #eee;
          border-radius: 4px;
          background: #f9f9f9;
        }

        .update-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .current-stock {
          color: #666;
          font-size: 0.9rem;
        }

        .update-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .update-date {
          font-size: 0.8rem;
          color: #999;
        }

        .stock-status {
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .stock-status.good {
          background: #e8f5e8;
          color: #4caf50;
        }

        .stock-status.warning {
          background: #fff8e1;
          color: #f57c00;
        }

        .stock-status.critical {
          background: #ffeaea;
          color: #d32f2f;
        }

        .no-data {
          text-align: center;
          color: #999;
          font-style: italic;
        }

        .dashboard-loading {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default InventoryDashboard;