# Audit complet + test de bout en bout

## Objectif

Vérifier que l'application fonctionne réellement, rôle par rôle, écran par écran, et produire un rapport d'audit clair avec la liste des anomalies trouvées et corrigées.

## 1. Audit technique (lecture seule)

- Build et typage : compilation, erreurs TypeScript, imports morts, routes déclarées vs. routes atteignables.
- Journaux : erreurs d'exécution et requêtes réseau en échec relevées côté aperçu.
- Base de données : scan de sécurité et linter (RLS activée partout, policies cohérentes, GRANT présents, vues et fonctions accessibles aux bons rôles).
- Cohérence métier : contrôle que soldes, stock et commissions calculés en base correspondent aux données réelles (requêtes de recoupement).

## 2. Test de bout en bout par rôle

Parcours joués dans un vrai navigateur sur l'application en cours d'exécution, avec les 6 comptes de démonstration :

| Rôle | Parcours testé |
|---|---|
| Administrateur | Connexion, tableau de bord, agences, utilisateurs & rôles, paramètres, audit |
| Direction | Lecture globale, rapports, export CSV, commissions |
| Responsable d'agence | Réception de stock, création d'épargnant, vente/attribution de livret, blocage/clôture livret |
| Collectrice | Collecte rapide sur livret actif, consultation de son portefeuille, cloisonnement (ne voit pas les autres) |
| Caissier | Retrait avec contrôle de solde, impression du reçu, remise de caisse (déclaration, contrôle, écart) |

Pour chaque parcours : capture d'écran, vérification du résultat en base (l'opération existe bien, statut correct, audit alimenté), et contrôle des messages d'erreur métier (solde insuffisant, livret non actif, rôle non autorisé).

## 3. Tests de sécurité et de cas limites

- Accès direct à une URL protégée sans session → redirection vers la connexion.
- Un rôle tente une action interdite (collectrice qui fait un retrait, caissier qui crée un utilisateur) → refus côté base, pas seulement côté écran.
- Cloisonnement par agence : un utilisateur d'une agence ne lit pas les données d'une autre.
- Montants invalides (zéro, négatif, supérieur au solde, date future) → refus explicite.
- Annulation/contre-passation d'une opération validée → pas de suppression physique.

## 4. Corrections

Les anomalies bloquantes trouvées pendant l'audit (erreurs d'écran, requêtes en échec, policies manquantes, libellés erronés) sont corrigées dans la foulée, puis rejouées pour confirmation.

## 5. Livrable

Un rapport d'audit écrit : ce qui fonctionne, ce qui a été corrigé, ce qui reste à décider côté métier (les points « À VALIDER » : taux de commission, limites de retrait, hors connexion), avec un niveau de gravité par point.

## Notes techniques

Tests d'interface pilotés par Playwright en local, sessions authentifiées via les comptes de démonstration, vérifications base via requêtes SQL en lecture seule et outils de scan de sécurité. Aucune donnée réelle créée en dehors du jeu de démonstration ; les enregistrements de test sont identifiables et annulés par contre-passation, jamais supprimés.
