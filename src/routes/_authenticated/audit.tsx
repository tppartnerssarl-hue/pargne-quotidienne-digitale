import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { EtatChargement, EtatErreur, EtatVide } from "@/components/commun/Etats";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useAuth } from "@/hooks/useAuth";
import { debutDuMois, aujourdhui, formaterDateHeure } from "@/lib/format";
import { LIBELLE_ROLE } from "@/lib/constantes";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Journal d'audit — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Traçabilité complète : chaque création, modification ou validation est journalisée avec auteur, rôle, agence et résultat.",
      },
      { property: "og:title", content: "Journal d'audit" },
      {
        property: "og:description",
        content: "Historique horodaté des actions réalisées dans l'application.",
      },
    ],
  }),
  component: PageAudit,
});

const LIBELLE_ACTION: Record<string, string> = {
  INSERT: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
};

const LIBELLE_TABLE: Record<string, string> = {
  operation: "Opération",
  livret: "Livret",
  epargnant: "Épargnant",
  utilisateur: "Utilisateur",
  utilisateur_role: "Rôle utilisateur",
  remise_caisse: "Remise de caisse",
  regle_commission: "Règle de commission",
  prix_carnet: "Prix du carnet",
  parametre: "Paramètre",
};

type LigneAudit = {
  id_audit: string;
  date_action: string;
  action: string;
  table_cible: string;
  id_cible: string | null;
  code_role: string | null;
  resultat: string;
  contexte: string | null;
  utilisateur: { nom: string; prenom: string } | null;
  agence: { nom: string; code: string } | null;
};

function PageAudit() {
  const config = useConfiguration();
  const { aRole } = useAuth();
  const voitToutesAgences = aRole("ADMINISTRATEUR", "DIRECTION");

  const [table, setTable] = useState("TOUTES");
  const [action, setAction] = useState("TOUTES");
  const [idAgence, setIdAgence] = useState("TOUTES");
  const [utilisateur, setUtilisateur] = useState("TOUS");
  const [du, setDu] = useState(debutDuMois());
  const [au, setAu] = useState(aujourdhui());

  const agences = useQuery({
    queryKey: ["agences-liste"],
    enabled: voitToutesAgences,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agence")
        .select("id_agence, nom, code")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const utilisateurs = useQuery({
    queryKey: ["utilisateurs-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utilisateur")
        .select("id_utilisateur, nom, prenom")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const journal = useQuery({
    queryKey: ["audit", table, action, idAgence, utilisateur, du, au],
    queryFn: async () => {
      let requete = supabase
        .from("audit")
        .select(
          "id_audit, date_action, action, table_cible, id_cible, code_role, resultat, contexte, utilisateur:utilisateur(nom, prenom), agence:agence(nom, code)",
        )
        .gte("date_action", `${du}T00:00:00`)
        .lte("date_action", `${au}T23:59:59`)
        .order("date_action", { ascending: false })
        .limit(300);
      if (table !== "TOUTES") requete = requete.eq("table_cible", table);
      if (action !== "TOUTES") requete = requete.eq("action", action);
      if (idAgence !== "TOUTES") requete = requete.eq("id_agence", idAgence);
      if (utilisateur !== "TOUS") requete = requete.eq("id_utilisateur", utilisateur);
      const { data, error } = await requete;
      if (error) throw error;
      return (data ?? []) as unknown as LigneAudit[];
    },
  });

  const reinitialiser = () => {
    setTable("TOUTES");
    setAction("TOUTES");
    setIdAgence("TOUTES");
    setUtilisateur("TOUS");
    setDu(debutDuMois());
    setAu(aujourdhui());
  };

  return (
    <>
      <EnTetePage
        titre="Journal d'audit"
        description="Chaque action est enregistrée avec son auteur, son rôle, son agence et son résultat. Les entrées ne peuvent être ni modifiées ni supprimées."
        actions={
          <Button variant="outline" onClick={reinitialiser}>
            Réinitialiser les filtres
          </Button>
        }
      />

      <div className="surface-card mb-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="audit-du">Du</Label>
          <Input id="audit-du" type="date" value={du} onChange={(e) => setDu(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audit-au">Au</Label>
          <Input id="audit-au" type="date" value={au} onChange={(e) => setAu(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Type d'enregistrement</Label>
          <Select value={table} onValueChange={setTable}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOUTES">Tous</SelectItem>
              {Object.entries(LIBELLE_TABLE).map(([cle, libelle]) => (
                <SelectItem key={cle} value={cle}>
                  {libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Action</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOUTES">Toutes</SelectItem>
              {Object.entries(LIBELLE_ACTION).map(([cle, libelle]) => (
                <SelectItem key={cle} value={cle}>
                  {libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Utilisateur</Label>
          <Select value={utilisateur} onValueChange={setUtilisateur}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOUS">Tous</SelectItem>
              {(utilisateurs.data ?? []).map((u) => (
                <SelectItem key={u.id_utilisateur} value={u.id_utilisateur}>
                  {u.prenom} {u.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {voitToutesAgences ? (
          <div className="space-y-1.5">
            <Label>Agence</Label>
            <Select value={idAgence} onValueChange={setIdAgence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUTES">Toutes</SelectItem>
                {(agences.data ?? []).map((a) => (
                  <SelectItem key={a.id_agence} value={a.id_agence}>
                    {a.nom} ({a.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="surface-card overflow-hidden">
        {journal.isLoading ? (
          <EtatChargement />
        ) : journal.error ? (
          <div className="p-4">
            <EtatErreur erreur={journal.error} />
          </div>
        ) : (journal.data ?? []).length === 0 ? (
          <div className="p-4">
            <EtatVide
              titre="Aucune entrée d'audit"
              description="Aucune action ne correspond aux filtres sélectionnés."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Date et heure</th>
                  <th className="px-4 py-2 font-medium">Auteur</th>
                  <th className="px-4 py-2 font-medium">Rôle</th>
                  <th className="px-4 py-2 font-medium">Agence</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Enregistrement</th>
                  <th className="px-4 py-2 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {(journal.data ?? []).map((a) => (
                  <tr key={a.id_audit} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formaterDateHeure(a.date_action, config)}
                    </td>
                    <td className="px-4 py-2">
                      {a.utilisateur ? `${a.utilisateur.prenom} ${a.utilisateur.nom}` : "Système"}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {a.code_role ? (LIBELLE_ROLE[a.code_role] ?? a.code_role) : "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">{a.agence?.nom ?? "—"}</td>
                    <td className="px-4 py-2">
                      {LIBELLE_ACTION[a.action] ?? a.action}
                      <span className="text-muted-foreground">
                        {" "}
                        — {LIBELLE_TABLE[a.table_cible] ?? a.table_cible}
                      </span>
                    </td>
                    <td className="montant text-muted-foreground px-4 py-2 text-xs">
                      {a.contexte ?? a.id_cible ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          a.resultat === "SUCCES"
                            ? "text-muted-foreground"
                            : "text-destructive font-medium"
                        }
                      >
                        {a.resultat === "SUCCES" ? "Succès" : "Refusé"}
                      </span>
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
