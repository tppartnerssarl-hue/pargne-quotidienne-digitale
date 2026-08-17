# Épargne Quotidienne Digitale

Tu es un architecte logiciel senior, expert en conception d'applications métier, systèmes financiers, UX/UI, bases de données relationnelles, sécurité, RBAC, Supabase et applications web modernes.

Ta mission est de concevoir et développer une application web professionnelle de digitalisation d'une entreprise de gestion d'épargne quotidienne.

IMPORTANT :

- Ne commence pas par générer immédiatement tout le code.

- Commence par analyser le besoin et l'architecture.

- Ne crée aucune règle métier qui n'est pas explicitement définie.

- Lorsqu'une information métier manque, rends-la configurable ou marque-la comme "À VALIDER".

- Ne hardcode jamais les taux, paliers ou règles de commission non fournis.

- Ne reproduis pas aveuglément les anciennes feuilles Excel comme tables de base de données.

- La base de données doit être normalisée au minimum en 3NF.

- Les opérations financières doivent être historisées.

- Les données validées ne doivent pas être supprimées physiquement.

- Toute modification sensible doit être traçable.

- Privilégie une architecture simple, robuste, maintenable et évolutive.

==================================================

1. OBJECTIF GLOBAL

==================================================

Digitaliser le fonctionnement d'une entreprise spécialisée dans l'épargne quotidienne.

Le système doit permettre de gérer :

1. Les agences

2. Les utilisateurs

3. Les rôles et permissions

4. Les épargnants

5. Les livrets

6. Le stock de livrets

7. L'attribution des livrets aux collectrices

8. La vente des carnets/livrets

9. Les collectes quotidiennes

10. Les retraits

11. Les commissions

12. La situation individuelle de chaque épargnant

13. Les remises de fonds

14. La caisse

15. Les rapports

16. Les tableaux de bord

17. Les exports

18. L'audit et la traçabilité

Le système doit remplacer progressivement les processus manuels basés sur Excel par un système centralisé.

==================================================

2. PRINCIPES D'ARCHITECTURE

==================================================

Utiliser une architecture web moderne.

Stack recommandée :

- Frontend : React + TypeScript

- UI : Tailwind CSS + composants modernes

- Backend : Supabase

- Base de données : PostgreSQL

- Authentification : Supabase Auth

- Autorisation : Row Level Security (RLS)

- API : Supabase

- Validation : validation côté frontend ET côté backend/database

- Dates : gérer correctement les fuseaux horaires

- Devise : utiliser une configuration de devise plutôt que de hardcoder les formats

- Journalisation : table d'audit

Le système doit être responsive et fonctionner correctement sur :

- ordinateur

- tablette

- smartphone

L'interface doit être adaptée aux utilisateurs opérationnels qui peuvent travailler principalement sur téléphone.

==================================================

3. ARCHITECTURE FONCTIONNELLE

==================================================

Créer les modules suivants :

A. AUTHENTIFICATION

B. TABLEAU DE BORD

C. UTILISATEURS ET RÔLES

D. AGENCES

E. ÉPARGNANTS

F. LIVRETS

G. STOCK

H. VENTE DE LIVRETS

I. COLLECTES

J. RETRAITS

K. SITUATION INDIVIDUELLE

L. COMMISSIONS

M. CAISSE

N. RAPPORTS

O. EXPORTS

P. AUDIT

==================================================

4. RÔLES UTILISATEURS

==================================================

Prévoir au minimum les rôles suivants :

1. ADMINISTRATEUR

2. DIRECTION

3. RESPONSABLE_AGENCE

4. COLLECTRICE

5. CAISSIER

Le système doit utiliser un véritable RBAC.

Chaque rôle doit avoir des permissions explicites.

Ne jamais utiliser uniquement des conditions frontend pour sécuriser les données.

Les permissions doivent également être contrôlées au niveau de Supabase/PostgreSQL avec RLS.

--------------------------------------------------

ADMINISTRATEUR

--------------------------------------------------

Peut :

- gérer les utilisateurs

