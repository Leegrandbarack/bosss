import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Info, Users, Image, Clapperboard, Lock } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/social/PostCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAbout from "@/components/profile/ProfileAbout";
import ProfilePhotos from "@/components/profile/ProfilePhotos";
import ProfileFriendsList from "@/components/profile/ProfileFriendsList";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { usePosts } from "@/hooks/usePosts";
import { useFriends } from "@/hooks/useFriends";
import { useConversations } from "@/hooks/useMessaging";

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
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { posts, react, unreact, addComment, fetchComments } = usePosts();
  const { friends, pendingSent, sendRequest } = useFriends();
  const { createDirectConversation } = useConversations();

  const targetUserId = routeUserId || user?.id;
  const isOwner = !routeUserId || routeUserId === user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [otherPosts, setOtherPosts] = useState<any[]>([]);

  const friendStatus: "friend" | "sent" | "none" = !isOwner && targetUserId
    ? friends.some(f => f.profile.user_id === targetUserId) ? "friend"
    : pendingSent.some(f => f.profile.user_id === targetUserId) ? "sent"
    : "none"
    : "none";

  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);
    Promise.all([
      supabase.from("profiles").select("full_name, username, avatar_url, bio, is_private, city, country, school, work, birth_date, gender, phone").eq("user_id", targetUserId).maybeSingle(),
      supabase.from("friendships").select("id", { count: "exact", head: true }).or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`).eq("status", "accepted"),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", targetUserId),
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
  }, [targetUserId]);

  // Fetch posts of other user (public view)
  useEffect(() => {
    if (isOwner || !targetUserId) return;
    (async () => {
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });
      const { data: profData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .eq("user_id", targetUserId)
        .maybeSingle();
      const enriched = (postsData || []).map(p => ({
        ...p,
        profile: profData || { user_id: targetUserId, full_name: null, avatar_url: null, username: null },
        reactions_summary: {},
        my_reaction: null,
        liked_by_me: false,
      }));
      setOtherPosts(enriched);
    })();
  }, [isOwner, targetUserId]);

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

  const handleAddFriend = useCallback(() => {
    if (targetUserId) sendRequest(targetUserId);
  }, [targetUserId, sendRequest]);

  const handleMessage = useCallback(async () => {
    if (!targetUserId) return;
    const convId = await createDirectConversation(targetUserId);
    if (convId) navigate(`/messages?conv=${convId}`);
    else navigate("/messages");
  }, [targetUserId, createDirectConversation, navigate]);

  const myPosts = isOwner ? posts.filter(p => p.user_id === user?.id) : otherPosts;
  const canSeePosts = isOwner || !profile.is_private || friendStatus === "friend";

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
          isOwner={isOwner}
          uploading={uploading}
          onAvatarUpload={handleAvatarUpload}
          onEdit={() => setEditing(true)}
          friendStatus={friendStatus}
          onAddFriend={handleAddFriend}
          onMessage={handleMessage}
        />

        {editing && isOwner && (
          <ProfileEditForm
            data={profile}
            saving={saving}
            onChange={(field, value) => setProfile(p => ({ ...p, [field]: value }))}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        )}

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
              {!canSeePosts ? (
                <div className="text-center py-12 space-y-2">
                  <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Ce profil est privé</p>
                  <p className="text-xs text-muted-foreground">Ajoutez cette personne en ami pour voir ses publications</p>
                </div>
              ) : myPosts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Aucun post</p>
              ) : (
                myPosts.map(post => (
                  <PostCard key={post.id} post={post} onReact={react} onUnreact={unreact} onComment={addComment} onFetchComments={fetchComments} />
                ))
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-4">
              <ProfileAbout profile={profile} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="friends" className="mt-4">
              {targetUserId && <ProfileFriendsList userId={targetUserId} />}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              {targetUserId && <ProfilePhotos userId={targetUserId} />}
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
