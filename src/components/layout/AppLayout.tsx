import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Search, X, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { entreesAutorisees, GROUPES } from "./navigation";
import { LIBELLE_ROLE } from "@/lib/constantes";
import { cn } from "@/lib/utils";

function Liens({ onNaviguer }: { onNaviguer?: () => void }) {
  const { roles } = useAuth();
  const chemin = useRouterState({ select: (s) => s.location.pathname });
  const entrees = entreesAutorisees(roles);

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {GROUPES.map((groupe) => {
        const items = entrees.filter((e) => e.groupe === groupe);
        if (items.length === 0) return null;
        return (
          <div key={groupe}>
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
              {groupe}
            </p>
            <ul className="space-y-0.5">
              {items.map((e) => {
                const actif = chemin.startsWith(e.chemin);
                return (
                  <li key={e.chemin}>
                    <Link
                      to={e.chemin}
                      onClick={onNaviguer}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        actif
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <e.icone className="h-4 w-4 shrink-0" aria-hidden />
                      {e.libelle}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { profil, roles, deconnexion } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const navigate = useNavigate();
  const entrees = entreesAutorisees(roles).filter((e) => e.mobile);

  return (
    <div className="min-h-screen bg-background">
      {/* Barre latérale — desktop */}
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="border-sidebar-border flex items-center gap-2 border-b px-5 py-4">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
            <PiggyBank className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sidebar-foreground font-display text-sm leading-tight font-semibold">
            Épargne
            <br />
            quotidienne
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Liens />
        </div>
      </aside>

      {/* Tiroir — mobile */}
      {ouvert ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOuvert(false)}
          />
          <div className="bg-sidebar absolute inset-y-0 left-0 w-72 overflow-y-auto">
            <div className="border-sidebar-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-sidebar-foreground font-display font-semibold">Menu</span>
              <button
                onClick={() => setOuvert(false)}
                className="text-sidebar-foreground/70"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Liens onNaviguer={() => setOuvert(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="bg-card/90 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <button
            className="lg:hidden"
            onClick={() => setOuvert(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate({ to: "/recherche" })}
            className="text-muted-foreground hover:bg-muted flex flex-1 items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors sm:max-w-sm"
          >
            <Search className="h-4 w-4" aria-hidden />
            Rechercher un livret, un client…
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">
                {profil ? `${profil.prenom} ${profil.nom}` : "—"}
              </p>
              <p className="text-muted-foreground text-xs leading-tight">
                {roles.map((r) => LIBELLE_ROLE[r] ?? r).join(", ") || "Aucun rôle"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Se déconnecter"
              onClick={async () => {
                await deconnexion();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Navigation basse — mobile */}
      <nav className="bg-card fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t lg:hidden">
        {entrees.slice(0, 4).map((e) => (
          <Link
            key={e.chemin}
            to={e.chemin}
            className="text-muted-foreground [&.active]:text-primary flex flex-col items-center gap-1 py-2 text-[11px]"
            activeProps={{ className: "active" }}
          >
            <e.icone className="h-5 w-5" aria-hidden />
            {e.libelle}
          </Link>
        ))}
      </nav>
    </div>
  );
}
