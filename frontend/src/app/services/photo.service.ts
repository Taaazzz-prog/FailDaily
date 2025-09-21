import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ActionSheetController, AlertController } from '@ionic/angular/standalone';
import { DEFAULT_AVATARS, DEFAULT_AVATAR } from '../utils/avatar-constants';

export interface PhotoOption {
    url: string;
    isDefault: boolean;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class PhotoService {

    constructor(
        private actionSheetController: ActionSheetController,
        private alertController: AlertController
    ) { }

    /**
     * Afficher le sélecteur de photo avec toutes les options
     */
    async selectPhotoSource(): Promise<string | null> {
        const actionSheet = await this.actionSheetController.create({
            header: 'Changer la photo de profil',
            buttons: [
                {
                    text: 'Prendre une photo',
                    icon: 'camera-outline',
                    data: { action: 'camera' }
                },
                {
                    text: 'Galerie du téléphone',
                    icon: 'images-outline',
                    data: { action: 'gallery' }
                },
                {
                    text: 'Avatars par défaut',
                    icon: 'person-outline',
                    data: { action: 'default' }
                },
                {
                    text: 'Annuler',
                    icon: 'close',
                    role: 'cancel'
                }
            ]
        });

        await actionSheet.present();

        const { data } = await actionSheet.onDidDismiss();

        if (!data?.action) {
            return null;
        }

        try {
            switch (data.action) {
                case 'camera':
                    return await this.takePhoto();
                case 'gallery':
                    return await this.selectFromGallery();
                case 'default':
                    return await this.selectDefaultAvatar();
                default:
                    return null;
            }
        } catch (error) {
            console.error('Erreur lors de la sélection de photo:', error);
            throw error;
        }
    }

    /**
     * Prendre une photo avec la caméra
     */
    async takePhoto(): Promise<string> {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
                width: 300,
                height: 300
            });

            if (image.dataUrl) {
                // Retourner directement le DataURL pour l'éditeur d'image
                return image.dataUrl;
            }

            throw new Error('Impossible de capturer la photo');
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
            throw error;
        }
    }

    /**
     * Sélectionner depuis la galerie
     */
    async selectFromGallery(): Promise<string> {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos,
                width: 300,
                height: 300
            });

            if (image.dataUrl) {
                // Retourner directement le DataURL pour l'éditeur d'image
                return image.dataUrl;
            }

            throw new Error('Impossible de sélectionner la photo');
        } catch (error) {
            console.error('Erreur lors de la sélection de photo:', error);
            throw error;
        }
    }

    /**
     * Sélectionner un avatar par défaut
     */
    private async selectDefaultAvatar(): Promise<string> {
        const alert = await this.alertController.create({
            header: 'Choisir un avatar',
            message: 'Sélectionnez un avatar par défaut',
            inputs: DEFAULT_AVATARS.map((avatar, index) => ({
                name: 'avatar',
                type: 'radio',
                label: `Avatar ${index + 1}`,
                value: avatar,
                checked: avatar === DEFAULT_AVATAR
            })),
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Confirmer',
                    handler: (selectedAvatar) => {
                        return selectedAvatar;
                    }
                }
            ]
        });

        await alert.present();

        const { data } = await alert.onDidDismiss();
        return data || DEFAULT_AVATAR;
    }

    /**
     * Obtenir l'avatar par défaut pour nouveaux utilisateurs
     */
    getDefaultAvatar(): string {
        return DEFAULT_AVATAR;
    }

    /**
     * Obtenir la liste des avatars par défaut
     */
    getDefaultAvatars(): PhotoOption[] {
        return DEFAULT_AVATARS.map((avatar, index) => ({
            url: avatar,
            isDefault: true,
            name: `Avatar ${index + 1}`
        }));
    }

    /**
     * Valider si une URL de photo est valide
     */
    isValidPhotoUrl(url: string): boolean {
        if (!url) return false;
        return url.startsWith('assets/') ||
            url.startsWith('file://') ||
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('data:');
    }
}