- gérer les rôles

- gérer les agences

- configurer les paramètres

- consulter les audits

- consulter les rapports globaux

- gérer les règles de commission

--------------------------------------------------

DIRECTION

--------------------------------------------------

Peut :

- consulter les tableaux de bord

- consulter les agences

- consulter le stock

- consulter les collectes

- consulter les retraits

- consulter les commissions

- consulter les rapports

- exporter les données

- valider les éléments nécessitant une validation

--------------------------------------------------

RESPONSABLE_AGENCE

--------------------------------------------------

Peut :

- gérer les épargnants

- gérer les livrets

- attribuer les livrets

- consulter les collectes

- enregistrer certaines opérations selon les permissions

- gérer la caisse de l'agence

- consulter les situations individuelles

- consulter les rapports de son agence

--------------------------------------------------

COLLECTRICE

--------------------------------------------------

Peut :

- consulter ses livrets attribués

- consulter ses épargnants

- enregistrer une vente de livret

- enregistrer une collecte

- consulter l'historique de ses opérations

- consulter la situation d'un épargnant auquel elle a accès

Elle ne doit pas pouvoir consulter ou modifier les données des autres collectrices sauf permission explicite.

--------------------------------------------------

CAISSIER

--------------------------------------------------

Peut :

- consulter les opérations nécessitant son intervention

- enregistrer les retraits

- enregistrer les remises de fonds

- contrôler les montants

- consulter la caisse

- consulter les rapports de caisse

==================================================

5. MODÈLE DE DONNÉES

==================================================

La base doit être conçue en 3NF.

Ne pas créer des tables physiques correspondant directement aux anciennes feuilles Excel T1, T2, T3, etc.

Utiliser les entités métier suivantes :

AGENCE

ROLE

UTILISATEUR

UTILISATEUR_ROLE

EPARGNANT

LIVRET

MOUVEMENT_LIVRET

TYPE_OPERATION

OPERATION

REMISE_CAISSE

DETAIL_REMISE

REGLE_COMMISSION

PERIODE_COMMISSION

COMMISSION

AUDIT

==================================================

6. TABLE AGENCE

==================================================

Créer :

agence

Champs minimum :

- id_agence

- code

- nom

- adresse

- telephone

- statut

- date_creation

- created_at

- updated_at

Contraintes :

- code unique

- statut contrôlé

- timestamps

==================================================

7. TABLE ROLE

==================================================

Créer :

role

Champs :

- id_role

- code

- libelle

- description

Le code doit être unique.

==================================================

8. TABLE UTILISATEUR

==================================================

Créer une relation entre le profil utilisateur applicatif et Supabase Auth.

Champs minimum :

- id_utilisateur

- auth_user_id

- id_agence

- nom

- prenom

- login

- email

- telephone

- statut

- date_creation

- created_at

- updated_at

Ne jamais stocker un mot de passe en clair.

L'authentification doit utiliser Supabase Auth.

==================================================

9. TABLE UTILISATEUR_ROLE

==================================================

Créer une table d'association :

utilisateur_role

Champs :

- id_utilisateur

- id_role

- date_attribution

Clé primaire composite :

(id_utilisateur, id_role)

==================================================

10. TABLE EPARGNANT

==================================================

Créer :

epargnant

Champs minimum :

- id_epargnant

- numero_client

- nom

- prenom

- telephone

- adresse

- numero_cni

- statut

- date_creation

- created_at

- updated_at

Le numéro client doit être unique.

Ne jamais dupliquer les informations de l'épargnant dans chaque opération.

==================================================

11. TABLE LIVRET

==================================================

Créer :

livret

Champs :

- id_livret

- numero_livret

- id_epargnant

- id_agence

- statut

- date_reception

- date_attribution

- date_activation

- date_cloture

- created_at

- updated_at

Le numéro du livret doit être unique.

Prévoir des statuts :

- EN_STOCK

- ATTRIBUE

- ACTIF

- BLOQUE

- CLOTURE

- PERDU

==================================================

12. HISTORIQUE DES LIVRETS

