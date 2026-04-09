import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Shield,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const generalItems = [
  { icon: User, label: "Compte", description: "Informations personnelles" },
  { icon: Bell, label: "Notifications", description: "Gérer les alertes" },
  { icon: Shield, label: "Sécurité", description: "Mot de passe et connexion" },
  { icon: HelpCircle, label: "Aide", description: "Centre d'aide et support" },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isPrivate, setIsPrivate] = useState(false);
  const [whoCanAdd, setWhoCanAdd] = useState("everyone");
  const [whoCanSeePosts, setWhoCanSeePosts] = useState("everyone");
  const [friendsList, setFriendsList] = useState("everyone");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_private, privacy_who_can_add, privacy_who_can_see_posts, privacy_friends_list")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setIsPrivate(data.is_private ?? false);
          setWhoCanAdd(data.privacy_who_can_add ?? "everyone");
          setWhoCanSeePosts(data.privacy_who_can_see_posts ?? "everyone");
          setFriendsList(data.privacy_friends_list ?? "everyone");
        }
      });
  }, [user]);

  const savePrivacy = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      is_private: isPrivate,
      privacy_who_can_add: whoCanAdd,
      privacy_who_can_see_posts: whoCanSeePosts,
      privacy_friends_list: friendsList,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erreur de sauvegarde");
    else toast.success("Confidentialité mise à jour !");
  };

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

          {/* Privacy section */}
          <Card className="overflow-hidden border-border/50">
            <button
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50"
              onClick={() => setPrivacyOpen(!privacyOpen)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Lock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Confidentialité</p>
                <p className="text-xs text-muted-foreground">Contrôle de vos données</p>
              </div>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${privacyOpen ? "rotate-90" : ""}`} />
            </button>

            {privacyOpen && (
              <div className="border-t border-border px-4 py-4 space-y-5 animate-fade-in">
                {/* Private profile toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="private-toggle" className="text-sm">Profil privé</Label>
                  </div>
                  <Switch id="private-toggle" checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>

                {/* Who can add */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qui peut m'ajouter en ami</Label>
                  <Select value={whoCanAdd} onValueChange={setWhoCanAdd}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Tout le monde</SelectItem>
                      <SelectItem value="friends_of_friends">Amis d'amis</SelectItem>
                      <SelectItem value="nobody">Personne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Who can see posts */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qui peut voir mes posts</Label>
                  <Select value={whoCanSeePosts} onValueChange={setWhoCanSeePosts}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Tout le monde</SelectItem>
                      <SelectItem value="friends">Amis uniquement</SelectItem>
                      <SelectItem value="only_me">Moi uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Who can see friends list */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qui peut voir ma liste d'amis</Label>
                  <Select value={friendsList} onValueChange={setFriendsList}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Tout le monde</SelectItem>
                      <SelectItem value="friends">Amis uniquement</SelectItem>
                      <SelectItem value="only_me">Moi uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={savePrivacy} disabled={saving} className="w-full rounded-xl gradient-primary border-0">
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            )}
          </Card>

          {/* Other settings */}
          <Card className="divide-y divide-border border-border/50 overflow-hidden">
            {generalItems.map(({ icon: Icon, label, description }) => (
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
