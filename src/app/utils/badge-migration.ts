import { SupabaseService } from '../services/supabase.service';
import { BadgeCategory } from '../models/enums';

/**
 * Script de migration des badges - Vérifie les badges supprimés du code
 * et les ajoute dans la base de données s'ils n'existent pas
 */

// Badges qui étaient codés en dur et ont été supprimés du code
const REMOVED_HARDCODED_BADGES = [
    // Badges de début
    {
        id: 'first-fail',
        name: 'Premier Courage',
        description: 'Poster votre premier fail',
        icon: 'heart-outline',
        category: BadgeCategory.COURAGE,
        rarity: 'common',
        requirement_type: 'fail_count',
        requirement_value: '1'
    },
    {
        id: 'first-reaction',
        name: 'Première Réaction',
        description: 'Donner votre première réaction à un fail',
        icon: 'happy-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'common',
        requirement_type: 'reaction_given',
        requirement_value: '1'
    },

    // Badges de volume - Fails
    {
        id: 'fails-5',
        name: 'Apprenti Courage',
        description: 'Poster 5 fails',
        icon: 'ribbon-outline',
        category: BadgeCategory.COURAGE,
        rarity: 'common',
        requirement_type: 'fail_count',
        requirement_value: '5'
    },
    {
        id: 'fails-10',
        name: 'Courageux',
        description: 'Poster 10 fails',
        icon: 'trophy-outline',
        category: BadgeCategory.COURAGE,
        rarity: 'rare',
        requirement_type: 'fail_count',
        requirement_value: '10'
    },
    {
        id: 'fails-25',
        name: 'Maître du Courage',
        description: 'Poster 25 fails',
        icon: 'star-outline',
        category: BadgeCategory.COURAGE,
        rarity: 'epic',
        requirement_type: 'fail_count',
        requirement_value: '25'
    },
    {
        id: 'fails-50',
        name: 'Vétéran du Courage',
        description: 'Poster 50 fails',
        icon: 'shield-outline',
        category: BadgeCategory.COURAGE,
        rarity: 'epic',
        requirement_type: 'fail_count',
        requirement_value: '50'
    },
    {
        id: 'fails-100',
        name: 'Légende du Courage',
        description: 'Poster 100 fails',
        icon: 'diamond-outline',
        category: BadgeCategory.COURAGE,
        rarity: 'legendary',
        requirement_type: 'fail_count',
        requirement_value: '100'
    },

    // Badges de réactions - TOUS Y COMPRIS LE reactions-25 MANQUANT !
    {
        id: 'reactions-10',
        name: 'Supporteur',
        description: 'Donner 10 réactions',
        icon: 'people-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'common',
        requirement_type: 'reaction_given',
        requirement_value: '10'
    },
    {
        id: 'reactions-25',
        name: 'Supporteur Actif',
        description: 'Donner 25 réactions',
        icon: 'heart-half-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'common',
        requirement_type: 'reaction_given',
        requirement_value: '25'
    },
    {
        id: 'reactions-50',
        name: 'Grand Supporteur',
        description: 'Donner 50 réactions',
        icon: 'heart',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'rare',
        requirement_type: 'reaction_given',
        requirement_value: '50'
    },
    {
        id: 'reactions-100',
        name: 'Super Supporteur',
        description: 'Donner 100 réactions',
        icon: 'heart-circle-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'epic',
        requirement_type: 'reaction_given',
        requirement_value: '100'
    },
    {
        id: 'reactions-250',
        name: 'Maître du Support',
        description: 'Donner 250 réactions',
        icon: 'heart-half-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'legendary',
        requirement_type: 'reaction_given',
        requirement_value: '250'
    },

    // Badges de diversité
    {
        id: 'all-categories',
        name: 'Touche-à-tout',
        description: 'Poster un fail dans chaque catégorie',
        icon: 'apps-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'epic',
        requirement_type: 'categories_used',
        requirement_value: '5'
    },
    {
        id: 'master-explorer',
        name: 'Maître Explorateur',
        description: 'Utiliser 10 catégories différentes',
        icon: 'compass-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'legendary',
        requirement_type: 'categories_used',
        requirement_value: '10'
    },
    {
        id: 'category-master',
        name: 'Maître des Catégories',
        description: 'Poster 5 fails dans chaque catégorie',
        icon: 'library-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'legendary',
        requirement_type: 'category_mastery',
        requirement_value: '5'
    },

    // Badges de temps et persévérance
    {
        id: 'week-streak',
        name: 'Semaine de Courage',
        description: 'Poster au moins un fail par jour pendant 7 jours',
        icon: 'calendar-outline',
        category: BadgeCategory.PERSEVERANCE,
        rarity: 'rare',
        requirement_type: 'streak_days',
        requirement_value: '7'
    },
    {
        id: 'month-streak',
        name: 'Mois de Courage',
        description: 'Poster au moins un fail par jour pendant 30 jours',
        icon: 'calendar',
        category: BadgeCategory.PERSEVERANCE,
        rarity: 'legendary',
        requirement_type: 'streak_days',
        requirement_value: '30'
    },
    {
        id: 'year-warrior',
        name: 'Guerrier de l\'Année',
        description: 'Actif toute une année',
        icon: 'shield',
        category: BadgeCategory.PERSEVERANCE,
        rarity: 'legendary',
        requirement_type: 'active_days',
        requirement_value: '365'
    },

    // Badges de popularité
    {
        id: 'popular-fail',
        name: 'Populaire',
        description: 'Recevoir 10 réactions sur un seul fail',
        icon: 'flame-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare',
        requirement_type: 'max_reactions_on_fail',
        requirement_value: '10'
    },
    {
        id: 'viral-fail',
        name: 'Viral',
        description: 'Votre fail a reçu plus de 50 réactions',
        icon: 'flame-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare',
        requirement_type: 'max_reactions_on_fail',
        requirement_value: '50'
    },
    {
        id: 'legendary-fail',
        name: 'Fail Légendaire',
        description: 'Un fail avec plus de 100 réactions',
        icon: 'trophy',
        category: BadgeCategory.SPECIAL,
        rarity: 'legendary',
        requirement_type: 'max_reactions_on_fail',
        requirement_value: '100'
    },

    // Badges sociaux et d'aide
    {
        id: 'helpful',
        name: 'Secouriste',
        description: 'Donner 100 réactions d\'aide',
        icon: 'medical-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'epic',
        requirement_type: 'support_reactions',
        requirement_value: '100'
    },
    {
        id: 'helper',
        name: 'Assistant',
        description: 'Aider régulièrement les autres',
        icon: 'hand-left-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'rare',
        requirement_type: 'support_reactions',
        requirement_value: '50'
    },
    {
        id: 'mentor',
        name: 'Mentor',
        description: 'Aider 25 personnes différentes avec vos réactions',
        icon: 'school-outline',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'epic',
        requirement_type: 'unique_users_helped',
        requirement_value: '25'
    },
    {
        id: 'empathy-master',
        name: 'Maître de l\'Empathie',
        description: 'Expert en réactions d\'empathie',
        icon: 'heart-circle',
        category: BadgeCategory.ENTRAIDE,
        rarity: 'epic',
        requirement_type: 'empathy_reactions',
        requirement_value: '100'
    },

    // Badges spéciaux et amusants
    {
        id: 'trendsetter',
        name: 'Pionnier',
        description: 'Premier à poster dans une nouvelle catégorie',
        icon: 'rocket-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'legendary',
        requirement_type: 'category_pioneer',
        requirement_value: '1'
    },
    {
        id: 'comedian',
        name: 'Comédien',
        description: 'Faire rire avec vos fails',
        icon: 'happy',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare',
        requirement_type: 'laugh_reactions',
        requirement_value: '50'
    },
    {
        id: 'jester',
        name: 'Bouffon',
        description: 'Maître du rire',
        icon: 'happy',
        category: BadgeCategory.SPECIAL,
        rarity: 'epic',
        requirement_type: 'laugh_reactions',
        requirement_value: '100'
    },
    {
        id: 'night-owl',
        name: 'Oiseau de Nuit',
        description: 'Actif la nuit',
        icon: 'moon-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare',
        requirement_type: 'night_posts',
        requirement_value: '20'
    },
    {
        id: 'early-bird',
        name: 'Lève-tôt',
        description: 'Actif tôt le matin',
        icon: 'sunny-outline',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare',
        requirement_type: 'morning_posts',
        requirement_value: '20'
    },
    {
        id: 'weekend-warrior',
        name: 'Guerrier du Weekend',
        description: 'Très actif le weekend',
        icon: 'calendar',
        category: BadgeCategory.PERSEVERANCE,
        rarity: 'rare',
        requirement_type: 'weekend_posts',
        requirement_value: '30'
    },

    // Badges de résilience
    {
        id: 'comeback-king',
        name: 'Phoenix',
        description: 'Revenir après une longue absence',
        icon: 'refresh-outline',
        category: BadgeCategory.PERSEVERANCE,
        rarity: 'epic',
        requirement_type: 'comeback_days',
        requirement_value: '30'
    },

    // Badges de qualité
    {
        id: 'quality-poster',
        name: 'Conteur de Qualité',
        description: 'Vos fails reçoivent en moyenne plus de 10 réactions',
        icon: 'star',
        category: BadgeCategory.SPECIAL,
        rarity: 'rare',
        requirement_type: 'average_reactions_per_fail',
        requirement_value: '10'
    }
];

