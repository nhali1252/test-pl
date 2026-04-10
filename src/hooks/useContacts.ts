import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export function useContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Contact[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const addContact = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ name: name.trim(), user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });

  return { contacts, isLoading, addContact, deleteContact };
}
