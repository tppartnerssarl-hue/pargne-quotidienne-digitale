# Plateforme de gestion d'épargne quotidienne — Architecture

## A. Architecture fonctionnelle

16 modules regroupés en 5 domaines :

- **Socle** : Authentification, Tableau de bord, Recherche globale
- **Référentiel** : Agences, Utilisateurs & Rôles, Épargnants, Livrets, Stock
- **Opérations** : Vente de livret, Collectes, Retraits, Situation individuelle
- **Finance** : Commissions (règles + périodes), Caisse (remises & écarts)
- **Pilotage** : Rapports, Exports, Audit

```text
Auth ──► Session + rôles + agence
          │
          ├─ Référentiel (agences, utilisateurs, épargnants, livrets)
          ├─ Opérations  (vente, collecte, retrait) ──► table OPERATION unique
          ├─ Finance     (commission, remise_caisse) ──► adossé aux opérations
          └─ Pilotage    (vues calculées, exports, audit)
```

Principe central : **toute écriture financière est une ligne d'`operation`**. Soldes, stock, situation individuelle et tableaux de bord sont **calculés** (vues SQL), jamais stockés en double.

## B. Architecture technique

- Frontend : React 19 + TypeScript, TanStack Router/Query, Tailwind, composants shadcn — interface entièrement en français, mobile-first pour l'écran de collecte.
- Backend : Lovable Cloud (PostgreSQL + Auth + RLS + fonctions serveur).
- Logique sensible (vente, collecte, retrait, validation, remise) exécutée dans des **fonctions SQL transactionnelles** appelées via des fonctions serveur : atomicité, contrôle des règles, écriture de l'audit dans la même transaction.
- Validation en double couche : Zod côté client, contraintes CHECK/UNIQUE/FK + fonctions de validation côté base.
- Configuration (devise, format, fuseau, règles à valider) dans une table `parametre` — aucune valeur métier codée en dur.
- Audit alimenté par triggers PostgreSQL sur les tables sensibles.

## C. Schéma de base de données (3NF)

```text
agence 1─* utilisateur *─* role            (utilisateur_role)
agence 1─* livret *─1 epargnant
livret 1─* mouvement_livret                (historique de statut, append-only)
livret 1─* operation *─1 type_operation
operation *─1 utilisateur
operation 1─* commission *─1 regle_commission
commission *─1 periode_commission
remise_caisse 1─* detail_remise *─1 operation
audit (journal générique)
parametre (configuration, incl. règles « À VALIDER »)
```

Vues calculées : `v_solde_livret`, `v_situation_individuelle` (solde progressif), `v_stock_agence`, `v_dashboard_*`.

Intégrité clé :
- `numero_livret`, `numero_client`, `code` agence, `reference` opération : UNIQUE.
- Index : numero_livret, numero_client, telephone, reference, date_operation, id_agence, id_epargnant, id_utilisateur.
- Un livret ne peut être rattaché qu'à un seul épargnant actif (contrainte partielle unique) → pas de double attribution.
- Aucune suppression physique d'une opération VALIDEE : correction par opération de contre-passation (statut REVERSEE + lien d'origine).
- Suppression logique via `statut` partout.

## D. Rôles et permissions (RBAC + RLS)

| Domaine | ADMIN | DIRECTION | RESP_AGENCE | COLLECTRICE | CAISSIER |
|---|---|---|---|---|---|
| Utilisateurs/rôles | CRUD | lecture | – | – | – |
| Agences | CRUD | lecture | lecture (sienne) | – | – |
| Paramètres & règles commission | CRUD | lecture | – | – | – |
| Épargnants / livrets | CRUD | lecture | CRUD (agence) | lecture (siens) | lecture |
| Attribution livret | oui | – | oui | – | – |
| Vente | oui | – | oui | oui | – |
| Collecte | oui | – | lecture | création | – |
| Retrait | oui | – | selon droit | – | création |
| Remise de caisse | oui | lecture | agence | déclaration | contrôle/validation |
| Validation opérations | oui | oui | selon type | – | caisse |
| Rapports / exports | global | global | agence | ses opérations | caisse |
| Audit | oui | lecture | – | – | – |

Implémentation : table `role`, `utilisateur_role`, fonctions `security definer` `a_role(uid, code)` et `agence_courante(uid)` (aucune récursion RLS), puis policies RLS par table. Cloisonnement par agence appliqué en base ; la collectrice ne voit que ses propres livrets/opérations. Le frontend ne fait que masquer, jamais sécuriser.

## E. Workflows principaux

1. **Réception de stock** : création de livrets statut EN_STOCK + `mouvement_livret` RECEPTION.
2. **Vente/attribution** : sélection livret EN_STOCK → création ou sélection épargnant → opération ACHAT_CARNET → statut ATTRIBUE/ACTIF → mouvement + commission éventuelle si une règle active existe → reçu. Verrou transactionnel : impossible d'attribuer deux fois.
3. **Collecte** (mobile, < 10 s) : saisie/scan du numéro de livret → épargnant + solde affichés → montant → confirmation → opération COLLECTE.
4. **Retrait** : recherche livret → solde → montant → contrôle des règles **configurées** (si non définies : message « Règle à définir ») → commission éventuelle → confirmation → opération RETRAIT → validation caissier.
5. **Remise de caisse** : sélection des opérations d'une période → montant attendu calculé vs déclaré vs contrôlé → écart → validation caissier.
6. **Commissions** : règles versionnées (date_debut/date_fin), calcul par période, statut et validation.
7. **Correction** : annulation/contre-passation, jamais de DELETE.

## F. Risques identifiés

- Saisie hors connexion sur le terrain : non couverte tant que la règle n'est pas définie (risque de perte de saisie).
- Cohérence des soldes si des opérations sont validées en masse : atténué par calcul en vue + transactions.
- Volume des collectes (forte cardinalité) : index et pagination obligatoires ; partitionnement à envisager plus tard.
- Écarts de caisse récurrents : nécessite une politique de traitement des écarts (non fournie).
- Migration des données Excel existantes : non traitée dans cette phase.

## G. Éléments métier restant à valider (« À VALIDER »)

1. Taux et paliers exacts des commissions (vente, retrait, mensuelle).
2. Montant minimum / maximum de retrait, préavis, pénalités.
3. Retrait supérieur au solde : autorisé ou interdit ?
4. Qui valide un retrait, et à partir de quel montant ?
5. Prix de vente du carnet et sa part de commission.
6. Politique de correction/annulation d'une collecte (délai, rôle habilité).
7. Politique de clôture d'un livret et sort du solde résiduel.
8. Collecte multi-jours en une saisie : autorisée ou non.
9. Fonctionnement hors connexion.
10. Devise, fuseau et format d'affichage à confirmer (par défaut XAF, Afrique/Douala).

Tous ces points seront implémentés comme **paramètres configurables**, jamais codés en dur.

## Livraison par phases

Phase 1 base de données + RLS · Phase 2 auth/RBAC · Phase 3 agences/utilisateurs · Phase 4 épargnants/livrets/stock · Phase 5 vente · Phase 6 collectes · Phase 7 retraits · Phase 8 situation · Phase 9 commissions · Phase 10 caisse · Phase 11 rapports/exports · Phase 12 audit · Phase 13 tests.

Après validation de ce document, je démarre la Phase 1 (activation du backend, schéma, contraintes, RLS, données de démonstration clairement marquées comme données de test).
