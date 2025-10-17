# ====================================================================
# 📋 CONFIGURATION FAILDAILY - VALEURS RÉELLES
# ====================================================================
# Document privé pour bruno@taaazzz.be - FailDaily
# ⚠️  NE PAS COMMITER CE FICHIER !
# ====================================================================

## 🗄️ BASE DE DONNÉES
- **Host**: localhost (dev) / db (production Docker)
- **Port**: 3306
- **User**: root
- **Password**: @51008473@Alexia@
- **Database**: faildaily

## 🔐 AUTHENTIFICATION
- **JWT Secret**: faildaily_super_secret_key_for_production_2025_bruno_taaazzz
- **Bcrypt Rounds**: 12

## 📧 EMAIL OVH
- **Host**: ssl0.ovh.net
- **Port**: 465
- **SSL**: true
- **User**: contact@taaazzz-prog.fr
- **Password**: @51008473@Alexia@
- **From**: FailDaily <contact@taaazzz-prog.fr>

## 🌐 DOMAINES
- **Principal**: faildaily.com
- **API**: api.faildaily.com
- **Email admin**: contact@taaazzz-prog.fr

## 🔑 API EXTERNES
- **OpenAI**: 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
- **Model**: gpt-3.5-turbo

## 🐳 DOCKER PRODUCTION
- **Traefik Email**: contact@taaazzz-prog.fr
- **SSL**: Let's Encrypt automatique
- **Ports**: 80, 443, 8080 (dashboard)

## 🖥️ SERVEUR OVH
- **IP**: 51.75.55.185
- **User SSH**: taaazzz
- **Path**: /home/taaazzz/FailDaily

## 📁 CHEMINS IMPORTANTES
- **Projet**: /home/taaazzz/FailDaily
- **Uploads**: /app/uploads
- **Logs**: /var/log/faildaily

## 🔧 COMMANDES UTILES

### Déploiement local:
```bash
cd "d:/Web API/FailDaily"
docker-compose up -d
```

### Déploiement OVH:
```powershell
.\deploy-to-ovh.ps1 -ServerIP "51.75.55.185"
```

### SSH OVH:
```bash
ssh taaazzz@51.75.55.185
```

### Tests:
```bash
cd backend-api && npm test
cd frontend && ng test
```

### Backup BDD:
```bash
mysqldump -u root -p@51008473@Alexia@ faildaily > backup.sql
```

## 🚨 TODO AVANT PRODUCTION
1. [✅] Configurer mot de passe email OVH
2. [✅] Obtenir clé OpenAI
3. [ ] Configurer DNS faildaily.com
4. [ ] Tester SSL Let's Encrypt
5. [ ] Configurer monitoring

## 📱 LIENS UTILES
- **Repo**: https://github.com/Taaazzz-prog/FailDaily
- **Local**: http://localhost:8000
- **Production**: https://faildaily.com
- **Traefik**: http://localhost:8080 (dev)

====================================================================