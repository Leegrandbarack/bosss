import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, PenSquare, Calendar, Tag } from "lucide-react";
import { useBlogPosts, BLOG_CATEGORIES } from "@/hooks/useBlog";
import LazyImage from "@/components/social/LazyImage";
import BlogEditorDialog from "@/components/blog/BlogEditorDialog";

export default function Blog() {
  const { posts, loading, refetch } = useBlogPosts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Tous");
  const [editorOpen, setEditorOpen] = useState(false);

  // Inject AdSense script once on this page
  useEffect(() => {
    const id = "adsbygoogle-blog";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3400143120808296";
    document.head.appendChild(s);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      const matchCat = category === "Tous" || p.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.summary || "").toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, category]);

  return (
    <PublicLayout
      title="Blog Nexora — Articles, idées et actualités"
      description="Articles et idées sur les réseaux sociaux, la vie privée, la communauté en ligne et la tech. Le blog officiel de Nexora."
    >
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-5">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight">Blog Nexora</h1>
            <Button size="sm" onClick={() => setEditorOpen(true)} className="gap-1.5">
              <PenSquare className="h-4 w-4" /> Écrire
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Articles, idées et actualités de la communauté.
          </p>
        </section>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article, un tag…"
            className="pl-9 rounded-full"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {["Tous", ...BLOG_CATEGORIES].map(c => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "secondary"}
              className="rounded-full shrink-0"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Aucun article pour le moment.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <Card className="overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                  {post.cover_image_url ? (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <LazyImage
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] gradient-primary flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary-foreground/90">
                        {post.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <h2 className="font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.summary}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {post.author?.full_name || post.author?.username || "Auteur"}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3 w-3" />{post.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
      <BlogEditorDialog open={editorOpen} onOpenChange={setEditorOpen} onCreated={refetch} />
    </div>
  );
}
