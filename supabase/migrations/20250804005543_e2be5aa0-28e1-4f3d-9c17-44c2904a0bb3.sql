-- Remove the leverage column from futures table
ALTER TABLE public.futures DROP COLUMN IF EXISTS leverage;