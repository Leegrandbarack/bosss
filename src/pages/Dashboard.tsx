import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Link } from "react-router-dom";

interface Profile {
  full_name: string | null;
  phone: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, phone, username, avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg space-y-6">
          <Link to="/profile" className="flex items-center gap-3 group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-12 w-12 rounded-full object-cover border border-border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {profile?.full_name || "Utilisateur"}
              </h2>
              <p className="text-sm text-muted-foreground">@{profile?.username || "—"}</p>
            </div>
          </Link>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-success" />
              Connexion sécurisée active
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Téléphone</p>
                <p className="font-medium text-foreground">{profile?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email vérifié</p>
                <p className="font-medium text-foreground">{user?.email_confirmed_at ? "Oui" : "Non"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
