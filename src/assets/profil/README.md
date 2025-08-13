# Profils d'avatars par défaut

Ce dossier contient les avatars par défaut que les utilisateurs peuvent choisir.

## Comment ajouter de nouveaux avatars :

1. **Ajouter l'image** : Placez votre nouvelle image (format PNG recommandé, 200x200px minimum) dans ce dossier
2. **Mettre à jour la liste** : Ajoutez le nom de votre fichier dans `avatars-list.json`

### Exemple :
Si vous ajoutez `nouveau-avatar.png`, modifiez `avatars-list.json` :
```json
[
    "face.png",
    "avatar1.png",
    "nouveau-avatar.png"
]
```

## Images actuelles requises :
- `face.png` (avatar par défaut principal)
- Tous les autres noms listés dans `avatars-list.json`

**Important :** L'application lit automatiquement `avatars-list.json` et vérifie que chaque image existe. Si une image est listée mais n'existe pas, elle ne s'affichera pas.
