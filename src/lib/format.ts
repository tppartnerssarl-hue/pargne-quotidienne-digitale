/**
 * Formatage centralisé : la devise et le fuseau ne sont jamais codés en dur
 * dans les composants, ils proviennent de la table `parametre`.
 */

export type Configuration = {
  devise_code: string;
  devise_libelle: string;
  fuseau_horaire: string;
};

export const CONFIG_PAR_DEFAUT: Configuration = {
  devise_code: "XAF",
  devise_libelle: "FCFA",
  fuseau_horaire: "Africa/Douala",
};

export function formaterMontant(
  valeur: number | string | null | undefined,
  config: Configuration = CONFIG_PAR_DEFAUT,
): string {
  const nombre = typeof valeur === "string" ? Number(valeur) : (valeur ?? 0);
  if (Number.isNaN(nombre)) return "—";
  const formate = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(nombre);
  return `${formate} ${config.devise_libelle}`;
}

export function formaterNombre(valeur: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR").format(valeur ?? 0);
}

export function formaterDate(
  valeur: string | Date | null | undefined,
  config: Configuration = CONFIG_PAR_DEFAUT,
): string {
  if (!valeur) return "—";
  const date = typeof valeur === "string" ? new Date(valeur) : valeur;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: config.fuseau_horaire,
  }).format(date);
}

export function formaterDateHeure(
  valeur: string | Date | null | undefined,
  config: Configuration = CONFIG_PAR_DEFAUT,
): string {
  if (!valeur) return "—";
  const date = typeof valeur === "string" ? new Date(valeur) : valeur;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: config.fuseau_horaire,
  }).format(date);
}

/** Date du jour au format ISO (yyyy-mm-dd), utilisable dans un input date. */
export function aujourdhui(): string {
  const d = new Date();
  const mois = `${d.getMonth() + 1}`.padStart(2, "0");
  const jour = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export function debutDuMois(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-01`;
}

/** Traduit une erreur technique en message compréhensible, sans détail sensible. */
export function messageErreur(erreur: unknown): string {
  const brut =
    erreur instanceof Error
      ? erreur.message
      : typeof erreur === "object" && erreur !== null && "message" in erreur
        ? String((erreur as { message: unknown }).message)
        : "";

  if (!brut) return "Une erreur est survenue. Veuillez réessayer.";
  if (brut.includes("duplicate key") && brut.includes("numero_livret"))
    return "Ce numéro de livret existe déjà.";
  if (brut.includes("duplicate key") && brut.includes("numero_client"))
    return "Ce numéro client existe déjà.";
  if (brut.includes("duplicate key") && brut.includes("reference"))
    return "Cette référence d'opération existe déjà.";
  if (brut.includes("duplicate key")) return "Cet enregistrement existe déjà.";
  if (brut.includes("row-level security") || brut.includes("permission denied"))
    return "Vous n'êtes pas autorisé à effectuer cette action.";
  if (brut.includes("Failed to fetch"))
    return "Connexion indisponible. Vérifiez votre réseau et réessayez.";
  if (brut.includes("violates check constraint"))
    return "Les données saisies ne respectent pas les règles de validation.";
  // Les messages levés volontairement par la base sont déjà en français.
  return brut;
}
