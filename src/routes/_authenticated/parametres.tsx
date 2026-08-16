import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur } from "@/components/commun/Etats";
import { messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Réglages métier : prix du carnet, devise, plafonds de retrait et règles de validation des opérations.",
      },
      { property: "og:title", content: "Paramètres de l'application" },
      { property: "og:description", content: "Prix du carnet, devise et règles de validation." },
    ],
  }),
  component: PageParametres,
});

function PageParametres() {
  const client = useQueryClient();
  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  const liste = useQuery({
    queryKey: ["parametres-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametre").select("*").order("cle");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (liste.data) {
      setValeurs(Object.fromEntries(liste.data.map((p) => [p.cle, p.valeur ?? ""])));
    }
  }, [liste.data]);

  const enregistrer = useMutation({
    mutationFn: async () => {
      const modifies = (liste.data ?? []).filter((p) => (p.valeur ?? "") !== (valeurs[p.cle] ?? ""));
      for (const p of modifies) {
        const { error } = await supabase
          .from("parametre")
          .update({ valeur: valeurs[p.cle] ?? null })
          .eq("cle", p.cle);
        if (error) throw error;
      }
      return modifies.length;
    },
    onSuccess: (n) => {
      toast.success(n === 0 ? "Aucune modification" : `${n} paramètre(s) enregistré(s)`);
      void client.invalidateQueries({ queryKey: ["parametres-admin"] });
      void client.invalidateQueries({ queryKey: ["configuration"] });
    },
    onError: (e) => toast.error("Enregistrement refusé", { description: messageErreur(e) }),
  });

  if (liste.isLoading) return <EtatChargement />;
  if (liste.error) return <EtatErreur erreur={liste.error} />;

  return (
    <>
      <EnTetePage
        titre="Paramètres"
        description="Ces réglages s'appliquent immédiatement à l'ensemble des agences."
        actions={
          <Button onClick={() => enregistrer.mutate()} disabled={enregistrer.isPending}>
            {enregistrer.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        }
      />

      <div className="surface-card divide-y">
        {(liste.data ?? []).map((p) => (
          <div key={p.cle} className="grid gap-2 p-4 sm:grid-cols-[1fr_260px] sm:items-center">
            <div>
              <Label htmlFor={`p-${p.cle}`}>{p.libelle}</Label>
              <p className="text-muted-foreground montant mt-0.5 text-xs">{p.cle}</p>
            </div>
            {p.type_valeur === "BOOLEEN" ? (
              <select
                id={`p-${p.cle}`}
                className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                value={valeurs[p.cle] ?? "false"}
                onChange={(e) => setValeurs({ ...valeurs, [p.cle]: e.target.value })}
              >
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            ) : (
              <Input
                id={`p-${p.cle}`}
                type={p.type_valeur === "NOMBRE" ? "number" : "text"}
                value={valeurs[p.cle] ?? ""}
                onChange={(e) => setValeurs({ ...valeurs, [p.cle]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
