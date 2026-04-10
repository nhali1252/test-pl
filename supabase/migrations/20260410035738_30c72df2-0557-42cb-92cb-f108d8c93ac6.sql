-- Add 'transfer' to the transaction_type enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfer';

-- Create providers table (Bank/MFS account registry)
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('bank', 'mfs')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, provider_type)
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own providers" ON public.providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own providers" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own providers" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own providers" ON public.providers FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add account tracking columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN account_type TEXT NOT NULL DEFAULT 'cash' CHECK (account_type IN ('cash', 'bank', 'mfs')),
  ADD COLUMN provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN provider_name TEXT,
  ADD COLUMN to_account_type TEXT CHECK (to_account_type IN ('cash', 'bank', 'mfs')),
  ADD COLUMN to_provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN to_provider_name TEXT;