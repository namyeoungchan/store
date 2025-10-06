import { getDatabase } from '../database/database';
import { Ingredient } from '../types';

export class IngredientService {
  static getAllIngredients(): Ingredient[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ingredients ORDER BY name');
    const results = stmt.getAsObject({});
    const ingredients: Ingredient[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      ingredients.push({
        id: row.id as number,
        name: row.name as string,
        unit: row.unit as string,
        created_at: row.created_at as string
      });
    }

    stmt.free();
    return ingredients;
  }

  static addIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at'>): number {
    const db = getDatabase();

    try {
      const stmt = db.prepare(
        'INSERT INTO ingredients (name, unit) VALUES (?, ?)'
      );
      stmt.run([ingredient.name, ingredient.unit]);
      stmt.free();

      // 방금 삽입된 행의 ID 반환
      const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
      lastIdStmt.step();
      const result = lastIdStmt.getAsObject();
      lastIdStmt.free();

      const ingredientId = result.id as number;

      // 재고 테이블에도 초기 데이터 삽입
      this.initializeInventory(ingredientId);

      return ingredientId;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('이미 존재하는 재료명입니다.');
      }
      throw error;
    }
  }

  static updateIngredient(id: number, ingredient: Omit<Ingredient, 'id' | 'created_at'>): void {
    const db = getDatabase();

    try {
      const stmt = db.prepare(
        'UPDATE ingredients SET name = ?, unit = ? WHERE id = ?'
      );
      stmt.run([ingredient.name, ingredient.unit, id]);
      stmt.free();
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('이미 존재하는 재료명입니다.');
      }
      throw error;
    }
  }

  static deleteIngredient(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM ingredients WHERE id = ?');
    stmt.run([id]);
    stmt.free();
  }

  static getIngredientById(id: number): Ingredient | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ingredients WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as number,
        name: row.name as string,
        unit: row.unit as string,
        created_at: row.created_at as string
      };
    }

    stmt.free();
    return null;
  }

  private static initializeInventory(ingredientId: number): void {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO inventory (ingredient_id, current_stock, min_stock) VALUES (?, 0, 0)'
    );
    stmt.run([ingredientId]);
    stmt.free();
  }
}