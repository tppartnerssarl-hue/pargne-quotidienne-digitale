import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookMarked,
  HandCoins,
  Banknote,
  Boxes,
  Wallet,
  TriangleAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { CarteStat } from "@/components/commun/CarteStat";
import { EtatChargement, EtatErreur } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterNombre, aujourdhui, debutDuMois } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Indicateurs du jour et du mois : collectes, retraits, livrets, stock et situation de caisse.",
      },
      { property: "og:title", content: "Tableau de bord — Épargne quotidienne" },
      {
        property: "og:description",
        content: "Collectes, retraits, livrets et caisse en un coup d'œil.",
      },
    ],
  }),
  component: PageTableauDeBord,
});

function PageTableauDeBord() {
  const { profil, roles, aRole } = useAuth();
  const config = useConfiguration();
  const jour = aujourdhui();
  const debut = debutDuMois();

  const requete = useQuery({
    queryKey: ["tableau-de-bord", profil?.id_utilisateur, roles.join(",")],
    enabled: Boolean(profil),
    queryFn: async () => {
      const [epargnants, livrets, stock, operations, remises] = await Promise.all([
        supabase.from("epargnant").select("id_epargnant", { count: "exact", head: true }),
        supabase.from("livret").select("statut"),
        supabase.from("v_stock_agence").select("*"),
        supabase
          .from("operation")
          .select("code_type, montant, date_operation, statut")
          .gte("date_operation", debut)
          .eq("statut", "VALIDEE"),
        supabase.from("remise_caisse").select("statut, ecart, montant_declare"),
      ]);

      const erreur =
        epargnants.error || livrets.error || stock.error || operations.error || remises.error;
      if (erreur) throw erreur;

      const ops = operations.data ?? [];
      const somme = (type: string, duJour: boolean) =>
        ops
          .filter((o) => o.code_type === type && (!duJour || o.date_operation === jour))
          .reduce((t, o) => t + Number(o.montant), 0);

      const parStatut = (statut: string) =>
        (livrets.data ?? []).filter((l) => l.statut === statut).length;

      return {
        nbEpargnants: epargnants.count ?? 0,
        nbLivrets: (livrets.data ?? []).length,
        disponibles: parStatut("EN_STOCK"),
        actifs: parStatut("ACTIF"),
        collecteJour: somme("COLLECTE", true),
        collecteMois: somme("COLLECTE", false),
        retraitJour: somme("RETRAIT", true),
        retraitMois: somme("RETRAIT", false),
        venteMois: somme("ACHAT_CARNET", false),
        stock: stock.data ?? [],
        remisesEnAttente: (remises.data ?? []).filter((r) => r.statut !== "VALIDEE").length,
        ecartTotal: (remises.data ?? [])
          .filter((r) => r.statut === "VALIDEE")
          .reduce((t, r) => t + Number(r.ecart ?? 0), 0),
      };
    },
  });

  if (!profil) {
    return (
      <div className="surface-card p-6">
        <h2 className="font-semibold">Compte non rattaché</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Votre compte de connexion n'est rattaché à aucun profil utilisateur. Contactez un
          administrateur pour qu'il crée votre profil avec votre adresse email.
        </p>
      </div>
    );
  }

  if (requete.isLoading) return <EtatChargement />;
  if (requete.error) return <EtatErreur erreur={requete.error} />;
  const d = requete.data!;

  return (
    <>
      <EnTetePage
        titre={`Bonjour ${profil.prenom || profil.nom}`}
        description={
          profil.agence
            ? `${profil.agence.nom} — données du ${new Date().toLocaleDateString("fr-FR")}`
            : "Vue consolidée de toutes les agences"
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CarteStat
          libelle="Collectes du jour"
          valeur={formaterMontant(d.collecteJour, config)}
          detail={`Mois : ${formaterMontant(d.collecteMois, config)}`}
          icone={HandCoins}
          accent
        />
        <CarteStat
          libelle="Retraits du jour"
          valeur={formaterMontant(d.retraitJour, config)}
          detail={`Mois : ${formaterMontant(d.retraitMois, config)}`}
          icone={Banknote}
        />
        <CarteStat
          libelle="Épargnants"
          valeur={formaterNombre(d.nbEpargnants)}
          detail={`${formaterNombre(d.actifs)} livrets actifs`}
          icone={Users}
        />
        <CarteStat
          libelle="Livrets disponibles"
          valeur={formaterNombre(d.disponibles)}
          detail={`${formaterNombre(d.nbLivrets)} livrets au total`}
          icone={Boxes}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <CarteStat
          libelle="Ventes de carnets (mois)"
          valeur={formaterMontant(d.venteMois, config)}
          icone={BookMarked}
        />
        <CarteStat
          libelle="Remises à contrôler"
          valeur={formaterNombre(d.remisesEnAttente)}
          detail="Remises déclarées non encore validées"
          icone={Wallet}
        />
        <CarteStat
          libelle="Écart de caisse cumulé"
          valeur={formaterMontant(d.ecartTotal, config)}
          detail="Sur les remises validées"
          icone={TriangleAlert}
        />
      </div>

      {aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE") ? (
        <section className="surface-card mt-6 overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Stock de livrets par agence</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Agence</th>
                  <th className="px-4 py-2 text-right font-medium">Reçus</th>
                  <th className="px-4 py-2 text-right font-medium">Disponibles</th>
                  <th className="px-4 py-2 text-right font-medium">Actifs</th>
                  <th className="px-4 py-2 text-right font-medium">Bloqués</th>
                  <th className="px-4 py-2 text-right font-medium">Clôturés</th>
                </tr>
              </thead>
              <tbody>
                {d.stock.map((s: Record<string, unknown>) => (
                  <tr key={String(s['id_agence'])} className="border-t">
                    <td className="px-4 py-2">{String(s['nom'])}</td>
                    <td className="montant px-4 py-2 text-right">{String(s['total_recu'])}</td>
                    <td className="montant px-4 py-2 text-right">{String(s['disponible'])}</td>
                    <td className="montant px-4 py-2 text-right">{String(s['actif'])}</td>
                    <td className="montant px-4 py-2 text-right">{String(s['bloque'])}</td>
                    <td className="montant px-4 py-2 text-right">{String(s['cloture'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
