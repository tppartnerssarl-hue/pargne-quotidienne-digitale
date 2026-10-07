import { eachDayOfInterval, format, startOfYear, subDays } from "date-fns";

export type PeriodeDashboard = "7" | "30" | "90" | "annee" | "mois";
export type OperationDashboard = { code_type: string; montant: number; date_operation: string };

export function intervalleDashboard(periode: PeriodeDashboard, mois: string, aujourdHui: string) {
  const fin = new Date(`${aujourdHui}T12:00:00`);
  if (periode === "mois") {
    const debut = `${mois}-01`;
    const dernierJour = format(
      new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0),
      "yyyy-MM-dd",
    );
    return { debut, fin: dernierJour < aujourdHui ? dernierJour : aujourdHui };
  }
  return {
    debut: format(
      periode === "annee" ? startOfYear(fin) : subDays(fin, Number(periode) - 1),
      "yyyy-MM-dd",
    ),
    fin: aujourdHui,
  };
}

/** Fetch every authorized page; never silently truncate financial totals. */
export async function toutesLesPages<T>(
  charger: (debut: number, fin: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const resultat: T[] = [];
  for (let debut = 0; ; debut += 1000) {
    const page = await charger(debut, debut + 999);
    if (page.error) throw page.error;
    const lignes = page.data ?? [];
    resultat.push(...lignes);
    if (lignes.length < 1000) return resultat;
  }
}

export function agregerActivite(
  operations: OperationDashboard[],
  debut: string,
  fin: string,
  mensuel: boolean,
  nombre: boolean,
) {
  const points = new Map<
    string,
    { date: string; collecte: number; retrait: number; vente: number }
  >();
  for (const date of eachDayOfInterval({
    start: new Date(`${debut}T12:00:00`),
    end: new Date(`${fin}T12:00:00`),
  })) {
    const cle = format(date, mensuel ? "yyyy-MM" : "yyyy-MM-dd");
    if (!points.has(cle)) points.set(cle, { date: cle, collecte: 0, retrait: 0, vente: 0 });
  }
  for (const operation of operations) {
    const point = points.get(
      mensuel ? operation.date_operation.slice(0, 7) : operation.date_operation,
    );
    if (!point) continue;
    const valeur = nombre ? 1 : Number(operation.montant);
    if (operation.code_type === "COLLECTE") point.collecte += valeur;
    if (operation.code_type === "RETRAIT") point.retrait += valeur;
    if (operation.code_type === "ACHAT_CARNET") point.vente += valeur;
  }
  return Array.from(points.values());
}
