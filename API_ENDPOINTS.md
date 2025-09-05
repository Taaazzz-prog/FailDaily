# 📋 **LISTE COMPLÈTE DES POINTS D'API - FAILDAILY**

## 🌐 **URL BASE DE L'API**
- **Production** : `https://faildaily.com/api`
- **Développement** : `http://localhost:3000/api`

---

## 🔐 **AUTHENTIFICATION**
### `/api/auth`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| POST | `/auth/register` | Inscription utilisateur | ❌ Public |
| POST | `/auth/login` | Connexion utilisateur | ❌ Public |
| GET | `/auth/verify` | Vérification du token JWT | 🔒 Token |
| POST | `/auth/logout` | Déconnexion | 🔒 Token |
| GET | `/auth/check-email` | Vérifier disponibilité email | ❌ Public |
| GET | `/auth/profile` | Profil utilisateur complet | 🔒 Token |
| PUT | `/auth/profile` | Mise à jour profil | 🔒 Token |
| PUT | `/auth/password` | Changement mot de passe | 🔒 Token |
| POST | `/auth/password-reset` | Réinitialisation mot de passe | ❌ Public |

---

## 📝 **INSCRIPTION & VÉRIFICATION**
### `/api/registration`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/registration/check-email` | Vérifier email existant | ❌ Public |
| GET | `/registration/check-display-name` | Vérifier nom d'affichage | ❌ Public |
| POST | `/registration/generate-display-name` | Générer nom d'affichage | ❌ Public |
| GET | `/registration/validate-referral` | Valider code parrainage | ❌ Public |
| POST | `/registration/register` | Inscription complète | ❌ Public |
| POST | `/registration/resend-verification` | Renvoyer email vérification | 🔒 Token |
| POST | `/registration/verify-email` | Vérifier email | ❌ Public |
| GET | `/registration/stats` | Statistiques inscription | ❌ Public |

### `/api/age-verification`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| POST | `/age-verification/verify` | Vérification d'âge | ❌ Public |
| PUT | `/age-verification/update-birth-date` | Mise à jour date naissance | 🔒 Token |
| GET | `/age-verification/user-age` | Âge utilisateur | 🔒 Token |
| GET | `/age-verification/statistics` | Statistiques d'âge | 🔒 Token |
| GET | `/age-verification/coppa-compliance` | Conformité COPPA | 🔒 Token |

---

## 💥 **FAILS (ÉCHECS)**
### `/api/fails`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/fails` | Liste des fails avec pagination | 🔒 Token |
| GET | `/fails/search` | Recherche de fails | 🔒 Token |
| GET | `/fails/categories` | Catégories disponibles | ❌ Public |
| GET | `/fails/stats` | Statistiques des fails | 🔒 Token |
| GET | `/fails/public` | Fails publics uniquement | 🔒 Token |
| POST | `/fails` | Créer un nouveau fail | 🔒 Token |
| GET | `/fails/:id` | Détails d'un fail spécifique | 🔒 Token |
| PUT | `/fails/:id` | Modifier un fail | 🔒 Token |
| DELETE | `/fails/:id` | Supprimer un fail | 🔒 Token |
| POST | `/fails/:id/report` | Signaler un fail | 🔒 Token |

---

## 💬 **COMMENTAIRES**
### `/api/fails/:id/comments`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| POST | `/fails/:id/comments` | Ajouter un commentaire | 🔒 Token |
| GET | `/fails/:id/comments` | Récupérer commentaires | 🔒 Optionnel |
| PUT | `/fails/:id/comments/:commentId` | Modifier commentaire | 🔒 Token |
| DELETE | `/fails/:id/comments/:commentId` | Supprimer commentaire | 🔒 Token |
| GET | `/user/comments/stats` | Stats commentaires utilisateur | 🔒 Token |
| POST | `/fails/:id/comments/:commentId/like` | Liker un commentaire | 🔒 Token |
| DELETE | `/fails/:id/comments/:commentId/like` | Retirer like commentaire | 🔒 Token |
| POST | `/fails/:id/comments/:commentId/report` | Signaler commentaire | 🔒 Token |

