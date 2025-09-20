import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonIcon, IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
    IonSelectOption, IonToggle, IonSpinner, IonAlert, IonText,
    AlertController, ActionSheetController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, informationCircleOutline, mailOutline, optionsOutline, personOutline, refreshOutline, saveOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
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
        IonSelectOption, IonToggle, IonSpinner, IonAlert, IonText
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

    // ✅ Validation temps réel du display_name (comme sur register.page)
    displayNameValidation = {
        isChecking: false,
        isAvailable: false,
        message: '',
        suggestedName: ''
    };
    private displayNameCheckTimeout: any;

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
        private themeService: ThemeService,
        private router: Router,
        private alertController: AlertController,
        private actionSheetController: ActionSheetController,
        private toastController: ToastController
    ) {
        // Configuration des icônes
        addIcons({
            createOutline, informationCircleOutline, mailOutline, optionsOutline, personOutline, refreshOutline, saveOutline
        });

        this.editForm = this.createForm();

        // ✅ Écouter les changements du toggle darkMode
        this.editForm.get('darkMode')?.valueChanges.subscribe(isDarkMode => {
            if (isDarkMode !== undefined) {
                this.themeService.setDarkMode(isDarkMode);
            }
        });
    }

    async ngOnInit() {
        await this.loadCurrentUser();
        this.initializeForm();

        // ✅ Écouter les changements du display_name pour validation temps réel
        this.editForm.get('displayName')?.valueChanges.subscribe(value => {
            if (value && value.trim().length >= 3) {
                this.checkDisplayNameAvailability(value.trim());
            } else if (value && value.trim().length > 0) {
                this.displayNameValidation = {
                    isChecking: false,
                    isAvailable: false,
                    message: 'Le pseudo doit contenir au moins 3 caractères',
                    suggestedName: ''
                };
            } else {
                this.displayNameValidation = {
                    isChecking: false,
                    isAvailable: false,
                    message: '',
                    suggestedName: ''
                };
            }
        });

        // ✅ Initialiser la validation pour le nom actuel (il est disponible puisqu'il l'utilise déjà)
        if (this.currentUser?.displayName) {
            this.displayNameValidation = {
                isChecking: false,
                isAvailable: true,
                message: '✅ Nom actuel',
                suggestedName: ''
            };
        }
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
                // Récupérer l'état actuel du thème
                const currentDarkMode = this.themeService.getCurrentMode();
                
                this.profileForm = {
                    displayName: this.currentUser.displayName || '',
                    email: this.currentUser.email || '',
                    bio: this.currentUser.preferences?.bio || '',
                    darkMode: currentDarkMode, // Utiliser l'état actuel du service
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

    // ✅ Vérification temps réel de la disponibilité du display_name
    async checkDisplayNameAvailability(displayName: string) {
        // Annuler la vérification précédente si elle existe
        if (this.displayNameCheckTimeout) {
            clearTimeout(this.displayNameCheckTimeout);
        }

        // Attendre 500ms avant de vérifier (debounce)
        this.displayNameCheckTimeout = setTimeout(async () => {
            this.displayNameValidation.isChecking = true;
            this.displayNameValidation.message = 'Vérification...';

            try {
                // ✅ Pour la modification, on exclut l'utilisateur actuel
                const isAvailable = await this.authService.checkDisplayNameAvailable(
                    displayName,
                    this.currentUser?.id
                );

                if (isAvailable) {
                    this.displayNameValidation = {
                        isChecking: false,
                        isAvailable: true,
                        message: '✅ Ce pseudo est disponible',
                        suggestedName: ''
                    };
                } else {
                    const suggestedName = await this.authService.validateDisplayNameRealTime(displayName);
                    this.displayNameValidation = {
                        isChecking: false,
                        isAvailable: false,
                        message: `❌ Ce pseudo est déjà pris. Suggestion: ${suggestedName.suggestedName}`,
                        suggestedName: suggestedName.suggestedName || ''
                    };
                }
            } catch (error) {
                this.displayNameValidation = {
                    isChecking: false,
                    isAvailable: false,
                    message: 'Erreur lors de la vérification',
                    suggestedName: ''
                };
            }
        }, 500);
    }

    // ✅ Utiliser le nom suggéré
    useSuggestedName() {
        if (this.displayNameValidation.suggestedName) {
            this.editForm.patchValue({
                displayName: this.displayNameValidation.suggestedName
            });
        }
    }

    // ✅ Vérifier si le display_name a changé par rapport à l'original
    get displayNameHasChanged(): boolean {
        const currentDisplayName = this.editForm.get('displayName')?.value || '';
        const originalDisplayName = this.currentUser?.displayName || '';
        return currentDisplayName.trim() !== originalDisplayName.trim();
    }

    // ✅ Vérifier si la sauvegarde est possible
    get canSave(): boolean {
        if (!this.editForm.valid || this.isLoading) {
            return false;
        }

        // Vérifier s'il y a des changements
        const hasChanges = this.editForm.dirty;

        // Si aucun changement, pas besoin de sauvegarder
        if (!hasChanges) {
            return false;
        }

        // Si le display_name n'a pas changé, on peut sauvegarder
        if (!this.displayNameHasChanged) {
            return true;
        }

        // Si le display_name a changé, il faut qu'il soit disponible
        return this.displayNameValidation.isAvailable;
    }

    async saveProfile() {
        console.log('🔄 DÉBUT saveProfile()');
        console.log('📋 Form valid:', this.editForm.valid);
        console.log('👤 Current user:', this.currentUser);
        console.log('📝 Form values:', this.editForm.value);

        if (!this.editForm.valid || !this.currentUser) {
            console.log('❌ ARRÊT: Form invalid ou user null');
            return;
        }

        try {
            this.isLoading = true;
            console.log('🔄 isLoading = true');

            const formValue = this.editForm.value;
            console.log('📝 Form value extracted:', formValue);

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
            // On a déjà fait la mise à jour via saveUserProfile, 
            // pas besoin de rappeler updateUserProfile
            console.log('✅ Profil utilisateur synchronisé');

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
        console.log('🔄 Sauvegarde du profil (API /auth/profile):', userData);

        if (!this.currentUser?.id) {
            throw new Error('Utilisateur non authentifié');
        }

        try {
            // ✅ Vérifier l'unicité du displayName avant de sauvegarder
            const displayName = (userData.displayName || '').trim();
            if (!displayName) {
                throw new Error('Le nom d\'affichage ne peut pas être vide.');
            }

            const isAvailable = await this.authService.checkDisplayNameAvailable(displayName, this.currentUser.id);

            if (!isAvailable) {
                throw new Error(`Le nom "${displayName}" est déjà utilisé. Essayez "${displayName}_1" ou un autre nom.`);
            }

            // Construire le payload attendu par le backend
            const profileData = {
                displayName,
                bio: userData.preferences?.bio ?? ''
            } as any;

            console.log('📤 Envoi vers /auth/profile:', profileData);

            // Mettre à jour via le service d'authentification (relaye vers MysqlService.updateProfile)
            await this.authService.updateUserProfile(profileData);

            console.log('✅ Profil mis à jour avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde profil:', error);
            throw error;
        }
    }

    resetForm() {
        // Utiliser uniquement un toast pour notifier l'annulation
        this.confirmReset();
    }

    confirmReset() {
        this.initializeForm();
        this.showSaveMessage('Modifications annulées', 'refresh-outline', 'medium');
    }

    private async showSaveMessage(message: string, icon: string, color: string) {
        // Remplacer les messages inline par des toasts
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color: color as any,
            icon
        });
        await toast.present();
    }

    async canDeactivate(): Promise<boolean> {
        // Professionnel: confirmer avant de perdre des changements
        if (this.editForm.dirty && !this.isLoading) {
            const alert = await this.alertController.create({
                header: 'Modifications non sauvegardées',
                message: 'Tu as des modifications non sauvegardées. Veux-tu vraiment quitter ? ',
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
            if (role === 'cancel') {
                await this.showSaveMessage('Reste sur la page pour continuer à modifier', 'information-circle-outline', 'medium');
                return false;
            }
            await this.showSaveMessage('Modifications non sauvegardées', 'alert-circle-outline', 'warning');
            return true;
        }
        return true;
    }
}

