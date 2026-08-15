import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterDate, aujourdhui, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/collecte")({
  head: () => ({
    meta: [
      { title: "Enregistrer une collecte — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Écran rapide de saisie des collectes quotidiennes : recherche du livret, contrôle du solde et enregistrement.",
      },
      { property: "og:title", content: "Enregistrer une collecte" },
      { property: "og:description", content: "Saisie rapide des collectes quotidiennes." },
    ],
  }),
  component: PageCollecte,
});

type LivretTrouve = {
  id_livret: string;
  numero_livret: string;
  statut: string;
  epargnant: { nom: string; prenom: string; numero_client: string } | null;
};

const schema = z.object({
  montant: z.number().positive("Le montant doit être strictement positif").max(100000000),
  date: z.string().min(1, "La date est obligatoire"),
});

function PageCollecte() {
  const config = useConfiguration();
  const client = useQueryClient();
  const [recherche, setRecherche] = useState("");
  const [terme, setTerme] = useState("");
  const [livret, setLivret] = useState<LivretTrouve | null>(null);
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [confirmation, setConfirmation] = useState(false);

  const resultats = useQuery({
    queryKey: ["recherche-livret-collecte", terme],
    enabled: terme.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livret")
        .select("id_livret, numero_livret, statut, epargnant:epargnant(nom, prenom, numero_client)")
        .eq("statut", "ACTIF")
        .or(`numero_livret.ilike.%${terme}%`)
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as LivretTrouve[];
    },
  });

  const parNom = useQuery({
    queryKey: ["recherche-nom-collecte", terme],
    enabled: terme.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livret")
        .select("id_livret, numero_livret, statut, epargnant:epargnant!inner(nom, prenom, numero_client)")
        .eq("statut", "ACTIF")
        .or(`nom.ilike.%${terme}%,prenom.ilike.%${terme}%`, { referencedTable: "epargnant" })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as LivretTrouve[];
    },
  });

  const solde = useQuery({
    queryKey: ["solde", livret?.id_livret],
    enabled: Boolean(livret),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_solde_livret")
        .select("solde")
        .eq("id_livret", livret!.id_livret)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.solde ?? 0);
    },
  });

  const historique = useQuery({
    queryKey: ["historique-collecte", livret?.id_livret],
    enabled: Boolean(livret),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operation")
        .select("id_operation, reference, date_operation, montant, code_type, statut")
        .eq("id_livret", livret!.id_livret)
        .order("date_operation", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const enregistrer = useMutation({
    mutationFn: async () => {
      const valeurs = schema.safeParse({ montant: Number(montant), date });
      if (!valeurs.success) throw new Error(valeurs.error.issues[0]!.message);
      const { data, error } = await supabase.rpc("enregistrer_collecte", {
        _id_livret: livret!.id_livret,
        _montant: Number(montant),
        _date: date,
        _commentaire: null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Collecte enregistrée", {
        description: `${formaterMontant(Number(montant), config)} sur le livret ${livret?.numero_livret}`,
      });
      setMontant("");
      setConfirmation(false);
      void client.invalidateQueries({ queryKey: ["solde"] });
      void client.invalidateQueries({ queryKey: ["historique-collecte"] });
      void client.invalidateQueries({ queryKey: ["tableau-de-bord"] });
    },
    onError: (e) => {
      setConfirmation(false);
      toast.error("Collecte refusée", { description: messageErreur(e) });
    },
  });

  const liste = [...(resultats.data ?? []), ...(parNom.data ?? [])].filter(
    (l, i, tab) => tab.findIndex((x) => x.id_livret === l.id_livret) === i,
  );

  return (
    <>
      <EnTetePage
        titre="Enregistrer une collecte"
        description="Recherchez le livret, vérifiez l'épargnant puis saisissez le montant."
      />

      {!livret ? (
        <div className="surface-card p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setTerme(recherche.trim());
            }}
          >
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Numéro de livret ou nom de l'épargnant"
              inputMode="search"
              autoFocus
              maxLength={60}
            />
            <Button type="submit" aria-label="Rechercher">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-4">
            {terme.length < 2 ? (
              <p className="text-muted-foreground text-sm">
                Saisissez au moins 2 caractères pour lancer la recherche.
              </p>
            ) : resultats.isFetching || parNom.isFetching ? (
              <p className="text-muted-foreground text-sm">Recherche en cours…</p>
            ) : liste.length === 0 ? (
              <EtatVide
                titre="Aucun livret actif trouvé"
                description="Vérifiez le numéro saisi ou l'orthographe du nom. Seuls les livrets actifs peuvent recevoir une collecte."
              />
            ) : (
              <ul className="divide-y">
                {liste.map((l) => (
                  <li key={l.id_livret}>
                    <button
                      className="hover:bg-muted flex w-full items-center justify-between gap-3 px-1 py-3 text-left"
                      onClick={() => setLivret(l)}
                    >
                      <span>
                        <span className="montant block font-medium">{l.numero_livret}</span>
                        <span className="text-muted-foreground text-sm">
                          {l.epargnant
                            ? `${l.epargnant.nom} ${l.epargnant.prenom} · ${l.epargnant.numero_client}`
                            : "Épargnant non renseigné"}
                        </span>
                      </span>
                      <Check className="text-muted-foreground h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="montant text-lg font-semibold">{livret.numero_livret}</p>
                <p className="text-muted-foreground text-sm">
                  {livret.epargnant
                    ? `${livret.epargnant.nom} ${livret.epargnant.prenom} · ${livret.epargnant.numero_client}`
                    : "Épargnant non renseigné"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLivret(null)}>
                Changer
              </Button>
            </div>

            <div className="bg-muted mt-4 rounded-md p-3">
              <p className="text-muted-foreground text-xs uppercase">Solde actuel</p>
              <p className="montant text-xl font-semibold">
                {solde.isLoading ? "…" : formaterMontant(solde.data ?? 0, config)}
              </p>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const v = schema.safeParse({ montant: Number(montant), date });
                if (!v.success) {
                  toast.error(v.error.issues[0]!.message);
                  return;
                }
                setConfirmation(true);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="montant">Montant collecté</Label>
                <Input
                  id="montant"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step="1"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="montant h-14 text-2xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date de collecte</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  max={aujourdhui()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-12 w-full text-base" disabled={enregistrer.isPending}>
                {enregistrer.isPending ? "Enregistrement…" : "Enregistrer la collecte"}
              </Button>
            </form>
          </div>

          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold">5 dernières opérations</h2>
            {historique.isLoading ? (
              <p className="text-muted-foreground mt-3 text-sm">Chargement…</p>
            ) : (historique.data ?? []).length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">Aucune opération.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {(historique.data ?? []).map((o) => (
                  <li key={o.id_operation} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{formaterDate(o.date_operation, config)}</span>
                    <span className="montant">{formaterMontant(o.montant, config)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={confirmation} onOpenChange={setConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la collecte</AlertDialogTitle>
            <AlertDialogDescription>
              {formaterMontant(Number(montant || 0), config)} sur le livret {livret?.numero_livret}
              {livret?.epargnant ? ` (${livret.epargnant.nom} ${livret.epargnant.prenom})` : ""} le{" "}
              {formaterDate(date, config)}. Cette opération sera définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!enregistrer.isPending) enregistrer.mutate();
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
