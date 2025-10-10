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
    // ⚠️ FORCE LE THÈME CLAIR PAR DÉFAUT (Fix collision VS Code)
    let isDarkMode = false;
    
    // Récupérer la préférence sauvegardée SEULEMENT si explicitement définie
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme === 'true') {
      // Utiliser le mode sombre SEULEMENT si explicitement demandé
      isDarkMode = true;
    } else {
      // Par défaut, TOUJOURS utiliser le thème clair
      isDarkMode = false;
    }

    console.log('🌙 ThemeService init - Force thème clair par défaut');
    this.setDarkMode(isDarkMode);

    // ⚠️ DÉSACTIVER l'écoute des préférences système pour éviter conflits
    // L'utilisateur doit manuellement choisir le thème sombre
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
      body.classList.remove('force-light-theme');
      
      // Ionic specific
      body.setAttribute('color-theme', 'dark');
    } else {
      // Supprimer la classe dark et FORCER le thème clair
      body.classList.remove('dark');
      html.classList.remove('dark');
      body.classList.add('force-light-theme'); // Force le thème clair
      
      // Ionic specific
      body.setAttribute('color-theme', 'light');
      
      // Force les variables CSS pour le thème clair
      body.style.setProperty('--ion-background-color', '#dbeafe', 'important');
      body.style.setProperty('--ion-text-color', '#1e293b', 'important');
    }

    console.log('🌙 Theme applied:', isDarkMode ? 'dark' : 'light (forced)');
  }
}