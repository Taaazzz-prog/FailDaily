Le Lighthouse Score est un système de notation développé par Google pour évaluer la qualité des pages web. Lighthouse est un outil d'audit automatisé qui analyse les sites web et attribue des scores sur 100 dans plusieurs catégories clés.
Les 5 catégories principales :
Performance : Mesure la vitesse de chargement, le temps d'interactivité, et d'autres métriques de performance comme :

First Contentful Paint (FCP)
Largest Contentful Paint (LCP)
Time to Interactive (TTI)

Accessibility (Accessibilité) : Évalue si le site est utilisable par les personnes en situation de handicap (contrastes, balises alt, navigation au clavier, etc.)
Best Practices (Bonnes pratiques) : Vérifie le respect des standards web modernes (HTTPS, absence d'erreurs console, etc.)
SEO : Analyse l'optimisation pour les moteurs de recherche (balises meta, structure HTML, etc.)
PWA (Progressive Web App) : Évalue si le site respecte les critères d'une application web progressive
Comment ça fonctionne :
Chaque catégorie reçoit un score de 0 à 100 :

90-100 : Vert (Bon)
50-89 : Orange (À améliorer)
0-49 : Rouge (Mauvais)

Lighthouse peut être utilisé via les outils de développement Chrome, en ligne de commande, ou via des services comme PageSpeed Insights de Google. C'est devenu une référence standard pour mesurer et améliorer la qualité des sites web.









que veux dire ceci
Code source et CI/CD

Cette expression fait référence à deux concepts clés du développement logiciel :

Code source : Il s'agit du code écrit par les développeurs dans un langage de programmation (Python, Java, JavaScript, etc.). C'est le texte lisible par l'humain qui constitue un programme informatique avant qu'il ne soit compilé ou interprété.

CI/CD : Cet acronyme signifie "Continuous Integration/Continuous Deployment" (Intégration Continue/Déploiement Continu). C'est une pratique de développement qui consiste à :

CI (Intégration Continue) : Fusionner régulièrement les modifications de code de différents développeurs dans un dépôt partagé, avec des tests automatisés pour détecter rapidement les problèmes
CD (Déploiement Continu) : Automatiser le processus de mise en production du logiciel, permettant de déployer les nouvelles versions de manière fréquente et fiable
Ensemble, "Code source et CI/CD" évoque donc l'écosystème moderne de développement logiciel où le code est géré de manière collaborative avec des processus automatisés pour assurer la qualité et accélérer les livraisons. C'est souvent mentionné dans le contexte des outils comme Git, GitHub, GitLab, Jenkins, ou des plateformes cloud.













qu'est-ce qu'une Architecture 3-Tiers

L'Architecture 3-Tiers (ou 3-Tier Architecture) est un modèle d'organisation logicielle qui sépare une application en trois couches distinctes et indépendantes. Cette séparation améliore la maintenabilité, la scalabilité et la sécurité.

Les 3 couches (tiers) :
1. Couche Présentation (Presentation Tier)
Rôle : Interface utilisateur et logique d'affichage
Exemples : Interface web (HTML/CSS/JavaScript), application mobile, application desktop
Responsabilités : Collecter les données utilisateur, afficher les résultats, gérer les interactions
2. Couche Logique Métier (Business Logic Tier)
Rôle : Traitement des données et règles business
Exemples : Serveur d'application, API REST, services web
Responsabilités : Valider les données, appliquer les règles métier, orchestrer les traitements
3. Couche Données (Data Tier)
Rôle : Stockage et gestion des données
Exemples : Base de données (MySQL, PostgreSQL), système de fichiers, services cloud
Responsabilités : Persister les données, assurer leur intégrité, gérer les accès
Avantages :
Séparation des préoccupations : Chaque couche a un rôle spécifique
Réutilisabilité : La logique métier peut servir à plusieurs interfaces
Scalabilité : Possibilité de faire évoluer chaque couche indépendamment
Maintenance : Modifications isolées dans une couche
Sécurité : Contrôle d'accès entre les couches
Exemple concret :
Une application e-commerce avec une interface web (présentation), un serveur API qui gère les commandes et le stock (logique métier), et une base de données pour stocker produits et clients (données).









qu'est-ce que les Contraintes FK

Les Contraintes FK (Foreign Key Constraints ou Contraintes de Clé Étrangère) sont des règles de base de données qui maintiennent l'intégrité référentielle entre les tables liées.

Définition
Une clé étrangère (Foreign Key) est un champ (ou un ensemble de champs) dans une table qui fait référence à la clé primaire d'une autre table. La contrainte FK assure que cette référence reste valide.

Fonctionnement
La contrainte FK garantit que :

La valeur de la clé étrangère existe dans la table référencée
On ne peut pas supprimer un enregistrement référencé s'il existe encore des références
On ne peut pas insérer une valeur qui n'existe pas dans la table parent
Exemple concret
sql
-- Table parent
CREATE TABLE Clients (
    client_id INT PRIMARY KEY,
    nom VARCHAR(100)
);

-- Table enfant avec FK
CREATE TABLE Commandes (
    commande_id INT PRIMARY KEY,
    client_id INT,
    date_commande DATE,
    FOREIGN KEY (client_id) REFERENCES Clients(client_id)
);
Actions sur violations
Lors de suppressions ou modifications, on peut définir des comportements :

RESTRICT/NO ACTION : Empêche l'action si des références existent
CASCADE : Supprime/modifie automatiquement les enregistrements liés
SET NULL : Met la FK à NULL
SET DEFAULT : Met une valeur par défaut
Avantages
Intégrité des données : Évite les références orphelines
Cohérence : Maintient la logique métier
Documentation : Explicite les relations entre tables
Performance : Peut optimiser les jointures
Les contraintes FK sont essentielles pour maintenir la qualité et la cohérence des données dans une base de données relationnelle.







