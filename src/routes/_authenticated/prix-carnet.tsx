import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { CarteStat } from "@/components/commun/CarteStat";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useHistoriquePrixCarnet, usePrixCarnetCourant } from "@/hooks/usePrixCarnet";
import { aujourdhui, formaterDate, formaterDateHeure, formaterMontant, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/prix-carnet")({
  head: () => ({
    meta: [
      { title: "Prix du carnet — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Configuration du prix de vente du carnet par agence, avec historique daté des modifications.",
      },
      { property: "og:title", content: "Prix du carnet par agence" },
      {
        property: "og:description",
        content:
          "Le responsable d'agence fixe le prix du carnet ; les collectrices le consultent en lecture seule.",
      },
    ],
  }),
  component: PagePrixCarnet,
});

const schema = z.object({
  id_agence: z.string().uuid("Sélectionnez une agence"),
  montant: z.number().positive("Le prix doit être strictement positif").max(100000000),
  date_effet: z.string().min(1, "La date d'effet est obligatoire"),
  commentaire: z.string().trim().max(255).optional(),
});

function PagePrixCarnet() {
  const config = useConfiguration();
  const client = useQueryClient();
  const { profil, aRole } = useAuth();
  const peutModifier = aRole("ADMINISTRATEUR", "RESPONSABLE_AGENCE");

  const [idAgence, setIdAgence] = useState(profil?.id_agence ?? "");
  const [montant, setMontant] = useState("");
  const [dateEffet, setDateEffet] = useState(aujourdhui());
  const [commentaire, setCommentaire] = useState("");

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

  const courant = usePrixCarnetCourant(idAgence || null);
  const historique = useHistoriquePrixCarnet(idAgence || null);

  const definir = useMutation({
    mutationFn: async () => {
      const v = schema.safeParse({
        id_agence: idAgence,
        montant: Number(montant),
        date_effet: dateEffet,
        commentaire: commentaire || undefined,
      });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { error } = await supabase.rpc("definir_prix_carnet", {
        _id_agence: v.data.id_agence,
        _montant: v.data.montant,
        _date_effet: v.data.date_effet,
        _commentaire: v.data.commentaire ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nouveau prix enregistré");
      setMontant("");
      setCommentaire("");
      void client.invalidateQueries({ queryKey: ["prix-carnet-courant"] });
      void client.invalidateQueries({ queryKey: ["prix-carnet-historique"] });
    },
    onError: (e) => toast.error("Modification refusée", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Prix du carnet"
        description="Le prix est propre à chaque agence. Chaque modification est historisée et n'affecte jamais les ventes déjà enregistrées."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <CarteStat
          libelle="Prix en vigueur"
          valeur={
            courant.data === null || courant.data === undefined
              ? "Non défini"
              : formaterMontant(courant.data, config)
          }
          description={
            courant.data === null || courant.data === undefined
              ? "Aucun prix n'a encore été configuré pour cette agence."
              : "Appliqué automatiquement lors des ventes de carnet."
          }
        />
        <div className="surface-card space-y-1.5 p-4">
          <Label>Agence</Label>
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
      </div>

      {peutModifier ? (
        <form
          className="surface-card mb-6 max-w-2xl space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!definir.isPending) definir.mutate();
          }}
        >
          <h2 className="text-base font-semibold">Définir un nouveau prix</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="montant-prix">Prix du carnet</Label>
              <Input
                id="montant-prix"
                type="number"
                min={1}
                step="1"
                className="montant"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-effet">Date d'effet</Label>
              <Input
                id="date-effet"
                type="date"
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motif-prix">Motif de la modification</Label>
            <Input
              id="motif-prix"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={255}
              placeholder="Décision du comité, ajustement tarifaire…"
            />
          </div>
          <Button type="submit" disabled={definir.isPending}>
            {definir.isPending ? "Enregistrement…" : "Enregistrer le prix"}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground mb-6 text-sm">
          Consultation seule : seul le responsable d'agence peut modifier le prix du carnet.
        </p>
      )}

      <div className="surface-card overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold">Historique des prix</div>
        {historique.isLoading ? (
          <EtatChargement />
        ) : historique.error ? (
          <div className="p-4">
            <EtatErreur erreur={historique.error} />
          </div>
        ) : historique.data && historique.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Date d'effet</th>
                  <th className="px-4 py-2 font-medium">Prix</th>
                  <th className="px-4 py-2 font-medium">Défini par</th>
                  <th className="px-4 py-2 font-medium">Enregistré le</th>
                  <th className="px-4 py-2 font-medium">Motif</th>
                </tr>
              </thead>
              <tbody>
                {historique.data.map((p) => (
                  <tr key={p.id_prix} className="border-t">
                    <td className="px-4 py-2">{formaterDate(p.date_effet, config)}</td>
                    <td className="montant px-4 py-2">{formaterMontant(p.montant, config)}</td>
                    <td className="px-4 py-2">
                      {p.utilisateur ? `${p.utilisateur.prenom} ${p.utilisateur.nom}` : "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {formaterDateHeure(p.created_at, config)}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">{p.commentaire ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EtatVide
              titre="Aucun prix enregistré"
              description="Définissez le premier prix du carnet pour cette agence."
            />
          </div>
        )}
      </div>
    </>
  );
}
