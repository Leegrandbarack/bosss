import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Info, Users, Image, Clapperboard } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/social/PostCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAbout from "@/components/profile/ProfileAbout";
import ProfilePhotos from "@/components/profile/ProfilePhotos";
import ProfileFriendsList from "@/components/profile/ProfileFriendsList";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { usePosts } from "@/hooks/usePosts";

interface ProfileData {
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  is_private: boolean;
  city: string;
  country: string;
  school: string;
  work: string;
  birth_date: string;
  gender: string;
  phone: string;
}

const EMPTY_PROFILE: ProfileData = {
  full_name: "", username: "", avatar_url: "", bio: "", is_private: false,
  city: "", country: "", school: "", work: "", birth_date: "", gender: "", phone: "",
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, react, unreact, addComment, fetchComments } = usePosts();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, username, avatar_url, bio, is_private, city, country, school, work, birth_date, gender, phone").eq("user_id", user.id).single(),
      supabase.from("friendships").select("id", { count: "exact", head: true }).or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([{ data }, friendsRes, postsRes]) => {
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          is_private: data.is_private ?? false,
          city: (data as any).city || "",
          country: (data as any).country || "",
          school: (data as any).school || "",
          work: (data as any).work || "",
          birth_date: (data as any).birth_date || "",
          gender: (data as any).gender || "",
          phone: data.phone || "",
        });
      }
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
      city: profile.city.trim() || null,
      country: profile.country.trim() || null,
      school: profile.school.trim() || null,
      work: profile.work.trim() || null,
      gender: profile.gender.trim() || null,
    } as any).eq("user_id", user.id);
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
        <ProfileHeader
          profile={profile}
          postsCount={postsCount}
          friendsCount={friendsCount}
          isOwner={true}
          uploading={uploading}
          onAvatarUpload={handleAvatarUpload}
          onEdit={() => setEditing(true)}
        />

        {editing && (
          <ProfileEditForm
            data={profile}
            saving={saving}
            onChange={(field, value) => setProfile(p => ({ ...p, [field]: value }))}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        )}

        {/* Tabs */}
        <div className="mx-auto max-w-lg px-4 mt-6">
          <Tabs defaultValue="posts">
            <TabsList className="w-full grid grid-cols-5 h-11">
              <TabsTrigger value="posts" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" /> Posts</TabsTrigger>
              <TabsTrigger value="about" className="text-xs gap-1"><Info className="h-3.5 w-3.5" /> À propos</TabsTrigger>
              <TabsTrigger value="friends" className="text-xs gap-1"><Users className="h-3.5 w-3.5" /> Amis</TabsTrigger>
              <TabsTrigger value="photos" className="text-xs gap-1"><Image className="h-3.5 w-3.5" /> Photos</TabsTrigger>
              <TabsTrigger value="stories" className="text-xs gap-1"><Clapperboard className="h-3.5 w-3.5" /> Stories</TabsTrigger>
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

            <TabsContent value="about" className="mt-4">
              <ProfileAbout profile={profile} isOwner={true} />
            </TabsContent>

            <TabsContent value="friends" className="mt-4">
              {user && <ProfileFriendsList userId={user.id} />}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              {user && <ProfilePhotos userId={user.id} />}
            </TabsContent>

            <TabsContent value="stories" className="mt-4">
              <p className="text-center text-sm text-muted-foreground py-8">Les stories apparaissent sur l'accueil</p>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
