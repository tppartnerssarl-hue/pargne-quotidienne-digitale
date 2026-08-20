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
import { Textarea } from "@/components/ui/textarea";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { StatutRemise } from "@/components/commun/Badges";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { RecuImpression } from "@/components/commun/RecuImpression";
import type { DonneesRecu } from "@/lib/recu";
import { formaterMontant, formaterDate, aujourdhui, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/caisse")({
  head: () => ({
    meta: [
      { title: "Remises de caisse — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Déclarer une remise de caisse, comparer au montant attendu et faire contrôler les écarts par le caissier.",
      },
      { property: "og:title", content: "Remises de caisse" },
      {
        property: "og:description",
        content: "Déclaration, contrôle et validation des remises de caisse quotidiennes.",
      },
    ],
  }),
  component: PageCaisse,
});

const schemaRemise = z.object({
  montant: z.number().nonnegative("Le montant ne peut pas être négatif").max(1000000000),
  date: z.string().min(1),
  commentaire: z.string().trim().max(500).optional(),
});

function PageCaisse() {
  const config = useConfiguration();
  const client = useQueryClient();
  const { aRole, profil } = useAuth();
  const peutControler = aRole("CAISSIER", "RESPONSABLE_AGENCE", "ADMINISTRATEUR", "DIRECTION");

  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [commentaire, setCommentaire] = useState("");
  const [controles, setControles] = useState<Record<string, string>>({});
  const [recu, setRecu] = useState<DonneesRecu | null>(null);
  const [recuOuvert, setRecuOuvert] = useState(false);

  const ouvrirRecuRemise = (r: {
    reference: string;
    date_remise: string;
    montant_attendu: number | string;
    montant_declare: number | string;
    montant_controle: number | string | null;
    ecart: number | string | null;
    statut: string;
  }) => {
    setRecu({
      titre: "Reçu de remise de caisse",
      reference: r.reference,
      dateTexte: formaterDate(r.date_remise, config),
      lignes: [
        { label: "Remis par", valeur: profil ? `${profil.prenom} ${profil.nom}` : "—" },
        { label: "Agence", valeur: profil?.agence?.nom ?? "—" },
        { label: "Montant attendu", valeur: formaterMontant(r.montant_attendu, config) },
        {
          label: "Montant contrôlé",
          valeur: r.montant_controle === null ? "—" : formaterMontant(r.montant_controle, config),
        },
        {
          label: "Écart",
          valeur: r.ecart === null ? "—" : formaterMontant(r.ecart, config),
        },
        { label: "Statut", valeur: r.statut },
      ],
      montantLibelle: "Montant déclaré",
      montantTexte: formaterMontant(r.montant_declare, config),
      mention: "Reçu de remise de caisse — à conserver par les deux parties.",
    });
    setRecuOuvert(true);
  };

  const remises = useQuery({
    queryKey: ["remises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("remise_caisse")
        .select(
          "id_remise, reference, date_remise, montant_declare, montant_attendu, montant_controle, ecart, statut, commentaire",
        )
        .order("date_remise", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const declarer = useMutation({
    mutationFn: async () => {
      const v = schemaRemise.safeParse({
        montant: Number(montant),
        date,
        commentaire: commentaire || undefined,
      });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { error } = await supabase.rpc("creer_remise", {
        _date: v.data.date,
        _montant_declare: v.data.montant,
        ...(v.data.commentaire ? { _commentaire: v.data.commentaire } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Remise déclarée");
      setMontant("");
      setCommentaire("");
      void client.invalidateQueries({ queryKey: ["remises"] });
      void client.invalidateQueries({ queryKey: ["tableau-de-bord"] });
    },
    onError: (e) => toast.error("Déclaration refusée", { description: messageErreur(e) }),
  });

  const controler = useMutation({
    mutationFn: async ({ id, valeur }: { id: string; valeur: number }) => {
      const { error } = await supabase.rpc("controler_remise", {
        _id_remise: id,
        _montant_controle: valeur,
        _valider: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Remise contrôlée et validée");
      void client.invalidateQueries({ queryKey: ["remises"] });
      void client.invalidateQueries({ queryKey: ["tableau-de-bord"] });
    },
    onError: (e) => toast.error("Contrôle refusé", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Remises de caisse"
        description="Le montant attendu est calculé automatiquement à partir des opérations validées de la journée."
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <form
          className="surface-card space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!declarer.isPending) declarer.mutate();
          }}
        >
          <h2 className="font-semibold">Déclarer une remise</h2>
          <div className="space-y-1.5">
            <Label htmlFor="date-remise">Date de la remise</Label>
            <Input
              id="date-remise"
              type="date"
              value={date}
              max={aujourdhui()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="montant-remise">Montant remis</Label>
            <Input
              id="montant-remise"
              type="number"
              min={0}
              step="1"
              className="montant h-12 text-xl"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commentaire">Commentaire (facultatif)</Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={declarer.isPending}>
            {declarer.isPending ? "Enregistrement…" : "Déclarer la remise"}
          </Button>
        </form>

        <section className="surface-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Historique des remises</h2>
          {remises.isLoading ? (
            <EtatChargement />
          ) : remises.error ? (
            <div className="p-4">
              <EtatErreur erreur={remises.error} />
            </div>
          ) : (remises.data ?? []).length === 0 ? (
            <div className="p-4">
              <EtatVide titre="Aucune remise enregistrée" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Référence</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 text-right font-medium">Attendu</th>
                    <th className="px-4 py-2 text-right font-medium">Déclaré</th>
                    <th className="px-4 py-2 text-right font-medium">Écart</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                    <th className="px-4 py-2 font-medium">Reçu</th>
                    {peutControler ? <th className="px-4 py-2 font-medium">Contrôle</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {(remises.data ?? []).map((r) => (
                    <tr key={r.id_remise} className="border-t align-middle">
                      <td className="montant px-4 py-2">{r.reference}</td>
                      <td className="px-4 py-2">{formaterDate(r.date_remise, config)}</td>
                      <td className="montant px-4 py-2 text-right">
                        {formaterMontant(r.montant_attendu, config)}
                      </td>
                      <td className="montant px-4 py-2 text-right">
                        {formaterMontant(r.montant_declare, config)}
                      </td>
                      <td
                        className={`montant px-4 py-2 text-right ${
                          Number(r.ecart ?? 0) !== 0 ? "text-destructive font-medium" : ""
                        }`}
                      >
                        {r.ecart === null ? "—" : formaterMontant(r.ecart, config)}
                      </td>
                      <td className="px-4 py-2">
                        <StatutRemise statut={r.statut} />
                      </td>
                      <td className="px-4 py-2">
                        <Button size="sm" variant="ghost" onClick={() => ouvrirRecuRemise(r)}>
                          <Printer className="mr-1.5 size-4" />
                          Imprimer
                        </Button>
                      </td>
                      {peutControler ? (
                        <td className="px-4 py-2">
                          {r.statut === "VALIDEE" ? (
                            <span className="text-muted-foreground">
                              {formaterMontant(r.montant_controle, config)}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                step="1"
                                className="montant h-8 w-28"
                                aria-label={`Montant contrôlé pour ${r.reference}`}
                                value={controles[r.id_remise] ?? ""}
                                onChange={(e) =>
                                  setControles((c) => ({ ...c, [r.id_remise]: e.target.value }))
                                }
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={controler.isPending || !controles[r.id_remise]}
                                onClick={() =>
                                  controler.mutate({
                                    id: r.id_remise,
                                    valeur: Number(controles[r.id_remise]),
                                  })
                                }
                              >
                                Valider
                              </Button>
                            </div>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <RecuImpression recu={recu} ouvert={recuOuvert} onOuvertChange={setRecuOuvert} />
    </>
  );
}
