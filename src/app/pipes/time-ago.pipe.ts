import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: Date | string | number): string {
    if (!value) return '';

    const now = new Date();
    const date = new Date(value);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Si la date est dans le futur, retourner "maintenant"
    if (diffInSeconds < 0) {
      return 'maintenant';
    }

    // Moins d'une minute
    if (diffInSeconds < 60) {
      return 'maintenant';
    }

    // Moins d'une heure
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    // Moins d'un jour
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    // Moins d'une semaine
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }

    // Moins d'un mois (30 jours)
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }

    // Moins d'un an
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `il y a ${months} mois`;
    }

    // Plus d'un an
    const years = Math.floor(diffInSeconds / 31536000);
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
  }
}
