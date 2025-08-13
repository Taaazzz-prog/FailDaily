# 🎯 Système de Notifications Encourageantes - FailDaily

## 📋 Vue d'ensemble

Ce document présente une approche simple et efficace pour implémenter le système de notifications encourageantes dans FailDaily, en s'appuyant sur l'infrastructure existante.

## 🏗️ Architecture proposée

### 1. Base de données (déjà en place)
```json
// preferences dans la table profiles
{
  "encouragementNotifications": true/false,
  "reminderFrequency": "daily" | "weekly" | "bi-weekly",
  "darkMode": true/false,
  "bio": "..."
}
```

### 2. Service de notifications (à créer)
```typescript
// src/app/services/notification.service.ts
export class NotificationService {
  // Gestion des notifications push locales
  // Planification selon les préférences
  // Templates de messages encourageants
}
```

## 🎨 Messages encourageants

### Catégories de messages
1. **Quotidiens** - Motivation générale
2. **Réactivation** - Utilisateurs inactifs  
3. **Célébration** - Après un partage de fail
4. **Progression** - Milestones de courage

### Exemples de messages
```typescript
const ENCOURAGEMENT_MESSAGES = {
  daily: [
    "💪 Aujourd'hui est un nouveau jour pour grandir !",
    "🌟 Chaque petit échec est une victoire sur la peur",
    "🚀 Ton courage d'hier inspire ton succès de demain"
  ],
  afterFail: [
    "🎉 Bravo pour ton courage de partager !",
    "💎 Tu viens de transformer un échec en diamant",
    "🔥 Cette vulnérabilité te rend plus fort(e)"
  ],
  reactivation: [
    "🌱 Prêt(e) à replanter une graine de courage ?",
    "✨ Ta communauté FailDaily t'attend",
    "🎯 Un petit pas aujourd'hui, un grand bond demain"
  ]
}
```

## ⚡ Implémentation simple

### Phase 1 : Notifications locales (1-2h de dev)
```typescript
// Utiliser Capacitor Local Notifications
import { LocalNotifications } from '@capacitor/local-notifications';

// Planifier selon les préférences utilisateur
async scheduleEncouragement() {
  const user = this.authService.getCurrentUser();
  if (!user?.preferences?.encouragementNotifications) return;
  
  const frequency = user.preferences.reminderFrequency || 'weekly';
  const message = this.getRandomMessage('daily');
  
  await LocalNotifications.schedule({
    notifications: [{
      title: "FailDaily 💪",
      body: message,
      id: Date.now(),
      schedule: { at: this.getNextNotificationTime(frequency) }
    }]
  });
}
```

### Phase 2 : Intelligence contextuelle (2-3h de dev)
```typescript
// Adapter les messages selon l'activité
getContextualMessage(user: User): string {
  const daysSinceLastFail = this.getDaysSinceLastActivity(user);
  
  if (daysSinceLastFail > 7) return this.getRandomMessage('reactivation');
  if (daysSinceLastFail === 0) return this.getRandomMessage('afterFail'); 
  return this.getRandomMessage('daily');
}
```

### Phase 3 : Push notifications (optionnel, 3-4h)
```typescript
// Intégration Firebase Cloud Messaging
// Pour notifications même app fermée
```

## 🔧 Intégration avec l'existant

### Hooks dans le code actuel
1. **Après création de fail** → Notification immédiate de félicitation
2. **Changement de préférences** → Replanification des notifications
3. **Login utilisateur** → Vérification et mise à jour des notifications
4. **Background/Foreground** → Gestion du cycle de vie

### Fichiers à modifier
```
src/app/services/
├── notification.service.ts          # NOUVEAU
├── push.service.ts                  # MODIFIER (déjà existant)
├── auth.service.ts                  # Hook sur login
└── fail.service.ts                  # Hook après création

src/app/pages/edit-profile/
└── edit-profile.page.ts             # Hook changement préférences
```

## 📱 UX/UI proposée

### Settings dans edit-profile
```html
<!-- Déjà implémenté -->
<ion-toggle [(ngModel)]="profileForm.encouragementNotifications">
  <ion-label>Notifications encourageantes</ion-label>
</ion-toggle>

<ion-select [(ngModel)]="profileForm.reminderFrequency">
  <ion-select-option value="daily">Quotidienne</ion-select-option>
  <ion-select-option value="weekly">Hebdomadaire</ion-select-option>
  <ion-select-option value="bi-weekly">Bi-mensuelle</ion-select-option>
</ion-select>
```

### Preview des notifications
```html
<!-- Nouveau composant optionnel -->
<ion-item button (click)="previewNotification()">
  <ion-icon name="notifications-outline" slot="start"></ion-icon>
  <ion-label>Aperçu des notifications</ion-label>
</ion-item>
```

## 🚀 Plan d'implémentation

### Étape 1 (30 min)
- [x] Structure des préférences en place
- [ ] Créer `NotificationService` basique

### Étape 2 (45 min)  
- [ ] Messages encourageants (templates)
- [ ] Logique de planification

### Étape 3 (45 min)
- [ ] Intégration avec préférences utilisateur
- [ ] Hook après création de fail

### Étape 4 (30 min)
- [ ] Tests et ajustements
- [ ] Gestion des permissions

## 💡 Avantages de cette approche

✅ **Simple** - Utilise Capacitor (déjà dans le projet)  
✅ **Rapide** - 2-3h de développement total  
✅ **Évolutif** - Peut évoluer vers push notifications  
✅ **Respectueux** - Complètement optionnel pour l'utilisateur  
✅ **Contextuel** - Messages adaptés à l'activité  
✅ **Local** - Fonctionne hors ligne  

## 🎯 Résultat attendu

Un système de notifications douces et encourageantes qui :
- Motive les utilisateurs selon leurs préférences
- S'adapte à leur niveau d'activité  
- Respecte leur choix de fréquence
- Renforce l'aspect bienveillant de l'app

---

*Ce système peut être implémenté progressivement, en commençant par les notifications locales basiques et en évoluant selon les retours utilisateurs.*
