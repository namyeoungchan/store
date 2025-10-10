// 더미 데이터 - 나중에 삭제 예정
// 실제 운영 시에는 이 파일을 삭제하고 insertDummyData 호출 부분을 제거하세요.

import { getDatabase } from '../database/database';

export const insertDummyData = () => {
  const db = getDatabase();

  try {
    // 기존 데이터 확인
    const ingredientCountStmt = db.prepare('SELECT COUNT(*) as count FROM ingredients');
    ingredientCountStmt.step();
    const existingIngredients = ingredientCountStmt.getAsObject() as { count: number };
    ingredientCountStmt.free();

    const menuCountStmt = db.prepare('SELECT COUNT(*) as count FROM menus');
    menuCountStmt.step();
    const existingMenus = menuCountStmt.getAsObject() as { count: number };
    menuCountStmt.free();

    if (existingIngredients.count > 0 || existingMenus.count > 0) {
      console.log('더미 데이터가 이미 존재합니다. 스킵합니다.');
      return;
    }

    // 재료 데이터
    const ingredients = [
      { name: '원두', unit: 'g' },
      { name: '우유', unit: 'ml' },
      { name: '설탕', unit: 'g' },
      { name: '바닐라시럽', unit: 'ml' },
      { name: '휘핑크림', unit: 'ml' },
      { name: '초콜릿시럽', unit: 'ml' },
      { name: '카라멜시럽', unit: 'ml' },
      { name: '딸기', unit: 'g' },
      { name: '바나나', unit: 'g' },
      { name: '얼음', unit: 'g' }
    ];

    const ingredientStmt = db.prepare('INSERT INTO ingredients (name, unit) VALUES (?, ?)');
    ingredients.forEach(ingredient => {
      ingredientStmt.run([ingredient.name, ingredient.unit]);
    });
    ingredientStmt.free();

    // 메뉴 데이터
    const menus = [
      { name: '아메리카노', description: '진한 원두의 깊은 맛', price: 4000 },
      { name: '카페라떼', description: '부드러운 우유와 원두의 조화', price: 4500 },
      { name: '카푸치노', description: '풍부한 거품과 진한 커피', price: 4500 },
      { name: '바닐라라떼', description: '달콤한 바닐라향이 가득한 라떼', price: 5000 },
      { name: '카라멜마키아토', description: '달콤한 카라멜과 에스프레소', price: 5500 },
      { name: '딸기스무디', description: '신선한 딸기로 만든 스무디', price: 6000 },
      { name: '바나나스무디', description: '달콤한 바나나 스무디', price: 5500 }
    ];

    const menuStmt = db.prepare('INSERT INTO menus (name, description, price) VALUES (?, ?, ?)');
    menus.forEach(menu => {
      menuStmt.run([menu.name, menu.description, menu.price]);
    });
    menuStmt.free();

    // 레시피 데이터 (메뉴-재료 관계)
    const recipes = [
      // 아메리카노 (메뉴 ID 1)
      { menu_id: 1, ingredient_id: 1, quantity: 20 }, // 원두 20g

      // 카페라떼 (메뉴 ID 2)
      { menu_id: 2, ingredient_id: 1, quantity: 18 }, // 원두 18g
      { menu_id: 2, ingredient_id: 2, quantity: 150 }, // 우유 150ml

      // 카푸치노 (메뉴 ID 3)
      { menu_id: 3, ingredient_id: 1, quantity: 18 }, // 원두 18g
      { menu_id: 3, ingredient_id: 2, quantity: 120 }, // 우유 120ml
      { menu_id: 3, ingredient_id: 5, quantity: 30 }, // 휘핑크림 30ml

      // 바닐라라떼 (메뉴 ID 4)
      { menu_id: 4, ingredient_id: 1, quantity: 18 }, // 원두 18g
      { menu_id: 4, ingredient_id: 2, quantity: 150 }, // 우유 150ml
      { menu_id: 4, ingredient_id: 4, quantity: 20 }, // 바닐라시럽 20ml

      // 카라멜마키아토 (메뉴 ID 5)
      { menu_id: 5, ingredient_id: 1, quantity: 18 }, // 원두 18g
      { menu_id: 5, ingredient_id: 2, quantity: 150 }, // 우유 150ml
      { menu_id: 5, ingredient_id: 7, quantity: 25 }, // 카라멜시럽 25ml
      { menu_id: 5, ingredient_id: 5, quantity: 20 }, // 휘핑크림 20ml

      // 딸기스무디 (메뉴 ID 6)
      { menu_id: 6, ingredient_id: 8, quantity: 100 }, // 딸기 100g
      { menu_id: 6, ingredient_id: 2, quantity: 200 }, // 우유 200ml
      { menu_id: 6, ingredient_id: 3, quantity: 15 }, // 설탕 15g
      { menu_id: 6, ingredient_id: 10, quantity: 100 }, // 얼음 100g

      // 바나나스무디 (메뉴 ID 7)
      { menu_id: 7, ingredient_id: 9, quantity: 120 }, // 바나나 120g
      { menu_id: 7, ingredient_id: 2, quantity: 200 }, // 우유 200ml
      { menu_id: 7, ingredient_id: 3, quantity: 10 }, // 설탕 10g
      { menu_id: 7, ingredient_id: 10, quantity: 100 } // 얼음 100g
    ];

    const recipeStmt = db.prepare('INSERT INTO recipes (menu_id, ingredient_id, quantity) VALUES (?, ?, ?)');
    recipes.forEach(recipe => {
      recipeStmt.run([recipe.menu_id, recipe.ingredient_id, recipe.quantity]);
    });
    recipeStmt.free();

    // 재고 데이터
    const inventories = [
      { ingredient_id: 1, current_stock: 5000, min_stock: 500 }, // 원두
      { ingredient_id: 2, current_stock: 10000, min_stock: 1000 }, // 우유
      { ingredient_id: 3, current_stock: 2000, min_stock: 200 }, // 설탕
      { ingredient_id: 4, current_stock: 1500, min_stock: 100 }, // 바닐라시럽
      { ingredient_id: 5, current_stock: 2000, min_stock: 200 }, // 휘핑크림
      { ingredient_id: 6, current_stock: 1200, min_stock: 100 }, // 초콜릿시럽
      { ingredient_id: 7, current_stock: 1300, min_stock: 100 }, // 카라멜시럽
      { ingredient_id: 8, current_stock: 3000, min_stock: 300 }, // 딸기
      { ingredient_id: 9, current_stock: 2500, min_stock: 250 }, // 바나나
      { ingredient_id: 10, current_stock: 50000, min_stock: 5000 } // 얼음
    ];

    const inventoryStmt = db.prepare('INSERT INTO inventory (ingredient_id, current_stock, min_stock) VALUES (?, ?, ?)');
    inventories.forEach(inventory => {
      inventoryStmt.run([inventory.ingredient_id, inventory.current_stock, inventory.min_stock]);
    });
    inventoryStmt.free();

    // 샘플 주문 데이터 (다양한 결제 유형으로)
    const sampleOrders = [
      { payment_type: 'CARD', total_amount: 4000 },
      { payment_type: 'BAEMIN', total_amount: 9000 },
      { payment_type: 'COUPANG', total_amount: 5500 },
      { payment_type: 'YOGIYO', total_amount: 12000 },
      { payment_type: 'CARD', total_amount: 6000 }
    ];

    sampleOrders.forEach((order, index) => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - index); // 며칠 전 주문으로 설정

      // 입금 예정일 계산
      let businessDays = 0;
      switch (order.payment_type) {
        case 'CARD':
          businessDays = 2;
          break;
        case 'COUPANG':
        case 'BAEMIN':
        case 'YOGIYO':
          businessDays = 5;
          break;
      }

      const expectedDate = new Date(orderDate);
      let addedDays = 0;
      while (addedDays < businessDays) {
        expectedDate.setDate(expectedDate.getDate() + 1);
        if (expectedDate.getDay() !== 0 && expectedDate.getDay() !== 6) {
          addedDays++;
        }
      }

      const orderStmt = db.prepare(`
        INSERT INTO orders (order_date, total_amount, payment_type, expected_deposit_date, is_deposited)
        VALUES (?, ?, ?, ?, ?)
      `);
      orderStmt.run([
        orderDate.toISOString(),
        order.total_amount,
        order.payment_type,
        expectedDate.toISOString().split('T')[0],
        index > 2 ? 0 : 1 // 처음 3개는 입금 완료, 나머지는 대기
      ]);
      orderStmt.free();
    });

    console.log('✅ 더미 데이터가 성공적으로 추가되었습니다!');
    console.log('📝 실제 운영 시에는 src/data/dummyData.ts 파일을 삭제하고');
    console.log('   App.tsx에서 insertDummyData() 호출 부분을 제거하세요.');

  } catch (error) {
    console.error('❌ 더미 데이터 추가 중 오류가 발생했습니다:', error);
  }
};

// 더미 데이터 삭제 함수 (필요 시 사용)
export const clearDummyData = () => {
  const db = getDatabase();

  try {
    // 외래키 제약 조건 때문에 순서대로 삭제
    const deleteStatements = [
      'DELETE FROM inventory_history',
      'DELETE FROM order_items',
      'DELETE FROM orders',
      'DELETE FROM recipes',
      'DELETE FROM inventory',
      'DELETE FROM menus',
      'DELETE FROM ingredients'
    ];

    deleteStatements.forEach(sql => {
      const stmt = db.prepare(sql);
      stmt.run();
      stmt.free();
    });

    console.log('✅ 더미 데이터가 모두 삭제되었습니다.');
  } catch (error) {
    console.error('❌ 더미 데이터 삭제 중 오류가 발생했습니다:', error);
  }
};