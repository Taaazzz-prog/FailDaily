# 🏛️ Site CGU FailDaily

Site officiel des Conditions Générales d'Utilisation et documents légaux de FailDaily.

**URL de production :** https://cgu.faildaily.com

---

## 📋 **CONTENU DU SITE**

### **Documents Légaux Inclus**
- ✅ **Conditions Générales d'Utilisation (CGU)**
- ✅ **Politique de Confidentialité**
- ✅ **Droits RGPD et Protection des Données**
- ✅ **Politique des Cookies**
- ✅ **Mentions Légales**
- ✅ **Conditions d'Utilisation pour Mineurs**
- ✅ **Charte de Modération**

### **Fonctionnalités**
- 🎨 **Design professionnel** inspiré des présentations PowerPoint
- 📱 **Responsive design** optimisé mobile/tablette/desktop
- 🍪 **Gestion avancée des cookies** avec préférences utilisateur
- 🔒 **Sécurité renforcée** (HTTPS, CSP, headers sécurisés)
- ♿ **Accessibilité** respectant les standards WCAG
- 🚀 **Performance optimisée** (compression, cache, CDN)

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Structure des Fichiers**
```
cgu-site/
├── index.html              # Page principale avec tous les documents
├── styles.css              # Styles CSS avec design PowerPoint
├── script.js               # JavaScript interactif
├── docker-compose.cgu.yml  # Configuration Docker
├── cgu-nginx.conf          # Configuration Nginx optimisée
├── deploy-cgu.sh           # Script de déploiement Linux/Mac
├── deploy-cgu.ps1          # Script de déploiement Windows
└── README.md               # Cette documentation
```

### **Stack Technique**
- **Frontend :** HTML5, CSS3, JavaScript ES6+
- **Serveur :** Nginx Alpine (conteneur Docker)
- **Proxy :** Traefik avec SSL automatique (Let's Encrypt)
- **Domaine :** cgu.faildaily.com
- **Réseau :** faildaily-network (Docker)

---

## 🚀 **DÉPLOIEMENT**

### **Prérequis**
- Docker et Docker Compose installés
- Accès au serveur OVH (51.75.55.185)
- Domaine cgu.faildaily.com configuré dans Traefik
- Réseau Docker `faildaily-network` existant

### **Déploiement Automatique**

#### **Sur Windows (PowerShell)**
```powershell
# Déploiement standard
.\deploy-cgu.ps1

# Déploiement forcé sans tests
.\deploy-cgu.ps1 -Force -SkipTests

# Déploiement avec environnement spécifique
.\deploy-cgu.ps1 -Environment "staging"
```

#### **Sur Linux/Mac (Bash)**
```bash
# Rendre le script exécutable
chmod +x deploy-cgu.sh

# Déploiement
./deploy-cgu.sh
```

### **Déploiement Manuel**

#### **1. Préparer l'environnement**
```bash
# Créer le réseau si nécessaire
docker network create faildaily-network

# Aller dans le répertoire
cd cgu-site/
```

#### **2. Démarrer le service**
```bash
# Démarrer le conteneur
docker-compose -f docker-compose.cgu.yml up -d

# Vérifier le status
docker ps | grep faildaily_cgu
```

#### **3. Vérifications**
```bash
# Tester la configuration Nginx
docker exec faildaily_cgu nginx -t

# Tester l'accès local
docker exec faildaily_cgu curl -f http://localhost/

# Voir les logs
docker logs faildaily_cgu
```

---

## 🔧 **CONFIGURATION**

### **Variables d'Environnement**
```yaml
# Dans docker-compose.cgu.yml
environment:
  - TZ=Europe/Paris           # Fuseau horaire
  - NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
```

### **Configuration Nginx Personnalisée**
Le fichier `cgu-nginx.conf` inclut :
- **Compression gzip** pour tous les types de fichiers
- **Headers de sécurité** (CSP, XSS Protection, etc.)
- **Cache optimisé** pour les ressources statiques
- **Logs structurés** pour le monitoring
- **Redirections HTTPS** automatiques

### **Configuration Traefik**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.cgu.rule=Host(`cgu.faildaily.com`)"
  - "traefik.http.routers.cgu.entrypoints=websecure"
  - "traefik.http.routers.cgu.tls=true"
  - "traefik.http.routers.cgu.tls.certresolver=letsencrypt"
```

---

## 🛠️ **MAINTENANCE**

### **Commandes Utiles**

#### **Gestion du Conteneur**
```bash
# Redémarrer le service
docker restart faildaily_cgu

# Arrêter le service
docker stop faildaily_cgu

# Supprimer le conteneur
docker rm faildaily_cgu

# Shell dans le conteneur
docker exec -it faildaily_cgu sh
```

#### **Logs et Monitoring**
```bash
# Logs en temps réel
docker logs -f faildaily_cgu

# Logs avec timestamp
docker logs -t faildaily_cgu

# Dernières 50 lignes de logs
docker logs --tail 50 faildaily_cgu
```

#### **Tests de Fonctionnement**
```bash
# Test configuration Nginx
docker exec faildaily_cgu nginx -t

# Recharger la configuration Nginx
docker exec faildaily_cgu nginx -s reload

# Test de connectivité
curl -I https://cgu.faildaily.com

# Test SSL
openssl s_client -connect cgu.faildaily.com:443 -servername cgu.faildaily.com
```

### **Mise à Jour du Contenu**

#### **Méthode 1 : Redéploiement complet**
```bash
# Modifier les fichiers HTML/CSS/JS
# Puis relancer le déploiement
./deploy-cgu.sh
```

#### **Méthode 2 : Mise à jour à chaud**
```bash
# Copier les nouveaux fichiers
docker cp index.html faildaily_cgu:/usr/share/nginx/html/
docker cp styles.css faildaily_cgu:/usr/share/nginx/html/
docker cp script.js faildaily_cgu:/usr/share/nginx/html/

# Recharger Nginx
docker exec faildaily_cgu nginx -s reload
```

---

## 🔍 **MONITORING ET ALERTES**

### **Health Checks**
```bash
# Script de vérification automatique
#!/bin/bash
HEALTH_URL="https://cgu.faildaily.com"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $STATUS -eq 200 ]; then
    echo "✅ CGU site is healthy"
