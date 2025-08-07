# ✅ Checklist de développement FailDaily

## 1. Prérequis & Installation
- [x] Node.js installé (>= 18.x)
- [x] npm installé (>= 9.x)
- [x] Git installé
- [x] Visual Studio Code + extensions recommandées
- [x] Ionic CLI installé
- [ ] Angular CLI installé (optionnel)

## 2. Création & Initialisation du projet
- [x] Création du projet Ionic Angular (`ionic start FailDaily tabs --type=angular`)
- [x] Lancement du projet (`ionic serve`)
- [x] Ajout de Capacitor (iOS/Android)
- [x] Synchronisation Capacitor (`ionic capacitor sync`)

## 3. Structure du projet
- [x] Création des dossiers/pages : home, post-fail, profile, badges, auth, settings (badges créés, settings à créer)
- [x] Création des composants : fail-card, courage-heart, imperfect-button, badge-display, loading-spinner (fail-card créé, autres manquants)
- [x] Création des services : fail, auth, badge, push, moderation, analytics (créés mais versions simulation)
- [x] Création des modèles : fail, user, badge, reaction (tous créés)
- [x] Ajout des guards : auth, intro (auth créé, intro à faire)
- [x] Ajout des pipes : time-ago, anonymize, safe-html (time-ago créé, autres à faire)
- [x] Ajout des utilitaires : constants, validators, helpers (validators créé, constants partiellement, helpers à faire)
- [ ] Ajout des assets : images, fonts, sounds
- [x] Ajout des thèmes : variables.scss, imperfect.scss, animations.scss (variables et styles globaux créés)

## 4. Dépendances & Plugins
- [x] Installation des plugins Capacitor (camera, notifications, haptics, etc.)
- [x] Installation des dépendances Angular (forms, animations, http, etc.)
- [x] Installation de moment, lodash, rxjs
- [x] Installation de Firebase ou Supabase

## 5. Configuration
- [x] Configuration de Capacitor (`capacitor.config.ts`)
- [x] Configuration des environnements (`environment.ts`)
- [x] Configuration des styles globaux (`variables.scss`)

## 6. Développement des fonctionnalités principales
- [x] Authentification (inscription, connexion, session)
- [x] Publication d'un fail
- [x] Affichage du feed de fails
- [x] Réactions et badges (structure créée, logique partiellement implémentée)
- [ ] Notifications push/locales (service créé, intégration à faire)
- [x] Profil utilisateur et préférences (page créée avec stats, badges, navigation)
- [x] Modération automatique (service implémenté)
- [x] Page Badges complète (collection, statistiques, progression, filtres par catégorie)

## 7. Tests & Déploiement
- [ ] Tests unitaires (`ng test`)
- [ ] Tests end-to-end (`ng e2e`)
- [ ] Linting (`ionic lint`)
- [ ] Build de production (`ionic build --prod`)
- [ ] Synchronisation et build natif (`ionic capacitor sync/build`)
- [ ] Déploiement sur stores

## 8. Optimisations & Conseils
- [ ] Lazy loading des pages
- [ ] OnPush change detection
- [ ] Optimisation images
- [ ] Animations et haptic feedback
- [ ] Sécurité et validation

---

Coche chaque étape `[x]` une fois terminée !
