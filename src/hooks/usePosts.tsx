import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PostWithProfile {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile: { full_name: string | null; avatar_url: string | null; username: string | null };
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: { full_name: string | null; avatar_url: string | null };
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const postsRef = useRef(posts);
  postsRef.current = posts;

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, username").in("user_id", userIds);
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

    const { data: myLikes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
    const likedSet = new Set((myLikes || []).map(l => l.post_id));

    setPosts(data.map(p => ({
      ...p,
      profile: profileMap[p.user_id] || { full_name: null, avatar_url: null, username: null },
      liked_by_me: likedSet.has(p.id),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase.channel("posts-realtime").on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = useCallback(async (content: string, imageFile?: File) => {
    if (!user) return;
    let image_url: string | null = null;

    if (imageFile) {
      const path = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("post-media").upload(path, imageFile);
      if (upErr) { toast.error("Erreur upload image"); return; }
      const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({ user_id: user.id, content, image_url });
    if (error) { toast.error("Erreur création post"); return; }
    toast.success("Post publié !");
  }, [user]);

  // Optimistic like toggle — update UI immediately, then sync with DB
  const toggleLike = useCallback(async (postId: string, liked: boolean) => {
    if (!user) return;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        liked_by_me: !liked,
        likes_count: liked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
      };
    }));

    try {
      if (liked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
        const current = postsRef.current.find(p => p.id === postId);
        await supabase.from("posts").update({ likes_count: Math.max(0, (current?.likes_count ?? 1) - 1) }).eq("id", postId);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        const current = postsRef.current.find(p => p.id === postId);
        await supabase.from("posts").update({ likes_count: (current?.likes_count ?? 0) + 1 }).eq("id", postId);
      }
    } catch {
      // Revert on error
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    // Optimistic comment count
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));

    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content });
    if (error) {
      toast.error("Erreur commentaire");
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p));
      return;
    }
    await supabase.from("posts").update({ comments_count: (postsRef.current.find(p => p.id === postId)?.comments_count || 0) + 1 }).eq("id", postId);
  }, [user]);

  const fetchComments = useCallback(async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (error || !data) return [];
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
    return data.map(c => ({ ...c, profile: profileMap[c.user_id] || { full_name: null, avatar_url: null } }));
  }, []);

  return { posts, loading, createPost, toggleLike, addComment, fetchComments, refetch: fetchPosts };
}
