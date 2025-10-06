import { getDatabase } from '../database/database';
import { InventoryWithDetails, InventoryHistoryWithDetails } from '../types';

export interface DashboardStats {
  totalIngredients: number;
  totalInventoryItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  recentTransactions: number;
}

export interface StockTrend {
  ingredient_id: number;
  ingredient_name: string;
  changes: Array<{
    date: string;
    stock_level: number;
    change_type: string;
  }>;
}

export const dashboardService = {
  // 대시보드 통계 조회
  async getDashboardStats(): Promise<DashboardStats> {
    const db = getDatabase();

    // 총 재료 수
    const totalIngredientsResult = db.exec(`
      SELECT COUNT(*) as count FROM ingredients
    `);
    const totalIngredients = totalIngredientsResult[0]?.values[0]?.[0] as number || 0;

    // 총 재고 아이템 수
    const totalInventoryResult = db.exec(`
      SELECT COUNT(*) as count FROM inventory
    `);
    const totalInventoryItems = totalInventoryResult[0]?.values[0]?.[0] as number || 0;

    // 부족 재고 수 (현재 재고 <= 최소 재고)
    const lowStockResult = db.exec(`
      SELECT COUNT(*) as count
      FROM inventory
      WHERE current_stock <= min_stock AND current_stock > 0
    `);
    const lowStockCount = lowStockResult[0]?.values[0]?.[0] as number || 0;

    // 재고 없음 수
    const outOfStockResult = db.exec(`
      SELECT COUNT(*) as count
      FROM inventory
      WHERE current_stock = 0
    `);
    const outOfStockCount = outOfStockResult[0]?.values[0]?.[0] as number || 0;

    // 총 재고 가치 (단순 재고량 합계)
    const totalStockResult = db.exec(`
      SELECT COALESCE(SUM(current_stock), 0) as total
      FROM inventory
    `);
    const totalStockValue = totalStockResult[0]?.values[0]?.[0] as number || 0;

    // 최근 24시간 거래 수
    const recentTransactionsResult = db.exec(`
      SELECT COUNT(*) as count
      FROM inventory_history
      WHERE created_at >= datetime('now', '-1 day')
    `);
    const recentTransactions = recentTransactionsResult[0]?.values[0]?.[0] as number || 0;

    return {
      totalIngredients,
      totalInventoryItems,
      lowStockCount,
      outOfStockCount,
      totalStockValue,
      recentTransactions
    };
  },

  // 부족 재고 목록 조회
  async getLowStockItems(): Promise<InventoryWithDetails[]> {
    const db = getDatabase();

    const result = db.exec(`
      SELECT
        i.id,
        i.ingredient_id,
        i.current_stock,
        i.min_stock,
        i.updated_at,
        ing.name as ingredient_name,
        ing.unit as ingredient_unit
      FROM inventory i
      JOIN ingredients ing ON i.ingredient_id = ing.id
      WHERE i.current_stock <= i.min_stock
      ORDER BY
        CASE WHEN i.current_stock = 0 THEN 0 ELSE 1 END,
        (i.current_stock / NULLIF(i.min_stock, 0)) ASC
    `);

    if (!result[0]) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      ingredient_id: row[1] as number,
      current_stock: row[2] as number,
      min_stock: row[3] as number,
      updated_at: row[4] as string,
      ingredient_name: row[5] as string,
      ingredient_unit: row[6] as string
    }));
  },

  // 재고 이력 트렌드 조회 (지난 30일)
  async getStockTrends(ingredientId?: number): Promise<StockTrend[]> {
    const db = getDatabase();

    let query = `
      SELECT
        ih.ingredient_id,
        ing.name as ingredient_name,
        DATE(ih.created_at) as date,
        ih.new_stock as stock_level,
        ih.change_type
      FROM inventory_history ih
      JOIN ingredients ing ON ih.ingredient_id = ing.id
      WHERE ih.created_at >= datetime('now', '-30 days')
    `;

    if (ingredientId) {
      query += ` AND ih.ingredient_id = ${ingredientId}`;
    }

    query += `
      ORDER BY ih.ingredient_id, ih.created_at
    `;

    const result = db.exec(query);

    if (!result[0]) return [];

    const trendsMap = new Map<number, StockTrend>();

    result[0].values.forEach(row => {
      const ingredientId = row[0] as number;
      const ingredientName = row[1] as string;
      const date = row[2] as string;
      const stockLevel = row[3] as number;
      const changeType = row[4] as string;

      if (!trendsMap.has(ingredientId)) {
        trendsMap.set(ingredientId, {
          ingredient_id: ingredientId,
          ingredient_name: ingredientName,
          changes: []
        });
      }

      trendsMap.get(ingredientId)!.changes.push({
        date,
        stock_level: stockLevel,
        change_type: changeType
      });
    });

    return Array.from(trendsMap.values());
  },

  // 최근 재고 변경 이력 조회
  async getRecentInventoryHistory(limit: number = 10): Promise<InventoryHistoryWithDetails[]> {
    const db = getDatabase();

    const result = db.exec(`
      SELECT
        ih.id,
        ih.ingredient_id,
        ih.change_type,
        ih.quantity,
        ih.previous_stock,
        ih.new_stock,
        ih.order_id,
        ih.notes,
        ih.created_at,
        ing.name as ingredient_name,
        ing.unit as ingredient_unit
      FROM inventory_history ih
      JOIN ingredients ing ON ih.ingredient_id = ing.id
      ORDER BY ih.created_at DESC
      LIMIT ${limit}
    `);

    if (!result[0]) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      ingredient_id: row[1] as number,
      change_type: row[2] as 'IN' | 'OUT' | 'ADJUST',
      quantity: row[3] as number,
      previous_stock: row[4] as number,
      new_stock: row[5] as number,
      order_id: row[6] as number | null,
      notes: row[7] as string | null,
      created_at: row[8] as string,
      ingredient_name: row[9] as string,
      ingredient_unit: row[10] as string
    }));
  },

  // 재고 회전율 계산 (지난 30일 기준)
  async getInventoryTurnover(): Promise<Array<{
    ingredient_id: number;
    ingredient_name: string;
    turnover_rate: number;
    avg_stock: number;
    total_used: number;
  }>> {
    const db = getDatabase();

    const result = db.exec(`
      SELECT
        ih.ingredient_id,
        ing.name as ingredient_name,
        AVG(ih.new_stock) as avg_stock,
        SUM(CASE WHEN ih.change_type = 'OUT' THEN ABS(ih.quantity) ELSE 0 END) as total_used
      FROM inventory_history ih
      JOIN ingredients ing ON ih.ingredient_id = ing.id
      WHERE ih.created_at >= datetime('now', '-30 days')
      GROUP BY ih.ingredient_id, ing.name
      HAVING total_used > 0
    `);

    if (!result[0]) return [];

    return result[0].values.map(row => {
      const avgStock = row[2] as number;
      const totalUsed = row[3] as number;
      const turnoverRate = avgStock > 0 ? totalUsed / avgStock : 0;

      return {
        ingredient_id: row[0] as number,
        ingredient_name: row[1] as string,
        turnover_rate: turnoverRate,
        avg_stock: avgStock,
        total_used: totalUsed
      };
    });
  }
};