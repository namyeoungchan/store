import { db } from './config';
import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  Database
} from 'firebase/database';

export class FirestoreService {
  // 테이블(노드) 이름들
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

  // 스냅샷을 배열로 변환하는 유틸리티
  private static snapshotToArray(snapshot: any): any[] {
    const result: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child: any) => {
        result.push({ id: child.key, ...child.val() });
      });
    }
    return result;
  }

  // 문서 생성
  static async create(tableName: string, data: any): Promise<string> {
    const docData = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const nodeRef = ref(db, tableName);
    const newRef = push(nodeRef);
    await set(newRef, docData);
    return newRef.key!;
  }

  // 문서 조회 (ID로)
  static async getById(tableName: string, id: string): Promise<any | null> {
    const nodeRef = ref(db, `${tableName}/${id}`);
    const snapshot = await get(nodeRef);

    if (!snapshot.exists()) return null;
    return { id: snapshot.key, ...snapshot.val() };
  }

  // 전체 문서 조회
  static async getAll(tableName: string): Promise<any[]> {
    const nodeRef = ref(db, tableName);
    const snapshot = await get(nodeRef);
    return this.snapshotToArray(snapshot);
  }

  // 조건부 조회
  static async getWhere(
    tableName: string,
    field: string,
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | '==',
    value: any
  ): Promise<any[]> {
    // Firebase RTDB는 복잡한 쿼리를 지원하지 않으므로 전체 조회 후 필터링
    const allData = await this.getAll(tableName);

    return allData.filter(item => {
      const fieldValue = item[field];
      switch (operator) {
        case '=':
        case '==':
          return fieldValue === value;
        case '!=':
          return fieldValue !== value;
        case '>':
          return fieldValue > value;
        case '<':
          return fieldValue < value;
        case '>=':
          return fieldValue >= value;
        case '<=':
          return fieldValue <= value;
        case 'like':
          return typeof fieldValue === 'string' && fieldValue.includes(value.replace(/%/g, ''));
        case 'ilike':
          return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(value.replace(/%/g, '').toLowerCase());
        default:
          return true;
      }
    });
  }

  // 문서 업데이트
  static async update(tableName: string, id: string, data: any): Promise<void> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const nodeRef = ref(db, `${tableName}/${id}`);
    await update(nodeRef, updateData);
  }

  // 문서 삭제
  static async delete(tableName: string, id: string): Promise<void> {
    const nodeRef = ref(db, `${tableName}/${id}`);
    await remove(nodeRef);
  }

  // 정렬된 조회
  static async getOrderedBy(tableName: string, field: string, direction: 'asc' | 'desc' = 'desc'): Promise<any[]> {
    const allData = await this.getAll(tableName);

    return allData.sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return direction === 'asc' ? (aVal - bVal) : (bVal - aVal);
    });
  }

  // 제한된 조회
  static async getLimited(tableName: string, limitCount: number): Promise<any[]> {
    const allData = await this.getAll(tableName);
    return allData.slice(0, limitCount);
  }

  // 복합 쿼리 (여러 조건)
  static async getWithMultipleWhere(
    tableName: string,
    conditions: Array<{ field: string; operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | '=='; value: any }>
  ): Promise<any[]> {
    const allData = await this.getAll(tableName);

    return allData.filter(item => {
      return conditions.every(condition => {
        const fieldValue = item[condition.field];
        switch (condition.operator) {
          case '=':
          case '==':
            return fieldValue === condition.value;
          case '!=':
            return fieldValue !== condition.value;
          case '>':
            return fieldValue > condition.value;
          case '<':
            return fieldValue < condition.value;
          case '>=':
            return fieldValue >= condition.value;
          case '<=':
            return fieldValue <= condition.value;
          case 'like':
            return typeof fieldValue === 'string' && fieldValue.includes(condition.value.replace(/%/g, ''));
          case 'ilike':
            return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(condition.value.replace(/%/g, '').toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  // 배치 작업 유틸리티
  static async batchCreate(tableName: string, dataArray: any[]): Promise<string[]> {
    const promises = dataArray.map(data => this.create(tableName, data));
    return Promise.all(promises);
  }
}
