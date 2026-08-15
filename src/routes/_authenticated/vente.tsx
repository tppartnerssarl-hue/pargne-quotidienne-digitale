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
import { EtatVide } from "@/components/commun/Etats";
import { useConfiguration, useParametres } from "@/hooks/useConfiguration";
import { formaterMontant, aujourdhui, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vente")({
  head: () => ({
    meta: [
      { title: "Vente de livret — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Attribuer un livret disponible à un épargnant et enregistrer l'achat du carnet en une transaction sécurisée.",
      },
      { property: "og:title", content: "Vente et attribution de livret" },
      {
        property: "og:description",
        content: "Attribution d'un livret en stock à un épargnant avec encaissement du carnet.",
      },
    ],
  }),
  component: PageVente,
});

const schema = z.object({
  id_epargnant: z.string().uuid("Sélectionnez un épargnant"),
  id_livret: z.string().uuid("Sélectionnez un livret disponible"),
  montant: z.number().nonnegative("Le montant ne peut pas être négatif").max(100000000),
  date: z.string().min(1),
});

function PageVente() {
  const config = useConfiguration();
  const parametres = useParametres();
  const client = useQueryClient();
  const prixDefaut = parametres.data?.find((p) => p.cle === "prix_carnet")?.valeur ?? "";

  const [terme, setTerme] = useState("");
  const [idEpargnant, setIdEpargnant] = useState("");
  const [idLivret, setIdLivret] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(aujourdhui());

  const epargnants = useQuery({
    queryKey: ["epargnants-vente", terme],
    queryFn: async () => {
      let requete = supabase
        .from("epargnant")
        .select("id_epargnant, nom, prenom, numero_client")
        .eq("statut", "ACTIF")
        .order("nom")
        .limit(20);
      if (terme.trim().length >= 2) {
        const t = terme.trim();
        requete = requete.or(
          `nom.ilike.%${t}%,prenom.ilike.%${t}%,numero_client.ilike.%${t}%`,
        );
      }
      const { data, error } = await requete;
      if (error) throw error;
      return data ?? [];
    },
  });

  const livrets = useQuery({
    queryKey: ["livrets-disponibles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livret")
        .select("id_livret, numero_livret")
        .eq("statut", "EN_STOCK")
        .order("numero_livret")
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const vendre = useMutation({
    mutationFn: async () => {
      const valeurs = schema.safeParse({
        id_epargnant: idEpargnant,
        id_livret: idLivret,
        montant: Number(montant || prixDefaut || 0),
        date,
      });
      if (!valeurs.success) throw new Error(valeurs.error.issues[0]!.message);
      const { data, error } = await supabase.rpc("enregistrer_vente", {
        _id_epargnant: valeurs.data.id_epargnant,
        _id_livret: valeurs.data.id_livret,
        _montant: valeurs.data.montant,
        _date: valeurs.data.date,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Livret attribué et vente enregistrée");
      setIdLivret("");
      setIdEpargnant("");
      setMontant("");
      void client.invalidateQueries({ queryKey: ["livrets-disponibles"] });
      void client.invalidateQueries({ queryKey: ["tableau-de-bord"] });
    },
    onError: (e) => toast.error("Vente refusée", { description: messageErreur(e) }),
  });

  const montantAffiche = Number(montant || prixDefaut || 0);

  return (
    <>
      <EnTetePage
        titre="Vente et attribution d'un livret"
        description="Le livret passe du stock à l'état actif et l'achat du carnet est encaissé dans la même transaction."
      />

      <form
        className="surface-card max-w-2xl space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!vendre.isPending) vendre.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="recherche-epargnant">Rechercher un épargnant</Label>
          <Input
            id="recherche-epargnant"
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Nom, prénom ou numéro client"
            maxLength={60}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Épargnant</Label>
          <Select value={idEpargnant} onValueChange={setIdEpargnant}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un épargnant" />
            </SelectTrigger>
            <SelectContent>
              {(epargnants.data ?? []).map((e) => (
                <SelectItem key={e.id_epargnant} value={e.id_epargnant}>
                  {e.nom} {e.prenom} — {e.numero_client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Livret disponible</Label>
          <Select value={idLivret} onValueChange={setIdLivret}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un livret en stock" />
            </SelectTrigger>
            <SelectContent>
              {(livrets.data ?? []).map((l) => (
                <SelectItem key={l.id_livret} value={l.id_livret}>
                  {l.numero_livret}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(livrets.data ?? []).length === 0 && !livrets.isLoading ? (
            <p className="text-muted-foreground text-sm">
              Aucun livret en stock. Réceptionnez des livrets depuis la page Stock.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prix">Prix du carnet</Label>
            <Input
              id="prix"
              type="number"
              min={0}
              step="1"
              className="montant"
              value={montant || prixDefaut}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
            <p className="text-muted-foreground text-xs">
              Montant encaissé : {formaterMontant(montantAffiche, config)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-vente">Date de vente</Label>
            <Input
              id="date-vente"
              type="date"
              value={date}
              max={aujourdhui()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={vendre.isPending}>
          {vendre.isPending ? "Enregistrement…" : "Attribuer le livret"}
        </Button>
      </form>

      {epargnants.data?.length === 0 ? (
        <div className="mt-6 max-w-2xl">
          <EtatVide
            titre="Aucun épargnant trouvé"
            description="Créez d'abord la fiche de l'épargnant depuis la page Épargnants."
          />
        </div>
      ) : null}
    </>
  );
}
