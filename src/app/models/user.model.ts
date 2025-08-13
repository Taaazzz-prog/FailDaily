import { Badge } from './badge.model';
import { UserPreferences } from './user-preferences.model';

export interface LegalConsent {
  documentsAccepted: string[];
  consentDate: Date;
  consentVersion: string;
  marketingOptIn: boolean;
}

export interface AgeVerification {
  birthDate: Date;
  isMinor: boolean;
  needsParentalConsent: boolean;
  parentEmail?: string;
  parentConsentDate?: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  joinDate: Date;
  totalFails: number;
  couragePoints: number;
  badges: Badge[];
  preferences?: UserPreferences;
  legalConsent?: LegalConsent;
  ageVerification?: AgeVerification;
  emailConfirmed?: boolean;
  registrationCompleted?: boolean;
}
