import { Injectable } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { AuthRequiredModalComponent } from '../components/auth-required-modal/auth-required-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {

  constructor(
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  async showAuthRequiredModal(options: {
    title?: string;
    message?: string;
    actionName?: string;
  } = {}) {
    const modal = await this.modalController.create({
      component: AuthRequiredModalComponent,
      componentProps: {
        title: options.title || 'Connexion requise',
        message: options.message || 'Vous devez être connecté pour accéder à cette fonctionnalité',
        actionName: options.actionName || 'cette action'
      },
      cssClass: 'auth-required-modal',
      backdropDismiss: true
    });

    await modal.present();
    return modal;
  }

  async showAuthRequiredToast(message: string = 'Connexion requise pour cette action') {
    const toast = await this.toastController.create({
      message: `🔒 ${message}`,
      duration: 3000,
      position: 'top',
      color: 'warning',
      buttons: [
        {
          text: 'Se connecter',
          role: 'action',
          handler: () => {
            // Le router sera géré par le composant appelant
            return true;
          }
        },
        {
          text: 'Fermer',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
    return toast;
  }
}
