-- Add close_date column to futures table
ALTER TABLE public.futures ADD COLUMN close_date timestamp with time zone;