import { useState, useEffect, useCallback } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { useConversations } from "@/hooks/useMessaging";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
}

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createDirectConversation } = useConversations();
  const { friends, pendingSent, sendRequest } = useFriends();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMessage = useCallback(async (otherUserId: string) => {
    const convId = await createDirectConversation(otherUserId);
    if (convId) navigate(`/messages?conv=${convId}`);
    else navigate("/messages");
  }, [createDirectConversation, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, bio")
        .neq("user_id", user.id)
        .limit(50);

      if (search.trim().length >= 2) {
        query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
      }

      const { data } = await query;
      setUsers(data || []);
      setLoading(false);
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [user, search]);

  const getStatus = (userId: string) => {
    if (friends.some(f => f.profile.user_id === userId)) return "friend";
    if (pendingSent.some(f => f.profile.user_id === userId)) return "sent";
    return "none";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
          <h1 className="text-lg font-bold text-foreground">Découvrir</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des utilisateurs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-secondary border-0"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">Aucun utilisateur trouvé</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {users.map(u => {
                const status = getStatus(u.user_id);
                return (
                  <Card key={u.user_id} className="flex flex-col items-center gap-2 p-4 hover:shadow-md transition-shadow">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="text-lg gradient-primary text-primary-foreground">
                        {(u.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center min-w-0 w-full">
                      <p className="text-sm font-semibold text-foreground truncate">{u.full_name || "Utilisateur"}</p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username || "user"}</p>
                    </div>
                    <div className="flex gap-1.5 w-full">
                      {status === "none" && (
                        <Button size="sm" className="flex-1 text-xs gradient-primary border-0" onClick={() => sendRequest(u.user_id)}>
                          <UserPlus className="mr-1 h-3.5 w-3.5" /> Ajouter
                        </Button>
                      )}
                      {status === "sent" && (
                        <Button size="sm" variant="secondary" className="flex-1 text-xs" disabled>
                          <Clock className="mr-1 h-3.5 w-3.5" /> En attente
                        </Button>
                      )}
                      {status === "friend" && (
                        <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => navigate("/messages")}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
