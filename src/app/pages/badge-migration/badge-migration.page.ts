import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonSpinner, IonIcon, IonBadge, IonList, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { MysqlService } from '../../services/mysql.service';
import { BadgeMigration, BadgeMigrationHelper } from '../../utils/badge-migration';

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

@Component({
    selector: 'app-badge-migration',
    templateUrl: './badge-migration.page.html',
    styleUrls: ['./badge-migration.page.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard,
        IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
        IonSpinner, IonIcon, IonBadge, IonList, IonButtons, IonBackButton
    ]
})
export class BadgeMigrationPage implements OnInit {
    isLoading = false;
    migrationResult: MigrationResult | null = null;
    hasRun = false;

    constructor(private MysqlService: MysqlService) { }

    ngOnInit() {
        console.log('🔧 Badge Migration Page initialized');
    }

    async runMigration() {
        this.isLoading = true;
        this.migrationResult = null;

        try {
            console.log('🚀 Démarrage de la migration des badges...');

            const migration = new BadgeMigration(this.MysqlService);
            this.migrationResult = await migration.migrateBadges();

            // Afficher le rapport dans la console
            migration.printMigrationReport(this.migrationResult);

            this.hasRun = true;
            console.log('✅ Migration terminée avec succès!');

        } catch (error) {
            console.error('❌ Erreur lors de la migration:', error);
            alert('Erreur lors de la migration. Vérifiez la console pour plus de détails.');
        } finally {
            this.isLoading = false;
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'exists': return 'medium';
            case 'added': return 'success';
            case 'error': return 'danger';
            default: return 'dark';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'exists': return 'checkmark-circle';
            case 'added': return 'add-circle';
            case 'error': return 'close-circle';
            default: return 'help-circle';
        }
    }

    async testSpecificBadge() {
        // Test spécial pour vérifier le badge reactions-25 pour bruno@taazzz.be
        try {
            console.log('🎯 Test spécial du badge reactions-25 pour bruno@taazzz.be...');
            const migration = new BadgeMigration(this.MysqlService);
            await migration.checkReactions25Badge();
        } catch (error) {
            console.error('❌ Erreur lors du test:', error);
        }
    }
}
