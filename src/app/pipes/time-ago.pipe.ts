import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    const now = new Date().getTime();
    const time = new Date(value).getTime();
    const diff = now - time;

    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    if (diff < minute) {
      return 'À l\'instant';
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `Il y a ${minutes} min`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `Il y a ${hours}h`;
    } else if (diff < month) {
      const days = Math.floor(diff / day);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (diff < year) {
      const months = Math.floor(diff / month);
      return `Il y a ${months} mois`;
    } else {
      const years = Math.floor(diff / year);
      return `Il y a ${years} an${years > 1 ? 's' : ''}`;
    }
  }
}
