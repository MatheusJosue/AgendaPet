-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (links to Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tutor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_breed TEXT,
  service TEXT NOT NULL CHECK (service IN ('banho', 'tosa')),
  price DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Companies: users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users: users can only see users from their company
CREATE POLICY "Users can view company users" ON users
  FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Appointments: users can only see appointments from their company
CREATE POLICY "Users can view company appointments" ON appointments
  FOR ALL USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Index for faster queries
CREATE INDEX idx_appointments_company_date ON appointments(company_id, date);
CREATE INDEX idx_users_company ON users(company_id);

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'PET' || upper(substring(md5(random()::text) from 1 for 6));
  RETURN code;
END;
$$ LANGUAGE plpgsql;
