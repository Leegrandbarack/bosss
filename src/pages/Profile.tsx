import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, Copy, Check } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Min. 2 caractères").max(100),
  bio: z.string().max(300, "Max. 300 caractères").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});

interface ProfileData {
  full_name: string;
  bio: string;
  phone: string;
  username: string;
  avatar_url: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    bio: "",
    phone: "",
    username: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, bio, phone, username, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name || "",
            bio: data.bio || "",
            phone: data.phone || "",
            username: data.username || "",
            avatar_url: data.avatar_url || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner une image." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Erreur", description: "L'image ne doit pas dépasser 2 Mo." });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'upload." });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url }).eq("user_id", user.id);
    setProfile(p => ({ ...p, avatar_url }));
    setUploading(false);
    toast({ title: "Photo mise à jour !" });
  };

  const handleSave = async () => {
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      toast({ variant: "destructive", title: "Erreur", description: parsed.error.errors[0].message });
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.full_name, bio: parsed.data.bio || null, phone: parsed.data.phone || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder." });
    } else {
      toast({ title: "Profil mis à jour !" });
    }
  };

  const copyUsername = () => {
    navigator.clipboard.writeText(profile.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="pb-20">
        {/* Cover / Avatar section */}
        <div className="relative">
          <div className="h-32 gradient-primary" />
          <div className="mx-auto max-w-md px-4 -mt-14">
            <div className="flex flex-col items-center">
              <div className="relative group">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-28 w-28 rounded-full object-cover border-4 border-background shadow-lg" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full gradient-primary text-primary-foreground text-4xl font-bold border-4 border-background shadow-lg">
                    {profile.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-card border-t-transparent" />
                  ) : (
                    <Camera className="h-7 w-7 text-white" />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <h2 className="mt-3 text-xl font-bold text-foreground">{profile.full_name || "Utilisateur"}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-md px-4 mt-6 space-y-4">
          {/* Unique ID */}
          <Card className="p-4 border-border/50">
            <Label className="text-xs text-muted-foreground">Identifiant unique</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-sm font-mono text-foreground">@{profile.username}</code>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={copyUsername}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>

          {/* Form */}
          <Card className="p-5 space-y-4 border-border/50">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                maxLength={100}
                placeholder="Votre nom"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                maxLength={20}
                placeholder="+33 6 12 34 56 78"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                maxLength={300}
                placeholder="Parlez-nous de vous..."
                rows={3}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground text-right">{profile.bio.length}/300</p>
            </div>
            <Button onClick={handleSave} className="w-full rounded-xl gradient-primary border-0" disabled={saving}>
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Enregistrer</>
              )}
            </Button>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
