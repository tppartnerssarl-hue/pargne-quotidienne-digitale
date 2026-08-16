import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { CarteStat } from "@/components/commun/CarteStat";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterDate, formaterNombre } from "@/lib/format";
import { Percent, Coins, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/commissions")({
  head: () => ({
    meta: [
      { title: "Commissions — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Règles de commission en vigueur et commissions calculées par opération, agence et collectrice.",
      },
      { property: "og:title", content: "Commissions" },
      {
        property: "og:description",
        content: "Règles paramétrables et suivi des commissions calculées.",
      },
    ],
  }),
  component: PageCommissions,
});

function PageCommissions() {
  const config = useConfiguration();

  const donnees = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const [regles, commissions] = await Promise.all([
        supabase
          .from("regle_commission")
          .select("*")
          .order("date_debut", { ascending: false })
          .limit(50),
        supabase
          .from("commission")
          .select("id_commission, reference, date_calcul, base_calcul, montant, statut")
          .order("date_calcul", { ascending: false })
          .limit(100),
      ]);
      if (regles.error || commissions.error) throw regles.error || commissions.error;
      return { regles: regles.data ?? [], commissions: commissions.data ?? [] };
    },
  });

  if (donnees.isLoading) return <EtatChargement />;
  if (donnees.error) return <EtatErreur erreur={donnees.error} />;
  const d = donnees.data!;
  const total = d.commissions.reduce((t, c) => t + Number(c.montant), 0);

  return (
    <>
      <EnTetePage
        titre="Commissions"
        description="Les taux et montants sont paramétrables et historisés : aucune règle n'est codée en dur."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteStat
          libelle="Commissions calculées"
          valeur={formaterMontant(total, config)}
          icone={Coins}
          accent
        />
        <CarteStat
          libelle="Lignes de commission"
          valeur={formaterNombre(d.commissions.length)}
          icone={ListChecks}
        />
        <CarteStat
          libelle="Règles actives"
          valeur={formaterNombre(d.regles.filter((r) => r.actif).length)}
          icone={Percent}
        />
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Règles de commission</h2>
        {d.regles.length === 0 ? (
          <div className="p-4">
            <EtatVide
              titre="Aucune règle définie"
              description="Les règles de commission doivent être validées avec la direction avant paramétrage."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Libellé</th>
                  <th className="px-4 py-2 font-medium">Déclencheur</th>
                  <th className="px-4 py-2 font-medium">Mode</th>
                  <th className="px-4 py-2 text-right font-medium">Valeur</th>
                  <th className="px-4 py-2 font-medium">Début</th>
                </tr>
              </thead>
              <tbody>
                {d.regles.map((r) => (
                  <tr key={r.id_regle} className="border-t">
                    <td className="montant px-4 py-2">{r.code}</td>
                    <td className="px-4 py-2">{r.libelle}</td>
                    <td className="px-4 py-2">{r.code_type_declencheur ?? "—"}</td>
                    <td className="px-4 py-2">{r.mode_calcul}</td>
                    <td className="montant px-4 py-2 text-right">
                      {r.taux !== null
                        ? `${Number(r.taux) * 100} %`
                        : formaterMontant(r.montant_fixe, config)}
                    </td>
                    <td className="px-4 py-2">{formaterDate(r.date_debut, config)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-card mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Commissions calculées</h2>
        {d.commissions.length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucune commission calculée" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Référence</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 text-right font-medium">Base</th>
                  <th className="px-4 py-2 text-right font-medium">Montant</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {d.commissions.map((c) => (
                  <tr key={c.id_commission} className="border-t">
                    <td className="montant px-4 py-2">{c.reference}</td>
                    <td className="px-4 py-2">{formaterDate(c.date_calcul, config)}</td>
                    <td className="montant px-4 py-2 text-right">
                      {formaterMontant(c.base_calcul, config)}
                    </td>
                    <td className="montant px-4 py-2 text-right font-medium">
                      {formaterMontant(c.montant, config)}
                    </td>
                    <td className="px-4 py-2">{c.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
