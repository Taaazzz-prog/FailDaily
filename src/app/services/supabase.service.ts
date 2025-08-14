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

            this.authChangeTimeout = setTimeout(() => {
                this.lastAuthUserId = currentUserId;

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    this.currentUser.next(session?.user || null);
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
        // Ajouter un timestamp pour éviter le cache
        const timestamp = Date.now();

        const { data, error } = await this.supabase
            .from('fails')
            .select('*')
            .eq('id', failId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }

        supabaseLog(`📊 getFailById - Fail récupéré (${timestamp}):`, data?.reactions);
        return data || null;
    }

    async getUserFails(userId: string): Promise<any[]> {
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
}


