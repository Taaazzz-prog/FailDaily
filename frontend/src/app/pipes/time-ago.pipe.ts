import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: Date | string | number): string {
    if (!value) return '';

    // ✅ FIX: Gestion plus robuste des dates
    let date: Date;
    try {
      date = new Date(value);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('TimeAgoPipe: Invalid date provided:', value);
        return 'date invalide';
      }
    } catch (error) {
      console.warn('TimeAgoPipe: Error parsing date:', value, error);
      return 'date invalide';
    }

    const now = new Date();
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
      return `${minutes}min`;
    }

    // Moins d'un jour
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    }

    // Moins d'une semaine
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}j`;
    }

    // Moins d'un mois (30 jours)
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}sem`;
    }

    // Moins d'un an
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}mois`;
    }

    // Plus d'un an
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}an${years > 1 ? 's' : ''}`;
  }
}
