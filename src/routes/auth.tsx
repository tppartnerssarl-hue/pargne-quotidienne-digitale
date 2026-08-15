import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PiggyBank } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageErreur } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — Gestion d'épargne quotidienne" },
      {
        name: "description",
        content:
          "Accès sécurisé à la plateforme de gestion d'épargne quotidienne : collectes, livrets, caisse et rapports.",
      },
      { property: "og:title", content: "Connexion — Gestion d'épargne quotidienne" },
      {
        property: "og:description",
        content: "Accès sécurisé à la plateforme de gestion d'épargne quotidienne.",
      },
    ],
  }),
  component: PageAuth,
});

const schemaConnexion = z.object({
  email: z.string().trim().email("Adresse email invalide").max(255),
  motDePasse: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(72),
});

const schemaInscription = schemaConnexion.extend({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  prenom: z.string().trim().max(100),
});

function PageAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tableau-de-bord" });
    });
  }, [navigate]);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enCours) return;
    setErreur(null);

    const schema = mode === "connexion" ? schemaConnexion : schemaInscription;
    const resultat = schema.safeParse({ email, motDePasse, nom, prenom });
    if (!resultat.success) {
      setErreur(resultat.error.issues[0]?.message ?? "Données invalides");
      return;
    }

    setEnCours(true);
    try {
      if (mode === "connexion") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: motDePasse,
        });
        if (error) throw error;
        navigate({ to: "/tableau-de-bord" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: motDePasse,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom: nom.trim(), prenom: prenom.trim() },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous pouvez maintenant vous connecter.");
        setMode("connexion");
      }
    } catch (err) {
      const msg = messageErreur(err);
      setErreur(
        msg.includes("Invalid login credentials") ? "Email ou mot de passe incorrect." : msg,
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold">Gestion d'épargne quotidienne</h1>
          <p className="text-muted-foreground text-sm">
            {mode === "connexion"
              ? "Connectez-vous avec votre compte professionnel."
              : "Créez votre compte d'accès."}
          </p>
        </div>

        <form onSubmit={soumettre} className="surface-card space-y-4 p-5">
          {mode === "inscription" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mdp">Mot de passe</Label>
            <Input
              id="mdp"
              type="password"
              autoComplete={mode === "connexion" ? "current-password" : "new-password"}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              maxLength={72}
              required
            />
          </div>

          {erreur ? (
            <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-2 text-sm">
              {erreur}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={enCours}>
            {enCours ? "Veuillez patienter…" : mode === "connexion" ? "Se connecter" : "Créer le compte"}
          </Button>

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground w-full text-center text-sm"
            onClick={() => {
              setErreur(null);
              setMode(mode === "connexion" ? "inscription" : "connexion");
            }}
          >
            {mode === "connexion"
              ? "Pas encore de compte ? Créer un compte"
              : "J'ai déjà un compte — Se connecter"}
          </button>
        </form>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          Le premier compte créé devient administrateur. Les comptes suivants doivent être
          créés par un administrateur.
        </p>
      </div>
    </div>
  );
}
