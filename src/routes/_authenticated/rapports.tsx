import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { CarteStat } from "@/components/commun/CarteStat";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterDate, debutDuMois, aujourdhui } from "@/lib/format";
import { LIBELLE_TYPE_OPERATION, TYPES_CREDIT } from "@/lib/constantes";
import { HandCoins, Banknote, Scale } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Journal des opérations sur une période, totaux par type et export CSV pour la comptabilité.",
      },
      { property: "og:title", content: "Rapports et journal des opérations" },
      {
        property: "og:description",
        content: "Analyse par période, totaux par type d'opération et export CSV.",
      },
    ],
  }),
  component: PageRapports,
});

function PageRapports() {
  const config = useConfiguration();
  const [debut, setDebut] = useState(debutDuMois());
  const [fin, setFin] = useState(aujourdhui());

  const journal = useQuery({
    queryKey: ["rapport", debut, fin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operation")
        .select("id_operation, reference, date_operation, code_type, montant, statut")
        .gte("date_operation", debut)
        .lte("date_operation", fin)
        .order("date_operation", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const ops = journal.data ?? [];
  const validees = ops.filter((o) => o.statut === "VALIDEE");
  const credits = validees
    .filter((o) => TYPES_CREDIT.includes(o.code_type))
    .reduce((t, o) => t + Number(o.montant), 0);
  const debits = validees
    .filter((o) => !TYPES_CREDIT.includes(o.code_type))
    .reduce((t, o) => t + Number(o.montant), 0);

  const parType = validees.reduce<Record<string, { nombre: number; montant: number }>>((acc, o) => {
    const cle = o.code_type;
    const courant = acc[cle] ?? { nombre: 0, montant: 0 };
    acc[cle] = { nombre: courant.nombre + 1, montant: courant.montant + Number(o.montant) };
    return acc;
  }, {});

  const exporter = () => {
    const lignes = [
      ["Reference", "Date", "Type", "Montant", "Statut"],
      ...ops.map((o) => [
        o.reference,
        o.date_operation,
        LIBELLE_TYPE_OPERATION[o.code_type] ?? o.code_type,
        String(o.montant),
        o.statut,
      ]),
    ];
    const csv = lignes
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `journal_${debut}_${fin}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <EnTetePage
        titre="Rapports"
        description="Journal des opérations sur la période sélectionnée, dans votre périmètre d'accès."
        actions={
          <Button variant="outline" onClick={exporter} disabled={ops.length === 0}>
            <Download className="mr-1 h-4 w-4" /> Exporter en CSV
          </Button>
        }
      />

      <div className="surface-card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="debut">Du</Label>
          <Input id="debut" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fin">Au</Label>
          <Input id="fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteStat
          libelle="Entrées (crédits)"
          valeur={formaterMontant(credits, config)}
          icone={HandCoins}
          accent
        />
        <CarteStat
          libelle="Sorties (débits)"
          valeur={formaterMontant(debits, config)}
          icone={Banknote}
        />
        <CarteStat
          libelle="Solde net de la période"
          valeur={formaterMontant(credits - debits, config)}
          icone={Scale}
        />
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Totaux par type d'opération</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 text-right font-medium">Nombre</th>
                <th className="px-4 py-2 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parType).map(([code, valeur]) => (
                <tr key={code} className="border-t">
                  <td className="px-4 py-2">{LIBELLE_TYPE_OPERATION[code] ?? code}</td>
                  <td className="montant px-4 py-2 text-right">{valeur.nombre}</td>
                  <td className="montant px-4 py-2 text-right">
                    {formaterMontant(valeur.montant, config)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-card mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Journal des opérations</h2>
        {journal.isLoading ? (
          <EtatChargement />
        ) : journal.error ? (
          <div className="p-4">
            <EtatErreur erreur={journal.error} />
          </div>
        ) : ops.length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucune opération sur la période" />
          </div>
        ) : (
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
                {ops.map((o) => (
                  <tr key={o.id_operation} className="border-t">
                    <td className="montant px-4 py-2">{o.reference}</td>
                    <td className="px-4 py-2">{formaterDate(o.date_operation, config)}</td>
                    <td className="px-4 py-2">
                      {LIBELLE_TYPE_OPERATION[o.code_type] ?? o.code_type}
                    </td>
                    <td className="montant px-4 py-2 text-right">
                      {formaterMontant(o.montant, config)}
                    </td>
                    <td className="px-4 py-2">{o.statut}</td>
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
