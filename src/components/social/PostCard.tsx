import { useState, memo } from "react";
import type { PostWithProfile, Comment } from "@/hooks/usePosts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Share2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LazyImage from "./LazyImage";
import ReactionPicker, { type ReactionType, REACTION_MAP } from "./ReactionPicker";

interface PostCardProps {
  post: PostWithProfile;
  onReact: (postId: string, type: ReactionType) => void;
  onUnreact: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onFetchComments: (postId: string) => Promise<Comment[]>;
}

function PostCard({ post, onReact, onUnreact, onComment, onFetchComments }: PostCardProps) {
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

  // Build reaction summary
  const reactionSummary = post.reactions_summary || {};
  const topReactions = Object.entries(reactionSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 p-3.5">
        <Avatar className="h-10 w-10 ring-2 ring-accent">
          <AvatarImage src={post.profile.avatar_url || undefined} />
          <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
            {(post.profile.full_name || "U")[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{post.profile.full_name || post.profile.username || "Utilisateur"}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
          </p>
        </div>
      </div>

      {post.content && <p className="px-3.5 pb-2.5 text-sm text-foreground leading-relaxed">{post.content}</p>}

      {post.image_url && (
        <LazyImage src={post.image_url} alt="Post" className="w-full" style={{ maxHeight: 420 }} />
      )}

      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-3.5 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {topReactions.map(([type]) => (
              <span key={type} className="text-sm">{REACTION_MAP[type]?.emoji}</span>
            ))}
            {post.likes_count > 0 && <span className="ml-1">{post.likes_count}</span>}
          </div>
          {post.comments_count > 0 && (
            <button onClick={toggleComments} className="hover:underline">
              {post.comments_count} commentaire{post.comments_count > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center border-t border-border">
        <ReactionPicker
          currentReaction={post.my_reaction}
          onReact={(type) => onReact(post.id, type)}
          onUnreact={() => onUnreact(post.id)}
        />
        <Button variant="ghost" size="sm" className="flex-1 rounded-none py-2.5 text-muted-foreground" onClick={toggleComments}>
          <MessageCircle className="mr-1.5 h-[18px] w-[18px]" />
          Commenter
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 rounded-none py-2.5 text-muted-foreground">
          <Share2 className="mr-1.5 h-[18px] w-[18px]" />
          Partager
        </Button>
      </div>

      {showComments && (
        <div className="border-t border-border p-3 space-y-3 bg-secondary/30">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground text-center py-2">Chargement…</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={c.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{(c.profile.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
                <div className="rounded-2xl bg-secondary px-3 py-1.5 max-w-[85%]">
                  <p className="text-xs font-semibold text-foreground">{c.profile.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-foreground/90">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Écrire un commentaire…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitComment()}
              className="text-sm rounded-full bg-secondary border-0"
            />
            <Button size="icon" className="h-9 w-9 rounded-full gradient-primary border-0 flex-shrink-0" onClick={submitComment} disabled={!commentText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default memo(PostCard);
