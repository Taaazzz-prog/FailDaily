import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FocusManagementService {

  constructor(private router: Router) {
    // Écouter les changements de route pour gérer le focus
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.manageFocusOnRouteChange();
      });
  }

  /**
   * Gère le focus lors du changement de route
   */
  private manageFocusOnRouteChange(): void {
    // Retirer le focus de tout élément actuellement focusé
    this.clearActiveElementFocus();
    
    // Attendre que la nouvelle page soit rendue
    setTimeout(() => {
      this.setInitialFocus();
    }, 100);
  }

  /**
   * Retire le focus de l'élément actuellement actif
   */
  private clearActiveElementFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }

  /**
   * Définit le focus initial sur la nouvelle page
   */
  private setInitialFocus(): void {
    // Chercher un élément avec l'attribut [autoFocus] ou le premier élément focusable
    const autoFocusElement = document.querySelector('[autoFocus]') as HTMLElement;
    const firstFocusableElement = this.getFirstFocusableElement();
    
    if (autoFocusElement) {
      autoFocusElement.focus();
    } else if (firstFocusableElement) {
      firstFocusableElement.focus();
    } else {
      // En dernier recours, focus sur le header ou le body
      const header = document.querySelector('ion-header h1, ion-title') as HTMLElement;
      if (header) {
        header.setAttribute('tabindex', '-1');
        header.focus();
      }
    }
  }

  /**
   * Trouve le premier élément focusable dans la page
   */
  private getFirstFocusableElement(): HTMLElement | null {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];

    for (const selector of focusableSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }

    return null;
  }

  /**
   * Vérifie si un élément est visible
   */
  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      computedStyle.visibility !== 'hidden' &&
      computedStyle.display !== 'none' &&
      !element.hasAttribute('aria-hidden')
    );
  }

  /**
   * Force le retrait du focus de tous les éléments dans les pages cachées
   */
  public clearFocusFromHiddenPages(): void {
    const hiddenPages = document.querySelectorAll('[aria-hidden="true"]');
    
    hiddenPages.forEach(page => {
      const focusedElements = page.querySelectorAll(':focus');
      focusedElements.forEach(element => {
        (element as HTMLElement).blur();
      });
    });
  }
}
