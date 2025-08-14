import { Injectable } from '@angular/core';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class LoggingSetupService {

    constructor(
        private logger: ComprehensiveLoggerService,
        private supabaseService: SupabaseService
    ) {
        this.initializeLogging();
    }

    private initializeLogging() {
        // Injection du logger dans le service Supabase pour éviter les dépendances circulaires
        this.supabaseService.setLogger(this.logger);
        console.log('🔧 LoggingSetupService: Logger configuré pour tous les services');
    }
}
