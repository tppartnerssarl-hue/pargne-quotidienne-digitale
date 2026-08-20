# Plateforme de gestion d'épargne quotidienne

> Application web de gestion complète d'une société d'épargne quotidienne — multi-agences, mobile-first, conçue pour le contexte camerounais (devise XAF/FCFA, fuseau Africa/Douala).

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Prérequis](#3-prérequis)
4. [Installation et démarrage](#4-installation-et-démarrage)
5. [Variables d'environnement](#5-variables-denvironnement)
6. [Structure du projet](#6-structure-du-projet)
7. [Base de données](#7-base-de-données)
8. [Authentification et rôles](#8-authentification-et-rôles)
9. [Modules et fonctionnalités](#9-modules-et-fonctionnalités)
10. [Données de démonstration](#10-données-de-démonstration)
11. [Workflows métier](#11-workflows-métier)
12. [Paramètres configurables](#12-paramètres-configurables)
13. [Sécurité et audit](#13-sécurité-et-audit)
14. [Commandes utiles](#14-commandes-utiles)
15. [Déploiement](#15-déploiement)
16. [Points en attente de validation métier](#16-points-en-attente-de-validation-métier)

---

## 1. Présentation du projet

Cette plateforme numérise les opérations d'une société d'épargne quotidienne : vente de carnets (livrets), collectes journalières sur le terrain, retraits en caisse, gestion des commissions des collectrices et réconciliation de caisse. Elle remplace les fichiers Excel par un système centralisé, multi-agences, avec traçabilité complète.

**Principes clés :**
- Toute écriture financière est une ligne dans la table `operation` — soldes et tableaux de bord sont **calculés** depuis des vues SQL, jamais stockés en double.
- Les opérations validées sont **immuables** : la correction se fait par contre-passation, jamais par modification directe.
- Toutes les règles métier sensibles (montants, taux, politiques) sont des **paramètres configurables**, jamais codées en dur.

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Framework UI | React 19 + TypeScript |
| Meta-framework | TanStack Start (SSR, routage par fichiers) |
| Routeur | TanStack Router v1.170 |
| Gestion de données | TanStack Query v5 |
| Composants | shadcn/ui (Radix UI) |
| Styles | Tailwind CSS v4 |
| Backend / BDD | Supabase (PostgreSQL + Auth + RLS + fonctions SQL) |
| Formulaires | react-hook-form + Zod |
| Graphiques | Recharts |
| Icônes | Lucide React |
| Build | Vite v8 |
| Runtime / déploiement | Nitro → Cloudflare Workers |
| Plateforme | Lovable Cloud (synchronisation Git ↔ éditeur Lovable) |

---

## 3. Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 10 (ou pnpm/yarn)
- Un projet **Supabase** actif (gratuit ou payant)
- Accès à la **CLI Supabase** pour appliquer les migrations (optionnel si utilisation de l'interface Supabase)

---

## 4. Installation et démarrage

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd pargne-quotidienne-digitale

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement (voir section 5)
cp .env .env.local
# Renseigner les valeurs Supabase dans .env.local

# 4. Appliquer les migrations Supabase
npx supabase db push
# ou depuis le tableau de bord Supabase : SQL Editor → exécuter les fichiers du dossier supabase/migrations/

# 5. Démarrer le serveur de développement
npm run dev
```

L'application est disponible par défaut sur `http://localhost:3000`.

---

## 5. Variables d'environnement

Créer un fichier `.env.local` à la racine en copiant `.env` et en renseignant les valeurs depuis le tableau de bord Supabase (Projet → Settings → API) :

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (`anon` key) Supabase |
| `SUPABASE_URL` | Même URL (utilisée côté serveur SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | Même clé publique (côté serveur) |
| `SUPABASE_PROJECT_ID` | ID du projet Supabase |
| `VITE_SUPABASE_PROJECT_ID` | Même ID (côté client) |

> **Ne jamais exposer** la clé `service_role` dans le code frontend. Elle n'est utilisée que via les fonctions SQL `SECURITY DEFINER`.

---

## 6. Structure du projet

```
pargne-quotidienne-digitale/
├── supabase/
│   └── migrations/           # Migrations SQL (schéma, RLS, données de démo)
├── src/
│   ├── routes/
│   │   ├── auth.tsx          # Page de connexion / inscription
│   │   ├── index.tsx         # Redirection vers le tableau de bord
│   │   └── _authenticated/   # Toutes les pages protégées (session requise)
│   │       ├── route.tsx     # Garde d'authentification + layout principal
│   │       ├── tableau-de-bord.tsx
│   │       ├── collecte.tsx
│   │       ├── vente.tsx
│   │       ├── retraits.tsx
│   │       ├── caisse.tsx
│   │       ├── commissions.tsx
│   │       ├── epargnants.index.tsx / epargnants.$id.tsx
│   │       ├── livrets.index.tsx / livrets.$id.tsx
│   │       ├── stock.tsx
│   │       ├── rapports.tsx
│   │       ├── recherche.tsx
│   │       ├── agences.tsx
│   │       ├── utilisateurs.tsx
│   │       ├── parametres.tsx
│   │       └── audit.tsx
│   ├── components/
│   │   ├── commun/           # CarteStat, Badges, EnTetePage, Etats
│   │   ├── layout/           # AppLayout (sidebar + nav mobile), navigation.ts
│   │   └── ui/               # Composants shadcn/ui (~40 composants)
│   ├── hooks/
│   │   ├── useAuth.tsx       # Contexte auth : user, profil, roles, aRole()
│   │   └── useConfiguration.ts # Lecture de la table parametre
│   ├── integrations/supabase/
│   │   ├── client.ts         # Client Supabase (SSR-safe)
│   │   └── types.ts          # Types générés depuis la BDD
│   └── lib/
│       ├── constantes.ts     # Enums des rôles, statuts, types d'opération
│       └── format.ts         # Helpers de formatage (montants, dates)
├── public/
│   └── mboacreditunion.jpg   # Logo de l'application
├── .env                      # Template des variables d'environnement
├── package.json
└── vite.config.ts
```

---

## 7. Base de données

### Schéma principal

| Table | Rôle |
|---|---|
| `agence` | Agences / points de collecte |
| `role` | Les 5 rôles du système |
| `utilisateur` | Profils utilisateurs (liés à Supabase Auth) |
| `utilisateur_role` | Association utilisateur ↔ rôle |
| `epargnant` | Clients épargnants (numéro client unique) |
| `livret` | Carnets d'épargne (cycle de vie : EN_STOCK → ACTIF → CLOTURE) |
| `mouvement_livret` | Historique append-only des changements de statut du livret |
| `type_operation` | Référentiel des types d'opérations |
| `operation` | **Table centrale** — toutes les écritures financières |
| `regle_commission` | Règles de commission versionnées par dates |
| `periode_commission` | Périodes mensuelles de commission |
| `commission` | Commissions calculées et enregistrées |
| `remise_caisse` | Remises de caisse des collectrices |
| `detail_remise` | Détail des opérations incluses dans une remise |
| `parametre` | Configuration métier clé-valeur |
| `audit` | Journal de toutes les modifications sensibles |

### Vues calculées

| Vue | Description |
|---|---|
| `v_solde_livret` | Solde courant de chaque livret (somme des opérations validées) |
| `v_situation_individuelle` | Relevé de compte avec solde progressif (window function SQL) |
| `v_stock_agence` | Synthèse du stock par agence et par statut de livret |

### Cycle de vie d'un livret

```
EN_STOCK → ATTRIBUE → ACTIF → CLOTURE
                    ↓           ↑
                  BLOQUE ───────┘
                    ↓
                  PERDU
```

### Statuts d'une opération

| Statut | Description |
|---|---|
| `BROUILLON` | Saisie en cours, non finalisée |
| `EN_ATTENTE` | Soumise, en attente de validation |
| `VALIDEE` | Validée et comptabilisée (immuable) |
| `ANNULEE` | Annulée avant validation |
| `REVERSEE` | Contre-passée après validation (opération de correction créée) |

---

## 8. Authentification et rôles

### Connexion

L'application utilise **Supabase Auth** (email + mot de passe). À la première inscription, le compte est automatiquement créé en tant qu'**Administrateur** (via un trigger PostgreSQL).

Les utilisateurs suivants sont **pré-créés pour l'administrateur** depuis le backoffice Supabase (tableau de bord → Authentication → Users), puis liés automatiquement à leur profil applicatif au premier login.

### Rôles disponibles

| Code | Libellé | Périmètre |
|---|---|---|
| `ADMINISTRATEUR` | Administrateur | Accès total, gestion système |
| `DIRECTION` | Direction | Consultation globale, validation |
| `RESPONSABLE_AGENCE` | Responsable d'agence | Gestion opérationnelle de son agence |
| `COLLECTRICE` | Collectrice | Ventes et collectes terrain |
| `CAISSIER` | Caissier | Retraits, contrôle de caisse |

### Matrice des permissions (résumé)

| Module | ADMIN | DIRECTION | RESP. AGENCE | COLLECTRICE | CAISSIER |
|---|:---:|:---:|:---:|:---:|:---:|
| Tableau de bord | ✅ | ✅ | ✅ | ✅ | ✅ |
| Collecte | ✅ | — | ✅ | ✅ | — |
| Vente de livret | ✅ | — | ✅ | ✅ | — |
| Retraits | ✅ | ✅ | ✅ | — | ✅ |
| Caisse | ✅ | ✅ | ✅ | ✅ (déclaration) | ✅ |
| Épargnants / Livrets | ✅ | lecture | ✅ | lecture (siens) | lecture |
| Stock | ✅ | lecture | ✅ | — | — |
| Commissions | ✅ | ✅ | lecture | — | — |
| Rapports | ✅ | global | agence | ses opérations | caisse |
| Agences | ✅ | lecture | — | — | — |
| Utilisateurs | ✅ | lecture | — | — | — |
| Paramètres | ✅ | lecture | — | — | — |
| Audit | ✅ | lecture | — | — | — |

> La sécurité est appliquée **en base de données via RLS** (Row Level Security). L'interface ne fait que masquer les entrées non autorisées.

---

## 9. Modules et fonctionnalités

### Tableau de bord (`/tableau-de-bord`)
Vue d'ensemble de l'activité : nombre d'épargnants actifs, livrets en stock, collectes du jour, retraits, commissions et état de la caisse. Les chiffres sont calculés en temps réel depuis les vues SQL.

### Collecte (`/collecte`)
Saisie optimisée mobile (< 10 secondes par opération) :
1. Scanner ou saisir le numéro de livret
2. Vérification automatique : épargnant + solde affiché
3. Saisir le montant
4. Confirmer → opération `COLLECTE` créée et validée immédiatement

> Accessible sur mobile via la barre de navigation inférieure.

### Vente de livret (`/vente`)
1. Sélectionner un livret disponible (`EN_STOCK`) dans l'agence
2. Créer ou sélectionner un épargnant existant
3. Enregistrer l'opération `ACHAT_CARNET` (paiement du carnet)
4. Le livret passe automatiquement au statut `ACTIF`
5. Une commission est calculée si une règle active existe

### Retraits (`/retraits`)
1. Rechercher le livret par numéro ou nom de l'épargnant
2. Affichage du solde disponible
3. Saisir le montant (contrôlé selon les paramètres min/max configurés)
4. L'opération passe en `EN_ATTENTE` si la validation caissier est requise, sinon `VALIDEE` directement

### Situation individuelle (`/epargnants/$id`)
Relevé complet d'un épargnant : toutes ses opérations avec solde progressif, calculé depuis `v_situation_individuelle`.

### Caisse (`/caisse`)
**Workflow de remise de caisse :**
1. La collectrice déclare sa remise : montant déclaré + liste des opérations de la journée
2. Le caissier contrôle : saisit le montant physiquement compté (`montant_controle`)
3. Validation finale : l'écart est calculé automatiquement (`montant_controle - montant_attendu`)

### Commissions (`/commissions`)
Gestion des règles de commission versionnées :
- **FIXE** : montant fixe par opération
- **TAUX** : pourcentage du montant de base
- **PALIER** : montant ou taux selon des seuils min/max
- **À_DÉFINIR** : règle inactive en attente de validation des taux

Les commissions sont calculées automatiquement à l'enregistrement des opérations.

### Épargnants (`/epargnants`)
Liste, recherche (nom, téléphone, numéro client) et fiche détaillée de chaque épargnant avec son historique de livrets et d'opérations.

### Livrets (`/livrets`)
Liste et fiche détaillée de chaque livret avec l'historique complet des mouvements (`mouvement_livret`).

### Stock (`/stock`)
Vue synthétique du stock de livrets par agence : total reçu, disponibles, attribués, actifs, bloqués, clôturés, perdus. Calculé depuis `v_stock_agence`.

### Rapports (`/rapports`)
Rapports filtrables par période, agence et utilisateur. Exportables.

### Recherche globale (`/recherche`)
Recherche cross-entités : numéro de livret, numéro client, nom/prénom, téléphone, référence d'opération.

### Administration

| Page | URL | Fonctions |
|---|---|---|
| Agences | `/agences` | Créer/modifier les agences |
| Utilisateurs | `/utilisateurs` | Créer des comptes, attribuer des rôles |
| Paramètres | `/parametres` | Configurer les règles métier |
| Audit | `/audit` | Consulter le journal complet des modifications |

---

## 10. Données de démonstration

Les migrations incluent des données de démo **marquées `est_demo = true`** pour permettre des tests sans impacter les données réelles.

**Agences de démo :**
- `AG-DLA` — Agence Douala Centre (Akwa)
- `AG-YDE` — Agence Yaoundé (Mvog-Mbi)

**Utilisateurs de démo** (à activer depuis Supabase Auth → Users) :

| Email | Rôle |
|---|---|
| `demo.responsable@example.test` | Responsable d'agence (Douala) |
| `demo.collectrice1@example.test` | Collectrice (Douala) |
| `demo.collectrice2@example.test` | Collectrice (Douala) |
| `demo.caissier@example.test` | Caissier (Douala) |

**Données pré-chargées :** 6 épargnants, 12 livrets (6 actifs + 6 en stock), collectes générées tous les 3 jours depuis la date d'activation, 2 retraits.

> Pour supprimer les données de démo en production : `DELETE FROM <table> WHERE est_demo = true;`

---

## 11. Workflows métier

### Démarrage d'une nouvelle agence

1. Admin → `/agences` → Créer une agence (code, nom, adresse, téléphone)
2. Admin → `/utilisateurs` → Créer les comptes (email) + attribuer les rôles
3. Les utilisateurs reçoivent un email de Supabase Auth et se connectent
4. Resp. d'agence → `/stock` → Réceptionner les premiers livrets (saisie des numéros)

### Premier cycle journalier (collectrice)

```
Matin :
  Collectrice → /collecte → Saisir les collectes terrain une par une

Fin de journée :
  Collectrice → /caisse → Déclarer la remise (montant remis physiquement)
  Caissier → /caisse → Contrôler + valider la remise
```

### Enregistrement d'un retrait

```
Caissier / Resp. agence → /retraits
  → Rechercher le livret
  → Vérifier le solde
  → Saisir le montant
  → Confirmer (si validation caissier configurée : statut EN_ATTENTE)
  → Caissier valide l'opération EN_ATTENTE
```

### Correction d'une opération validée

Les opérations validées **ne peuvent pas être modifiées directement**. La correction passe par :

```
Admin / Direction / Resp. agence → /retraits ou /collecte
  → Trouver l'opération
  → Annuler avec motif obligatoire
  → Une opération de contre-passation est créée automatiquement
  → L'opération originale passe au statut REVERSEE
```

---

## 12. Paramètres configurables

Accessibles depuis `/parametres` (ADMIN ou DIRECTION uniquement).

| Clé | Type | Description | Valeur par défaut |
|---|---|---|---|
| `devise_code` | Texte | Code ISO de la devise | `XAF` |
| `devise_libelle` | Texte | Libellé affiché | `FCFA` |
| `fuseau_horaire` | Texte | Fuseau horaire système | `Africa/Douala` |
| `retrait_montant_min` | Nombre | Montant minimum de retrait | *À définir* |
| `retrait_montant_max` | Nombre | Montant maximum de retrait | *À définir* |
| `retrait_solde_negatif_autorise` | Booléen | Autoriser un retrait supérieur au solde | `false` |
| `retrait_validation_obligatoire` | Booléen | Retrait doit être validé par un caissier | `true` |
| `collecte_multi_jours_autorisee` | Booléen | Saisie de plusieurs jours en une collecte | `false` |
| `collecte_correction_delai_heures` | Nombre | Délai de correction d'une collecte | *À définir* |
| `prix_vente_carnet` | Nombre | Prix de vente du carnet | *À définir* |
| `cloture_livret_politique` | Texte | Politique de clôture | *À définir* |
| `mode_hors_connexion` | Booléen | Fonctionnement hors connexion | `false` |

> Les paramètres marqués *À définir* sont inactifs (`a_valider = true`). L'application affiche un message d'avertissement si une règle non configurée est sollicitée.

---

## 13. Sécurité et audit

### Sécurité en base

- **RLS activée sur toutes les tables** : cloisonnement par agence, restriction par rôle, séparation collectrice/caissier
- **Fonctions `SECURITY DEFINER`** : la logique critique (vente, collecte, retrait, remise) s'exécute côté serveur avec les droits nécessaires — le client n'a pas accès direct à ces opérations
- **Triggers d'intégrité** :
  - `protege_operation` : bloque toute modification directe d'une opération VALIDEE
  - `interdit_suppression` : bloque les `DELETE` physiques sur `operation`, `livret`, `epargnant`
- **Séquences de références** : toutes les références (opérations, commissions, remises) sont générées atomiquement (`OP-YYYYMM-000001`, `CM-...`, `RM-...`)

### Journal d'audit

Chaque modification sur les tables sensibles (opération, livret, épargnant, utilisateur, paramètre, remise) génère automatiquement une entrée dans `audit` via trigger :
- Utilisateur + auth_user_id
- Horodatage
- Table cible + ID de l'enregistrement
- Ancienne valeur (JSONB) → Nouvelle valeur (JSONB)

Consultation : `/audit` (ADMINISTRATEUR et DIRECTION uniquement).

### Validation en double couche

| Couche | Outil |
|---|---|
| Client | Zod (schémas de formulaires) |
| Base de données | Contraintes CHECK, UNIQUE, FK + fonctions de validation |

---

## 14. Commandes utiles

```bash
# Démarrer en développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint

# Formater le code
npm run format
```

### Commandes Supabase

```bash
# Appliquer les migrations
npx supabase db push

# Générer les types TypeScript depuis la BDD
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts

# Voir les logs en local
npx supabase db logs
```

---

## 15. Déploiement

Le projet est configuré pour Cloudflare Workers via Nitro. Le build génère le dossier `.output/`.

```bash
# Build pour Cloudflare
npm run build

# Déployer via Wrangler (Cloudflare)
npx wrangler deploy .output/server/index.mjs
```

**Intégration Lovable :**
Ce projet est connecté à l'éditeur [Lovable](https://lovable.dev). Les commits sur la branche principale se synchronisent automatiquement. Ne pas forcer les pushs (`force push`), rebaser ou amender des commits déjà publiés — cela réécrit l'historique côté Lovable.

---

## 16. Points en attente de validation métier

Ces règles sont marquées `a_valider = true` dans la table `parametre` et doivent être configurées avant la mise en production :

1. **Taux et paliers des commissions** : vente, retrait, commission mensuelle
2. **Montants min/max de retrait** et politique de préavis
3. **Retrait supérieur au solde** : autorisé ou interdit ?
4. **Qui valide un retrait** et à partir de quel seuil ?
5. **Prix de vente du carnet** et sa part de commission
6. **Politique de correction d'une collecte** : délai, rôle habilité
7. **Politique de clôture d'un livret** : sort du solde résiduel
8. **Collecte multi-jours** en une saisie : autorisée ou non
9. **Fonctionnement hors connexion** : saisie différée (non implémentée)
10. **Devise et format d'affichage** à confirmer (défaut : XAF, Afrique/Douala)

> Tant qu'un paramètre n'est pas défini, l'application affiche un message « Règle à définir » au lieu de bloquer silencieusement.

---

## Licence

Usage interne — tous droits réservés.
