import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Récupérer la préférence sauvegardée
    const savedTheme = localStorage.getItem('darkMode');
    
    let isDarkMode = false;
    
    if (savedTheme !== null) {
      // Utiliser la préférence sauvegardée
      isDarkMode = savedTheme === 'true';
    } else {
      // Utiliser la préférence système par défaut
      isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.setDarkMode(isDarkMode);

    // Écouter les changements de préférence système
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Seulement si l'utilisateur n'a pas défini de préférence explicite
        if (localStorage.getItem('darkMode') === null) {
          this.setDarkMode(e.matches);
        }
      });
    }
  }

  setDarkMode(isDarkMode: boolean): void {
    // Sauvegarder la préférence
    localStorage.setItem('darkMode', isDarkMode.toString());
    
    // Mettre à jour le state
    this.isDarkModeSubject.next(isDarkMode);
    
    // Appliquer le thème
    this.applyTheme(isDarkMode);
  }

  toggleDarkMode(): void {
    const currentMode = this.isDarkModeSubject.value;
    this.setDarkMode(!currentMode);
  }

  getCurrentMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  private applyTheme(isDarkMode: boolean): void {
    const body = document.body;
    const html = document.documentElement;

    if (isDarkMode) {
      // Ajouter la classe dark
      body.classList.add('dark');
      html.classList.add('dark');
      
      // Ionic specific
      body.setAttribute('color-theme', 'dark');
    } else {
      // Supprimer la classe dark
      body.classList.remove('dark');
      html.classList.remove('dark');
      
      // Ionic specific
      body.setAttribute('color-theme', 'light');
    }

    console.log('🌙 Theme applied:', isDarkMode ? 'dark' : 'light');
  }
}