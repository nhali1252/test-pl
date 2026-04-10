
-- Active sessions for tracking online users
CREATE TABLE public.active_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_active_sessions_user_id ON public.active_sessions (user_id);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upsert own session" ON public.active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session" ON public.active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session" ON public.active_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view active sessions" ON public.active_sessions
  FOR SELECT TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

-- Dues table
CREATE TABLE public.dues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  person text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL CHECK (amount > 0),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dues" ON public.dues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dues" ON public.dues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dues" ON public.dues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dues" ON public.dues FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_dues_updated_at BEFORE UPDATE ON public.dues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Due payments table
CREATE TABLE public.due_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  due_id uuid NOT NULL REFERENCES public.dues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.due_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.due_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.due_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.due_payments FOR DELETE USING (auth.uid() = user_id);

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add unique constraint on profiles.username for username login
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
