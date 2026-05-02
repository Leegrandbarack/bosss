import PublicLayout from "@/components/PublicLayout";

export default function Terms() {
  return (
    <PublicLayout
      title="Conditions d'utilisation — Nexora"
      description="Conditions générales d'utilisation de la plateforme Nexora : règles, droits et obligations."
    >
      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <h1>Conditions d'utilisation</h1>
        <p><em>Dernière mise à jour : mai 2026</em></p>

        <p>
          En accédant ou en utilisant Nexora, vous acceptez les présentes conditions.
          Lisez-les attentivement avant de créer un compte.
        </p>

        <h2>1. Accès au service</h2>
        <p>
          Nexora est accessible gratuitement. Certaines fonctionnalités nécessitent la création
          d'un compte personnel. Vous devez avoir au moins 13 ans pour vous inscrire.
        </p>

        <h2>2. Compte utilisateur</h2>
        <p>
          Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les activités
          réalisées depuis votre compte. Informez-nous immédiatement de tout accès non autorisé.
        </p>

        <h2>3. Contenu publié</h2>
        <p>Vous restez propriétaire des contenus que vous publiez. En les publiant, vous accordez à Nexora
        une licence non exclusive d'hébergement et d'affichage nécessaire au fonctionnement du service.</p>

        <h2>4. Conduite interdite</h2>
        <ul>
          <li>Harcèlement, propos haineux, incitation à la violence.</li>
          <li>Contenus à caractère sexuel impliquant des mineurs.</li>
          <li>Spam, fraude, usurpation d'identité.</li>
          <li>Diffusion de logiciels malveillants ou tentative d'intrusion.</li>
          <li>Violations de droits d'auteur ou de propriété intellectuelle.</li>
        </ul>
        <p>Toute violation peut entraîner la suspension ou la suppression définitive du compte.</p>

        <h2>5. Publicité</h2>
        <p>
          Des publicités peuvent être affichées sur les pages publiques via Google AdSense.
          Voir notre <a href="/privacy">politique de confidentialité</a> pour plus d'informations.
        </p>

        <h2>6. Limitation de responsabilité</h2>
        <p>
          Nexora est fourni « tel quel ». Nous nous efforçons de garantir un service stable mais
          ne saurions être tenus responsables d'éventuelles interruptions ou pertes de données.
        </p>

        <h2>7. Modifications</h2>
        <p>
          Ces conditions peuvent évoluer. En cas de changement majeur, nous vous notifierons.
          La poursuite de l'utilisation du service vaut acceptation.
        </p>

        <h2>8. Droit applicable</h2>
        <p>Ces conditions sont régies par le droit français. Tout litige relèvera des tribunaux compétents.</p>

        <h2>9. Contact</h2>
        <p>Pour toute question : <a href="/contact">page contact</a>.</p>
      </article>
    </PublicLayout>
  );
}
