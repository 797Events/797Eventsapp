-- 797 Events Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME DEFAULT '18:00',
  venue VARCHAR(255) NOT NULL,
  venue_icon VARCHAR(10) DEFAULT '📍',
  price DECIMAL(10,2) DEFAULT 0,
  image VARCHAR(500) DEFAULT '/Assets/Passes_outlet design.jpg',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passes table
CREATE TABLE IF NOT EXISTS passes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  available INTEGER NOT NULL DEFAULT 100,
  sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  pass_id UUID NOT NULL REFERENCES passes(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  user_details JSONB NOT NULL,
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking_analytics table for tracking
CREATE TABLE IF NOT EXISTS booking_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  event_id UUID NOT NULL REFERENCES events(id),
  influencer_id UUID REFERENCES influencers(id),
  revenue DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_passes_event_id ON passes(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_influencers_code ON influencers(code);
CREATE INDEX IF NOT EXISTS idx_booking_analytics_date ON booking_analytics(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_passes_updated_at ON passes;
CREATE TRIGGER update_passes_updated_at BEFORE UPDATE ON passes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_influencers_updated_at ON influencers;
CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: Pass@123)
-- Note: password_hash is bcrypt hash of 'Pass@123' with 12 rounds
INSERT INTO users (email, password_hash, full_name, role, phone)
VALUES (
  'the797events@gmail.com',
  '$2b$12$K8F2Q9Z5jYv5dM1bX3nOFu7K5ZmQ2X1cP4vR8yT6uN9gH2sJ7wL0a',
  'Admin User',
  'admin',
  '+1234567890'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample events for testing
INSERT INTO events (title, description, date, time, venue, price, is_active)
VALUES
  (
    'The Great Indian Navratri 2025 - Day 1',
    'Experience the grandest Navratri celebration with traditional dances, music, and cultural performances.',
    '2025-10-15',
    '18:00',
    'Grand Convention Center',
    499.00,
    true
  ),
  (
    'New Year Celebration 2026',
    'Ring in the New Year with an unforgettable evening of music, dance, and entertainment.',
    '2025-12-31',
    '20:00',
    'Skyline Banquet Hall',
    999.00,
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample passes for the events
DO $$
DECLARE
    navratri_event_id UUID;
    newyear_event_id UUID;
BEGIN
    -- Get event IDs
    SELECT id INTO navratri_event_id FROM events WHERE title = 'The Great Indian Navratri 2025 - Day 1' LIMIT 1;
    SELECT id INTO newyear_event_id FROM events WHERE title = 'New Year Celebration 2026' LIMIT 1;

    -- Insert passes for Navratri event
    IF navratri_event_id IS NOT NULL THEN
        INSERT INTO passes (event_id, name, price, available) VALUES
        (navratri_event_id, 'General Admission', 299.00, 100),
        (navratri_event_id, 'Premium Pass', 499.00, 50),
        (navratri_event_id, 'VIP Experience', 799.00, 25)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert passes for New Year event
    IF newyear_event_id IS NOT NULL THEN
        INSERT INTO passes (event_id, name, price, available) VALUES
        (newyear_event_id, 'Standard Entry', 799.00, 200),
        (newyear_event_id, 'Premium Package', 999.00, 100),
        (newyear_event_id, 'VIP Celebration', 1499.00, 50)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Create referrals table for tracking influencer commissions
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_codes table for admin discount codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2),
  max_usage INTEGER,
  current_usage INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_events UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for referrals table
CREATE INDEX IF NOT EXISTS idx_referrals_influencer_id ON referrals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_booking_id ON referrals(booking_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Create indexes for promo_codes table
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_dates ON promo_codes(valid_from, valid_until);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample influencer
INSERT INTO influencers (name, email, phone, code, commission_rate)
VALUES (
  'Sample Influencer',
  'influencer@example.com',
  '+1234567891',
  'SAMPLE20',
  15.00
) ON CONFLICT (email) DO NOTHING;

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, minimum_amount, valid_until, max_usage)
VALUES
  ('WELCOME10', 'percentage', 10.00, 500.00, '2025-12-31', 100),
  ('SAVE50', 'fixed', 50.00, 300.00, '2025-12-31', 200),
  ('STUDENT15', 'percentage', 15.00, 200.00, '2025-12-31', 500)
ON CONFLICT (code) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully! Admin login: the797events@gmail.com / Pass@123' AS message;