import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'anonymize' })
export class AnonymizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    // Masque tout sauf la première lettre et le dernier caractère
    if (value.length <= 2) return value[0] + '*';
    return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
  }
}

