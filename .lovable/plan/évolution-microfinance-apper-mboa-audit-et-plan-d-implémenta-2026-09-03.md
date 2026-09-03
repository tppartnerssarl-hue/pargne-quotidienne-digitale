# Évolution Microfinance Apper Mboa — audit et plan d'implémentation

## A. Audit de l'existant

**Technique** : React 19 + TypeScript, TanStack Router/Query, Tailwind, Lovable Cloud (PostgreSQL, Auth, RLS). Toute la logique financière passe déjà par des fonctions SQL transactionnelles (`enregistrer_collecte`, `enregistrer_depot`, `enregistrer_retrait`, `enregistrer_vente`, `creer_remise`, `controler_remise`, `annuler_operation`).

**Base de données** : `agence`, `utilisateur`, `role`, `utilisateur_role`, `epargnant`, `livret`, `mouvement_livret`, `operation` (table financière unique, 8 types), `commission`, `regle_commission`, `remise_caisse` + `detail_remise`, `parametre`, `audit`. Soldes calculés par vues (`v_solde_livret`, `v_situation_individuelle`, `v_stock_agence`). Aucune suppression physique (triggers d'interdiction), contre-passation obligatoire.

**Rôles** : ADMINISTRATEUR, DIRECTION, RESPONSABLE_AGENCE, COLLECTRICE, CAISSIER. Cloisonnement par agence via `acces_agence()` / `agence_courante()`.

**Écarts avec la demande** :
| Demande | État |
|---|---|
| Champs client obligatoires (CNI, adresse, téléphone) | Champs présents mais **facultatifs**, aucune validation ni unicité |
| Prix carnet configurable par responsable | Paramètre global `prix_vente_carnet` **vide**, non éditable par le responsable, pas d'historique |
| Interface collectrice restreinte | Menu partiellement filtré ; collectrice voit encore livrets/épargnants d'autres portefeuilles |
| Caisse : dépôt/retrait/vente | Dépôt et retrait OK ; **vente/attribution interdite au caissier** |
| Réception des fonds d'une collectrice | Partiel (`remise_caisse`) mais mono-remise/jour et sans dépôts |
| Écarts collecte/remise | Colonne `ecart` non calculée, pas de tableau de suivi ni de justification |
| Journal d'activité par agence | Table `audit` sans `id_agence`, sans rôle ni résultat, non filtrable par agence |
| Zones de collecte et rappels | **Inexistant** |
| Objectifs employés | **Inexistant** |

## B. Décisions retenues

Prix du carnet : **unique par agence**. Remise : **plusieurs remises par jour**. Écart : **signalement, sans blocage**. Carnets : **attribués à une collectrice, transférables** avec traçabilité.

## C. Plan par lots

### Lot 1 — Fondations clients, carnets, journal

**Base de données**
- `epargnant` : téléphone et adresse rendus obligatoires, `numero_cni` obligatoire et **unique par agence** ; normalisation du téléphone (format international, contrainte de validation par trigger).
- `agence` : nouvelle table `prix_carnet` (agence, montant, date d'effet, utilisateur, actif) → historique complet, jamais d'écrasement. Fonction `prix_carnet_courant(agence)`. Les opérations passées conservent leur montant d'origine (il est déjà figé dans `operation.montant`).
- `livret` : `id_collectrice` déjà présent → nouvelle fonction `attribuer_livrets_collectrice()` et `transferer_livret()`, chaque mouvement écrit dans `mouvement_livret` (types `AFFECTATION_COLLECTRICE`, `TRANSFERT`).
- `audit` : ajout `id_agence`, `code_role`, `resultat`, `contexte`. La fonction `journaliser()` les renseigne automatiquement ; extension des triggers aux remises, prix carnet, écarts, transferts. Lecture réservée à ADMIN, DIRECTION et responsable **de son agence**.

**Interface**
- Formulaire épargnant : champs obligatoires + validation Zod (téléphone, CNI), détection de doublon avant création.
- Fiche épargnant : bloc « livrets détenus » avec historique.
- Recherche client par nom, téléphone ou CNI.
- Page « Prix du carnet » (responsable) : montant courant, modification, historique. Lecture seule pour la collectrice, prix pré-rempli automatiquement à la vente.
- Page « Mes carnets » (collectrice) : carnets attribués, disponibles, attribution à un client. Écran responsable pour affecter/transférer un lot.
- Journal d'agence : filtres par utilisateur, type, période ; lecture seule.

### Lot 2 — Transactions et écarts

- Caissier autorisé à la vente/attribution de carnet (`enregistrer_vente`).
- `remise_caisse` : plusieurs remises par jour et par collectrice ; le montant attendu ne compte que les opérations non encore rattachées. Réception par la caissière : `enregistrer_reception_fonds()` traçant collectrice, caissière, montant, horodatage, référence, observations.
- Nouvelle table `ecart_caisse` : agence, collectrice, date, montant attendu, montant remis, écart, statut (CONFORME / EXCEDENT / DEFICIT), justification, contrôleur. Calculée par `calculer_ecart_journee()`, jamais supprimable, corrections en append-only avec historique.
- Chaque opération enregistre solde avant / solde après (colonnes ajoutées à `operation`, alimentées par les fonctions transactionnelles).
- Écran « Écarts » (responsable/caisse) : suivi par collectrice et par période, saisie des justifications.

### Lot 3 — Zones et rappels

- Tables `zone_collecte` (agence, collectrice, nom, description) et `rappel_collecte` (zone, date, heure, description, priorité, statut TERMINE/REPORTE/PLANIFIE, nombre de clients).
- Écran « Mon planning » (collectrice) : création de zone, planification, rappels du jour sur le tableau de bord, marquage terminé/reporté. Le responsable voit le planning de son agence.

### Lot 4 — Objectifs et performance

- Tables `objectif` (employé, type, valeur cible, période, dates, statut, commentaire) et `type_objectif` (MONTANT_COLLECTE, NOUVEAUX_CLIENTS, CARNETS_VENDUS, NOMBRE_OPERATIONS, QUALITATIF).
- Vue `v_avancement_objectif` calculant la réalisation depuis les opérations réelles.
- Écran responsable : création/attribution/suivi comparé par employé et période. Écran employé : ses objectifs, progression, temps restant, historique.

## D. Sécurité et permissions

Matrice appliquée en base (RLS + contrôles dans les fonctions), l'interface ne fait que masquer.

| | ADMIN | DIRECTION | RESP. AGENCE | COLLECTRICE | CAISSIER |
|---|---|---|---|---|---|
| Clients | tout | lecture | agence | créer/consulter les siens | créer/consulter agence |
| Prix carnet | définir | lecture | **définir** | lecture | lecture |
| Carnets | tout | lecture | affecter/transférer | ses carnets | agence |
| Dépôt / retrait | oui | – | oui | oui | oui |
| Réception des fonds | oui | lecture | lecture | remettre | **réceptionner** |
| Écarts | tout | lecture | contrôler | ses écarts | consulter |
| Journal d'agence | global | global | **son agence** | non | non |
| Zones / rappels | tout | lecture | son agence | les siens | – |
| Objectifs | tout | lecture | créer/suivre | les siens | les siens |

Menu de la collectrice réduit à : Tableau de bord, Mes clients, Mes carnets, Dépôt, Retrait, Mon planning, Mes objectifs, Ma caisse (remises).

## E. Points de vigilance

- Aucune suppression physique ; corrections par contre-passation, déjà en place et étendue aux nouveaux objets.
- Les champs clients devenant obligatoires, les fiches de démonstration incomplètes seront complétées lors de la migration pour ne pas bloquer les modifications.
- L'unicité de la CNI est appliquée par agence pour éviter les blocages inter-réseau ; à confirmer si une unicité globale est souhaitée.
- Rappels : uniquement dans l'application (aucune notification mobile), conformément au périmètre actuel.
- Conservation des logs : illimitée pour l'instant, purge à définir ultérieurement.

## F. Ordre d'exécution

Lot 1 → Lot 2 → Lot 3 → Lot 4, chaque lot livré avec sa migration, ses écrans et un contrôle de bout en bout des rôles concernés.
