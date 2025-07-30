-- Add new columns to transactions table for better tracking
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transfer_type TEXT CHECK (transfer_type IN ('entrada', 'saida')),
ADD COLUMN IF NOT EXISTS revenue NUMERIC DEFAULT 0;

-- Add index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);