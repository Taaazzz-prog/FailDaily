import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CelebrationService {

    /**
     * Déclenche un effet de confettis
     */
    triggerConfetti(): void {
        // Utilise la bibliothèque canvas-confetti si disponible
        if (typeof window !== 'undefined' && (window as any).confetti) {
            (window as any).confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            // Fallback : effet CSS simple
            this.triggerCSSConfetti();
        }
    }

    /**
     * Effet confetti CSS basique
     */
    private triggerCSSConfetti(): void {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors[i % colors.length]);
            }, i * 10);
        }
    }

    /**
     * Crée un élément de confetti
     */
    private createConfettiPiece(color: string): void {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${color};
      top: -10px;
      left: ${Math.random() * 100}vw;
      z-index: 9999;
      pointer-events: none;
      animation: confetti-fall 3s linear forwards;
      transform: rotate(${Math.random() * 360}deg);
    `;

        document.body.appendChild(confetti);

        // Nettoyer après animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 3000);
    }

    /**
     * Déclenche une vibration haptique si supportée
     */
    triggerHapticFeedback(pattern: number[] = [100, 30, 100]): void {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Effet de pulsation sur un élément
     */
    pulseElement(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.animation = 'pulse 0.6s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 600);
        }
    }

    /**
     * Effet de brillance sur un élément
     */
    shimmerElement(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.animation = 'shimmer 1.5s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 1500);
        }
    }
}
