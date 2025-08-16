/**
 * Types TypeScript pour le système d'inscription FailDaily
 * Compatible avec MySQL et migration depuis Supabase
 */

// ============== TYPES DE BASE ==============

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  birthDate: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  
  // Champs spécifiques MySQL
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  
  // Migration Supabase
  supabaseId?: string;
  migratedFromSupabase?: boolean;
  migratedAt?: Date;
}

export interface UserProfile extends User {
  // Informations étendues
  bio?: string;
  location?: string;
  website?: string;
  
  // Statistiques
  failsCount: number;
  reactionsGiven: number;
  reactionsReceived: number;
  badgesCount: number;
  currentStreak: number;
  longestStreak: number;
  
  // Préférences
  preferences: UserPreferences;
  
  // Badges
  badges: UserBadge[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  emailSettings: EmailPreferences;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  badgeNotifications: boolean;
  systemNotifications: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PrivacyPreferences {
  profileVisible: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showStats: boolean;
  allowSearch: boolean;
  showOnlineStatus: boolean;
}

export interface EmailPreferences {
  newsletter: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  badgeNotifications: boolean;
}

// ============== TYPES D'INSCRIPTION ==============

export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  birthDate: string;
  agreeToTerms: boolean;
  agreeToNewsletter?: boolean;
  referralCode?: string;
  
  // Données optionnelles
  bio?: string;
  location?: string;
  avatarUrl?: string;
  
  // Métadonnées d'inscription
  registrationSource?: 'web' | 'mobile' | 'migration';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface RegistrationStep {
  step: number;
  name: string;
  title: string;
  subtitle?: string;
  completed: boolean;
  valid: boolean;
  optional?: boolean;
  data?: any;
  errors?: RegistrationValidationError[];
}

export interface RegistrationValidationError {
  field: string;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  errors?: RegistrationValidationError[];
  requiresEmailVerification?: boolean;
  requiresAgeVerification?: boolean;
}

// ============== TYPES DE MIGRATION ==============

export interface MigrationData {
  fromSupabase: boolean;
  toMysql: boolean;
  migrationInProgress: boolean;
  step: MigrationStep;
  progress: number;
  message: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export type MigrationStep = 
  | 'idle' 
  | 'detecting' 
  | 'backing_up' 
  | 'exporting' 
  | 'migrating' 
  | 'validating' 
  | 'cleanup' 
  | 'completed' 
  | 'error';

export interface SupabaseUserData {
  id: string;
  email: string;
  user_metadata: {
    displayName?: string;
    birthDate?: string;
    avatarUrl?: string;
  };
  app_metadata: any;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export interface MigrationMapping {
  supabaseField: string;
  mysqlField: string;
  transformer?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

export interface MigrationResult {
  success: boolean;
  migratedUsers: number;
  skippedUsers: number;
  errors: MigrationError[];
  duration: number;
  details: MigrationDetail[];
}

export interface MigrationError {
  userId?: string;
  email?: string;
  error: string;
  step: MigrationStep;
  timestamp: Date;
  recoverable: boolean;
}

export interface MigrationDetail {
  userId: string;
  email: string;
  status: 'migrated' | 'skipped' | 'error';
  reason?: string;
  mysqlId?: number;
}

// ============== TYPES D'AUTHENTIFICATION ==============

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  requiresPasswordReset?: boolean;
  requiresEmailVerification?: boolean;
  isMigrated?: boolean;
}

export interface AuthToken {
  token: string;
  type: 'Bearer';
  expiresAt: Date;
  refreshToken?: string;
  scope?: string[];
}

export interface PasswordResetRequest {
  email: string;
  newPassword: string;
  confirmPassword: string;
  resetToken: string;
}

export interface EmailVerificationData {
  email: string;
  token: string;
  expiresAt: Date;
}

// ============== TYPES DE VÉRIFICATION ==============

export interface AgeVerificationData {
  birthDate: string;
  age: number;
  isValid: boolean;
  countryCode?: string;
  minimumAge: number;
  parentalConsentRequired?: boolean;
}

export interface EmailValidationResult {
  valid: boolean;
  exists?: boolean;
  disposable?: boolean;
  role?: boolean;
  message?: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  name: string;
  met: boolean;
  description: string;
}

// ============== TYPES DE CONFIGURATION ==============

export interface RegistrationConfig {
  minimumAge: number;
  requireEmailVerification: boolean;
  requireAgeVerification: boolean;
  allowSocialLogin: boolean;
  enableReferrals: boolean;
  maxDisplayNameLength: number;
  passwordRequirements: PasswordRequirements;
  allowedDomains?: string[];
  blockedDomains?: string[];
  registrationLimits: RegistrationLimits;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
}

export interface RegistrationLimits {
  perDay: number;
  perHour: number;
  perIP: number;
  cooldownMinutes: number;
}

// ============== TYPES D'ÉVÉNEMENTS ==============

export interface RegistrationEvent {
  id: string;
  type: RegistrationEventType;
  userId?: number;
  email: string;
  data: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export type RegistrationEventType = 
  | 'registration_started'
  | 'registration_completed'
  | 'registration_failed'
  | 'email_verification_sent'
  | 'email_verified'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'migration_started'
  | 'migration_completed'
  | 'login_attempt'
  | 'login_success'
  | 'login_failed';

// ============== TYPES DE FORMULAIRES ==============

export interface RegistrationFormData {
  step1: {
    email: string;
    displayName: string;
  };
  step2: {
    password: string;
    confirmPassword: string;
  };
  step3: {
    birthDate: string;
    ageConfirmed: boolean;
  };
  step4: {
    agreeToTerms: boolean;
    agreeToNewsletter: boolean;
    referralCode?: string;
  };
}

export interface FormValidationState {
  [fieldName: string]: {
    valid: boolean;
    touched: boolean;
    errors: string[];
    warnings?: string[];
  };
}

export interface RegistrationWizardState {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  canGoBack: boolean;
  isLoading: boolean;
  formData: RegistrationFormData;
  validation: FormValidationState;
  errors: string[];
  warnings: string[];
}

// ============== TYPES DE RÉPONSES API ==============

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  meta?: ApiMeta;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
  details?: any;
}

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============== TYPES UTILITAIRES ==============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type UserCreationData = OptionalFields<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;

export type RegistrationStepData<T extends keyof RegistrationFormData> = RegistrationFormData[T];

// ============== CONSTANTES DE TYPES ==============

export const REGISTRATION_STEPS = {
  BASIC_INFO: 1,
  ACCOUNT_SECURITY: 2,
  AGE_VERIFICATION: 3,
  TERMS_CONDITIONS: 4
} as const;

export const MIGRATION_STEPS = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  BACKING_UP: 'backing_up',
  EXPORTING: 'exporting',
  MIGRATING: 'migrating',
  VALIDATING: 'validating',
  CLEANUP: 'cleanup',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

export const REGISTRATION_EVENTS = {
  STARTED: 'registration_started',
  COMPLETED: 'registration_completed',
  FAILED: 'registration_failed',
  EMAIL_VERIFICATION_SENT: 'email_verification_sent',
  EMAIL_VERIFIED: 'email_verified',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  MIGRATION_STARTED: 'migration_started',
  MIGRATION_COMPLETED: 'migration_completed',
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed'
} as const;

// ============== TYPES GUARDS ==============

export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'number' && 
    typeof obj.email === 'string' && 
    typeof obj.displayName === 'string';
}

export function isRegistrationData(obj: any): obj is RegistrationData {
  return obj && 
    typeof obj.email === 'string' && 
    typeof obj.password === 'string' && 
    typeof obj.displayName === 'string' && 
    typeof obj.agreeToTerms === 'boolean';
}

export function isMigrationData(obj: any): obj is MigrationData {
  return obj && 
    typeof obj.fromSupabase === 'boolean' && 
    typeof obj.toMysql === 'boolean' && 
    typeof obj.step === 'string';
}

export function isSupabaseUserData(obj: any): obj is SupabaseUserData {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.email === 'string' && 
    typeof obj.created_at === 'string';
}

// ============== EXPORTS PAR DÉFAUT ==============

export default {
  REGISTRATION_STEPS,
  MIGRATION_STEPS,
  REGISTRATION_EVENTS,
  isUser,
  isRegistrationData,
  isMigrationData,
  isSupabaseUserData
};