import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatVide } from "@/components/commun/Etats";
import { StatutLivret } from "@/components/commun/Badges";

export const Route = createFileRoute("/_authenticated/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche globale — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Recherche transverse sur les épargnants, les livrets et les références d'opérations.",
      },
      { property: "og:title", content: "Recherche globale" },
      {
        property: "og:description",
        content: "Retrouvez un épargnant, un livret ou une opération en une seule recherche.",
      },
    ],
  }),
  component: PageRecherche,
});

function PageRecherche() {
  const [saisie, setSaisie] = useState("");
  const [terme, setTerme] = useState("");

  const resultats = useQuery({
    queryKey: ["recherche-globale", terme],
    enabled: terme.length >= 2,
    queryFn: async () => {
      const [epargnants, livrets, operations] = await Promise.all([
        supabase
          .from("epargnant")
          .select("id_epargnant, nom, prenom, numero_client")
          .or(`nom.ilike.%${terme}%,prenom.ilike.%${terme}%,numero_client.ilike.%${terme}%`)
          .limit(10),
        supabase
          .from("livret")
          .select("id_livret, numero_livret, statut")
          .ilike("numero_livret", `%${terme}%`)
          .limit(10),
        supabase
          .from("operation")
          .select("id_operation, reference, montant, code_type, id_livret")
          .ilike("reference", `%${terme}%`)
          .limit(10),
      ]);
      const erreur = epargnants.error || livrets.error || operations.error;
      if (erreur) throw erreur;
      return {
        epargnants: epargnants.data ?? [],
        livrets: livrets.data ?? [],
        operations: operations.data ?? [],
      };
    },
  });

  const vide =
    resultats.data &&
    resultats.data.epargnants.length === 0 &&
    resultats.data.livrets.length === 0 &&
    resultats.data.operations.length === 0;

  return (
    <>
      <EnTetePage
        titre="Recherche globale"
        description="Épargnants, livrets et références d'opérations, dans le périmètre autorisé par votre rôle."
      />

      <form
        className="surface-card flex gap-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTerme(saisie.trim());
        }}
      >
        <Input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Nom, numéro client, numéro de livret ou référence"
          maxLength={60}
          autoFocus
        />
        <Button type="submit">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {terme.length < 2 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Saisissez au moins 2 caractères pour lancer la recherche.
        </p>
      ) : resultats.isFetching ? (
        <p className="text-muted-foreground mt-4 text-sm">Recherche en cours…</p>
      ) : vide ? (
        <div className="mt-4">
          <EtatVide titre="Aucun résultat" description="Aucun élément ne correspond à ce terme." />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="surface-card p-4">
            <h2 className="text-sm font-semibold">Épargnants</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {(resultats.data?.epargnants ?? []).map((e) => (
                <li key={e.id_epargnant}>
                  <Link
                    to="/epargnants/$id"
                    params={{ id: e.id_epargnant }}
                    className="hover:underline"
                  >
                    {e.nom} {e.prenom}{" "}
                    <span className="text-muted-foreground montant">{e.numero_client}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-4">
            <h2 className="text-sm font-semibold">Livrets</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {(resultats.data?.livrets ?? []).map((l) => (
                <li key={l.id_livret} className="flex items-center justify-between gap-2">
                  <Link
                    to="/livrets/$id"
                    params={{ id: l.id_livret }}
                    className="montant hover:underline"
                  >
                    {l.numero_livret}
                  </Link>
                  <StatutLivret statut={l.statut} />
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-4">
            <h2 className="text-sm font-semibold">Opérations</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {(resultats.data?.operations ?? []).map((o) => (
                <li key={o.id_operation} className="montant">
                  {o.reference}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