==================================================

Créer :

mouvement_livret

Objectif :

conserver l'historique des changements de situation d'un livret.

Types possibles :

- RECEPTION

- TRANSFERT

- ATTRIBUTION

- ACTIVATION

- BLOCAGE

- DEBLOCAGE

- CLOTURE

- PERTE

Ne jamais écraser l'historique.

==================================================

13. TYPE D'OPERATION

==================================================

Créer :

type_operation

Cette table permet d'éviter de créer une table séparée pour chaque type d'opération financière.

Exemples :

- ACHAT_CARNET

- COLLECTE

- RETRAIT

- COMMISSION_VENTE

- COMMISSION_RETRAIT

- COMMISSION_MENSUELLE

- AJUSTEMENT

Champs :

- code_type

- libelle

- sens

- est_financier

- actif

Le sens doit pouvoir être :

- CREDIT

- DEBIT

IMPORTANT :

Ne pas inventer d'autres opérations sans nécessité métier.

==================================================

14. TABLE OPERATION

==================================================

Créer une table centrale :

operation

Champs minimum :

- id_operation

- reference

- id_livret

- code_type

- id_utilisateur

- date_operation

- date_valeur

- montant

- statut

- commentaire

- date_creation

- date_validation

- created_at

- updated_at

La référence doit être unique.

Statuts :

- BROUILLON

- EN_ATTENTE

- VALIDEE

- ANNULEE

- REVERSEE

Une opération financière validée ne doit jamais être supprimée.

Si une correction est nécessaire, utiliser un mécanisme d'annulation/reversal et conserver l'historique.

==================================================

15. COLLECTES

==================================================

La collecte doit être enregistrée comme une opération de type :

COLLECTE

L'écran de collecte doit permettre :

- sélectionner le livret

- afficher l'épargnant

- saisir la date

- saisir le montant

- vérifier les informations

- enregistrer

- afficher confirmation

Prévoir également la possibilité métier d'enregistrer plusieurs jours si cette règle est confirmée.

IMPORTANT :

Ne pas créer des colonnes :

jour_1

jour_2

jour_3

...

jour_31

Une collecte doit être une ligne d'opération.

==================================================

16. VENTE DE LIVRET

==================================================

Créer un workflow :

1. Sélectionner le livret

2. Identifier l'épargnant

3. Créer ou sélectionner l'épargnant

4. Enregistrer la vente

5. Activer le livret selon les règles métier

6. Générer la référence d'opération

7. Calculer la commission si une règle existe

8. Enregistrer l'opération

9. Afficher le reçu/récapitulatif

Ne jamais permettre l'attribution simultanée du même livret à plusieurs personnes.

==================================================

17. RETRAITS

==================================================

Workflow :

1. Rechercher le livret

2. Afficher l'épargnant

3. Afficher le solde disponible

4. Saisir le montant du retrait

5. Vérifier que le retrait respecte les règles configurées

6. Calculer la commission applicable

7. Afficher le montant net/brut selon les règles validées

8. Demander confirmation

9. Enregistrer l'opération

10. Enregistrer la validation/paiement selon le workflow

11. Mettre à jour la situation

IMPORTANT :

Ne pas inventer les règles de retrait.

Si les règles ne sont pas encore définies, créer une configuration et afficher "Règle à définir".

==================================================

18. SITUATION INDIVIDUELLE

==================================================

Ne pas stocker une table redondante "situation".

Créer une vue ou une requête calculée à partir des opérations.

La situation doit afficher :

- numéro du livret

- nom

- prénom

- date

- référence

- type d'opération

- montant crédit

- montant débit

- solde progressif

Le solde doit être calculé à partir des opérations validées.

Ne pas stocker plusieurs copies du solde dans différentes tables sans justification.

==================================================

19. COMMISSIONS

==================================================

Créer :

regle_commission

Champs :

- id_regle

- code

- libelle

- seuil_min

- seuil_max

- montant_fixe

- taux

- mode_calcul

- date_debut

- date_fin

- actif

Créer :

periode_commission

