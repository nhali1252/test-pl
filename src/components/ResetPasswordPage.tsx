import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ResetPasswordPage({ onBack }: { onBack: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const establishSession = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace("#", ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setSessionError("Reset link is invalid or expired");
            return;
          }
          setSessionReady(true);
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setSessionError("Reset link is invalid or expired");
            return;
          }
          setSessionReady(true);
        } else {
          // Check if there's already a session (user might have been redirected with auto-session)
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setSessionReady(true);
          } else {
            setSessionError("Reset link is invalid or expired. Please request a new one.");
          }
        }
      } catch {
        setSessionError("Failed to process reset link");
      } finally {
        setInitializing(false);
      }
    };

    // Also listen for auth state changes (Supabase may auto-handle the token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
        setSessionError("");
        setInitializing(false);
      }
    });

    establishSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Min 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Password updated!");
    // Sign out after successful reset to ensure clean state
    await supabase.auth.signOut();
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-expense mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground mb-4">{sessionError}</p>
          <Button onClick={onBack} className="bg-primary text-primary-foreground">Go to Login</Button>
        </motion.div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 className="w-16 h-16 text-cash mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Password Updated!</h2>
          <p className="text-sm text-muted-foreground mb-4">Please sign in with your new password.</p>
          <Button onClick={onBack} className="bg-primary text-primary-foreground mt-4">Go to Login</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2"><Lock className="w-5 h-5" /> Set New Password</h2>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">New Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="bg-secondary/40 border-border/40 rounded-xl mt-1 h-11" placeholder="Min 8 characters" required />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Confirm Password</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="bg-secondary/40 border-border/40 rounded-xl mt-1 h-11" required />
            </div>
            <Button type="submit" disabled={loading || !sessionReady} className="w-full bg-primary text-primary-foreground rounded-xl h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Update Password
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
