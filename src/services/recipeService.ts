import { FirestoreService } from '../database/database';
import { Recipe, RecipeWithDetails } from '../types';

export class RecipeService {
  private static collectionName = FirestoreService.collections.recipes;

  static async getRecipesByMenuId(menuId: string): Promise<RecipeWithDetails[]> {
    try {
      const recipes = await FirestoreService.getWhere(this.collectionName, 'menu_id', '==', menuId);

      const recipesWithDetails: RecipeWithDetails[] = [];

      for (const recipe of recipes) {
        const ingredient = await FirestoreService.getById(
          FirestoreService.collections.ingredients,
          recipe.ingredient_id
        );
        const menu = await FirestoreService.getById(
          FirestoreService.collections.menus,
          recipe.menu_id
        );

        if (ingredient && menu) {
          recipesWithDetails.push({
            id: recipe.id,
            menu_id: recipe.menu_id,
            ingredient_id: recipe.ingredient_id,
            quantity: recipe.quantity,
            ingredient_name: ingredient.name,
            ingredient_unit: ingredient.unit,
            menu_name: menu.name
          });
        }
      }

      return recipesWithDetails.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
    } catch (error) {
      console.error('Error getting recipes by menu ID:', error);
      return [];
    }
  }

  static async getAllRecipesWithDetails(): Promise<RecipeWithDetails[]> {
    try {
      const recipes = await FirestoreService.getAll(this.collectionName);

      const recipesWithDetails: RecipeWithDetails[] = [];

      for (const recipe of recipes) {
        const ingredient = await FirestoreService.getById(
          FirestoreService.collections.ingredients,
          recipe.ingredient_id
        );
        const menu = await FirestoreService.getById(
          FirestoreService.collections.menus,
          recipe.menu_id
        );

        if (ingredient && menu) {
          recipesWithDetails.push({
            id: recipe.id,
            menu_id: recipe.menu_id,
            ingredient_id: recipe.ingredient_id,
            quantity: recipe.quantity,
            ingredient_name: ingredient.name,
            ingredient_unit: ingredient.unit,
            menu_name: menu.name
          });
        }
      }

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
      const existing = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'menu_id', operator: '==', value: recipe.menu_id },
        { field: 'ingredient_id', operator: '==', value: recipe.ingredient_id }
      ]);

      if (existing.length > 0) {
        throw new Error('이미 해당 메뉴에 등록된 재료입니다.');
      }

      const id = await FirestoreService.create(this.collectionName, recipe);
      return id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  }

  static async updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): Promise<void> {
    try {
      // 중복 체크 (자신 제외하고 동일 메뉴에 동일 재료가 있는지)
      const existing = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'menu_id', operator: '==', value: recipe.menu_id },
        { field: 'ingredient_id', operator: '==', value: recipe.ingredient_id }
      ]);

      if (existing.some(item => item.id !== id)) {
        throw new Error('이미 해당 메뉴에 등록된 재료입니다.');
      }

      await FirestoreService.update(this.collectionName, id, recipe);
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  static async deleteRecipe(id: string): Promise<void> {
    try {
      await FirestoreService.delete(this.collectionName, id);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  static async deleteRecipesByMenuId(menuId: string): Promise<void> {
    try {
      const recipes = await FirestoreService.getWhere(this.collectionName, 'menu_id', '==', menuId);
      for (const recipe of recipes) {
        await FirestoreService.delete(this.collectionName, recipe.id);
      }
    } catch (error) {
      console.error('Error deleting recipes by menu ID:', error);
      throw error;
    }
  }

  static async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const data = await FirestoreService.getById(this.collectionName, id);
      return data as Recipe | null;
    } catch (error) {
      console.error('Error getting recipe by ID:', error);
      return null;
    }
  }

  static async updateRecipeQuantity(id: string, quantity: number): Promise<void> {
    try {
      await FirestoreService.update(this.collectionName, id, { quantity });
    } catch (error) {
      console.error('Error updating recipe quantity:', error);
      throw error;
    }
  }
}
