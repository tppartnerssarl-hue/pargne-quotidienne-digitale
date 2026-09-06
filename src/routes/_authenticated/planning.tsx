import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/planning")({
  head: () => ({
    meta: [
      { title: "Planning de collecte — Épargne quotidienne" },
      {
        name: "description",
        content: "Planning hebdomadaire des tournées : assignation des zones et épargnants aux collectrices par jour.",
      },
      { property: "og:title", content: "Planning de collecte" },
      { property: "og:description", content: "Organisation hebdomadaire des tournées de collecte." },
    ],
  }),
  component: PagePlanning,
});

export const JOURS_SEMAINE = [
  "",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function PagePlanning() {
  const client = useQueryClient();
  const { profil, aRole } = useAuth();
  const peutGerer = aRole("ADMINISTRATEUR", "RESPONSABLE_AGENCE");
  const estCollectrice = aRole("COLLECTRICE");

  const [idCollectrice, setIdCollectrice] = useState("");
  const [typeCible, setTypeCible] = useState<"zone" | "epargnant">("zone");
  const [idZone, setIdZone] = useState("");
  const [idEpargnant, setIdEpargnant] = useState("");
  const [jour, setJour] = useState("1");

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

  const zones = useQuery({
    queryKey: ["zones", profil?.id_agence],
    enabled: peutGerer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone")
        .select("id_zone, code, libelle")
        .eq("actif", true)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const epargnants = useQuery({
    queryKey: ["epargnants-planning", profil?.id_agence],
    enabled: peutGerer && typeCible === "epargnant",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epargnant")
        .select("id_epargnant, nom, prenom, numero_client")
        .eq("statut", "ACTIF")
        .order("nom")
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const planning = useQuery({
    queryKey: ["planning", profil?.id_agence, estCollectrice ? profil?.id_utilisateur : "tous"],
    queryFn: async () => {
      let requete = supabase
        .from("planning_collecte")
        .select(
          "id_planning, jour_semaine, actif, id_collectrice, collectrice:id_collectrice(nom, prenom), zone:id_zone(code, libelle), epargnant:id_epargnant(nom, prenom, numero_client)",
        )
        .order("jour_semaine");
      if (estCollectrice && !peutGerer && profil?.id_utilisateur) {
        requete = requete.eq("id_collectrice", profil.id_utilisateur);
      }
      const { data, error } = await requete;
      if (error) throw error;
      return data ?? [];
    },
  });

  const ajouter = useMutation({
    mutationFn: async () => {
      if (!profil?.id_agence) throw new Error("Aucune agence rattachée à votre compte");
      if (!idCollectrice) throw new Error("Sélectionnez une collectrice");
      if (typeCible === "zone" && !idZone) throw new Error("Sélectionnez une zone");
      if (typeCible === "epargnant" && !idEpargnant) throw new Error("Sélectionnez un épargnant");
      const { error } = await supabase.from("planning_collecte").insert({
        id_agence: profil.id_agence,
        id_collectrice: idCollectrice,
        jour_semaine: Number(jour),
        ...(typeCible === "zone" ? { id_zone: idZone } : { id_epargnant: idEpargnant }),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tournée ajoutée au planning");
      setIdZone("");
      setIdEpargnant("");
      void client.invalidateQueries({ queryKey: ["planning"] });
    },
    onError: (e) => toast.error("Ajout refusé", { description: messageErreur(e) }),
  });

  const basculer = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase.from("planning_collecte").update({ actif }).eq("id_planning", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Planning mis à jour");
      void client.invalidateQueries({ queryKey: ["planning"] });
    },
    onError: (e) => toast.error("Modification refusée", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Planning de collecte"
        description={
          peutGerer
            ? "Assignez les zones ou les épargnants aux collectrices, jour par jour."
            : "Vos tournées de la semaine."
        }
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {peutGerer ? (
          <form
            className="surface-card h-fit space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ajouter.isPending) ajouter.mutate();
            }}
          >
            <h2 className="font-semibold">Nouvelle tournée</h2>
            <div className="space-y-1.5">
              <Label>Collectrice</Label>
              <Select value={idCollectrice} onValueChange={setIdCollectrice}>
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
              <Label>Jour de la semaine</Label>
              <Select value={jour} onValueChange={setJour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOURS_SEMAINE.slice(1).map((j, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de tournée</Label>
              <Select value={typeCible} onValueChange={(v) => setTypeCible(v as "zone" | "epargnant")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone">Une zone entière</SelectItem>
                  <SelectItem value="epargnant">Un épargnant précis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {typeCible === "zone" ? (
              <div className="space-y-1.5">
                <Label>Zone</Label>
                <Select value={idZone} onValueChange={setIdZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(zones.data ?? []).map((z) => (
                      <SelectItem key={z.id_zone} value={z.id_zone}>
                        {z.code} — {z.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Épargnant</Label>
                <Select value={idEpargnant} onValueChange={setIdEpargnant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(epargnants.data ?? []).map((e) => (
                      <SelectItem key={e.id_epargnant} value={e.id_epargnant}>
                        {e.prenom} {e.nom} ({e.numero_client})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={ajouter.isPending}>
              {ajouter.isPending ? "Enregistrement…" : "Ajouter au planning"}
            </Button>
          </form>
        ) : null}

        <section className={peutGerer ? "surface-card overflow-hidden" : "surface-card overflow-hidden lg:col-span-2"}>
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Tournées de la semaine</h2>
          {planning.isLoading ? (
            <EtatChargement />
          ) : planning.error ? (
            <div className="p-4">
              <EtatErreur erreur={planning.error} />
            </div>
          ) : (planning.data ?? []).length === 0 ? (
            <div className="p-4">
              <EtatVide titre="Aucune tournée planifiée" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Jour</th>
                    <th className="px-4 py-2 font-medium">Collectrice</th>
                    <th className="px-4 py-2 font-medium">Tournée</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                    {peutGerer ? <th className="px-4 py-2 font-medium">Action</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {(planning.data ?? []).map((p) => (
                    <tr key={p.id_planning} className="border-t">
                      <td className="px-4 py-2 font-medium">{JOURS_SEMAINE[p.jour_semaine]}</td>
                      <td className="px-4 py-2">
                        {p.collectrice ? `${p.collectrice.prenom} ${p.collectrice.nom}` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {p.zone
                          ? `Zone ${p.zone.code} — ${p.zone.libelle}`
                          : p.epargnant
                            ? `${p.epargnant.prenom} ${p.epargnant.nom} (${p.epargnant.numero_client})`
                            : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={p.actif ? "default" : "secondary"}>
                          {p.actif ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      {peutGerer ? (
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={basculer.isPending}
                            onClick={() => basculer.mutate({ id: p.id_planning, actif: !p.actif })}
                          >
                            {p.actif ? "Désactiver" : "Réactiver"}
                          </Button>
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
    </>
  );
}
