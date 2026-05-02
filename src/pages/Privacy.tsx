import PublicLayout from "@/components/PublicLayout";

export default function Privacy() {
  return (
    <PublicLayout
      title="Politique de confidentialité — Nexora"
      description="Comment Nexora collecte, utilise et protège vos données personnelles. Politique de confidentialité complète."
    >
      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <h1>Politique de confidentialité</h1>
        <p><em>Dernière mise à jour : mai 2026</em></p>

        <p>
          Chez Nexora, nous prenons très au sérieux la protection de vos données personnelles.
          Cette politique explique quelles informations nous collectons, comment nous les utilisons,
          et les droits dont vous disposez.
        </p>

        <h2>1. Données collectées</h2>
        <ul>
          <li><strong>Données de compte</strong> : nom, email, numéro de téléphone, mot de passe (chiffré).</li>
          <li><strong>Données de profil</strong> : photo, bio, ville, école, profession (optionnels).</li>
          <li><strong>Contenu publié</strong> : publications, messages, stories, commentaires.</li>
          <li><strong>Données techniques</strong> : adresse IP, type de navigateur, journalisation.</li>
        </ul>

        <h2>2. Utilisation des données</h2>
        <p>Vos données servent uniquement à :</p>
        <ul>
          <li>fournir et améliorer le service ;</li>
          <li>sécuriser votre compte (détection de fraude) ;</li>
          <li>vous notifier des activités importantes ;</li>
          <li>respecter nos obligations légales.</li>
        </ul>

        <h2>3. Publicité (Google AdSense)</h2>
        <p>
          Nous utilisons Google AdSense pour afficher des publicités sur certaines pages publiques.
          Google peut utiliser des cookies pour personnaliser les annonces selon vos visites précédentes.
          Vous pouvez désactiver la publicité personnalisée via les
          <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank"> paramètres d'annonces Google</a>.
        </p>

        <h2>4. Partage des données</h2>
        <p>
          Nous ne vendons jamais vos données. Elles ne sont partagées qu'avec nos sous-traitants techniques
          (hébergement, analyse) liés par contrat, ou si la loi nous y oblige.
        </p>

        <h2>5. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression,
          d'opposition et de portabilité. Pour les exercer, contactez-nous à
          <strong> contact@nexora.app</strong>.
        </p>

        <h2>6. Cookies</h2>
        <p>
          Nexora utilise des cookies essentiels au fonctionnement (session, préférences) et
          des cookies publicitaires (AdSense) sur les pages publiques.
        </p>

        <h2>7. Sécurité</h2>
        <p>
          Vos mots de passe sont chiffrés. Toutes les communications passent par HTTPS. Nous appliquons
          des règles strictes de contrôle d'accès côté base de données.
        </p>

        <h2>8. Contact</h2>
        <p>Pour toute question : <a href="/contact">page contact</a> ou contact@nexora.app.</p>
      </article>
    </PublicLayout>
  );
}
