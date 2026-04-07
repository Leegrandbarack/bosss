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
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-bold text-foreground">Messages</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full gradient-primary text-primary-foreground border-0 hover:opacity-90">
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
                className="rounded-full"
              />
              <Button onClick={searchUsers} disabled={searching} size="sm" className="rounded-full gradient-primary border-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {userResults.map((u) => (
                <button
                  key={u.user_id}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-accent transition-colors"
                  onClick={() => handleSelectUser(u.user_id)}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
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

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            className="pl-9 rounded-full bg-secondary/50 border-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">Aucune conversation</p>
            <p className="text-xs mt-1">Cliquez sur + pour démarrer</p>
          </div>
        ) : (
          filtered.map((c) => {
            const other = c.participants?.find((p) => p.user_id !== user?.id);
            const name = c.title || other?.profile?.full_name || "Conversation";
            const isOnline = other?.is_online;
            const lastMsg = c.last_message;
            const hasUnread = (c.unread_count || 0) > 0;

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-accent/50 ${
                  selectedId === c.id ? "bg-accent" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  {other?.profile?.avatar_url ? (
                    <img src={other.profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-card bg-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{name}</p>
                    {lastMsg && (
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false, locale: fr })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {lastMsg?.message_type === "voice"
                        ? "🎤 Message vocal"
                        : lastMsg?.message_type === "image"
                        ? "📷 Image"
                        : lastMsg?.message_type === "file"
                        ? "📎 Fichier"
                        : lastMsg?.content || "Pas de messages"}
                    </p>
                    {hasUnread && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full gradient-primary px-1.5 text-[10px] font-bold text-primary-foreground ml-2 flex-shrink-0">
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
