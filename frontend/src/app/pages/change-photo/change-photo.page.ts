import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonButton, IonGrid, IonRow, IonCol, IonImg, IonSpinner, IonIcon,
    ActionSheetController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, imagesOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { PhotoService } from '../../services/photo.service';
import { AuthService } from '../../services/auth.service';
import { FailService } from '../../services/fail.service';
import { AvatarService, Avatar } from '../../services/avatar.service';
import { User } from '../../models/user.model';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-change-photo',
    templateUrl: './change-photo.page.html',
    styleUrls: ['./change-photo.page.scss'],
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
        IonButton, IonGrid, IonRow, IonCol, IonImg, IonSpinner, IonIcon
    ]
})
export class ChangePhotoPage implements OnInit {

    currentUser: User | null = null;
    availableAvatars: Avatar[] = [];
    selectedAvatar: string | null = null;
    isLoading = false;

    constructor(
        private router: Router,
        private photoService: PhotoService,
        private authService: AuthService,
        private failService: FailService,
        private avatarService: AvatarService,
        private actionSheetController: ActionSheetController,
        private toastController: ToastController
    ) {
        addIcons({
            cameraOutline,
            imagesOutline,
            checkmarkCircleOutline
        });
    }

    async ngOnInit() {
        await this.loadCurrentUser();
        await this.loadAvailableAvatars();
    }

    private async loadCurrentUser() {
        try {
            const user = await firstValueFrom(this.authService.currentUser$);
            this.currentUser = user || null;
            this.selectedAvatar = this.currentUser?.avatar || this.avatarService.getDefaultAvatar();
        } catch (error) {
            console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
    }

    private async loadAvailableAvatars() {
        try {
            this.isLoading = true;
            this.availableAvatars = await this.avatarService.getAvailableAvatars();
        } catch (error) {
            console.error('Erreur lors du chargement des avatars:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Sélectionner un avatar par défaut
     */
    selectDefaultAvatar(avatarPath: string) {
        this.selectedAvatar = avatarPath;
    }

    /**
     * Afficher les options pour une photo personnalisée
     */
    async showCustomPhotoOptions() {
        const actionSheet = await this.actionSheetController.create({
            header: 'Ajouter une photo personnalisée',
            buttons: [
                {
                    text: 'Prendre une photo (Selfie)',
                    icon: 'camera-outline',
                    handler: () => this.takePhoto()
                },
                {
                    text: 'Choisir dans la galerie',
                    icon: 'images-outline',
                    handler: () => this.selectFromGallery()
                },
                {
                    text: 'Annuler',
                    role: 'cancel'
                }
            ]
        });
        await actionSheet.present();
    }

    /**
     * Prendre une photo avec la caméra
     */
    async takePhoto() {
        try {
            this.isLoading = true;
            const photoPath = await this.photoService.takePhoto();
            if (photoPath) {
                this.selectedAvatar = photoPath;
            }
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
            this.showToast('Erreur lors de la prise de photo');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Sélectionner depuis la galerie
     */
    async selectFromGallery() {
        try {
            this.isLoading = true;
            const photoPath = await this.photoService.selectFromGallery();
            if (photoPath) {
                this.selectedAvatar = photoPath;
            }
        } catch (error) {
            console.error('Erreur lors de la sélection de la photo:', error);
            this.showToast('Erreur lors de la sélection de la photo');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Sauvegarder la nouvelle photo de profil
     */
    async savePhoto() {
        if (!this.selectedAvatar || !this.currentUser) {
            return;
        }

        try {
            this.isLoading = true;

            // Ne mettre à jour que l'avatar
            const profileUpdate = {
                avatar: this.selectedAvatar
            };

            await this.authService.updateUserProfile(profileUpdate);

            // Recharger les fails pour qu'ils affichent le nouvel avatar
            await this.failService.refreshFails();

            this.showToast('Photo de profil mise à jour !', 'success');
            this.router.navigate(['/tabs/profile']);

        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            this.showToast('Erreur lors de la mise à jour');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Vérifier si un avatar est sélectionné
     */
    isSelected(avatarPath: string): boolean {
        return this.selectedAvatar === avatarPath;
    }

    /**
     * Vérifier si la sélection a changé
     */
    get hasChanged(): boolean {
        return this.selectedAvatar !== this.currentUser?.avatar;
    }

    /**
     * Obtenir l'avatar actuel à afficher
     */
    get currentAvatar(): string {
        return this.selectedAvatar || this.currentUser?.avatar || this.avatarService.getDefaultAvatar();
    }

    /**
     * Afficher un toast
     */
    private async showToast(message: string, color: string = 'danger') {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color,
            position: 'top'
        });
        toast.present();
    }
}
