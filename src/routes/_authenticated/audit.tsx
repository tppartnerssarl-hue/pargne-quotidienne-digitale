import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterDateHeure } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Journal d'audit — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Traçabilité complète : chaque création, modification ou validation est journalisée et consultable.",
      },
      { property: "og:title", content: "Journal d'audit" },
      {
        property: "og:description",
        content: "Historique horodaté des actions réalisées dans l'application.",
      },
    ],
  }),
  component: PageAudit,
});

function PageAudit() {
  const config = useConfiguration();
  const [filtre, setFiltre] = useState("");

  const journal = useQuery({
    queryKey: ["audit", filtre],
    queryFn: async () => {
      let requete = supabase
        .from("audit")
        .select("id_audit, date_action, action, table_cible, id_cible, id_utilisateur")
        .order("date_action", { ascending: false })
        .limit(300);
      if (filtre.trim()) requete = requete.ilike("table_cible", `%${filtre.trim()}%`);
      const { data, error } = await requete;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <EnTetePage
        titre="Journal d'audit"
        description="Les entrées d'audit ne peuvent être ni modifiées ni supprimées."
      />

      <div className="surface-card mb-4 p-4">
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="filtre-audit">Filtrer par table</Label>
          <Input
            id="filtre-audit"
            placeholder="operation, livret…"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            maxLength={50}
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {journal.isLoading ? (
          <EtatChargement />
        ) : journal.error ? (
          <div className="p-4">
            <EtatErreur erreur={journal.error} />
          </div>
        ) : (journal.data ?? []).length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucune entrée d'audit" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Table</th>
                  <th className="px-4 py-2 font-medium">Enregistrement</th>
                </tr>
              </thead>
              <tbody>
                {(journal.data ?? []).map((a) => (
                  <tr key={a.id_audit} className="border-t">
                    <td className="px-4 py-2">{formaterDateHeure(a.date_action, config)}</td>
                    <td className="px-4 py-2">{a.action}</td>
                    <td className="px-4 py-2">{a.table_cible}</td>
                    <td className="montant text-muted-foreground px-4 py-2 text-xs">
                      {a.id_cible ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
