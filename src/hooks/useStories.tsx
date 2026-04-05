import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface StoryWithProfile {
  id: string;
  user_id: string;
  image_url: string | null;
  video_url: string | null;
  caption: string | null;
  expires_at: string;
  created_at: string;
  profile: { full_name: string | null; avatar_url: string | null; username: string | null };
  viewed: boolean;
  views_count: number;
}

export interface GroupedStories {
  user_id: string;
  profile: { full_name: string | null; avatar_url: string | null; username: string | null };
  stories: StoryWithProfile[];
  hasUnviewed: boolean;
}

export function useStories() {
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, username").in("user_id", userIds);
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

    const { data: myViews } = await supabase.from("story_views").select("story_id").eq("viewer_id", user.id);
    const viewedSet = new Set((myViews || []).map(v => v.story_id));

    const enriched: StoryWithProfile[] = data.map(s => ({
      ...s,
      profile: profileMap[s.user_id] || { full_name: null, avatar_url: null, username: null },
      viewed: viewedSet.has(s.id),
      views_count: 0,
    }));

    const grouped: Record<string, GroupedStories> = {};
    enriched.forEach(s => {
      if (!grouped[s.user_id]) {
        grouped[s.user_id] = { user_id: s.user_id, profile: s.profile, stories: [], hasUnviewed: false };
      }
      grouped[s.user_id].stories.push(s);
      if (!s.viewed) grouped[s.user_id].hasUnviewed = true;
    });

    // Put current user's stories first
    const sorted = Object.values(grouped).sort((a, b) => {
      if (a.user_id === user.id) return -1;
      if (b.user_id === user.id) return 1;
      return 0;
    });

    setGroupedStories(sorted);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const createStory = useCallback(async (imageFile: File, caption?: string) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}_${imageFile.name}`;
    const { error: upErr } = await supabase.storage.from("post-media").upload(path, imageFile);
    if (upErr) { toast.error("Erreur upload"); return; }
    const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);

    const { error } = await supabase.from("stories").insert({ user_id: user.id, image_url: urlData.publicUrl, caption });
    if (error) { toast.error("Erreur story"); return; }
    toast.success("Story publiée !");
    fetchStories();
  }, [user, fetchStories]);

  const markViewed = useCallback(async (storyId: string) => {
    if (!user) return;
    await supabase.from("story_views").insert({ story_id: storyId, viewer_id: user.id }).select().maybeSingle();
  }, [user]);

  return { groupedStories, loading, createStory, markViewed, refetch: fetchStories };
}
