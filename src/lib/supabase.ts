import { createClient } from "@supabase/supabase-js";

// Мы НЕ используем NEXT_PUBLIC_, чтобы эти ключи не попадали в браузер
// Сервер Vercel будет брать их из Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || "https://uuhuugprmmdobmpkbjnn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable__d3X7f3510P-tNXC0kGWXQ_5dY9nxFV";

// Для серверных экшенов лучше использовать service_role_key, если он есть, 
// чтобы обходить политики RLS, или anon_key для обычных запросов.
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
