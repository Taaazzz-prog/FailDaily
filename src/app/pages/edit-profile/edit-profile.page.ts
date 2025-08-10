import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonIcon, IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
    IonSelectOption, IonToggle, IonSpinner, IonAlert,
    AlertController, ActionSheetController
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { firstValueFrom } from 'rxjs';

interface EditProfileForm {
    displayName: string;
    email: string;
    bio: string;
    darkMode: boolean;
    encouragementNotifications: boolean;
    reminderFrequency: string;
}

@Component({
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.page.html',
    styleUrls: ['./edit-profile.page.scss'],
    imports: [
        CommonModule, ReactiveFormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
        IonIcon, IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
        IonSelectOption, IonToggle, IonSpinner, IonAlert
    ]
})
export class EditProfilePage implements OnInit {
    editForm: FormGroup;
    currentUser: User | null = null;
    profileForm: EditProfileForm = {
        displayName: '',
        email: '',
        bio: '',
        darkMode: false,
        encouragementNotifications: true,
        reminderFrequency: 'weekly'
    };

    isLoading = false;
    saveMessage = '';
    saveMessageIcon = '';
    saveMessageColor = '';
    showCancelAlert = false;

    cancelAlertButtons = [
        {
            text: 'Continuer à modifier',
            role: 'cancel'
        },
        {
            text: 'Oui, annuler',
            handler: () => this.confirmReset()
        }
    ];

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController,
        private actionSheetController: ActionSheetController
    ) {
        this.editForm = this.createForm();
    }

    async ngOnInit() {
        await this.loadCurrentUser();
        this.initializeForm();
    }

    private createForm(): FormGroup {
        return this.formBuilder.group({
            displayName: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50)
            ]],
            email: [{ value: '', disabled: true }],
            bio: ['', [Validators.maxLength(500)]],
            darkMode: [false],
            encouragementNotifications: [true],
            reminderFrequency: ['weekly', Validators.required]
        });
    }

    private async loadCurrentUser() {
        try {
            const user = await firstValueFrom(this.authService.currentUser$);
            this.currentUser = user || null;

            if (this.currentUser) {
                this.profileForm = {
                    displayName: this.currentUser.displayName || '',
                    email: this.currentUser.email || '',
                    bio: this.currentUser.preferences?.bio || '',
                    darkMode: this.currentUser.preferences?.theme === 'dark',
                    encouragementNotifications: this.currentUser.preferences?.notifications?.encouragement ?? true,
                    reminderFrequency: this.currentUser.preferences?.notifications?.reminderFrequency || 'weekly'
                };
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
    }

    private initializeForm() {
        this.editForm.patchValue({
            displayName: this.profileForm.displayName,
            email: this.profileForm.email,
            bio: this.profileForm.bio,
            darkMode: this.profileForm.darkMode,
            encouragementNotifications: this.profileForm.encouragementNotifications,
            reminderFrequency: this.profileForm.reminderFrequency
        });

        // Marquer le formulaire comme pristine après l'initialisation
        this.editForm.markAsPristine();
    }

    async saveProfile() {
        if (!this.editForm.valid || !this.currentUser) return;

        try {
            this.isLoading = true;

            const formValue = this.editForm.value;

            // Construire l'objet utilisateur mis à jour
            const updatedUser: Partial<User> = {
                ...this.currentUser,
                displayName: formValue.displayName,
                preferences: {
                    notificationsEnabled: this.currentUser.preferences?.notificationsEnabled ?? true,
                    reminderTime: this.currentUser.preferences?.reminderTime ?? '09:00',
                    anonymousMode: this.currentUser.preferences?.anonymousMode ?? false,
                    shareLocation: this.currentUser.preferences?.shareLocation ?? false,
                    soundEnabled: this.currentUser.preferences?.soundEnabled ?? true,
                    hapticsEnabled: this.currentUser.preferences?.hapticsEnabled ?? true,
                    darkMode: formValue.darkMode,
                    theme: formValue.darkMode ? 'dark' : 'light',
                    bio: formValue.bio,
                    notifications: {
                        encouragement: formValue.encouragementNotifications,
                        reminderFrequency: formValue.reminderFrequency
                    }
                }
            };

            // Dans une vraie application, ceci serait un appel API
            await this.saveUserProfile(updatedUser);

            // Mettre à jour le service d'authentification
            await this.authService.updateCurrentUser(updatedUser as User);

            this.showSaveMessage('Profil sauvegardé avec succès !', 'checkmark-circle-outline', 'success');
            this.editForm.markAsPristine();

            // Retourner au profil après 2 secondes
            setTimeout(() => {
                this.router.navigate(['/tabs/profile']);
            }, 2000);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showSaveMessage('Erreur lors de la sauvegarde', 'alert-circle-outline', 'danger');
        } finally {
            this.isLoading = false;
        }
    }

    private async saveUserProfile(userData: Partial<User>) {
        // Simuler un appel API
        console.log('Sauvegarde du profil:', userData);

        // Sauvegarder localement pour la démo
        const currentUserStr = localStorage.getItem(`user_${this.currentUser?.id}`);
        if (currentUserStr) {
            const currentUserData = JSON.parse(currentUserStr);
            const updatedUserData = { ...currentUserData, ...userData };
            localStorage.setItem(`user_${this.currentUser?.id}`, JSON.stringify(updatedUserData));
        }

        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    resetForm() {
        if (this.editForm.dirty) {
            this.showCancelAlert = true;
        } else {
            this.confirmReset();
        }
    }

    confirmReset() {
        this.initializeForm();
        this.showSaveMessage('Modifications annulées', 'refresh-outline', 'medium');
    }

    private showSaveMessage(message: string, icon: string, color: string) {
        this.saveMessage = message;
        this.saveMessageIcon = icon;
        this.saveMessageColor = color;

        setTimeout(() => {
            this.saveMessage = '';
        }, 4000);
    }

    async canDeactivate(): Promise<boolean> {
        if (this.editForm.dirty && !this.isLoading) {
            const alert = await this.alertController.create({
                header: 'Modifications non sauvegardées',
                message: 'Tu as des modifications non sauvegardées. Veux-tu vraiment quitter ?',
                buttons: [
                    {
                        text: 'Rester',
                        role: 'cancel',
                        handler: () => false
                    },
                    {
                        text: 'Quitter sans sauvegarder',
                        handler: () => true
                    }
                ]
            });

            await alert.present();
            const { role } = await alert.onDidDismiss();
            return role !== 'cancel';
        }
        return true;
    }
}
