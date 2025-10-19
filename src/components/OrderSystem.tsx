import React, { useState, useEffect, useCallback } from 'react';
import { Menu, OrderItem, Order, RecipeWithDetails, PaymentType } from '../types';
import { MenuService } from '../services/menuService';
import { OrderService } from '../services/orderService';
import { InventoryService } from '../services/inventoryService';
import { SalesService } from '../services/salesService';

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
  const [menuRecipes, setMenuRecipes] = useState<{ [menuId: string]: RecipeWithDetails[] }>({});
  const [menuAvailability, setMenuAvailability] = useState<{ [menuId: string]: { available: boolean; reason?: string } }>({});
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>('CARD');

  const loadMenus = useCallback(async () => {
    try {
      const menuData = await MenuService.getAllMenus();
      setMenus(menuData);

      // Load recipes for all menus
      const recipes: { [menuId: string]: RecipeWithDetails[] } = {};
      for (const menu of menuData) {
        if (menu.id) {
          recipes[menu.id] = await MenuService.getRecipesByMenuId(menu.id);
        }
      }
      setMenuRecipes(recipes);
    } catch (err) {
      setError('메뉴를 불러오는데 실패했습니다.');
    }
  }, []);

  const checkMenuAvailability = useCallback(async () => {
    const availability: { [menuId: string]: { available: boolean; reason?: string } } = {};

    for (const menu of menus) {
      if (!menu.id) continue;

      const recipes = menuRecipes[menu.id] || [];
      if (recipes.length === 0) {
        availability[menu.id] = { available: false, reason: '재료가 설정되지 않음' };
        continue;
      }

      // Calculate how many units of this menu we already have in cart
      const cartQuantity = cart.find(item => item.menu_id === menu.id)?.quantity || 0;

      let canMake = true;
      let limitingIngredient = '';
      let maxQuantity = Infinity;

      for (const recipe of recipes) {
        const inventory = await InventoryService.getInventoryByIngredientId(recipe.ingredient_id);
        if (!inventory) {
          availability[menu.id] = {
            available: false,
            reason: `재고 정보 없음: ${recipe.ingredient_name}`
          };
          canMake = false;
          break;
        }

        const requiredForOne = recipe.quantity;
        const alreadyUsed = requiredForOne * cartQuantity;
        const availableStock = inventory.current_stock - alreadyUsed;
        const possibleQuantity = Math.floor(availableStock / requiredForOne);

        if (possibleQuantity < 1) {
          availability[menu.id] = {
            available: false,
            reason: `재고 부족: ${recipe.ingredient_name} (필요: ${requiredForOne}, 재고: ${availableStock})`
          };
          canMake = false;
          break;
        }

        if (possibleQuantity < maxQuantity) {
          maxQuantity = possibleQuantity;
          limitingIngredient = recipe.ingredient_name;
        }
      }

      if (canMake) {
        availability[menu.id] = {
          available: true,
          reason: maxQuantity === Infinity ? '' : `최대 ${maxQuantity}개 주문 가능 (${limitingIngredient} 제한)`
        };
      }
    }

    setMenuAvailability(availability);
  }, [menus, menuRecipes, cart]);

  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    checkMenuAvailability();
  }, [menus, cart, menuRecipes]);

  const addToCart = (menu: Menu) => {
    if (!menu.id) return;

    const availability = menuAvailability[menu.id];
    if (!availability?.available) {
      setError(availability?.reason || '이 메뉴는 현재 주문할 수 없습니다.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const existingItem = cart.find(item => item.menu_id === menu.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.menu_id === menu.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        order_id: "0",
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

  const updateQuantity = (menuId: string, newQuantity: number) => {
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

  const removeFromCart = (menuId: string) => {
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


  const processOrder = async () => {
    if (cart.length === 0) {
      setError('주문할 메뉴를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
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

      // OrderService의 createOrderWithItems 메서드 사용 (재고 체크 및 차감 자동 처리)
      const orderItems = cart.map(item => ({
        menu_id: item.menu_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const orderId = await OrderService.createOrderWithItems(orderItems, selectedPaymentType);

      setSuccess('주문이 성공적으로 완료되었습니다!');
      setCart([]);

      if (onOrderComplete) {
        const order = await OrderService.getOrderById(orderId);
        if (order) {
          onOrderComplete(order);
        }
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
            {menus.map(menu => {
              const availability = menuAvailability[menu.id!];
              const isAvailable = availability?.available;
              const cartItem = cart.find(item => item.menu_id === menu.id);

              return (
                <div key={menu.id} className={`menu-card ${!isAvailable ? 'unavailable' : ''}`}>
                  <div className="menu-info">
                    <h4>{menu.name}</h4>
                    <p className="menu-description">{menu.description}</p>
                    <p className="menu-price">₩{menu.price.toLocaleString()}</p>

                    {/* Stock Status */}
                    <div className="stock-status">
                      {availability ? (
                        <div className={`status-badge ${isAvailable ? 'available' : 'unavailable'}`}>
                          {isAvailable ? '✅ 주문 가능' : '❌ 주문 불가'}
                        </div>
                      ) : (
                        <div className="status-badge loading">📋 확인 중...</div>
                      )}

                      {availability?.reason && (
                        <p className="availability-reason">{availability.reason}</p>
                      )}

                      {cartItem && (
                        <p className="cart-info">장바구니에 {cartItem.quantity}개</p>
                      )}
                    </div>

                    {/* Recipe Info */}
                    {menuRecipes[menu.id!] && menuRecipes[menu.id!].length > 0 && (
                      <div className="recipe-preview">
                        <p className="recipe-title">📝 필요 재료:</p>
                        <div className="recipe-ingredients">
                          {menuRecipes[menu.id!].map(recipe => (
                            <span key={recipe.id} className="ingredient-tag">
                              {recipe.ingredient_name} {recipe.quantity}{recipe.ingredient_unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => addToCart(menu)}
                    disabled={loading || !isAvailable}
                  >
                    {!isAvailable ? '주문 불가' : '추가'}
                  </button>
                </div>
              );
            })}
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
                <div className="payment-type-section">
                  <h4>결제 방법</h4>
                  <div className="payment-options">
                    {(['CARD', 'COUPANG', 'BAEMIN', 'YOGIYO'] as PaymentType[]).map(type => (
                      <label key={type} className="payment-option">
                        <input
                          type="radio"
                          name="paymentType"
                          value={type}
                          checked={selectedPaymentType === type}
                          onChange={(e) => setSelectedPaymentType(e.target.value as PaymentType)}
                        />
                        <span className="payment-label">
                          {SalesService.getPaymentTypeIcon(type)} {SalesService.getPaymentTypeDisplayName(type)}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="deposit-info">
                    <p>
                      📅 입금 예정일: {SalesService.calculateExpectedDepositDate(
                        new Date().toISOString(),
                        selectedPaymentType
                      )}
                    </p>
                  </div>
                </div>

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

        .menu-card.unavailable {
          opacity: 0.7;
          background: #f5f5f5;
        }

        .menu-card.unavailable:hover {
          transform: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

        .stock-status {
          margin: 1rem 0;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .status-badge.available {
          background: #e8f5e8;
          color: #4caf50;
          border: 1px solid #4caf50;
        }

        .status-badge.unavailable {
          background: #ffebee;
          color: #f44336;
          border: 1px solid #f44336;
        }

        .status-badge.loading {
          background: #fff3e0;
          color: #ff9800;
          border: 1px solid #ff9800;
        }

        .availability-reason {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
          line-height: 1.3;
        }

        .cart-info {
          font-size: 0.75rem;
          color: #2196f3;
          font-weight: 500;
          margin: 0.25rem 0 0 0;
        }

        .recipe-preview {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .recipe-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .recipe-ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .ingredient-tag {
          background: #f0f0f0;
          color: #555;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-size: 0.7rem;
          font-weight: 500;
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

        .payment-type-section {
          margin-bottom: 1.5rem;
        }

        .payment-type-section h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1rem;
        }

        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .payment-option {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .payment-option:hover {
          border-color: #2196f3;
          background: #f8faff;
        }

        .payment-option input[type="radio"] {
          margin-right: 0.75rem;
          transform: scale(1.2);
        }

        .payment-option input[type="radio"]:checked + .payment-label {
          font-weight: 600;
          color: #2196f3;
        }

        .payment-option:has(input[type="radio"]:checked) {
          border-color: #2196f3;
          background: #f0f7ff;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
        }

        .payment-label {
          font-size: 0.9rem;
          color: #333;
        }

        .deposit-info {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #f0f7ff;
          border-radius: 6px;
          border-left: 3px solid #2196f3;
        }

        .deposit-info p {
          margin: 0;
          font-size: 0.85rem;
          color: #1976d2;
          font-weight: 500;
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