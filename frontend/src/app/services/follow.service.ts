import { Injectable } from '@angular/core';
import { MysqlService } from './mysql.service';
import { AuthService } from './auth.service';
import { Follow, FollowStats, UserProfile } from '../models/follow.model';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';

@Injectable({
    providedIn: 'root'
})
export class FollowService {
    private followingSubject = new BehaviorSubject<string[]>([]);
    public following$ = this.followingSubject.asObservable();

    constructor(
        private mysqlService: MysqlService,
        private authService: AuthService,
        private logger: ComprehensiveLoggerService
    ) {
        // Charger les utilisateurs suivis au démarrage
        this.loadFollowing();
    }

    /**
     * Suivre un utilisateur
     */
    async followUser(userId: string): Promise<void> {
        const currentUser = await firstValueFrom(this.authService.currentUser$);
        if (!currentUser || currentUser.id === userId) {
            throw new Error('Impossible de se suivre soi-même ou utilisateur non connecté');
        }

        try {
            const { data, error } = await this.mysqlService.followUser(currentUser.id, userId);

            if (error) throw error;

            // Logger l'action de suivi
            await this.logger.logFollow(userId, 'follow');

            // Mettre à jour la liste locale
            const currentFollowing = this.followingSubject.value;
            this.followingSubject.next([...currentFollowing, userId]);

        } catch (error) {
            console.error('Erreur lors du suivi de l\'utilisateur:', error);
            throw error;
        }
    }

    /**
     * Ne plus suivre un utilisateur
     */
    async unfollowUser(userId: string): Promise<void> {
        const currentUser = await firstValueFrom(this.authService.currentUser$);
        if (!currentUser) {
            throw new Error('Utilisateur non connecté');
        }

        try {
            const { error } = await this.mysqlService.unfollowUser(currentUser.id, userId);

            if (error) throw error;

            // Logger l'action de ne plus suivre
            await this.logger.logFollow(userId, 'unfollow');

            // Mettre à jour la liste locale
            const currentFollowing = this.followingSubject.value;
            this.followingSubject.next(currentFollowing.filter(id => id !== userId));

        } catch (error) {
            console.error('Erreur lors de l\'arrêt du suivi:', error);
            throw error;
        }
    }

    /**
     * Vérifier si on suit un utilisateur
     */
    isFollowing(userId: string): boolean {
        return this.followingSubject.value.includes(userId);
    }

    /**
     * Obtenir les stats de follow d'un utilisateur
     */
    async getFollowStats(userId: string): Promise<FollowStats> {
        const currentUser = await firstValueFrom(this.authService.currentUser$);

        try {
            // Nombre de followers
            const { data: followersCount, error: followersError } = await this.mysqlService.getFollowersCount(userId);

            if (followersError) throw followersError;

            // Nombre de following
            const { data: followingCount, error: followingError } = await this.mysqlService.getFollowingCount(userId);

            if (followingError) throw followingError;

            // Vérifier si l'utilisateur actuel suit cette personne
            let isFollowing = false;
            if (currentUser && currentUser.id !== userId) {
                const { data, error: isFollowingError } = await this.mysqlService.isFollowing(currentUser.id, userId);

                if (!isFollowingError && data) {
                    isFollowing = true;
                }
            }

            return {
                followersCount: followersCount || 0,
                followingCount: followingCount || 0,
                isFollowing
            };

        } catch (error) {
            console.error('Erreur lors de la récupération des stats de follow:', error);
            return {
                followersCount: 0,
                followingCount: 0,
                isFollowing: false
            };
        }
    }

    /**
     * Obtenir le profil public d'un utilisateur
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            // Récupérer les infos de base du profil
            const { data: profile, error: profileError } = await this.mysqlService.getProfile(userId);

            if (profileError || !profile) {
                console.error('Erreur profil:', profileError);
                return null;
            }

            // Compter les fails publics de l'utilisateur
            const { data: totalFails, error: failsError } = await this.mysqlService.getUserFailsCount(userId);

            if (failsError) {
                console.error('Erreur fails count:', failsError);
            }

            // Calculer les points de courage (à adapter selon votre logique)
            const couragePoints = (totalFails || 0) * 10; // Exemple simple

            // Récupérer les stats de follow
            const followStats = await this.getFollowStats(userId);

            return {
                id: profile.id,
                display_name: profile.display_name || 'Utilisateur',
                avatar_url: profile.avatar_url || 'assets/profil/base.png',
                bio: profile.bio,
                totalFails: totalFails || 0,
                couragePoints,
                followersCount: followStats.followersCount,
                followingCount: followStats.followingCount,
                isFollowing: followStats.isFollowing,
                joinedAt: new Date(profile.created_at)
            };

        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur:', error);
            return null;
        }
    }

    /**
     * Charger la liste des utilisateurs suivis
     */
    private async loadFollowing(): Promise<void> {
        const currentUser = await firstValueFrom(this.authService.currentUser$);
        if (!currentUser) return;

        try {
            const { data, error } = await this.mysqlService.getFollowing(currentUser.id);

            if (error) throw error;

            const followingIds = data?.map((follow: any) => follow.following_id) || [];
            this.followingSubject.next(followingIds);

        } catch (error) {
            console.error('Erreur lors du chargement des follows:', error);
            this.followingSubject.next([]);
        }
    }

    /**
     * Obtenir la liste des utilisateurs suivis
     */
    async getFollowing(userId?: string): Promise<UserProfile[]> {
        const targetUserId = userId || (await firstValueFrom(this.authService.currentUser$))?.id;
        if (!targetUserId) return [];

        try {
            const { data, error } = await this.mysqlService.getFollowing(targetUserId);

            if (error) throw error;

            // Récupérer les IDs puis les profils
            const followingIds = data?.map((follow: any) => follow.following_id) || [];
            if (followingIds.length === 0) return [];

            const { data: profiles, error: profilesError } = await this.mysqlService.getUsersByIds(followingIds);
            if (profilesError) throw profilesError;

            return profiles?.map((profile: any) => ({
                id: profile.id,
                display_name: profile.display_name || 'Utilisateur',
                avatar_url: profile.avatar_url || 'assets/profil/base.png',
                bio: profile.bio,
                totalFails: 0, // À calculer si nécessaire
                couragePoints: 0, // À calculer si nécessaire
                followersCount: 0,
                followingCount: 0,
                joinedAt: new Date()
            })) || [];

        } catch (error) {
            console.error('Erreur lors de la récupération des following:', error);
            return [];
        }
    }

    /**
     * Obtenir la liste des followers
     */
    async getFollowers(userId?: string): Promise<UserProfile[]> {
        const targetUserId = userId || (await firstValueFrom(this.authService.currentUser$))?.id;
        if (!targetUserId) return [];

        try {
            const { data, error } = await this.mysqlService.getFollowers(targetUserId);

            if (error) throw error;

            // Récupérer les IDs puis les profils
            const followerIds = data?.map((follow: any) => follow.follower_id) || [];
            if (followerIds.length === 0) return [];

            const { data: profiles, error: profilesError } = await this.mysqlService.getUsersByIds(followerIds);
            if (profilesError) throw profilesError;

            return profiles?.map((profile: any) => ({
                id: profile.id,
                display_name: profile.display_name || 'Utilisateur',
                avatar_url: profile.avatar_url || 'assets/profil/base.png',
                bio: profile.bio,
                totalFails: 0,
                couragePoints: 0,
                followersCount: 0,
                followingCount: 0,
                joinedAt: new Date()
            })) || [];

        } catch (error) {
            console.error('Erreur lors de la récupération des followers:', error);
            return [];
        }
    }
}