interface MigrationDetail {
    id: string;
    name: string;
    status: 'exists' | 'added' | 'error';
    message: string;
}

interface MigrationResult {
    existing: number;
    added: number;
    errors: number;
    details: MigrationDetail[];
}

export class BadgeMigration {
    constructor(private supabaseService: SupabaseService) { }

    /**
     * Vérifie les badges dans la base de données et ajoute ceux qui manquent
     */
    async migrateBadges(): Promise<MigrationResult> {
        console.log('🔄 Début de la migration des badges...');

        try {
            // Récupérer les badges existants en BDD
            const existingBadges = await this.supabaseService.getAllAvailableBadges();
            const existingIds = existingBadges.map(badge => badge.id);

            console.log(`📊 Badges existants en BDD: ${existingIds.length}`);
            console.log('📋 IDs existants:', existingIds);

            const results: MigrationResult = {
                existing: existingIds.length,
                added: 0,
                errors: 0,
                details: []
            };

            // Vérifier chaque badge hardcodé
            for (const badge of REMOVED_HARDCODED_BADGES) {
                if (existingIds.includes(badge.id)) {
                    console.log(`✅ Badge ${badge.id} existe déjà en BDD`);
                    results.details.push({
                        id: badge.id,
                        name: badge.name,
                        status: 'exists',
                        message: 'Badge déjà présent en base'
                    });
                } else {
                    console.log(`➕ Ajout du badge manquant: ${badge.id}`);

                    try {
                        const success = await this.addBadgeToDatabase(badge);
                        if (success) {
                            results.added++;
                            results.details.push({
                                id: badge.id,
                                name: badge.name,
                                status: 'added',
                                message: 'Badge ajouté avec succès'
                            });
                        } else {
                            results.errors++;
                            results.details.push({
                                id: badge.id,
                                name: badge.name,
                                status: 'error',
                                message: 'Erreur lors de l\'ajout'
                            });
                        }
                    } catch (error) {
                        console.error(`❌ Erreur lors de l'ajout du badge ${badge.id}:`, error);
                        results.errors++;
                        results.details.push({
                            id: badge.id,
                            name: badge.name,
                            status: 'error',
                            message: `Erreur: ${error}`
                        });
                    }
                }
            }

            console.log('✨ Migration terminée!');
            console.log(`📈 Résultats: ${results.existing} existants, ${results.added} ajoutés, ${results.errors} erreurs`);

            return results;
        } catch (error) {
            console.error('💥 Erreur critique lors de la migration:', error);
            throw error;
        }
    }

