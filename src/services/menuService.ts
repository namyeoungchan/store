import { FirestoreService } from '../database/database';
import { Menu, RecipeWithDetails } from '../types';

export class MenuService {
  private static collectionName = FirestoreService.collections.menus;

  static async getAllMenus(): Promise<Menu[]> {
    try {
      const data = await FirestoreService.getOrderedBy(this.collectionName, 'name', 'asc');
      return data as Menu[];
    } catch (error) {
      console.error('Error getting all menus:', error);
      return [];
    }
  }

  static async addMenu(menu: Omit<Menu, 'id' | 'created_at'>): Promise<string> {
    try {
      // 중복 이름 체크
      const existing = await FirestoreService.getWhere(this.collectionName, 'name', '==', menu.name);
      if (existing.length > 0) {
        throw new Error('이미 존재하는 메뉴명입니다.');
      }

      const menuData = {
        ...menu,
        description: menu.description || ''
      };

      const id = await FirestoreService.create(this.collectionName, menuData);
      return id;
    } catch (error) {
      console.error('Error adding menu:', error);
      throw error;
    }
  }

  static async updateMenu(id: string, menu: Omit<Menu, 'id' | 'created_at'>): Promise<void> {
    try {
      // 중복 이름 체크 (자신 제외)
      const existing = await FirestoreService.getWhere(this.collectionName, 'name', '==', menu.name);
      if (existing.some(item => item.id !== id)) {
        throw new Error('이미 존재하는 메뉴명입니다.');
      }

      const menuData = {
        ...menu,
        description: menu.description || ''
      };

      await FirestoreService.update(this.collectionName, id, menuData);
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  }

  static async deleteMenu(id: string): Promise<void> {
    try {
      await FirestoreService.delete(this.collectionName, id);
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  }

  static async getMenuById(id: string): Promise<Menu | null> {
    try {
      const data = await FirestoreService.getById(this.collectionName, id);
      return data as Menu | null;
    } catch (error) {
      console.error('Error getting menu by ID:', error);
      return null;
    }
  }

  static async getRecipesByMenuId(menuId: string): Promise<RecipeWithDetails[]> {
    try {
      const recipes = await FirestoreService.getWhere(
        FirestoreService.collections.recipes,
        'menu_id',
        '==',
        menuId
      );

      const recipesWithDetails: RecipeWithDetails[] = [];

      for (const recipe of recipes) {
        const ingredient = await FirestoreService.getById(
          FirestoreService.collections.ingredients,
          recipe.ingredient_id
        );
        const menu = await FirestoreService.getById(this.collectionName, recipe.menu_id);

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
}
