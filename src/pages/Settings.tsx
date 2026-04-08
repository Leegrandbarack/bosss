import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";

const settingsItems = [
  { icon: User, label: "Compte", description: "Informations personnelles" },
  { icon: Lock, label: "Confidentialité", description: "Contrôle de vos données" },
  { icon: Bell, label: "Notifications", description: "Gérer les alertes" },
  { icon: Shield, label: "Sécurité", description: "Mot de passe et connexion" },
  { icon: HelpCircle, label: "Aide", description: "Centre d'aide et support" },
];

export default function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>

          <Card className="divide-y divide-border border-border/50 overflow-hidden">
            {settingsItems.map(({ icon: Icon, label, description }) => (
              <button
                key={label}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </Card>

          <Button
            variant="outline"
            className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
