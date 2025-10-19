import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);


// 기존 Firebase 호환성을 위한 db export (임시)
export const db = supabase;

export default supabase;