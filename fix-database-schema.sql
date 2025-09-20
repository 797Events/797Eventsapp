-- FIX DATABASE SCHEMA FOR USER ROLES
-- Run this in your Supabase SQL Editor

-- Fix users table role constraint to allow all required roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'guard', 'influencer', 'customer'));

-- Add referral_code column for influencers if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Ensure influencers and referrals tables exist
CREATE TABLE IF NOT EXISTS influencers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booking_id VARCHAR(255) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_logs table if not exists
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id VARCHAR(255) NOT NULL,
  event_id UUID REFERENCES events(id),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  quantity_attended INTEGER DEFAULT 1,
  scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_by VARCHAR(255),
  guard_name VARCHAR(255),
  scan_location VARCHAR(255),
  notes TEXT
);

-- Fix complete
SELECT 'Database schema fixed successfully!' as result;