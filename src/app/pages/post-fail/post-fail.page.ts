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
import { CustomValidators } from '../../utils/validators';
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
      content: ['', [Validators.required, CustomValidators.minLength(10), CustomValidators.noWhitespace]],
      category: [FailCategory.WORK, Validators.required],
      isAnonymous: [false]
    });
  }

  ngOnInit() {}

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Ajouter une image',
      buttons: [
        {
          text: 'Prendre une photo',
          icon: 'camera',
          handler: () => this.takePicture(CameraSource.Camera)
        },
        {
          text: 'Choisir depuis la galerie',
          icon: 'images',
          handler: () => this.takePicture(CameraSource.Photos)
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
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source
      });

      this.selectedImage = image.dataUrl;
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Erreur lors de la sélection de l\'image',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  removeImage() {
    this.selectedImage = undefined;
  }

  async onPostFail() {
    if (this.postFailForm.valid) {
      this.isLoading = true;

      try {
        const { content, category, isAnonymous } = this.postFailForm.value;

        // Modération du contenu
        const moderation = await this.moderationService.moderateText(content).toPromise();

        if (!moderation?.allowed) {
          const toast = await this.toastController.create({
            message: moderation?.reason || 'Contenu non autorisé',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          this.isLoading = false;
          return;
        }

        // Création du fail
        const currentUser = this.authService.getCurrentUser();
        const failReactions: FailReactions = {
          courageHearts: 0,
          laughs: 0,
          supports: 0
        };

        const newFail: Fail = {
          id: Date.now().toString(),
          content,
          category,
          image: this.selectedImage,
          author: {
            id: currentUser?.id || 'anonymous',
            displayName: isAnonymous ? 'Anonyme' : (currentUser?.displayName || 'Utilisateur'),
            avatar: isAnonymous ? 'assets/images/anonymous-avatar.png' : (currentUser?.avatar || 'assets/images/default-avatar.png')
          },
          createdAt: new Date(),
          reactions: failReactions,
          isAnonymous
        };

        await this.failService.addFail(newFail);

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
