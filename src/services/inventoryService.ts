import { getDatabase } from '../database/database';
import { Inventory, InventoryWithDetails, InventoryHistory, InventoryHistoryWithDetails } from '../types';

export class InventoryService {
  static getAllInventoryWithDetails(): InventoryWithDetails[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        inv.*,
        i.name as ingredient_name,
        i.unit as ingredient_unit
      FROM inventory inv
      JOIN ingredients i ON inv.ingredient_id = i.id
      ORDER BY i.name
    `);

    const inventory: InventoryWithDetails[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      inventory.push({
        id: row.id as number,
        ingredient_id: row.ingredient_id as number,
        current_stock: row.current_stock as number,
        min_stock: row.min_stock as number,
        updated_at: row.updated_at as string,
        ingredient_name: row.ingredient_name as string,
        ingredient_unit: row.ingredient_unit as string
      });
    }

    stmt.free();
    return inventory;
  }

  static getInventoryByIngredientId(ingredientId: number): Inventory | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM inventory WHERE ingredient_id = ?');
    stmt.bind([ingredientId]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as number,
        ingredient_id: row.ingredient_id as number,
        current_stock: row.current_stock as number,
        min_stock: row.min_stock as number,
        updated_at: row.updated_at as string
      };
    }

    stmt.free();
    return null;
  }

  static updateStock(ingredientId: number, newStock: number, changeType: 'IN' | 'OUT' | 'ADJUST', notes?: string, orderId?: number): void {
    const db = getDatabase();

    // 현재 재고 조회
    const currentInventory = this.getInventoryByIngredientId(ingredientId);
    if (!currentInventory) {
      throw new Error('재고 정보를 찾을 수 없습니다.');
    }

    const previousStock = currentInventory.current_stock;
    const quantity = newStock - previousStock;

    // 재고 업데이트
    const updateStmt = db.prepare(
      'UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE ingredient_id = ?'
    );
    updateStmt.run([newStock, ingredientId]);
    updateStmt.free();

    // 재고 이력 기록
    this.addInventoryHistory({
      ingredient_id: ingredientId,
      change_type: changeType,
      quantity: Math.abs(quantity),
      previous_stock: previousStock,
      new_stock: newStock,
      order_id: orderId,
      notes: notes
    });
  }

  static adjustStock(ingredientId: number, quantity: number, changeType: 'IN' | 'OUT', notes?: string, orderId?: number): void {
    const db = getDatabase();

    const currentInventory = this.getInventoryByIngredientId(ingredientId);
    if (!currentInventory) {
      throw new Error('재고 정보를 찾을 수 없습니다.');
    }

    const previousStock = currentInventory.current_stock;
    const newStock = changeType === 'IN'
      ? previousStock + quantity
      : Math.max(0, previousStock - quantity);

    // 재고 업데이트
    const updateStmt = db.prepare(
      'UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE ingredient_id = ?'
    );
    updateStmt.run([newStock, ingredientId]);
    updateStmt.free();

    // 재고 이력 기록
    this.addInventoryHistory({
      ingredient_id: ingredientId,
      change_type: changeType,
      quantity: quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      order_id: orderId,
      notes: notes
    });
  }

  static updateMinStock(ingredientId: number, minStock: number): void {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE inventory SET min_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE ingredient_id = ?'
    );
    stmt.run([minStock, ingredientId]);
    stmt.free();
  }

  static addInventoryHistory(history: Omit<InventoryHistory, 'id' | 'created_at'>): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO inventory_history
      (ingredient_id, change_type, quantity, previous_stock, new_stock, order_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      history.ingredient_id,
      history.change_type,
      history.quantity,
      history.previous_stock,
      history.new_stock,
      history.order_id || null,
      history.notes || null
    ]);
    stmt.free();
  }

  static getInventoryHistoryWithDetails(): InventoryHistoryWithDetails[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        ih.*,
        i.name as ingredient_name,
        i.unit as ingredient_unit
      FROM inventory_history ih
      JOIN ingredients i ON ih.ingredient_id = i.id
      ORDER BY ih.created_at DESC
    `);

    const history: InventoryHistoryWithDetails[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      history.push({
        id: row.id as number,
        ingredient_id: row.ingredient_id as number,
        change_type: row.change_type as 'IN' | 'OUT' | 'ADJUST',
        quantity: row.quantity as number,
        previous_stock: row.previous_stock as number,
        new_stock: row.new_stock as number,
        order_id: row.order_id as number,
        notes: row.notes as string,
        created_at: row.created_at as string,
        ingredient_name: row.ingredient_name as string,
        ingredient_unit: row.ingredient_unit as string
      });
    }

    stmt.free();
    return history;
  }

  static getLowStockItems(): InventoryWithDetails[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        inv.*,
        i.name as ingredient_name,
        i.unit as ingredient_unit
      FROM inventory inv
      JOIN ingredients i ON inv.ingredient_id = i.id
      WHERE inv.current_stock <= inv.min_stock
      ORDER BY (inv.current_stock - inv.min_stock) ASC
    `);

    const lowStockItems: InventoryWithDetails[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      lowStockItems.push({
        id: row.id as number,
        ingredient_id: row.ingredient_id as number,
        current_stock: row.current_stock as number,
        min_stock: row.min_stock as number,
        updated_at: row.updated_at as string,
        ingredient_name: row.ingredient_name as string,
        ingredient_unit: row.ingredient_unit as string
      });
    }

    stmt.free();
    return lowStockItems;
  }

  static checkStockAvailability(ingredientId: number, requiredQuantity: number): boolean {
    const inventory = this.getInventoryByIngredientId(ingredientId);
    return inventory ? inventory.current_stock >= requiredQuantity : false;
  }
}