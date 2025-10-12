import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let SQL: any = null;

const DB_KEY = 'store_inventory_db';

// 데이터베이스를 localStorage에 저장
const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const base64String = btoa(String.fromCharCode(...Array.from(data)));
    localStorage.setItem(DB_KEY, base64String);
  }
};

// localStorage에서 데이터베이스 로드
const loadDatabase = (): Uint8Array | null => {
  try {
    const base64String = localStorage.getItem(DB_KEY);
    if (base64String) {
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } catch (error) {
    console.warn('Failed to load database from localStorage:', error);
  }
  return null;
};

export const initDatabase = async () => {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
  }

  if (!db) {
    // localStorage에서 기존 데이터베이스 로드 시도
    const savedData = loadDatabase();

    if (savedData) {
      try {
        db = new SQL.Database(savedData);
        console.log('Database loaded from localStorage');
      } catch (error) {
        console.warn('Failed to load saved database, creating new one:', error);
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }

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

      -- 사용자 테이블
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          hire_date DATE NOT NULL,
          position TEXT NOT NULL,
          hourly_wage REAL NOT NULL DEFAULT 0,
          password_hash TEXT,
          password_temp TEXT,
          is_password_temp BOOLEAN DEFAULT 1,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 주간 근무 스케줄 테이블
      CREATE TABLE IF NOT EXISTS work_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          week_start_date DATE NOT NULL,
          monday_start TIME,
          monday_end TIME,
          tuesday_start TIME,
          tuesday_end TIME,
          wednesday_start TIME,
          wednesday_end TIME,
          thursday_start TIME,
          thursday_end TIME,
          friday_start TIME,
          friday_end TIME,
          saturday_start TIME,
          saturday_end TIME,
          sunday_start TIME,
          sunday_end TIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, week_start_date)
      );

      -- 근무 기록 테이블
      CREATE TABLE IF NOT EXISTS work_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          work_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          break_minutes INTEGER DEFAULT 0,
          total_hours REAL NOT NULL,
          total_pay REAL NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, work_date)
      );
    `;

    db?.exec(schema);

    // 초기 데이터베이스 저장
    if (!savedData) {
      saveDatabase();
    }
  }

  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// 모든 데이터베이스 변경 후 호출해야 하는 함수
export const persistDatabase = () => {
  saveDatabase();
};

// 데이터베이스 초기화 (개발/테스트용)
export const resetDatabase = () => {
  localStorage.removeItem(DB_KEY);
  db = null;
};