import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { StatutLivret, StatutOperation } from "@/components/commun/Badges";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterDate } from "@/lib/format";
import { LIBELLE_TYPE_OPERATION } from "@/lib/constantes";

export const Route = createFileRoute("/_authenticated/epargnants/$id")({
  head: () => ({
    meta: [
      { title: "Situation d'un épargnant — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Fiche épargnant : livrets rattachés, solde progressif et historique complet des opérations.",
      },
      { property: "og:title", content: "Situation individuelle d'un épargnant" },
      {
        property: "og:description",
        content: "Livrets, soldes et historique détaillé des opérations d'un épargnant.",
      },
    ],
  }),
  component: PageFicheEpargnant,
  errorComponent: ({ error }) => (
    <div className="p-4">
      <EtatErreur erreur={error} />
    </div>
  ),
  notFoundComponent: () => <EtatVide titre="Épargnant introuvable" />,
});

function PageFicheEpargnant() {
  const { id } = Route.useParams();
  const config = useConfiguration();

  const fiche = useQuery({
    queryKey: ["epargnant", id],
    queryFn: async () => {
      const [epargnant, livrets, soldes, situation] = await Promise.all([
        supabase
          .from("epargnant")
          .select("*, agence:agence(nom, code)")
          .eq("id_epargnant", id)
          .maybeSingle(),
        supabase
          .from("livret")
          .select("id_livret, numero_livret, statut, date_activation")
          .eq("id_epargnant", id),
        supabase.from("v_solde_livret").select("id_livret, solde").eq("id_epargnant", id),
        supabase
          .from("v_situation_individuelle")
          .select("*")
          .eq("id_epargnant", id)
          .order("date_operation", { ascending: false })
          .limit(100),
      ]);
      const erreur = epargnant.error || livrets.error || soldes.error || situation.error;
      if (erreur) throw erreur;
      return {
        epargnant: epargnant.data,
        livrets: livrets.data ?? [],
        soldes: soldes.data ?? [],
        situation: situation.data ?? [],
      };
    },
  });

  if (fiche.isLoading) return <EtatChargement />;
  if (fiche.error) return <EtatErreur erreur={fiche.error} />;
  const d = fiche.data!;
  if (!d.epargnant) return <EtatVide titre="Épargnant introuvable" />;

  const total = d.soldes.reduce((t, s) => t + Number(s.solde ?? 0), 0);

  return (
    <>
      <Link
        to="/epargnants"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au répertoire
      </Link>

      <EnTetePage
        titre={`${d.epargnant.nom} ${d.epargnant.prenom}`}
        description={`N° client ${d.epargnant.numero_client} · ${
          d.epargnant.telephone ?? "téléphone non renseigné"
        }`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Épargne totale</p>
          <p className="montant text-2xl font-semibold">{formaterMontant(total, config)}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Livrets</p>
          <p className="text-2xl font-semibold">{d.livrets.length}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Agence</p>
          <p className="text-lg font-medium">
            {(d.epargnant.agence as { nom: string } | null)?.nom ?? "—"}
          </p>
        </div>
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Livrets rattachés</h2>
        {d.livrets.length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucun livret" description="Attribuez un livret depuis la page Vente." />
          </div>
        ) : (
          <ul className="divide-y">
            {d.livrets.map((l) => (
              <li key={l.id_livret} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <Link
                    to="/livrets/$id"
                    params={{ id: l.id_livret }}
                    className="montant font-medium hover:underline"
                  >
                    {l.numero_livret}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    Activé le {formaterDate(l.date_activation, config)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatutLivret statut={l.statut} />
                  <span className="montant font-medium">
                    {formaterMontant(
                      d.soldes.find((s) => s.id_livret === l.id_livret)?.solde ?? 0,
                      config,
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">
          Situation individuelle (solde progressif)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Livret</th>
                <th className="px-4 py-2 font-medium">Opération</th>
                <th className="px-4 py-2 text-right font-medium">Crédit</th>
                <th className="px-4 py-2 text-right font-medium">Débit</th>
                <th className="px-4 py-2 text-right font-medium">Solde</th>
              </tr>
            </thead>
            <tbody>
              {d.situation.map((o) => (
                <tr key={o.id_operation} className="border-t">
                  <td className="px-4 py-2">{formaterDate(o.date_operation, config)}</td>
                  <td className="montant px-4 py-2">{o.numero_livret}</td>
                  <td className="px-4 py-2">
                    {LIBELLE_TYPE_OPERATION[o.code_type ?? ""] ?? o.libelle_type}
                  </td>
                  <td className="montant text-success px-4 py-2 text-right">
                    {Number(o.montant_credit ?? 0) > 0
                      ? formaterMontant(o.montant_credit, config)
                      : "—"}
                  </td>
                  <td className="montant text-destructive px-4 py-2 text-right">
                    {Number(o.montant_debit ?? 0) > 0
                      ? formaterMontant(o.montant_debit, config)
                      : "—"}
                  </td>
                  <td className="montant px-4 py-2 text-right font-medium">
                    {formaterMontant(o.solde_progressif, config)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d.situation.length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucune opération enregistrée" />
          </div>
        ) : null}
      </section>
    </>
  );
}

export { StatutOperation };
