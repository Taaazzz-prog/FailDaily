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
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
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
    // Configuration des icônes
    addIcons({
      camera
    });

    console.log('📝 PostFailPage - Constructor called');
    this.postFailForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      category: [null, Validators.required], // Suppression de la valeur par défaut
      isAnonymous: [false]
    });
    console.log('📝 PostFailPage - Form initialized');
  }

  ngOnInit() {
    console.log('📝 PostFailPage - ngOnInit called');
    // Form initialisé et prêt
  }

  async selectImage() {
    console.log('📝 PostFailPage - selectImage called');
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
    console.log('📝 PostFailPage - onPostFail called');
    console.log('📝 PostFailPage - Form valid:', this.postFailForm.valid);
    console.log('📝 PostFailPage - Form values:', this.postFailForm.value);

    if (this.postFailForm.valid) {
      this.isLoading = true;
      console.log('📝 PostFailPage - Loading started');

      try {
        const formValues = this.postFailForm.value;
        console.log('📝 PostFailPage - Processing form data:', formValues);
        console.log('📝 PostFailPage - Selected category:', formValues.category);

        // Validation de la catégorie
        if (!formValues.category) {
          console.warn('📝 PostFailPage - No category selected');
          const toast = await this.toastController.create({
            message: 'Veuillez sélectionner une catégorie pour votre fail',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          this.isLoading = false;
          return;
        }

        // Vérifier que l'utilisateur est connecté en premier
        const currentUser = this.authService.getCurrentUser();
        console.log('📝 PostFailPage - Current user:', currentUser?.email || 'Not authenticated');

        if (!currentUser) {
          console.warn('📝 PostFailPage - User not authenticated');
          const toast = await this.toastController.create({
            message: 'Vous devez être connecté pour publier un fail',
            duration: 3000,
            color: 'danger'
          });
          await toast.present();
          this.isLoading = false;
          return;
        }

        // Validation des données
        if (!formValues.content?.trim()) {
          const toast = await this.toastController.create({
            message: 'Veuillez saisir une description pour votre fail',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          this.isLoading = false;
          return;
        }

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
          category: formValues.category, // Suppression de la valeur par défaut
          image: this.selectedImageFile,
          is_public: !formValues.isAnonymous // false => anonyme (is_public=0), true => public (is_public=1)
        };

        console.log('Données du fail à créer:', createFailData);

        await this.failService.createFail(createFailData);

        const toast = await this.toastController.create({
          message: 'Votre fail a été publié avec courage ! 💪',
          duration: 3000,
          color: 'success'
        });
        await toast.present();

        // Reset le formulaire après succès
        this.postFailForm.reset({
          title: '',
          content: '',
          category: null, // Pas de valeur par défaut
          isAnonymous: false
        });
        this.selectedImageFile = undefined;

        // Redirection vers la page d'accueil avec délai
        setTimeout(() => {
          this.router.navigate(['/tabs/home']);
        }, 1000);

      } catch (error: any) {
        console.error('Erreur lors de la publication du fail:', error);

        let errorMessage = 'Erreur lors de la publication de votre fail';

        // Messages d'erreur personnalisés
        if (error.message?.includes('Utilisateur non authentifié')) {
          errorMessage = 'Vous devez être connecté pour publier un fail';
        } else if (error.message?.includes('La description ne peut pas être vide')) {
          errorMessage = 'Veuillez saisir une description';
        } else if (error.message?.includes('Database error')) {
          errorMessage = 'Erreur de base de données. Veuillez réessayer.';
        } else if (error.message?.includes('NavigatorLock')) {
          errorMessage = 'Problème de connexion. Veuillez réessayer dans quelques secondes.';
        }

        const toast = await this.toastController.create({
          message: errorMessage,
          duration: 4000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isLoading = false;
      }
    } else {
      // Formulaire invalide
      const toast = await this.toastController.create({
        message: 'Veuillez vérifier que tous les champs sont correctement remplis',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    }
  }
}

