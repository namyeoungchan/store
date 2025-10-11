import { getDatabase } from '../database/database';
import { Order, OrderItem, OrderItemWithDetails, PaymentType } from '../types';
import { RecipeService } from './recipeService';
import { InventoryService } from './inventoryService';
import { SalesService } from './salesService';

export class OrderService {
  static getAllOrders(): Order[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM orders ORDER BY order_date DESC');
    const orders: Order[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      orders.push({
        id: row.id as number,
        order_date: row.order_date as string,
        total_amount: row.total_amount as number,
        payment_type: (row.payment_type as PaymentType) || 'CARD',
        expected_deposit_date: row.expected_deposit_date as string,
        is_deposited: Boolean(row.is_deposited),
        deposited_date: row.deposited_date as string
      });
    }

    stmt.free();
    return orders;
  }

  static getOrderById(id: number): Order | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as number,
        order_date: row.order_date as string,
        total_amount: row.total_amount as number,
        payment_type: (row.payment_type as PaymentType) || 'CARD',
        expected_deposit_date: row.expected_deposit_date as string,
        is_deposited: Boolean(row.is_deposited),
        deposited_date: row.deposited_date as string
      };
    }

    stmt.free();
    return null;
  }

  static getOrderItemsByOrderId(orderId: number): OrderItemWithDetails[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        oi.*,
        m.name as menu_name
      FROM order_items oi
      JOIN menus m ON oi.menu_id = m.id
      WHERE oi.order_id = ?
      ORDER BY m.name
    `);

    const orderItems: OrderItemWithDetails[] = [];
    stmt.bind([orderId]);

    while (stmt.step()) {
      const row = stmt.getAsObject();
      orderItems.push({
        id: row.id as number,
        order_id: row.order_id as number,
        menu_id: row.menu_id as number,
        quantity: row.quantity as number,
        unit_price: row.unit_price as number,
        menu_name: row.menu_name as string
      });
    }

    stmt.free();
    return orderItems;
  }

  static createOrder(totalAmount: number, paymentType: PaymentType = 'CARD'): Order {
    const db = getDatabase();

    const orderDate = new Date().toISOString();
    const expectedDepositDate = SalesService.calculateExpectedDepositDate(orderDate, paymentType);

    // 주문 생성
    const orderStmt = db.prepare(
      'INSERT INTO orders (total_amount, payment_type, expected_deposit_date) VALUES (?, ?, ?)'
    );
    orderStmt.run([totalAmount, paymentType, expectedDepositDate]);
    orderStmt.free();

    // 주문 ID 가져오기
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();
    const orderId = result.id as number;

    // 생성된 주문 반환
    return this.getOrderById(orderId)!;
  }

  static addOrderItem(orderItem: Omit<OrderItem, 'id'>): OrderItem {
    const db = getDatabase();

    const itemStmt = db.prepare(
      'INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );
    itemStmt.run([orderItem.order_id, orderItem.menu_id, orderItem.quantity, orderItem.unit_price]);
    itemStmt.free();

    // 생성된 아이템 ID 가져오기
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const itemResult = lastIdStmt.getAsObject();
    lastIdStmt.free();

    return {
      id: itemResult.id as number,
      ...orderItem
    };
  }

  static getOrderItemsWithDetails(orderId: number): OrderItemWithDetails[] {
    return this.getOrderItemsByOrderId(orderId);
  }

  static updateOrderItemQuantity(itemId: number, newQuantity: number): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE order_items SET quantity = ? WHERE id = ?');
    stmt.run([newQuantity, itemId]);
    stmt.free();
  }

  static updateOrderTotal(orderId: number, newTotal: number): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?');
    stmt.run([newTotal, orderId]);
    stmt.free();
  }

  static deleteOrderItem(itemId: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM order_items WHERE id = ?');
    stmt.run([itemId]);
    stmt.free();
  }

  static createOrderWithItems(
    orderItems: Array<{ menu_id: number; quantity: number; unit_price: number }>,
    paymentType: PaymentType = 'CARD'
  ): number {
    const db = getDatabase();

    // 주문 가능 여부 확인 (재고 체크)
    for (const item of orderItems) {
      const recipes = RecipeService.getRecipesByMenuId(item.menu_id);
      for (const recipe of recipes) {
        const requiredQuantity = recipe.quantity * item.quantity;
        if (!InventoryService.checkStockAvailability(recipe.ingredient_id, requiredQuantity)) {
          throw new Error(`재고 부족: ${recipe.ingredient_name} (필요: ${requiredQuantity}${recipe.ingredient_unit}, 현재: ${InventoryService.getInventoryByIngredientId(recipe.ingredient_id)?.current_stock || 0}${recipe.ingredient_unit})`);
        }
      }
    }

    // 총 금액 계산
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // 입금 예정일 계산
    const orderDate = new Date().toISOString();
    const expectedDepositDate = SalesService.calculateExpectedDepositDate(orderDate, paymentType);

    // 주문 생성
    const orderStmt = db.prepare(
      'INSERT INTO orders (total_amount, payment_type, expected_deposit_date) VALUES (?, ?, ?)'
    );
    orderStmt.run([totalAmount, paymentType, expectedDepositDate]);
    orderStmt.free();

    // 주문 ID 가져오기
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();
    const orderId = result.id as number;

    // 주문 상세 항목 추가
    for (const item of orderItems) {
      const itemStmt = db.prepare(
        'INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
      );
      itemStmt.run([orderId, item.menu_id, item.quantity, item.unit_price]);
      itemStmt.free();
    }

    // 재고 차감
    this.deductInventoryForOrder(orderId, orderItems);

    return orderId;
  }

  private static deductInventoryForOrder(orderId: number, orderItems: Array<{ menu_id: number; quantity: number; unit_price: number }>): void {
    for (const item of orderItems) {
      const recipes = RecipeService.getRecipesByMenuId(item.menu_id);

      for (const recipe of recipes) {
        const requiredQuantity = recipe.quantity * item.quantity;
        InventoryService.adjustStock(
          recipe.ingredient_id,
          requiredQuantity,
          'OUT',
          `주문 ${orderId} - ${recipe.menu_name} ${item.quantity}개`,
          orderId
        );
      }
    }
  }

  static deleteOrder(id: number): void {
    const db = getDatabase();

    // 주문과 관련된 재고 변동을 되돌릴지는 비즈니스 로직에 따라 결정
    // 여기서는 단순히 주문만 삭제 (재고는 그대로)
    const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
    stmt.run([id]);
    stmt.free();
  }

  static getOrderSummary(): {
    todayOrders: number;
    todayRevenue: number;
    totalOrders: number;
    totalRevenue: number;
  } {
    const db = getDatabase();

    // 오늘 주문
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE DATE(order_date) = DATE('now')
    `);
    todayStmt.step();
    const todayResult = todayStmt.getAsObject();
    todayStmt.free();

    // 전체 주문
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
    `);
    totalStmt.step();
    const totalResult = totalStmt.getAsObject();
    totalStmt.free();

    return {
      todayOrders: todayResult.count as number,
      todayRevenue: todayResult.revenue as number,
      totalOrders: totalResult.count as number,
      totalRevenue: totalResult.revenue as number
    };
  }

  static getPopularMenus(limit: number = 10): Array<{ menu_name: string; total_quantity: number; total_revenue: number }> {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        m.name as menu_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM order_items oi
      JOIN menus m ON oi.menu_id = m.id
      GROUP BY oi.menu_id, m.name
      ORDER BY total_quantity DESC
      LIMIT ?
    `);

    const popularMenus: Array<{ menu_name: string; total_quantity: number; total_revenue: number }> = [];
    stmt.bind([limit]);

    while (stmt.step()) {
      const row = stmt.getAsObject();
      popularMenus.push({
        menu_name: row.menu_name as string,
        total_quantity: row.total_quantity as number,
        total_revenue: row.total_revenue as number
      });
    }

    stmt.free();
    return popularMenus;
  }
}