-- Add multi-day support to events table
-- Run this in your Supabase SQL Editor

-- Add columns for multi-day events
ALTER TABLE events
ADD COLUMN is_multi_day BOOLEAN DEFAULT false,
ADD COLUMN event_days JSONB DEFAULT NULL;

-- Add day_info column to passes table for multi-day pass information
ALTER TABLE passes
ADD COLUMN day_info JSONB DEFAULT NULL;

-- Add indexes
CREATE INDEX idx_events_multi_day ON events(is_multi_day);
CREATE INDEX idx_passes_day_info ON passes USING GIN(day_info);

-- Update any existing events to have is_multi_day = false
UPDATE events SET is_multi_day = false WHERE is_multi_day IS NULL;

-- Successful completion message
SELECT 'Multi-day event support added successfully!' AS message;