---

## 😊 **RÉACTIONS**
### `/api/fails/:id/reactions`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| POST | `/fails/:id/reactions` | Ajouter une réaction | 🔒 Token |
| DELETE | `/fails/:id/reactions` | Supprimer une réaction | 🔒 Token |
| DELETE | `/fails/:id/reactions/:reactionType` | Supprimer réaction spécifique | 🔒 Token |
| GET | `/fails/:id/reactions` | Récupérer réactions | 🔒 Optionnel |
| GET | `/user/reactions/stats` | Stats réactions utilisateur | 🔒 Token |

---

## 🏆 **BADGES & POINTS**
### `/api/badges`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/badges/available` | Tous les badges disponibles | 🔒 Token |
| GET | `/badges/definitions` | Définitions des badges | 🔒 Token |
| GET | `/badges` | Liste des badges | 🔒 Token |
| POST | `/badges/check-unlock/:userId` | Vérifier déblocage badges | 🔒 Token |

### `/api/users`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/users/:userId/stats` | Statistiques utilisateur | 🔒 Token |
| GET | `/users/:userId/badges` | Badges de l'utilisateur | 🔒 Token |
| GET | `/users/:userId/badges/ids` | IDs badges utilisateur | 🔒 Token |
| GET | `/users/:userId/fails` | Fails de l'utilisateur | 🔒 Token |

---

## 📁 **UPLOAD & FICHIERS**
### `/api/upload`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| POST | `/upload/image` | Upload images générales | 🔒 Token |
| POST | `/upload/avatar` | Upload avatar utilisateur | 🔒 Token |
| DELETE | `/upload/image/:filename` | Supprimer image | 🔒 Token |
| GET | `/upload/info/:filename` | Informations fichier | 🔒 Token |

---

## 📊 **LOGS & MONITORING**
### `/api/logs`
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/logs/system` | Logs système | 🔒 Token |
| GET | `/logs/user/:userId` | Logs utilisateur spécifique | 🔒 Token |
| POST | `/logs/system` | Créer log système | 🔒 Token |
| DELETE | `/logs/cleanup` | Nettoyage logs anciens | 🔒 Token |
| POST | `/logs/comprehensive` | Envoyer logs frontend | ❌ Public |
| GET | `/logs/comprehensive` | Récupérer logs complets | 🔒 Token |
| PUT | `/logs/comprehensive/:id` | Mettre à jour log | 🔒 Admin |

---

## 👑 **ADMINISTRATION**
### `/api/admin`

#### **📊 Dashboard & Stats**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/admin/dashboard/stats` | Statistiques générales | 🔒 Admin |

#### **👤 Gestion Utilisateurs**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/admin/users` | Liste des utilisateurs | 🔒 Admin |
| GET | `/admin/users/:userId/points` | Points utilisateur | 🔒 Admin |
| POST | `/admin/users/:userId/points` | Modifier points utilisateur | 🔒 Admin |
| PUT | `/admin/users/:id/parental-approve` | Validation parentale | 🔒 Super Admin |
| PUT | `/admin/users/:id/parental-revoke` | Révocation parentale | 🔒 Super Admin |
| PUT | `/admin/users/:id/parental-reject` | Rejet validation parentale | 🔒 Super Admin |

#### **🛡️ Modération**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/admin/moderation/config` | Configuration modération | 🔒 Admin |
| PUT | `/admin/moderation/config` | Modifier config modération | 🔒 Admin |
| GET | `/admin/fails/reported` | Fails signalés | 🔒 Admin |
| GET | `/admin/comments/reported` | Commentaires signalés | 🔒 Admin |
| GET | `/admin/fails/by-status` | Fails par statut | 🔒 Admin |
| GET | `/admin/comments/by-status` | Commentaires par statut | 🔒 Admin |
| POST | `/admin/comments/:id/moderate` | Modérer commentaire | 🔒 Admin |
| POST | `/admin/fails/:id/moderate` | Modérer fail | 🔒 Admin |
| PUT | `/admin/fails/:id/moderation` | Statut modération fail | 🔒 Admin |
| PUT | `/admin/comments/:id/moderation` | Statut modération commentaire | 🔒 Admin |

