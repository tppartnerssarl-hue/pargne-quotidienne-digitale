# Guide d'utilisation — Plateforme d'épargne quotidienne

> Ce guide est destiné aux utilisateurs finaux de l'application : administrateurs, responsables d'agence, collectrices et caissiers. Il décrit chaque écran, chaque action et les règles à connaître pour utiliser la plateforme au quotidien.

---

## Table des matières

1. [Premiers pas — Connexion et navigation](#1-premiers-pas--connexion-et-navigation)
2. [Tableau de bord](#2-tableau-de-bord)
3. [Enregistrer une collecte](#3-enregistrer-une-collecte)
4. [Vendre un livret](#4-vendre-un-livret)
5. [Enregistrer un retrait](#5-enregistrer-un-retrait)
6. [Remises de caisse](#6-remises-de-caisse)
7. [Épargnants — Répertoire et fiche individuelle](#7-épargnants--répertoire-et-fiche-individuelle)
8. [Livrets](#8-livrets)
9. [Stock de livrets](#9-stock-de-livrets)
10. [Commissions](#10-commissions)
11. [Rapports](#11-rapports)
12. [Administration — Agences](#12-administration--agences)
13. [Administration — Utilisateurs et rôles](#13-administration--utilisateurs-et-rôles)
14. [Administration — Paramètres](#14-administration--paramètres)
15. [Journal d'audit](#15-journal-daudit)
16. [Recherche globale](#16-recherche-globale)
17. [Questions fréquentes](#17-questions-fréquentes)

---

## 1. Premiers pas — Connexion et navigation

### Se connecter

1. Ouvrez l'application dans votre navigateur.
2. Sur la page de connexion, saisissez votre **adresse email** et votre **mot de passe**.
3. Cliquez sur **Se connecter**.

Si c'est votre toute première utilisation et qu'aucun compte n'existe encore, le premier compte créé devient automatiquement **Administrateur**.

> Si vous obtenez le message « Compte non rattaché », cela signifie que votre adresse email n'existe pas encore dans la liste des utilisateurs de l'application. Contactez un administrateur pour qu'il crée votre profil avec la bonne adresse.

### Changer de mot de passe / s'inscrire

Si un administrateur vient de créer votre profil, rendez-vous sur la page de connexion et utilisez l'option **Créer un compte** avec l'adresse email que l'administrateur a enregistrée. Votre profil et votre rôle seront automatiquement associés.

### Navigation

**Sur ordinateur** : un menu latéral à gauche regroupe toutes les pages en quatre groupes :

| Groupe | Pages incluses |
|---|---|
| Pilotage | Tableau de bord, Commissions, Rapports |
| Opérations | Collecte, Vente de livret, Retraits, Caisse |
| Référentiel | Épargnants, Livrets, Stock |
| Administration | Agences, Utilisateurs, Paramètres, Audit |

**Sur mobile** : une barre de navigation apparaît en bas de l'écran avec les actions les plus courantes (Tableau de bord, Collecte, Vente, Retraits).

Vous ne verrez que les pages auxquelles votre rôle vous donne accès. Les pages cachées ne signifient pas un dysfonctionnement.

---

## 2. Tableau de bord

**Accès :** tous les utilisateurs connectés.

Le tableau de bord vous accueille dès la connexion. Il affiche les indicateurs clés de votre agence (ou de toutes les agences pour les rôles Direction et Administrateur).

### Indicateurs du jour et du mois

| Carte | Ce qu'elle affiche |
|---|---|
| **Collectes du jour** | Somme des collectes validées aujourd'hui + total du mois |
| **Retraits du jour** | Somme des retraits validés aujourd'hui + total du mois |
| **Épargnants** | Nombre total d'épargnants actifs + livrets actifs |
| **Livrets disponibles** | Livrets en stock disponibles pour attribution + total |
| **Ventes de carnets (mois)** | Montant total des carnets vendus ce mois |
| **Remises à contrôler** | Nombre de remises déclarées non encore validées |
| **Écart de caisse cumulé** | Somme des écarts sur les remises validées |

### Tableau de stock par agence

Visible pour les rôles Administrateur, Direction et Responsable d'agence. Il montre, pour chaque agence, le nombre de livrets reçus, disponibles, actifs, bloqués et clôturés.

> Les chiffres sont recalculés en temps réel à chaque chargement de la page. Aucune valeur n'est stockée manuellement.

---

## 3. Enregistrer une collecte

**Accès :** Administrateur, Responsable d'agence, Collectrice.  
**Chemin :** Menu → Opérations → **Collecte**

L'écran de collecte est conçu pour être utilisé rapidement sur le terrain, y compris sur téléphone mobile.

### Étape 1 — Trouver le livret

Dans le champ de recherche, saisissez **au moins 2 caractères** :
- le **numéro du livret** (ex. `LV-000012`), ou
- le **nom ou prénom** de l'épargnant.

Une liste de livrets actifs correspondants apparaît. Tapez sur le livret souhaité pour le sélectionner.

> Seuls les livrets au statut **Actif** peuvent recevoir une collecte. Si le livret ne s'affiche pas, vérifiez son statut dans la page Livrets.

### Étape 2 — Vérifier l'épargnant et le solde

Après sélection, l'écran affiche :
- Le numéro du livret et le nom de l'épargnant
- Le **solde actuel** du livret (calculé depuis toutes les opérations validées)
- Les **5 dernières opérations** pour vérification rapide

Si ce n'est pas le bon livret, cliquez sur **Changer** pour revenir à la recherche.

### Étape 3 — Saisir le montant et la date

- **Montant collecté** : saisissez le montant en chiffres entiers (en FCFA). Le clavier numérique s'affiche automatiquement sur mobile.
- **Date de collecte** : par défaut, la date du jour. Vous pouvez indiquer une date passée si la collecte n'a pas pu être saisie immédiatement. La date ne peut pas être dans le futur.

### Étape 4 — Confirmer

Cliquez sur **Enregistrer la collecte**. Une fenêtre de confirmation s'affiche avec le résumé de l'opération. Vérifiez les informations puis cliquez sur **Confirmer**.

Un message de succès confirme l'enregistrement. Le solde du livret est mis à jour immédiatement.

### Erreurs fréquentes

| Message d'erreur | Cause et solution |
|---|---|
| « Le livret n'est pas actif » | Le livret est bloqué, clôturé ou en stock. Vérifiez son statut. |
| « Ce livret n'est pas rattaché à votre portefeuille » | Votre rôle Collectrice ne vous donne accès qu'à vos propres livrets. |
| « Le montant doit être strictement positif » | Saisissez un montant supérieur à zéro. |
| « La date de collecte ne peut pas être future » | Corrigez la date saisie. |

---

## 4. Vendre un livret

**Accès :** Administrateur, Responsable d'agence, Collectrice.  
**Chemin :** Menu → Opérations → **Vente de livret**

Cette opération enregistre la vente d'un carnet d'épargne vierge à un client et l'active en une seule transaction.

### Étape 1 — Trouver l'épargnant

Utilisez le champ **Rechercher un épargnant** pour filtrer par nom, prénom ou numéro client. Sélectionnez ensuite l'épargnant dans la liste déroulante.

> L'épargnant doit exister préalablement dans le répertoire. S'il est nouveau, créez d'abord sa fiche depuis **Épargnants → Nouvel épargnant** avant de revenir sur cette page.

### Étape 2 — Choisir un livret disponible

La liste déroulante **Livret disponible** affiche uniquement les livrets au statut **En stock** dans votre agence. Sélectionnez-en un.

> Si la liste est vide, il n'y a plus de livrets en stock. Un responsable d'agence ou un administrateur doit en réceptionner depuis la page **Stock**.

### Étape 3 — Renseigner le prix et la date

- **Prix du carnet** : si un prix par défaut est configuré dans les paramètres, il est pré-rempli. Modifiez-le si nécessaire.
- **Date de vente** : par défaut aujourd'hui. Peut être ajustée vers une date passée.

### Étape 4 — Valider

Cliquez sur **Attribuer le livret**. En cas de succès :
- Le livret passe du statut **En stock** à **Actif**
- Une opération `ACHAT_CARNET` est créée et validée
- Une commission est calculée automatiquement si une règle active existe

Un message de confirmation s'affiche. Le livret attribué disparaît de la liste des disponibles.

### Règles importantes

- Un livret ne peut être attribué qu'à **un seul épargnant**. L'attribution double est bloquée en base de données.
- L'épargnant et le livret doivent appartenir à la **même agence**.

---

## 5. Enregistrer un retrait

**Accès :** Administrateur, Direction, Responsable d'agence, Caissier.  
**Chemin :** Menu → Opérations → **Retraits**

### Saisir un retrait

1. **Sélectionnez le livret** dans la liste déroulante. Chaque livret affiche son solde actuel entre parenthèses pour faciliter la vérification.
2. Le **solde disponible** s'affiche en grand sous la sélection.
3. Saisissez le **montant du retrait**.
4. Si le montant dépasse le solde, un avertissement rouge s'affiche et le bouton reste désactivé (sauf si le paramètre « solde négatif autorisé » est activé dans les paramètres).
5. Vérifiez la **date** (aujourd'hui par défaut).
6. Cliquez sur **Enregistrer le retrait**.
7. Une fenêtre de confirmation affiche le montant, le livret et le solde après opération. Confirmez.

### Statut de l'opération

Selon la configuration :
- Si **validation caissier obligatoire** : l'opération est créée au statut **En attente**. Un caissier devra la valider.
- Si **validation non requise** ou si vous êtes caissier : l'opération est directement **Validée**.

### Tableau des derniers retraits

La partie droite de l'écran affiche les 15 derniers retraits de l'agence avec leur référence, date, montant et statut. Les statuts possibles sont :

| Statut | Signification |
|---|---|
| **En attente** | Retrait enregistré, en attente de validation caissier |
| **Validée** | Retrait décaissé et comptabilisé |
| **Annulée** | Retrait annulé avant validation |
| **Contre-passée** | Retrait validé puis annulé par contre-passation |

---

## 6. Remises de caisse

**Accès :** tous les rôles (déclaration) ; Caissier, Responsable d'agence, Administrateur (contrôle).  
**Chemin :** Menu → Opérations → **Caisse**

La remise de caisse permet à une collectrice de déclarer le montant physique remis au caissier en fin de journée, et au caissier de le contrôler et de valider.

### Déclarer une remise (collectrice)

1. Sélectionnez la **date de la remise** (en général, la date du jour).
2. Saisissez le **montant remis** : la somme en espèces que vous remettez physiquement au caissier.
3. Ajoutez un **commentaire** si nécessaire (facultatif, 500 caractères max).
4. Cliquez sur **Déclarer la remise**.

Le système calcule automatiquement le **montant attendu** (somme des collectes et ventes de carnets validées de la journée qui n'ont pas encore été incluses dans une remise). Ce montant attendu sera visible dans le tableau.

### Contrôler et valider une remise (caissier)

Dans le tableau **Historique des remises** :

1. Repérez la remise avec le statut **Déclarée**.
2. Dans la colonne **Contrôle**, saisissez le montant que vous avez physiquement compté.
3. Cliquez sur **Valider**.

La remise passe au statut **Validée** et l'**écart** (différence entre montant attendu et montant contrôlé) est calculé et affiché. Un écart en rouge indique une différence à investiguer.

### Colonnes du tableau

| Colonne | Description |
|---|---|
| Référence | Code unique de la remise (ex. `RM-202608-000001`) |
| Date | Date de la remise |
| Attendu | Somme calculée des opérations de la journée |
| Déclaré | Montant saisi par la collectrice |
| Écart | Différence = Contrôlé − Attendu (rouge si ≠ 0) |
| Statut | Déclarée / Contrôlée / Validée |

### Statuts d'une remise

| Statut | Signification |
|---|---|
| **Déclarée** | La collectrice a rempli le formulaire |
| **Contrôlée** | Le caissier a saisi le montant compté |
| **Validée** | Remise acceptée et clôturée |
| **Rejetée** | Remise refusée (écart non résolu) |

---

## 7. Épargnants — Répertoire et fiche individuelle

**Accès :** tous les rôles authentifiés (lecture) ; Administrateur, Responsable d'agence, Collectrice (création/modification).  
**Chemin :** Menu → Référentiel → **Épargnants**

### Rechercher un épargnant

Le champ de recherche filtre la liste par **nom**, **prénom** ou **numéro client**. Saisissez au moins 2 caractères. Les 100 derniers épargnants créés s'affichent par défaut.

### Créer une fiche épargnant

Cliquez sur **Nouvel épargnant**. Renseignez :

| Champ | Obligatoire | Notes |
|---|:---:|---|
| Nom | Oui | |
| Prénom | Oui | |
| Téléphone | Non | Format libre |
| Pièce d'identité (CNI) | Non | Numéro de la carte nationale |
| Adresse | Non | |
| Agence | Oui | L'épargnant est rattaché à une seule agence |

Le **numéro client** (format `CL-000001`) est généré automatiquement par le système. Il est unique et ne peut pas être modifié.

Cliquez sur **Créer la fiche** pour valider.

### Fiche individuelle d'un épargnant

Depuis la liste, cliquez sur **Situation** à droite d'un épargnant pour accéder à sa fiche complète.

La fiche affiche :
- Les informations personnelles
- La liste de ses livrets avec leur statut et leur solde
- Le **relevé de compte** complet : toutes les opérations dans l'ordre chronologique avec le **solde progressif** après chaque opération

Le solde progressif est calculé en temps réel depuis la base de données. Il reflète exactement l'état du compte à chaque instant.

---

## 8. Livrets

**Accès :** tous les rôles (lecture) ; Responsable d'agence, Administrateur (modification de statut).  
**Chemin :** Menu → Référentiel → **Livrets**

### Liste des livrets

La page affiche tous les livrets de votre agence. Pour chaque livret, vous voyez son numéro, l'épargnant associé, le statut, et les dates de réception/activation.

Les collectrices ne voient que les livrets rattachés à leur propre portefeuille (ou les livrets en stock).

### Fiche d'un livret

Cliquez sur un livret pour accéder à sa fiche, qui affiche :
- Le **statut actuel** et les dates (réception, attribution, activation, clôture)
- L'**historique des mouvements** (réception, attribution, activation, blocage, déblocage, clôture…)
- Le **solde** calculé depuis les opérations validées

### Changer le statut d'un livret

Un responsable d'agence ou un administrateur peut changer le statut d'un livret actif :

| Action | Statut résultant | Usage |
|---|---|---|
| Bloquer | **Bloqué** | Suspendre temporairement les opérations |
| Débloquer | **Actif** | Lever le blocage |
| Clôturer | **Clôturé** | Fermer définitivement le livret |
| Déclarer perdu | **Perdu** | Livret physiquement introuvable |

Chaque changement de statut génère automatiquement une entrée dans l'historique des mouvements avec la date et l'utilisateur responsable.

> Un livret clôturé ou perdu ne peut plus recevoir d'opérations. La clôture est irréversible.

---

## 9. Stock de livrets

**Accès :** tous (lecture) ; Administrateur, Responsable d'agence (réception).  
**Chemin :** Menu → Référentiel → **Stock**

### Comprendre le tableau de stock

Le tableau affiche, par agence, la répartition des livrets par statut :

| Colonne | Description |
|---|---|
| **Reçus** | Total des livrets jamais enregistrés dans cette agence |
| **Disponibles** | Livrets en stock, non encore attribués |
| **Attribués** | Livrets attribués mais pas encore activés |
| **Actifs** | Livrets en cours d'utilisation |
| **Bloqués** | Livrets temporairement suspendus |
| **Clôturés** | Livrets fermés définitivement |
| **Perdus** | Livrets déclarés perdus |

Ces chiffres sont calculés automatiquement. Aucune saisie manuelle n'est nécessaire pour mettre à jour le stock.

### Réceptionner de nouveaux livrets

1. Sélectionnez l'**agence de destination**.
2. Dans la zone de texte **Numéros de livrets**, saisissez les numéros des livrets vierges reçus physiquement. Vous pouvez en saisir plusieurs à la fois :
   - Un numéro par ligne, ou
   - Séparés par des virgules ou des point-virgules.
   
   Exemple :
   ```
   LV-000051
   LV-000052
   LV-000053
   ```
   
3. Le nombre de numéros détectés s'affiche en bas du champ pour vous aider à vérifier.
4. Cliquez sur **Réceptionner**.

Chaque livret est créé avec le statut **En stock** et une entrée d'historique de type « Réception » est automatiquement enregistrée.

> Si un numéro de livret existe déjà dans le système, l'opération entière est annulée avec un message d'erreur indiquant le numéro en doublon. Corrigez puis relancez.

---

## 10. Commissions

**Accès :** Administrateur, Direction, Responsable d'agence.  
**Chemin :** Menu → Pilotage → **Commissions**

### Vue d'ensemble

L'écran affiche trois indicateurs :
- **Commissions calculées** : montant total toutes commissions confondues
- **Lignes de commission** : nombre d'enregistrements
- **Règles actives** : nombre de règles actuellement en vigueur

### Règles de commission

Le tableau des règles liste les configurations actives et passées. Chaque règle précise :

| Colonne | Description |
|---|---|
| Code | Identifiant technique de la règle |
| Libellé | Description lisible |
| Déclencheur | Type d'opération qui déclenche la commission (`ACHAT_CARNET`, `RETRAIT`, etc.) |
| Mode | `FIXE` (montant fixe), `TAUX` (pourcentage), `PALIER` (selon seuils) ou `À_DÉFINIR` |
| Valeur | Taux en % ou montant fixe selon le mode |
| Début | Date d'entrée en vigueur |

Les règles marquées **À_DÉFINIR** sont inactives — elles ne déclenchent aucune commission tant que les taux réels n'ont pas été validés et paramétrés.

> La modification des règles de commission se fait depuis le backoffice de l'administrateur. Les taux doivent être validés avec la direction avant d'être activés.

### Commissions calculées

Le second tableau liste toutes les commissions générées, avec leur référence, date, base de calcul, montant et statut (`CALCULEE`, `VALIDEE`, `ANNULEE`). Les commissions sont générées automatiquement lors de chaque opération concernée.

---

## 11. Rapports

**Accès :** tous les rôles (périmètre limité selon le rôle).  
**Chemin :** Menu → Pilotage → **Rapports**

La page Rapports permet de consulter et exporter des synthèses filtrables. Les filtres disponibles sont la période (dates début/fin), l'agence et l'utilisateur.

Les collectrices ne voient que leurs propres opérations. Les responsables d'agence voient leur agence. L'administrateur et la direction voient toutes les agences.

---

## 12. Administration — Agences

**Accès :** Administrateur (création/modification), Direction (lecture).  
**Chemin :** Menu → Administration → **Agences**

### Créer une agence

Cliquez sur **Nouvelle agence** et renseignez :
- **Code** : identifiant court et unique (ex. `AG-DLA`)
- **Nom** : nom complet de l'agence
- **Adresse** (facultatif)
- **Téléphone** (facultatif)

Le code doit être unique dans tout le système. Une fois créé, il ne peut pas être modifié.

### Modifier une agence

Cliquez sur une agence dans la liste pour accéder à son formulaire de modification. Vous pouvez changer le nom, l'adresse, le téléphone et le statut (Active / Inactive).

> Désactiver une agence (`INACTIVE`) empêche toute nouvelle opération sur ses livrets mais conserve l'historique intégral.

---

## 13. Administration — Utilisateurs et rôles

**Accès :** Administrateur uniquement.  
**Chemin :** Menu → Administration → **Utilisateurs**

### Comprendre le fonctionnement en deux étapes

La plateforme sépare le **profil métier** (nom, agence, rôle) du **compte de connexion** (email, mot de passe). L'administrateur crée d'abord le profil, puis l'utilisateur crée son mot de passe de son côté.

### Créer un utilisateur

1. Cliquez sur **Nouvel utilisateur**.
2. Renseignez :

| Champ | Obligatoire | Notes |
|---|:---:|---|
| Nom | Oui | |
| Prénom | Oui | |
| Adresse email | Oui | Doit correspondre exactement à l'email que l'utilisateur utilisera pour se connecter |
| Téléphone | Non | |
| Agence | Oui | Agence de rattachement |
| Rôle | Oui | Choisir parmi les 5 rôles disponibles |

3. Cliquez sur **Créer l'utilisateur**.

### Que se passe-t-il ensuite ?

L'utilisateur doit maintenant :
1. Se rendre sur la page de connexion
2. Cliquer sur **Créer un compte**
3. Saisir **exactement la même adresse email** que celle enregistrée par l'administrateur
4. Choisir un mot de passe

Dès la première connexion réussie, le compte est automatiquement lié au profil métier. Dans le tableau des utilisateurs, la colonne **Connexion** passera de « En attente » à « Compte actif ».

### Tableau des utilisateurs

| Colonne | Description |
|---|---|
| Nom | Nom complet |
| Email | Adresse de connexion |
| Agence | Agence de rattachement |
| Rôles | Badge(s) de rôle(s) attribués |
| Connexion | « Compte actif » ou « En attente » |

> Un utilisateur peut avoir plusieurs rôles. Pour ajouter un rôle supplémentaire, contactez l'administrateur système (modification directe en base de données).

---

## 14. Administration — Paramètres

**Accès :** Administrateur (modification), Direction (lecture).  
**Chemin :** Menu → Administration → **Paramètres**

Cette page centralise tous les réglages métier de l'application. Les modifications s'appliquent immédiatement à toutes les agences.

### Liste des paramètres

| Paramètre | Description | Valeur par défaut |
|---|---|---|
| Code devise | Code ISO (ex. `XAF`) | `XAF` |
| Libellé devise | Affiché dans l'interface (ex. `FCFA`) | `FCFA` |
| Fuseau horaire | Utilisé pour horodatage | `Africa/Douala` |
| Montant minimum de retrait | En dessous, le retrait est refusé | *(à définir)* |
| Montant maximum de retrait | Au-dessus, le retrait est refusé | *(à définir)* |
| Autoriser un retrait supérieur au solde | `Oui` / `Non` | `Non` |
| Le retrait doit être validé par un caissier | `Oui` / `Non` | `Oui` |
| Autoriser la saisie de plusieurs jours en une collecte | `Oui` / `Non` | `Non` |
| Délai de correction d'une collecte (heures) | Fenêtre de correction après saisie | *(à définir)* |
| Prix de vente du carnet | Montant pré-rempli lors d'une vente | *(à définir)* |
| Politique de clôture d'un livret | Description textuelle | *(à définir)* |
| Fonctionnement hors connexion | Mode hors ligne (non encore implémenté) | `Non` |

### Modifier un paramètre

Modifiez la valeur dans le champ correspondant. Les champs booléens (Oui/Non) affichent une liste déroulante. Les montants utilisent un champ numérique.

Une fois toutes vos modifications faites, cliquez sur **Enregistrer** en haut à droite. Seuls les paramètres effectivement modifiés sont mis à jour.

> Les paramètres marqués « à définir » sont inactifs tant qu'ils n'ont pas de valeur. L'application affiche un message d'avertissement quand une règle non configurée est sollicitée plutôt que de bloquer silencieusement.

---

## 15. Journal d'audit

**Accès :** Administrateur et Direction uniquement.  
**Chemin :** Menu → Administration → **Audit**

Le journal d'audit enregistre automatiquement toutes les modifications sur les données sensibles : opérations, livrets, épargnants, utilisateurs, remises, paramètres.

### Informations enregistrées pour chaque action

| Information | Description |
|---|---|
| Date/heure | Horodatage précis de l'action |
| Utilisateur | Qui a effectué l'action |
| Action | INSERT, UPDATE, (aucun DELETE n'est possible sur les données sensibles) |
| Table | Quelle table a été modifiée |
| Enregistrement | Identifiant de la ligne concernée |
| Ancienne valeur | État avant modification (JSON complet) |
| Nouvelle valeur | État après modification (JSON complet) |

Le journal est en **lecture seule** : aucun enregistrement d'audit ne peut être modifié ou supprimé.

---

## 16. Recherche globale

**Accès :** tous les rôles.  
**Chemin :** icône loupe dans l'en-tête, ou Menu → **Recherche**

La recherche globale permet de retrouver n'importe quelle entité du système en une seule saisie :

- **Numéro de livret** (ex. `LV-000012`)
- **Numéro client** (ex. `CL-000042`)
- **Nom ou prénom** d'un épargnant
- **Numéro de téléphone**
- **Référence d'opération** (ex. `OP-202608-000155`)

Les résultats sont groupés par type (épargnants, livrets, opérations) et cliquables pour accéder directement à la fiche correspondante.

---

## 17. Questions fréquentes

**Q : Je ne vois pas certains menus. Est-ce normal ?**  
Oui. La navigation affiche uniquement les pages autorisées pour votre rôle. Une Collectrice ne voit pas les menus Administration ou Retraits, par exemple.

**Q : J'ai saisi une collecte avec le mauvais montant. Que faire ?**  
Une opération validée ne peut pas être modifiée directement. Contactez un responsable d'agence ou un administrateur pour procéder à une **annulation**. L'opération sera contre-passée et une nouvelle entrée correcte pourra être saisie.

**Q : Un livret n'apparaît pas dans la liste de la collecte.**  
Seuls les livrets **Actifs** apparaissent. Si le livret est bloqué, en stock, clôturé ou perdu, il ne peut pas recevoir de collecte. Vérifiez son statut dans la page Livrets.

**Q : Le montant attendu dans ma remise de caisse est incorrect.**  
Le montant attendu est calculé automatiquement depuis les collectes et ventes de carnets validées de la journée qui n'ont pas encore été incluses dans une remise. Si une opération manque, vérifiez qu'elle est bien au statut **Validée** (et non En attente ou Brouillon).

**Q : Comment corriger une remise de caisse déjà validée ?**  
Une remise validée est définitive. Si l'écart est récurrent, contactez un administrateur pour qu'il ajuste les paramètres ou enregistre un ajustement manuel.

**Q : La liste des livrets disponibles pour une vente est vide.**  
Il n'y a plus de livrets en stock dans votre agence. Un responsable d'agence ou un administrateur doit en réceptionner depuis la page **Stock**.

**Q : Un utilisateur ne peut pas se connecter malgré son compte créé.**  
Vérifiez que l'adresse email qu'il utilise pour se connecter est **exactement** la même que celle enregistrée dans son profil (minuscules, sans espace). Vérifiez également que son statut est **Actif** dans la liste des utilisateurs.

**Q : Puis-je supprimer une opération ?**  
Non. La suppression physique d'une opération est techniquement bloquée par la base de données. La seule correction possible est l'annulation avec contre-passation, qui laisse une trace complète dans le journal.

**Q : Que signifie le statut « Contre-passée » sur une opération ?**  
L'opération était validée et a été annulée après coup. Une opération de correction de sens inverse a été créée automatiquement pour neutraliser l'effet comptable de l'opération originale. Les deux opérations restent visibles dans l'historique.

---

*Guide rédigé pour la version courante de la plateforme — Août 2026.*
