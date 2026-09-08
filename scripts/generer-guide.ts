import { jsPDF } from "jspdf";

type Bloc =
  | { t: "titre"; x: string }
  | { t: "h1"; x: string }
  | { t: "h2"; x: string }
  | { t: "p"; x: string }
  | { t: "li"; x: string }
  | { t: "saut" };

const contenu: Bloc[] = [
  { t: "titre", x: "Guide d'utilisation" },
  { t: "p", x: "Application de gestion de l'épargne quotidienne — Mboa Credit Union (COOPCA)" },
  { t: "p", x: "Version du document : septembre 2026" },
  { t: "saut" },

  { t: "h1", x: "1. Se connecter" },
  { t: "p", x: "Ouvrez l'application, saisissez votre adresse e-mail et votre mot de passe, puis validez. Vous arrivez sur le tableau de bord. Les écrans affichés dépendent de votre rôle." },
  { t: "h2", x: "Les rôles" },
  { t: "li", x: "Administrateur : accès complet, agences, utilisateurs, paramètres, journal." },
  { t: "li", x: "Direction : consultation de toutes les agences, rapports et objectifs." },
  { t: "li", x: "Responsable d'agence : pilotage de son agence, validation, stock, planning." },
  { t: "li", x: "Collectrice : collecte sur le terrain, vente de carnets, ses épargnants." },
  { t: "li", x: "Caissier : vente de carnets, retraits, remises de caisse et reçus." },

  { t: "h1", x: "2. Créer un épargnant" },
  { t: "p", x: "Écran « Épargnants » puis « Nouvel épargnant ». Le nom, le prénom, le téléphone, la pièce d'identité et l'adresse sont obligatoires. La zone de collecte est facultative." },
  { t: "p", x: "Le numéro de client est attribué automatiquement. Une même pièce d'identité ne peut pas être enregistrée deux fois dans la même agence." },

  { t: "h1", x: "3. Vendre un carnet" },
  { t: "p", x: "Écran « Vente de livret ». Choisissez l'épargnant et un carnet disponible en stock. Le prix affiché est le prix en vigueur dans votre agence ; il n'est pas modifiable au moment de la vente." },
  { t: "p", x: "Si aucun prix n'est configuré, la vente est bloquée : un administrateur ou un responsable doit d'abord renseigner le prix dans l'écran « Prix du carnet »." },

  { t: "h1", x: "4. Enregistrer une collecte" },
  { t: "p", x: "Écran « Collecte », conçu pour le téléphone. Recherchez l'épargnant ou son carnet, saisissez le montant versé et validez. L'opération est datée et rattachée à vous." },
  { t: "p", x: "Une opération enregistrée ne peut jamais être supprimée. En cas d'erreur, elle est annulée par une écriture inverse qui reste visible dans l'historique." },

  { t: "h1", x: "5. Effectuer un retrait" },
  { t: "p", x: "Écran « Retraits ». Sélectionnez le carnet, vérifiez le solde disponible, saisissez le montant puis validez. Un reçu imprimable est proposé immédiatement après l'opération." },

  { t: "h1", x: "6. Remise de caisse" },
  { t: "p", x: "Écran « Caisse ». La collectrice déclare le montant qu'elle remet ; l'application calcule le montant attendu à partir des opérations non encore remises. Plusieurs remises par jour sont possibles." },
  { t: "p", x: "Le caissier saisit ensuite le montant réellement compté. L'écart est calculé automatiquement. Un écart n'empêche pas la validation, mais un motif doit être indiqué et reste tracé." },
  { t: "p", x: "Chaque remise validée peut être imprimée sous forme de reçu depuis l'historique." },

  { t: "h1", x: "7. Carnets et stock" },
  { t: "li", x: "« Stock » : réception des carnets vierges livrés à l'agence." },
  { t: "li", x: "« Mes carnets » : affectation de carnets à une collectrice et transfert vers une autre, avec historique." },
  { t: "li", x: "« Livrets » : recherche d'un carnet, statut, solde et mouvements." },

  { t: "h1", x: "8. Organisation du terrain" },
  { t: "li", x: "« Zones » : découpage géographique de l'agence." },
  { t: "li", x: "« Planning » : jour de passage d'une collectrice sur une zone ou chez un épargnant." },
  { t: "li", x: "« Rappels » : liste des épargnants sans collecte depuis un nombre de jours choisi." },
  { t: "li", x: "« Objectifs » : cible mensuelle par agence ou par collectrice et taux d'atteinte." },

  { t: "h1", x: "9. Pilotage et contrôle" },
  { t: "li", x: "« Tableau de bord » : chiffres clés du jour et du mois." },
  { t: "li", x: "« Rapports » : synthèses et export au format tableur." },
  { t: "li", x: "« Commissions » : calcul des commissions par période." },
  { t: "li", x: "« Journal » : trace de chaque action, avec auteur, rôle, agence et résultat." },

  { t: "h1", x: "10. Règles importantes" },
  { t: "li", x: "Aucune donnée n'est supprimée : on désactive ou on annule." },
  { t: "li", x: "Chacun ne voit que les données de son agence, sauf la direction et l'administrateur." },
  { t: "li", x: "Les montants sont exprimés en francs CFA (XAF)." },
  { t: "li", x: "Changez votre mot de passe dès la première connexion." },
];

const doc = new jsPDF({ unit: "pt", format: "a4" });
const M = 56;
const L = 595 - M * 2;
let y = M;

const saut = (h: number) => {
  if (y + h > 842 - M) {
    doc.addPage();
    y = M;
  }
};

for (const b of contenu) {
  if (b.t === "saut") {
    y += 14;
    continue;
  }
  const style =
    b.t === "titre"
      ? { size: 22, font: "bold" as const, gap: 18, color: [140, 20, 26] }
      : b.t === "h1"
        ? { size: 14, font: "bold" as const, gap: 8, color: [140, 20, 26] }
        : b.t === "h2"
          ? { size: 11.5, font: "bold" as const, gap: 6, color: [20, 90, 50] }
          : { size: 10.5, font: "normal" as const, gap: 6, color: [30, 30, 30] };

  if (b.t === "h1") y += 10;
  doc.setFont("helvetica", style.font);
  doc.setFontSize(style.size);
  doc.setTextColor(style.color[0]!, style.color[1]!, style.color[2]!);

  const texte = b.t === "li" ? `•  ${b.x}` : b.x;
  const indent = b.t === "li" ? 14 : 0;
  const lignes = doc.splitTextToSize(texte, L - indent) as string[];
  for (const ligne of lignes) {
    saut(style.size + 4);
    doc.text(ligne, M + indent, y);
    y += style.size + 4;
  }
  y += style.gap;
}

const pages = doc.getNumberOfPages();
for (let i = 1; i <= pages; i++) {
  doc.setPage(i);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Mboa Credit Union (COOPCA) — Guide d'utilisation", M, 842 - 30);
  doc.text(`${i} / ${pages}`, 595 - M, 842 - 30, { align: "right" });
}

const chemin = process.argv[2] ?? "/mnt/documents/Guide-utilisation-Mboa-Credit-Union.pdf";
await Bun.write(chemin, doc.output("arraybuffer"));
console.log("PDF écrit :", chemin);
