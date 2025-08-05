-- Enable realtime for futures table
ALTER TABLE public.futures REPLICA IDENTITY FULL;

-- Add futures table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.futures;