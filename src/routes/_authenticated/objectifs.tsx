import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { LIBELLE_TYPE_OPERATION } from "@/lib/constantes";
import { formaterMontant, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/objectifs")({
  head: () => ({
    meta: [
      { title: "Objectifs et performance — Épargne quotidienne" },
      {
        name: "description",
        content: "Objectifs mensuels de collecte et de ventes par agence ou par collectrice, avec suivi du taux d'atteinte.",
      },
      { property: "og:title", content: "Objectifs et performance" },
      { property: "og:description", content: "Définition et suivi des objectifs mensuels." },
    ],
  }),
  component: PageObjectifs,
});

const MOIS = [
  "",
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const schema = z.object({
  code_type: z.enum(["COLLECTE", "ACHAT_CARNET"]),
  annee: z.number().int().min(2020).max(2100),
  mois: z.number().int().min(1).max(12),
  montant_cible: z.number().positive("L'objectif doit être strictement positif").max(10000000000),
});

function PageObjectifs() {
  const config = useConfiguration();
  const client = useQueryClient();
  const { profil, aRole } = useAuth();
  const peutGerer = aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE");

  const maintenant = new Date();
  const [annee, setAnnee] = useState(String(maintenant.getFullYear()));
  const [mois, setMois] = useState(String(maintenant.getMonth() + 1));
  const [codeType, setCodeType] = useState<"COLLECTE" | "ACHAT_CARNET">("COLLECTE");
  const [idCollectrice, setIdCollectrice] = useState("agence");
  const [montantCible, setMontantCible] = useState("");

  const anneeNum = Number(annee) || maintenant.getFullYear();
  const moisNum = Number(mois) || maintenant.getMonth() + 1;

  const collectrices = useQuery({
    queryKey: ["collectrices-agence", profil?.id_agence],
    enabled: peutGerer,
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

  const suivi = useQuery({
    queryKey: ["suivi-objectifs", anneeNum, moisNum],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("suivi_objectifs", {
        _annee: anneeNum,
        _mois: moisNum,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const definir = useMutation({
    mutationFn: async () => {
      if (!profil?.id_agence) throw new Error("Aucune agence rattachée à votre compte");
      const v = schema.safeParse({
        code_type: codeType,
        annee: anneeNum,
        mois: moisNum,
        montant_cible: Number(montantCible),
      });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { error } = await supabase.from("objectif").upsert(
        {
          id_agence: profil.id_agence,
          id_collectrice: idCollectrice === "agence" ? null : idCollectrice,
          code_type: v.data.code_type,
          annee: v.data.annee,
          mois: v.data.mois,
          montant_cible: v.data.montant_cible,
          actif: true,
        },
        { onConflict: "id_agence,id_collectrice,code_type,annee,mois" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Objectif enregistré");
      setMontantCible("");
      void client.invalidateQueries({ queryKey: ["suivi-objectifs"] });
    },
    onError: (e) => toast.error("Enregistrement refusé", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Objectifs et performance"
        description="Fixez les objectifs mensuels de collecte et de ventes, puis suivez le taux d'atteinte en temps réel."
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {peutGerer ? (
          <form
            className="surface-card h-fit space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!definir.isPending) definir.mutate();
            }}
          >
            <h2 className="font-semibold">Définir un objectif</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="obj-annee">Année</Label>
                <Input
                  id="obj-annee"
                  type="number"
                  min={2020}
                  max={2100}
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mois</Label>
                <Select value={mois} onValueChange={setMois}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOIS.slice(1).map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type d'objectif</Label>
              <Select value={codeType} onValueChange={(v) => setCodeType(v as "COLLECTE" | "ACHAT_CARNET")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLLECTE">Collectes</SelectItem>
                  <SelectItem value="ACHAT_CARNET">Ventes de carnets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Portée</Label>
              <Select value={idCollectrice} onValueChange={setIdCollectrice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agence">Agence entière</SelectItem>
                  {(collectrices.data ?? []).map((u) => (
                    <SelectItem key={u.id_utilisateur} value={u.id_utilisateur}>
                      {u.prenom} {u.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obj-montant">Montant cible</Label>
              <Input
                id="obj-montant"
                type="number"
                min={1}
                step="1"
                className="montant"
                value={montantCible}
                onChange={(e) => setMontantCible(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={definir.isPending}>
              {definir.isPending ? "Enregistrement…" : "Enregistrer l'objectif"}
            </Button>
          </form>
        ) : (
          <div className="surface-card h-fit space-y-4 p-5">
            <h2 className="font-semibold">Période suivie</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="obj-annee-lu">Année</Label>
                <Input
                  id="obj-annee-lu"
                  type="number"
                  min={2020}
                  max={2100}
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mois</Label>
                <Select value={mois} onValueChange={setMois}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOIS.slice(1).map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <section className="surface-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">
            Suivi — {MOIS[moisNum]} {anneeNum}
          </h2>
          {suivi.isLoading ? (
            <EtatChargement />
          ) : suivi.error ? (
            <div className="p-4">
              <EtatErreur erreur={suivi.error} />
            </div>
          ) : (suivi.data ?? []).length === 0 ? (
            <div className="p-4">
              <EtatVide
                titre="Aucun objectif sur cette période"
                description="Définissez un objectif pour suivre la performance."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Portée</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 text-right font-medium">Objectif</th>
                    <th className="px-4 py-2 text-right font-medium">Réalisé</th>
                    <th className="px-4 py-2 font-medium">Atteinte</th>
                  </tr>
                </thead>
                <tbody>
                  {(suivi.data ?? []).map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2 font-medium">{s.collectrice}</td>
                      <td className="px-4 py-2">
                        {LIBELLE_TYPE_OPERATION[s.code_type] ?? s.code_type}
                      </td>
                      <td className="montant px-4 py-2 text-right">
                        {formaterMontant(s.montant_cible, config)}
                      </td>
                      <td className="montant px-4 py-2 text-right">
                        {formaterMontant(s.montant_realise, config)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(100, Number(s.taux_atteinte))} className="h-2 w-24" />
                          <span
                            className={`montant text-xs font-medium ${
                              Number(s.taux_atteinte) >= 100 ? "text-primary" : ""
                            }`}
                          >
                            {Number(s.taux_atteinte).toFixed(1)} %
                          </span>
                        </div>
                      </td>
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