Champs :

- id_periode

- annee

- mois

- date_debut

- date_fin

- statut

Créer :

commission

Champs :

- id_commission

- reference

- id_livret

- id_regle

- id_periode

- id_operation_origine

- date_calcul

- base_calcul

- montant

- statut

- date_validation

IMPORTANT :

Les montants et paliers exacts des commissions n'ont pas encore été définitivement fournis.

Donc :

- ne pas les hardcoder

- créer une interface d'administration

- permettre leur configuration

- conserver la période de validité de chaque règle

- conserver l'historique des règles

==================================================

20. CAISSE

==================================================

Créer :

remise_caisse

Champs :

- id_remise

- reference

- id_agence

- id_utilisateur

- date_remise

- montant_declare

- montant_controle

- ecart

- statut

- date_validation

Créer :

detail_remise

Champs :

- id_detail

- id_remise

- id_operation

- montant

La remise doit permettre de rapprocher les opérations collectées et les montants effectivement remis.

Prévoir la détection :

- montant attendu

- montant déclaré

- montant contrôlé

- écart

==================================================

21. AUDIT

==================================================

Créer une table :

audit

Champs minimum :

- id_audit

- id_utilisateur

- date_action

- action

- table_cible

- id_cible

- ancienne_valeur

- nouvelle_valeur

- adresse_ip

Tracer au minimum :

- création

- modification

- validation

- annulation

- suppression logique

- changement de statut

- modification des règles de commission

- opérations financières sensibles

- changements de permissions

L'audit doit être accessible uniquement aux utilisateurs autorisés.

==================================================

22. TABLEAU DE BORD

==================================================

Créer un dashboard professionnel.

Afficher selon les permissions :

- nombre d'épargnants

- nombre de livrets

- livrets disponibles

- livrets attribués

- collectes du jour

- collectes du mois

- retraits du jour

- retraits du mois

- commissions

- solde global selon les droits

- situation de caisse

- écarts de caisse

- alertes

Prévoir des filtres :

- période

- agence

- collectrice

- livret

- épargnant

Ne jamais afficher à un utilisateur des données auxquelles son rôle ne lui donne pas accès.

==================================================

23. ÉCRAN DE COLLECTE

==================================================

Créer une interface particulièrement simple et rapide.

Objectif :

permettre à une collectrice d'enregistrer une collecte en quelques secondes.

Workflow :

1. Scanner ou saisir le numéro du livret

2. Afficher automatiquement l'épargnant

3. Afficher le solde

4. Saisir le montant

5. Afficher la date

6. Confirmer

7. Enregistrer

8. Afficher un retour de succès

Prévoir :

- recherche par numéro de livret

- recherche par nom

- historique

- gestion des erreurs

- confirmation avant validation

==================================================

24. ÉCRAN ÉPARGNANT

==================================================

Créer une fiche complète :

Informations :

- numéro client

- nom

- prénom

- téléphone

- adresse

- numéro CNI

- statut

Afficher :

- livrets

- historique des opérations

- collectes

- retraits

- commissions

- solde

- dates importantes

==================================================

25. ÉCRAN LIVRET

==================================================

Afficher :

- numéro

- statut

- agence

- épargnant

- collectrice/utilisateur responsable

- date de réception

- date d'attribution

- date d'activation

- historique

Permettre les actions selon les permissions.

==================================================

26. GESTION DU STOCK

==================================================

Le stock disponible ne doit pas être une donnée saisie manuellement.

Le système doit calculer le stock à partir des livrets et de leur statut.

Afficher :

- total reçu

- disponible

- attribué

- actif

- bloqué

- clôturé

- perdu

Prévoir filtres par agence.

==================================================

27. RAPPORTS

==================================================

Créer un module de reporting.

Rapports minimum :

1. Rapport des ventes

2. Rapport des collectes

3. Rapport des retraits

4. Rapport des commissions

5. Rapport du stock

6. Rapport de caisse

7. Situation individuelle

8. Rapport des opérations

9. Rapport d'audit

Chaque rapport doit permettre :

