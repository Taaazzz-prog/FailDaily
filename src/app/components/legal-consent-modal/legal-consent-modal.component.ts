import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonLabel, IonCheckbox, IonNote, IonIcon,
    IonButtons, IonInput,
    ModalController
} from '@ionic/angular/standalone';
import { ConsentService } from '../../services/consent.service';
import { LegalService } from '../../services/legal.service';

@Component({
    selector: 'app-legal-consent-modal',
    templateUrl: './legal-consent-modal.component.html',
    styleUrls: ['./legal-consent-modal.component.scss'],
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
        IonItem, IonLabel, IonCheckbox, IonNote, IonIcon,
        IonButtons, IonInput
    ]
})
export class LegalConsentModalComponent implements OnInit {
    consentForm!: FormGroup;
    isMinor = false;
    needsParentalConsent = false;
    canRegister = true;
    ageCheckMessage = '';
    today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    minDate = '1900-01-01'; // Format YYYY-MM-DD

    constructor(
        private modalController: ModalController,
        private formBuilder: FormBuilder,
        private consentService: ConsentService,
        private legalService: LegalService
    ) { }

    ngOnInit() {
        this.initializeForm();
    }

    private initializeForm() {
        this.consentForm = this.formBuilder.group({
            birthDate: ['', Validators.required],
            parentEmail: [''], // Requis si mineur
            termsAccepted: [false, Validators.requiredTrue],
            privacyAccepted: [false, Validators.requiredTrue],
            moderationAccepted: [false, Validators.requiredTrue],
            ageVerificationAccepted: [false, Validators.requiredTrue],
            marketingOptIn: [false] // Optionnel
        });

        // Écouter les changements de date de naissance
        this.consentForm.get('birthDate')?.valueChanges.subscribe(value => {
            if (value) {
                this.checkAgeRequirements(new Date(value));
            }
        });
    }

    private checkAgeRequirements(birthDate: Date) {
        const ageCheck = this.consentService.checkAgeRequirements(birthDate);

        this.canRegister = ageCheck.canRegister;
        this.needsParentalConsent = ageCheck.needsParentalConsent;
        this.isMinor = ageCheck.needsParentalConsent;
        this.ageCheckMessage = ageCheck.reason || '';

        // Ajouter validation email parent si nécessaire
        if (this.needsParentalConsent) {
            this.consentForm.get('parentEmail')?.setValidators([Validators.required, Validators.email]);
        } else {
            this.consentForm.get('parentEmail')?.clearValidators();
        }
        this.consentForm.get('parentEmail')?.updateValueAndValidity();
    }

    async onSubmit() {
        if (!this.consentForm.valid || !this.canRegister) {
            return;
        }

        const formValue = this.consentForm.value;
        const documentsAccepted = [];

        if (formValue.termsAccepted) documentsAccepted.push('terms-of-service');
        if (formValue.privacyAccepted) documentsAccepted.push('privacy-policy');
        if (formValue.moderationAccepted) documentsAccepted.push('moderation-charter');
        if (formValue.ageVerificationAccepted) documentsAccepted.push('age-restrictions');

        const consentData = {
            birthDate: formValue.birthDate,
            parentEmail: formValue.parentEmail,
            documentsAccepted,
            marketingOptIn: formValue.marketingOptIn,
            needsParentalConsent: this.needsParentalConsent,
            timestamp: new Date().toISOString()
        };

        // Fermer le modal et retourner les données
        await this.modalController.dismiss(consentData, 'confirm');
    }

    async cancel() {
        await this.modalController.dismiss(null, 'cancel');
    }

    // Getters pour les validations
    get isFormValid(): boolean {
        return this.consentForm.valid && this.canRegister;
    }

    get allRequiredConsentsGiven(): boolean {
        const form = this.consentForm.value;
        return form.termsAccepted &&
            form.privacyAccepted &&
            form.moderationAccepted &&
            form.ageVerificationAccepted;
    }
}
