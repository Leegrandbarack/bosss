import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, Edit2, Users, FileText, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/social/PostCard";
import { usePosts } from "@/hooks/usePosts";

interface ProfileData {
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  is_private: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, react, unreact, addComment, fetchComments } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({ full_name: "", username: "", avatar_url: "", bio: "", is_private: false });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, username, avatar_url, bio, is_private").eq("user_id", user.id).single(),
      supabase.from("friendships").select("id", { count: "exact", head: true }).or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([{ data }, friendsRes, postsRes]) => {
      if (data) setProfile({
        full_name: data.full_name || "",
        username: data.username || "",
        avatar_url: data.avatar_url || "",
        bio: data.bio || "",
        is_private: data.is_private ?? false,
      });
      setFriendsCount(friendsRes.count || 0);
      setPostsCount(postsRes.count || 0);
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
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name.trim(),
      bio: profile.bio.trim(),
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ variant: "destructive", title: "Erreur" });
    else { toast({ title: "Profil mis à jour !" }); setEditing(false); }
  };

  const myPosts = posts.filter(p => p.user_id === user?.id);

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
        {/* Cover + Avatar */}
        <div className="relative">
          <div className="h-36 gradient-primary" />
          <div className="mx-auto max-w-lg px-4 -mt-16">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-bold">
                    {profile.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
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
              {profile.bio && <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">{profile.bio}</p>}
              {profile.is_private && (
                <span className="mt-1 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">🔒 Profil privé</span>
              )}

              {/* Stats */}
              <div className="flex gap-8 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{postsCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{friendsCount}</p>
                  <p className="text-xs text-muted-foreground">Amis</p>
                </div>
              </div>

              {!editing && (
                <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => setEditing(true)}>
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Modifier profil
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mx-auto max-w-lg px-4 mt-6 animate-fade-in">
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
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  maxLength={200}
                  placeholder="Décrivez-vous en quelques mots…"
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditing(false)}>Annuler</Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl gradient-primary border-0" disabled={saving}>
                  {saving ? "…" : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs: Posts / Friends / Info */}
        <div className="mx-auto max-w-lg px-4 mt-6">
          <Tabs defaultValue="posts">
            <TabsList className="w-full">
              <TabsTrigger value="posts" className="flex-1 gap-1.5"><FileText className="h-4 w-4" /> Posts</TabsTrigger>
              <TabsTrigger value="friends" className="flex-1 gap-1.5"><Users className="h-4 w-4" /> Amis</TabsTrigger>
              <TabsTrigger value="info" className="flex-1 gap-1.5"><Info className="h-4 w-4" /> Info</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="space-y-4 mt-4">
              {myPosts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Aucun post pour le moment</p>
              ) : (
                myPosts.map(post => (
                  <PostCard key={post.id} post={post} onReact={react} onUnreact={unreact} onComment={addComment} onFetchComments={fetchComments} />
                ))
              )}
            </TabsContent>
            <TabsContent value="friends" className="mt-4">
              <p className="text-center text-sm text-muted-foreground py-8">{friendsCount} ami{friendsCount !== 1 ? "s" : ""}</p>
            </TabsContent>
            <TabsContent value="info" className="mt-4">
              <Card className="p-4 space-y-2 border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="text-foreground font-medium">{profile.full_name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username</span>
                  <span className="text-foreground font-medium">@{profile.username || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Visibilité</span>
                  <span className="text-foreground font-medium">{profile.is_private ? "Privé 🔒" : "Public"}</span>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
