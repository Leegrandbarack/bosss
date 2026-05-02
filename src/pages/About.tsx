import PublicLayout from "@/components/PublicLayout";

export default function About() {
  return (
    <PublicLayout
      title="À propos de Nexora — Notre mission"
      description="Découvrez la mission de Nexora : créer un réseau social moderne, éthique et respectueux de la vie privée pour reconnecter les gens authentiquement."
    >
      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <h1>À propos de Nexora</h1>
        <p className="lead text-lg text-muted-foreground">
          Nexora est né d'une conviction simple : le web social peut redevenir un espace de qualité,
          centré sur les vraies conversations plutôt que sur l'attention captive.
        </p>

        <h2>Notre mission</h2>
        <p>
          Offrir une plateforme sociale moderne, rapide et respectueuse, qui remet l'utilisateur au centre.
          Pas d'algorithme opaque, pas de publicité intrusive, pas de course à l'engagement à tout prix.
        </p>

        <h2>Nos valeurs</h2>
        <ul>
          <li><strong>Confidentialité par défaut</strong> — vous contrôlez vos données et leur visibilité.</li>
          <li><strong>Transparence</strong> — fonctionnalités claires, règles compréhensibles.</li>
          <li><strong>Qualité</strong> — moins de notifications, plus de moments qui comptent.</li>
          <li><strong>Accessibilité</strong> — pensé mobile d'abord, performant partout.</li>
        </ul>

        <h2>L'équipe</h2>
        <p>
          Nexora est porté par une équipe passionnée de développeurs, designers et community managers
          répartis dans plusieurs pays francophones. Nous construisons en écoutant nos utilisateurs.
        </p>

        <h2>Vous voulez en savoir plus ?</h2>
        <p>
          Rendez-vous sur notre <a href="/blog">blog</a> pour suivre nos actualités, ou contactez-nous
          via la <a href="/contact">page contact</a>.
        </p>
      </article>
    </PublicLayout>
  );
}
