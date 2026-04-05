import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/hooks/useMessaging";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: (userId: string) => void;
}

interface UserResult {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function ConversationList({ conversations, selectedId, onSelect, onNewConversation }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = conversations.filter((c) => {
    const otherParticipant = c.participants?.find((p) => p.user_id !== user?.id);
    const name = c.title || otherParticipant?.profile?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url")
      .or(`full_name.ilike.%${userSearch}%,username.ilike.%${userSearch}%`)
      .neq("user_id", user?.id || "")
      .limit(10);
    setUserResults(data || []);
    setSearching(false);
  };

  const handleSelectUser = (userId: string) => {
    setDialogOpen(false);
    setUserSearch("");
    setUserResults([]);
    onNewConversation(userId);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle conversation</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                placeholder="Chercher un utilisateur…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={searching} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {userResults.map((u) => (
                <button
                  key={u.user_id}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent transition-colors"
                  onClick={() => handleSelectUser(u.user_id)}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {u.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name || "Sans nom"}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </button>
              ))}
              {userResults.length === 0 && userSearch && !searching && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2" />
            <p className="text-sm">Aucune conversation</p>
          </div>
        ) : (
          filtered.map((c) => {
            const other = c.participants?.find((p) => p.user_id !== user?.id);
            const name = c.title || other?.profile?.full_name || "Conversation";
            const isOnline = other?.is_online;
            const lastMsg = c.last_message;

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent ${
                  selectedId === c.id ? "bg-accent" : ""
                }`}
              >
                <div className="relative">
                  {other?.profile?.avatar_url ? (
                    <img src={other.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-[hsl(var(--success))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    {lastMsg && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false, locale: fr })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg?.message_type === "voice"
                        ? "🎤 Message vocal"
                        : lastMsg?.message_type === "image"
                        ? "📷 Image"
                        : lastMsg?.message_type === "file"
                        ? "📎 Fichier"
                        : lastMsg?.content || "Pas de messages"}
                    </p>
                    {(c.unread_count || 0) > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
