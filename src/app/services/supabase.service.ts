import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { safeAuthOperation } from '../utils/mobile-fixes';
import { supabaseLog } from '../utils/logger';
import { SUPABASE_CONFIG, withTimeout, retryWithBackoff } from '../utils/supabase-config';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    public user$: Observable<User | null> = this.currentUser.asObservable();
    public currentUser$: Observable<User | null> = this.currentUser.asObservable();
    public client: SupabaseClient;

    // Subject pour notifier les changements de données
    private profileUpdated = new Subject<void>();
    public profileUpdated$ = this.profileUpdated.asObservable();

    // ✅ NOUVEAU : Debounce pour éviter les NavigatorLockAcquireTimeoutError
    private authChangeTimeout: any = null;
    private lastAuthUserId: string | null = null;

    // ✅ NOUVEAU : Debounce pour les opérations de profil
    private profileOperationTimeout: any = null;
    private lastProfileUserId: string | null = null;

    constructor() {
        this.supabase = createClient(
            environment.supabase.url,
            environment.supabase.anonKey,
            SUPABASE_CONFIG
        );
        this.client = this.supabase;

        this.supabase.auth.onAuthStateChange((event, session) => {
            supabaseLog('🔐 SupabaseService: Auth state change:', event, session?.user?.id || 'no user');

            // ✅ PROTECTION : Debounce pour éviter les appels multiples rapprochés
            if (this.authChangeTimeout) {
                clearTimeout(this.authChangeTimeout);
            }

            const currentUserId = session?.user?.id || null;

            // ✅ PROTECTION : Ignorer si c'est le même utilisateur
            if (this.lastAuthUserId === currentUserId && event !== 'SIGNED_OUT') {
                supabaseLog('🔐 SupabaseService: Même utilisateur, événement ignoré');
                return;
            }

            this.authChangeTimeout = setTimeout(async () => {
                this.lastAuthUserId = currentUserId;

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    this.currentUser.next(session?.user || null);

                    // Enregistrer la connexion pour le monitoring temps réel
                    if (session?.user && event === 'SIGNED_IN') {
                        try {
                            await this.logUserLogin(session.user.id);
                            supabaseLog('🔐 User login logged for real-time monitoring');
                        } catch (error) {
                            console.warn('Could not log user login:', error);
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    this.lastAuthUserId = null;
                    this.currentUser.next(null);
                }
            }, 100); // Debounce de 100ms
        });

        // Initialiser l'utilisateur actuel sans nettoyer les sessions
        supabaseLog('🔐 SupabaseService: Initializing current user state...');
        this.getCurrentUser().then(user => {
            supabaseLog('🔐 SupabaseService: Initial user loaded:', user?.id || 'no user');
        });
    }

    // Méthode synchrone pour éviter les problèmes de concurrence avec NavigatorLock
    getCurrentUserSync(): User | null {
        return this.currentUser.value;
    }

    async getCurrentUser(): Promise<User | null> {
        return safeAuthOperation(async () => {
            // Si on a déjà un utilisateur en cache, on le retourne
            if (this.currentUser.value) {
                return this.currentUser.value;
            }

            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) {
                supabaseLog('🔐 SupabaseService: Session expirée ou manquante (normal):', error.message);
                return null;
            }
            this.currentUser.next(user);
            return user;
        });
    }

    async signUp(email: string, password: string, displayName: string): Promise<any> {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    role: 'user' // ✅ Définir le rôle par défaut dans user_metadata
                }
            }
        });

        if (error) throw error;
        return data;
    }

    async completeRegistration(userId: string, legalConsent: any, ageVerification: any): Promise<any> {
        console.log('🔧 SupabaseService - Completing registration for user:', userId);
        console.log('🔧 Legal consent:', legalConsent);
        console.log('🔧 Age verification:', ageVerification);

        const { data, error } = await this.supabase
            .from('profiles')
            .update({
                legal_consent: legalConsent,
                age_verification: ageVerification,
                registration_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('🔧 SupabaseService - Error completing registration:', error);
            throw error;
        }

        console.log('🔧 SupabaseService - Registration completed successfully:', data);
        return data;
    }



    async signIn(email: string, password: string): Promise<any> {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signOut(): Promise<void> {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
        this.currentUser.next(null);
    }

    async clearAllSessions(): Promise<void> {
        try {
            supabaseLog('🔐 SupabaseService: Clearing all sessions and local storage');

            // Déconnecter de Supabase
            await this.supabase.auth.signOut();

            // Vider le localStorage de Supabase
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.includes('supabase') || key.includes('sb-')) {
                        localStorage.removeItem(key);
                        supabaseLog('🔐 SupabaseService: Removed localStorage key:', key);
                    }
                });
            }

            // Réinitialiser l'utilisateur courant
            this.currentUser.next(null);

            supabaseLog('🔐 SupabaseService: All sessions cleared');
        } catch (error) {
            console.error('🔐 SupabaseService: Error clearing sessions:', error);
            throw error;
        }
    }

    async resetPassword(email: string): Promise<void> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    }

    async getProfile(userId: string): Promise<any> {
        return safeAuthOperation(async () => {
            try {
                const { data, error } = await this.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter les erreurs

                if (error) {
                    supabaseLog('Erreur récupération profil:', error);
                    return null;
                }
                return data;
            } catch (error) {
                supabaseLog('Erreur lors de la récupération du profil:', error);
                return null;
            }
        });
    }

    async createProfile(user: any): Promise<any> {
        return safeAuthOperation(async () => {
            try {
                supabaseLog('🔐 SupabaseService: Creating profile for user:', user.id);

                // Générer un display_name unique
                const baseDisplayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Utilisateur';
                const uniqueDisplayName = await this.generateUniqueDisplayName(baseDisplayName);

                const profileData = {
                    id: user.id,
                    email: user.email,
                    display_name: uniqueDisplayName,
                    avatar_url: 'assets/anonymous-avatar.svg',
                    role: 'user', // ✅ Rôle par défaut pour tous les nouveaux comptes
                    email_confirmed: true,
                    registration_completed: false,
                    legal_consent: null,
                    age_verification: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Utiliser upsert pour gérer le cas où le profil existe déjà
                const { data, error } = await this.supabase
                    .from('profiles')
                    .upsert(profileData, {
                        onConflict: 'id',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('❌ SupabaseService: Error creating/updating profile:', error);
                    throw error;
                }

                console.log('✅ SupabaseService: Profile created/updated successfully');
                return data;
            } catch (error) {
                console.error('❌ SupabaseService: Error in createProfile:', error);
                throw error;
            }
        });
    }

    async updateProfile(userId: string, profile: any): Promise<any> {
        return safeAuthOperation(async () => {
            supabaseLog('🔄 SupabaseService.updateProfile called with:', { userId, profile });

            // Filtrer SEULEMENT les champs qui existent dans la base de données
            const allowedFields = [
                'id', 'email', 'display_name', 'avatar_url',
                'bio', 'preferences', 'stats', 'email_confirmed',
                'registration_completed', 'legal_consent', 'age_verification',
                'created_at', 'updated_at'
            ];

            const profileToUpdate: any = {
                id: userId  // S'assurer que l'ID est présent
            };

            // Ne copier QUE les champs autorisés
            allowedFields.forEach(field => {
                if (profile[field] !== undefined) {
                    profileToUpdate[field] = profile[field];
                }
            });

            // Si l'objet contient 'avatar', le convertir en 'avatar_url'
            if (profile.avatar && !profile.avatar_url) {
                profileToUpdate.avatar_url = profile.avatar;
                supabaseLog('⚠️ Conversion avatar → avatar_url:', profile.avatar);
            }

            supabaseLog('📤 Envoi vers Supabase profiles (filtré):', profileToUpdate);

            const { data, error } = await this.supabase
                .from('profiles')
                .upsert(profileToUpdate, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                })
                .select()
                .single();

            supabaseLog('� Supabase response:', { data, error });

            if (error) {
                console.error('❌ Supabase updateProfile error:', error);
                throw error;
            }

            supabaseLog('✅ Profile updated successfully:', data);
            return data;
        });
    }

    async createFail(fail: any): Promise<any> {
        return safeAuthOperation(async () => {
            const user = this.getCurrentUserSync();
            if (!user) {
                throw new Error('Utilisateur non authentifié');
            }

            // Validation des données avant envoi
            const failData = {
                title: fail.title?.toString()?.trim() || 'Mon fail',
                description: fail.description?.toString()?.trim() || '',
                category: fail.category, // Suppression du fallback
                image_url: fail.image_url || null,
                is_public: Boolean(fail.is_public),
                user_id: user.id,
                reactions: { courage: 0, empathy: 0, laugh: 0, support: 0 },
                comments_count: 0
            };

            // Validation supplémentaire
            if (!failData.description) {
                throw new Error('La description ne peut pas être vide');
            }

            if (!failData.category) {
                throw new Error('La catégorie doit être spécifiée');
            }

            // Vérifier que la catégorie est valide selon les nouvelles catégories
            const validCategories = [
                'courage', 'humour', 'entraide', 'perseverance', 'special',
                'travail', 'sport', 'cuisine', 'transport', 'technologie',
                'relations', 'finances', 'bricolage', 'apprentissage',
                'santé', 'voyage', 'communication'
            ];
            if (!validCategories.includes(failData.category)) {
                throw new Error(`Catégorie invalide: ${failData.category}`);
            }

            supabaseLog('Données à insérer:', failData);

            const { data, error } = await this.supabase
                .from('fails')
                .insert(failData)
                .select()
                .single();

            if (error) {
                console.error('Erreur Supabase lors de la création du fail:', error);
                throw new Error(`Erreur lors de la création du fail: ${error.message}`);
            }

            // ✅ NOUVEAU : Donner des points de courage pour la création d'un fail
            await this.addCouragePointsForFailCreation(user.id);

            // Émettre un événement pour mettre à jour l'interface
            this.profileUpdated.next();
            supabaseLog(`Fail créé avec succès, points de courage ajoutés pour ${user.id}`);

            return data;
        });
    } async getFails(limit: number = 20, offset: number = 0): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('fails')
            .select('*')
            // Supprimé le filtre .eq('is_public', true) pour afficher TOUS les fails
            // La gestion anonyme/public se fait dans le service FailService
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error in getFails:', error);
            throw error;
        }

        return data || [];
    }

    async getFailById(failId: string): Promise<any | null> {
        // Forcer un refresh sans cache avec différentes stratégies
        const timestamp = Date.now();

        try {
            // Stratégie 1: Nouvelle requête avec headers pour éviter le cache
            const { data, error } = await this.supabase
                .from('fails')
                .select('*')
                .eq('id', failId)
                .limit(1)  // Force une nouvelle requête
                .order('created_at', { ascending: false })  // Ajoute un ordre pour forcer le refresh
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                throw error;
            }

            supabaseLog(`📊 getFailById - Fail récupéré (${timestamp}):`, data?.reactions);
            return data || null;

        } catch (error) {
            supabaseLog(`❌ Erreur getFailById:`, error);
            throw error;
        }
    } async getUserFails(userId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('fails')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async updateFail(failId: string, updates: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('fails')
            .update(updates)
            .eq('id', failId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } async addReaction(failId: string, reactionType: string): Promise<void> {
        const user = this.currentUser.value;
        if (!user) throw new Error('Utilisateur non authentifié');

        try {
            // Vérifier si l'utilisateur a déjà cette réaction spécifique avec retry et timeout
            const existingReaction = await retryWithBackoff(async () => {
                return await withTimeout(
                    Promise.resolve(
                        this.supabase
                            .from('reactions')
                            .select('id')
                            .eq('fail_id', failId)
                            .eq('user_id', user.id)
                            .eq('reaction_type', reactionType)
                            .maybeSingle()
                    ),
                    8000, // 8 secondes max
                    'Timeout lors de la vérification de réaction'
                );
            }, 2); // Max 2 retries pour la vérification

            const checkResult = existingReaction as { data: any, error: any };
            if (checkResult.error) {
                supabaseLog(`Erreur lors de la vérification: ${checkResult.error.message}`);
                throw checkResult.error;
            }

            // Si l'utilisateur a déjà cette réaction, on ne fait rien
            if (checkResult.data) {
                supabaseLog(`L'utilisateur a déjà la réaction ${reactionType} sur ce fail`);
                return;
            }

            // Sinon, ajouter la nouvelle réaction avec retry et timeout
            await retryWithBackoff(async () => {
                const result = await withTimeout(
                    Promise.resolve(
                        this.supabase
                            .from('reactions')
                            .insert({
                                fail_id: failId,
                                user_id: user.id,
                                reaction_type: reactionType
                            })
                    ),
                    8000, // 8 secondes max
                    'Timeout lors de l\'ajout de réaction'
                );

                const insertResult = result as { data: any, error: any };
                if (insertResult.error) {
                    supabaseLog(`Erreur lors de l'ajout: ${insertResult.error.message}`);
                    throw insertResult.error;
                }
                return insertResult;
            }, 2); // Max 2 retries pour l'ajout

            // Incrémenter le compteur
            await this.updateReactionCount(failId, reactionType, 1);

            // Mettre à jour les points de courage de l'auteur du fail
            await this.updateCouragePoints(failId, reactionType, 1);

            // Émettre un événement pour mettre à jour l'interface
            this.profileUpdated.next();
            supabaseLog(`Réaction ${reactionType} ajoutée avec succès pour le fail ${failId}`);
        } catch (error) {
            console.error('Erreur dans addReaction:', error);
            throw error;
        }
    }

    async removeReaction(failId: string, reactionType: string): Promise<void> {
        const user = this.currentUser.value;
        if (!user) throw new Error('Utilisateur non authentifié');

        const { error } = await this.supabase
            .from('reactions')
            .delete()
            .match({
                fail_id: failId,
                user_id: user.id,
                reaction_type: reactionType
            });

        if (error) throw error;
        await this.updateReactionCount(failId, reactionType, -1);

        // Mettre à jour les points de courage (diminuer)
        await this.updateCouragePoints(failId, reactionType, -1);

        // Émettre un événement pour mettre à jour l'interface
        this.profileUpdated.next();
        supabaseLog(`Réaction ${reactionType} retirée avec succès pour le fail ${failId}`);
    }

    private async updateReactionCount(failId: string, reactionType: string, delta: number): Promise<void> {
        supabaseLog(`🔢 updateReactionCount: ${reactionType} ${delta > 0 ? '+' : ''}${delta} pour fail ${failId}`);

        try {
            // Utilisation d'une fonction RPC pour mise à jour atomique
            const { error } = await this.supabase.rpc('increment_reaction_count', {
                fail_id: failId,
                reaction_type: reactionType,
                increment_value: delta
            });

            if (error) {
                supabaseLog(`❌ Erreur RPC increment_reaction_count: ${error.message}`);
                // Fallback vers la méthode manuelle
                await this.updateReactionCountManual(failId, reactionType, delta);
            } else {
                supabaseLog(`✅ Compteur ${reactionType} mis à jour avec succès via RPC`);
            }
        } catch (rpcError) {
            supabaseLog(`❌ Erreur RPC, fallback manuel: ${rpcError}`);
            // Fallback vers la méthode manuelle
            await this.updateReactionCountManual(failId, reactionType, delta);
        }
    }

    private async updateReactionCountManual(failId: string, reactionType: string, delta: number): Promise<void> {
        supabaseLog(`🔢 updateReactionCountManual: ${reactionType} ${delta > 0 ? '+' : ''}${delta} pour fail ${failId}`);

        const { data: fail, error: fetchError } = await this.supabase
            .from('fails')
            .select('reactions')
            .eq('id', failId)
            .single();

        if (fetchError) {
            supabaseLog(`❌ Erreur fetch fail pour compteur: ${fetchError.message}`);
            throw fetchError;
        }

        const reactions = fail.reactions || {};
        const oldValue = reactions[reactionType] || 0;
        const newValue = Math.max(0, oldValue + delta);

        supabaseLog(`🔢 Mise à jour compteur ${reactionType}: ${oldValue} → ${newValue}`);

        reactions[reactionType] = newValue;

        const { error: updateError } = await this.supabase
            .from('fails')
            .update({ reactions })
            .eq('id', failId);

        if (updateError) {
            supabaseLog(`❌ Erreur update compteur: ${updateError.message}`);
            throw updateError;
        }

        supabaseLog(`✅ Compteur ${reactionType} mis à jour avec succès: ${newValue}`);
    }

    // Nouvelle méthode pour mettre à jour les points de courage
    private async updateCouragePoints(failId: string, reactionType: string, delta: number): Promise<void> {
        try {
            // Récupérer l'auteur du fail
            const { data: fail, error: failError } = await this.supabase
                .from('fails')
                .select('user_id')
                .eq('id', failId)
                .single();

            if (failError || !fail) {
                console.error('Impossible de récupérer le fail pour les points de courage:', failError);
                return;
            }

            // Calculer les points à ajouter selon le type de réaction
            let pointsToAdd = 0;
            switch (reactionType) {
                case 'courage':
                    pointsToAdd = 5 * delta;
                    break;
                case 'empathy':
                case 'support':
                    pointsToAdd = 2 * delta;
                    break;
                case 'laugh':
                    pointsToAdd = 1 * delta;
                    break;
            }

            if (pointsToAdd === 0) return;

            // Mettre à jour les points de courage dans le profil
            const { data: profile, error: profileFetchError } = await this.supabase
                .from('profiles')
                .select('stats')
                .eq('id', fail.user_id)
                .single();

            if (profileFetchError) {
                console.error('Erreur récupération profil:', profileFetchError);
                return;
            }

            const stats = profile.stats || { couragePoints: 0 };
            stats.couragePoints = Math.max(0, (stats.couragePoints || 0) + pointsToAdd);

            const { error: updateError } = await this.supabase
                .from('profiles')
                .update({ stats })
                .eq('id', fail.user_id);

            if (updateError) {
                console.error('Erreur mise à jour points courage:', updateError);
            } else {
                supabaseLog(`Points de courage mis à jour: +${pointsToAdd} pour ${fail.user_id}`);
            }

        } catch (error) {
            console.error('Erreur dans updateCouragePoints:', error);
        }
    }

    // ✅ NOUVEAU : Méthode de debug pour analyser les points de courage en détail
    async debugCouragePoints(userId: string): Promise<any> {
        try {
            console.log('🔍 DEBUG - Analyse détaillée des points de courage pour:', userId);

            // 1. Points actuels dans le profil
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('stats, display_name')
                .eq('id', userId)
                .single();

            const currentPoints = profile?.stats?.couragePoints || 0;
            console.log(`📊 Points actuels dans le profil: ${currentPoints}`);

            // 2. Récupérer tous les fails de l'utilisateur
            const { data: userFails } = await this.supabase
                .from('fails')
                .select(`
                    id, 
                    title, 
                    reactions,
                    created_at
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            console.log(`📝 Nombre de fails de l'utilisateur: ${userFails?.length || 0}`);

            // 3. Calculer les points détaillés par fail et par type de réaction
            let totalCalculatedPoints = 0;
            const detailedBreakdown: any[] = [];

            if (userFails) {
                userFails.forEach((fail, index) => {
                    const reactions = fail.reactions || {};
                    const couragePoints = (reactions.courage || 0) * 5;
                    const empathyPoints = (reactions.empathy || 0) * 2;
                    const supportPoints = (reactions.support || 0) * 2;
                    const laughPoints = (reactions.laugh || 0) * 1;
                    const failTotal = couragePoints + empathyPoints + supportPoints + laughPoints;

                    totalCalculatedPoints += failTotal;

                    if (failTotal > 0) {
                        detailedBreakdown.push({
                            failTitle: fail.title.substring(0, 30) + '...',
                            failDate: new Date(fail.created_at).toLocaleDateString('fr-FR'),
                            reactions: {
                                courage: `${reactions.courage || 0} (${couragePoints}pts)`,
                                empathy: `${reactions.empathy || 0} (${empathyPoints}pts)`,
                                support: `${reactions.support || 0} (${supportPoints}pts)`,
                                laugh: `${reactions.laugh || 0} (${laughPoints}pts)`
                            },
                            total: failTotal
                        });
                    }
                });
            }

            // 4. Points de la création de fails (bonus)
            const failCreationPoints = (userFails?.length || 0) * 3; // 3 points par fail créé (modifié)

            const debugInfo = {
                utilisateur: profile?.display_name || 'Inconnu',
                pointsActuelsEnBase: currentPoints,
                pointsCalculesDepuisReactions: totalCalculatedPoints,
                bonusCreationFails: failCreationPoints,
                totalTheorique: totalCalculatedPoints + failCreationPoints,
                difference: currentPoints - (totalCalculatedPoints + failCreationPoints),
                nombreFails: userFails?.length || 0,
                detailParFail: detailedBreakdown,
                baremePoints: {
                    courage: '5 points',
                    empathy: '2 points',
                    support: '2 points',
                    laugh: '1 point',
                    creationFail: '3 points' // Modifié pour correspondre
                }
            };

            console.log('🎯 DEBUG - Analyse complète:', debugInfo);
            return debugInfo;

        } catch (error) {
            console.error('Erreur dans debugCouragePoints:', error);
            return null;
        }
    }

    // ✅ NOUVEAU : Ajouter des points de courage pour la création d'un fail
    private async addCouragePointsForFailCreation(userId: string): Promise<void> {
        try {
            const FAIL_CREATION_POINTS = 3; // 3 points pour créer un fail

            // Récupérer le profil actuel
            const { data: profile, error: profileError } = await this.supabase
                .from('profiles')
                .select('stats')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Erreur récupération profil pour fail creation:', profileError);
                return;
            }

            const stats = profile.stats || { couragePoints: 0 };
            stats.couragePoints = (stats.couragePoints || 0) + FAIL_CREATION_POINTS;

            const { error: updateError } = await this.supabase
                .from('profiles')
                .update({ stats })
                .eq('id', userId);

            if (updateError) {
                console.error('Erreur mise à jour points création fail:', updateError);
            } else {
                supabaseLog(`+${FAIL_CREATION_POINTS} points de courage pour création de fail (${userId})`);
            }
        } catch (error) {
            console.error('Erreur dans addCouragePointsForFailCreation:', error);
        }
    }

    // ✅ NOUVEAU : Méthode publique pour tester l'ajout de points (debug)
    async testAddCouragePoints(userId: string, points: number = 10): Promise<void> {
        try {
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('stats')
                .eq('id', userId)
                .single();

            const stats = profile?.stats || { couragePoints: 0 };
            stats.couragePoints = (stats.couragePoints || 0) + points;

            await this.supabase
                .from('profiles')
                .update({ stats })
                .eq('id', userId);

            supabaseLog(`+${points} points de test ajoutés pour ${userId}`);
            this.profileUpdated.next();
        } catch (error) {
            console.error('Erreur dans testAddCouragePoints:', error);
        }
    }

    private async updateReactionCountsForChange(failId: string, oldReactionType: string, newReactionType: string): Promise<void> {
        // Mise à jour atomique des compteurs pour un changement de réaction
        const { data: fail, error: fetchError } = await this.supabase
            .from('fails')
            .select('reactions')
            .eq('id', failId)
            .single();

        if (fetchError) throw fetchError;

        const reactions = fail.reactions || {};
        // Décrémenter l'ancienne réaction
        reactions[oldReactionType] = Math.max(0, (reactions[oldReactionType] || 0) - 1);
        // Incrémenter la nouvelle réaction
        reactions[newReactionType] = Math.max(0, (reactions[newReactionType] || 0) + 1);

        const { error: updateError } = await this.supabase
            .from('fails')
            .update({ reactions })
            .eq('id', failId);

        if (updateError) throw updateError;
    }

    async getUserReactionForFail(failId: string): Promise<string | null> {
        const user = this.currentUser.value;
        if (!user) return null;

        const { data, error } = await this.supabase
            .from('reactions')
            .select('reaction_type')
            .match({
                fail_id: failId,
                user_id: user.id
            })
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }

        return data?.reaction_type || null;
    }

    async getUserReactionsForFail(failId: string): Promise<string[]> {
        const user = this.currentUser.value;
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('reactions')
            .select('reaction_type')
            .match({
                fail_id: failId,
                user_id: user.id
            });

        if (error) {
            throw error;
        }

        return data ? data.map(r => r.reaction_type) : [];
    }

    async getUserBadges(userId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('badges')
            .select('*')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async uploadFile(bucket: string, filePath: string, file: File): Promise<string> {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                upsert: true
            });

        if (error) throw error;

        const { data: publicData } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicData.publicUrl;
    }

    async uploadImage(file: File, bucket: string, fileName: string): Promise<string> {
        return this.uploadFile(bucket, fileName, file);
    }

    getImageUrl(bucket: string, filePath: string): string {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
        return data.publicUrl;
    }

    async deleteFile(bucket: string, filePath: string): Promise<void> {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) throw error;
    }

    getSupabaseClient(): SupabaseClient {
        return this.supabase;
    }

    // ===== MÉTHODES BADGE SUPPLÉMENTAIRES =====

    /**
     * Récupère tous les badges disponibles (système complet)
     */
    async getAllBadges(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('badge_definitions')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Récupère TOUS les badges disponibles depuis la base de données
     */
    async getAllAvailableBadges(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('badge_definitions') // Utilise le bon nom de ta table
                .select('*')
                .order('rarity', { ascending: true });

            if (error) throw error;

            // supabaseLog(`📊 Badges récupérés depuis badge_definitions: ${data?.length || 0} badges`);
            // Log réduit pour éviter le spam dans la console
            return data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des badges disponibles:', error);
            // Fallback: retourner les badges du service si la table n'existe pas encore
            return [];
        }
    }

    /**
     * Récupère les statistiques utilisateur pour les badges
     */
    async getUserStats(userId: string): Promise<any> {
        try {
            // Nombre total de fails
            const { count: totalFails } = await this.supabase
                .from('fails')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Nombre total de réactions données par cet utilisateur
            const { count: totalReactionsGiven } = await this.supabase
                .from('reactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Statistiques détaillées par type de réaction données
            const { data: reactionsByType } = await this.supabase
                .from('reactions')
                .select('reaction_type')
                .eq('user_id', userId);

            let courageReactions = 0, supportReactions = 0, empathyReactions = 0, laughReactions = 0;
            if (reactionsByType) {
                courageReactions = reactionsByType.filter(r => r.reaction_type === 'courage').length;
                supportReactions = reactionsByType.filter(r => r.reaction_type === 'support').length;
                empathyReactions = reactionsByType.filter(r => r.reaction_type === 'empathy').length;
                laughReactions = reactionsByType.filter(r => r.reaction_type === 'laugh').length;
            }

            // Catégories utilisées
            const { data: categoryData } = await this.supabase
                .from('fails')
                .select('category')
                .eq('user_id', userId);

            const categoriesUsed = categoryData ?
                new Set(categoryData.map(f => f.category)).size : 0;

            // Maximum de réactions reçues sur un seul fail
            const { data: failsWithReactions } = await this.supabase
                .from('fails')
                .select('reactions')
                .eq('user_id', userId);

            let maxReactionsOnFail = 0;
            if (failsWithReactions) {
                maxReactionsOnFail = Math.max(0,
                    ...failsWithReactions.map(f => {
                        const reactions = f.reactions || {};
                        return (reactions.courage || 0) + (reactions.laugh || 0) +
                            (reactions.empathy || 0) + (reactions.support || 0);
                    })
                );
            }

            return {
                totalFails: totalFails || 0,
                totalReactions: totalReactionsGiven || 0,
                courageReactions,
                supportReactions,
                empathyReactions,
                laughReactions,
                categoriesUsed,
                maxReactionsOnFail,
                activeDays: 1 // Placeholder - nécessiterait un tracking plus sophistiqué
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {
                totalFails: 0,
                totalReactions: 0,
                courageReactions: 0,
                supportReactions: 0,
                empathyReactions: 0,
                laughReactions: 0,
                categoriesUsed: 0,
                maxReactionsOnFail: 0,
                activeDays: 0
            };
        }
    }

    /**
     * Récupère les badges débloqués par un utilisateur
     */
    async getUserBadgesNew(userId: string): Promise<string[]> {
        try {
            const { data, error } = await this.supabase
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', userId);

            if (error) throw error;

            return data?.map(b => b.badge_id) || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des badges utilisateur:', error);
            return [];
        }
    }

    /**
     * Débloque un badge pour un utilisateur
     */
    async unlockBadge(userId: string, badgeId: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from('user_badges')
                .insert({
                    user_id: userId,
                    badge_id: badgeId,
                    unlocked_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Erreur lors du déblocage du badge:', error);
                return false;
            }

            supabaseLog(`Badge ${badgeId} débloqué pour l'utilisateur ${userId}`);
            return true;
        } catch (error) {
            console.error('Erreur dans unlockBadge:', error);
            return false;
        }
    }

    // ✅ NOUVEAU : Vérifier l'unicité des display_name
    async checkDisplayNameAvailable(displayName: string, excludeUserId?: string): Promise<boolean> {
        try {
            let query = this.supabase
                .from('profiles')
                .select('id')
                .eq('display_name', displayName);

            // Exclure l'utilisateur actuel (pour les modifications)
            if (excludeUserId) {
                query = query.neq('id', excludeUserId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erreur vérification unicité display_name:', error);
                return false; // En cas d'erreur, considérer comme non disponible
            }

            return !data || data.length === 0; // Disponible si aucun résultat
        } catch (error) {
            console.error('Erreur dans checkDisplayNameAvailable:', error);
            return false;
        }
    }

    // ✅ NOUVEAU : Générer un nom unique basé sur le nom souhaité
    async generateUniqueDisplayName(baseDisplayName: string): Promise<string> {
        let displayName = baseDisplayName;
        let counter = 1;

        while (!(await this.checkDisplayNameAvailable(displayName))) {
            displayName = `${baseDisplayName}_${counter}`;
            counter++;

            // Éviter les boucles infinies
            if (counter > 99) {
                displayName = `${baseDisplayName}_${Date.now()}`;
                break;
            }
        }

        return displayName;
    }

    // ===== GESTION DES RÔLES UTILISATEUR =====

    /**
     * Récupérer tous les utilisateurs (pour les admins)
     */
    async getAllUsers(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('id, email, display_name, role, created_at, avatar_url')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Changer le rôle d'un utilisateur (admin uniquement)
     */
    async updateUserRole(userId: string, newRole: string): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('profiles')
                .update({
                    role: newRole,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('Erreur lors de la mise à jour du rôle:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du rôle:', error);
            return false;
        }
    }

    /**
     * Bannir un utilisateur (admin uniquement)
     */
    async banUser(userId: string): Promise<boolean> {
        try {
            // Vous pouvez ajouter un champ 'banned' ou utiliser un rôle spécial
            const { error } = await this.supabase
                .from('profiles')
                .update({
                    role: 'banned',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('Erreur lors du bannissement:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors du bannissement:', error);
            return false;
        }
    }

    /**
     * Récupérer tous les utilisateurs avec leurs rôles (admin seulement)
     */
    async getAllUsersWithRoles(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id, email, display_name, role, created_at, updated_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération utilisateurs:', error);
            return [];
        }
    }

    /**
     * Récupérer les utilisateurs par rôle
     */
    async getUsersByRole(role: string): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id, email, display_name, role, created_at')
                .eq('role', role)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération utilisateurs par rôle:', error);
            return [];
        }
    }

    // MÉTHODES POUR L'ADMIN SERVICE
    async getTableCount(tableName: string): Promise<number> {
        try {
            const { count, error } = await this.supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error(`Erreur comptage table ${tableName}:`, error);
            return 0;
        }
    }

    async executeQuery(query: string): Promise<any> {
        try {
            const { data, error } = await this.supabase.rpc('execute_query', { query });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erreur exécution requête:', error);
            throw error;
        }
    }

    async insertSystemLog(level: string, message: string, details?: any, userId?: string, action?: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('system_logs')
                .insert({
                    timestamp: new Date().toISOString(),
                    level,
                    message,
                    details: details ? JSON.stringify(details) : null,
                    user_id: userId,
                    action
                });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur insertion log système:', error);
        }
    }

    async getSystemLogsTable(limit: number = 100): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('system_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération logs système:', error);
            return [];
        }
    }

    async getReactionLogsTable(limit: number = 100): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('reaction_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération logs réactions:', error);
            return [];
        }
    }

    // ===== MÉTHODES ADMIN =====

    // Récupérer tous les profils utilisateurs avec statistiques
    async getAllProfiles(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select(`
                    *,
                    fails:fails(count),
                    reactions_given:reactions!reactions_user_id_fkey(count)
                `);

            if (error) throw error;

            return data?.map(profile => ({
                ...profile,
                total_fails: profile.fails?.[0]?.count || 0,
                total_reactions: profile.reactions_given?.[0]?.count || 0
            })) || [];
        } catch (error) {
            console.error('Erreur récupération des profils:', error);
            return [];
        }
    }

    // Récupérer les statistiques globales
    async getDashboardStats(): Promise<any> {
        try {
            // Récupérer les statistiques directement depuis les tables
            const [usersCount, failsCount, reactionsCount] = await Promise.all([
                this.getTableCount('profiles'),
                this.getTableCount('fails'),
                this.getTableCount('reactions')
            ]);

            // Calculer l'activité d'aujourd'hui (fails créés aujourd'hui)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayActivity } = await this.supabase
                .from('fails')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // Retourner les stats avec les noms de propriétés attendus par le template
            return {
                totalUsers: usersCount,
                totalFails: failsCount,
                totalReactions: reactionsCount,
                todayActivity: todayActivity || 0,
                systemStatus: 'healthy'
            };
        } catch (error) {
            console.error('Erreur récupération statistiques:', error);
            return {
                totalUsers: 0,
                totalFails: 0,
                totalReactions: 0,
                todayActivity: 0,
                systemStatus: 'error'
            };
        }
    }

    // Analyser l'intégrité de la base de données
    async analyzeDatabaseIntegrity(): Promise<any> {
        try {
            console.log('🔍 Début de l\'analyse d\'intégrité de la base de données...');

            // 1. Statistiques générales
            const [profilesCount, failsCount, reactionsCount, systemLogsCount] = await Promise.all([
                this.getTableCount('profiles'),
                this.getTableCount('fails'),
                this.getTableCount('reactions'),
                this.getTableCount('system_logs')
            ]);

            // 2. Analyser les réactions orphelines (réactions sans fail correspondant)
            const { data: orphanedReactions, error: orphanError } = await this.supabase
                .from('reactions')
                .select('id, fail_id, user_id, reaction_type')
                .not('fail_id', 'in', `(SELECT id FROM fails)`);

            // 3. Analyser les profils sans email
            const { data: profilesWithoutEmail, error: emailError } = await this.supabase
                .from('profiles')
                .select('id, display_name, email')
                .is('email', null);

            // 4. Fails avec des compteurs de réactions incohérents
            const { data: failsData, error: failsError } = await this.supabase
                .from('fails')
                .select('id, title, reactions');

            let inconsistentReactionCounts = 0;
            const problematicFails: any[] = [];

            if (failsData && !failsError) {
                for (const fail of failsData) {
                    const { count: actualReactionsCount } = await this.supabase
                        .from('reactions')
                        .select('*', { count: 'exact', head: true })
                        .eq('fail_id', fail.id);

                    const reactions = fail.reactions || {};
                    const storedTotal = (reactions.courage || 0) + (reactions.laugh || 0) +
                        (reactions.empathy || 0) + (reactions.support || 0);

                    if (storedTotal !== (actualReactionsCount || 0)) {
                        inconsistentReactionCounts++;
                        problematicFails.push({
                            id: fail.id,
                            title: fail.title.substring(0, 50) + '...',
                            storedCount: storedTotal,
                            actualCount: actualReactionsCount || 0,
                            difference: storedTotal - (actualReactionsCount || 0)
                        });
                    }
                }
            }

            // 5. Utilisateurs avec des statistiques manquantes
            const { data: usersWithoutStats, error: statsError } = await this.supabase
                .from('profiles')
                .select('id, display_name, stats')
                .is('stats', null);

            // 6. Activité récente (dernières 24h)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const [recentFails, recentReactions, recentUsers] = await Promise.all([
                this.supabase
                    .from('fails')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', yesterday.toISOString()),
                this.supabase
                    .from('reactions')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', yesterday.toISOString()),
                this.supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', yesterday.toISOString())
            ]);

            const analysisResult = {
                timestamp: new Date().toISOString(),
                totalTables: 4,
                globalStats: {
                    totalProfiles: profilesCount,
                    totalFails: failsCount,
                    totalReactions: reactionsCount,
                    totalSystemLogs: systemLogsCount
                },
                integrityIssues: {
                    orphanedReactions: orphanedReactions?.length || 0,
                    orphanedReactionsList: orphanedReactions || [],
                    profilesWithoutEmail: profilesWithoutEmail?.length || 0,
                    inconsistentReactionCounts,
                    problematicFails: problematicFails.slice(0, 10), // Limiter à 10 pour l'affichage
                    usersWithoutStats: usersWithoutStats?.length || 0
                },
                recentActivity: {
                    newFailsLast24h: recentFails.count || 0,
                    newReactionsLast24h: recentReactions.count || 0,
                    newUsersLast24h: recentUsers.count || 0
                },
                recommendations: [] as string[],
                totalIssues: (orphanedReactions?.length || 0) +
                    (profilesWithoutEmail?.length || 0) +
                    inconsistentReactionCounts +
                    (usersWithoutStats?.length || 0)
            };

            // Générer des recommandations
            if (analysisResult.integrityIssues.orphanedReactions > 0) {
                analysisResult.recommendations.push(`Supprimer ${analysisResult.integrityIssues.orphanedReactions} réactions orphelines`);
            }
            if (analysisResult.integrityIssues.profilesWithoutEmail > 0) {
                analysisResult.recommendations.push(`Corriger ${analysisResult.integrityIssues.profilesWithoutEmail} profils sans email`);
            }
            if (inconsistentReactionCounts > 0) {
                analysisResult.recommendations.push(`Recalculer les compteurs de ${inconsistentReactionCounts} fails`);
            }
            if (analysisResult.integrityIssues.usersWithoutStats > 0) {
                analysisResult.recommendations.push(`Initialiser les statistiques pour ${analysisResult.integrityIssues.usersWithoutStats} utilisateurs`);
            }

            console.log('✅ Analyse d\'intégrité terminée:', analysisResult);
            return analysisResult;

        } catch (error: any) {
            console.error('❌ Erreur lors de l\'analyse d\'intégrité:', error);
            return {
                timestamp: new Date().toISOString(),
                error: true,
                errorMessage: error?.message || 'Erreur inconnue',
                totalIssues: 0,
                globalStats: {
                    totalProfiles: 0,
                    totalFails: 0,
                    totalReactions: 0,
                    totalSystemLogs: 0
                },
                integrityIssues: {
                    orphanedReactions: 0,
                    profilesWithoutEmail: 0,
                    inconsistentReactionCounts: 0,
                    usersWithoutStats: 0
                },
                recommendations: ['Erreur lors de l\'analyse - Vérifier la connexion à la base de données']
            };
        }
    }

    // Corriger les compteurs de réactions invalides
    async fixInvalidReactionCounts(failId: string): Promise<void> {
        try {
            const { error } = await this.supabase.rpc('fix_reaction_counts', { fail_id: failId });
            if (error) throw error;
        } catch (error) {
            console.error('Erreur correction compteurs réactions:', error);
            // Fallback vers la méthode manuelle
            await this.fixFailReactionCounts(failId);
        }
    }

    // ===== NOUVELLES MÉTHODES POUR L'ANALYSE DÉTAILLÉE =====

    // Analyser un fail spécifique avec tous ses détails
    async analyzeSpecificFail(failId: string): Promise<any> {
        try {
            console.log(`🔍 Analyse détaillée du fail: ${failId}`);

            // 1. Récupérer les informations du fail SANS jointure
            const { data: failData, error: failError } = await this.supabase
                .from('fails')
                .select(`
                    id, 
                    title, 
                    description, 
                    reactions, 
                    created_at,
                    user_id
                `)
                .eq('id', failId)
                .single();

            if (failError) {
                console.error('Erreur récupération fail:', failError);
                throw failError;
            }

            // 2. Récupérer les informations de l'auteur séparément
            let authorInfo = null;
            if (failData.user_id) {
                try {
                    const { data: profileData, error: profileError } = await this.supabase
                        .from('profiles')
                        .select('id, display_name, email')
                        .eq('id', failData.user_id)
                        .single();

                    if (!profileError) {
                        authorInfo = profileData;
                    }
                } catch (profileErr) {
                    console.warn('Impossible de récupérer les infos de l\'auteur:', profileErr);
                }
            }

            // 3. Récupérer toutes les réactions avec détails des utilisateurs qui ont réagi
            const { data: realReactions, error: reactionsError } = await this.supabase
                .from('reactions')
                .select('reaction_type, user_id, created_at')
                .eq('fail_id', failId);

            if (reactionsError) {
                console.error('Erreur récupération réactions:', reactionsError);
                throw reactionsError;
            }

            // 4. Récupérer les profils de tous les utilisateurs qui ont réagi
            const userIds = [...new Set(realReactions?.map(r => r.user_id) || [])];
            let reactionUsers: any[] = [];
            if (userIds.length > 0) {
                try {
                    const { data: usersData, error: usersError } = await this.supabase
                        .from('profiles')
                        .select('id, display_name')
                        .in('id', userIds);

                    if (!usersError) {
                        reactionUsers = usersData || [];
                    }
                } catch (usersErr) {
                    console.warn('Impossible de récupérer les infos des utilisateurs qui ont réagi:', usersErr);
                }
            }

            // 5. Calculer les statistiques détaillées
            const storedReactions = failData.reactions || {};
            const storedTotal = (storedReactions.courage || 0) +
                (storedReactions.support || 0) +
                (storedReactions.empathy || 0) +
                (storedReactions.laugh || 0);

            const reactionBreakdown = {
                courage: realReactions?.filter(r => r.reaction_type === 'courage').length || 0,
                support: realReactions?.filter(r => r.reaction_type === 'support').length || 0,
                empathy: realReactions?.filter(r => r.reaction_type === 'empathy').length || 0,
                laugh: realReactions?.filter(r => r.reaction_type === 'laugh').length || 0
            };

            const actualTotal = reactionBreakdown.courage + reactionBreakdown.support +
                reactionBreakdown.empathy + reactionBreakdown.laugh;

            // 6. Détails des réactions avec utilisateurs
            const reactionDetails = {
                courage: realReactions?.filter(r => r.reaction_type === 'courage').map(r => ({
                    user: reactionUsers.find(u => u.id === r.user_id)?.display_name || 'Utilisateur inconnu',
                    date: r.created_at
                })) || [],
                support: realReactions?.filter(r => r.reaction_type === 'support').map(r => ({
                    user: reactionUsers.find(u => u.id === r.user_id)?.display_name || 'Utilisateur inconnu',
                    date: r.created_at
                })) || [],
                empathy: realReactions?.filter(r => r.reaction_type === 'empathy').map(r => ({
                    user: reactionUsers.find(u => u.id === r.user_id)?.display_name || 'Utilisateur inconnu',
                    date: r.created_at
                })) || [],
                laugh: realReactions?.filter(r => r.reaction_type === 'laugh').map(r => ({
                    user: reactionUsers.find(u => u.id === r.user_id)?.display_name || 'Utilisateur inconnu',
                    date: r.created_at
                })) || []
            };

            // 7. Calculer les différences par type
            const differencesByType = {
                courage: (storedReactions.courage || 0) - reactionBreakdown.courage,
                support: (storedReactions.support || 0) - reactionBreakdown.support,
                empathy: (storedReactions.empathy || 0) - reactionBreakdown.empathy,
                laugh: (storedReactions.laugh || 0) - reactionBreakdown.laugh
            };

            const analysis = {
                id: failData.id,
                title: failData.title,
                description: failData.description,
                created_at: failData.created_at,
                author: authorInfo,
                storedReactions: storedTotal,
                actualReactions: actualTotal,
                difference: storedTotal - actualTotal,
                storedBreakdown: {
                    courage: storedReactions.courage || 0,
                    support: storedReactions.support || 0,
                    empathy: storedReactions.empathy || 0,
                    laugh: storedReactions.laugh || 0
                },
                reactionBreakdown,
                differencesByType,
                reactionDetails,
                isProblematic: storedTotal !== actualTotal,
                correction: {
                    shouldReset: actualTotal === 0 && storedTotal > 0,
                    shouldUpdate: actualTotal > 0 && storedTotal !== actualTotal
                }
            };

            console.log('✅ Analyse du fail terminée:', analysis);
            return analysis;
        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse du fail:', error);
            throw error;
        }
    }

    // Corriger les compteurs d'un fail spécifique
    async fixFailReactionCounts(failId: string): Promise<any> {
        try {
            console.log(`🔧 Correction des compteurs pour le fail: ${failId}`);

            // 1. Récupérer les réactions réelles
            const { data: realReactions, error: reactionsError } = await this.supabase
                .from('reactions')
                .select('reaction_type')
                .eq('fail_id', failId);

            if (reactionsError) {
                console.error('Erreur récupération réactions pour correction:', reactionsError);
                throw reactionsError;
            }

            // 2. Calculer les compteurs corrects
            const correctCounts = {
                courage: realReactions?.filter(r => r.reaction_type === 'courage').length || 0,
                support: realReactions?.filter(r => r.reaction_type === 'support').length || 0,
                empathy: realReactions?.filter(r => r.reaction_type === 'empathy').length || 0,
                laugh: realReactions?.filter(r => r.reaction_type === 'laugh').length || 0
            };

            // 3. Mettre à jour le fail avec les compteurs corrects
            const { data: updatedFail, error: updateError } = await this.supabase
                .from('fails')
                .update({ reactions: correctCounts })
                .eq('id', failId)
                .select()
                .single();

            if (updateError) {
                console.error('Erreur mise à jour compteurs:', updateError);
                throw updateError;
            }

            const result = {
                failId,
                oldCounts: updatedFail.reactions,
                newCounts: correctCounts,
                totalFixed: correctCounts.courage + correctCounts.support +
                    correctCounts.empathy + correctCounts.laugh
            };

            console.log('✅ Compteurs corrigés:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur lors de la correction des compteurs:', error);
            throw error;
        }
    }

    // Supprimer une réaction orpheline
    async deleteOrphanedReaction(reactionId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('reactions')
                .delete()
                .eq('id', reactionId);

            if (error) throw error;
        } catch (error) {
            console.error('Erreur suppression réaction orpheline:', error);
            throw error;
        }
    }

    // Récupérer les logs système
    async getSystemLogs(limit: number = 50): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('system_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération logs système:', error);
            return [];
        }
    }

    // Récupérer les activités utilisateurs
    async getUserActivities(userId?: string, limit: number = 50): Promise<any[]> {
        try {
            let query = this.supabase
                .from('user_activities')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération activités:', error);
            return [];
        }
    }

    // Récupérer la configuration des points
    async getPointsConfiguration(): Promise<any> {
        try {
            const { data, error } = await this.supabase
                .from('app_config')
                .select('value')
                .eq('key', 'points_config')
                .single();

            if (error) throw error;
            return data?.value || {
                createFailPoints: 10,
                courageReactionPoints: 2,
                laughReactionPoints: 1,
                empathyReactionPoints: 2,
                supportReactionPoints: 2,
                dailyBonusPoints: 5
            };
        } catch (error) {
            console.error('Erreur récupération config points:', error);
            return {
                createFailPoints: 10,
                courageReactionPoints: 2,
                laughReactionPoints: 1,
                empathyReactionPoints: 2,
                supportReactionPoints: 2,
                dailyBonusPoints: 5
            };
        }
    }

    // Sauvegarder la configuration des points
    async updatePointsConfiguration(config: any): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('app_config')
                .upsert({
                    key: 'points_config',
                    value: config,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur sauvegarde config points:', error);
            throw error;
        }
    }

    // Restaurer les configurations essentielles après un reset
    async restoreEssentialConfigurations(): Promise<void> {
        try {
            const configurations = [
                // Configuration des points (valeurs par défaut)
                {
                    key: 'points_config',
                    value: {
                        createFailPoints: 10,
                        courageReactionPoints: 2,
                        laughReactionPoints: 1,
                        empathyReactionPoints: 2,
                        supportReactionPoints: 2,
                        dailyBonusPoints: 5
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                // Remise à zéro de tous les compteurs et stats après un reset complet
                {
                    key: 'stats_global',
                    value: {
                        totalFails: 0,
                        totalUsers: 0,
                        totalReactions: 0,
                        totalComments: 0,
                        totalBadgesAwarded: 0,
                        lastResetDate: new Date().toISOString()
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                // Configuration de l'application (réglages généraux remis par défaut)
                {
                    key: 'app_settings',
                    value: {
                        maintenanceMode: false,
                        allowRegistrations: true,
                        maxFailsPerDay: 10,
                        minDescriptionLength: 10,
                        maxDescriptionLength: 500,
                        lastMaintenanceDate: new Date().toISOString()
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            for (const config of configurations) {
                // D'abord essayer un UPDATE, sinon faire un INSERT
                let { error } = await this.supabase
                    .from('app_config')
                    .update({
                        value: config.value,
                        updated_at: config.updated_at
                    })
                    .eq('key', config.key);

                // Si l'UPDATE n'a affecté aucune ligne (la clé n'existait pas), faire un INSERT
                if (!error) {
                    const { count } = await this.supabase
                        .from('app_config')
                        .select('*', { count: 'exact' })
                        .eq('key', config.key);

                    if (count === 0) {
                        ({ error } = await this.supabase
                            .from('app_config')
                            .insert(config));
                    }
                }

                if (error) {
                    console.error(`Erreur restauration config ${config.key}:`, error);
                    throw error;
                }
            }

            console.log('✅ Configurations essentielles restaurées avec remise à zéro des stats');
        } catch (error) {
            console.error('Erreur lors de la restauration des configurations:', error);
            throw error;
        }
    }

    // ===== SYSTÈME DE LOGS AVANCÉ =====

    // Récupérer les logs par type avec les vraies données
    async getActivityLogsByType(logType: string, periodHours: number | null, limit: number): Promise<any[]> {
        try {
            const { data, error } = await this.supabase.rpc('get_activity_logs_by_type', {
                log_type: logType,
                period_hours: periodHours,
                max_limit: limit
            });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération logs par type:', error);
            return [];
        }
    }

    // Enregistrer une connexion utilisateur
    async logUserLogin(userId: string, ip?: string, userAgent?: string): Promise<void> {
        try {
            const { error } = await this.supabase.rpc('log_user_login', {
                p_user_id: userId,
                p_ip: ip,
                p_user_agent: userAgent
            });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur enregistrement connexion:', error);
        }
    }

    // Récupérer les logs de gestion utilisateur
    async getUserManagementLogs(adminId?: string, targetUserId?: string, limit: number = 50): Promise<any[]> {
        try {
            let query = this.supabase
                .from('user_management_logs')
                .select(`
                    *,
                    admin:admin_id(display_name, username, email),
                    target:target_user_id(display_name, username, email)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (adminId) {
                query = query.eq('admin_id', adminId);
            }
            if (targetUserId) {
                query = query.eq('target_user_id', targetUserId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération logs gestion utilisateur:', error);
            return [];
        }
    }

    // Enregistrer une action de gestion utilisateur
    async logUserManagementAction(
        adminId: string,
        targetUserId: string,
        actionType: string,
        targetObjectId?: string,
        oldValues?: any,
        newValues?: any,
        reason?: string
    ): Promise<void> {
        try {
            const { error } = await this.supabase.rpc('log_user_management_action', {
                p_admin_id: adminId,
                p_target_user_id: targetUserId,
                p_action_type: actionType,
                p_target_object_id: targetObjectId,
                p_old_values: oldValues,
                p_new_values: newValues,
                p_reason: reason
            });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur enregistrement action gestion utilisateur:', error);
            throw error;
        }
    }

    // ===== ACTIONS DE GESTION UTILISATEUR =====

    // Supprimer une réaction d'un utilisateur
    async deleteUserReaction(adminId: string, reactionId: string, reason?: string): Promise<void> {
        try {
            // Récupérer les infos de la réaction avant suppression
            const { data: reaction } = await this.supabase
                .from('reactions')
                .select('*, user_id, fail_id')
                .eq('id', reactionId)
                .single();

            if (reaction) {
                // Supprimer la réaction
                const { error } = await this.supabase
                    .from('reactions')
                    .delete()
                    .eq('id', reactionId);

                if (error) throw error;

                // Logger l'action
                await this.logUserManagementAction(
                    adminId,
                    reaction.user_id,
                    'delete_reaction',
                    reactionId,
                    reaction,
                    null,
                    reason
                );
            }
        } catch (error) {
            console.error('Erreur suppression réaction:', error);
            throw error;
        }
    }

    // Supprimer un fail d'un utilisateur
    async deleteUserFail(adminId: string, failId: string, reason?: string): Promise<void> {
        try {
            // Récupérer les infos du fail avant suppression
            const { data: fail } = await this.supabase
                .from('fails')
                .select('*, user_id')
                .eq('id', failId)
                .single();

            if (fail) {
                // Supprimer d'abord les réactions liées
                await this.supabase
                    .from('reactions')
                    .delete()
                    .eq('fail_id', failId);

                // Supprimer le fail
                const { error } = await this.supabase
                    .from('fails')
                    .delete()
                    .eq('id', failId);

                if (error) throw error;

                // Logger l'action
                await this.logUserManagementAction(
                    adminId,
                    fail.user_id,
                    'delete_fail',
                    failId,
                    fail,
                    null,
                    reason
                );
            }
        } catch (error) {
            console.error('Erreur suppression fail:', error);
            throw error;
        }
    }

    // Modifier le compte d'un utilisateur
    async updateUserAccount(
        adminId: string,
        userId: string,
        updates: any,
        reason?: string
    ): Promise<void> {
        try {
            // Récupérer les anciennes valeurs
            const { data: oldProfile } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // Appliquer les modifications
            const { error } = await this.supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;

            // Logger l'action
            await this.logUserManagementAction(
                adminId,
                userId,
                'modify_account',
                userId,
                oldProfile,
                updates,
                reason
            );
        } catch (error) {
            console.error('Erreur modification compte utilisateur:', error);
            throw error;
        }
    }

    // ====== DATABASE TRUNCATE METHODS ======

    async truncateTable(tableName: string, isAuthTable: boolean = false): Promise<{ success: boolean, message: string }> {
        try {
            if (isAuthTable) {
                // Pour les tables auth, nous devons utiliser une approche différente
                // car nous n'avons pas accès direct aux tables auth en tant que client
                return {
                    success: false,
                    message: `Les tables auth ne peuvent pas être vidées directement depuis l'application pour des raisons de sécurité. Utilisez l'interface d'administration Supabase.`
                };
            }

            // Tables autorisées pour le reset administrateur (SANS app_config)
            const validTables = [
                'fails', 'reactions', 'profiles', 'comments', 'badges', 'user_badges',
                'system_logs', 'activity_logs', 'reaction_logs', 'user_activities',
                'user_management_logs', 'user_preferences'
            ];

            if (!validTables.includes(tableName)) {
                return {
                    success: false,
                    message: `Table non autorisée: ${tableName}`
                };
            }

            console.log(`🔥 Tentative de vidage de ${tableName}...`);

            // Compter les enregistrements avant suppression avec fonction RPC admin
            const { data: beforeCount, error: countError } = await this.supabase
                .rpc('admin_count_table', { table_name: tableName });

            if (countError) {
                console.error(`❌ Erreur lors du comptage RPC de ${tableName}:`, countError);
                // Fallback sur comptage standard
                const { count: fallbackCount } = await this.supabase.from(tableName)
                    .select('*', { count: 'exact', head: true });
                console.log(`📊 ${tableName} contient ${fallbackCount || 0} enregistrements avant suppression`);
            } else {
                console.log(`📊 ${tableName} contient ${beforeCount || 0} enregistrements avant suppression`);

                // Si la table est déjà vide, pas besoin de la vider
                if (beforeCount === 0) {
                    console.log(`✅ Table ${tableName} déjà vide`);
                    console.log(`Action de vidage effectuée sur la table: ${tableName}`);
                    return {
                        success: true,
                        message: `Table ${tableName} était déjà vide`
                    };
                }
            }

            let deleteSuccess = false;
            let deleteError = null;

            // Stratégie 1: Utiliser la fonction TRUNCATE RPC (plus efficace et bypass RLS)
            console.log(`🔄 Stratégie 1: RPC TRUNCATE avec bypass RLS...`);
            const { error: truncateError } = await this.supabase
                .rpc('admin_truncate_table', { table_name: tableName });

            if (!truncateError) {
                // Vérifier le résultat avec fonction RPC
                const { data: afterTruncateCount } = await this.supabase
                    .rpc('admin_count_table', { table_name: tableName });

                if (afterTruncateCount === 0) {
                    console.log(`✅ Stratégie RPC TRUNCATE réussie pour ${tableName}`);
                    deleteSuccess = true;
                } else {
                    console.log(`❌ Stratégie RPC TRUNCATE inefficace pour ${tableName} (${afterTruncateCount} restants)`);
                }
            } else {
                console.log(`❌ Stratégie RPC TRUNCATE échouée pour ${tableName}:`, truncateError);
                deleteError = truncateError;
            }

            // Stratégie 2: Utiliser la fonction DELETE RPC (si TRUNCATE échoue)
            if (!deleteSuccess) {
                console.log(`🔄 Stratégie 2: RPC DELETE avec bypass RLS...`);
                const { error: deleteRpcError } = await this.supabase
                    .rpc('admin_delete_all', { table_name: tableName });

                if (!deleteRpcError) {
                    const { data: afterDeleteCount } = await this.supabase
                        .rpc('admin_count_table', { table_name: tableName });

                    if (afterDeleteCount === 0) {
                        console.log(`✅ Stratégie RPC DELETE réussie pour ${tableName}`);
                        deleteSuccess = true;
                    } else {
                        console.log(`❌ Stratégie RPC DELETE inefficace pour ${tableName} (${afterDeleteCount} restants)`);
                    }
                } else {
                    console.log(`❌ Stratégie RPC DELETE échouée pour ${tableName}:`, deleteRpcError);
                    deleteError = deleteRpcError;
                }
            }

            // Stratégie 3: DELETE standard avec condition created_at (fallback classique)
            if (!deleteSuccess) {
                console.log(`🔄 Stratégie 3: DELETE standard avec created_at...`);
                const query = this.supabase.from(tableName);
                const { error: error3 } = await query
                    .delete()
                    .gte('created_at', '2000-01-01T00:00:00.000Z');

                if (!error3) {
                    const { count: afterCount3 } = await query
                        .select('*', { count: 'exact', head: true });
                    if ((afterCount3 || 0) === 0) {
                        console.log(`✅ Stratégie DELETE standard réussie pour ${tableName}`);
                        deleteSuccess = true;
                    } else {
                        console.log(`❌ Stratégie DELETE standard inefficace pour ${tableName} (${afterCount3} restants)`);
                    }
                } else {
                    console.log(`❌ Stratégie DELETE standard échouée pour ${tableName}:`, error3);
                    deleteError = error3;
                }
            }

            if (!deleteSuccess) {
                console.error(`❌ TOUTES les stratégies ont échoué pour ${tableName}`);
                console.error(`💡 Suggestion: Exécuter le fichier sql/admin_reset_functions.sql dans Supabase Dashboard`);
                return {
                    success: false,
                    message: `Impossible de vider ${tableName}: ${deleteError?.message || 'Permissions RLS insuffisantes. Fonctions RPC admin requises.'}`
                };
            }

            // Vérifier le résultat final
            const { data: finalCount } = await this.supabase
                .rpc('admin_count_table', { table_name: tableName });

            if (finalCount !== null) {
                console.log(`📊 ${tableName} contient maintenant ${finalCount} enregistrements`);
            } else {
                const { count: fallbackFinalCount } = await this.supabase.from(tableName)
                    .select('*', { count: 'exact', head: true });
                console.log(`📊 ${tableName} contient maintenant ${fallbackFinalCount || 0} enregistrements`);
            }

            // Logger l'action de vidage
            console.log(`Action de vidage effectuée sur la table: ${tableName}`);

            return {
                success: true,
                message: `Table ${tableName} vidée avec succès`
            };

        } catch (error) {
            console.error(`Erreur générale lors du vidage de ${tableName}:`, error);
            return {
                success: false,
                message: `Erreur inattendue: ${error}`
            };
        }
    }

    /**
     * 👥 Supprime tous les utilisateurs d'authentification
     */
    async deleteAllAuthUsers(): Promise<{ success: boolean, message: string }> {
        try {
            console.log('🧹 Tentative de suppression de tous les utilisateurs...');

            // Compter les utilisateurs avant suppression
            const { data: beforeCount, error: countError } = await this.supabase
                .rpc('admin_count_auth_users');

            if (countError) {
                console.error('❌ Erreur lors du comptage des utilisateurs:', countError);
                return {
                    success: false,
                    message: `Erreur lors du comptage des utilisateurs: ${countError.message}`
                };
            }

            console.log(`📊 ${beforeCount} utilisateurs trouvés dans auth.users`);

            if (beforeCount === 0) {
                console.log('✅ Aucun utilisateur à supprimer');
                return {
                    success: true,
                    message: 'Aucun utilisateur à supprimer'
                };
            }

            // Supprimer tous les utilisateurs avec fonction RPC
            const { data: deletedCount, error: deleteError } = await this.supabase
                .rpc('admin_delete_all_users');

            if (deleteError) {
                console.error('❌ Erreur lors de la suppression des utilisateurs:', deleteError);
                return {
                    success: false,
                    message: `Erreur lors de la suppression: ${deleteError.message}`
                };
            }

            // Vérifier le résultat
            const { data: afterCount } = await this.supabase
                .rpc('admin_count_auth_users');

            console.log(`✅ ${deletedCount} utilisateurs supprimés`);
            console.log(`📊 ${afterCount || 0} utilisateurs restants dans auth.users`);

            return {
                success: true,
                message: `${deletedCount} utilisateurs supprimés avec succès`
            };

        } catch (error) {
            console.error('❌ Erreur générale lors de la suppression des utilisateurs:', error);
            return {
                success: false,
                message: `Erreur inattendue: ${error}`
            };
        }
    }

    /**
     * Insère les configurations par défaut nécessaires au fonctionnement de l'application
     */
    private async insertDefaultConfigurations(): Promise<void> {
        try {
            // Configuration des points par défaut
            const pointsConfig = {
                key: 'points_config',
                value: {
                    daily_fail: 1,
                    weekly_bonus: 5,
                    monthly_bonus: 20,
                    comment: 1,
                    reaction: 1,
                    streak_multiplier: 1.5,
                    achievements: {
                        first_fail: 10,
                        first_week: 25,
                        first_month: 50
                    }
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('app_config')
                .insert([pointsConfig]);

            if (error) {
                console.error('Erreur insertion configuration par défaut:', error);
            } else {
                console.log('✅ Configuration par défaut des points réinsérée');
            }
        } catch (error) {
            console.error('Erreur lors de l\'insertion des configurations par défaut:', error);
        }
    }

    // ====== MÉTHODES DE GESTION DES BADGE DEFINITIONS ======

    async getAllBadgeDefinitions(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('badge_definitions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erreur lors de la récupération des badges:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Erreur getAllBadgeDefinitions:', error);
            throw error;
        }
    }

    async createBadgeDefinition(badgeData: any): Promise<any> {
        try {
            const { data, error } = await this.supabase
                .from('badge_definitions')
                .insert([{
                    name: badgeData.name,
                    description: badgeData.description,
                    icon: badgeData.icon,
                    category: badgeData.category,
                    rarity: badgeData.rarity,
                    requirement_type: badgeData.requirement_type,
                    requirement_value: badgeData.requirement_value
                }])
                .select()
                .single();

            if (error) {
                console.error('Erreur lors de la création du badge:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Erreur createBadgeDefinition:', error);
            throw error;
        }
    }

    async deleteBadgeDefinition(badgeId: string): Promise<void> {
        try {
            // D'abord supprimer les références dans user_badges
            const { error: userBadgesError } = await this.supabase
                .from('user_badges')
                .delete()
                .eq('badge_definition_id', badgeId);

            if (userBadgesError) {
                console.warn('Erreur lors de la suppression des user_badges:', userBadgesError);
                // Continue quand même, au cas où il n'y aurait pas de références
            }

            // Supprimer les références dans badges (historique)
            const { error: badgesError } = await this.supabase
                .from('badges')
                .delete()
                .eq('badge_definition_id', badgeId);

            if (badgesError) {
                console.warn('Erreur lors de la suppression des badges historiques:', badgesError);
            }

            // Finalement supprimer la définition du badge
            const { error } = await this.supabase
                .from('badge_definitions')
                .delete()
                .eq('id', badgeId);

            if (error) {
                console.error('Erreur lors de la suppression de la définition du badge:', error);
                throw error;
            }
        } catch (error) {
            console.error('Erreur deleteBadgeDefinition:', error);
            throw error;
        }
    }
}


