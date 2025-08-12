import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonSelect, IonSelectOption, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonBadge, IonSpinner, IonChip, IonIcon, IonButton,
    IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bugOutline, checkmarkCircle, documentText, flask, heart, hourglass, refresh, sync } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { BadgeService } from '../../services/badge.service';
import { Badge } from '../../models/badge.model';
import { BadgeMigration } from '../../utils/badge-migration';
import { filter, take } from 'rxjs';

interface AdminUser {
    id: string;
    email: string;
    display_name: string;
    created_at: string;
    total_fails: number;
    total_reactions: number;
}

interface AdminFail {
    id: string;
    title: string;
    description: string;
    category: string;
    created_at: string;
    reactions: any;
    user_reactions: any[];
}

interface UserReaction {
    id: string;
    reaction_type: string;
    fail_id: string;
    created_at: string;
    fail_title: string;
    fail_author: string;
}

interface UserActivity {
    type: 'fail' | 'reaction';
    id: string;
    created_at: string;
    title: string;
    description?: string;
    category?: string;
    reaction_type?: string;
    target_fail_title?: string;
    target_fail_author?: string;
}

@Component({
    selector: 'app-admin',
    templateUrl: './admin.page.html',
    styleUrls: ['./admin.page.scss'],
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
        IonSelect, IonSelectOption, IonCard, IonCardHeader, IonCardTitle,
        IonCardContent, IonBadge, IonSpinner, IonChip, IonIcon, IonButton,
        IonButtons, IonBackButton
    ]
})
export class AdminPage implements OnInit {
    users: AdminUser[] = [];
    selectedUser: AdminUser | null = null;
    userFails: AdminFail[] = [];
    userReactions: UserReaction[] = [];
    userActivity: UserActivity[] = [];
    userBadges: Badge[] = [];
    nextBadge: Badge | null = null;
    isLoading = false;
    isLoadingFails = false;
    isLoadingDetails = false;
    viewMode: 'summary' | 'fails' | 'reactions' | 'activity' | 'badges' = 'summary';

    // Propriétés pour la migration des badges
    isMigratingBadges = false;
    migrationResults: { added: number; existing: number; errors: number } | null = null;
    private badgeMigration: BadgeMigration;

    constructor(
        private supabaseService: SupabaseService,
        private authService: AuthService,
        private badgeService: BadgeService
    ) {
        // Configuration des icônes
        addIcons({
            bugOutline, checkmarkCircle, documentText, flask, heart, hourglass, refresh, sync
        });

        this.badgeMigration = new BadgeMigration(this.supabaseService);
    }

    async ngOnInit() {
        console.log('👑 Admin: Component initialized');
        console.log('👑 Admin: SupabaseService available:', !!this.supabaseService);
        console.log('👑 Admin: Supabase client available:', !!this.supabaseService?.client);

        // Attendre que l'authentification soit complète
        console.log('👑 Admin: Attente de l\'authentification...');
        try {
            await this.authService.currentUser$.pipe(
                filter(user => {
                    console.log('👑 Admin: État utilisateur:', user);
                    return user !== null && user !== undefined;
                }),
                take(1)
            ).toPromise();

            console.log('👑 Admin: Authentification confirmée ✅');

            // Test de connexion
            const connectionOk = await this.testConnection();
            console.log('👑 Admin: Connection test:', connectionOk ? '✅ OK' : '❌ FAILED');

            if (connectionOk) {
                await this.loadUsers();
            }
        } catch (error) {
            console.error('👑 Admin: Erreur d\'authentification:', error);
        }
    }

