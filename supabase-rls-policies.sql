-- ===================================
-- SUPABASE RLS POLICIES FOR PRODUCTION
-- 797EVENTS - Complete Policy Setup
-- ===================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.passes;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.influencers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.referrals;

-- Disable RLS temporarily to ensure we can set up policies
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ===================================
-- EVENTS TABLE POLICIES
-- ===================================

-- Allow public read access to active events (for homepage)
CREATE POLICY "Public can view active events"
ON public.events FOR SELECT
USING (is_active = true);

-- Allow admin users to perform all operations on events
CREATE POLICY "Admins can manage all events"
ON public.events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Allow service role (API calls) to perform all operations
CREATE POLICY "Service role can manage events"
ON public.events FOR ALL
USING (auth.role() = 'service_role');

-- ===================================
-- PASSES TABLE POLICIES
-- ===================================

-- Allow public read access to passes for active events
CREATE POLICY "Public can view passes for active events"
ON public.passes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = passes.event_id
    AND events.is_active = true
  )
);

-- Allow admin users to manage all passes
CREATE POLICY "Admins can manage all passes"
ON public.passes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Allow service role to manage passes
CREATE POLICY "Service role can manage passes"
ON public.passes FOR ALL
USING (auth.role() = 'service_role');

-- ===================================
-- BOOKINGS TABLE POLICIES
-- ===================================

-- Allow users to view their own bookings
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
USING (customer_email = auth.email());

-- Allow public to create bookings (guest bookings)
CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Allow admin users to view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'guard')
    AND users.is_active = true
  )
);

-- Allow service role to manage bookings
CREATE POLICY "Service role can manage bookings"
ON public.bookings FOR ALL
USING (auth.role() = 'service_role');

-- ===================================
-- USERS TABLE POLICIES
-- ===================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (id = auth.uid());

-- Allow admin users to manage all users
CREATE POLICY "Admins can manage all users"
ON public.users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Allow service role to manage users
CREATE POLICY "Service role can manage users"
ON public.users FOR ALL
USING (auth.role() = 'service_role');

-- ===================================
-- INFLUENCERS TABLE POLICIES
-- ===================================

-- Allow public read access to active influencers (for referral validation)
CREATE POLICY "Public can view active influencers"
ON public.influencers FOR SELECT
USING (is_active = true);

-- Allow admin users to manage all influencers
CREATE POLICY "Admins can manage all influencers"
ON public.influencers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);

-- Allow service role to manage influencers
CREATE POLICY "Service role can manage influencers"
ON public.influencers FOR ALL
USING (auth.role() = 'service_role');

-- ===================================
-- REFERRALS TABLE POLICIES
-- ===================================

-- Allow public to create referrals (for tracking)
CREATE POLICY "Anyone can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

-- Allow admin and influencers to view relevant referrals
CREATE POLICY "Users can view relevant referrals"
ON public.referrals FOR SELECT
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
  OR
  -- Influencers can see their own referrals
  EXISTS (
    SELECT 1 FROM public.influencers
    WHERE influencers.user_id = auth.uid()
    AND influencers.referral_code = referrals.referral_code
  )
);

-- Allow service role to manage referrals
CREATE POLICY "Service role can manage referrals"
ON public.referrals FOR ALL
USING (auth.role() = 'service_role');

-- ===================================
-- GRANT PERMISSIONS TO SERVICE ROLE
-- ===================================

-- Ensure service role has all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

-- Test queries to verify policies are working
-- Run these after applying policies:

-- 1. Check if events are publicly visible
-- SELECT id, title, is_active FROM public.events WHERE is_active = true;

-- 2. Check if passes are visible for active events
-- SELECT p.id, p.name, e.title FROM public.passes p
-- JOIN public.events e ON p.event_id = e.id
-- WHERE e.is_active = true;

-- 3. Verify admin can see all users (run as admin)
-- SELECT id, email, role FROM public.users;

-- ===================================
-- NOTES FOR DEPLOYMENT
-- ===================================

-- 1. Run this script in Supabase SQL Editor
-- 2. Ensure your service_role key is used for API calls
-- 3. Test all admin operations after applying policies
-- 4. Monitor logs for any RLS violations
-- 5. Consider adding rate limiting at application level

-- ===================================
-- BACKUP DISABLE RLS (EMERGENCY ONLY)
-- ===================================

-- In case of emergency, run these to disable RLS entirely:
-- ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.passes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;