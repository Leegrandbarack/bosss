import { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export default function Amis() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .limit(40);
      setUsers(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicLayout
      title="Amis & Communauté — Nexora"
      description="Rencontrez la communauté Nexora et créez des liens authentiques avec d'autres membres."
    >
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-3xl md:text-4xl font-extrabold">Communauté</h1>
        </div>
        <p className="text-muted-foreground mb-6">Découvrez les membres récents de Nexora.</p>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Aucun membre pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {users.map(u => (
              <Card key={u.user_id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <Avatar className="h-12 w-12 ring-2 ring-accent">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground">{(u.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{u.full_name || "Membre"}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username || "membre"}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
