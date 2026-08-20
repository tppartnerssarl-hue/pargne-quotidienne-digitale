import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { StatutOperation } from "@/components/commun/Badges";
import { useConfiguration } from "@/hooks/useConfiguration";
import { RecuImpression } from "@/components/commun/RecuImpression";
import { chargerOperationRecu, type DonneesRecu } from "@/lib/recu";
import {
  formaterMontant,
  formaterDate,
  formaterDateHeure,
  aujourdhui,
  messageErreur,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/retraits")({
  head: () => ({
    meta: [
      { title: "Retraits — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Enregistrer un retrait avec contrôle du solde disponible et suivre les derniers retraits de l'agence.",
      },
      { property: "og:title", content: "Retraits d'épargne" },
      {
        property: "og:description",
        content: "Retraits contrôlés par le solde disponible du livret.",
      },
    ],
  }),
  component: PageRetraits,
});

const schema = z.object({
  id_livret: z.string().uuid("Sélectionnez un livret"),
  montant: z.number().positive("Le montant doit être strictement positif").max(100000000),
  date: z.string().min(1),
});

function PageRetraits() {
  const config = useConfiguration();
  const client = useQueryClient();
  const [idLivret, setIdLivret] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [confirmation, setConfirmation] = useState(false);
  const [recu, setRecu] = useState<DonneesRecu | null>(null);
  const [recuOuvert, setRecuOuvert] = useState(false);

  const ouvrirRecu = async (idOperation: string) => {
    setRecu(null);
    setRecuOuvert(true);
    try {
      const o = await chargerOperationRecu(idOperation);
      if (!o) throw new Error("Opération introuvable");
      setRecu({
        titre: "Reçu de retrait",
        reference: o.reference,
        dateTexte: `${formaterDate(o.date_operation, config)} (émis le ${formaterDateHeure(
          o.date_creation,
          config,
        )})`,
        lignes: [
          { label: "Agence", valeur: o.agence ? `${o.agence.nom} (${o.agence.code})` : "—" },
          { label: "Livret", valeur: o.livret?.numero_livret ?? "—" },
          {
            label: "Épargnant",
            valeur: o.epargnant ? `${o.epargnant.prenom} ${o.epargnant.nom}` : "—",
          },
          { label: "N° client", valeur: o.epargnant?.numero_client ?? "—" },
          {
            label: "Caissier",
            valeur: o.operateur ? `${o.operateur.prenom} ${o.operateur.nom}` : "—",
          },
          { label: "Statut", valeur: o.statut === "VALIDEE" ? "Validé" : "En attente" },
        ],
        montantLibelle: "Montant retiré",
        montantTexte: formaterMontant(o.montant, config),
      });
    } catch (e) {
      setRecuOuvert(false);
      toast.error("Reçu indisponible", { description: messageErreur(e) });
    }
  };

  const livrets = useQuery({
    queryKey: ["livrets-actifs-retrait"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_solde_livret")
        .select("id_livret, numero_livret, solde")
        .order("numero_livret")
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const derniers = useQuery({
    queryKey: ["derniers-retraits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operation")
        .select("id_operation, reference, date_operation, montant, statut, id_livret")
        .eq("code_type", "RETRAIT")
        .order("date_creation", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  const livretChoisi = (livrets.data ?? []).find((l) => l.id_livret === idLivret);
  const solde = Number(livretChoisi?.solde ?? 0);
  const depassement = Number(montant || 0) > solde;

  const retirer = useMutation({
    mutationFn: async () => {
      const v = schema.safeParse({ id_livret: idLivret, montant: Number(montant), date });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { data, error } = await supabase.rpc("enregistrer_retrait", {
        _id_livret: v.data.id_livret,
        _montant: v.data.montant,
        _date: v.data.date,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (idOperation) => {
      toast.success("Retrait enregistré");
      if (typeof idOperation === "string") void ouvrirRecu(idOperation);
      setMontant("");
      setConfirmation(false);
      void client.invalidateQueries({ queryKey: ["livrets-actifs-retrait"] });
      void client.invalidateQueries({ queryKey: ["derniers-retraits"] });
      void client.invalidateQueries({ queryKey: ["tableau-de-bord"] });
    },
    onError: (e) => {
      setConfirmation(false);
      toast.error("Retrait refusé", { description: messageErreur(e) });
    },
  });

  return (
    <>
      <EnTetePage
        titre="Retraits"
        description="Le solde disponible est contrôlé par la base avant tout décaissement."
      />

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <form
          className="surface-card space-y-5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const v = schema.safeParse({ id_livret: idLivret, montant: Number(montant), date });
            if (!v.success) {
              toast.error(v.error.issues[0]!.message);
              return;
            }
            setConfirmation(true);
          }}
        >
          <div className="space-y-1.5">
            <Label>Livret</Label>
            <Select value={idLivret} onValueChange={setIdLivret}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un livret" />
              </SelectTrigger>
              <SelectContent>
                {(livrets.data ?? []).map((l) => (
                  <SelectItem key={l.id_livret ?? ""} value={l.id_livret ?? ""}>
                    {l.numero_livret} — {formaterMontant(l.solde, config)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {idLivret ? (
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground text-xs uppercase">Solde disponible</p>
              <p className="montant text-xl font-semibold">{formaterMontant(solde, config)}</p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="montant-retrait">Montant du retrait</Label>
            <Input
              id="montant-retrait"
              type="number"
              inputMode="numeric"
              min={1}
              step="1"
              className="montant h-12 text-xl"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
            {depassement ? (
              <p className="text-destructive text-sm">
                Montant supérieur au solde disponible — l'opération sera refusée.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date-retrait">Date</Label>
            <Input
              id="date-retrait"
              type="date"
              value={date}
              max={aujourdhui()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={retirer.isPending || depassement}>
            {retirer.isPending ? "Enregistrement…" : "Enregistrer le retrait"}
          </Button>
        </form>

        <section className="surface-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Derniers retraits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Référence</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 text-right font-medium">Montant</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Reçu</th>
                </tr>
              </thead>
              <tbody>
                {(derniers.data ?? []).map((o) => (
                  <tr key={o.id_operation} className="border-t">
                    <td className="montant px-4 py-2">{o.reference}</td>
                    <td className="px-4 py-2">{formaterDate(o.date_operation, config)}</td>
                    <td className="montant px-4 py-2 text-right">
                      {formaterMontant(o.montant, config)}
                    </td>
                    <td className="px-4 py-2">
                      <StatutOperation statut={o.statut} />
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void ouvrirRecu(o.id_operation)}
                      >
                        <Printer className="mr-1.5 size-4" />
                        Imprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <RecuImpression recu={recu} ouvert={recuOuvert} onOuvertChange={setRecuOuvert} />

      <AlertDialog open={confirmation} onOpenChange={setConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le retrait</AlertDialogTitle>
            <AlertDialogDescription>
              Décaissement de {formaterMontant(Number(montant || 0), config)} sur le livret{" "}
              {livretChoisi?.numero_livret}. Solde après opération :{" "}
              {formaterMontant(solde - Number(montant || 0), config)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!retirer.isPending) retirer.mutate();
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