- filtre par période

- filtre par agence

- filtre par utilisateur/collectrice

- recherche

- pagination

- export CSV

- export Excel si supporté

- impression

==================================================

28. RECHERCHE GLOBALE

==================================================

Créer une recherche permettant de rechercher :

- numéro livret

- numéro client

- nom

- prénom

- téléphone

- référence opération

Afficher des résultats contextualisés.

==================================================

29. UX/UI

==================================================

Créer une interface professionnelle.

Principes :

- design moderne

- navigation latérale sur desktop

- navigation adaptée mobile

- tableaux lisibles

- formulaires courts

- boutons d'action clairement identifiables

- confirmations pour les opérations sensibles

- messages d'erreur explicites

- messages de succès

- états de chargement

- états vides

- pagination

- recherche

- filtres

- modales lorsque pertinentes

L'interface doit être en français.

Les termes métier doivent être en français.

==================================================

30. VALIDATION DES DONNÉES

==================================================

Implémenter des validations strictes.

Exemples :

- numéro de livret obligatoire

- numéro de livret unique

- montant strictement positif lorsqu'il s'agit d'une opération financière positive

- agence obligatoire

- utilisateur obligatoire

- épargnant obligatoire pour les opérations liées à un livret

- référence opération unique

- statut valide

- dates cohérentes

Empêcher :

- double soumission

- double validation

- double attribution d'un livret

- opération sur un livret inexistant

- retrait supérieur au solde lorsque la règle métier l'interdit

==================================================

31. SECURITE

==================================================

La sécurité est prioritaire.

Implémenter :

- Supabase Auth

- RLS

- RBAC

- principe du moindre privilège

- validation backend

- protection contre accès aux données d'une autre agence

- journalisation des actions sensibles

- aucune donnée sensible dans les logs frontend

- aucun mot de passe en clair

- aucun secret dans le frontend

- variables d'environnement pour les secrets

Les restrictions frontend ne doivent jamais être considérées comme une mesure de sécurité suffisante.

==================================================

32. GESTION DES ERREURS

==================================================

Toutes les opérations importantes doivent gérer :

- erreur réseau

- erreur de validation

- doublon

- conflit

- opération déjà validée

- utilisateur non autorisé

- données inexistantes

- erreur serveur

Afficher des messages compréhensibles par les utilisateurs.

Les erreurs techniques doivent être journalisées sans exposer de détails sensibles à l'utilisateur.

==================================================

33. TRANSACTIONS FINANCIÈRES

==================================================

Les opérations financières doivent être atomiques.

Lorsqu'une opération est validée :

- vérifier les règles

- vérifier les permissions

- enregistrer l'opération

- enregistrer les informations nécessaires

- générer l'audit

- éviter toute situation partiellement enregistrée

Utiliser des transactions côté base de données lorsque nécessaire.

==================================================

34. DONNÉES ET INTÉGRITÉ

==================================================

Créer les PK et FK appropriées.

Créer les contraintes :

- UNIQUE

- NOT NULL

- CHECK

- FOREIGN KEY

Utiliser des index sur les champs fréquemment recherchés :

- numero_livret

- numero_client

- telephone

- reference

- date_operation

- id_agence

- id_epargnant

- id_utilisateur

Ne pas créer d'index inutiles.

==================================================

35. DONNÉES DE DÉMONSTRATION

==================================================

Créer des données de test réalistes uniquement pour le développement.

Créer par exemple :

- plusieurs agences

- plusieurs utilisateurs

- plusieurs collectrices

- plusieurs épargnants

- plusieurs livrets

- opérations de collecte

- opérations de retrait

- commissions

Mais clairement séparer :

DONNÉES DE TEST

et

DONNÉES DE PRODUCTION.

Ne jamais utiliser de vraies données personnelles.

==================================================

36. WORKFLOW DE DÉVELOPPEMENT

==================================================

NE PAS développer tout le système en une seule étape.

Procéder par phases.

PHASE 1 :

Architecture et base de données.

PHASE 2 :

