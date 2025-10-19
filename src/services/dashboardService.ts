import { FirestoreService } from '../database/database';
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
  ingredient_id: string;
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
    try {
      // 총 재료 수
      const ingredients = await FirestoreService.getAll(FirestoreService.collections.ingredients);
      const totalIngredients = ingredients.length;

      // 총 재고 아이템 수
      const inventory = await FirestoreService.getAll(FirestoreService.collections.inventory);
      const totalInventoryItems = inventory.length;

      // 부족 재고 수 (현재 재고 <= 최소 재고 && 현재 재고 > 0)
      const lowStockCount = inventory.filter(item =>
        (item.current_stock || 0) <= (item.min_stock || 0) &&
        (item.current_stock || 0) > 0
      ).length;

      // 재고 없음 수
      const outOfStockCount = inventory.filter(item =>
        (item.current_stock || 0) === 0
      ).length;

      // 총 재고 가치 (현재는 단순히 재고 수량의 합계로 계산)
      const totalStockValue = inventory.reduce((sum, item) =>
        sum + (item.current_stock || 0), 0
      );

      // 최근 거래 수 (최근 7일)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const inventoryHistory = await FirestoreService.getAll(FirestoreService.collections.inventoryHistory);
      const recentTransactions = inventoryHistory.filter(record =>
        record.created_at >= sevenDaysAgoISO
      ).length;

      return {
        totalIngredients,
        totalInventoryItems,
        lowStockCount,
        outOfStockCount,
        totalStockValue,
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalIngredients: 0,
        totalInventoryItems: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalStockValue: 0,
        recentTransactions: 0
      };
    }
  },

  // 재고 추세 분석
  async getStockTrends(ingredientIds?: string[], days: number = 30): Promise<StockTrend[]> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      const targetDateISO = targetDate.toISOString();

      let targetIngredients: any[];

      if (ingredientIds && ingredientIds.length > 0) {
        targetIngredients = [];
        for (const id of ingredientIds) {
          const ingredient = await FirestoreService.getById(FirestoreService.collections.ingredients, id);
          if (ingredient) {
            targetIngredients.push(ingredient);
          }
        }
      } else {
        targetIngredients = await FirestoreService.getAll(FirestoreService.collections.ingredients);
      }

      const trends: StockTrend[] = [];

      for (const ingredient of targetIngredients) {
        // 해당 재료의 재고 변동 이력 조회
        const historyRecords = await FirestoreService.getWithMultipleWhere(
          FirestoreService.collections.inventoryHistory,
          [
            { field: 'ingredient_id', operator: '==', value: ingredient.id },
            { field: 'created_at', operator: '>=', value: targetDateISO }
          ]
        );

        // 날짜별로 그룹화하고 정렬
        const changes = historyRecords
          .map(record => ({
            date: record.created_at?.split('T')[0] || '',
            stock_level: record.new_stock || 0,
            change_type: record.change_type || 'UNKNOWN'
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        trends.push({
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          changes
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting stock trends:', error);
      return [];
    }
  },

  // 최근 재고 변동 내역
  async getRecentInventoryChanges(limit: number = 10): Promise<InventoryHistoryWithDetails[]> {
    try {
      const historyRecords = await FirestoreService.getOrderedBy(
        FirestoreService.collections.inventoryHistory,
        'created_at',
        'desc'
      );

      const limitedRecords = historyRecords.slice(0, limit);
      const historyWithDetails: InventoryHistoryWithDetails[] = [];

      for (const record of limitedRecords) {
        const ingredient = await FirestoreService.getById(
          FirestoreService.collections.ingredients,
          record.ingredient_id
        );

        if (ingredient) {
          historyWithDetails.push({
            id: record.id,
            ingredient_id: record.ingredient_id,
            change_type: record.change_type as 'IN' | 'OUT' | 'ADJUST',
            quantity: record.quantity || 0,
            previous_stock: record.previous_stock || 0,
            new_stock: record.new_stock || 0,
            order_id: record.order_id,
            notes: record.notes,
            created_at: record.created_at,
            ingredient_name: ingredient.name,
            ingredient_unit: ingredient.unit
          });
        }
      }

      return historyWithDetails;
    } catch (error) {
      console.error('Error getting recent inventory changes:', error);
      return [];
    }
  },

  // 재고 부족 알림 항목
  async getLowStockAlerts(): Promise<InventoryWithDetails[]> {
    try {
      const inventoryRecords = await FirestoreService.getAll(FirestoreService.collections.inventory);
      const lowStockItems: InventoryWithDetails[] = [];

      for (const invRecord of inventoryRecords) {
        if ((invRecord.current_stock || 0) <= (invRecord.min_stock || 0)) {
          const ingredient = await FirestoreService.getById(
            FirestoreService.collections.ingredients,
            invRecord.ingredient_id
          );

          if (ingredient) {
            lowStockItems.push({
              id: invRecord.id,
              ingredient_id: invRecord.ingredient_id,
              current_stock: invRecord.current_stock || 0,
              min_stock: invRecord.min_stock || 0,
              updated_at: invRecord.updated_at,
              ingredient_name: ingredient.name,
              ingredient_unit: ingredient.unit
            });
          }
        }
      }

      // 부족한 정도에 따라 정렬 (부족한 것부터)
      return lowStockItems.sort((a, b) =>
        (a.current_stock - a.min_stock) - (b.current_stock - b.min_stock)
      );
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      return [];
    }
  },

  // 월별 매출 통계 (간단 버전)
  async getMonthlySalesStats(year: number): Promise<Array<{ month: number; sales: number; orders: number }>> {
    try {
      const allOrders = await FirestoreService.getAll(FirestoreService.collections.orders);

      const monthlyStats = new Map<number, { sales: number; orders: number }>();

      // 초기화 (1-12월)
      for (let i = 1; i <= 12; i++) {
        monthlyStats.set(i, { sales: 0, orders: 0 });
      }

      allOrders.forEach(order => {
        if (!order.order_date) return;

        const orderDate = new Date(order.order_date);
        if (orderDate.getFullYear() === year) {
          const month = orderDate.getMonth() + 1; // 0-based to 1-based
          const stats = monthlyStats.get(month)!;
          stats.sales += order.total_amount || 0;
          stats.orders += 1;
        }
      });

      const result: Array<{ month: number; sales: number; orders: number }> = [];
      monthlyStats.forEach((value, key) => {
        result.push({
          month: key,
          sales: value.sales,
          orders: value.orders
        });
      });

      return result.sort((a, b) => a.month - b.month);
    } catch (error) {
      console.error('Error getting monthly sales stats:', error);
      return [];
    }
  }
};