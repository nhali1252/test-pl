import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useActiveUsers() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Upsert own session
    const upsertSession = async () => {
      await supabase
        .from("active_sessions")
        .upsert({ user_id: user.id, last_seen: new Date().toISOString() } as any, { onConflict: "user_id" });
    };

    upsertSession();

    // Heartbeat every 30s
    const interval = setInterval(upsertSession, 30000);

    // Fetch count
    const fetchCount = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from("active_sessions")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", fiveMinAgo);
      setCount(c || 0);
    };

    fetchCount();

    // Real-time subscription
    const channel = supabase
      .channel("active_sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "active_sessions" }, () => {
        fetchCount();
      })
      .subscribe();

    // Cleanup: remove session on unmount
    return () => {
      clearInterval(interval);
      supabase.from("active_sessions").delete().eq("user_id", user.id).then(() => {});
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
