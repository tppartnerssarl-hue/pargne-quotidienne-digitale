import { Loader2, Inbox, TriangleAlert } from "lucide-react";
import { messageErreur } from "@/lib/format";

export function EtatChargement({ texte = "Chargement…" }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {texte}
    </div>
  );
}

export function EtatVide({
  titre,
  description,
  action,
}: {
  titre: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="font-medium">{titre}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function EtatErreur({ erreur }: { erreur: unknown }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <TriangleAlert className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
      <div>
        <p className="font-medium text-destructive">Impossible de charger les données</p>
        <p className="text-muted-foreground">{messageErreur(erreur)}</p>
      </div>
    </div>
  );
}
