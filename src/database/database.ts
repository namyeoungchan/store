import { FirestoreService } from '../firebase/firestoreService';
import { db } from '../firebase/config';

// Firestore 기반 데이터베이스 인터페이스
export const getDatabase = () => {
  return db;
};

// 데이터베이스 초기화 함수 (Supabase는 자동 초기화)
export const initDatabase = async () => {
  try {
    // Supabase 연결 테스트
    const { error } = await db.from('users').select('id').limit(1);

    if (error) {
      console.warn('Supabase connection test warning:', error);
    }

    console.log('Supabase database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
};

// 데이터베이스 변경사항 저장 (Supabase는 자동 저장)
export const persistDatabase = () => {
  // Supabase는 자동으로 저장되므로 아무것도 하지 않음
  console.log('Data persisted to Supabase');
};

// 데이터베이스 리셋 (개발/테스트용)
export const resetDatabase = async () => {
  console.warn('Reset operation not implemented for Supabase');
  // 실제 운영환경에서는 데이터 삭제를 조심스럽게 처리해야 함
};

// FirestoreService 호환성을 위한 재익스포트 (레거시 지원)
export { FirestoreService };
export default db;