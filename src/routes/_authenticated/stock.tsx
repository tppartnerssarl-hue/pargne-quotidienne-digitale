import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { formaterNombre, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stock")({
  head: () => ({
    meta: [
      { title: "Stock de livrets — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Réception des livrets vierges par agence et suivi du stock disponible, attribué, actif et clôturé.",
      },
      { property: "og:title", content: "Stock de livrets" },
      {
        property: "og:description",
        content: "Réception et suivi du stock de livrets par agence.",
      },
    ],
  }),
  component: PageStock,
});

function PageStock() {
  const client = useQueryClient();
  const { profil, aRole } = useAuth();
  const peutReceptionner = aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE");
  const [idAgence, setIdAgence] = useState(profil?.id_agence ?? "");
  const [numeros, setNumeros] = useState("");

  const stock = useQuery({
    queryKey: ["stock-agence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_stock_agence").select("*").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const agences = useQuery({
    queryKey: ["agences-liste"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agence")
        .select("id_agence, nom, code")
        .eq("statut", "ACTIVE")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const listeNumeros = numeros
    .split(/[\s,;]+/)
    .map((n) => n.trim())
    .filter(Boolean);

  const receptionner = useMutation({
    mutationFn: async () => {
      if (!idAgence) throw new Error("Sélectionnez une agence de destination.");
      if (listeNumeros.length === 0) throw new Error("Saisissez au moins un numéro de livret.");
      if (listeNumeros.some((n) => n.length > 40))
        throw new Error("Un numéro de livret ne peut pas dépasser 40 caractères.");
      const { data, error } = await supabase.rpc("receptionner_livrets", {
        _id_agence: idAgence,
        _numeros: listeNumeros,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (nombre) => {
      toast.success(`${formaterNombre(nombre)} livret(s) réceptionné(s)`);
      setNumeros("");
      void client.invalidateQueries({ queryKey: ["stock-agence"] });
      void client.invalidateQueries({ queryKey: ["livrets"] });
      void client.invalidateQueries({ queryKey: ["livrets-disponibles"] });
    },
    onError: (e) => toast.error("Réception refusée", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Stock de livrets"
        description="Les livrets vierges sont enregistrés un à un pour garantir leur traçabilité."
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {peutReceptionner ? (
          <form
            className="surface-card space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!receptionner.isPending) receptionner.mutate();
            }}
          >
            <h2 className="font-semibold">Réceptionner des livrets</h2>
            <div className="space-y-1.5">
              <Label>Agence de destination</Label>
              <Select value={idAgence} onValueChange={setIdAgence}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une agence" />
                </SelectTrigger>
                <SelectContent>
                  {(agences.data ?? []).map((a) => (
                    <SelectItem key={a.id_agence} value={a.id_agence}>
                      {a.nom} ({a.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeros">Numéros de livrets</Label>
              <Textarea
                id="numeros"
                value={numeros}
                onChange={(e) => setNumeros(e.target.value)}
                rows={8}
                placeholder={"LIV-0001\nLIV-0002\nLIV-0003"}
                className="montant"
                maxLength={20000}
              />
              <p className="text-muted-foreground text-xs">
                Un numéro par ligne (séparateurs espace, virgule ou point-virgule acceptés).{" "}
                {formaterNombre(listeNumeros.length)} numéro(s) détecté(s).
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={receptionner.isPending}>
              {receptionner.isPending ? "Enregistrement…" : "Réceptionner"}
            </Button>
          </form>
        ) : null}

        <section className="surface-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Stock par agence</h2>
          {stock.isLoading ? (
            <EtatChargement />
          ) : stock.error ? (
            <div className="p-4">
              <EtatErreur erreur={stock.error} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Agence</th>
                    <th className="px-4 py-2 text-right font-medium">Reçus</th>
                    <th className="px-4 py-2 text-right font-medium">Disponibles</th>
                    <th className="px-4 py-2 text-right font-medium">Attribués</th>
                    <th className="px-4 py-2 text-right font-medium">Actifs</th>
                    <th className="px-4 py-2 text-right font-medium">Bloqués</th>
                    <th className="px-4 py-2 text-right font-medium">Clôturés</th>
                    <th className="px-4 py-2 text-right font-medium">Perdus</th>
                  </tr>
                </thead>
                <tbody>
                  {(stock.data ?? []).map((s) => (
                    <tr key={s.id_agence ?? s.code} className="border-t">
                      <td className="px-4 py-2">{s.nom}</td>
                      <td className="montant px-4 py-2 text-right">{formaterNombre(s.total_recu)}</td>
                      <td className="montant px-4 py-2 text-right font-medium">
                        {formaterNombre(s.disponible)}
                      </td>
                      <td className="montant px-4 py-2 text-right">{formaterNombre(s.attribue)}</td>
                      <td className="montant px-4 py-2 text-right">{formaterNombre(s.actif)}</td>
                      <td className="montant px-4 py-2 text-right">{formaterNombre(s.bloque)}</td>
                      <td className="montant px-4 py-2 text-right">{formaterNombre(s.cloture)}</td>
                      <td className="montant px-4 py-2 text-right">{formaterNombre(s.perdu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
