import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';

export interface ConsentRecord {
    id: string;
    userId: string;
    documentType: 'terms' | 'privacy' | 'age-verification' | 'moderation';
    documentVersion: string;
    acceptedAt: Date;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConsentService {
    private consentStatusSubject = new BehaviorSubject<boolean>(false);
    public consentStatus$ = this.consentStatusSubject.asObservable();

    constructor(private logger: ComprehensiveLoggerService) { }

    /**
     * Vérifie si l'utilisateur a accepté tous les documents obligatoires
     */
    async hasValidConsent(userId: string): Promise<boolean> {
        // TODO: Vérifier en base de données
        // Pour l'instant, on simule avec le localStorage
        const consent = localStorage.getItem(`user_consent_${userId}`);
        return consent === 'accepted';
    }

    /**
     * Enregistre l'acceptation des documents obligatoires
     */
    async recordConsent(
        userId: string,
        documentsAccepted: string[],
        additionalData?: { ipAddress?: string; userAgent?: string }
    ): Promise<boolean> {
        try {
            const consentRecord = {
                userId,
                documentsAccepted,
                acceptedAt: new Date().toISOString(),
                ...additionalData
            };

            // Logger l'acceptation du consentement
            await this.logger.logActivity({
                eventType: 'consent_accepted',
                eventCategory: 'system',
                action: 'legal_consent',
                title: 'Consentement légal accepté',
                description: `L'utilisateur a accepté les documents légaux: ${documentsAccepted.join(', ')}`,
                resourceType: 'consent',
                targetUserId: userId,
                payload: {
                    documentsAccepted,
                    ipAddress: additionalData?.ipAddress,
                    userAgent: additionalData?.userAgent
                }
            });

            // TODO: Sauvegarder en base de données via Supabase
            // Pour l'instant, on utilise le localStorage
            localStorage.setItem(`user_consent_${userId}`, 'accepted');
            localStorage.setItem(`user_consent_details_${userId}`, JSON.stringify(consentRecord));

            this.consentStatusSubject.next(true);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du consentement:', error);

            // Logger l'erreur de consentement
            await this.logger.logActivity({
                eventType: 'consent_error',
                eventCategory: 'system',
                action: 'legal_consent_failed',
                title: 'Erreur consentement légal',
                description: `Erreur lors de l'enregistrement du consentement pour l'utilisateur`,
                resourceType: 'consent',
                targetUserId: userId,
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
                payload: { documentsAccepted }
            });

            return false;
        }
    }

    /**
     * Récupère l'historique des consentements pour un utilisateur
     */
    async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
        // TODO: Récupérer depuis la base de données
        // Pour l'instant, simulation avec localStorage
        const details = localStorage.getItem(`user_consent_details_${userId}`);
        if (details) {
            return [JSON.parse(details)];
        }
        return [];
    }

    /**
     * Révoque le consentement (pour la suppression de compte)
     */
    async revokeConsent(userId: string): Promise<boolean> {
        try {
            // TODO: Marquer comme révoqué en base de données
            localStorage.removeItem(`user_consent_${userId}`);
            localStorage.removeItem(`user_consent_details_${userId}`);

            this.consentStatusSubject.next(false);
            return true;
        } catch (error) {
            console.error('Erreur lors de la révocation du consentement:', error);
            return false;
        }
    }

    /**
     * Vérifie l'âge et la nécessité d'autorisation parentale
     */
    checkAgeRequirements(birthDate: Date): {
        canRegister: boolean;
        needsParentalConsent: boolean;
        reason?: string;
    } {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Corriger l'âge si l'anniversaire n'a pas encore eu lieu cette année
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        console.log(`🎂 Calcul d'âge: ${age} ans (né le ${birthDate.toDateString()})`);

        if (age < 13) {
            return {
                canRegister: false,
                needsParentalConsent: false,
                reason: 'L\'âge minimum requis est de 13 ans conformément au RGPD et COPPA.'
            };
        } else if (age >= 13 && age < 16) {
            return {
                canRegister: true,
                needsParentalConsent: true,
                reason: 'Une autorisation parentale est requise pour les utilisateurs de 13 à 16 ans.'
            };
        } else {
            return {
                canRegister: true,
                needsParentalConsent: false
            };
        }
    }

    /**
     * Génère un email d'autorisation parentale
     */
    generateParentalConsentEmail(
        parentEmail: string,
        childName: string,
        childAge: number
    ): string {
        const consentLink = `https://faildaily.app/parental-consent?token=xxx`; // TODO: Générer un vrai token

        return `
      Bonjour,
      
      Votre enfant ${childName} (${childAge} ans) souhaite créer un compte sur l'application FailDaily.
      
      FailDaily est une application de partage et de soutien communautaire où les utilisateurs peuvent partager leurs expériences d'échec de manière bienveillante.
      
      Conformément au RGPD, votre autorisation est requise pour les mineurs de 13 à 16 ans.
      
      Pour autoriser la création de ce compte, cliquez sur le lien suivant :
      ${consentLink}
      
      Vous pouvez également consulter nos documents légaux :
      - Conditions générales d'utilisation : https://faildaily.app/legal-document/terms-of-service
      - Politique de confidentialité : https://faildaily.app/legal-document/privacy-policy
      - Charte de modération : https://faildaily.app/legal-document/moderation-charter
      
      Si vous n'êtes pas le parent/tuteur de ${childName}, veuillez ignorer cet email.
      
      L'équipe FailDaily
      parents@faildaily.app
    `;
    }
}
