# Tableau de bord visuel

## Objectif
Remplacer la présentation principalement composée de chiffres et d’un tableau par un tableau de bord illustré, lisible rapidement sur ordinateur et mobile, tout en conservant les mêmes règles d’accès et données réelles.

## Modifications prévues
- Conserver une rangée courte d’indicateurs essentiels pour les totaux du jour.
- Ajouter un graphique d’évolution quotidienne des collectes et retraits sur le mois en cours.
- Ajouter un graphique de répartition des opérations du mois : collectes, retraits et ventes de carnets.
- Remplacer le tableau de stock par un graphique comparatif par agence : disponibles, actifs, bloqués et clôturés.
- Ajouter une visualisation claire des remises de caisse : validées, en attente et écarts constatés.
- Afficher des états vides explicites lorsqu’aucune donnée n’est disponible, sans inventer de chiffres.
- Adapter les graphiques aux petits écrans, au thème clair/sombre et aux rôles existants.

## Détails techniques
- Utiliser la bibliothèque de graphiques déjà installée dans l’application.
- Agréger les opérations existantes par date et par type, sans modifier les règles métier ni la base de données.
- Employer exclusivement les couleurs du thème existant et des infobulles avec montants en FCFA.
- Conserver le filtrage déjà appliqué par les droits de chaque utilisateur.
- Vérifier l’affichage réel avec plusieurs tailles d’écran et contrôler la compilation.
