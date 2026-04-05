import { useState } from "react";
import type { PostWithProfile, Comment } from "@/hooks/usePosts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PostCardProps {
  post: PostWithProfile;
  onLike: (postId: string, liked: boolean) => void;
  onComment: (postId: string, content: string) => void;
  onFetchComments: (postId: string) => Promise<Comment[]>;
}

export default function PostCard({ post, onLike, onComment, onFetchComments }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const data = await onFetchComments(post.id);
      setComments(data);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await onComment(post.id, commentText);
    setCommentText("");
    const data = await onFetchComments(post.id);
    setComments(data);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.profile.avatar_url || undefined} />
          <AvatarFallback>{(post.profile.full_name || "U")[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{post.profile.full_name || post.profile.username || "Utilisateur"}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {post.content && <p className="px-4 pb-3 text-sm text-foreground">{post.content}</p>}

      {post.image_url && (
        <img src={post.image_url} alt="Post" className="w-full object-cover" style={{ maxHeight: 400 }} />
      )}

      <div className="flex items-center gap-1 border-t border-border px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 ${post.liked_by_me ? "text-destructive" : "text-muted-foreground"}`}
          onClick={() => onLike(post.id, post.liked_by_me)}
        >
          <Heart className={`mr-1 h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
          {post.likes_count > 0 && post.likes_count}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={toggleComments}>
          <MessageCircle className="mr-1 h-4 w-4" />
          {post.comments_count > 0 && post.comments_count}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
          <Share2 className="mr-1 h-4 w-4" />
        </Button>
      </div>

      {showComments && (
        <div className="border-t border-border p-3 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground text-center">Chargement…</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={c.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{(c.profile.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-secondary/50 px-3 py-1.5">
                  <p className="text-xs font-medium text-foreground">{c.profile.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-foreground">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Écrire un commentaire…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitComment()}
              className="text-sm"
            />
            <Button size="sm" onClick={submitComment} disabled={!commentText.trim()}>
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
