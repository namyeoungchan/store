import { FirestoreService } from '../firebase/firestoreService';
import { db } from '../firebase/config';

// Firebase Realtime Database 인터페이스
export const getDatabase = () => {
  return db;
};

// 데이터베이스 초기화 함수
export const initDatabase = async () => {
  try {
    console.log('Firebase Realtime Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

// 데이터베이스 변경사항 저장 (Firebase RTDB는 자동 저장)
export const persistDatabase = () => {
  console.log('Data persisted to Firebase Realtime Database');
};

// 데이터베이스 리셋 (개발/테스트용)
export const resetDatabase = async () => {
  console.warn('Reset operation not implemented for Firebase RTDB');
};

export { FirestoreService };
export default db;
