import { FirestoreService } from '../database/database';
import { Inventory, InventoryWithDetails, InventoryHistory, InventoryHistoryWithDetails } from '../types';

export class InventoryService {
  private static collectionName = FirestoreService.collections.inventory;
  private static historyCollectionName = FirestoreService.collections.inventoryHistory;

  static async getAllInventoryWithDetails(): Promise<InventoryWithDetails[]> {
    try {
      const inventoryItems = await FirestoreService.getAll(this.collectionName);
      const inventoryWithDetails: InventoryWithDetails[] = [];

      for (const item of inventoryItems) {
        const ingredient = await FirestoreService.getById(
          FirestoreService.collections.ingredients,
          item.ingredient_id
        );

        if (ingredient) {
          inventoryWithDetails.push({
            id: item.id,
            ingredient_id: item.ingredient_id,
            current_stock: item.current_stock || 0,
            min_stock: item.min_stock || 0,
            updated_at: item.updated_at,
            ingredient_name: ingredient.name,
            ingredient_unit: ingredient.unit
          });
        }
      }

      return inventoryWithDetails.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
    } catch (error) {
      console.error('Error getting inventory with details:', error);
      return [];
    }
  }

  static async getInventoryByIngredientId(ingredientId: string): Promise<Inventory | null> {
    try {
      const items = await FirestoreService.getWhere(this.collectionName, 'ingredient_id', '==', ingredientId);
      if (items.length === 0) return null;
      return items[0] as Inventory;
    } catch (error) {
      console.error('Error getting inventory by ingredient ID:', error);
      return null;
    }
  }

  static async updateStock(ingredientId: string, newStock: number, changeType: 'IN' | 'OUT' | 'ADJUST', notes?: string, orderId?: string): Promise<void> {
    try {
      const currentInventory = await this.getInventoryByIngredientId(ingredientId);
      if (!currentInventory) {
        throw new Error('재고 정보를 찾을 수 없습니다.');
      }

      const previousStock = currentInventory.current_stock;
      const quantity = Math.abs(newStock - previousStock);

      await FirestoreService.update(this.collectionName, currentInventory.id!, { current_stock: newStock });

      await this.addInventoryHistory({
        ingredient_id: ingredientId,
        change_type: changeType,
        quantity: quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        order_id: orderId || null,
        notes: notes || null
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  static async adjustStock(ingredientId: string, quantity: number, changeType: 'IN' | 'OUT', notes?: string, orderId?: string): Promise<void> {
    try {
      const currentInventory = await this.getInventoryByIngredientId(ingredientId);
      if (!currentInventory) {
        throw new Error('재고 정보를 찾을 수 없습니다.');
      }

      const previousStock = currentInventory.current_stock;
      const newStock = changeType === 'IN'
        ? previousStock + quantity
        : Math.max(0, previousStock - quantity);

      await FirestoreService.update(this.collectionName, currentInventory.id!, { current_stock: newStock });

      await this.addInventoryHistory({
        ingredient_id: ingredientId,
        change_type: changeType,
        quantity: quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        order_id: orderId || null,
        notes: notes || null
      });
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  static async updateMinStock(ingredientId: string, minStock: number): Promise<void> {
    try {
      const currentInventory = await this.getInventoryByIngredientId(ingredientId);
      if (!currentInventory) {
        throw new Error('재고 정보를 찾을 수 없습니다.');
      }

      await FirestoreService.update(this.collectionName, currentInventory.id!, { min_stock: minStock });
    } catch (error) {
      console.error('Error updating min stock:', error);
      throw error;
    }
  }

  static async addInventoryHistory(history: Omit<InventoryHistory, 'id' | 'created_at'>): Promise<void> {
    try {
      await FirestoreService.create(this.historyCollectionName, history);
    } catch (error) {
      console.error('Error adding inventory history:', error);
      throw error;
    }
  }

  static async getInventoryHistoryWithDetails(): Promise<InventoryHistoryWithDetails[]> {
    try {
      const historyRecords = await FirestoreService.getOrderedBy(this.historyCollectionName, 'created_at', 'desc');
      const historyWithDetails: InventoryHistoryWithDetails[] = [];

      for (const item of historyRecords) {
        const ingredient = await FirestoreService.getById(
          FirestoreService.collections.ingredients,
          item.ingredient_id
        );

        if (ingredient) {
          historyWithDetails.push({
            id: item.id,
            ingredient_id: item.ingredient_id,
            change_type: item.change_type as 'IN' | 'OUT' | 'ADJUST',
            quantity: item.quantity,
            previous_stock: item.previous_stock,
            new_stock: item.new_stock,
            order_id: item.order_id,
            notes: item.notes,
            created_at: item.created_at,
            ingredient_name: ingredient.name,
            ingredient_unit: ingredient.unit
          });
        }
      }

      return historyWithDetails;
    } catch (error) {
      console.error('Error getting inventory history with details:', error);
      return [];
    }
  }

  static async getLowStockItems(): Promise<InventoryWithDetails[]> {
    try {
      const allInventory = await this.getAllInventoryWithDetails();
      return allInventory
        .filter(item => item.current_stock <= item.min_stock)
        .sort((a, b) => (a.current_stock - a.min_stock) - (b.current_stock - b.min_stock));
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  static async checkStockAvailability(ingredientId: string, requiredQuantity: number): Promise<boolean> {
    try {
      const inventory = await this.getInventoryByIngredientId(ingredientId);
      return inventory ? inventory.current_stock >= requiredQuantity : false;
    } catch (error) {
      console.error('Error checking stock availability:', error);
      return false;
    }
  }
}
