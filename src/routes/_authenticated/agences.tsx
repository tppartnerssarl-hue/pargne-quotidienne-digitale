import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterDate, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/agences")({
  head: () => ({
    meta: [
      { title: "Agences — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Gestion du réseau d'agences : création, coordonnées et statut d'activité de chaque point de collecte.",
      },
      { property: "og:title", content: "Réseau d'agences" },
      { property: "og:description", content: "Création et suivi des agences du réseau." },
    ],
  }),
  component: PageAgences,
});

const schema = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire").max(20),
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  adresse: z.string().trim().max(255).optional(),
  telephone: z.string().trim().max(30).optional(),
});

function PageAgences() {
  const config = useConfiguration();
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({ code: "", nom: "", adresse: "", telephone: "" });

  const liste = useQuery({
    queryKey: ["agences"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agence").select("*").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const creer = useMutation({
    mutationFn: async () => {
      const v = schema.safeParse({
        ...form,
        adresse: form.adresse || undefined,
        telephone: form.telephone || undefined,
      });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { error } = await supabase.from("agence").insert({
        code: v.data.code.toUpperCase(),
        nom: v.data.nom,
        adresse: v.data.adresse ?? null,
        telephone: v.data.telephone ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agence créée");
      setOuvert(false);
      setForm({ code: "", nom: "", adresse: "", telephone: "" });
      void client.invalidateQueries({ queryKey: ["agences"] });
      void client.invalidateQueries({ queryKey: ["agences-liste"] });
    },
    onError: (e) => toast.error("Création refusée", { description: messageErreur(e) }),
  });

  const basculer = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("agence").update({ statut }).eq("id_agence", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut de l'agence mis à jour");
      void client.invalidateQueries({ queryKey: ["agences"] });
    },
    onError: (e) => toast.error("Mise à jour refusée", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Agences"
        description="Chaque agence cloisonne les données : un utilisateur ne voit que son périmètre."
        actions={
          <Dialog open={ouvert} onOpenChange={setOuvert}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Nouvelle agence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle agence</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!creer.isPending) creer.mutate();
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      maxLength={20}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nom-agence">Nom</Label>
                    <Input
                      id="nom-agence"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adresse-agence">Adresse</Label>
                  <Input
                    id="adresse-agence"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tel-agence">Téléphone</Label>
                  <Input
                    id="tel-agence"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    maxLength={30}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creer.isPending}>
                    {creer.isPending ? "Création…" : "Créer l'agence"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface-card overflow-hidden">
        {liste.isLoading ? (
          <EtatChargement />
        ) : liste.error ? (
          <div className="p-4">
            <EtatErreur erreur={liste.error} />
          </div>
        ) : (liste.data ?? []).length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucune agence" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Téléphone</th>
                  <th className="px-4 py-2 font-medium">Créée le</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(liste.data ?? []).map((a) => (
                  <tr key={a.id_agence} className="border-t">
                    <td className="montant px-4 py-2">{a.code}</td>
                    <td className="px-4 py-2">{a.nom}</td>
                    <td className="px-4 py-2">{a.telephone ?? "—"}</td>
                    <td className="px-4 py-2">{formaterDate(a.date_creation, config)}</td>
                    <td className="px-4 py-2">{a.statut === "ACTIVE" ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={basculer.isPending}
                        onClick={() =>
                          basculer.mutate({
                            id: a.id_agence,
                            statut: a.statut === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                          })
                        }
                      >
                        {a.statut === "ACTIVE" ? "Désactiver" : "Activer"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