#### **⚙️ Configuration Système**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/admin/config` | Configuration consolidée | 🔒 Admin |
| PUT | `/admin/config` | Mise à jour config globale | 🔒 Admin |
| GET | `/admin/points/config` | Configuration points | 🔒 Admin |
| PUT | `/admin/points/config` | Modifier config points | 🔒 Admin |
| GET | `/admin/reactions/config` | Configuration réactions | 🔒 Admin |
| PUT | `/admin/reactions/config` | Modifier config réactions | 🔒 Admin |

#### **📋 Logs Administration**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/admin/logs/summary` | Résumé logs système | 🔒 Super Admin |
| GET | `/admin/logs/by-day` | Logs par jour | 🔒 Super Admin |
| GET | `/admin/logs/by-user` | Logs par utilisateur | 🔒 Super Admin |
| GET | `/admin/logs/actions` | Logs par actions | 🔒 Super Admin |
| GET | `/admin/logs/list` | Liste détaillée logs | 🔒 Super Admin |
| GET | `/admin/logs/by-type` | Logs par type | 🔒 Super Admin |

#### **🗄️ Gestion Base de Données**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| POST | `/admin/tables/:tableName/truncate` | Vider table spécifique | 🔒 Super Admin |
| POST | `/admin/tables/bulk-truncate` | Vidage en masse | 🔒 Super Admin |

---

## 🔧 **ENDPOINTS UTILITAIRES**

### **Health Check**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/api/health` | État de santé de l'API | ❌ Public |
| GET | `/api` | Informations API | ❌ Public |

### **Stats Utilisateur Protégées**
| Méthode | Endpoint | Description | Protection |
|---------|----------|-------------|------------|
| GET | `/api/user/stats` | Statistiques utilisateur connecté | 🔒 Token |
---

## 🔑 **LÉGENDE DES PROTECTIONS**

- ❌ **Public** : Accessible sans authentification
- 🔒 **Token** : Nécessite un token JWT valide
- 🔒 **Optionnel** : Token optionnel (contenu adapté)
- 🔒 **Admin** : Nécessite rôle admin ou modérateur
- 🔒 **Super Admin** : Nécessite rôle super_admin uniquement

---

## 📈 **STATISTIQUES ENDPOINTS**

- **Total Endpoints** : **95 points d'API**
- **Endpoints Publics** : 12
- **Endpoints Protégés Token** : 56
- **Endpoints Admin/Modérateur** : 25
- **Endpoints Super Admin** : 12
- **Groupes Fonctionnels** : 11

---

## 📊 **RÉPARTITION PAR CATÉGORIES**

| Catégorie | Nombre d'Endpoints |
|-----------|-------------------|
| 🔐 **Authentification** | 9 |
| 📝 **Inscription/Vérification** | 13 |
| 💥 **Fails** | 10 |
| 💬 **Commentaires** | 8 |
| 😊 **Réactions** | 5 |
| 🏆 **Badges/Points** | 8 |
| 📁 **Upload/Fichiers** | 4 |
| 📊 **Logs/Monitoring** | 7 |
| 👑 **Administration** | 31 |

---

**Base de données** : MySQL 8.0.35  
**Framework** : Node.js 24.4.1 + Express  
**Authentification** : JWT  
**Rate Limiting** : 5000 req/15min (Production) | 10000 req/15min (Test)  
**CORS** : Configuré pour domaines autorisés

---

*Dernière mise à jour : 5 septembre 2025*  
*Version API : 1.0.0*
