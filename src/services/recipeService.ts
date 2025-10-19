import { supabase } from '../firebase/config';
import { Recipe, RecipeWithDetails } from '../types';

export class RecipeService {
  private static tableName = 'recipes';

  static async getRecipesByMenuId(menuId: string): Promise<RecipeWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          ingredients!inner(
            name,
            unit
          ),
          menus!inner(
            name
          )
        `)
        .eq('menu_id', menuId);

      if (error) throw error;

      const recipesWithDetails = (data || []).map((recipe: any) => ({
        id: recipe.id,
        menu_id: recipe.menu_id,
        ingredient_id: recipe.ingredient_id,
        quantity: recipe.quantity,
        ingredient_name: recipe.ingredients.name,
        ingredient_unit: recipe.ingredients.unit,
        menu_name: recipe.menus.name
      }));

      return recipesWithDetails.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
    } catch (error) {
      console.error('Error getting recipes by menu ID:', error);
      return [];
    }
  }

  static async getAllRecipesWithDetails(): Promise<RecipeWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          ingredients!inner(
            name,
            unit
          ),
          menus!inner(
            name
          )
        `);

      if (error) throw error;

      const recipesWithDetails = (data || []).map((recipe: any) => ({
        id: recipe.id,
        menu_id: recipe.menu_id,
        ingredient_id: recipe.ingredient_id,
        quantity: recipe.quantity,
        ingredient_name: recipe.ingredients.name,
        ingredient_unit: recipe.ingredients.unit,
        menu_name: recipe.menus.name
      }));

      return recipesWithDetails.sort((a, b) => {
        const menuCompare = a.menu_name.localeCompare(b.menu_name);
        return menuCompare !== 0 ? menuCompare : a.ingredient_name.localeCompare(b.ingredient_name);
      });
    } catch (error) {
      console.error('Error getting all recipes with details:', error);
      return [];
    }
  }

  static async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<string> {
    try {
      // 중복 체크 (동일 메뉴에 동일 재료가 이미 있는지)
      const { data: existingRecipes } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('menu_id', recipe.menu_id)
        .eq('ingredient_id', recipe.ingredient_id);

      if (existingRecipes && existingRecipes.length > 0) {
        throw new Error('이미 해당 메뉴에 등록된 재료입니다.');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(recipe)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  }

  static async updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): Promise<void> {
    try {
      // 중복 체크 (자신 제외하고 동일 메뉴에 동일 재료가 있는지)
      const { data: existingRecipes } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('menu_id', recipe.menu_id)
        .eq('ingredient_id', recipe.ingredient_id)
        .neq('id', id);

      if (existingRecipes && existingRecipes.length > 0) {
        throw new Error('이미 해당 메뉴에 등록된 재료입니다.');
      }

      const { error } = await supabase
        .from(this.tableName)
        .update(recipe)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  static async deleteRecipe(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  static async deleteRecipesByMenuId(menuId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('menu_id', menuId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting recipes by menu ID:', error);
      throw error;
    }
  }

  static async getRecipeById(id: string): Promise<Recipe | null> {
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
      console.error('Error getting recipe by ID:', error);
      return null;
    }
  }

  static async updateRecipeQuantity(id: string, quantity: number): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ quantity })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating recipe quantity:', error);
      throw error;
    }
  }

}