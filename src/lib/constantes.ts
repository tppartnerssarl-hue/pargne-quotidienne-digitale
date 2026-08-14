export const LIBELLE_STATUT_LIVRET: Record<string, string> = {
  EN_STOCK: "En stock",
  ATTRIBUE: "Attribué",
  ACTIF: "Actif",
  BLOQUE: "Bloqué",
  CLOTURE: "Clôturé",
  PERDU: "Perdu",
};

export const LIBELLE_STATUT_OPERATION: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  VALIDEE: "Validée",
  ANNULEE: "Annulée",
  REVERSEE: "Contre-passée",
};

export const LIBELLE_TYPE_OPERATION: Record<string, string> = {
  ACHAT_CARNET: "Achat de carnet",
  COLLECTE: "Collecte",
  RETRAIT: "Retrait",
  COMMISSION_VENTE: "Commission sur vente",
  COMMISSION_RETRAIT: "Commission sur retrait",
  COMMISSION_MENSUELLE: "Commission mensuelle",
  AJUSTEMENT: "Ajustement",
};

export const LIBELLE_ROLE: Record<string, string> = {
  ADMINISTRATEUR: "Administrateur",
  DIRECTION: "Direction",
  RESPONSABLE_AGENCE: "Responsable d'agence",
  COLLECTRICE: "Collectrice",
  CAISSIER: "Caissier",
};

export const LIBELLE_STATUT_REMISE: Record<string, string> = {
  DECLAREE: "Déclarée",
  CONTROLEE: "Contrôlée",
  VALIDEE: "Validée",
  REJETEE: "Rejetée",
};

export const TYPES_CREDIT = ["ACHAT_CARNET", "COLLECTE", "AJUSTEMENT"];

export type CodeRole =
  | "ADMINISTRATEUR"
  | "DIRECTION"
  | "RESPONSABLE_AGENCE"
  | "COLLECTRICE"
  | "CAISSIER";
