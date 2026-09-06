import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useAuth } from "@/hooks/useAuth";
import { messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/zones")({
  head: () => ({
    meta: [
      { title: "Zones de collecte — Épargne quotidienne" },
      {
        name: "description",
        content: "Découpage de l'agence en zones de collecte pour organiser les tournées des collectrices.",
      },
      { property: "og:title", content: "Zones de collecte" },
      { property: "og:description", content: "Création et gestion des zones de collecte de l'agence." },
    ],
  }),
  component: PageZones,
});

const schema = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire").max(20),
  libelle: z.string().trim().min(2, "Le nom est obligatoire").max(120),
});

function PageZones() {
  const client = useQueryClient();
  const { profil, aRole } = useAuth();
  const peutGerer = aRole("ADMINISTRATEUR", "RESPONSABLE_AGENCE");
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");

  const zones = useQuery({
    queryKey: ["zones", profil?.id_agence],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone")
        .select("id_zone, code, libelle, actif, created_at")
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const creer = useMutation({
    mutationFn: async () => {
      const v = schema.safeParse({ code, libelle });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      if (!profil?.id_agence) throw new Error("Aucune agence rattachée à votre compte");
      const { error } = await supabase.from("zone").insert({
        id_agence: profil.id_agence,
        code: v.data.code.toUpperCase(),
        libelle: v.data.libelle,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Zone créée");
      setCode("");
      setLibelle("");
      void client.invalidateQueries({ queryKey: ["zones"] });
    },
    onError: (e) => toast.error("Création refusée", { description: messageErreur(e) }),
  });

  const basculer = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase.from("zone").update({ actif }).eq("id_zone", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.actif ? "Zone réactivée" : "Zone désactivée");
      void client.invalidateQueries({ queryKey: ["zones"] });
    },
    onError: (e) => toast.error("Modification refusée", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Zones de collecte"
        description="Découpez le territoire de l'agence en zones pour organiser les tournées et le planning des collectrices."
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {peutGerer ? (
          <form
            className="surface-card h-fit space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!creer.isPending) creer.mutate();
            }}
          >
            <h2 className="font-semibold">Nouvelle zone</h2>
            <div className="space-y-1.5">
              <Label htmlFor="code-zone">Code</Label>
              <Input
                id="code-zone"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={20}
                placeholder="Z1"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="libelle-zone">Nom de la zone</Label>
              <Input
                id="libelle-zone"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                maxLength={120}
                placeholder="Marché central"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={creer.isPending}>
              {creer.isPending ? "Enregistrement…" : "Créer la zone"}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground surface-card h-fit p-5 text-sm">
            Consultation seule : seul le responsable d'agence peut gérer les zones.
          </p>
        )}

        <section className="surface-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Zones de l'agence</h2>
          {zones.isLoading ? (
            <EtatChargement />
          ) : zones.error ? (
            <div className="p-4">
              <EtatErreur erreur={zones.error} />
            </div>
          ) : (zones.data ?? []).length === 0 ? (
            <div className="p-4">
              <EtatVide titre="Aucune zone" description="Créez la première zone de collecte." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  {peutGerer ? <th className="px-4 py-2 font-medium">Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {(zones.data ?? []).map((z) => (
                  <tr key={z.id_zone} className="border-t">
                    <td className="montant px-4 py-2">{z.code}</td>
                    <td className="px-4 py-2">{z.libelle}</td>
                    <td className="px-4 py-2">
                      <Badge variant={z.actif ? "default" : "secondary"}>
                        {z.actif ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {peutGerer ? (
                      <td className="px-4 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={basculer.isPending}
                          onClick={() => basculer.mutate({ id: z.id_zone, actif: !z.actif })}
                        >
                          {z.actif ? "Désactiver" : "Réactiver"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
