import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import { usePosts } from "@/hooks/usePosts";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  const { user } = useAuth();
  const { posts, loading, createPost, toggleLike, addComment, fetchComments } = usePosts();
  const { groupedStories, createStory, markViewed } = useStories();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
          {/* Stories */}
          <StoriesCarousel groups={groupedStories} onCreateStory={createStory} onMarkViewed={markViewed} />

          {/* Create Post */}
          <CreatePost onSubmit={createPost} avatarUrl={profile?.avatar_url} fullName={profile?.full_name} />

          {/* Feed */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-lg font-medium">Aucune publication</p>
              <p className="text-sm">Ajoutez des amis pour voir leurs posts ici !</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                onComment={addComment}
                onFetchComments={fetchComments}
              />
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
