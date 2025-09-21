import { Directive, ElementRef, Input, HostListener } from '@angular/core';
import { ImageUrlService } from '../services/image-url.service';

@Directive({
  selector: '[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input('appImageFallback') fallbackType: 'avatar' | 'fail' = 'avatar';
  private hasTriedFallback = false;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private imageUrlService: ImageUrlService
  ) {}

  @HostListener('error', ['$event'])
  onError(event: Event) {
    if (!this.hasTriedFallback) {
      this.hasTriedFallback = true;
      const fallbackSrc = this.imageUrlService.getFallbackImage(this.fallbackType);
      this.el.nativeElement.src = fallbackSrc;
      
      console.log(`🖼️ Image fallback applied: ${this.fallbackType} → ${fallbackSrc}`);
    }
  }

  @HostListener('load', ['$event'])
  onLoad(event: Event) {
    // Reset le flag si l'image se charge avec succès
    this.hasTriedFallback = false;
  }
}