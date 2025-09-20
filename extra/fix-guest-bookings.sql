-- Fix database schema to allow guest bookings (NULL user_id)
-- Run this in your Supabase SQL Editor

-- Step 1: Modify the bookings table to allow NULL user_id for guest bookings
ALTER TABLE bookings
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add a comment to document the change
COMMENT ON COLUMN bookings.user_id IS 'User ID - NULL for guest bookings, foreign key for registered users';

-- Step 3: Verify the change worked
-- This query should show user_id as nullable
SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name = 'user_id';

-- Step 4: Add an index for better performance on both guest and user bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id_nullable ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_bookings ON bookings(event_id, created_at) WHERE user_id IS NULL;

-- Step 5: Verify existing data won't conflict
SELECT
  COUNT(*) as total_bookings,
  COUNT(user_id) as bookings_with_user_id,
  COUNT(*) - COUNT(user_id) as guest_bookings
FROM bookings;