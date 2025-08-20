import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MysqlService } from './mysql.service';
import { AuthService } from './auth.service';
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
        this.loadFollowingList();
    }

    // Version temporaire simplifiée - à implémenter plus tard
    async followUser(userId: string): Promise<void> {
        console.log('FollowService: followUser - Fonctionnalité temporairement désactivée');
        return Promise.resolve();
    }

    async unfollowUser(userId: string): Promise<void> {
        console.log('FollowService: unfollowUser - Fonctionnalité temporairement désactivée');
        return Promise.resolve();
    }

    async getFollowStats(userId: string): Promise<{ followersCount: number, followingCount: number, isFollowing: boolean }> {
        console.log('FollowService: getFollowStats - Fonctionnalité temporairement désactivée');
        return { followersCount: 0, followingCount: 0, isFollowing: false };
    }

    async getFollowerProfile(userId: string): Promise<any> {
        console.log('FollowService: getFollowerProfile - Fonctionnalité temporairement désactivée');
        return null;
    }

    async loadFollowingList(): Promise<void> {
        console.log('FollowService: loadFollowingList - Fonctionnalité temporairement désactivée');
        this.followingSubject.next([]);
    }

    async getFollowersList(userId: string): Promise<any[]> {
        console.log('FollowService: getFollowersList - Fonctionnalité temporairement désactivée');
        return [];
    }

    async getFollowingList(userId: string): Promise<any[]> {
        console.log('FollowService: getFollowingList - Fonctionnalité temporairement désactivée');
        return [];
    }

    async getUserFollowingIds(): Promise<string[]> {
        console.log('FollowService: getUserFollowingIds - Fonctionnalité temporairement désactivée');
        return [];
    }
}
