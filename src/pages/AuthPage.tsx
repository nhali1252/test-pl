import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Mail, Lock, Loader2, User, AtSign, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return t("passwordMin8");
    if (!/[A-Z]/.test(pw)) return t("passwordUppercase");
    if (!/[0-9]/.test(pw)) return t("passwordNumber");
    return null;
  };

  const checkUsernameAvailable = async (uname: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", uname.trim())
      .maybeSingle();
    return !data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      let loginEmail = loginIdentifier.trim();
      // If not an email, look up by username
      if (!loginIdentifier.includes("@")) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", loginIdentifier.trim())
          .maybeSingle();
        if (error || !data) {
          toast.error(t("noAccountWithUsername"));
          setLoading(false);
          return;
        }
        // Look up email from profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", data.id)
          .single();
        if (!profileData?.email) {
          toast.error(t("loginFailed"));
          setLoading(false);
          return;
        }
        loginEmail = profileData.email;
      }
      const { error } = await signIn(loginEmail, password);
      if (error) toast.error(error.message);
    } else {
      if (!email || !password) { setLoading(false); return; }

      // Validate username
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        toast.error(t("usernameRequired"));
        setLoading(false);
        return;
      }

      // Check username availability
      const available = await checkUsernameAvailable(trimmedUsername);
      if (!available) {
        toast.error(t("usernameExists"));
        setLoading(false);
        return;
      }

      const pwError = validatePassword(password);
      if (pwError) { toast.error(pwError); setLoading(false); return; }
      if (!name.trim()) { toast.error(t("nameRequired")); setLoading(false); return; }

      const { error } = await signUp(email, password, { name: name.trim(), username: trimmedUsername });
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
          toast.error(t("accountExists"));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(t("checkEmailConfirm"));
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast.error("Enter your email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("resetLinkSent"));
    setShowForgot(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  const handleAppleSignIn = async () => {
    const { error } = await signInWithApple();
    if (error) toast.error(error.message);
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-income/8 blur-[110px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Reset Password</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[11px] text-muted-foreground font-medium">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@example.com" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="pl-10 bg-secondary/40 border-border/40 rounded-xl h-11" required />
                </div>
              </div>
              <Button onClick={handleForgotPassword} disabled={forgotLoading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground glow-primary">
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Send Reset Link
              </Button>
              <button onClick={() => setShowForgot(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-income/8 blur-[110px]" />
        <div className="absolute top-[40%] right-[25%] w-56 h-56 rounded-full bg-received/6 blur-[90px]" />
        <div className="absolute bottom-[10%] left-[30%] w-48 h-48 rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm relative z-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary">
            <Wallet className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-3xl font-display font-bold leading-tight mb-3">
            Control Your <span className="text-primary">Finance</span> Easily
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Track your spending, manage loans, and take control of your finances — all in one place.
          </motion.p>
        </div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card rounded-2xl p-6">
          <p className="text-sm font-display font-semibold text-center mb-5">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-medium">{t("name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                      className="pl-10 bg-secondary/40 border-border/40 rounded-xl h-11" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-medium">{t("username")} *</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="unique username" value={username} onChange={e => setUsername(e.target.value)}
                      className="pl-10 bg-secondary/40 border-border/40 rounded-xl h-11" required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground font-medium">
                {isLogin ? t("emailOrUsername") : "Email"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {isLogin ? (
                  <Input placeholder="email or username" value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="pl-10 bg-secondary/40 border-border/40 rounded-xl h-11" required />
                ) : (
                  <Input type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 bg-secondary/40 border-border/40 rounded-xl h-11" required />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 bg-secondary/40 border-border/40 rounded-xl h-11" minLength={8} required />
              </div>
              {!isLogin && <p className="text-[10px] text-muted-foreground">Min 8 chars, 1 uppercase, 1 number</p>}
            </div>

            {isLogin && (
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-xs text-primary font-medium hover:underline block ml-auto">
                Forgot Password?
              </button>
            )}

            <Button type="submit" className="w-full h-11 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
              disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <Button variant="outline" onClick={handleGoogleSignIn}
            className="w-full h-10 text-xs font-medium rounded-xl border-border/40 hover-lift bg-secondary/30">
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>

          <Button variant="outline" onClick={handleAppleSignIn}
            className="w-full h-10 text-xs font-medium rounded-xl border-border/40 hover-lift bg-secondary/30">
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </Button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
