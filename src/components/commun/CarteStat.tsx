import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CarteStat({
  libelle,
  valeur,
  detail,
  icone: Icone,
  accent = false,
}: {
  libelle: string;
  valeur: string | number;
  detail?: string;
  icone?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {libelle}
        </p>
        {Icone ? <Icone className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
      </div>
      <p className={cn("montant mt-2 text-2xl font-semibold", accent && "text-primary")}>
        {valeur}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
