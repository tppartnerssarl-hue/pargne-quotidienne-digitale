import { createFileRoute } from "@tanstack/react-router";
import { EnTetePage } from "@/components/commun/EnTetePage";

export const Route = createFileRoute("/_authenticated/guide")({
  head: () => ({
    meta: [
      { title: "Guide d'utilisation — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Mode d'emploi complet : connexion, rôles, collecte, vente de livret, retraits, remises de caisse, reçus imprimables et rapports.",
      },
      { property: "og:title", content: "Guide d'utilisation de la plateforme d'épargne" },
      {
        property: "og:description",
        content:
          "Toutes les procédures métier de la plateforme de gestion d'épargne quotidienne, rôle par rôle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PageGuide,
});

function Section({
  titre,
  children,
  id,
}: {
  titre: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="surface-card space-y-3 p-5">
      <h2 className="text-lg font-semibold">{titre}</h2>
      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function PageGuide() {
  return (
    <>
      <EnTetePage
        titre="Guide d'utilisation"
        description="Mode d'emploi de la plateforme, des premiers pas jusqu'aux contrôles de caisse."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Section id="demarrage" titre="1. Connexion et premiers pas">
          <p>
            Chaque utilisateur se connecte avec son adresse e-mail et son mot de passe sur la page
            de connexion. Le profil, l'agence de rattachement et les rôles sont chargés
            automatiquement : le menu de gauche n'affiche que les écrans autorisés.
          </p>
          <p>
            Le tableau de bord est la page d'accueil : collectes du jour, retraits, stock de livrets
            et situation de caisse. Les montants sont affichés dans la devise définie dans
            Paramètres.
          </p>
        </Section>

        <Section id="roles" titre="2. Rôles et responsabilités">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Administrateur</strong> : configuration complète, agences, utilisateurs,
              paramètres, audit.
            </li>
            <li>
              <strong>Direction</strong> : lecture globale, validation, rapports et commissions.
            </li>
            <li>
              <strong>Responsable d'agence</strong> : référentiel et opérations de son agence,
              réception de stock, blocage/clôture de livrets.
            </li>
            <li>
              <strong>Collectrice</strong> : vente de livrets, collectes quotidiennes de son
              portefeuille, déclaration de remise de caisse.
            </li>
            <li>
              <strong>Caissier</strong> : retraits, contrôle et validation des remises, impression
              des reçus.
            </li>
          </ul>
        </Section>

        <Section id="referentiel" titre="3. Référentiel : épargnants, livrets, stock">
          <p>
            <strong>Stock</strong> : le responsable saisit les numéros des carnets reçus ; ils
            passent en statut « En stock ».
          </p>
          <p>
            <strong>Épargnants</strong> : création de la fiche client (nom, téléphone, pièce
            d'identité). Le numéro client est généré automatiquement.
          </p>
          <p>
            <strong>Livrets</strong> : suivi du cycle de vie (en stock, actif, bloqué, clôturé,
            perdu). La fiche livret donne l'historique complet et le solde calculé.
          </p>
        </Section>

        <Section id="vente" titre="4. Vente d'un livret">
          <p>
            Écran <strong>Vente de livret</strong> : sélectionnez un livret en stock, rattachez-le à
            un épargnant de la même agence, saisissez le prix du carnet puis confirmez. Le livret
            devient actif, l'opération d'achat est enregistrée et la commission éventuelle est
            calculée selon les règles actives.
          </p>
        </Section>

        <Section id="collecte" titre="5. Collecte quotidienne">
          <p>
            Écran <strong>Collecte</strong>, optimisé mobile : recherchez le numéro de livret,
            vérifiez l'épargnant et le solde affichés, saisissez le montant, confirmez. L'opération
            est validée immédiatement et intégrée au montant de caisse attendu du jour.
          </p>
          <p>
            Une collectrice ne peut enregistrer une collecte que sur les livrets de son
            portefeuille ; la règle est appliquée côté base de données.
          </p>
        </Section>

        <Section id="retraits" titre="6. Retraits (caissier)">
          <p>
            Écran <strong>Retraits</strong> : choisissez le livret, le solde disponible s'affiche,
            saisissez le montant et confirmez. La base vérifie le solde ainsi que les montants
            minimum et maximum définis dans Paramètres ; un retrait non conforme est refusé avec un
            message explicite.
          </p>
          <p>
            Dès la validation, le <strong>reçu de retrait</strong> s'ouvre automatiquement et peut
            être imprimé pour le client.
          </p>
        </Section>

        <Section id="recus" titre="7. Impression des reçus">
          <p>
            Le bouton <strong>Imprimer</strong> est disponible sur chaque ligne de l'historique des
            retraits et des remises de caisse, ainsi qu'à la fin de chaque opération.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Cliquez sur « Imprimer » : le reçu s'affiche à l'écran.</li>
            <li>Vérifiez la référence, l'épargnant, le livret et le montant.</li>
            <li>
              Cliquez de nouveau sur « Imprimer » : seul le reçu est envoyé à l'imprimante (format
              ticket 80 mm ou feuille A4), sans les menus ni les tableaux.
            </li>
            <li>
              Faites signer le client et le caissier sur les deux emplacements prévus, puis
              conservez un exemplaire.
            </li>
          </ol>
          <p>
            Astuce : dans la fenêtre d'impression du navigateur, choisissez « Enregistrer au format
            PDF » pour archiver le reçu ou l'envoyer par message.
          </p>
        </Section>

        <Section id="caisse" titre="8. Remises de caisse">
          <p>
            La collectrice déclare le montant remis pour une date donnée ; le système calcule le
            montant attendu à partir des opérations validées non encore remises. Le caissier saisit
            le montant réellement compté puis valide : l'écart est enregistré et le reçu de remise
            peut être imprimé.
          </p>
        </Section>

        <Section id="pilotage" titre="9. Commissions, rapports et audit">
          <p>
            <strong>Commissions</strong> : règles versionnées par période, avec base de calcul et
            montant. <strong>Rapports</strong> : journal des opérations sur une période, totaux
            crédits/débits et export CSV. <strong>Audit</strong> : traçabilité immuable de toutes
            les créations et modifications sensibles.
          </p>
        </Section>

        <Section id="regles" titre="10. Règles d'or">
          <ul className="list-disc space-y-1 pl-5">
            <li>Aucune opération validée n'est supprimée : on procède par contre-passation.</li>
            <li>Les soldes sont toujours calculés, jamais saisis à la main.</li>
            <li>
              Les montants limites, le prix du carnet et la devise se règlent dans Paramètres, pas
              dans le code.
            </li>
            <li>Chaque retrait doit être accompagné d'un reçu imprimé et signé.</li>
            <li>Ne partagez jamais votre mot de passe ; chaque action est tracée à votre nom.</li>
          </ul>
        </Section>
      </div>
    </>
  );
}
