import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://kvgoiijgqcvebiugxlcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2Z29paWpncWN2ZWJpdWd4bGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NjY2MTEsImV4cCI6MjA3NjQ0MjYxMX0.m_UgIBNjQxAGQizkr1pvvaD9b98SO4xVq-G9zAZR2aM';

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey);

// 기존 Firebase 호환성을 위한 db export (임시)
export const db = supabase;

export default supabase;