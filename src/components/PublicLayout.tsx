import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/blog", label: "Blog" },
  { to: "/decouvrir", label: "Découvrir" },
  { to: "/amis", label: "Amis" },
  { to: "/about", label: "À propos" },
  { to: "/contact", label: "Contact" },
];

export default function PublicLayout({ children, title, description }: PublicLayoutProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    // canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + pathname;
  }, [title, description, pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight gradient-text">
            NEXORA
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/blog"><Button size="sm" variant="ghost" className="hidden sm:inline-flex">Blog</Button></Link>
            <Link to="/contact"><Button size="sm">Contact</Button></Link>
          </div>
        </div>
        <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-2 border-t border-border/50">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card/40 mt-12">
        <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="font-extrabold text-lg gradient-text mb-2">NEXORA</div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Le réseau social moderne pour discuter, partager et créer des communautés authentiques.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">Produit</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link to="/about" className="hover:text-foreground">À propos</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Légal</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">Confidentialité</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Conditions</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Contact</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground">Nous écrire</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nexora. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
