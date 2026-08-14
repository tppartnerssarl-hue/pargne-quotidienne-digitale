import {
  LayoutDashboard,
  Users,
  BookMarked,
  Boxes,
  ShoppingCart,
  HandCoins,
  Banknote,
  Wallet,
  Percent,
  FileBarChart,
  Building2,
  UserCog,
  Settings,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { CodeRole } from "@/lib/constantes";

export type Entree = {
  libelle: string;
  chemin: string;
  icone: LucideIcon;
  roles?: CodeRole[]; // absent = tous les rôles
  groupe: "Pilotage" | "Opérations" | "Référentiel" | "Administration";
  mobile?: boolean;
};

export const NAVIGATION: Entree[] = [
  {
    libelle: "Tableau de bord",
    chemin: "/tableau-de-bord",
    icone: LayoutDashboard,
    groupe: "Pilotage",
    mobile: true,
  },
  {
    libelle: "Collecte",
    chemin: "/collecte",
    icone: HandCoins,
    groupe: "Opérations",
    roles: ["ADMINISTRATEUR", "RESPONSABLE_AGENCE", "COLLECTRICE"],
    mobile: true,
  },
  {
    libelle: "Vente de livret",
    chemin: "/vente",
    icone: ShoppingCart,
    groupe: "Opérations",
    roles: ["ADMINISTRATEUR", "RESPONSABLE_AGENCE", "COLLECTRICE"],
    mobile: true,
  },
  {
    libelle: "Retraits",
    chemin: "/retraits",
    icone: Banknote,
    groupe: "Opérations",
    roles: ["ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE", "CAISSIER"],
    mobile: true,
  },
  {
    libelle: "Caisse",
    chemin: "/caisse",
    icone: Wallet,
    groupe: "Opérations",
    roles: ["ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE", "CAISSIER", "COLLECTRICE"],
  },
  { libelle: "Épargnants", chemin: "/epargnants", icone: Users, groupe: "Référentiel" },
  { libelle: "Livrets", chemin: "/livrets", icone: BookMarked, groupe: "Référentiel" },
  { libelle: "Stock", chemin: "/stock", icone: Boxes, groupe: "Référentiel" },
  {
    libelle: "Commissions",
    chemin: "/commissions",
    icone: Percent,
    groupe: "Pilotage",
    roles: ["ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE"],
  },
  { libelle: "Rapports", chemin: "/rapports", icone: FileBarChart, groupe: "Pilotage" },
  {
    libelle: "Agences",
    chemin: "/agences",
    icone: Building2,
    groupe: "Administration",
    roles: ["ADMINISTRATEUR", "DIRECTION"],
  },
  {
    libelle: "Utilisateurs",
    chemin: "/utilisateurs",
    icone: UserCog,
    groupe: "Administration",
    roles: ["ADMINISTRATEUR", "DIRECTION"],
  },
  {
    libelle: "Paramètres",
    chemin: "/parametres",
    icone: Settings,
    groupe: "Administration",
    roles: ["ADMINISTRATEUR", "DIRECTION"],
  },
  {
    libelle: "Audit",
    chemin: "/audit",
    icone: ScrollText,
    groupe: "Administration",
    roles: ["ADMINISTRATEUR", "DIRECTION"],
  },
];

export const GROUPES: Entree["groupe"][] = [
  "Pilotage",
  "Opérations",
  "Référentiel",
  "Administration",
];

export function entreesAutorisees(roles: CodeRole[]): Entree[] {
  return NAVIGATION.filter((e) => !e.roles || e.roles.some((r) => roles.includes(r)));
}
