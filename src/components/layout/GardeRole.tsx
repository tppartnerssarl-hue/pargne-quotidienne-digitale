import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NAVIGATION } from "./navigation";

/**
 * Interdit l'ouverture d'un écran par saisie directe de l'URL lorsque le rôle
 * de l'utilisateur ne figure pas dans la configuration de navigation.
 * La base de données reste la source de vérité (RLS + contrôles dans les RPC).
 */
export function GardeRole({ children }: { children: ReactNode }) {
  const { roles, chargement } = useAuth();
  const chemin = useRouterState({ select: (s) => s.location.pathname });

  const entree = NAVIGATION.filter((e) => chemin === e.chemin || chemin.startsWith(e.chemin + "/"))
    .sort((a, b) => b.chemin.length - a.chemin.length)
    .at(0);

  const autorise = !entree?.roles || entree.roles.some((r) => roles.includes(r));

  if (chargement || autorise) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="bg-destructive/10 text-destructive rounded-full p-4">
        <ShieldAlert className="h-8 w-8" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Accès non autorisé</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Votre rôle ne permet pas de consulter cet écran. Rapprochez-vous de votre responsable
          d'agence si vous pensez qu'il s'agit d'une erreur.
        </p>
      </div>
      <Button asChild>
        <Link to="/tableau-de-bord">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
