# 🛡️ Modération AI - FailDaily

## 📋 Table des matières
- [Configuration actuelle](#configuration-actuelle)
- [Solution Google Perspective API (Gratuite)](#solution-google-perspective-api-gratuite)
- [Solution Node.js privée (Auto-hébergée)](#solution-nodejs-privée-auto-hébergée)
- [Comparaison des solutions](#comparaison-des-solutions)

---

## 🔧 Configuration actuelle

### ✅ État actuel dans `environment.prod.ts` - CONFIGURÉ
```typescript
// APIs externes (Local) - Configuration sécurisée via .env
api: {
  baseUrl: process.env['SUPABASE_URL'] || 'http://127.0.0.1:54321',
  moderationUrl: process.env['OPENAI_API_URL'] || 'https://api.openai.com/v1',
  moderationKey: process.env['OPENAI_API_KEY'] || 'sk-proj-placeholder',
  uploadMaxSize: 5 * 1024 * 1024,
  imageQuality: 85
}
```

### ✅ Configuration sécurisée - IMPLÉMENTÉE
- **Clé API OpenAI** : Stockée dans `.env` et protégée par `.gitignore`
- **Variables d'environnement** : Chargées via `process.env`
- **Fallbacks** : Valeurs par défaut pour le développement
- **Sécurité** : Clés sensibles jamais committées dans Git

### Utilisation prévue
- **Endpoint** : `https://api.openai.com/v1/moderations`
- **Coût** : ~$0.002 pour 1000 tokens
- **Avantages** : Très précis, multi-langues
- **Inconvénients** : Payant à long terme, dépendance externe

---

## 🆓 Solution Google Perspective API (Gratuite)

### 📊 Avantages
- ✅ **1 million de requêtes/jour gratuit**
- ✅ Développé par Google (utilisé par YouTube, Reddit)
- ✅ Support français excellent
- ✅ Scores détaillés par catégorie

### 🔑 Configuration

#### 1. Obtenir la clé API
```bash
# 1. Aller sur Google Cloud Console
# 2. Créer un projet ou utiliser existant
# 3. Activer Perspective API
# 4. Créer une clé API
```

#### 2. Mise à jour de l'environnement
```typescript
// environment.prod.ts
api: {
  baseUrl: 'http://127.0.0.1:54321',
  moderationUrl: 'https://commentanalyzer.googleapis.com/v1alpha1',
  moderationKey: 'AIzaSy...', // Votre clé Google
  uploadMaxSize: 5 * 1024 * 1024,
  imageQuality: 85
}
```

#### 3. Service de modération Angular/Ionic
```typescript
// src/app/services/moderation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.prod';

interface PerspectiveResponse {
  attributeScores: {
    TOXICITY: { summaryScore: { value: number } };
    SEVERE_TOXICITY: { summaryScore: { value: number } };
    IDENTITY_ATTACK: { summaryScore: { value: number } };
    INSULT: { summaryScore: { value: number } };
    PROFANITY: { summaryScore: { value: number } };
    THREAT: { summaryScore: { value: number } };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  
  constructor(private http: HttpClient) {}

  async moderateContent(text: string): Promise<boolean> {
    try {
      const url = `${environment.api.moderationUrl}/comments:analyze?key=${environment.api.moderationKey}`;
      
      const body = {
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {}
        },
        comment: { text }
      };

      const response = await this.http.post<PerspectiveResponse>(url, body).toPromise();
      
      // Seuils de modération
      const toxicityScore = response.attributeScores.TOXICITY.summaryScore.value;
      const severeToxicityScore = response.attributeScores.SEVERE_TOXICITY.summaryScore.value;
      
      // Bloque si toxicité > 70% ou toxicité sévère > 50%
      return toxicityScore < 0.7 && severeToxicityScore < 0.5;
      
    } catch (error) {
      console.error('Erreur de modération:', error);
      return true; // En cas d'erreur, on laisse passer (fail-safe)
    }
  }
}
```

#### 4. Intégration dans les formulaires
```typescript
// Dans votre composant de post
async onSubmitFail(failText: string) {
  const isContentSafe = await this.moderationService.moderateContent(failText);
  
  if (!isContentSafe) {
    this.showAlert('Contenu inapproprié détecté. Veuillez modifier votre message.');
    return;
  }
  
  // Procéder à la publication
  this.failService.createFail(failText);
}
```

---

## 🏠 Solution Node.js privée (Auto-hébergée)

### 🎯 Architecture recommandée

#### Backend Node.js avec Express
```javascript
// server/moderation-server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Liste de mots interdits (extensible)
const badWords = [
  'connard', 'salaud', 'enculé', 'putain', 'merde',
  'idiot', 'crétin', 'imbecile', 'débile', 'abruti',
  // Ajoutez selon vos besoins
];

// Patterns suspects
const suspiciousPatterns = [
  /(\w)\1{4,}/g, // Répétition excessive (aaaaa)
  /[A-Z]{5,}/g,  // CAPS LOCK excessif
  /(.{1,3})\1{3,}/g // Répétitions de motifs
];

// Analyse de sentiment basique
function analyzeSentiment(text) {
  const negativeWords = ['haine', 'mort', 'tuer', 'suicide', 'violence'];
  const positiveWords = ['courage', 'force', 'espoir', 'soutien', 'aide'];
  
  let score = 0;
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (negativeWords.some(neg => word.includes(neg))) score -= 1;
    if (positiveWords.some(pos => word.includes(pos))) score += 1;
  });
  
  return score;
}

// Endpoint de modération
app.post('/moderate', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Texte manquant' });
  }
  
  const result = {
    isApproved: true,
    confidence: 1.0,
    reasons: [],
    sentiment: analyzeSentiment(text),
    flags: {
      badWords: false,
      suspiciousPattern: false,
      negativeSentiment: false
    }
  };
  
  // Vérification des mots interdits
  const lowerText = text.toLowerCase();
  const foundBadWords = badWords.filter(word => 
    lowerText.includes(word.toLowerCase())
  );
  
  if (foundBadWords.length > 0) {
    result.isApproved = false;
    result.flags.badWords = true;
    result.reasons.push(`Mots inappropriés détectés: ${foundBadWords.join(', ')}`);
  }
  
  // Vérification des patterns suspects
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(text)
  );
  
  if (hasSuspiciousPattern) {
    result.isApproved = false;
    result.flags.suspiciousPattern = true;
    result.reasons.push('Pattern suspect détecté');
  }
  
  // Vérification du sentiment
  if (result.sentiment < -2) {
    result.flags.negativeSentiment = true;
    result.reasons.push('Contenu très négatif');
    // Note: on peut choisir de ne pas bloquer automatiquement
  }
  
  // Calcul de confiance
  result.confidence = result.isApproved ? 0.85 : 0.95;
  
  res.json(result);
});

// Endpoint pour ajouter des mots interdits (admin)
app.post('/admin/badwords', (req, res) => {
  const { words, adminKey } = req.body;
  
  // Vérification admin (remplacez par votre logique)
  if (adminKey !== 'your-admin-secret-key') {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  
  badWords.push(...words);
  res.json({ success: true, totalBadWords: badWords.length });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🛡️ Serveur de modération démarré sur le port ${PORT}`);
});
```

#### Service Angular pour votre solution privée
```typescript
// src/app/services/private-moderation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface PrivateModerationResponse {
  isApproved: boolean;
  confidence: number;
  reasons: string[];
  sentiment: number;
  flags: {
    badWords: boolean;
    suspiciousPattern: boolean;
    negativeSentiment: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PrivateModerationService {
  private moderationUrl = 'http://localhost:3001'; // Votre serveur Node.js
  
  constructor(private http: HttpClient) {}

  async moderateContent(text: string): Promise<PrivateModerationResponse> {
    try {
      const response = await this.http.post<PrivateModerationResponse>(
        `${this.moderationUrl}/moderate`,
        { text }
      ).toPromise();
      
      return response;
    } catch (error) {
      console.error('Erreur de modération privée:', error);
      // Fail-safe: en cas d'erreur, on approuve
      return {
        isApproved: true,
        confidence: 0.5,
        reasons: ['Erreur du service de modération'],
        sentiment: 0,
        flags: { badWords: false, suspiciousPattern: false, negativeSentiment: false }
      };
    }
  }
}
```

#### Configuration dans environment.prod.ts
```typescript
// Pour la solution privée
api: {
  baseUrl: 'http://127.0.0.1:54321',
  moderationUrl: 'http://localhost:3001',
  moderationKey: 'your-admin-secret-key', // Pour les fonctions admin
  uploadMaxSize: 5 * 1024 * 1024,
  imageQuality: 85
}
```

#### Package.json pour le serveur de modération
```json
{
  "name": "faildaily-moderation",
  "version": "1.0.0",
  "description": "Serveur de modération privé pour FailDaily",
  "main": "moderation-server.js",
  "scripts": {
    "start": "node moderation-server.js",
    "dev": "nodemon moderation-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## ⚖️ Comparaison des solutions

| Critère              | OpenAI             | Google Perspective | Solution privée |
| -------------------- | ------------------ | ------------------ | --------------- |
| **Coût**             | Payant ($0.002/1K) | Gratuit (1M/jour)  | Gratuit total   |
| **Précision**        | ⭐⭐⭐⭐⭐              | ⭐⭐⭐⭐               | ⭐⭐⭐             |
| **Confidentialité**  | ❌ Externe          | ❌ Externe          | ✅ Privé         |
| **Maintenance**      | ✅ Aucune           | ✅ Aucune           | ❌ À maintenir   |
| **Personnalisation** | ❌ Limitée          | ❌ Limitée          | ✅ Totale        |
| **Offline**          | ❌ Non              | ❌ Non              | ✅ Possible      |
| **Setup**            | ⭐⭐⭐⭐⭐              | ⭐⭐⭐⭐               | ⭐⭐              |

---

## 🎯 Recommandations

### Phase 1 - MVP (Immédiat)
**Utiliser Google Perspective API**
- Gratuit et efficace
- Quick setup
- Parfait pour tester le concept

### Phase 2 - Croissance (6 mois+)
**Système hybride**
- Solution privée comme base
- Google Perspective en backup
- Modération communautaire

### Phase 3 - Scale (1 an+)
**Solution 100% privée**
- Serveur Node.js optimisé
- Machine Learning personnalisé
- Base de données de modération enrichie

---

## 🚀 Prochaines étapes

1. **Choisir la solution** pour commencer
2. **Implémenter le service de modération** choisi
3. **Tester** avec du contenu réel
4. **Affiner les seuils** selon les retours
5. **Ajouter une interface admin** pour gérer les règles

Voulez-vous que je vous aide à implémenter une de ces solutions ? 🛡️