    async loadUsers() {
        this.isLoading = true;
        console.log('👑 Admin: Starting to load users...');

        // D'abord, testons différentes tables possibles
        console.log('👑 Admin: Testing different table names...');

        // Test 1: table 'profiles'
        try {
            const { data: profiles1, error: error1 } = await this.supabaseService.client
                .from('profiles')
                .select('*')
                .limit(5);
            console.log('👑 Admin: Test profiles table:', { data: profiles1, error: error1 });
        } catch (e) {
            console.log('👑 Admin: profiles table error:', e);
        }

        // Test 2: table 'users' 
        try {
            const { data: profiles2, error: error2 } = await this.supabaseService.client
                .from('users')
                .select('*')
                .limit(5);
            console.log('👑 Admin: Test users table:', { data: profiles2, error: error2 });
        } catch (e) {
            console.log('👑 Admin: users table error:', e);
        }

        // Test 3: Lister toutes les tables disponibles
        try {
            const { data: tables, error: tablesError } = await this.supabaseService.client
                .rpc('get_schema_tables');
            console.log('👑 Admin: Available tables:', { tables, error: tablesError });
        } catch (e) {
            console.log('👑 Admin: Cannot get tables list:', e);
        }

        // Test 3: Utiliser la même méthode que SupabaseService
        try {
            const { data: profiles3, error: error3 } = await this.supabaseService.client
                .from('profiles')
                .select('*');
            console.log('👑 Admin: Test profiles with select(*):', { data: profiles3, error: error3 });
        } catch (e) {
            console.log('👑 Admin: profiles select(*) error:', e);
        }

        // Test 4: Utiliser getProfile sur l'utilisateur actuel
        try {
            const currentUser = this.supabaseService.getCurrentUserSync();
            if (currentUser?.id) {
                console.log('👑 Admin: Current user ID:', currentUser.id);
                const profile = await this.supabaseService.getProfile(currentUser.id);
                console.log('👑 Admin: Current user profile via getProfile:', profile);
            }
        } catch (e) {
            console.log('👑 Admin: getProfile test error:', e);
        }

        // Test 5: Test avec la requête SQL brute
        try {
            const { data: rawProfiles, error: rawError } = await this.supabaseService.client
                .rpc('get_all_profiles'); // Fonction personnalisée si elle existe
            console.log('👑 Admin: Raw SQL profiles:', { data: rawProfiles, error: rawError });
        } catch (e) {
            console.log('👑 Admin: Raw SQL test (expected to fail):', e);
        }

        try {
            const { data: profiles, error } = await this.supabaseService.client
                .from('profiles')
                .select('id, email, display_name, created_at')
                .order('created_at', { ascending: false });

            console.log('👑 Admin: Profiles query result:', { profiles, error });
            console.log('👑 Admin: Raw profiles data:', profiles);
            console.log('👑 Admin: Error details:', error);

            if (error) {
                console.error('👑 Admin: Query error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            if (!profiles || profiles.length === 0) {
                console.log('👑 Admin: No profiles found in database');
                this.users = [];
                return;
            }

            // Calculer les statistiques pour chaque utilisateur
            this.users = [];
            for (const profile of profiles) {
                console.log('👑 Admin: Processing profile:', profile);
                const stats = await this.getUserStats(profile.id);
                this.users.push({
                    ...profile,
                    total_fails: stats.total_fails,
                    total_reactions: stats.total_reactions
                });
            }

            console.log('👑 Admin: Loaded', this.users.length, 'users with stats:', this.users);
        } catch (error) {
            console.error('❌ Error loading users:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async getUserStats(userId: string) {
        try {
            // Compter les fails
            const { count: failsCount } = await this.supabaseService.client
                .from('fails')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Compter les réactions données par cet utilisateur
            const { count: reactionsCount } = await this.supabaseService.client
                .from('reactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            return {
                total_fails: failsCount || 0,
                total_reactions: reactionsCount || 0
            };
        } catch (error) {
            console.error('❌ Error getting user stats:', error);
            return { total_fails: 0, total_reactions: 0 };
        }
    }

    async onUserSelected(event: any) {
        const userId = event.detail.value;
        console.log('👑 Admin: User selected:', userId);
        console.log('👑 Admin: Event object:', event);
        console.log('👑 Admin: Available users:', this.users);

        this.selectedUser = this.users.find(u => u.id === userId) || null;
        console.log('👑 Admin: Selected user object:', this.selectedUser);

        if (this.selectedUser) {
            console.log('👑 Admin: Loading complete user details for:', this.selectedUser.id);

            // Reset des données précédentes
            this.userFails = [];
            this.userReactions = [];
            this.userActivity = [];
            this.userBadges = [];
            this.nextBadge = null;
            console.log('👑 Admin: Reset previous data');

            await this.loadCompleteUserDetails(userId);
        } else {
            console.error('👑 Admin: ❌ No user found with ID:', userId);
        }
    }

    async loadCompleteUserDetails(userId: string) {
        this.isLoadingDetails = true;
        console.log('👑 Admin: Starting loadCompleteUserDetails for user:', userId);
        console.log('👑 Admin: Current data before loading:', {
            userFails: this.userFails.length,
            userReactions: this.userReactions.length,
            userActivity: this.userActivity.length
        });

        try {
            console.log('👑 Admin: Starting parallel loading of all user data...');

            // Charger tous les détails en parallèle
            await Promise.all([
                this.loadUserFails(userId),
                this.loadUserReactions(userId),
                this.loadUserActivity(userId),
                this.loadUserBadges(userId)
            ]);

            console.log('👑 Admin: All user details loaded successfully');
            console.log('👑 Admin: Final data after loading:', {
                userFails: this.userFails.length,
                userReactions: this.userReactions.length,
                userActivity: this.userActivity.length
            });
        } catch (error) {
            console.error('❌ Error loading user details:', error);
        } finally {
            this.isLoadingDetails = false;
            console.log('👑 Admin: Loading complete, isLoadingDetails set to false');
        }
    }

    async loadUserFails(userId: string) {
        this.isLoadingFails = true;
        console.log('👑 Admin: Starting to load fails for user:', userId);
        try {
            // Récupérer les fails de l'utilisateur
            const { data: fails, error: failsError } = await this.supabaseService.client
                .from('fails')
                .select('id, title, description, category, created_at, reactions')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            console.log('👑 Admin: Fails query result:', { fails, error: failsError });

            if (failsError) throw failsError;

            if (!fails || fails.length === 0) {
                console.log('👑 Admin: No fails found for user:', userId);
                this.userFails = [];
                return;
            }

            // Pour chaque fail, récupérer les réactions détaillées
            this.userFails = [];
            for (const fail of fails) {
                console.log('👑 Admin: Processing fail:', fail);
                const { data: reactions, error: reactionsError } = await this.supabaseService.client
                    .from('reactions')
                    .select('reaction_type, user_id, created_at, profiles(email, display_name)')
                    .eq('fail_id', fail.id);

                console.log('👑 Admin: Reactions for fail', fail.id, ':', { reactions, error: reactionsError });

                if (reactionsError) {
                    console.error('❌ Error loading reactions for fail:', fail.id, reactionsError);
                }

                this.userFails.push({
                    ...fail,
                    user_reactions: reactions || []
                });
            }

            console.log('👑 Admin: Final userFails array:', this.userFails);
        } catch (error) {
            console.error('❌ Error loading user fails:', error);
        } finally {
            this.isLoadingFails = false;
        }
    }

    async loadUserReactions(userId: string) {
        console.log('👑 Admin: Loading reactions for user:', userId);
        try {
            // Récupérer toutes les réactions données par l'utilisateur
            const { data: reactions, error: reactionsError } = await this.supabaseService.client
                .from('reactions')
                .select(`
                    id, 
                    reaction_type, 
                    fail_id, 
                    created_at,
                    fails!inner(
                        title,
                        profiles!inner(
                            display_name
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            console.log('👑 Admin: User reactions query result:', { reactions, error: reactionsError });

            if (reactionsError) {
                console.error('❌ Error loading user reactions:', reactionsError);
                this.userReactions = [];
                return;
            }

            this.userReactions = (reactions || []).map((reaction: any) => ({
                id: reaction.id,
                reaction_type: reaction.reaction_type,
                fail_id: reaction.fail_id,
                created_at: reaction.created_at,
                fail_title: reaction.fails?.title || 'Titre inconnu',
                fail_author: reaction.fails?.profiles?.display_name || 'Auteur inconnu'
            }));

            console.log('👑 Admin: Processed user reactions:', this.userReactions);

        } catch (error) {
            console.error('❌ Error loading user reactions:', error);
            this.userReactions = [];
        }
    }

    async loadUserActivity(userId: string) {
        console.log('👑 Admin: Loading activity timeline for user:', userId);
        try {
            // Combiner fails et réactions dans une timeline
            const activities: UserActivity[] = [];

            // Ajouter les fails
            this.userFails.forEach(fail => {
                activities.push({
                    type: 'fail',
                    id: fail.id,
                    created_at: fail.created_at,
                    title: fail.title,
                    description: fail.description,
                    category: fail.category
                });
            });

            // Ajouter les réactions
            this.userReactions.forEach(reaction => {
                activities.push({
                    type: 'reaction',
                    id: reaction.id,
                    created_at: reaction.created_at,
                    title: `Réaction ${reaction.reaction_type}`,
                    reaction_type: reaction.reaction_type,
                    target_fail_title: reaction.fail_title,
                    target_fail_author: reaction.fail_author
                });
            });

            // Trier par date décroissante
            this.userActivity = activities.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            console.log('👑 Admin: User activity timeline:', this.userActivity);

        } catch (error) {
            console.error('❌ Error creating user activity:', error);
            this.userActivity = [];
        }
    }

    setViewMode(mode: 'summary' | 'fails' | 'reactions' | 'activity' | 'badges') {
        console.log('👑 Admin: Setting view mode to:', mode);
        this.viewMode = mode;
    }

    getReactionColor(reactionType: string): string {
        switch (reactionType) {
            case 'courage': return 'primary';
            case 'empathy': return 'secondary';
            case 'laugh': return 'warning';
            case 'support': return 'success';
            default: return 'medium';
        }
    }

    getCategoryColor(category: string): string {
        switch (category) {
            case 'courage': return '#ef4444';
            case 'humour': return '#f59e0b';
            case 'entraide': return '#10b981';
            case 'perseverance': return '#8b5cf6';
            case 'special': return '#ec4899';
            case 'travail': return '#3b82f6';
            case 'sport': return '#06b6d4';
            case 'cuisine': return '#84cc16';
            default: return '#6b7280';
        }
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async refreshData() {
        console.log('👑 Admin: Refreshing data...');
        await this.loadUsers();
        if (this.selectedUser) {
            await this.loadCompleteUserDetails(this.selectedUser.id);
        }
    }

    // Méthode pour tester la connexion
    async testConnection() {
        try {
            console.log('👑 Admin: Testing database connection...');

            // Test simple avec une requête qui devrait toujours marcher
            const { data, error } = await this.supabaseService.client
                .from('profiles')
                .select('*')
                .limit(1);

            console.log('👑 Admin: Connection test result:', { data, error });

            if (error) {
                console.error('👑 Admin: Connection failed with error:', error);
                return false;
            }

            console.log('👑 Admin: ✅ Connection successful!');
            return true;
        } catch (error) {
            console.error('👑 Admin: Connection test failed:', error);
            return false;
        }
    }    // Créer des données de test pour le débogage
    async createTestData() {
        try {
            console.log('👑 Admin: Creating test data...');

            // Créer un profil de test
            const testProfile = {
                id: 'test-user-' + Date.now(),
                email: 'test@faildaily.com',
                display_name: 'Utilisateur Test',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
            };

            const { data: profileData, error: profileError } = await this.supabaseService.client
                .from('profiles')
                .insert([testProfile])
                .select();

            if (profileError) {
                console.error('❌ Error creating test profile:', profileError);
                return;
            }

            console.log('✅ Test profile created:', profileData);

            // Créer un fail de test
            const testFail = {
                user_id: testProfile.id,
                title: 'Test Fail',
                description: 'Ceci est un fail de test pour vérifier le panel admin',
                category: 'courage',
                reactions: { courage: 0, empathy: 0, laugh: 0, support: 0 }
            };

            const { data: failData, error: failError } = await this.supabaseService.client
                .from('fails')
                .insert([testFail])
                .select();

            if (failError) {
                console.error('❌ Error creating test fail:', failError);
                return;
            }

            console.log('✅ Test fail created:', failData);

            // Rafraîchir les données
            await this.loadUsers();

            console.log('✅ Test data created successfully!');

        } catch (error) {
            console.error('❌ Error creating test data:', error);
        }
    }

    async loadUserBadges(userId: string) {
        try {
            console.log('🏆 Admin: Loading badges for user:', userId);

            // ✅ FORCER le rafraîchissement des données depuis la BDD
            console.log('🏆 Admin: Forcing badge refresh from database');

            // Attendre un peu pour que la BDD soit synchronisée
            await new Promise(resolve => setTimeout(resolve, 500));

            // Utiliser la même source que BadgesPage
            const userBadges = await this.badgeService.getUserBadgesForUser(userId);

            console.log('🏆 Admin: User badges from service:', userBadges.length, userBadges.map(b => b.id));
            this.userBadges = userBadges;

            // Si aucun badge n'est trouvé, essayons une requête directe
            if (userBadges.length === 0) {
                console.log('🏆 Admin: No badges found via service, trying direct query...');
                try {
                    const { data: directBadges, error } = await this.supabaseService.client
                        .from('user_badges')
                        .select(`
                            badge_id,
                            unlocked_at,
                            badge_definitions (
                                id, name, description, icon, category, rarity
                            )
                        `)
                        .eq('user_id', userId);

                    if (error) {
                        console.error('❌ Admin: Direct query error:', error);
                    } else {
                        console.log('🏆 Admin: Direct query result:', directBadges);

                        if (directBadges && directBadges.length > 0) {
                            // Mapper les résultats - correction typage
                            this.userBadges = directBadges.map((item: any) => {
                                const badgeData = Array.isArray(item.badge_definitions)
                                    ? item.badge_definitions[0]
                                    : item.badge_definitions;

                                return {
                                    id: badgeData.id,
                                    name: badgeData.name,
                                    description: badgeData.description,
                                    icon: badgeData.icon,
                                    category: badgeData.category,
                                    rarity: badgeData.rarity,
                                    unlockedDate: new Date(item.unlocked_at)
                                };
                            });
                            console.log('🏆 Admin: Mapped direct badges:', this.userBadges.length);
                        }
                    }
                } catch (directError) {
                    console.error('❌ Admin: Direct query exception:', directError);
                }
            }

            // Récupérer tous les badges disponibles pour trouver le prochain
            const allBadges = await this.badgeService.getAllAvailableBadges();
            const userBadgeIds = this.userBadges.map((b: Badge) => b.id);

            // Trouver le prochain badge à débloquer
            const lockedBadges = allBadges.filter((badge: Badge) => !userBadgeIds.includes(badge.id));

            if (lockedBadges.length > 0) {
                // Prendre le premier badge non débloqué de rareté commune
                this.nextBadge = lockedBadges.find(b => b.rarity === 'common') || lockedBadges[0];
                console.log('🏆 Admin: Next badge to unlock:', this.nextBadge?.name);
            } else {
                this.nextBadge = null;
                console.log('🏆 Admin: User has all badges!');
            }

        } catch (error) {
            console.error('❌ Error loading user badges:', error);
            this.userBadges = [];
            this.nextBadge = null;
        }
    }

    getBadgeProgress(badge: Badge): { current: number; required: number; percentage: number } {
        // Cette méthode pourrait être étendue pour calculer le progrès exact
        // Pour l'instant, on retourne des valeurs par défaut
        return {
            current: 0,
            required: 100,
            percentage: 0
        };
    }

    getBadgeColor(rarity: string): string {
        switch (rarity) {
            case 'common': return 'medium';
            case 'rare': return 'primary';
            case 'epic': return 'secondary';
            case 'legendary': return 'warning';
            default: return 'dark';
        }
    }

    // === MÉTHODES DE MIGRATION DES BADGES ===
    async runBadgeMigration(): Promise<void> {
        console.log('🔄 Starting badge migration...');
        this.isMigratingBadges = true;
        this.migrationResults = null;

        try {
            const results = await this.badgeMigration.migrateBadges();
            this.migrationResults = results;

            console.log('✅ Badge migration completed:', results);

            // Optionnel : recharger les badges pour le service
            await this.badgeService.getAllAvailableBadges();

        } catch (error) {
            console.error('❌ Badge migration failed:', error);
            this.migrationResults = { added: 0, existing: 0, errors: 1 };
        } finally {
            this.isMigratingBadges = false;
        }
    }

    async testReactions25Badge(): Promise<void> {
        console.log('🧪 Testing reactions-25 badge for bruno@taazzz.be...');
        this.isMigratingBadges = true;

        try {
            const testResult = await this.badgeMigration.checkReactions25Badge();
            console.log('🧪 Test result:', testResult);

            // Recharger les badges de l'utilisateur si c'est bruno qui est sélectionné
            if (this.selectedUser?.email === 'bruno@taazzz.be') {
                await this.loadUserBadges(this.selectedUser.id);
            }

        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            this.isMigratingBadges = false;
        }
    }
}
