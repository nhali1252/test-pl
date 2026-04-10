
-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add person_id to transactions
ALTER TABLE public.transactions
  ADD COLUMN person_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Backfill: create contacts from existing person names and link them
INSERT INTO public.contacts (user_id, name)
SELECT DISTINCT user_id, person
FROM public.transactions
WHERE person IS NOT NULL AND person != ''
ON CONFLICT (user_id, name) DO NOTHING;

UPDATE public.transactions t
SET person_id = c.id
FROM public.contacts c
WHERE t.person IS NOT NULL
  AND t.person != ''
  AND t.user_id = c.user_id
  AND t.person = c.name;