Authentification + RBAC.

PHASE 3 :

Agences + utilisateurs + rôles.

PHASE 4 :

Épargnants + livrets + stock.

PHASE 5 :

Vente.

PHASE 6 :

Collectes.

PHASE 7 :

Retraits.

PHASE 8 :

Situation individuelle.

PHASE 9 :

Commissions.

PHASE 10 :

Caisse.

PHASE 11 :

Reporting.

PHASE 12 :

Audit.

PHASE 13 :

Tests et optimisation.

Après chaque phase :

- vérifier les relations

- vérifier les permissions

- vérifier les validations

- vérifier les erreurs

- vérifier la cohérence des données

- vérifier l'UX

- corriger avant de passer à la phase suivante.

==================================================

37. AVANT DE CODER

==================================================

Avant toute implémentation :

1. Analyser l'architecture.

2. Présenter le schéma des modules.

3. Présenter le modèle de données.

4. Présenter les relations principales.

5. Identifier les règles métier manquantes.

6. Identifier les risques.

7. Identifier les décisions nécessitant validation.

Ne pas bloquer le développement pour des éléments qui peuvent être rendus configurables.

==================================================

38. RÈGLES NON ENCORE DÉFINIES

==================================================

Les éléments suivants ne doivent PAS être inventés :

- taux exacts des commissions

- paliers exacts

- règles précises de retrait

- pénalités

- montant minimum de retrait

- montant maximum de retrait

- règles exactes de validation des retraits

- règles de fonctionnement hors connexion

- politique exacte de clôture d'un livret

- politique de correction d'une collecte

Créer des paramètres/configurations pour ces éléments ou afficher :

"À VALIDER"

dans la documentation technique.

==================================================

39. TESTS

==================================================

Créer des tests pour les fonctions critiques.

Tests minimum :

- authentification

- permissions

- création d'épargnant

- création de livret

- attribution d'un livret

- vente

- collecte

- retrait

- calcul du solde

- commission

- remise de caisse

- audit

- accès inter-agences

- tentative d'opération non autorisée

- double soumission

- annulation d'opération

==================================================

40. CRITÈRES D'ACCEPTATION

==================================================

Le système sera considéré comme correctement implémenté lorsque :

1. Un utilisateur peut se connecter.

2. Son rôle détermine ses permissions.

3. Un administrateur peut gérer les utilisateurs.

4. Une agence peut être créée.

5. Un épargnant peut être créé.

6. Un livret peut être enregistré.

7. Un livret peut être attribué.

8. Une vente peut être enregistrée.

9. Une collecte peut être enregistrée.

10. Un retrait peut être enregistré selon les règles configurées.

11. Le solde individuel est calculé correctement.

12. Les commissions sont calculées selon les règles configurées.

13. Les opérations sont historisées.

14. La caisse peut être contrôlée.

15. Les rapports sont disponibles.

16. Les données sont exportables.

17. Les actions sensibles sont auditées.

18. Les utilisateurs ne peuvent accéder qu'aux données autorisées.

19. Les données financières validées ne peuvent pas être supprimées silencieusement.

20. La base de données respecte une structure relationnelle normalisée.

==================================================

41. RÈGLE FINALE

==================================================

Agis comme un CTO + architecte logiciel + développeur senior.

Ne cherche pas simplement à produire une interface visuellement attractive.

La priorité est :

1. exactitude métier

2. intégrité des données

3. sécurité

4. traçabilité

5. simplicité

6. maintenabilité

7. performance

8. expérience utilisateur

Si une décision d'architecture est nécessaire, choisis la solution la plus simple et robuste.

Si une règle métier manque, ne l'invente pas.

Si une information est ambiguë, identifie-la explicitement.

Commence par me présenter :

A. l'architecture fonctionnelle

B. l'architecture technique

C. le schéma de base de données

D. les rôles et permissions

E. les workflows principaux

F. les risques

G. les éléments métier restant à valider

Puis seulement après validation, commence l'implémentation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5e561130-58d9-4a26-96ab-65f2a8789127).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
