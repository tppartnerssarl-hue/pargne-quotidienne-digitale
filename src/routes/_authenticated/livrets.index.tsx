import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { StatutLivret } from "@/components/commun/Badges";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterDate } from "@/lib/format";
import { LIBELLE_STATUT_LIVRET } from "@/lib/constantes";

export const Route = createFileRoute("/_authenticated/livrets/")({
  head: () => ({
    meta: [
      { title: "Livrets — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Suivi du parc de livrets : numéro, titulaire, statut et dates clés du cycle de vie.",
      },
      { property: "og:title", content: "Parc de livrets" },
      { property: "og:description", content: "Suivi du cycle de vie des livrets d'épargne." },
    ],
  }),
  component: PageLivrets,
});

const STATUTS = Object.keys(LIBELLE_STATUT_LIVRET);

function PageLivrets() {
  const config = useConfiguration();
  const [terme, setTerme] = useState("");
  const [statut, setStatut] = useState("TOUS");

  const liste = useQuery({
    queryKey: ["livrets", terme, statut],
    queryFn: async () => {
      let requete = supabase
        .from("livret")
        .select(
          "id_livret, numero_livret, statut, date_reception, date_activation, epargnant:epargnant(nom, prenom, numero_client)",
        )
        .order("numero_livret")
        .limit(150);
      if (statut !== "TOUS") requete = requete.eq("statut", statut);
      const t = terme.trim();
      if (t.length >= 2) requete = requete.ilike("numero_livret", `%${t}%`);
      const { data, error } = await requete;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <EnTetePage
        titre="Livrets"
        description="Chaque livret est unique et suit un cycle de vie contrôlé par la base."
      />

      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
          <Input
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Rechercher un numéro de livret"
            maxLength={60}
          />
          <Select value={statut} onValueChange={setStatut}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOUS">Tous les statuts</SelectItem>
              {STATUTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {LIBELLE_STATUT_LIVRET[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {liste.isLoading ? (
          <EtatChargement />
        ) : liste.error ? (
          <div className="p-4">
            <EtatErreur erreur={liste.error} />
          </div>
        ) : (liste.data ?? []).length === 0 ? (
          <div className="p-4">
            <EtatVide
              titre="Aucun livret"
              description="Réceptionnez des livrets depuis la page Stock pour alimenter le parc."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Numéro</th>
                  <th className="px-4 py-2 font-medium">Titulaire</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Réception</th>
                  <th className="px-4 py-2 font-medium">Activation</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(liste.data ?? []).map((l) => {
                  const e = l.epargnant as {
                    nom: string;
                    prenom: string;
                    numero_client: string;
                  } | null;
                  return (
                    <tr key={l.id_livret} className="border-t">
                      <td className="montant px-4 py-2">{l.numero_livret}</td>
                      <td className="px-4 py-2">
                        {e ? `${e.nom} ${e.prenom} · ${e.numero_client}` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <StatutLivret statut={l.statut} />
                      </td>
                      <td className="px-4 py-2">{formaterDate(l.date_reception, config)}</td>
                      <td className="px-4 py-2">{formaterDate(l.date_activation, config)}</td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          to="/livrets/$id"
                          params={{ id: l.id_livret }}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Détail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
