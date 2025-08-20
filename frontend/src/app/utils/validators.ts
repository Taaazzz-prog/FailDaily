// Validators personnalisés pour les formulaires Angular
import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomValidators {
  static noWhitespace(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').toString().trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  static minLength(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      return (control.value || '').length < min ? { minLength: { requiredLength: min } } : null;
    };
  }
}

