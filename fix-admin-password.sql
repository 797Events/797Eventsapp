-- Fix Admin Password Hash
-- Run this in your Supabase SQL Editor to fix the admin login issue

UPDATE users
SET password_hash = '$2b$12$eJ7lHFmfNHLbPqdgnoV8pOHM/8EoKuYrHtqZop4IKg07Zjgj5CgEe'
WHERE email = 'the797events@gmail.com';

-- Verify the update
SELECT email, full_name, role, is_active, created_at
FROM users
WHERE email = 'the797events@gmail.com';

-- Success message
SELECT 'Admin password hash updated successfully! You can now login with: the797events@gmail.com / Pass@123' AS message;