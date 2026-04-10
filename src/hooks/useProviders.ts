import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Provider = {
  id: string;
  user_id: string;
  name: string;
  provider_type: "bank" | "mfs";
  created_at: string;
  updated_at: string;
};

export function useProviders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Provider[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const addProvider = useMutation({
    mutationFn: async ({ name, provider_type }: { name: string; provider_type: "bank" | "mfs" }) => {
      const { data, error } = await supabase
        .from("providers")
        .insert({ name: name.trim(), provider_type, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Provider;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providers"] }),
  });

  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("providers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providers"] }),
  });

  const banks = providers.filter(p => p.provider_type === "bank");
  const mfsServices = providers.filter(p => p.provider_type === "mfs");

  return { providers, banks, mfsServices, isLoading, addProvider, deleteProvider };
}