    /**
     * Ajoute un badge à la base de données
     */
    private async addBadgeToDatabase(badge: any): Promise<boolean> {
        try {
            const { data, error } = await this.supabaseService.client
                .from('badge_definitions')
                .insert({
                    id: badge.id,
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    category: badge.category,
                    rarity: badge.rarity,
                    requirement_type: badge.requirement_type,
                    requirement_value: badge.requirement_value,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error(`❌ Erreur SQL pour ${badge.id}:`, error);
                return false;
            }

            console.log(`✅ Badge ${badge.id} ajouté avec succès`);
            return true;
        } catch (error) {
            console.error(`💥 Exception lors de l'ajout du badge ${badge.id}:`, error);
            return false;
        }
    }

    /**
     * Affiche un rapport détaillé de la migration
     */
    printMigrationReport(results: MigrationResult): void {
        console.log('\n📋 RAPPORT DE MIGRATION DES BADGES');
        console.log('=====================================');
        console.log(`🏆 Badges existants: ${results.existing}`);
        console.log(`➕ Badges ajoutés: ${results.added}`);
        console.log(`❌ Erreurs: ${results.errors}`);
        console.log('\n📄 Détails:');

        results.details.forEach((detail: MigrationDetail) => {
            const statusIcon: Record<string, string> = {
                exists: '✅',
                added: '➕',
                error: '❌'
            };

            const icon = statusIcon[detail.status] || '❓';
            console.log(`${icon} ${detail.id} (${detail.name}): ${detail.message}`);
        });

        if (results.added > 0) {
            console.log(`\n🎉 ${results.added} nouveaux badges ont été ajoutés à votre base de données!`);
            console.log('💡 Conseil: Redémarrez votre application pour prendre en compte les nouveaux badges.');
        }

        if (results.errors > 0) {
            console.log(`\n⚠️  ${results.errors} erreurs se sont produites. Vérifiez les logs ci-dessus.`);
        }
    }

    /**
     * Méthode utilitaire pour vérifier un badge spécifique
     */
    async checkSpecificBadge(badgeId: string): Promise<void> {
        console.log(`🔍 Vérification du badge: ${badgeId}`);

        const badge = REMOVED_HARDCODED_BADGES.find(b => b.id === badgeId);
        if (!badge) {
            console.log(`❌ Badge ${badgeId} non trouvé dans la liste des badges supprimés`);
            return;
        }

        const existingBadges = await this.supabaseService.getAllAvailableBadges();
        const exists = existingBadges.some(b => b.id === badgeId);

        if (exists) {
            console.log(`✅ Badge ${badgeId} existe en BDD`);
        } else {
            console.log(`➕ Badge ${badgeId} manquant - ajout...`);
            const success = await this.addBadgeToDatabase(badge);
            console.log(success ? '✅ Ajouté avec succès' : '❌ Échec de l\'ajout');
        }
    }

    /**
     * Méthode spéciale pour vérifier le badge reactions-25 pour bruno@taazzz.be
     */
    async checkReactions25Badge(): Promise<void> {
        console.log('🎯 Vérification spéciale du badge reactions-25...');

        // D'abord, vérifier si le badge existe en BDD
        await this.checkSpecificBadge('reactions-25');

        // Ensuite, vérifier les stats de l'utilisateur bruno@taazzz.be
        try {
            console.log('📊 Vérification des stats de bruno@taazzz.be...');

            // Note: Il faudrait l'ID utilisateur de bruno@taazzz.be
            // Pour l'instant, on affiche juste les instructions
            console.log('💡 Pour tester complètement:');
            console.log('1. Trouvez l\'ID utilisateur de bruno@taazzz.be');
            console.log('2. Vérifiez ses statistiques de réactions');
            console.log('3. Déclenchez la vérification des badges pour cet utilisateur');
            console.log('4. Le badge reactions-25 devrait se débloquer s\'il a 28 réactions');

        } catch (error) {
            console.error('❌ Erreur lors de la vérification:', error);
        }
    }
}
