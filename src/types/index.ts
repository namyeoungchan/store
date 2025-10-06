export interface Ingredient {
  id?: number;
  name: string;
  unit: string;
  created_at?: string;
}

export interface Menu {
  id?: number;
  name: string;
  description?: string;
  price: number;
  created_at?: string;
}

export interface Recipe {
  id?: number;
  menu_id: number;
  ingredient_id: number;
  quantity: number;
}

export interface RecipeWithDetails extends Recipe {
  ingredient_name: string;
  ingredient_unit: string;
  menu_name: string;
}

export interface Inventory {
  id?: number;
  ingredient_id: number;
  current_stock: number;
  min_stock: number;
  updated_at?: string;
}

export interface InventoryWithDetails extends Inventory {
  ingredient_name: string;
  ingredient_unit: string;
}

export interface Order {
  id?: number;
  order_date?: string;
  total_amount: number;
}

export interface OrderItem {
  id?: number;
  order_id: number;
  menu_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderItemWithDetails extends OrderItem {
  menu_name: string;
}

export interface InventoryHistory {
  id?: number;
  ingredient_id: number;
  change_type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  order_id?: number | null;
  notes?: string | null;
  created_at?: string;
}

export interface InventoryHistoryWithDetails extends InventoryHistory {
  ingredient_name: string;
  ingredient_unit: string;
}