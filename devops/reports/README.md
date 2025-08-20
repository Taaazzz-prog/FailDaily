# Dossier des Rapports DevOps

Ce dossier contient les rapports générés par les scripts d'analyse de performance :

## 📊 Types de Rapports

### Tests de Charge
- `artillery-report-*.json` - Rapports Artillery pour les tests de charge API
- `autocannon-*.txt` - Rapports Autocannon pour les tests de charge frontend

### Analyse de Performance
- `lighthouse-report-*.html` - Rapports Lighthouse d'audit de performance
- `bundle-analysis-*.html` - Analyses des bundles frontend
- `performance-metrics-*.json` - Métriques de performance détaillées

### Analyse des Dépendances
- `frontend-deps-*.json` - Analyse des dépendances frontend
- `backend-deps-*.json` - Analyse des dépendances backend
- `security-audit-*.json` - Rapports d'audit de sécurité

## 🧹 Nettoyage

Les rapports sont automatiquement horodatés. Pour nettoyer les anciens rapports :

```powershell
# Nettoyer les rapports de plus de 30 jours
Get-ChildItem devops/reports -Recurse | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

## 📁 Structure Recommandée

```
devops/reports/
├── lighthouse/
├── load-tests/
├── security/
└── dependencies/
```
