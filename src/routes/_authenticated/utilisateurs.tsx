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
import { BadgeRole } from "@/components/commun/Badges";
import { messageErreur } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Création des profils utilisateurs, rattachement à une agence et attribution des rôles métier.",
      },
      { property: "og:title", content: "Utilisateurs et rôles" },
      {
        property: "og:description",
        content: "Profils, agences de rattachement et rôles des utilisateurs.",
      },
    ],
  }),
  component: PageUtilisateurs,
});

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  prenom: z.string().trim().min(1, "Le prénom est obligatoire").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  telephone: z.string().trim().max(30).optional(),
  id_agence: z.string().uuid("Sélectionnez une agence"),
  id_role: z.string().uuid("Sélectionnez un rôle"),
});

function PageUtilisateurs() {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    id_agence: "",
    id_role: "",
  });

  const donnees = useQuery({
    queryKey: ["utilisateurs"],
    queryFn: async () => {
      const [utilisateurs, roles, agences, liens] = await Promise.all([
        supabase
          .from("utilisateur")
          .select("id_utilisateur, nom, prenom, email, telephone, statut, id_agence, auth_user_id")
          .order("nom"),
        supabase.from("role").select("id_role, code, libelle").order("code"),
        supabase.from("agence").select("id_agence, nom, code").order("nom"),
        supabase.from("utilisateur_role").select("id_utilisateur, id_role"),
      ]);
      const erreur = utilisateurs.error || roles.error || agences.error || liens.error;
      if (erreur) throw erreur;
      return {
        utilisateurs: utilisateurs.data ?? [],
        roles: roles.data ?? [],
        agences: agences.data ?? [],
        liens: liens.data ?? [],
      };
    },
  });

  const creer = useMutation({
    mutationFn: async () => {
      const v = schema.safeParse({ ...form, telephone: form.telephone || undefined });
      if (!v.success) throw new Error(v.error.issues[0]!.message);
      const { data, error } = await supabase
        .from("utilisateur")
        .insert({
          nom: v.data.nom,
          prenom: v.data.prenom,
          email: v.data.email.toLowerCase(),
          telephone: v.data.telephone ?? null,
          id_agence: v.data.id_agence,
        })
        .select("id_utilisateur")
        .single();
      if (error) throw error;
      const { error: erreurRole } = await supabase
        .from("utilisateur_role")
        .insert({ id_utilisateur: data.id_utilisateur, id_role: v.data.id_role });
      if (erreurRole) throw erreurRole;
    },
    onSuccess: () => {
      toast.success("Utilisateur créé", {
        description:
          "La personne pourra se connecter en créant un compte avec exactement cette adresse email.",
      });
      setOuvert(false);
      setForm({ nom: "", prenom: "", email: "", telephone: "", id_agence: "", id_role: "" });
      void client.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
    onError: (e) => toast.error("Création refusée", { description: messageErreur(e) }),
  });

  if (donnees.isLoading) return <EtatChargement />;
  if (donnees.error) return <EtatErreur erreur={donnees.error} />;
  const d = donnees.data!;

  const rolesDe = (id: string) =>
    d.liens
      .filter((l) => l.id_utilisateur === id)
      .map((l) => d.roles.find((r) => r.id_role === l.id_role)?.code)
      .filter(Boolean) as string[];

  return (
    <>
      <EnTetePage
        titre="Utilisateurs"
        description="Le profil métier est créé ici ; le compte de connexion est rattaché automatiquement par l'adresse email."
        actions={
          <Dialog open={ouvert} onOpenChange={setOuvert}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  L'utilisateur devra créer son mot de passe depuis la page de connexion avec cette
                  même adresse email.
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
                    <Label htmlFor="nom-u">Nom</Label>
                    <Input
                      id="nom-u"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prenom-u">Prénom</Label>
                    <Input
                      id="prenom-u"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-u">Adresse email</Label>
                  <Input
                    id="email-u"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tel-u">Téléphone</Label>
                  <Input
                    id="tel-u"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    maxLength={30}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Agence</Label>
                    <Select
                      value={form.id_agence}
                      onValueChange={(v) => setForm({ ...form, id_agence: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Agence" />
                      </SelectTrigger>
                      <SelectContent>
                        {d.agences.map((a) => (
                          <SelectItem key={a.id_agence} value={a.id_agence}>
                            {a.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rôle</Label>
                    <Select
                      value={form.id_role}
                      onValueChange={(v) => setForm({ ...form, id_role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {d.roles.map((r) => (
                          <SelectItem key={r.id_role} value={r.id_role}>
                            {r.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creer.isPending}>
                    {creer.isPending ? "Création…" : "Créer l'utilisateur"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface-card overflow-hidden">
        {d.utilisateurs.length === 0 ? (
          <div className="p-4">
            <EtatVide titre="Aucun utilisateur" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Agence</th>
                  <th className="px-4 py-2 font-medium">Rôles</th>
                  <th className="px-4 py-2 font-medium">Connexion</th>
                </tr>
              </thead>
              <tbody>
                {d.utilisateurs.map((u) => (
                  <tr key={u.id_utilisateur} className="border-t">
                    <td className="px-4 py-2">
                      {u.nom} {u.prenom}
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">
                      {d.agences.find((a) => a.id_agence === u.id_agence)?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {rolesDe(u.id_utilisateur).map((c) => (
                          <BadgeRole key={c} code={c} />
                        ))}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {u.auth_user_id ? "Compte actif" : "En attente"}
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
