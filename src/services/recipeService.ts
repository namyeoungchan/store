import { getDatabase } from '../database/database';
import { Recipe, RecipeWithDetails } from '../types';

export class RecipeService {
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

  static getAllRecipesWithDetails(): RecipeWithDetails[] {
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
      ORDER BY m.name, i.name
    `);

    const recipes: RecipeWithDetails[] = [];

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

  static addRecipe(recipe: Omit<Recipe, 'id'>): number {
    const db = getDatabase();

    try {
      const stmt = db.prepare(
        'INSERT INTO recipes (menu_id, ingredient_id, quantity) VALUES (?, ?, ?)'
      );
      stmt.run([recipe.menu_id, recipe.ingredient_id, recipe.quantity]);
      stmt.free();

      const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
      lastIdStmt.step();
      const result = lastIdStmt.getAsObject();
      lastIdStmt.free();

      return result.id as number;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('이미 해당 메뉴에 등록된 재료입니다.');
      }
      throw error;
    }
  }

  static updateRecipe(id: number, recipe: Omit<Recipe, 'id'>): void {
    const db = getDatabase();

    try {
      const stmt = db.prepare(
        'UPDATE recipes SET menu_id = ?, ingredient_id = ?, quantity = ? WHERE id = ?'
      );
      stmt.run([recipe.menu_id, recipe.ingredient_id, recipe.quantity, id]);
      stmt.free();
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('이미 해당 메뉴에 등록된 재료입니다.');
      }
      throw error;
    }
  }

  static deleteRecipe(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
    stmt.run([id]);
    stmt.free();
  }

  static deleteRecipesByMenuId(menuId: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM recipes WHERE menu_id = ?');
    stmt.run([menuId]);
    stmt.free();
  }

  static getRecipeById(id: number): Recipe | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as number,
        menu_id: row.menu_id as number,
        ingredient_id: row.ingredient_id as number,
        quantity: row.quantity as number
      };
    }

    stmt.free();
    return null;
  }

  static updateRecipeQuantity(id: number, quantity: number): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE recipes SET quantity = ? WHERE id = ?');
    stmt.run([quantity, id]);
    stmt.free();
  }
}