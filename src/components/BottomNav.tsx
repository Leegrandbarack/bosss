import { Link, useLocation } from "react-router-dom";
import { Home, Users, Search, MessageSquare, User } from "lucide-react";

const navItems = [
  { to: "/feed", icon: Home, label: "Accueil" },
  { to: "/discover", icon: Search, label: "Découvrir" },
  { to: "/friends", icon: Users, label: "Amis" },
  { to: "/messages", icon: MessageSquare, label: "Messages" },
  { to: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 glass supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-all duration-200 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full gradient-primary" />
              )}
              <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "stroke-[2.5] scale-110" : ""}`} />
              <span className="leading-none font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
