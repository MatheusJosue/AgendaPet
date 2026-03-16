import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Company = {
  id: string;
  name: string;
  phone: string;
  invite_code: string;
  plan_status: 'active' | 'inactive';
  created_at: string;
};

export type User = {
  id: string;
  company_id: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
};

export type Appointment = {
  id: string;
  company_id: string;
  tutor_name: string;
  phone: string;
  pet_name: string;
  pet_breed?: string;
  service: 'banho' | 'tosa';
  price: number;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
};