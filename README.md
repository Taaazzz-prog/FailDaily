# FailDaily - L'App qui Célèbre l'Imperfection

[![Status](https://img.shields.io/badge/Status-85%25%20Complete-brightgreen.svg)](https://github.com/Taaazzz-prog/FailDaily)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue.svg)](#)
[![Framework](https://img.shields.io/badge/Framework-Ionic%208%20%7C%20Angular%2020-red.svg)](#)

## 🎯 Concept Principal
Une application mobile qui inverse complètement les codes des réseaux sociaux traditionnels en encourageant les utilisateurs à partager leurs échecs, galères et moments gênants quotidiens.

## ⚡ État du Développement

### ✅ **IMPLÉMENTÉ ET FONCTIONNEL**
- 🔐 **Authentification complète** - Login/Register avec consentement RGPD
- 📱 **Interface utilisateur** - 10 pages fonctionnelles avec navigation
- 🗄️ **Base de données Supabase** - Local et production avec RLS
- 🏆 **Système de badges** - 58 badges dans 6 catégories
- 👤 **Profils utilisateur** - Stats, progression, préférences
- 📝 **Publication de fails** - Upload images, catégories, anonymat
- 💖 **Réactions positives** - Système de "Courage Hearts" et soutien
- 🛡️ **Modération IA** - OpenAI pour filtrer le contenu inapproprié
- 🔒 **Sécurité RGPD** - Consentement, gestion mineurs, privacy settings
- 👑 **Interface Admin** - Gestion utilisateurs et modération

### 🚧 **EN DÉVELOPPEMENT**
- 🔔 **Notifications push** - Configuré, en phase de test
- 📧 **Système d'email** - Pour consentement parental et notifications
- 🎮 **Features avancées** - Voice Notes, Group Challenges, AI Counselor
- 📊 **Analytics avancées** - Tracking détaillé des interactions

## 🚀 Fonctionnalités Principales

### 📱 Le "Fail du Jour"
- **Notification quotidienne aléatoire** (entre 18h-22h) : "Il est temps de partager ton fail du jour !"
- **Timer de 10 minutes** pour poster, sinon tu perds ta "streak de vulnérabilité"
- **Formats acceptés** : Photo + texte court (max 280 caractères) ou vidéo 15 sec max

### 🏆 Système de "Badges de Courage"
- **"Première fois"** : Premier post embarrassant
- **"Catastrophe culinaire"** : Brûler/rater un plat
- **"Moment awkward"** : Situation sociale gênante
- **"Échec professionnel"** : Rater une présentation, arriver en retard...
- **"Fail technologique"** : Problème informatique, mauvaise manipulation
- **"Transport chaotique"** : Rater son train, se perdre...

### 💝 Interactions Positives Uniquement
- **Pas de "likes"** mais des **"Courage Hearts" ❤️**
- **Réactions limitées** : "Ça m'est arrivé aussi 🙋", "Tu n'es pas seul 🤗", "Merci pour ta transparence 🌟"
- **Commentaires encourageants obligatoires** (l'IA détecte et bloque les moqueries)

### 📊 "Fail Analytics" Personnel
- **Graphique de tes domaines de galères** (cuisine, social, travail...)
- **"Niveau de vulnérabilité"** qui augmente avec tes partages
- **Rappel positif** : "Il y a 3 mois tu stressais pour la même chose, regarde comme tu as progressé !"

## Interface & UX

### Design Volontairement "Imparfait"
- **Couleurs douces et rassurantes** (pastel, beiges, roses poudrés)
- **Polices "manuscrites"** légèrement tremblantes
- **Illustrations maladroites** faites exprès (style dessin d'enfant)
- **Boutons légèrement de travers** pour casser la perfection

### Feed Principal : "La Galerie de l'Humanité"
- **Tri par proximité émotionnelle** plutôt que chronologique
- **Anonymisation partielle** : prénom + initiale seulement
- **Catégories de fails** pour trouver des gens qui vivent la même chose

## Fonctionnalités Anti-Toxicité

### Protection des Utilisateurs
- **IA de modération** qui détecte les moqueries et les supprime
- **Signalement en un tap** pour contenu méchant
- **Mode "Safe Space"** : seuls tes amis proches voient tes posts les plus vulnérables

### Encouragement Automatique
- **Messages motivants** : "Ton courage inspire 47 personnes aujourd'hui"
- **Rappels de croissance** : "Tu as surmonté 23 difficultés ce mois-ci !"
- **Connexions suggérées** avec des gens qui ont vécu les mêmes galères

## Monétisation Éthique

### Version Gratuite Complète
- Toutes les fonctionnalités de base gratuites
- Publicités uniquement pour des services de bien-être (thérapie, méditation...)

### Premium "Courage Club" (3€/mois)
- **Thérapeute virtuel IA** pour analyser tes patterns de stress
- **Journaling privé** avec suggestions d'amélioration
- **Groupes de soutien thématiques** (anxiété, échecs pro, relations...)

## Impact Social Visé

### Objectifs
- **Normaliser l'échec** comme partie de l'expérience humaine
- **Réduire l'anxiété sociale** en montrant que tout le monde galère
- **Créer de vraies connexions** basées sur la vulnérabilité partagée
- **Contrer la culture de la perfection** des autres réseaux sociaux

### Métriques de Succès
- Pas de "followers" ou "likes" comptabilisés
- **Indicateur principal** : "Niveau de bien-être ressenti après usage"
- **Sondages réguliers** sur l'impact psychologique positif
- **Partenariats avec psys** pour valider l'approche thérapeutique

## Exemple d'Utilisation

**Notification 19h32** : "Moment de courage ! Quel a été ton petit fail aujourd'hui ?"

**Post utilisateur** : *Photo d'un plat carbonisé*
"J'ai voulu impressionner mon date avec mes talents culinaires... Le détecteur de fumée n'était pas impressionné 😅 #CatastropheCulinaire"

**Réactions** : 23 ❤️ Courage Hearts
- "MarieL. : Pareil la semaine dernière ! On a fini au McDo 😂"
- "Alex M. : Au moins tu as essayé ! Mon dernier date c'était des pâtes au ketchup..."

**Badge débloqué** : "Chef Raté" 🍳💥

---

## 🛠️ **Stack Technique**

### Frontend
- **Ionic 8** - Framework mobile cross-platform
- **Angular 20** - Framework JavaScript
- **TypeScript** - Langage typé
- **SCSS** - Styles avancés avec animations

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Base de données relationnelle
- **Row Level Security** - Sécurité des données

### APIs Externes
- **OpenAI** - Modération de contenu IA
- **Firebase** - Notifications push (optionnel)

### Outils de Développement
- **Capacitor** - Accès aux APIs natives
- **Supabase CLI** - Développement local
- **ESLint** - Linting du code

## 📦 **Installation & Développement**

### Prérequis
```bash
# Node.js 18+ et npm
node --version && npm --version

# Ionic CLI
npm install -g @ionic/cli

# Supabase CLI
npm install -g supabase
```

### Setup Local
```bash
# Cloner le repository
git clone https://github.com/Taaazzz-prog/FailDaily
cd FailDaily

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Démarrer Supabase local
supabase start

# Lancer l'application
ionic serve
```

### Build Mobile
```bash
# iOS
ionic capacitor build ios

# Android  
ionic capacitor build android
```

## 📁 **Structure du Projet**

```
src/
├── app/
│   ├── components/         # Composants réutilisables
│   ├── guards/            # Guards d'authentification
│   ├── models/            # Modèles TypeScript
│   ├── pages/             # Pages de l'application
│   ├── pipes/             # Pipes personnalisés
│   ├── services/          # Services business
│   └── utils/             # Utilitaires et helpers
├── assets/                # Images et ressources
├── environments/          # Configuration des environnements
└── theme/                 # Styles globaux et thèmes
```

---

*FailDaily : Où l'imperfection devient inspirante* ✨

**Status MVP : 🟢 Prêt pour les tests utilisateurs**