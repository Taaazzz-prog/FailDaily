import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
    selector: '[appHighlightBadge]',
    standalone: true
})
export class HighlightBadgeDirective implements OnChanges {
    @Input('appHighlightBadge') shouldHighlight: boolean = false;

    constructor(private el: ElementRef) { }

    ngOnChanges() {
        if (this.shouldHighlight) {
            this.addHighlight();

            // Supprimer l'effet après 3 secondes
            setTimeout(() => {
                this.removeHighlight();
            }, 3000);
        }
    }

    private addHighlight() {
        const element = this.el.nativeElement;
        element.classList.add('badge-highlight');

        // Animation de pulsation
        element.style.animation = 'badge-glow 2s ease-in-out infinite';
        element.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.6)';
        element.style.transform = 'scale(1.05)';
        element.style.zIndex = '10';
    }

    private removeHighlight() {
        const element = this.el.nativeElement;
        element.classList.remove('badge-highlight');
        element.style.animation = '';
        element.style.boxShadow = '';
        element.style.transform = '';
        element.style.zIndex = '';
    }
}
