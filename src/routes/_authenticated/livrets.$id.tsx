import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { StatutLivret, StatutOperation } from "@/components/commun/Badges";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterDate, formaterDateHeure, messageErreur } from "@/lib/format";
import { LIBELLE_TYPE_OPERATION } from "@/lib/constantes";

export const Route = createFileRoute("/_authenticated/livrets/$id")({
  head: () => ({
    meta: [
      { title: "Détail d'un livret — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Solde, historique des opérations et journal des mouvements de statut d'un livret d'épargne.",
      },
      { property: "og:title", content: "Détail d'un livret d'épargne" },
      {
        property: "og:description",
        content: "Solde courant, opérations et cycle de vie du livret.",
      },
    ],
  }),
  component: PageLivret,
  errorComponent: ({ error }) => (
    <div className="p-4">
      <EtatErreur erreur={error} />
    </div>
  ),
  notFoundComponent: () => <EtatVide titre="Livret introuvable" />,
});

function PageLivret() {
  const { id } = Route.useParams();
  const config = useConfiguration();
  const client = useQueryClient();
  const { aRole } = useAuth();
  const peutBloquer = aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE");

  const fiche = useQuery({
    queryKey: ["livret", id],
    queryFn: async () => {
      const [livret, solde, operations, mouvements] = await Promise.all([
        supabase
          .from("livret")
          .select("*, epargnant:epargnant(id_epargnant, nom, prenom, numero_client), agence:agence(nom)")
          .eq("id_livret", id)
          .maybeSingle(),
        supabase.from("v_solde_livret").select("*").eq("id_livret", id).maybeSingle(),
        supabase
          .from("operation")
          .select("id_operation, reference, date_operation, montant, code_type, statut")
          .eq("id_livret", id)
          .order("date_operation", { ascending: false })
          .limit(100),
        supabase
          .from("mouvement_livret")
          .select("id_mouvement, date_mouvement, type_mouvement, statut_avant, statut_apres, commentaire")
          .eq("id_livret", id)
          .order("date_mouvement", { ascending: false })
          .limit(30),
      ]);
      const erreur = livret.error || solde.error || operations.error || mouvements.error;
      if (erreur) throw erreur;
      return {
        livret: livret.data,
        solde: solde.data,
        operations: operations.data ?? [],
        mouvements: mouvements.data ?? [],
      };
    },
  });

  const changerStatut = useMutation({
    mutationFn: async (statut: string) => {
      const { error } = await supabase.rpc("changer_statut_livret", {
        _id_livret: id,
        _statut: statut,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut du livret mis à jour");
      void client.invalidateQueries({ queryKey: ["livret", id] });
      void client.invalidateQueries({ queryKey: ["livrets"] });
    },
    onError: (e) => toast.error("Changement refusé", { description: messageErreur(e) }),
  });

  if (fiche.isLoading) return <EtatChargement />;
  if (fiche.error) return <EtatErreur erreur={fiche.error} />;
  const d = fiche.data!;
  if (!d.livret) return <EtatVide titre="Livret introuvable" />;
  const epargnant = d.livret.epargnant as {
    id_epargnant: string;
    nom: string;
    prenom: string;
    numero_client: string;
  } | null;

  return (
    <>
      <Link
        to="/livrets"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux livrets
      </Link>

      <EnTetePage
        titre={`Livret ${d.livret.numero_livret}`}
        description={
          epargnant
            ? `${epargnant.nom} ${epargnant.prenom} · ${epargnant.numero_client}`
            : "Livret non attribué"
        }
        actions={
          peutBloquer ? (
            <>
              {d.livret.statut === "ACTIF" ? (
                <Button
                  variant="outline"
                  disabled={changerStatut.isPending}
                  onClick={() => changerStatut.mutate("BLOQUE")}
                >
                  Bloquer
                </Button>
              ) : null}
              {d.livret.statut === "BLOQUE" ? (
                <Button
                  variant="outline"
                  disabled={changerStatut.isPending}
                  onClick={() => changerStatut.mutate("ACTIF")}
                >
                  Débloquer
                </Button>
              ) : null}
              {d.livret.statut === "ACTIF" || d.livret.statut === "BLOQUE" ? (
                <Button
                  variant="destructive"
                  disabled={changerStatut.isPending}
                  onClick={() => changerStatut.mutate("CLOTURE")}
                >
                  Clôturer
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Solde</p>
          <p className="montant text-2xl font-semibold">
            {formaterMontant(d.solde?.solde ?? 0, config)}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Total crédité</p>
          <p className="montant text-lg font-medium">
            {formaterMontant(d.solde?.total_credit ?? 0, config)}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Total débité</p>
          <p className="montant text-lg font-medium">
            {formaterMontant(d.solde?.total_debit ?? 0, config)}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Statut</p>
          <div className="mt-1">
            <StatutLivret statut={d.livret.statut} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="surface-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Opérations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Référence</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 text-right font-medium">Montant</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {d.operations.map((o) => (
                  <tr key={o.id_operation} className="border-t">
                    <td className="montant px-4 py-2">{o.reference}</td>
                    <td className="px-4 py-2">{formaterDate(o.date_operation, config)}</td>
                    <td className="px-4 py-2">
                      {LIBELLE_TYPE_OPERATION[o.code_type] ?? o.code_type}
                    </td>
                    <td className="montant px-4 py-2 text-right">
                      {formaterMontant(o.montant, config)}
                    </td>
                    <td className="px-4 py-2">
                      <StatutOperation statut={o.statut} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.operations.length === 0 ? (
            <div className="p-4">
              <EtatVide titre="Aucune opération" />
            </div>
          ) : null}
        </section>

        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold">Cycle de vie</h2>
          <ol className="mt-3 space-y-3 text-sm">
            {d.mouvements.map((m) => (
              <li key={m.id_mouvement} className="border-border border-l-2 pl-3">
                <p className="font-medium">{m.type_mouvement}</p>
                <p className="text-muted-foreground text-xs">
                  {m.statut_avant ? `${m.statut_avant} → ` : ""}
                  {m.statut_apres} · {formaterDateHeure(m.date_mouvement, config)}
                </p>
                {m.commentaire ? (
                  <p className="text-muted-foreground text-xs">{m.commentaire}</p>
                ) : null}
              </li>
            ))}
          </ol>
          {d.mouvements.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">Aucun mouvement enregistré.</p>
          ) : null}
        </section>
      </div>
    </>
  );
}
