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

export type PaymentType = 'CARD' | 'COUPANG' | 'BAEMIN' | 'YOGIYO';

export interface Order {
  id?: number;
  order_date?: string;
  total_amount: number;
  payment_type: PaymentType;
  expected_deposit_date?: string;
  is_deposited?: boolean;
  deposited_date?: string;
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

export interface SalesAnalytics {
  total_sales: number;
  pending_deposits: number;
  today_sales: number;
  this_week_sales: number;
  this_month_sales: number;
  payment_type_breakdown: {
    type: PaymentType;
    amount: number;
    count: number;
  }[];
}

export interface DepositSchedule {
  date: string;
  total_amount: number;
  orders: {
    id: number;
    payment_type: PaymentType;
    amount: number;
    order_date: string;
  }[];
}

export interface User {
  id?: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  hire_date: string;
  position: string;
  hourly_wage: number;
  password_hash?: string;
  password_temp?: string;
  is_password_temp?: boolean;
  last_login?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkSchedule {
  id?: number;
  user_id: number;
  week_start_date: string;
  monday_start?: string;
  monday_end?: string;
  tuesday_start?: string;
  tuesday_end?: string;
  wednesday_start?: string;
  wednesday_end?: string;
  thursday_start?: string;
  thursday_end?: string;
  friday_start?: string;
  friday_end?: string;
  saturday_start?: string;
  saturday_end?: string;
  sunday_start?: string;
  sunday_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkRecord {
  id?: number;
  user_id: number;
  work_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  total_hours: number;
  total_pay: number;
  notes?: string;
  created_at?: string;
}

export interface UserWithSchedule extends User {
  current_schedule?: WorkSchedule;
  total_hours_this_week?: number;
  total_pay_this_week?: number;
}

export interface WeeklyWorkSummary {
  user_id: number;
  user_name: string;
  week_start_date: string;
  total_hours: number;
  total_pay: number;
  work_days: number;
  records: WorkRecord[];
}