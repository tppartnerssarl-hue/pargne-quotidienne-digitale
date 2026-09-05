import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { CarteStat } from "@/components/commun/CarteStat";
import { StatutLivret } from "@/components/commun/Badges";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { usePrixCarnetCourant } from "@/hooks/usePrixCarnet";
import { formaterDate, formaterMontant, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mes-carnets")({
  head: () => ({
    meta: [
      { title: "Mes carnets — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Carnets reçus par la collectrice, carnets encore disponibles et attribution d'un carnet à un client.",
      },
      { property: "og:title", content: "Carnets reçus et disponibles" },
      {
        property: "og:description",
        content: "Suivi des carnets confiés à chaque collectrice, avec affectation et transfert.",
      },
    ],
  }),
  component: PageMesCarnets,
});

type Livret = {
  id_livret: string;
  numero_livret: string;
  statut: string;
  date_reception: string;
  id_collectrice: string | null;
  epargnant: { nom: string; prenom: string; numero_client: string } | null;
};

function PageMesCarnets() {
  const config = useConfiguration();
  const client = useQueryClient();
  const { profil, aRole } = useAuth();
  const peutAffecter = aRole("ADMINISTRATEUR", "RESPONSABLE_AGENCE");
  const prix = usePrixCarnetCourant();

  const [terme, setTerme] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [destinataire, setDestinataire] = useState("");
  const [transfert, setTransfert] = useState<Livret | null>(null);
  const [motif, setMotif] = useState("");

  const carnets = useQuery({
    queryKey: ["mes-carnets", profil?.id_utilisateur],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livret")
        .select(
          "id_livret, numero_livret, statut, date_reception, id_collectrice, epargnant:epargnant(nom, prenom, numero_client)",
        )
        .in("statut", ["EN_STOCK", "ACTIF", "ATTRIBUE"])
        .order("numero_livret")
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Livret[];
    },
  });

  const collectrices = useQuery({
    queryKey: ["collectrices-agence", profil?.id_agence],
    enabled: peutAffecter,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utilisateur")
        .select("id_utilisateur, nom, prenom, statut, id_agence")
        .eq("statut", "ACTIF")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const mesCarnets = useMemo(
    () => (carnets.data ?? []).filter((l) => l.id_collectrice === profil?.id_utilisateur),
    [carnets.data, profil?.id_utilisateur],
  );
  const disponibles = useMemo(
    () =>
      (carnets.data ?? []).filter(
        (l) => l.statut === "EN_STOCK" && l.numero_livret.toLowerCase().includes(terme.trim().toLowerCase()),
      ),
    [carnets.data, terme],
  );

  const affecter = useMutation({
    mutationFn: async () => {
      if (!destinataire) throw new Error("Sélectionnez la collectrice destinataire");
      if (selection.length === 0) throw new Error("Sélectionnez au moins un carnet");
      const { error } = await supabase.rpc("affecter_livrets_collectrice", {
        _id_collectrice: destinataire,
        _ids_livret: selection,
        _commentaire: undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Carnets affectés");
      setSelection([]);
      void client.invalidateQueries({ queryKey: ["mes-carnets"] });
      void client.invalidateQueries({ queryKey: ["livrets"] });
    },
    onError: (e) => toast.error("Affectation refusée", { description: messageErreur(e) }),
  });

  const transferer = useMutation({
    mutationFn: async () => {
      if (!transfert) throw new Error("Aucun carnet sélectionné");
      if (!destinataire) throw new Error("Sélectionnez la collectrice destinataire");
      if (motif.trim().length < 3) throw new Error("Le motif du transfert est obligatoire");
      const { error } = await supabase.rpc("transferer_livret", {
        _id_livret: transfert.id_livret,
        _id_collectrice: destinataire,
        _motif: motif.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Carnet transféré");
      setTransfert(null);
      setMotif("");
      void client.invalidateQueries({ queryKey: ["mes-carnets"] });
    },
    onError: (e) => toast.error("Transfert refusé", { description: messageErreur(e) }),
  });

  const basculer = (id: string) =>
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (carnets.isLoading) return <EtatChargement />;
  if (carnets.error) return <EtatErreur erreur={carnets.error} />;

  return (
    <>
      <EnTetePage
        titre="Carnets"
        description="Carnets qui vous ont été confiés, carnets encore disponibles et attribution à un client."
        actions={
          <Button asChild>
            <Link to="/vente">Attribuer un carnet à un client</Link>
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <CarteStat libelle="Mes carnets" valeur={mesCarnets.length} detail="Carnets sous ma responsabilité" />
        <CarteStat
          libelle="Disponibles"
          valeur={disponibles.length}
          detail="Carnets en stock, prêts à être vendus"
        />
        <CarteStat
          libelle="Prix du carnet"
          valeur={prix.data ? formaterMontant(prix.data, config) : "Non défini"}
          detail="Prix en vigueur dans votre agence"
        />
      </div>

      {peutAffecter ? (
        <div className="surface-card mb-6 space-y-4 p-5">
          <h2 className="text-base font-semibold">Affecter des carnets à une collectrice</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Collectrice destinataire</Label>
              <Select value={destinataire} onValueChange={setDestinataire}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {(collectrices.data ?? []).map((u) => (
                    <SelectItem key={u.id_utilisateur} value={u.id_utilisateur}>
                      {u.prenom} {u.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => !affecter.isPending && affecter.mutate()}
                disabled={affecter.isPending || selection.length === 0}
              >
                {affecter.isPending
                  ? "Affectation…"
                  : `Affecter ${selection.length} carnet${selection.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="surface-card mb-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b p-3">
          <span className="text-sm font-semibold">Carnets disponibles</span>
          <Input
            className="max-w-xs"
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Rechercher un numéro"
            maxLength={40}
          />
        </div>
        {disponibles.length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucun carnet disponible" description="Le stock de l'agence est vide." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  {peutAffecter ? <th className="px-4 py-2" /> : null}
                  <th className="px-4 py-2 font-medium">Numéro</th>
                  <th className="px-4 py-2 font-medium">Reçu le</th>
                  <th className="px-4 py-2 font-medium">Affectation</th>
                </tr>
              </thead>
              <tbody>
                {disponibles.map((l) => (
                  <tr key={l.id_livret} className="border-t">
                    {peutAffecter ? (
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={selection.includes(l.id_livret)}
                          onCheckedChange={() => basculer(l.id_livret)}
                          aria-label={`Sélectionner ${l.numero_livret}`}
                        />
                      </td>
                    ) : null}
                    <td className="montant px-4 py-2">{l.numero_livret}</td>
                    <td className="px-4 py-2">{formaterDate(l.date_reception, config)}</td>
                    <td className="text-muted-foreground px-4 py-2">
                      {l.id_collectrice
                        ? l.id_collectrice === profil?.id_utilisateur
                          ? "Vous"
                          : "Une autre collectrice"
                        : "Stock d'agence"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="surface-card overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold">Mes carnets</div>
        {mesCarnets.length === 0 ? (
          <div className="p-4">
            <EtatVide
              titre="Aucun carnet confié"
              description="Le responsable d'agence doit vous affecter des carnets."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Numéro</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Titulaire</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {mesCarnets.map((l) => (
                  <tr key={l.id_livret} className="border-t">
                    <td className="montant px-4 py-2">
                      <Link
                        to="/livrets/$id"
                        params={{ id: l.id_livret }}
                        className="text-primary hover:underline"
                      >
                        {l.numero_livret}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <StatutLivret statut={l.statut} />
                    </td>
                    <td className="px-4 py-2">
                      {l.epargnant ? `${l.epargnant.nom} ${l.epargnant.prenom}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {peutAffecter ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTransfert(l);
                            setMotif("");
                          }}
                        >
                          Transférer
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(transfert)} onOpenChange={(o) => !o && setTransfert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transférer le carnet {transfert?.numero_livret}</DialogTitle>
            <DialogDescription>
              Le transfert est historisé : collectrice d'origine, destinataire, auteur et motif.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nouvelle collectrice</Label>
              <Select value={destinataire} onValueChange={setDestinataire}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {(collectrices.data ?? []).map((u) => (
                    <SelectItem key={u.id_utilisateur} value={u.id_utilisateur}>
                      {u.prenom} {u.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motif-transfert">Motif</Label>
              <Input
                id="motif-transfert"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                maxLength={255}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => !transferer.isPending && transferer.mutate()}
              disabled={transferer.isPending}
            >
              {transferer.isPending ? "Transfert…" : "Confirmer le transfert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
