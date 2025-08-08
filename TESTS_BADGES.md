# Tests du système de badges FailDaily

## ✅ Tests à effectuer pour vérifier le fonctionnement

### 1. **Création de la table user_badges**
- [ ] Ouvrir Supabase console
- [ ] Aller dans SQL Editor
- [ ] Exécuter le script du fichier `sql/create_user_badges_table.sql`
- [ ] Vérifier que la table `user_badges` est créée

### 2. **Test des badges de base**
1. **Premier Fail**
   - [ ] Poster un nouveau fail
   - [ ] Vérifier que le badge "Premier Courage" se débloque
   - [ ] Vérifier la notification Toast

2. **Première Réaction**  
   - [ ] Donner une réaction sur un fail
   - [ ] Vérifier que le badge "Première Réaction" se débloque
   - [ ] Vérifier la notification Toast

### 3. **Test des statistiques dynamiques**

#### Page Badges - Statistiques par rareté
- [ ] Aller sur la page Badges
- [ ] Vérifier que les statistiques affichent le format "X/Y" au lieu de juste "0"
- [ ] Exemple attendu :
  - Rares : "1/3" (au lieu de "1")
  - Épiques : "0/2" (au lieu de "0") 
  - Légendaires : "0/1" (au lieu de "0")

#### Prochains défis - Données dynamiques
- [ ] Section "Prochains défis ! 🎯"
- [ ] Vérifier que les défis ne sont plus codés en dur
- [ ] Exemples attendus (selon vos données) :
  - "Poster votre premier fail" - Badge "Premier Courage" (Commun) - 1/1
  - "Poster 5 fails" - Badge "Apprenti Courage" (Commun) - 3/5

### 4. **Test de progression réelle**

#### Badges de volume
- [ ] Poster plusieurs fails (5, 10, 25)
- [ ] Vérifier que les badges "Apprenti Courage", "Courageux", etc. se débloquent
- [ ] Vérifier la progression dans "Prochains défis"

#### Badges de réactions
- [ ] Donner plusieurs réactions (10, 50)  
- [ ] Vérifier que les badges "Supporter Actif", "Grand Supporter" se débloquent
- [ ] Vérifier la mise à jour des statistiques

### 5. **Test de persistance**
- [ ] Fermer et rouvrir l'application
- [ ] Vérifier que les badges débloqués sont toujours visibles
- [ ] Vérifier que les statistiques sont correctes
- [ ] Test du refresh (glisser vers le bas) sur la page Badges

### 6. **Test des statistiques avancées**

#### Badge "Explorateur" - Catégories différentes
- [ ] Poster des fails dans 5 catégories différentes
- [ ] Vérifier que le badge "Explorateur" se débloque

#### Badge "Populaire" - Réactions reçues
- [ ] Avoir un fail qui reçoit 10+ réactions
- [ ] Vérifier que le badge "Populaire" se débloque

## 🐛 Problèmes potentiels à surveiller

### Console Browser
- [ ] Ouvrir les outils de développement (F12)
- [ ] Vérifier qu'il n'y a pas d'erreurs JavaScript
- [ ] Surveiller les logs de chargement des badges

### Base de données
- [ ] Vérifier que les badges s'enregistrent bien dans `user_badges`
- [ ] Vérifier que les statistiques se calculent correctement
- [ ] Pas de doublons de badges grâce à la contrainte unique

### Performance
- [ ] Les statistiques se chargent rapidement
- [ ] Pas de requêtes excessives à la base de données
- [ ] Les notifications Toast apparaissent sans délai

## 📊 Résultats attendus

### Après avoir posté 1 fail + donné 1 réaction :
```
Badges débloqués : 2/10 (20%)

Rares : 0/3
Épiques : 0/2  
Légendaires : 0/1

Prochains défis :
• Poster 5 fails - Badge "Apprenti Courage" (Commun) - 1/5
• Donner 10 réactions - Badge "Supporter Actif" (Commun) - 1/10
```

### Si tout fonctionne :
✅ **Le système de badges est opérationnel !**
- Les données viennent vraiment de la base de données
- Les statistiques s'affichent au format "X/Y" 
- Les notifications fonctionnent
- Les "Prochains défis" sont dynamiques
- La progression est sauvegardée
