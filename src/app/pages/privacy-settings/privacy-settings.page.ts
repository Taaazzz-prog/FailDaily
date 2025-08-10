import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonIcon, IonToggle, IonButton, IonSpinner, IonAlert, AlertController
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { UserPrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../../models/user-privacy-settings.model';
import { User } from '../../models/user.model';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-privacy-settings',
    templateUrl: './privacy-settings.page.html',
    styleUrls: ['./privacy-settings.page.scss'],
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
        IonIcon, IonToggle, IonButton, IonSpinner, IonAlert
    ]
})
export class PrivacySettingsPage implements OnInit {
    privacySettings: UserPrivacySettings = {
        ...DEFAULT_PRIVACY_SETTINGS,
        userId: '',
        lastUpdated: new Date()
    };

    currentUser: User | null = null;
    isLoading = false;
    saveMessage = '';
    showDeleteAlert = false;

    deleteAlertButtons = [
        {
            text: 'Annuler',
            role: 'cancel'
        },
        {
            text: 'Supprimer',
            role: 'destructive',
            handler: () => this.deleteAccount()
        }
    ];

    constructor(
        private authService: AuthService,
        private alertController: AlertController,
        private router: Router
    ) { }

    async ngOnInit() {
        await this.loadCurrentUser();
        await this.loadPrivacySettings();
    }

    private async loadCurrentUser() {
        try {
            const user = await firstValueFrom(this.authService.currentUser$);
            this.currentUser = user || null;
            if (this.currentUser) {
                this.privacySettings.userId = this.currentUser.id;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
    }

    private async loadPrivacySettings() {
        if (!this.currentUser) return;

        try {
            this.isLoading = true;

            // Ici, dans une vraie application, vous feriez un appel à votre service
            // pour récupérer les paramètres depuis la base de données
            const savedSettings = this.getStoredPrivacySettings();

            if (savedSettings) {
                this.privacySettings = {
                    ...savedSettings,
                    userId: this.currentUser.id,
                    lastUpdated: new Date(savedSettings.lastUpdated)
                };
            } else {
                // Utiliser les paramètres par défaut
                this.privacySettings = {
                    ...DEFAULT_PRIVACY_SETTINGS,
                    userId: this.currentUser.id,
                    lastUpdated: new Date()
                };
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            this.showSaveMessage('Erreur lors du chargement des paramètres');
        } finally {
            this.isLoading = false;
        }
    }

    async updateSetting(settingName: keyof UserPrivacySettings, event: any) {
        if (!this.currentUser) return;

        try {
            this.isLoading = true;

            // Mettre à jour la valeur
            (this.privacySettings as any)[settingName] = event.detail.checked;
            this.privacySettings.lastUpdated = new Date();

            // Sauvegarder (ici on utilise localStorage, mais dans une vraie app ce serait une API)
            await this.savePrivacySettings();

            this.showSaveMessage('Paramètres sauvegardés !');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showSaveMessage('Erreur lors de la sauvegarde');

            // Revenir à l'ancienne valeur en cas d'erreur
            (this.privacySettings as any)[settingName] = !event.detail.checked;
        } finally {
            this.isLoading = false;
        }
    }

    private async savePrivacySettings() {
        // Dans une vraie application, ceci serait un appel API
        // Pour la démo, on utilise localStorage
        localStorage.setItem(
            `privacy_settings_${this.currentUser?.id}`,
            JSON.stringify(this.privacySettings)
        );

        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    private getStoredPrivacySettings(): UserPrivacySettings | null {
        if (!this.currentUser) return null;

        const stored = localStorage.getItem(`privacy_settings_${this.currentUser.id}`);
        return stored ? JSON.parse(stored) : null;
    }

    async exportData() {
        if (!this.currentUser) return;

        try {
            this.isLoading = true;

            // Créer les données à exporter
            const exportData = {
                user: {
                    id: this.currentUser.id,
                    email: this.currentUser.email,
                    displayName: this.currentUser.displayName,
                    joinDate: this.currentUser.joinDate
                },
                privacySettings: this.privacySettings,
                exportDate: new Date().toISOString()
            };

            // Créer et télécharger le fichier JSON
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `faildaily_export_${this.currentUser.id}_${Date.now()}.json`;
            link.click();

            this.showSaveMessage('Données exportées avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.showSaveMessage('Erreur lors de l\'export des données');
        } finally {
            this.isLoading = false;
        }
    }

    showDeleteAccountAlert() {
        this.showDeleteAlert = true;
    }

    private async deleteAccount() {
        if (!this.currentUser) return;

        const confirmAlert = await this.alertController.create({
            header: 'Confirmation finale',
            message: `Tape "${this.currentUser.displayName}" pour confirmer la suppression définitive de ton compte.`,
            inputs: [
                {
                    name: 'confirmation',
                    type: 'text',
                    placeholder: this.currentUser.displayName
                }
            ],
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Supprimer définitivement',
                    role: 'destructive',
                    handler: (data) => {
                        if (data.confirmation === this.currentUser?.displayName) {
                            this.performAccountDeletion();
                            return true;
                        } else {
                            this.showSaveMessage('Confirmation incorrecte');
                            return false;
                        }
                    }
                }
            ]
        });

        await confirmAlert.present();
    }

    private async performAccountDeletion() {
        try {
            this.isLoading = true;

            // Dans une vraie application, ceci supprimerait le compte via l'API
            console.log('Suppression du compte en cours...');

            // Simuler la suppression
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Nettoyer les données locales
            localStorage.removeItem(`privacy_settings_${this.currentUser?.id}`);

            // Se déconnecter et rediriger
            await this.authService.logout();
            this.router.navigate(['/auth/login']);

        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showSaveMessage('Erreur lors de la suppression du compte');
        } finally {
            this.isLoading = false;
        }
    }

    private showSaveMessage(message: string) {
        this.saveMessage = message;
        setTimeout(() => {
            this.saveMessage = '';
        }, 3000);
    }
}
