import { FirestoreService } from '../database/database';
import { Ingredient } from '../types';

export class IngredientService {
  private static collectionName = FirestoreService.collections.ingredients;

  static async getAllIngredients(): Promise<Ingredient[]> {
    try {
      const data = await FirestoreService.getOrderedBy(this.collectionName, 'name', 'asc');
      return data as Ingredient[];
    } catch (error) {
      console.error('Error getting all ingredients:', error);
      return [];
    }
  }

  static async addIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at'>): Promise<string> {
    try {
      // 중복 이름 체크
      const existing = await FirestoreService.getWhere(this.collectionName, 'name', '==', ingredient.name);
      if (existing.length > 0) {
        throw new Error('이미 존재하는 재료명입니다.');
      }

      const id = await FirestoreService.create(this.collectionName, ingredient);

      // 재고 테이블에도 초기 데이터 삽입
      await this.initializeInventory(id);

      return id;
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  }

  static async updateIngredient(id: string, ingredient: Omit<Ingredient, 'id' | 'created_at'>): Promise<void> {
    try {
      // 중복 이름 체크 (자신 제외)
      const existing = await FirestoreService.getWhere(this.collectionName, 'name', '==', ingredient.name);
      if (existing.some(item => item.id !== id)) {
        throw new Error('이미 존재하는 재료명입니다.');
      }

      await FirestoreService.update(this.collectionName, id, ingredient);
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  }

  static async deleteIngredient(id: string): Promise<void> {
    try {
      await FirestoreService.delete(this.collectionName, id);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  }

  static async getIngredientById(id: string): Promise<Ingredient | null> {
    try {
      const data = await FirestoreService.getById(this.collectionName, id);
      return data as Ingredient | null;
    } catch (error) {
      console.error('Error getting ingredient by ID:', error);
      return null;
    }
  }

  private static async initializeInventory(ingredientId: string): Promise<void> {
    try {
      await FirestoreService.create(FirestoreService.collections.inventory, {
        ingredient_id: ingredientId,
        current_stock: 0,
        min_stock: 0
      });
    } catch (error) {
      console.error('Error initializing inventory:', error);
      throw error;
    }
  }
}
