import { Link, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useBlogPost } from "@/hooks/useBlog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = useBlogPost(slug);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <Link to="/blog">
          <Button variant="ghost" size="sm" className="mb-3 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Retour au blog
          </Button>
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
          </div>
        ) : !post ? (
          <div className="text-center py-20 text-muted-foreground">Article introuvable.</div>
        ) : (
          <article className="space-y-5">
            {post.cover_image_url && (
              <div className="aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge>{post.category}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{post.title}</h1>

            {post.summary && (
              <p className="text-lg text-muted-foreground leading-relaxed">{post.summary}</p>
            )}

            <div className="flex items-center gap-3 py-3 border-y border-border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback>{(post.author?.full_name || "?").charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">{post.author?.full_name || post.author?.username || "Auteur"}</div>
                <div className="text-xs text-muted-foreground">Auteur</div>
              </div>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-[15px] leading-relaxed">
              {post.content}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {post.tags.map(t => (
                  <Badge key={t} variant="secondary">#{t}</Badge>
                ))}
              </div>
            )}
          </article>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
