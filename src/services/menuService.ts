import { getDatabase } from '../database/database';
import { Menu, RecipeWithDetails } from '../types';

export class MenuService {
  static getAllMenus(): Menu[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM menus ORDER BY name');
    const menus: Menu[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      menus.push({
        id: row.id as number,
        name: row.name as string,
        description: row.description as string,
        price: row.price as number,
        created_at: row.created_at as string
      });
    }

    stmt.free();
    return menus;
  }

  static addMenu(menu: Omit<Menu, 'id' | 'created_at'>): number {
    const db = getDatabase();

    try {
      const stmt = db.prepare(
        'INSERT INTO menus (name, description, price) VALUES (?, ?, ?)'
      );
      stmt.run([menu.name, menu.description || '', menu.price]);
      stmt.free();

      const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
      lastIdStmt.step();
      const result = lastIdStmt.getAsObject();
      lastIdStmt.free();

      return result.id as number;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('이미 존재하는 메뉴명입니다.');
      }
      throw error;
    }
  }

  static updateMenu(id: number, menu: Omit<Menu, 'id' | 'created_at'>): void {
    const db = getDatabase();

    try {
      const stmt = db.prepare(
        'UPDATE menus SET name = ?, description = ?, price = ? WHERE id = ?'
      );
      stmt.run([menu.name, menu.description || '', menu.price, id]);
      stmt.free();
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('이미 존재하는 메뉴명입니다.');
      }
      throw error;
    }
  }

  static deleteMenu(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM menus WHERE id = ?');
    stmt.run([id]);
    stmt.free();
  }

  static getMenuById(id: number): Menu | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM menus WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as number,
        name: row.name as string,
        description: row.description as string,
        price: row.price as number,
        created_at: row.created_at as string
      };
    }

    stmt.free();
    return null;
  }

  static getRecipesByMenuId(menuId: number): RecipeWithDetails[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        r.*,
        i.name as ingredient_name,
        i.unit as ingredient_unit,
        m.name as menu_name
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      JOIN menus m ON r.menu_id = m.id
      WHERE r.menu_id = ?
      ORDER BY i.name
    `);

    const recipes: RecipeWithDetails[] = [];
    stmt.bind([menuId]);

    while (stmt.step()) {
      const row = stmt.getAsObject();
      recipes.push({
        id: row.id as number,
        menu_id: row.menu_id as number,
        ingredient_id: row.ingredient_id as number,
        quantity: row.quantity as number,
        ingredient_name: row.ingredient_name as string,
        ingredient_unit: row.ingredient_unit as string,
        menu_name: row.menu_name as string
      });
    }

    stmt.free();
    return recipes;
  }
}