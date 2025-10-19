import React, { useState, useEffect } from 'react';
import { Order, OrderItemWithDetails } from '../types';
import { OrderService } from '../services/orderService';
import { MenuService } from '../services/menuService';
import { InventoryService } from '../services/inventoryService';

interface OrderManagementProps {
  onOrderUpdate?: () => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ onOrderUpdate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const orderData = await OrderService.getAllOrders();
      // 최근 주문부터 표시
      setOrders(orderData.sort((a, b) =>
        new Date(b.order_date || 0).getTime() - new Date(a.order_date || 0).getTime()
      ));
    } catch (err) {
      setError('주문 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const items = await OrderService.getOrderItemsWithDetails(orderId);
      setOrderItems(items);
    } catch (err) {
      setError('주문 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    loadOrderItems(order.id!);
  };

  const cancelOrder = async (order: Order) => {
    const confirmMessage = `
주문 #${order.id}를 취소하시겠습니까?

취소 시 사용된 재료가 재고에 다시 추가됩니다.
이 작업은 되돌릴 수 없습니다.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 주문 아이템들의 재료를 재고에 다시 추가
      const items = await OrderService.getOrderItemsWithDetails(order.id!);

      for (const item of items) {
        const recipes = await MenuService.getRecipesByMenuId(item.menu_id);

        for (const recipe of recipes) {
          const returnAmount = recipe.quantity * item.quantity;
          await InventoryService.adjustStock(
            recipe.ingredient_id,
            returnAmount,
            'IN',
            `주문 취소 #${order.id} - ${item.menu_name}`
          );
        }
      }

      // 주문 삭제
      await OrderService.deleteOrder(order.id!);

      setSuccess('주문이 성공적으로 취소되었습니다.');
      await loadOrders();

      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
        setOrderItems([]);
      }

      if (onOrderUpdate) {
        onOrderUpdate();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 취소 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const modifyOrderItemQuantity = async (
    orderId: string,
    itemId: string,
    menuId: string,
    currentQuantity: number,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      await removeOrderItem(orderId, itemId, menuId, currentQuantity);
      return;
    }

    const quantityDiff = newQuantity - currentQuantity;
    const confirmMessage = quantityDiff > 0
      ? `수량을 ${currentQuantity}개에서 ${newQuantity}개로 증가시키시겠습니까?\n(재고에서 추가로 차감됩니다)`
      : `수량을 ${currentQuantity}개에서 ${newQuantity}개로 감소시키시겠습니까?\n(재고에 반환됩니다)`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 재고 조정
      const recipes = await MenuService.getRecipesByMenuId(menuId);

      for (const recipe of recipes) {
        const stockChange = recipe.quantity * Math.abs(quantityDiff);

        if (quantityDiff > 0) {
          // 수량 증가 - 재고 차감
          const inventory = await InventoryService.getInventoryByIngredientId(recipe.ingredient_id);
          if (!inventory || inventory.current_stock < stockChange) {
            setError(`재고가 부족합니다: ${recipe.ingredient_name} (필요: ${stockChange}, 재고: ${inventory?.current_stock || 0})`);
            setLoading(false);
            return;
          }

          await InventoryService.adjustStock(
            recipe.ingredient_id,
            stockChange,
            'OUT',
            `주문 수정 #${orderId} - 수량 증가`
          );
        } else {
          // 수량 감소 - 재고 반환
          await InventoryService.adjustStock(
            recipe.ingredient_id,
            stockChange,
            'IN',
            `주문 수정 #${orderId} - 수량 감소`
          );
        }
      }

      // 주문 아이템 수량 업데이트
      await OrderService.updateOrderItemQuantity(itemId, newQuantity);

      // 주문 총액 재계산
      const updatedItems = await OrderService.getOrderItemsWithDetails(orderId);
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      await OrderService.updateOrderTotal(orderId, newTotal);

      setSuccess('주문이 성공적으로 수정되었습니다.');
      await loadOrders();
      await loadOrderItems(orderId);

      if (onOrderUpdate) {
        onOrderUpdate();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeOrderItem = async (orderId: string, itemId: string, menuId: string, quantity: number) => {
    if (!window.confirm('이 메뉴를 주문에서 제거하시겠습니까?\n재고가 반환됩니다.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 재고 반환
      const recipes = await MenuService.getRecipesByMenuId(menuId);

      for (const recipe of recipes) {
        const returnAmount = recipe.quantity * quantity;
        await InventoryService.adjustStock(
          recipe.ingredient_id,
          returnAmount,
          'IN',
          `주문 아이템 제거 #${orderId}`
        );
      }

      // 주문 아이템 삭제
      await OrderService.deleteOrderItem(itemId);

      // 주문 총액 재계산
      const updatedItems = await OrderService.getOrderItemsWithDetails(orderId);
      if (updatedItems.length === 0) {
        // 모든 아이템이 제거되면 주문 삭제
        await OrderService.deleteOrder(orderId);
        setSelectedOrder(null);
        setOrderItems([]);
      } else {
        const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        await OrderService.updateOrderTotal(orderId, newTotal);
        await loadOrderItems(orderId);
      }

      setSuccess('주문 아이템이 제거되었습니다.');
      await loadOrders();

      if (onOrderUpdate) {
        onOrderUpdate();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '아이템 제거 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-management">
      <div className="management-header">
        <h2>📋 주문 관리</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <div className="management-content">
        {/* 주문 목록 */}
        <div className="orders-list">
          <h3>주문 목록 ({orders.length})</h3>
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>주문이 없습니다.</p>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div
                  key={order.id}
                  className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                  onClick={() => selectOrder(order)}
                >
                  <div className="order-header">
                    <span className="order-id">주문 #{order.id}</span>
                    <span className="order-date">{formatDate(order.order_date)}</span>
                  </div>
                  <div className="order-amount">
                    ₩{order.total_amount.toLocaleString()}
                  </div>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelOrder(order);
                    }}
                    disabled={loading}
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 주문 상세 */}
        {selectedOrder && (
          <div className="order-details">
            <h3>주문 상세 - #{selectedOrder.id}</h3>
            <div className="order-info">
              <p><strong>주문 시간:</strong> {formatDate(selectedOrder.order_date)}</p>
              <p><strong>총 금액:</strong> ₩{selectedOrder.total_amount.toLocaleString()}</p>
            </div>

            <div className="order-items">
              <h4>주문 메뉴</h4>
              {orderItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <h5>{item.menu_name}</h5>
                    <p>단가: ₩{item.unit_price.toLocaleString()}</p>
                  </div>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        className="btn btn-small"
                        onClick={() => modifyOrderItemQuantity(
                          selectedOrder.id!,
                          item.id!,
                          item.menu_id,
                          item.quantity,
                          item.quantity - 1
                        )}
                        disabled={loading}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="btn btn-small"
                        onClick={() => modifyOrderItemQuantity(
                          selectedOrder.id!,
                          item.id!,
                          item.menu_id,
                          item.quantity,
                          item.quantity + 1
                        )}
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => removeOrderItem(
                        selectedOrder.id!,
                        item.id!,
                        item.menu_id,
                        item.quantity
                      )}
                      disabled={loading}
                    >
                      제거
                    </button>
                  </div>
                  <div className="item-total">
                    ₩{(item.quantity * item.unit_price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .order-management {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .management-header {
          margin-bottom: 2rem;
        }

        .management-header h2 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .alert {
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background-color: #ffeaea;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
        }

        .alert-success {
          background-color: #e8f5e8;
          color: #4caf50;
          border: 1px solid #c8e6c9;
        }

        .management-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .orders-list h3, .order-details h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #999;
          background: white;
          border-radius: 8px;
          border: 1px solid #eee;
        }

        .orders-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-card:hover {
          border-color: #2196f3;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
        }

        .order-card.selected {
          border-color: #2196f3;
          background-color: #f3f9ff;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }

        .order-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .order-id {
          font-weight: bold;
          color: #333;
        }

        .order-date {
          font-size: 0.85rem;
          color: #666;
        }

        .order-amount {
          font-size: 1.1rem;
          font-weight: bold;
          color: #2196f3;
        }

        .order-details {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .order-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .order-info p {
          margin: 0.5rem 0;
        }

        .order-items h4 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .order-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-info h5 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }

        .item-info p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .item-controls {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quantity {
          min-width: 2rem;
          text-align: center;
          font-weight: bold;
        }

        .item-total {
          font-weight: bold;
          color: #2196f3;
          text-align: right;
        }

        .btn {
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .management-content {
            grid-template-columns: 1fr;
          }

          .order-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .order-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .item-controls {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;