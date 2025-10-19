import { SupabaseClient } from '@supabase/supabase-js';
import { db } from './config';

export class FirestoreService {
  // 테이블 이름들 (Supabase 용)
  static collections = {
    users: 'users',
    ingredients: 'ingredients',
    menus: 'menus',
    recipes: 'recipes',
    inventory: 'inventory',
    orders: 'orders',
    orderItems: 'order_items',
    inventoryHistory: 'inventory_history',
    workSchedules: 'work_schedules',
    fixedSchedules: 'fixed_schedules',
    workRecords: 'work_records'
  };

  // 문서 생성
  static async create(tableName: string, data: any): Promise<string> {
    const docData = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await db.from(tableName).insert(docData).select().single();

    if (error) throw error;
    return result.id;
  }

  // 문서 조회 (ID로)
  static async getById(tableName: string, id: string): Promise<any | null> {
    const { data, error } = await db.from(tableName).select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  // 전체 문서 조회
  static async getAll(tableName: string): Promise<any[]> {
    const { data, error } = await db.from(tableName).select('*');

    if (error) throw error;
    return data || [];
  }

  // 조건부 조회
  static async getWhere(tableName: string, field: string, operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | '==', value: any): Promise<any[]> {
    let query = db.from(tableName).select('*');

    switch (operator) {
      case '=':
      case '==':
        query = query.eq(field, value);
        break;
      case '!=':
        query = query.neq(field, value);
        break;
      case '>':
        query = query.gt(field, value);
        break;
      case '<':
        query = query.lt(field, value);
        break;
      case '>=':
        query = query.gte(field, value);
        break;
      case '<=':
        query = query.lte(field, value);
        break;
      case 'like':
        query = query.like(field, value);
        break;
      case 'ilike':
        query = query.ilike(field, value);
        break;
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // 문서 업데이트
  static async update(tableName: string, id: string, data: any): Promise<void> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const { error } = await db.from(tableName).update(updateData).eq('id', id);
    if (error) throw error;
  }

  // 문서 삭제
  static async delete(tableName: string, id: string): Promise<void> {
    const { error } = await db.from(tableName).delete().eq('id', id);
    if (error) throw error;
  }

  // 정렬된 조회
  static async getOrderedBy(tableName: string, field: string, direction: 'asc' | 'desc' = 'desc'): Promise<any[]> {
    const { data, error } = await db.from(tableName).select('*').order(field, { ascending: direction === 'asc' });

    if (error) throw error;
    return data || [];
  }

  // 제한된 조회
  static async getLimited(tableName: string, limitCount: number): Promise<any[]> {
    const { data, error } = await db.from(tableName).select('*').limit(limitCount);

    if (error) throw error;
    return data || [];
  }

  // 복합 쿼리 (여러 조건)
  static async getWithMultipleWhere(tableName: string, conditions: Array<{field: string, operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | '==', value: any}>): Promise<any[]> {
    let query = db.from(tableName).select('*');

    conditions.forEach(condition => {
      switch (condition.operator) {
        case '=':
        case '==':
          query = query.eq(condition.field, condition.value);
          break;
        case '!=':
          query = query.neq(condition.field, condition.value);
          break;
        case '>':
          query = query.gt(condition.field, condition.value);
          break;
        case '<':
          query = query.lt(condition.field, condition.value);
          break;
        case '>=':
          query = query.gte(condition.field, condition.value);
          break;
        case '<=':
          query = query.lte(condition.field, condition.value);
          break;
        case 'like':
          query = query.like(condition.field, condition.value);
          break;
        case 'ilike':
          query = query.ilike(condition.field, condition.value);
          break;
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // 배치 작업 유틸리티
  static async batchCreate(tableName: string, dataArray: any[]): Promise<string[]> {
    const promises = dataArray.map(data => this.create(tableName, data));
    return Promise.all(promises);
  }

  // 트랜잭션 유틸리티 (복잡한 작업용) - Supabase는 RPC를 통해 트랜잭션을 처리
  static async transaction(callback: (client: SupabaseClient) => Promise<void>): Promise<void> {
    await callback(db);
  }
}