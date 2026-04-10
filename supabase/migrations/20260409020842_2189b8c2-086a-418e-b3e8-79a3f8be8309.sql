-- Update any existing NULL usernames to a generated value
UPDATE public.profiles SET username = 'user_' || substr(id::text, 1, 8) WHERE username IS NULL OR username = '';

-- Make username NOT NULL
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET DEFAULT '';

-- Add case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));
