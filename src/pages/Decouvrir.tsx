import { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
}

export default function Decouvrir() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      let q = supabase.from("profiles").select("user_id, full_name, avatar_url, username, bio").limit(60);
      if (search.trim().length >= 2) q = q.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
      const { data } = await q;
      setUsers(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <PublicLayout
      title="Découvrir — Nexora"
      description="Découvrez les membres et créateurs de la communauté Nexora."
    >
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Découvrir</h1>
        <p className="text-muted-foreground mb-6">Parcourez les profils publics de la communauté Nexora.</p>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un membre…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-full" />
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Aucun membre trouvé.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {users.map(u => (
              <Card key={u.user_id} className="p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <Avatar className="h-16 w-16 mb-3 ring-2 ring-accent">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground">{(u.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold truncate w-full">{u.full_name || "Membre"}</p>
                <p className="text-xs text-muted-foreground truncate w-full">@{u.username || "membre"}</p>
                {u.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{u.bio}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
