import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, type Lang, type Country, countryMap } from "@/lib/i18n";
import { useProviders } from "@/hooks/useProviders";
import { useServiceWorkerUpdate } from "@/components/UpdatePrompt";
import { audit } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Lock, LogOut, Save, User, Globe, RefreshCw, Landmark, Smartphone, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: Props) {
  const { profile, isLoading, updateProfile, uploadAvatar, changePassword } = useProfile();
  const { signOut, user } = useAuth();
  const { t, lang, setLang, country, setCountry } = useI18n();
  const { banks, mfsServices, deleteProvider } = useProviders();
  const { checkForUpdates, updateAvailable, applyUpdate } = useServiceWorkerUpdate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [checking, setChecking] = useState(false);

  const initEdit = () => {
    setName(profile?.name || "");
    setUsername(profile?.username || "");
    setEditMode(true);
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error(t("usernameRequired"));
      return;
    }

    // Check uniqueness only if username changed
    if (trimmedUsername.toLowerCase() !== (profile?.username || "").toLowerCase()) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", trimmedUsername)
        .neq("id", user!.id)
        .maybeSingle();
      if (data) {
        toast.error(t("usernameExists"));
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), username: trimmedUsername });
      toast.success(t("profileUpdated"));
      setEditMode(false);
    } catch (e: any) {
      const msg = e.message?.toLowerCase() || "";
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("idx_profiles_username")) {
        toast.error(t("usernameExists"));
      } else {
        toast.error(e.message || t("profileUpdateFailed"));
      }
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      await uploadAvatar(file);
      toast.success("Avatar updated!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast.error("Min 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setChangingPw(true);
    try {
      await changePassword(newPassword);
      toast.success("Password changed!");
      setNewPassword(""); setConfirmPassword(""); setShowPwSection(false);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
    setChangingPw(false);
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    audit("language_changed", `to: ${newLang}`);
  };

  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
    audit("country_changed", `to: ${newCountry}`);
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    await checkForUpdates();
    setChecking(false);
    if (!updateAvailable) {
      toast.info("App is up to date");
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const initials = (profile?.name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground mb-5 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </button>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-3">
          <Avatar className="w-24 h-24 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xl font-display bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <button onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <h2 className="font-display font-bold text-lg">{profile?.name || "User"}</h2>
        {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
        <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
      </div>

      {/* Profile Info */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold flex items-center gap-2"><User className="w-4 h-4" /> {t("profileInfo")}</h3>
          {!editMode && <button onClick={initEdit} className="text-xs text-primary font-medium">{t("edit")}</button>}
        </div>
        {editMode ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t("name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/40 border-border/40 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("username")} *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary/40 border-border/40 rounded-xl mt-1" placeholder="unique username" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-primary-foreground">
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} {t("save")}
              </Button>
              <Button onClick={() => setEditMode(false)} variant="outline" size="sm">{t("cancel")}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("name")}</span><span>{profile?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("username")}</span><span>{profile?.username ? `@${profile.username}` : "—"}</span></div>
          </div>
        )}
      </div>

      {/* Language */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-display font-semibold flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4" /> {t("language")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange("en")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {t("english")}
          </button>
          <button
            onClick={() => handleLangChange("bn")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${lang === "bn" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {t("bangla")}
          </button>
        </div>
      </div>

      {/* Country / Region */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-display font-semibold flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4" /> {t("country")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(countryMap) as Country[]).map((code) => {
            const cfg = countryMap[code];
            const isActive = country === code;
            const label = lang === "bn" ? cfg.labelBn : cfg.label;
            return (
              <button
                key={code}
                onClick={() => handleCountryChange(code)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {label} <span className="text-[10px] opacity-70">({cfg.currency})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* App Update */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <h3 className="text-sm font-display font-semibold flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4" /> {t("appUpdate")}
        </h3>
        {updateAvailable ? (
          <Button onClick={applyUpdate} className="w-full bg-primary text-primary-foreground rounded-xl">
            {t("updateNow")}
          </Button>
        ) : (
          <Button onClick={handleCheckUpdates} disabled={checking} variant="outline" className="w-full rounded-xl">
            {checking ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
            {t("checkForUpdates")}
          </Button>
        )}
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <button onClick={() => setShowPwSection(!showPwSection)}
          className="flex items-center gap-2 text-sm font-display font-semibold w-full">
          <Lock className="w-4 h-4" /> {t("changePassword")}
        </button>
        {showPwSection && (
          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t("newPassword")}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary/40 border-border/40 rounded-xl mt-1" placeholder="Min 8 characters" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("confirmPassword")}</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary/40 border-border/40 rounded-xl mt-1" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPw} size="sm" className="bg-primary text-primary-foreground">
              {changingPw ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} {t("updatePassword")}
            </Button>
          </div>
        )}
      </div>

      {/* Provider Management */}
      {(banks.length > 0 || mfsServices.length > 0) && (
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-display font-semibold flex items-center gap-2 mb-3">
            <Landmark className="w-4 h-4" /> {t("manageProviders")}
          </h3>
          {banks.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t("bank")}</p>
              <div className="space-y-1.5">
                {banks.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/40">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <button onClick={async () => {
                      try {
                        await deleteProvider.mutateAsync(p.id);
                        toast.success(`"${p.name}" ${t("delete").toLowerCase()}d`);
                      } catch {
                        toast.error(t("providerDeleteFailed"));
                      }
                    }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mfsServices.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t("mfs")}</p>
              <div className="space-y-1.5">
                {mfsServices.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/40">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-received" />
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <button onClick={async () => {
                      try {
                        await deleteProvider.mutateAsync(p.id);
                        toast.success(`"${p.name}" ${t("delete").toLowerCase()}d`);
                      } catch {
                        toast.error(t("providerDeleteFailed"));
                      }
                    }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <Button onClick={signOut} variant="outline" className="w-full rounded-xl border-expense/30 text-expense hover:bg-expense/10">
        <LogOut className="w-4 h-4 mr-2" /> {t("signOut")}
      </Button>
    </motion.div>
  );
}
