import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonIcon, IonGrid, IonRow, IonCol, IonImg, IonText, IonItem,
    IonLabel, ModalController, ActionSheetController, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, imagesOutline, closeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { PhotoService } from '../../services/photo.service';
import { DEFAULT_AVATARS } from '../../utils/avatar-constants';

@Component({
    selector: 'app-avatar-selector',
    templateUrl: './avatar-selector.component.html',
    styleUrls: ['./avatar-selector.component.scss'],
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
        IonIcon, IonGrid, IonRow, IonCol, IonImg, IonSpinner
    ]
})
export class AvatarSelectorComponent implements OnInit {

    defaultAvatars = DEFAULT_AVATARS;
    selectedAvatar: string | null = null;
    currentAvatar: string = '';
    isLoading = false;

    constructor(
        private modalController: ModalController,
        private actionSheetController: ActionSheetController,
        private photoService: PhotoService
    ) {
        addIcons({
            cameraOutline,
            imagesOutline,
            closeOutline,
            checkmarkCircleOutline
        });
    }

    ngOnInit() {
        // Récupérer l'avatar actuel depuis les données passées au modal
        this.currentAvatar = (this.modalController as any).currentAvatar || '';
        this.selectedAvatar = this.currentAvatar;
    }

    /**
     * Sélectionner un avatar par défaut
     */
    selectDefaultAvatar(avatarPath: string) {
        this.selectedAvatar = avatarPath;
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
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Afficher les options caméra/galerie
     */
    async showCameraOptions() {
        const actionSheet = await this.actionSheetController.create({
            header: 'Ajouter une photo personnelle',
            buttons: [
                {
                    text: 'Prendre une photo',
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
     * Confirmer la sélection
     */
    confirmSelection() {
        this.modalController.dismiss({
            selectedAvatar: this.selectedAvatar
        });
    }

    /**
     * Fermer le modal sans changement
     */
    cancel() {
        this.modalController.dismiss(null);
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
        return this.selectedAvatar !== this.currentAvatar;
    }
}
