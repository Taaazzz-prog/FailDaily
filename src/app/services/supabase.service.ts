import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

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
            environment.supabase.key
        );
        this.client = this.supabase;

        this.supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser.next(session?.user || null);
        });

        this.getCurrentUser();
    }

    async getCurrentUser(): Promise<User | null> {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
        this.currentUser.next(user);
        return user;
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

    async resetPassword(email: string): Promise<void> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    }

    async getProfile(userId: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async updateProfile(userId: string, profile: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(profile)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createFail(fail: any): Promise<any> {
        const user = this.currentUser.value;
        if (!user) throw new Error('Utilisateur non authentifié');

        const failData = {
            ...fail,
            user_id: user.id
        };

        const { data, error } = await this.supabase
            .from('fails')
            .insert(failData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getFails(limit: number = 20, offset: number = 0): Promise<any[]> {
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

        const { error } = await this.supabase
            .from('reactions')
            .insert({
                fail_id: failId,
                user_id: user.id,
                reaction_type: reactionType
            });

        if (error) throw error;
        await this.updateReactionCount(failId, reactionType, 1);
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

    async getUserBadges(userId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('badges')
            .select('*')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async unlockBadge(userId: string, badgeData: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('badges')
            .insert({
                user_id: userId,
                badge_type: badgeData.badge_id || badgeData.badge_type, // Adapter à la structure existante
                category: badgeData.badge_category || badgeData.category,
                rarity: badgeData.badge_rarity || badgeData.rarity,
                name: badgeData.badge_name || badgeData.name,
                description: badgeData.badge_description || badgeData.description,
                icon: badgeData.badge_icon || badgeData.icon,
                unlocked_at: badgeData.unlocked_at || new Date(),
                created_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
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
     * Vérifie et débloque automatiquement les badges basés sur les stats
     */
    async checkAndUnlockBadges(userStats: any): Promise<any[]> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return [];

        // Récupérer tous les badges disponibles
        const allBadges = await this.getAllBadges();

        // Récupérer les badges déjà débloqués
        const userBadges = await this.getUserBadges(currentUser.id);
        const unlockedBadgeIds = userBadges.map(b => b.badge_type); // badge_type au lieu de badge_id

        const newlyUnlockedBadges = [];

        for (const badge of allBadges) {
            if (unlockedBadgeIds.includes(badge.id)) continue;

            // Logique de vérification des conditions
            let shouldUnlock = false;

            switch (badge.id) {
                case 'first-fail':
                    shouldUnlock = userStats.totalFails >= 1;
                    break;
                case 'daily-streak-7':
                    shouldUnlock = userStats.currentStreak >= 7;
                    break;
                case 'courage-hearts-50':
                    shouldUnlock = userStats.totalCourageHearts >= 50;
                    break;
                case 'community-helper':
                    shouldUnlock = userStats.helpedUsers >= 25;
                    break;
                // Ajouter d'autres conditions selon les besoins
            }

            if (shouldUnlock) {
                const newBadge = await this.unlockBadge(currentUser.id, {
                    badge_type: badge.id,  // badge_type au lieu de badge_id
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    category: badge.category,
                    rarity: badge.rarity,
                    unlocked_at: new Date()
                });
                newlyUnlockedBadges.push(newBadge);
            }
        }

        return newlyUnlockedBadges;
    }

    /**
     * Récupère la progression vers un badge
     */
    async getBadgeProgress(badgeId: string): Promise<{ current: number, required: number, progress: number }> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return { current: 0, required: 1, progress: 0 };

        // Récupérer les statistiques de l'utilisateur
        const userStats = await this.getUserStats(currentUser.id);

        let current = 0;
        let required = 1;

        // Définir les requirements pour chaque badge
        switch (badgeId) {
            case 'first-fail':
                current = userStats.totalFails;
                required = 1;
                break;
            case 'daily-streak-7':
                current = userStats.currentStreak;
                required = 7;
                break;
            case 'courage-hearts-50':
                current = userStats.totalCourageHearts;
                required = 50;
                break;
            case 'community-helper':
                current = userStats.helpedUsers;
                required = 25;
                break;
            default:
                current = 0;
                required = 1;
        }

        const progress = Math.min(current / required, 1);

        return { current, required, progress };
    }

    /**
     * Récupère les statistiques utilisateur pour les badges
     */
    async getUserStats(userId: string): Promise<any> {
        // Récupérer le profil utilisateur
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Compter les fails
        const { count: totalFails } = await this.supabase
            .from('fails')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        // Compter les réactions reçues
        const { count: totalReactions } = await this.supabase
            .from('reactions')
            .select('*', { count: 'exact' })
            .eq('target_user_id', userId);

        // Pour la streak, on pourrait faire un calcul plus complexe
        // Pour l'instant, on utilise une valeur simple
        const currentStreak = profile?.current_streak || 0;

        return {
            totalFails: totalFails || 0,
            totalCourageHearts: totalReactions || 0,
            currentStreak,
            helpedUsers: 0 // À implémenter selon la logique métier
        };
    }
}
