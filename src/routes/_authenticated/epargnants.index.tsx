import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { formaterDate, messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/epargnants/")({
  head: () => ({
    meta: [
      { title: "Épargnants — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Répertoire des épargnants : recherche, création de fiche et accès à la situation individuelle.",
      },
      { property: "og:title", content: "Répertoire des épargnants" },
      {
        property: "og:description",
        content: "Recherchez, créez et consultez les fiches des épargnants.",
      },
    ],
  }),
  component: PageEpargnants,
});

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  prenom: z.string().trim().min(1, "Le prénom est obligatoire").max(100),
  telephone: z.string().trim().max(30).optional(),
  numero_cni: z.string().trim().max(50).optional(),
  adresse: z.string().trim().max(255).optional(),
  id_agence: z.string().uuid("Sélectionnez une agence"),
});

function PageEpargnants() {
  const config = useConfiguration();
  const client = useQueryClient();
  const { profil } = useAuth();
  const [terme, setTerme] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    numero_cni: "",
    adresse: "",
    id_agence: profil?.id_agence ?? "",
  });

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

  const liste = useQuery({
    queryKey: ["epargnants", terme],
    queryFn: async () => {
      let requete = supabase
        .from("epargnant")
        .select("id_epargnant, numero_client, nom, prenom, telephone, statut, date_creation")
        .order("date_creation", { ascending: false })
        .limit(100);
      const t = terme.trim();
      if (t.length >= 2) {
        requete = requete.or(`nom.ilike.%${t}%,prenom.ilike.%${t}%,numero_client.ilike.%${t}%`);
      }
      const { data, error } = await requete;
      if (error) throw error;
      return data ?? [];
    },
  });

  const creer = useMutation({
    mutationFn: async () => {
      const v = schema.safeParse({
        ...form,
        telephone: form.telephone || undefined,
        numero_cni: form.numero_cni || undefined,
        adresse: form.adresse || undefined,
      });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { data: numero, error: erreurNumero } = await supabase.rpc("prochain_numero_client");
      if (erreurNumero) throw erreurNumero;
      const { error } = await supabase.from("epargnant").insert({
        nom: v.data.nom,
        prenom: v.data.prenom,
        telephone: v.data.telephone ?? null,
        numero_cni: v.data.numero_cni ?? null,
        adresse: v.data.adresse ?? null,
        id_agence: v.data.id_agence,
        numero_client: numero as string,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Épargnant créé");
      setOuvert(false);
      setForm((f) => ({ ...f, nom: "", prenom: "", telephone: "", numero_cni: "", adresse: "" }));
      void client.invalidateQueries({ queryKey: ["epargnants"] });
    },
    onError: (e) => toast.error("Création refusée", { description: messageErreur(e) }),
  });

  return (
    <>
      <EnTetePage
        titre="Épargnants"
        description="Répertoire des clients épargnants et accès à leur situation individuelle."
        actions={
          <Dialog open={ouvert} onOpenChange={setOuvert}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Nouvel épargnant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel épargnant</DialogTitle>
                <DialogDescription>
                  Le numéro client est généré automatiquement par le système.
                </DialogDescription>
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
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tel">Téléphone</Label>
                    <Input
                      id="tel"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      maxLength={30}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cni">Pièce d'identité</Label>
                    <Input
                      id="cni"
                      value={form.numero_cni}
                      onChange={(e) => setForm({ ...form, numero_cni: e.target.value })}
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Agence</Label>
                  <Select
                    value={form.id_agence}
                    onValueChange={(v) => setForm({ ...form, id_agence: v })}
                  >
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
                <DialogFooter>
                  <Button type="submit" disabled={creer.isPending}>
                    {creer.isPending ? "Création…" : "Créer la fiche"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="border-b p-3">
          <Input
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Rechercher par nom, prénom ou numéro client"
            maxLength={60}
          />
        </div>
        {liste.isLoading ? (
          <EtatChargement />
        ) : liste.error ? (
          <div className="p-4">
            <EtatErreur erreur={liste.error} />
          </div>
        ) : (liste.data ?? []).length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucun épargnant" description="Créez la première fiche épargnant." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">N° client</th>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Téléphone</th>
                  <th className="px-4 py-2 font-medium">Créé le</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(liste.data ?? []).map((e) => (
                  <tr key={e.id_epargnant} className="border-t">
                    <td className="montant px-4 py-2">{e.numero_client}</td>
                    <td className="px-4 py-2">
                      {e.nom} {e.prenom}
                    </td>
                    <td className="px-4 py-2">{e.telephone ?? "—"}</td>
                    <td className="px-4 py-2">{formaterDate(e.date_creation, config)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to="/epargnants/$id"
                        params={{ id: e.id_epargnant }}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Situation
                      </Link>
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
