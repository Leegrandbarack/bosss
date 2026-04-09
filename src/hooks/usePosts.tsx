import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ReactionType } from "@/components/social/ReactionPicker";

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
  my_reaction: string | null;
  reactions_summary: Record<string, number>;
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
    const postIds = data.map(p => p.id);

    const [{ data: profiles }, { data: myLikes }, { data: allLikes }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, username").in("user_id", userIds),
      supabase.from("post_likes").select("post_id, reaction_type").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("post_likes").select("post_id, reaction_type").in("post_id", postIds),
    ]);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

    const myReactionMap: Record<string, string> = {};
    (myLikes || []).forEach(l => { myReactionMap[l.post_id] = l.reaction_type; });

    // Build reactions summary per post
    const reactionsSummaryMap: Record<string, Record<string, number>> = {};
    (allLikes || []).forEach(l => {
      if (!reactionsSummaryMap[l.post_id]) reactionsSummaryMap[l.post_id] = {};
      const t = l.reaction_type || "like";
      reactionsSummaryMap[l.post_id][t] = (reactionsSummaryMap[l.post_id][t] || 0) + 1;
    });

    setPosts(data.map(p => ({
      ...p,
      profile: profileMap[p.user_id] || { full_name: null, avatar_url: null, username: null },
      liked_by_me: !!myReactionMap[p.id],
      my_reaction: myReactionMap[p.id] || null,
      reactions_summary: reactionsSummaryMap[p.id] || {},
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

  const react = useCallback(async (postId: string, reactionType: ReactionType) => {
    if (!user) return;
    const prev = postsRef.current.find(p => p.id === postId);
    const hadReaction = prev?.my_reaction;

    // Optimistic update
    setPosts(ps => ps.map(p => {
      if (p.id !== postId) return p;
      const summary = { ...p.reactions_summary };
      if (hadReaction) summary[hadReaction] = Math.max(0, (summary[hadReaction] || 1) - 1);
      summary[reactionType] = (summary[reactionType] || 0) + 1;
      return {
        ...p,
        my_reaction: reactionType,
        liked_by_me: true,
        likes_count: hadReaction ? p.likes_count : p.likes_count + 1,
        reactions_summary: summary,
      };
    }));

    try {
      if (hadReaction) {
        await supabase.from("post_likes").update({ reaction_type: reactionType }).eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
        const current = postsRef.current.find(p => p.id === postId);
        await supabase.from("posts").update({ likes_count: (current?.likes_count ?? 0) }).eq("id", postId);
      }
    } catch {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const unreact = useCallback(async (postId: string) => {
    if (!user) return;
    const prev = postsRef.current.find(p => p.id === postId);
    const hadReaction = prev?.my_reaction;

    setPosts(ps => ps.map(p => {
      if (p.id !== postId) return p;
      const summary = { ...p.reactions_summary };
      if (hadReaction) summary[hadReaction] = Math.max(0, (summary[hadReaction] || 1) - 1);
      return {
        ...p,
        my_reaction: null,
        liked_by_me: false,
        likes_count: Math.max(0, p.likes_count - 1),
        reactions_summary: summary,
      };
    }));

    try {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      const current = postsRef.current.find(p => p.id === postId);
      await supabase.from("posts").update({ likes_count: Math.max(0, (current?.likes_count ?? 1)) }).eq("id", postId);
    } catch {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));

    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content });
    if (error) {
      toast.error("Erreur commentaire");
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p));
      return;
    }
    await supabase.from("posts").update({ comments_count: (postsRef.current.find(p => p.id === postId)?.comments_count || 0) }).eq("id", postId);
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

  return { posts, loading, createPost, react, unreact, addComment, fetchComments, refetch: fetchPosts };
}
