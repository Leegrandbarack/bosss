import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface FriendProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface ProfileFriendsListProps {
  userId: string;
}

export default function ProfileFriendsList({ userId }: ProfileFriendsListProps) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", "accepted");

      if (!friendships?.length) { setLoading(false); return; }

      const otherIds = friendships.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", otherIds);

      setFriends(profiles || []);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-12">Aucun ami</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {friends.map(f => (
        <Link key={f.user_id} to={`/profile/${f.user_id}`}>
          <Card className="p-3 flex items-center gap-3 border-border/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={f.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-bold">
                {(f.full_name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{f.full_name || "Utilisateur"}</p>
              <p className="text-[11px] text-muted-foreground truncate">@{f.username}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
