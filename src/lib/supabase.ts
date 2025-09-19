import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (server-side only)
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side');
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Database Tables Schema Types
export interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  venue_icon: string;
  price: number;
  image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabasePass {
  id: string;
  event_id: string;
  name: string;
  price: number;
  available: number;
  sold: number;
  created_at: string;
}

export interface DatabaseBooking {
  id: string;
  event_id: string;
  pass_id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  quantity: number;
  total_amount: number;
  payment_id: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  ticket_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  password_hash?: string;
  role: 'admin' | 'customer' | 'guard' | 'influencer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInfluencer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  commission_rate: number;
  total_sales: number;
  total_revenue: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// SQL Scripts for table creation
export const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue VARCHAR(255) NOT NULL,
  venue_icon VARCHAR(10) DEFAULT '📍',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passes table
CREATE TABLE IF NOT EXISTS passes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  available INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer', 'guard', 'influencer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES passes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_id VARCHAR(255),
  booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  ticket_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date_active ON events(date, is_active);
CREATE INDEX IF NOT EXISTS idx_passes_event_id ON passes(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_influencers_code ON influencers(code);

-- Row Level Security (RLS) Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;

-- Public read access for events and passes
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Passes are viewable by everyone" ON passes FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "Admins can do everything on events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (
  auth.email() = customer_email OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Insert bookings policy (for payment processing)
CREATE POLICY "Anyone can create bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;