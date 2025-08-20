# Fichier son pour les notifications de badges

Pour ajouter un son de notification de badges, placez un fichier audio `badge-unlock.mp3` dans le dossier `src/assets/sounds/`.

## Sons recommandés :
- Son court et agréable (0.5-1 seconde)
- Format MP3 ou OGG pour la compatibilité
- Volume modéré pour ne pas être dérangeant

## Exemple de sons gratuits :
- freesound.org
- zapsplat.com (inscription gratuite)
- pixabay.com/music/

Le service `BadgeNotificationService` tentera automatiquement de jouer le son s'il est disponible, sinon il ignore silencieusement l'erreur.
