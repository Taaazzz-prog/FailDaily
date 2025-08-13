import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBadge, IonIcon, IonLabel,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    refreshOutline, downloadOutline, trashOutline, filterOutline,
    bugOutline, warningOutline, informationCircleOutline, closeCircleOutline,
    copyOutline
} from 'ionicons/icons';
import { DebugService, DebugLog } from '../../services/debug.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-debug',
    templateUrl: './debug.page.html',
    styleUrls: ['./debug.page.scss'],
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
        IonBadge, IonIcon, IonLabel,
        IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol
    ]
})
export class DebugPage implements OnInit, OnDestroy {
    logs: DebugLog[] = [];
    filteredLogs: DebugLog[] = [];
    private subscription?: Subscription;

    // Filtres
    selectedLevels: string[] = ['error', 'warn', 'info'];
    selectedServices: string[] = [];
    availableServices: string[] = [];
    showData = false;
    showStackTrace = false;
    autoRefresh = true;

    // Export
    showExportAlert = false;
    exportContent = '';
    exportAlertButtons = [
        { text: 'Copier', handler: () => this.copyToClipboard() },
        { text: 'Télécharger', handler: () => this.downloadLogs() },
        { text: 'Fermer', role: 'cancel' }
    ];

    // Statistiques
    stats = {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        debug: 0
    };

    constructor(private debugService: DebugService) {
        addIcons({
            refreshOutline, downloadOutline, trashOutline, filterOutline,
            bugOutline, warningOutline, informationCircleOutline, closeCircleOutline,
            copyOutline
        });
    }

    ngOnInit() {
        this.subscription = this.debugService.logs$.subscribe(logs => {
            this.logs = logs;
            this.updateAvailableServices();
            this.updateStats();
            this.applyFilters();
        });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    private updateAvailableServices() {
        this.availableServices = [...new Set(this.logs.map(log => log.service))];

        // Auto-sélectionner tous les services si aucun n'est sélectionné
        if (this.selectedServices.length === 0) {
            this.selectedServices = [...this.availableServices];
        }
    }

    private updateStats() {
        this.stats = {
            total: this.logs.length,
            errors: this.logs.filter(l => l.level === 'error').length,
            warnings: this.logs.filter(l => l.level === 'warn').length,
            info: this.logs.filter(l => l.level === 'info').length,
            debug: this.logs.filter(l => l.level === 'debug').length
        };
    }

    applyFilters() {
        this.filteredLogs = this.debugService.getLogs({
            level: this.selectedLevels as any[],
            service: this.selectedServices
        });
    }

    onLevelChange(event: any) {
        this.selectedLevels = event.detail.value;
        this.applyFilters();
    }

    onServiceChange(event: any) {
        this.selectedServices = event.detail.value;
        this.applyFilters();
    }

    refreshLogs() {
        // Les logs sont déjà à jour via la subscription
        this.applyFilters();
    }

    clearLogs() {
        this.debugService.clearLogs();
    }

    exportLogs() {
        this.exportContent = this.debugService.exportLogs({
            level: this.selectedLevels,
            service: this.selectedServices
        });
        this.showExportAlert = true;
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.exportContent);
            console.log('Logs copiés dans le presse-papier');
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
        }
    }

    downloadLogs() {
        const blob = new Blob([this.exportContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `faildaily-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    getLevelIcon(level: string): string {
        switch (level) {
            case 'error': return 'close-circle-outline';
            case 'warn': return 'warning-outline';
            case 'info': return 'information-circle-outline';
            case 'debug': return 'bug-outline';
            default: return 'information-circle-outline';
        }
    }

    getLevelColor(level: string): string {
        switch (level) {
            case 'error': return 'danger';
            case 'warn': return 'warning';
            case 'info': return 'primary';
            case 'debug': return 'medium';
            default: return 'medium';
        }
    }

    formatTimestamp(timestamp: Date): string {
        return new Date(timestamp).toLocaleTimeString() + '.' +
            new Date(timestamp).getMilliseconds().toString().padStart(3, '0');
    }

    formatData(data: any): string {
        if (!data) return '';
        if (typeof data === 'string') return data;
        return JSON.stringify(data, null, 2);
    }

    getErrorsOnlyForCopilot(): string {
        const errorLogs = this.logs.filter(log =>
            log.level === 'error' ||
            (log.level === 'warn' && log.message.includes('Error'))
        );

        if (errorLogs.length === 0) {
            return 'Aucune erreur trouvée dans les logs récents.';
        }

        const errorSummary = errorLogs.slice(0, 10).map(log => {
            return `[${log.timestamp.toLocaleTimeString()}] ${log.service}: ${log.message}` +
                (log.data ? `\nData: ${this.formatData(log.data)}` : '') +
                (log.stackTrace ? `\nStack: ${log.stackTrace.split('\n')[0]}` : '');
        }).join('\n\n---\n\n');

        return `ERREURS RÉCENTES (${errorLogs.length} total, affichage des 10 premières):\n\n${errorSummary}`;
    }

    async copyErrorsForCopilot() {
        try {
            const errorText = this.getErrorsOnlyForCopilot();
            await navigator.clipboard.writeText(errorText);
            console.log('Erreurs copiées dans le presse-papier pour Copilot');
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
        }
    }

    async copyAllLogs() {
        try {
            const allLogsText = this.getAllLogsForCopilot();
            await navigator.clipboard.writeText(allLogsText);
            console.log('Tous les logs copiés dans le presse-papier');
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
        }
    }

    getAllLogsForCopilot(): string {
        if (this.logs.length === 0) {
            return 'Aucun log trouvé.';
        }

        const recentLogs = this.logs.slice(0, 50); // Les 50 plus récents

        const logsSummary = recentLogs.map(log => {
            return `[${log.timestamp.toLocaleTimeString()}] ${log.level.toUpperCase()} - ${log.service}: ${log.message}` +
                (log.data ? `\nData: ${this.formatData(log.data)}` : '') +
                (log.stackTrace ? `\nStack: ${log.stackTrace.split('\n').slice(0, 3).join('\n')}` : '');
        }).join('\n\n---\n\n');

        return `LOGS RÉCENTS FailDaily (${this.logs.length} total, affichage des 50 premières):\n\n${logsSummary}`;
    } trackByLogId(index: number, log: DebugLog): string {
        return log.id;
    }
}
