import { supabase } from '../firebase/config';
import { Ingredient } from '../types';

export class IngredientService {
  private static tableName = 'ingredients';

  static async getAllIngredients(): Promise<Ingredient[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all ingredients:', error);
      return [];
    }
  }

  static async addIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at'>): Promise<string> {
    try {
      // 중복 이름 체크
      const { data: existingIngredients } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('name', ingredient.name);

      if (existingIngredients && existingIngredients.length > 0) {
        throw new Error('이미 존재하는 재료명입니다.');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(ingredient)
        .select()
        .single();

      if (error) throw error;

      // 재고 테이블에도 초기 데이터 삽입
      await this.initializeInventory(data.id);

      return data.id;
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  }

  static async updateIngredient(id: string, ingredient: Omit<Ingredient, 'id' | 'created_at'>): Promise<void> {
    try {
      // 중복 이름 체크 (자신 제외)
      const { data: existingIngredients } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('name', ingredient.name)
        .neq('id', id);

      if (existingIngredients && existingIngredients.length > 0) {
        throw new Error('이미 존재하는 재료명입니다.');
      }

      const { error } = await supabase
        .from(this.tableName)
        .update(ingredient)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  }

  static async deleteIngredient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  }

  static async getIngredientById(id: string): Promise<Ingredient | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error getting ingredient by ID:', error);
      return null;
    }
  }

  private static async initializeInventory(ingredientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          ingredient_id: ingredientId,
          current_stock: 0,
          min_stock: 0
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error initializing inventory:', error);
      throw error;
    }
  }

}