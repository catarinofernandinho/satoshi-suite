-- Add timezone field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Update existing profiles with UTC as default
UPDATE public.profiles 
SET timezone = 'UTC' 
WHERE timezone IS NULL;