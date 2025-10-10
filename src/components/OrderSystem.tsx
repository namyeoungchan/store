import React, { useState, useEffect } from 'react';
import { Menu, OrderItem, Order } from '../types';
import { MenuService } from '../services/menuService';
import { OrderService } from '../services/orderService';
import { InventoryService } from '../services/inventoryService';

interface OrderSystemProps {
  onOrderComplete?: (order: Order) => void;
}

interface CartItem extends OrderItem {
  menu_name: string;
  price: number;
}

const OrderSystem: React.FC<OrderSystemProps> = ({ onOrderComplete }) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = () => {
    try {
      const menuData = MenuService.getAllMenus();
      setMenus(menuData);
    } catch (err) {
      setError('메뉴를 불러오는데 실패했습니다.');
    }
  };

  const addToCart = (menu: Menu) => {
    const existingItem = cart.find(item => item.menu_id === menu.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.menu_id === menu.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        order_id: 0,
        menu_id: menu.id!,
        quantity: 1,
        unit_price: menu.price,
        menu_name: menu.name,
        price: menu.price
      };
      setCart([...cart, newItem]);
    }

    setSuccess(`${menu.name}이(가) 주문에 추가되었습니다.`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateQuantity = (menuId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuId);
      return;
    }

    setCart(cart.map(item =>
      item.menu_id === menuId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (menuId: number) => {
    setCart(cart.filter(item => item.menu_id !== menuId));
  };

  const clearCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      setCart([]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  const checkInventoryAvailable = async (): Promise<boolean> => {
    try {
      // 각 메뉴에 필요한 재료 확인
      for (const cartItem of cart) {
        const recipes = MenuService.getRecipesByMenuId(cartItem.menu_id);

        for (const recipe of recipes) {
          const inventory = InventoryService.getInventoryByIngredientId(recipe.ingredient_id);
          const requiredAmount = recipe.quantity * cartItem.quantity;

          if (!inventory || inventory.current_stock < requiredAmount) {
            const ingredientName = recipe.ingredient_name || '알 수 없는 재료';
            setError(`재고가 부족합니다: ${ingredientName} (필요: ${requiredAmount}, 재고: ${inventory?.current_stock || 0})`);
            return false;
          }
        }
      }
      return true;
    } catch (err) {
      setError('재고 확인 중 오류가 발생했습니다.');
      return false;
    }
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      setError('주문할 메뉴를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 재고 확인
      const inventoryAvailable = await checkInventoryAvailable();
      if (!inventoryAvailable) {
        setLoading(false);
        return;
      }

      // 주문 확인
      const totalAmount = calculateTotal();
      const confirmMessage = `
주문 내역:
${cart.map(item => `• ${item.menu_name} x${item.quantity} = ₩${(item.unit_price * item.quantity).toLocaleString()}`).join('\n')}

총 금액: ₩${totalAmount.toLocaleString()}

주문을 진행하시겠습니까?`;

      if (!window.confirm(confirmMessage)) {
        setLoading(false);
        return;
      }

      // 주문 생성
      const order = OrderService.createOrder(totalAmount);

      // 주문 아이템 추가 및 재고 차감
      for (const cartItem of cart) {
        OrderService.addOrderItem({
          order_id: order.id!,
          menu_id: cartItem.menu_id,
          quantity: cartItem.quantity,
          unit_price: cartItem.unit_price
        });

        // 재고 차감
        const recipes = MenuService.getRecipesByMenuId(cartItem.menu_id);
        for (const recipe of recipes) {
          const requiredAmount = recipe.quantity * cartItem.quantity;
          InventoryService.adjustStock(
            recipe.ingredient_id,
            requiredAmount,
            'OUT',
            `주문 #${order.id} - ${cartItem.menu_name}`
          );
        }
      }

      setSuccess('주문이 성공적으로 완료되었습니다!');
      setCart([]);

      if (onOrderComplete) {
        onOrderComplete(order);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-system">
      <div className="order-header">
        <h2>🍽️ 주문 시스템</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <div className="order-content">
        {/* 메뉴 목록 */}
        <div className="menu-section">
          <h3>메뉴 선택</h3>
          <div className="menu-grid">
            {menus.map(menu => (
              <div key={menu.id} className="menu-card">
                <div className="menu-info">
                  <h4>{menu.name}</h4>
                  <p className="menu-description">{menu.description}</p>
                  <p className="menu-price">₩{menu.price.toLocaleString()}</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(menu)}
                  disabled={loading}
                >
                  추가
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 장바구니 */}
        <div className="cart-section">
          <div className="cart-header">
            <h3>주문 내역 ({cart.length})</h3>
            {cart.length > 0 && (
              <button className="btn btn-secondary btn-small" onClick={clearCart}>
                전체 삭제
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>선택된 메뉴가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.menu_name}</h4>
                      <p>₩{item.unit_price.toLocaleString()} × {item.quantity}</p>
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          className="btn btn-small"
                          onClick={() => updateQuantity(item.menu_id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          className="btn btn-small"
                          onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => removeFromCart(item.menu_id)}
                      >
                        삭제
                      </button>
                    </div>
                    <div className="item-total">
                      ₩{(item.unit_price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="total-amount">
                  <strong>총 금액: ₩{calculateTotal().toLocaleString()}</strong>
                </div>
                <button
                  className="btn btn-success btn-large"
                  onClick={processOrder}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? '처리중...' : '주문하기'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .order-system {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .order-header {
          margin-bottom: 2rem;
        }

        .order-header h2 {
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

        .order-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .menu-section h3, .cart-section h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .menu-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .menu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .menu-info h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .menu-description {
          color: #666;
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }

        .menu-price {
          font-size: 1.2rem;
          font-weight: bold;
          color: #2196f3;
          margin: 0 0 1rem 0;
        }

        .cart-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .empty-cart {
          text-align: center;
          padding: 2rem;
          color: #999;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .item-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.95rem;
        }

        .item-info p {
          margin: 0;
          color: #666;
          font-size: 0.85rem;
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

        .cart-summary {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #eee;
        }

        .total-amount {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          text-align: center;
          color: #333;
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

        .btn-primary {
          background: #2196f3;
          color: white;
        }

        .btn-secondary {
          background: #757575;
          color: white;
        }

        .btn-success {
          background: #4caf50;
          color: white;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
        }

        .btn-large {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          width: 100%;
        }

        @media (max-width: 768px) {
          .order-content {
            grid-template-columns: 1fr;
          }

          .menu-grid {
            grid-template-columns: 1fr;
          }

          .cart-section {
            position: static;
          }

          .cart-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .item-controls {
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderSystem;