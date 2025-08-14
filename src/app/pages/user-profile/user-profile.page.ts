import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonIcon, IonButton, IonAvatar, IonProgressBar,
    IonRefresher, IonRefresherContent, IonSpinner,
    RefresherCustomEvent, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    personOutline, heartOutline, heart, documentText, trophy,
    peopleOutline, calendarOutline
} from 'ionicons/icons';
import { FollowService } from '../../services/follow.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/follow.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.page.html',
    styleUrls: ['./user-profile.page.scss'],
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
        IonIcon, IonButton, IonAvatar, IonProgressBar,
        IonRefresher, IonRefresherContent, IonSpinner
    ]
})
export class UserProfilePage implements OnInit, OnDestroy {
    userProfile: UserProfile | null = null;
    isLoading = true;
    isFollowing = false;
    isToggleFollowLoading = false;
    showToast = false;
    toastMessage = '';
    toastColor = 'success';

    private subscriptions = new Subscription();
    private userId: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private followService: FollowService,
        private authService: AuthService,
        private toastController: ToastController
    ) {
        addIcons({
            personOutline, heartOutline, heart, documentText, trophy,
            peopleOutline, calendarOutline
        });
    }

    async ngOnInit() {
        // Récupérer l'ID utilisateur depuis les paramètres de route
        this.userId = this.route.snapshot.paramMap.get('userId');

        if (!this.userId) {
            console.error('Aucun userId fourni');
            this.router.navigate(['/tabs/home']);
            return;
        }

        // Vérifier qu'on ne consulte pas son propre profil
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id === this.userId) {
            // Rediriger vers le profil personnel
            this.router.navigate(['/tabs/profile']);
            return;
        }

        await this.loadUserProfile();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    async loadUserProfile() {
        if (!this.userId) return;

        this.isLoading = true;
        try {
            this.userProfile = await this.followService.getUserProfile(this.userId);
            if (this.userProfile) {
                this.isFollowing = this.userProfile.isFollowing || false;
            }
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            this.showErrorToast('Erreur lors du chargement du profil');
        } finally {
            this.isLoading = false;
        }
    }

    async toggleFollow() {
        if (!this.userId || !this.userProfile || this.isToggleFollowLoading) return;

        this.isToggleFollowLoading = true;
        try {
            if (this.isFollowing) {
                await this.followService.unfollowUser(this.userId);
                this.isFollowing = false;
                this.userProfile.followersCount = Math.max(0, this.userProfile.followersCount - 1);
                this.showSuccessToast(`Vous ne suivez plus ${this.userProfile.display_name}`);
            } else {
                await this.followService.followUser(this.userId);
                this.isFollowing = true;
                this.userProfile.followersCount++;
                this.showSuccessToast(`Vous suivez maintenant ${this.userProfile.display_name}`);
            }
        } catch (error) {
            console.error('Erreur lors du toggle follow:', error);
            this.showErrorToast('Erreur lors de l\'action');
        } finally {
            this.isToggleFollowLoading = false;
        }
    }

    async handleRefresh(event: RefresherCustomEvent) {
        await this.loadUserProfile();
        event.target.complete();
    }

    getJoinedDaysAgo(): number {
        if (!this.userProfile) return 0;
        return Math.floor(
            (Date.now() - this.userProfile.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
    }

    getProgressLevel(couragePoints: number) {
        const level = Math.floor(couragePoints / 100) + 1;
        const progress = (couragePoints % 100) / 100;
        const nextLevel = (level * 100) - couragePoints;

        return { level, progress, nextLevel };
    }

    private async showSuccessToast(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            color: 'success',
            position: 'top'
        });
        await toast.present();
    }

    private async showErrorToast(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color: 'danger',
            position: 'top'
        });
        await toast.present();
    }

    goBack() {
        this.location.back();
    }
}
