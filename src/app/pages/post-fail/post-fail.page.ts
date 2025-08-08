import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonItem, IonLabel, IonTextarea, IonSelect, IonSelectOption, IonButton,
  IonIcon, IonCheckbox, IonSpinner, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FailService } from '../../services/fail.service';
import { ModerationService } from '../../services/moderation.service';
import { AuthService } from '../../services/auth.service';
import { Fail, FailReactions } from '../../models/fail.model';
import { FailCategory } from '../../models/enums';

@Component({
  selector: 'app-post-fail',
  templateUrl: './post-fail.page.html',
  styleUrls: ['./post-fail.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    IonItem, IonLabel, IonTextarea, IonSelect, IonSelectOption, IonButton,
    IonIcon, IonCheckbox, IonSpinner
  ],
})
export class PostFailPage implements OnInit {
  postFailForm: FormGroup;
  isLoading = false;
  selectedImage: string | undefined;
  selectedImageFile: File | undefined;
  failCategories = Object.values(FailCategory);

  constructor(
    private fb: FormBuilder,
    private failService: FailService,
    private moderationService: ModerationService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    this.postFailForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      category: [FailCategory.COURAGE, Validators.required],
      isAnonymous: [false]
    });
  }

  ngOnInit() {
    // Form initialisé et prêt
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Capturer le moment authentique',
      buttons: [
        {
          text: 'Prendre une photo',
          icon: 'camera',
          handler: () => this.takePicture(CameraSource.Camera)
        },
        {
          text: 'Prendre une vidéo (15s max)',
          icon: 'videocam',
          handler: () => this.takeVideo()
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false, // Pas d'édition = authenticité
        resultType: CameraResultType.DataUrl,
        source: source
      });

      this.selectedImage = image.dataUrl;

      // Convertir la DataURL en File pour l'upload
      if (image.dataUrl) {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        this.selectedImageFile = new File([blob], 'authentic-fail.jpg', { type: 'image/jpeg' });
      }
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Erreur lors de la capture',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async takeVideo() {
    // Pour l'instant, on simule avec une photo
    // La vraie implémentation vidéo nécessiterait des plugins supplémentaires
    const toast = await this.toastController.create({
      message: 'Fonctionnalité vidéo en développement - utilisez la photo pour l\'instant',
      duration: 3000,
      color: 'primary'
    });
    await toast.present();

    // Rediriger vers la photo en attendant
    this.takePicture(CameraSource.Camera);
  }

  // SUPPRESSION DE removeImage() - pas de retour en arrière possible !
  // L'authenticité exige l'engagement à son fail

  async onPostFail() {
    if (this.postFailForm.valid) {
      this.isLoading = true;

      try {
        const formValues = this.postFailForm.value;

        // Modération du contenu (corrigée)
        try {
          const moderation = await new Promise(resolve => {
            this.moderationService.moderateText(formValues.content).subscribe({
              next: (result) => resolve(result),
              error: () => resolve({ allowed: true }) // En cas d'erreur, on autorise
            });
          });

          if (!(moderation as any)?.allowed) {
            const toast = await this.toastController.create({
              message: (moderation as any)?.reason || 'Contenu non autorisé',
              duration: 3000,
              color: 'warning'
            });
            await toast.present();
            this.isLoading = false;
            return;
          }
        } catch (moderationError) {
          // En cas d'erreur de modération, on continue
          console.log('Erreur modération, on continue:', moderationError);
        }

        // Création du fail avec Supabase
        const createFailData = {
          title: formValues.title?.trim() || 'Mon fail',
          description: formValues.content.trim(),
          category: formValues.category,
          image: this.selectedImageFile, // Réactivé pour tester l'affichage
          isPublic: !formValues.isAnonymous // Inverser car isAnonymous = !isPublic
        };

        await this.failService.createFail(createFailData);

        const toast = await this.toastController.create({
          message: 'Votre fail a été publié avec courage ! 💪',
          duration: 3000,
          color: 'success',
          cssClass: 'toast-encourage'
        });
        await toast.present();

        // Reset du formulaire
        this.postFailForm.reset();
        this.selectedImage = undefined;
        this.selectedImageFile = undefined;

        // Retour à l'accueil
        this.router.navigate(['/tabs/home']);

      } catch (error) {
        const toast = await this.toastController.create({
          message: 'Erreur lors de la publication. Réessayez.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }

      this.isLoading = false;
    }
  }
}
