import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

interface ProfileData {
  full_name: string;
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
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ full_name: "", username: "", avatar_url: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile({ full_name: data.full_name || "", username: data.username || "", avatar_url: data.avatar_url || "" });
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez une image." }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ variant: "destructive", title: "Erreur", description: "Max 2 Mo." }); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { toast({ variant: "destructive", title: "Erreur", description: "Échec upload." }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url }).eq("user_id", user.id);
    setProfile(p => ({ ...p, avatar_url }));
    setUploading(false);
    toast({ title: "Photo mise à jour !" });
  };

  const handleSave = async () => {
    if (!user || !profile.full_name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: profile.full_name.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast({ variant: "destructive", title: "Erreur" }); } 
    else { toast({ title: "Profil mis à jour !" }); setEditing(false); }
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
        <div className="relative">
          <div className="h-32 gradient-primary" />
          <div className="mx-auto max-w-md px-4 -mt-14">
            <div className="flex flex-col items-center">
              {/* Avatar */}
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

              {/* Name */}
              <h2 className="mt-3 text-xl font-bold text-foreground">{profile.full_name || "Utilisateur"}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>

              {/* Edit toggle */}
              {!editing && (
                <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => setEditing(true)}>
                  Modifier profil
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Edit form — only visible when editing */}
        {editing && (
          <div className="mx-auto max-w-md px-4 mt-6">
            <Card className="p-5 space-y-4 border-border/50">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  maxLength={100}
                  placeholder="Votre nom"
                  className="rounded-xl"
                />
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
        )}
      </main>
      <BottomNav />
    </div>
  );
}
