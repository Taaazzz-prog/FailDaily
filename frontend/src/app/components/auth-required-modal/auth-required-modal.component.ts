import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonText,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personAddOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-auth-required-modal',
  templateUrl: './auth-required-modal.component.html',
  styleUrls: ['./auth-required-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonText
  ]
})
export class AuthRequiredModalComponent {
  @Input() title: string = 'Connexion requise';
  @Input() message: string = 'Vous devez être connecté pour accéder à cette fonctionnalité';
  @Input() actionName: string = 'cette action';

  private readonly modalController = inject(ModalController);
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      logInOutline,
      personAddOutline,
      closeOutline
    });
  }

  async goToLogin() {
    await this.dismiss();
    this.router.navigate(['/auth/login']);
  }

  async goToRegister() {
    await this.dismiss();
    this.router.navigate(['/auth/register']);
  }

  async dismiss() {
    await this.modalController.dismiss();
  }
}
