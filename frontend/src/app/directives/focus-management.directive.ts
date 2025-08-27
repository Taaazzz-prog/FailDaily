import { Directive, ElementRef, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appFocusManagement]',
  standalone: true
})
export class FocusManagementDirective implements OnInit, OnDestroy {
  private observer?: MutationObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.setupFocusObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupFocusObserver() {
    // Observer les changements d'attribut aria-hidden
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target as HTMLElement;
          
          if (target.getAttribute('aria-hidden') === 'true') {
            // Page cachée : retirer le focus de tous les éléments focusés
            this.clearFocusFromElement(target);
          }
        }
      });
    });

    // Observer l'élément racine et ses descendants
    this.observer.observe(this.elementRef.nativeElement, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
      subtree: true
    });
  }

  private clearFocusFromElement(element: HTMLElement) {
    // Trouver tous les éléments focusés dans cet élément
    const focusedElements = element.querySelectorAll(':focus');
    
    focusedElements.forEach(focusedElement => {
      (focusedElement as HTMLElement).blur();
    });

    // Si l'élément lui-même est focusé
    if (element.matches(':focus')) {
      element.blur();
    }
  }
}
