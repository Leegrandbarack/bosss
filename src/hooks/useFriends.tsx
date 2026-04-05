import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FriendshipWithProfile {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendshipWithProfile[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendshipWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) { setLoading(false); return; }

    const otherIds = (data || []).map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
    
    let profilesMap: Record<string, any> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", otherIds);
      (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
    }

    const enriched = (data || []).map(f => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return { ...f, profile: profilesMap[otherId] || { user_id: otherId, full_name: null, avatar_url: null, username: null } };
    });

    setFriends(enriched.filter(f => f.status === "accepted"));
    setPendingReceived(enriched.filter(f => f.status === "pending" && f.addressee_id === user.id));
    setPendingSent(enriched.filter(f => f.status === "pending" && f.requester_id === user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFriendships(); }, [fetchFriendships]);

  const sendRequest = useCallback(async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: addresseeId });
    if (error) { toast.error("Erreur lors de l'envoi"); return; }
    toast.success("Demande envoyée !");
    fetchFriendships();
  }, [user, fetchFriendships]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Ami ajouté !");
    fetchFriendships();
  }, [fetchFriendships]);

  const rejectRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from("friendships").update({ status: "rejected" }).eq("id", friendshipId);
    if (error) { toast.error("Erreur"); return; }
    fetchFriendships();
  }, [fetchFriendships]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Ami supprimé");
    fetchFriendships();
  }, [fetchFriendships]);

  return { friends, pendingReceived, pendingSent, loading, sendRequest, acceptRequest, rejectRequest, removeFriend, refetch: fetchFriendships };
}
