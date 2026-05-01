import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Settings, Newspaper } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nexora-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("nexora-theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 glass">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
        <Link to="/feed" className="text-xl font-extrabold tracking-tight gradient-text">
          NEXORA
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate("/blog")} title="Blog">
            <Newspaper className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
