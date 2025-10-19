import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey);

// 기존 Firebase 호환성을 위한 db export (임시)
export const db = supabase;

export default supabase;