else
    echo "❌ CGU site is down (HTTP $STATUS)"
    # Envoyer une alerte
fi
```

### **Métriques à Surveiller**
- **Disponibilité** : HTTP 200 sur https://cgu.faildaily.com
- **Temps de réponse** : < 500ms pour la page principale
- **Certificat SSL** : Expiration et validité
- **Espace disque** : Logs Nginx
- **Mémoire conteneur** : Utilisation RAM

### **Logs Structurés**
Les logs Nginx sont formatés pour faciliter l'analyse :
```
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" $request_time
```

---

## 🔐 **SÉCURITÉ**

### **Headers de Sécurité Implémentés**
```nginx
# Protection XSS
X-XSS-Protection: 1; mode=block

# Prévention du clickjacking
X-Frame-Options: SAMEORIGIN

# Type MIME sécurisé
X-Content-Type-Options: nosniff

# Politique de référent
Referrer-Policy: strict-origin-when-cross-origin

# Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

### **Conformité Légale**
- **RGPD** : Politique de confidentialité détaillée
- **COPPA** : Conditions spéciales pour les mineurs
- **Cookies** : Gestion conforme avec bannière et préférences
- **Mentions légales** : Informations complètes de l'éditeur

### **Protection des Fichiers**
```nginx
# Bloquer l'accès aux fichiers sensibles
location ~ /\. { deny all; }           # Fichiers cachés
location ~ ~$ { deny all; }            # Fichiers temporaires
```

---

## 🚨 **DÉPANNAGE**

### **Problèmes Courants**

#### **1. Site inaccessible (502/503)**
```bash
# Vérifier le conteneur
docker ps | grep faildaily_cgu

# Vérifier les logs
docker logs faildaily_cgu

# Redémarrer le service
docker restart faildaily_cgu
```

#### **2. Certificat SSL invalide**
```bash
# Vérifier Traefik
docker logs traefik | grep cgu.faildaily.com

# Forcer le renouvellement
docker restart traefik
```

#### **3. Contenu non mis à jour**
```bash
# Vider le cache navigateur
# Ou forcer le rechargement : Ctrl+F5

# Vérifier la configuration cache Nginx
docker exec faildaily_cgu cat /etc/nginx/conf.d/default.conf
```

#### **4. Erreurs JavaScript**
```bash
# Vérifier les logs navigateur (F12)
# Vérifier le CSP dans les headers
curl -I https://cgu.faildaily.com
```

### **Commandes de Diagnostic**
```bash
# Status complet du service
docker inspect faildaily_cgu

# Utilisation des ressources
docker stats faildaily_cgu

# Processus dans le conteneur
docker exec faildaily_cgu ps aux

# Test de connectivité réseau
docker exec faildaily_cgu netstat -tlnp
```

---

## 📞 **CONTACT ET SUPPORT**

### **Équipe Technique**
- **Développement :** équipe FailDaily
- **Infrastructure :** OVH VPS
- **Support :** contact@faildaily.com

### **Documentation Technique**
- **Projet principal :** [FailDaily Repository](https://github.com/Taaazzz-prog/FailDaily)
- **Documentation API :** `/backend-api/README.md`
- **Guide Docker :** `/docker/README.md`

### **Liens Utiles**
- **Site principal :** https://faildaily.com
- **API backend :** https://api.faildaily.com
- **Site CGU :** https://cgu.faildaily.com
- **Monitoring Traefik :** https://traefik.faildaily.com (accès restreint)

---

## 📊 **MÉTRIQUES DE PERFORMANCE**

### **Objectifs de Performance**
- **First Contentful Paint :** < 1.5s
- **Largest Contentful Paint :** < 2.5s
- **Cumulative Layout Shift :** < 0.1
- **Time to Interactive :** < 3s

### **Optimisations Implémentées**
- **Compression gzip** : Réduction 70% de la taille
- **Cache headers** : 1 an pour les assets, 1h pour HTML
- **Minification** : CSS et JavaScript optimisés
- **Images optimisées** : Formats WebP quand supporté

---

*Dernière mise à jour : Janvier 2025*

*Site CGU FailDaily - Conformité légale et protection des données* 🛡️