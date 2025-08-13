# 🧪 Test du Système de Notification de Badges

## 🎯 Comment Tester

### 1. Déclenchement Manuel (Console Browser)
```javascript
// Ouvrir la console (F12) et exécuter :

// Simuler un badge débloqué
const mockBadge = {
  id: 'test-badge',
  name: 'Badge de Test',
  description: 'Un badge pour tester les notifications',
  icon: 'trophy',
  category: 'SPECIAL',
  rarity: 'legendary',
  unlockedDate: new Date()
};

// Émettre l'événement
window.eventBus?.emit('BADGE_UNLOCKED', { badges: [mockBadge] });
```

### 2. Test via Action Utilisateur
```typescript
// Dans un service ou composant, déclencher manuellement :
this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { 
  badges: [{ 
    id: 'reactions-25', 
    name: 'Supporteur Actif', 
    description: 'Donner 25 réactions',
    icon: 'heart-half-outline',
    category: 'ENTRAIDE',
    rarity: 'common'
  }] 
});
```

### 3. Flux Complet à Tester
1. **Poster un fail** → Badge "Premier Courage"
2. **Donner 25 réactions** → Badge "Supporteur Actif" (reactions-25)
3. **Cliquer "Voir mes badges"** → Navigation avec highlight
4. **Vérifier la surbrillance** des badges récents

## ✅ Vérifications

### Notification Toast
- [x] Apparition en haut de l'écran
- [x] Design avec gradient selon rareté
- [x] Icône du badge visible
- [x] Texte lisible et informations complètes
- [x] Boutons "Voir mes badges" et "✨"

### Navigation
- [x] Clic bouton redirige vers `/badges?highlight=recent`
- [x] Page badges s'ouvre en mode "unlocked"
- [x] Message de félicitation s'affiche
- [x] Surbrillance disparaît après 5 secondes

### Effets Visuels
- [x] Vibration haptique (sur mobile)
- [x] Confetti animé (clic ✨)
- [x] Son de notification (si fichier audio disponible)

## 🐛 Dépannage

### Toast ne s'affiche pas
- Vérifier que `BadgeNotificationService` est injecté dans app
- Vérifier les événements dans la console : `AppEvents.BADGE_UNLOCKED`

### Navigation ne fonctionne pas
- Vérifier l'import de `Router` dans BadgeNotificationService
- Vérifier que la route `/badges` existe

### Pas d'effet visuel
- Vérifier que `CelebrationService` est importé
- Vérifier les styles CSS dans global.scss

### Badges pas surlignés
- Vérifier `ActivatedRoute` dans BadgesPage
- Vérifier le paramètre `highlight=recent` dans l'URL

## 🎊 Résultat Attendu

1. **Toast élégant** avec design spécifique à la rareté
2. **Navigation fluide** vers la page des badges
3. **Badge récent surligné** avec animation brillante
4. **Message de félicitation** personnalisé
5. **Effets de célébration** au clic sur ✨

---

**🚀 Le système est prêt ! L'utilisateur bénéficie d'une expérience complète et gratifiante !**
