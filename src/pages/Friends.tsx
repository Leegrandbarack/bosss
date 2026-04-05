import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Check, X, UserMinus, Clock } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export default function Friends() {
  const { user } = useAuth();
  const { friends, pendingReceived, pendingSent, loading, sendRequest, acceptRequest, rejectRequest, removeFriend } = useFriends();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const allKnownIds = new Set([
    ...friends.map(f => f.profile.user_id),
    ...pendingSent.map(f => f.profile.user_id),
    ...pendingReceived.map(f => f.profile.user_id),
    user?.id,
  ]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length < 2) { setSearchResults([]); return; }
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
        .limit(20);
      setSearchResults((data || []).filter(p => p.user_id !== user?.id));
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user]);

  const getFriendStatus = (userId: string) => {
    if (friends.some(f => f.profile.user_id === userId)) return "friend";
    if (pendingSent.some(f => f.profile.user_id === userId)) return "sent";
    if (pendingReceived.some(f => f.profile.user_id === userId)) return "received";
    return "none";
  };

  const UserCard = ({ profile, status, friendshipId }: { profile: SearchResult; status: string; friendshipId?: string }) => (
    <Card className="flex items-center gap-3 p-3">
      <Avatar className="h-12 w-12">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback>{(profile.full_name || "U")[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{profile.full_name || "Utilisateur"}</p>
        <p className="text-xs text-muted-foreground truncate">@{profile.username || "user"}</p>
      </div>
      {status === "none" && (
        <Button size="sm" onClick={() => sendRequest(profile.user_id)}>
          <UserPlus className="mr-1 h-4 w-4" /> Ajouter
        </Button>
      )}
      {status === "sent" && (
        <Button size="sm" variant="secondary" disabled>
          <Clock className="mr-1 h-4 w-4" /> En attente
        </Button>
      )}
      {status === "received" && friendshipId && (
        <div className="flex gap-1">
          <Button size="sm" onClick={() => acceptRequest(friendshipId)}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => rejectRequest(friendshipId)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {status === "friend" && friendshipId && (
        <Button size="sm" variant="outline" onClick={() => removeFriend(friendshipId)}>
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des utilisateurs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {search.trim().length >= 2 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Résultats</h3>
              {searching ? (
                <p className="text-sm text-muted-foreground text-center py-4">Recherche…</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
              ) : (
                searchResults.map(r => {
                  const status = getFriendStatus(r.user_id);
                  const friendship = [...friends, ...pendingSent, ...pendingReceived].find(f => f.profile.user_id === r.user_id);
                  return <UserCard key={r.user_id} profile={r} status={status} friendshipId={friendship?.id} />;
                })
              )}
            </div>
          ) : (
            <Tabs defaultValue="friends">
              <TabsList className="w-full">
                <TabsTrigger value="friends" className="flex-1">Amis ({friends.length})</TabsTrigger>
                <TabsTrigger value="requests" className="flex-1">
                  Demandes {pendingReceived.length > 0 && `(${pendingReceived.length})`}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1">Envoyées</TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="space-y-2 mt-3">
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun ami pour l'instant. Recherchez des utilisateurs !</p>
                ) : friends.map(f => (
                  <UserCard key={f.id} profile={f.profile} status="friend" friendshipId={f.id} />
                ))}
              </TabsContent>

              <TabsContent value="requests" className="space-y-2 mt-3">
                {pendingReceived.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune demande en attente</p>
                ) : pendingReceived.map(f => (
                  <UserCard key={f.id} profile={f.profile} status="received" friendshipId={f.id} />
                ))}
              </TabsContent>

              <TabsContent value="sent" className="space-y-2 mt-3">
                {pendingSent.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune demande envoyée</p>
                ) : pendingSent.map(f => (
                  <UserCard key={f.id} profile={f.profile} status="sent" friendshipId={f.id} />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
