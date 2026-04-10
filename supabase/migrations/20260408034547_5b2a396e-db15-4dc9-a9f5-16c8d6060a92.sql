
-- Add new transaction types for due system
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'due';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'due_paid';
