import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let SQL: any = null;

export const initDatabase = async () => {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
  }

  if (!db) {
    db = new SQL.Database();

    // 스키마 생성
    const schema = `
      -- 재료 테이블
      CREATE TABLE IF NOT EXISTS ingredients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          unit TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 메뉴 테이블
      CREATE TABLE IF NOT EXISTS menus (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 레시피 테이블 (메뉴와 재료의 관계)
      CREATE TABLE IF NOT EXISTS recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          menu_id INTEGER NOT NULL,
          ingredient_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          FOREIGN KEY (menu_id) REFERENCES menus (id) ON DELETE CASCADE,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE,
          UNIQUE(menu_id, ingredient_id)
      );

      -- 재고 테이블
      CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ingredient_id INTEGER NOT NULL,
          current_stock REAL NOT NULL DEFAULT 0,
          min_stock REAL NOT NULL DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE,
          UNIQUE(ingredient_id)
      );

      -- 주문 테이블
      CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_amount REAL NOT NULL DEFAULT 0,
          payment_type TEXT NOT NULL DEFAULT 'CARD',
          expected_deposit_date DATE,
          is_deposited BOOLEAN DEFAULT 0,
          deposited_date DATE
      );

      -- 주문 상세 테이블
      CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
          FOREIGN KEY (menu_id) REFERENCES menus (id)
      );

      -- 재고 이력 테이블
      CREATE TABLE IF NOT EXISTS inventory_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ingredient_id INTEGER NOT NULL,
          change_type TEXT NOT NULL,
          quantity REAL NOT NULL,
          previous_stock REAL NOT NULL,
          new_stock REAL NOT NULL,
          order_id INTEGER NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients (id),
          FOREIGN KEY (order_id) REFERENCES orders (id)
      );
    `;

    db?.exec(schema);
  }

  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};