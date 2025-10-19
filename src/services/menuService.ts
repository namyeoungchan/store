import { supabase } from '../firebase/config';
import { Menu, RecipeWithDetails } from '../types';

export class MenuService {
  private static tableName = 'menus';

  static async getAllMenus(): Promise<Menu[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all menus:', error);
      return [];
    }
  }

  static async addMenu(menu: Omit<Menu, 'id' | 'created_at'>): Promise<string> {
    try {
      // 중복 이름 체크
      const { data: existingMenus } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('name', menu.name);

      if (existingMenus && existingMenus.length > 0) {
        throw new Error('이미 존재하는 메뉴명입니다.');
      }

      const menuData = {
        ...menu,
        description: menu.description || ''
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(menuData)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding menu:', error);
      throw error;
    }
  }

  static async updateMenu(id: string, menu: Omit<Menu, 'id' | 'created_at'>): Promise<void> {
    try {
      // 중복 이름 체크 (자신 제외)
      const { data: existingMenus } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('name', menu.name)
        .neq('id', id);

      if (existingMenus && existingMenus.length > 0) {
        throw new Error('이미 존재하는 메뉴명입니다.');
      }

      const menuData = {
        ...menu,
        description: menu.description || ''
      };

      const { error } = await supabase
        .from(this.tableName)
        .update(menuData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  }

  static async deleteMenu(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  }

  static async getMenuById(id: string): Promise<Menu | null> {
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
      console.error('Error getting menu by ID:', error);
      return null;
    }
  }

  static async getRecipesByMenuId(menuId: string): Promise<RecipeWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
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

      // 재료명으로 정렬
      return recipesWithDetails.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
    } catch (error) {
      console.error('Error getting recipes by menu ID:', error);
      return [];
    }
  }

}