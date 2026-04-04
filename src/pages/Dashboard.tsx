import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single().then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-primary">NEXORA</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {profile?.full_name || "Utilisateur"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
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
