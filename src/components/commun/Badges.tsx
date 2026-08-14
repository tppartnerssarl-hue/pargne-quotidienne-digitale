import { cn } from "@/lib/utils";
import {
  LIBELLE_STATUT_LIVRET,
  LIBELLE_STATUT_OPERATION,
  LIBELLE_STATUT_REMISE,
  LIBELLE_ROLE,
} from "@/lib/constantes";

const TONS = {
  neutre: "bg-muted text-muted-foreground",
  succes: "bg-success/12 text-success",
  info: "bg-info/12 text-info",
  alerte: "bg-warning/18 text-warning-foreground",
  danger: "bg-destructive/12 text-destructive",
} as const;

type Ton = keyof typeof TONS;

function Pastille({ ton, children }: { ton: Ton; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONS[ton],
      )}
    >
      {children}
    </span>
  );
}

const TON_LIVRET: Record<string, Ton> = {
  EN_STOCK: "neutre",
  ATTRIBUE: "info",
  ACTIF: "succes",
  BLOQUE: "alerte",
  CLOTURE: "neutre",
  PERDU: "danger",
};

const TON_OPERATION: Record<string, Ton> = {
  BROUILLON: "neutre",
  EN_ATTENTE: "alerte",
  VALIDEE: "succes",
  ANNULEE: "danger",
  REVERSEE: "danger",
};

const TON_REMISE: Record<string, Ton> = {
  DECLAREE: "alerte",
  CONTROLEE: "info",
  VALIDEE: "succes",
  REJETEE: "danger",
};

export function StatutLivret({ statut }: { statut: string }) {
  return (
    <Pastille ton={TON_LIVRET[statut] ?? "neutre"}>
      {LIBELLE_STATUT_LIVRET[statut] ?? statut}
    </Pastille>
  );
}

export function StatutOperation({ statut }: { statut: string }) {
  return (
    <Pastille ton={TON_OPERATION[statut] ?? "neutre"}>
      {LIBELLE_STATUT_OPERATION[statut] ?? statut}
    </Pastille>
  );
}

export function StatutRemise({ statut }: { statut: string }) {
  return (
    <Pastille ton={TON_REMISE[statut] ?? "neutre"}>
      {LIBELLE_STATUT_REMISE[statut] ?? statut}
    </Pastille>
  );
}

export function BadgeRole({ code }: { code: string }) {
  return <Pastille ton="info">{LIBELLE_ROLE[code] ?? code}</Pastille>;
}

export function BadgeAValider() {
  return <Pastille ton="alerte">À VALIDER</Pastille>;
}
