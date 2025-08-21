import { Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appAuthAction]',
  standalone: true
})
export class AuthActionDirective implements OnInit, OnDestroy {
  @Input() appAuthAction: boolean = true;
  @Input() authRedirect: string = '/auth/login';
  @Input() authMessage: string = 'Connexion requise pour cette action';

  private authSubscription: Subscription = new Subscription();
  private isAuthenticated = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.updateElement();
    });

    // Ajouter l'événement click
    this.renderer.listen(this.el.nativeElement, 'click', (event) => {
      this.handleClick(event);
    });
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  private updateElement() {
    if (this.appAuthAction && !this.isAuthenticated) {
      // Ajouter une classe visuelle pour indiquer que l'action est restreinte
      this.renderer.addClass(this.el.nativeElement, 'auth-required');
      this.renderer.setAttribute(this.el.nativeElement, 'title', this.authMessage);
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'auth-required');
      this.renderer.removeAttribute(this.el.nativeElement, 'title');
    }
  }

  private handleClick(event: Event) {
    if (this.appAuthAction && !this.isAuthenticated) {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🔒 AuthActionDirective: Action bloquée - redirection vers:', this.authRedirect);
      this.router.navigate([this.authRedirect]);
    }
  }
}
