import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Due {
  id: string;
  user_id: string;
  person: string;
  description: string;
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DuePayment {
  id: string;
  due_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  notes: string;
  created_at: string;
}

export function useDues() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: dues = [], isLoading } = useQuery({
    queryKey: ["dues", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dues")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Due[];
    },
    enabled: !!user,
  });

  const addDue = useMutation({
    mutationFn: async (d: { person: string; description: string; amount: number; due_date?: string }) => {
      const { error } = await supabase.from("dues").insert({ ...d, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dues"] }),
  });

  const payDue = useMutation({
    mutationFn: async ({ dueId, amount, notes }: { dueId: string; amount: number; notes?: string }) => {
      // Insert payment
      const { error: payErr } = await supabase.from("due_payments").insert({
        due_id: dueId, user_id: user!.id, amount, notes: notes || "",
      } as any);
      if (payErr) throw payErr;

      // Update due
      const due = dues.find(d => d.id === dueId);
      if (!due) throw new Error("Due not found");
      const newPaid = due.paid_amount + amount;
      const newStatus = newPaid >= due.amount ? "paid" : "pending";
      const { error: updErr } = await supabase.from("dues").update({
        paid_amount: newPaid, status: newStatus,
      } as any).eq("id", dueId);
      if (updErr) throw updErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dues"] }),
  });

  const deleteDue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dues"] }),
  });

  const getPayments = async (dueId: string): Promise<DuePayment[]> => {
    const { data, error } = await supabase
      .from("due_payments")
      .select("*")
      .eq("due_id", dueId)
      .order("payment_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DuePayment[];
  };

  const totalDueRemaining = dues
    .filter(d => d.status === "pending")
    .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

  return {
    dues, isLoading,
    addDue: addDue.mutateAsync,
    payDue: payDue.mutateAsync,
    deleteDue: deleteDue.mutateAsync,
    getPayments,
    totalDueRemaining,
  };
}
