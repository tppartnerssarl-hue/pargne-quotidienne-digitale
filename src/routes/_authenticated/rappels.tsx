import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/rappels")({
  head: () => ({
    meta: [
      { title: "Rappels de collecte — Épargne quotidienne" },
      {
        name: "description",
        content: "Épargnants actifs sans collecte depuis plusieurs jours, à relancer en priorité.",
      },
      { property: "og:title", content: "Rappels de collecte" },
      { property: "og:description", content: "Liste des épargnants sans collecte récente." },
    ],
  }),
  component: PageRappels,
});

function PageRappels() {
  const config = useConfiguration();
  const [jours, setJours] = useState("3");
  const seuil = Math.max(1, Math.min(90, Number(jours) || 3));

  const rappels = useQuery({
    queryKey: ["rappels-collecte", seuil],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("epargnants_sans_collecte", { _jours: seuil });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <EnTetePage
        titre="Rappels de collecte"
        description="Épargnants actifs dont la dernière collecte remonte au-delà du seuil choisi — ou qui n'ont jamais eu de collecte."
      />

      <div className="surface-card mb-4 flex max-w-xs flex-col gap-1.5 p-4">
        <Label htmlFor="seuil-jours">Seuil de rappel (jours sans collecte)</Label>
        <Input
          id="seuil-jours"
          type="number"
          min={1}
          max={90}
          value={jours}
          onChange={(e) => setJours(e.target.value)}
        />
      </div>

      <section className="surface-card overflow-hidden">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">
          <BellRing className="mr-2 inline size-4" />
          {(rappels.data ?? []).length} épargnant(s) à relancer
        </h2>
        {rappels.isLoading ? (
          <EtatChargement />
        ) : rappels.error ? (
          <div className="p-4">
            <EtatErreur erreur={rappels.error} />
          </div>
        ) : (rappels.data ?? []).length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucun rappel" description="Tous les épargnants actifs ont eu une collecte récente." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">N° client</th>
                  <th className="px-4 py-2 font-medium">Épargnant</th>
                  <th className="px-4 py-2 font-medium">Téléphone</th>
                  <th className="px-4 py-2 font-medium">Dernière collecte</th>
                  <th className="px-4 py-2 text-right font-medium">Jours écoulés</th>
                </tr>
              </thead>
              <tbody>
                {(rappels.data ?? []).map((r) => (
                  <tr key={r.id_epargnant} className="border-t">
                    <td className="montant px-4 py-2">
                      <Link
                        to="/epargnants/$id"
                        params={{ id: r.id_epargnant }}
                        className="text-primary hover:underline"
                      >
                        {r.numero_client}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {r.prenom} {r.nom}
                    </td>
                    <td className="px-4 py-2">{r.telephone}</td>
                    <td className="px-4 py-2">
                      {r.derniere_collecte ? formaterDate(r.derniere_collecte, config) : "Jamais"}
                    </td>
                    <td className="montant px-4 py-2 text-right font-medium">
                      {r.jours_sans_collecte ?? "—"}
                    </td>
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
