import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Users, Sparkles, Shield, Camera, Heart } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";

const features = [
  { icon: MessageSquare, title: "Messagerie temps réel", desc: "Discutez instantanément, partagez photos et fichiers." },
  { icon: Camera, title: "Stories & publications", desc: "Partagez vos moments, qui s'effacent ou restent." },
  { icon: Heart, title: "Réactions avancées", desc: "Exprimez plus que un simple like : amour, joie, surprise." },
  { icon: Users, title: "Communautés", desc: "Trouvez vos amis, créez des cercles authentiques." },
  { icon: Shield, title: "Confidentialité", desc: "Contrôlez précisément qui voit quoi." },
  { icon: Sparkles, title: "Interface moderne", desc: "Design épuré, fluide, pensé mobile d'abord." },
];

export default function Home() {
  const { posts } = useBlogPosts();
  const latest = posts.slice(0, 3);

  return (
    <PublicLayout
      title="Nexora — Réseau social moderne, messagerie & communautés"
      description="Nexora combine messagerie temps réel, stories, publications et communautés dans une expérience sociale moderne et respectueuse de votre vie privée."
    >
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-5">
          Nouveau · Réseau social nouvelle génération
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Connecter les gens, <span className="gradient-text">simplement</span>.
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
          Nexora est une plateforme sociale moderne qui réunit messagerie, stories, publications et communautés
          dans une expérience fluide, élégante et respectueuse de votre vie privée.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/blog"><Button size="lg">Découvrir le blog</Button></Link>
          <Link to="/about"><Button size="lg" variant="secondary">À propos</Button></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Tout ce qu'il faut pour rester connecté</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-5">
              <Icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Derniers articles</h2>
            <Link to="/blog" className="text-sm text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latest.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`}>
                <Card className="p-5 h-full hover:shadow-md transition-shadow">
                  <div className="text-xs text-primary font-semibold mb-2">{p.category}</div>
                  <h3 className="font-bold leading-snug mb-2 line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{p.summary}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Prêt à rejoindre la communauté ?</h2>
        <p className="mt-3 text-muted-foreground">Créez votre compte en 30 secondes. Gratuit, sans publicité intrusive.</p>
        <div className="mt-6">
          <Link to="/signup"><Button size="lg">Commencer maintenant</Button></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
