import { FirestoreService } from '../database/database';
import { Order, OrderItem, OrderItemWithDetails, PaymentType } from '../types';
import { RecipeService } from './recipeService';
import { InventoryService } from './inventoryService';
import { SalesService } from './salesService';

export class OrderService {
  private static collectionName = FirestoreService.collections.orders;
  private static orderItemsCollectionName = FirestoreService.collections.orderItems;

  static async getAllOrders(): Promise<Order[]> {
    try {
      const orders = await FirestoreService.getOrderedBy(this.collectionName, 'order_date', 'desc');
      return orders.map(doc => this.mapDocumentToOrder(doc));
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  static async getOrderById(id: string): Promise<Order | null> {
    try {
      const doc = await FirestoreService.getById(this.collectionName, id);
      return doc ? this.mapDocumentToOrder(doc) : null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  }

  static async getOrderItemsByOrderId(orderId: string): Promise<OrderItemWithDetails[]> {
    try {
      const orderItems = await FirestoreService.getWhere(
        this.orderItemsCollectionName,
        'order_id',
        '==',
        orderId
      );

      const orderItemsWithDetails: OrderItemWithDetails[] = [];

      for (const item of orderItems) {
        const menu = await FirestoreService.getById(
          FirestoreService.collections.menus,
          item.menu_id
        );

        if (menu) {
          orderItemsWithDetails.push({
            id: item.id,
            order_id: item.order_id,
            menu_id: item.menu_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            menu_name: menu.name
          });
        }
      }

      return orderItemsWithDetails.sort((a, b) => a.menu_name.localeCompare(b.menu_name));
    } catch (error) {
      console.error('Error getting order items by order ID:', error);
      return [];
    }
  }

  static async createOrder(totalAmount: number, paymentType: PaymentType = 'CARD'): Promise<Order> {
    try {
      const orderDate = new Date().toISOString();
      const expectedDepositDate = SalesService.calculateExpectedDepositDate(orderDate, paymentType);

      const orderData = {
        order_date: orderDate,
        total_amount: totalAmount,
        payment_type: paymentType,
        expected_deposit_date: expectedDepositDate,
        is_deposited: false,
        deposited_date: null
      };

      const orderId = await FirestoreService.create(this.collectionName, orderData);
      const newOrder = await this.getOrderById(orderId);

      if (!newOrder) {
        throw new Error('Failed to retrieve created order');
      }

      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  static async addOrderItem(orderItem: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    try {
      const itemId = await FirestoreService.create(this.orderItemsCollectionName, orderItem);
      return {
        id: itemId,
        ...orderItem
      };
    } catch (error) {
      console.error('Error adding order item:', error);
      throw error;
    }
  }

  static async getOrderItemsWithDetails(orderId: string): Promise<OrderItemWithDetails[]> {
    return await this.getOrderItemsByOrderId(orderId);
  }

  static async updateOrderItemQuantity(itemId: string, newQuantity: number): Promise<void> {
    try {
      await FirestoreService.update(this.orderItemsCollectionName, itemId, {
        quantity: newQuantity
      });
    } catch (error) {
      console.error('Error updating order item quantity:', error);
      throw error;
    }
  }

  static async updateOrderTotal(orderId: string, newTotal: number): Promise<void> {
    try {
      await FirestoreService.update(this.collectionName, orderId, {
        total_amount: newTotal
      });
    } catch (error) {
      console.error('Error updating order total:', error);
      throw error;
    }
  }

  static async deleteOrderItem(itemId: string): Promise<void> {
    try {
      await FirestoreService.delete(this.orderItemsCollectionName, itemId);
    } catch (error) {
      console.error('Error deleting order item:', error);
      throw error;
    }
  }

  static async createOrderWithItems(
    orderItems: Array<{ menu_id: string; quantity: number; unit_price: number }>,
    paymentType: PaymentType = 'CARD'
  ): Promise<string> {
    try {
      // 주문 가능 여부 확인 (재고 체크)
      for (const item of orderItems) {
        const recipes = await RecipeService.getRecipesByMenuId(item.menu_id);
        for (const recipe of recipes) {
          const requiredQuantity = recipe.quantity * item.quantity;
          const hasStock = await InventoryService.checkStockAvailability(recipe.ingredient_id, requiredQuantity);

          if (!hasStock) {
            const inventory = await InventoryService.getInventoryByIngredientId(recipe.ingredient_id);
            throw new Error(`재고 부족: ${recipe.ingredient_name} (필요: ${requiredQuantity}${recipe.ingredient_unit}, 현재: ${inventory?.current_stock || 0}${recipe.ingredient_unit})`);
          }
        }
      }

      // 총 금액 계산
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      // 주문 생성
      const order = await this.createOrder(totalAmount, paymentType);

      // 주문 상세 항목 추가
      for (const item of orderItems) {
        await this.addOrderItem({
          order_id: order.id!,
          menu_id: item.menu_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        });
      }

      // 재고 차감
      await this.deductInventoryForOrder(order.id!, orderItems);

      return order.id!;
    } catch (error) {
      console.error('Error creating order with items:', error);
      throw error;
    }
  }

  private static async deductInventoryForOrder(orderId: string, orderItems: Array<{ menu_id: string; quantity: number; unit_price: number }>): Promise<void> {
    try {
      for (const item of orderItems) {
        const recipes = await RecipeService.getRecipesByMenuId(item.menu_id);

        for (const recipe of recipes) {
          const requiredQuantity = recipe.quantity * item.quantity;
          await InventoryService.adjustStock(
            recipe.ingredient_id,
            requiredQuantity,
            'OUT',
            `주문 ${orderId} - ${recipe.menu_name} ${item.quantity}개`,
            orderId
          );
        }
      }
    } catch (error) {
      console.error('Error deducting inventory for order:', error);
      throw error;
    }
  }

  static async deleteOrder(id: string): Promise<void> {
    try {
      // 주문과 관련된 재고 변동을 되돌릴지는 비즈니스 로직에 따라 결정
      // 여기서는 단순히 주문만 삭제 (재고는 그대로)
      await FirestoreService.delete(this.collectionName, id);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  static async getOrderSummary(): Promise<{
    todayOrders: number;
    todayRevenue: number;
    totalOrders: number;
    totalRevenue: number;
  }> {
    try {
      const allOrders = await FirestoreService.getAll(this.collectionName);

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(order =>
        order.order_date?.startsWith(today)
      );

      return {
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        totalOrders: allOrders.length,
        totalRevenue: allOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      };
    } catch (error) {
      console.error('Error getting order summary:', error);
      return {
        todayOrders: 0,
        todayRevenue: 0,
        totalOrders: 0,
        totalRevenue: 0
      };
    }
  }

  static async getPopularMenus(limit: number = 10): Promise<Array<{ menu_name: string; total_quantity: number; total_revenue: number }>> {
    try {
      const allOrderItems = await FirestoreService.getAll(this.orderItemsCollectionName);

      const menuStats = new Map<string, { menu_name: string; total_quantity: number; total_revenue: number }>();

      for (const item of allOrderItems) {
        const menu = await FirestoreService.getById(
          FirestoreService.collections.menus,
          item.menu_id
        );

        if (menu) {
          const menuId = item.menu_id;
          if (!menuStats.has(menuId)) {
            menuStats.set(menuId, {
              menu_name: menu.name,
              total_quantity: 0,
              total_revenue: 0
            });
          }

          const stats = menuStats.get(menuId)!;
          stats.total_quantity += item.quantity || 0;
          stats.total_revenue += (item.quantity || 0) * (item.unit_price || 0);
        }
      }

      return Array.from(menuStats.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting popular menus:', error);
      return [];
    }
  }

  private static mapDocumentToOrder(doc: any): Order {
    return {
      id: doc.id,
      order_date: doc.order_date,
      total_amount: doc.total_amount || 0,
      payment_type: (doc.payment_type as PaymentType) || 'CARD',
      expected_deposit_date: doc.expected_deposit_date,
      is_deposited: Boolean(doc.is_deposited),
      deposited_date: doc.deposited_date
    };
  }
}