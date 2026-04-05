import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function AppHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="text-xl font-bold text-primary">NEXORA</Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile"><UserIcon className="mr-2 h-4 w-4" /> Profil</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
