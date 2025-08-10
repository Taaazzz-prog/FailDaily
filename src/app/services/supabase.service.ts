import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { safeAuthOperation } from '../utils/mobile-fixes';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    public user$: Observable<User | null> = this.currentUser.asObservable();
    public currentUser$: Observable<User | null> = this.currentUser.asObservable();
    public client: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabase.url,
            environment.supabase.key,
            {
                auth: {
                    persistSession: true, // ✅ CORRECTION: Activer la persistance de session
                    detectSessionInUrl: false,
                    autoRefreshToken: true, // ✅ CORRECTION: Activer le refresh automatique des tokens
                    storage: window.localStorage, // ✅ AJOUT: Explicitement utiliser localStorage
                    storageKey: 'faildaily-supabase-auth', // ✅ AJOUT: Clé personnalisée pour éviter les conflits
                }
            }
        );
        this.client = this.supabase;

        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 SupabaseService: Auth state change:', event, session?.user?.id || 'no user');
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                this.currentUser.next(session?.user || null);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser.next(null);
            }
        });

        // Initialiser l'utilisateur actuel sans nettoyer les sessions
        console.log('🔐 SupabaseService: Initializing current user state...');
        this.getCurrentUser().then(user => {
            console.log('🔐 SupabaseService: Initial user loaded:', user?.id || 'no user');
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
                console.log('🔐 SupabaseService: Session expirée ou manquante (normal):', error.message);
                return null;
            }
            this.currentUser.next(user);
            return user;
        });
    }

    async signUp(email: string, password: string, username: string): Promise<any> {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    display_name: username
                }
            }
        });

        if (error) throw error;
        return data;
    }

    async completeRegistration(userId: string, legalConsent: any, ageVerification: any): Promise<any> {
        const { data, error } = await this.supabase
            .rpc('complete_user_registration', {
                user_id: userId,
                legal_consent_data: legalConsent,
                age_verification_data: ageVerification
            });

        if (error) throw error;
        return data;
    }

    async checkRegistrationStatus(userId: string): Promise<any> {
        const { data, error } = await this.supabase
            .rpc('check_user_registration_status', {
                user_id: userId
            });

        if (error) throw error;
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
            console.log('🔐 SupabaseService: Clearing all sessions and local storage');

            // Déconnecter de Supabase
            await this.supabase.auth.signOut();

            // Vider le localStorage de Supabase
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.includes('supabase') || key.includes('sb-')) {
                        localStorage.removeItem(key);
                        console.log('🔐 SupabaseService: Removed localStorage key:', key);
                    }
                });
            }

            // Réinitialiser l'utilisateur courant
            this.currentUser.next(null);

            console.log('🔐 SupabaseService: All sessions cleared');
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
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter les erreurs

            if (error) {
                console.warn('Erreur récupération profil:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.warn('Erreur lors de la récupération du profil:', error);
            return null;
        }
    }

    async createProfile(user: any): Promise<any> {
        try {
            console.log('🔐 SupabaseService: Creating profile for user:', user.id);

            const profileData = {
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Utilisateur',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                avatar_url: 'assets/anonymous-avatar.svg',
                email_confirmed: true,
                registration_completed: false,
                legal_consent: null,
                age_verification: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('profiles')
                .insert(profileData)
                .select()
                .single();

            if (error) {
                console.error('🔐 SupabaseService: Error creating profile:', error);
                throw error;
            }

            console.log('🔐 SupabaseService: Profile created successfully:', data);
            return data;
        } catch (error) {
            console.error('🔐 SupabaseService: Error in createProfile:', error);
            throw error;
        }
    }

    async updateProfile(userId: string, profile: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('profiles')
            .upsert(profile) // UTILISER UPSERT au lieu d'UPDATE !
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
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

            console.log('Données à insérer:', failData);

            const { data, error } = await this.supabase
                .from('fails')
                .insert(failData)
                .select()
                .single();

            if (error) {
                console.error('Erreur Supabase lors de la création du fail:', error);
                throw new Error(`Erreur lors de la création du fail: ${error.message}`);
            }

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
        const { data, error } = await this.supabase
            .from('fails')
            .select('*')
            .eq('id', failId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }

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
    }

    async addReaction(failId: string, reactionType: string): Promise<void> {
        const user = this.currentUser.value;
        if (!user) throw new Error('Utilisateur non authentifié');

        try {
            // Vérifier si l'utilisateur a déjà cette réaction spécifique
            const { data: existingReaction, error: checkError } = await this.supabase
                .from('reactions')
                .select('id')
                .match({
                    fail_id: failId,
                    user_id: user.id,
                    reaction_type: reactionType
                })
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                throw checkError;
            }

            // Si l'utilisateur a déjà cette réaction, on ne fait rien
            if (existingReaction) {
                console.log(`L'utilisateur a déjà la réaction ${reactionType} sur ce fail`);
                return;
            }

            // Sinon, ajouter la nouvelle réaction
            const { error } = await this.supabase
                .from('reactions')
                .insert({
                    fail_id: failId,
                    user_id: user.id,
                    reaction_type: reactionType
                });

            if (error) throw error;

            // Incrémenter le compteur
            await this.updateReactionCount(failId, reactionType, 1);
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
    }

    private async updateReactionCount(failId: string, reactionType: string, delta: number): Promise<void> {
        const { data: fail, error: fetchError } = await this.supabase
            .from('fails')
            .select('reactions')
            .eq('id', failId)
            .single();

        if (fetchError) throw fetchError;

        const reactions = fail.reactions || {};
        reactions[reactionType] = Math.max(0, (reactions[reactionType] || 0) + delta);

        const { error: updateError } = await this.supabase
            .from('fails')
            .update({ reactions })
            .eq('id', failId);

        if (updateError) throw updateError;
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

            console.log(`📊 Badges récupérés depuis badge_definitions: ${data?.length || 0} badges`);
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
                categoriesUsed,
                maxReactionsOnFail
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {
                totalFails: 0,
                totalReactions: 0,
                categoriesUsed: 0,
                maxReactionsOnFail: 0
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

            console.log(`Badge ${badgeId} débloqué pour l'utilisateur ${userId}`);
            return true;
        } catch (error) {
            console.error('Erreur dans unlockBadge:', error);
            return false;
        }
    }
}
