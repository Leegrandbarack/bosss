import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null; avatar_url: string | null; username: string | null };
}

export const BLOG_CATEGORIES = ["Tech", "Business", "Education", "Lifestyle", "Actualités"] as const;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) + "-" + Math.random().toString(36).slice(2, 7);
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (!data) { setPosts([]); setLoading(false); return; }

    const authorIds = [...new Set(data.map(p => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, username")
      .in("user_id", authorIds);
    const map: Record<string, any> = {};
    (profiles || []).forEach(p => { map[p.user_id] = p; });

    setPosts(data.map(p => ({ ...p, author: map[p.author_id] })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { posts, loading, refetch: fetch };
}

export function useBlogPost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
      if (data) {
        const { data: profile } = await supabase
          .from("profiles").select("user_id, full_name, avatar_url, username")
          .eq("user_id", data.author_id).maybeSingle();
        setPost({ ...data, author: profile || undefined });
      } else {
        setPost(null);
      }
      setLoading(false);
    })();
  }, [slug]);

  return { post, loading };
}

export function useCreateBlogPost() {
  const { user } = useAuth();

  return useCallback(async (input: {
    title: string; summary: string; content: string;
    category: string; tags: string[]; coverFile?: File | null;
  }) => {
    if (!user) { toast.error("Connectez-vous"); return null; }

    let cover_image_url: string | null = null;
    if (input.coverFile) {
      const path = `${user.id}/blog/${Date.now()}_${input.coverFile.name}`;
      const { error: upErr } = await supabase.storage.from("post-media").upload(path, input.coverFile);
      if (upErr) { toast.error("Erreur upload image"); return null; }
      cover_image_url = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
    }

    const slug = slugify(input.title);
    const { data, error } = await supabase.from("blog_posts").insert({
      author_id: user.id,
      title: input.title,
      slug,
      summary: input.summary || null,
      content: input.content,
      category: input.category,
      tags: input.tags,
      cover_image_url,
    }).select().single();

    if (error) { toast.error("Erreur publication"); return null; }
    toast.success("Article publié !");
    return data as BlogPost;
  }, [user]);
}
