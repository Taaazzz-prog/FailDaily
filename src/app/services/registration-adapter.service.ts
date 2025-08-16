import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Service adaptateur pour convertir entre différents formats de données d'inscription
 * Compatible avec Supabase legacy, MySQL, et autres futurs backends
 */

interface AdapterConfig {
  sourceFormat: 'supabase' | 'mysql' | 'generic';
  targetFormat: 'supabase' | 'mysql' | 'generic';
  fieldMappings: { [key: string]: string };
  transformations: { [key: string]: (value: any) => any };
}

interface RegistrationDataFormat {
  // Format Supabase
  supabase?: {
    email: string;
    password: string;
    options?: {
      data: {
        displayName: string;
        birthDate: string;
        agreeToTerms: boolean;
        agreeToNewsletter?: boolean;
      }
    }
  };

  // Format MySQL
  mysql?: {
    email: string;
    password: string;
    displayName: string;
    birthDate: string;
    agreeToTerms: boolean;
    agreeToNewsletter?: boolean;
    referralCode?: string;
  };

  // Format générique
  generic?: {
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationAdapterService {
  private currentConfig = new BehaviorSubject<AdapterConfig>({
    sourceFormat: 'generic',
    targetFormat: 'mysql',
    fieldMappings: {},
    transformations: {}
  });

  public currentConfig$ = this.currentConfig.asObservable();

  // Configurations prédéfinies
  private predefinedConfigs: { [key: string]: AdapterConfig } = {
    'supabase-to-mysql': {
      sourceFormat: 'supabase',
      targetFormat: 'mysql',
      fieldMappings: {
        'email': 'email',
        'password': 'password',
        'options.data.displayName': 'displayName',
        'options.data.birthDate': 'birthDate',
        'options.data.agreeToTerms': 'agreeToTerms',
        'options.data.agreeToNewsletter': 'agreeToNewsletter'
      },
      transformations: {
        'birthDate': (value: string) => new Date(value).toISOString().split('T')[0],
        'agreeToTerms': (value: any) => Boolean(value),
        'agreeToNewsletter': (value: any) => Boolean(value)
      }
    },

    'mysql-to-supabase': {
      sourceFormat: 'mysql',
      targetFormat: 'supabase',
      fieldMappings: {
        'email': 'email',
        'password': 'password',
        'displayName': 'options.data.displayName',
        'birthDate': 'options.data.birthDate',
        'agreeToTerms': 'options.data.agreeToTerms',
        'agreeToNewsletter': 'options.data.agreeToNewsletter'
      },
      transformations: {
        'options.data.birthDate': (value: string) => new Date(value).toISOString(),
        'options.data.agreeToTerms': (value: any) => Boolean(value),
        'options.data.agreeToNewsletter': (value: any) => Boolean(value)
      }
    },

    'generic-to-mysql': {
      sourceFormat: 'generic',
      targetFormat: 'mysql',
      fieldMappings: {
        'email': 'email',
        'password': 'password',
        'display_name': 'displayName',
        'birth_date': 'birthDate',
        'agree_to_terms': 'agreeToTerms',
        'newsletter': 'agreeToNewsletter',
        'referral': 'referralCode'
      },
      transformations: {}
    }
  };

  constructor(private http: HttpClient) {
    console.log('🔌 RegistrationAdapterService: Service adaptateur d\'inscription initialisé');
    this.setConfig('generic-to-mysql');
  }

  /**
   * Définir la configuration d'adaptation
   */
  setConfig(configName: string): boolean {
    const config = this.predefinedConfigs[configName];
    if (config) {
      this.currentConfig.next(config);
      console.log(`🔧 Configuration adaptateur: ${configName}`);
      return true;
    }
    
    console.warn(`⚠️ Configuration inconnue: ${configName}`);
    return false;
  }

  /**
   * Définir une configuration personnalisée
   */
  setCustomConfig(config: AdapterConfig): void {
    this.currentConfig.next(config);
    console.log('🔧 Configuration personnalisée appliquée');
  }

  /**
   * Convertir des données d'inscription entre formats
   */
  adaptRegistrationData(sourceData: any, targetFormat?: string): any {
    const config = this.currentConfig.value;
    const format = targetFormat || config.targetFormat;

    try {
      console.log(`🔄 Adaptation ${config.sourceFormat} → ${format}`);
      
      const adapted = this.transformData(sourceData, config);
      
      // Post-traitement selon le format cible
      switch (format) {
        case 'supabase':
          return this.formatForSupabase(adapted);
        case 'mysql':
          return this.formatForMysql(adapted);
        case 'generic':
        default:
          return adapted;
      }

    } catch (error) {
      console.error('❌ Erreur adaptation données:', error);
      throw new Error(`Échec adaptation: ${error}`);
    }
  }

  /**
   * Transformation principale des données
   */
  private transformData(sourceData: any, config: AdapterConfig): any {
    const result: any = {};

    // Appliquer les mappings de champs
    Object.entries(config.fieldMappings).forEach(([sourcePath, targetPath]) => {
      const sourceValue = this.getNestedValue(sourceData, sourcePath);
      if (sourceValue !== undefined) {
        this.setNestedValue(result, targetPath, sourceValue);
      }
    });

    // Appliquer les transformations
    Object.entries(config.transformations).forEach(([path, transformer]) => {
      const currentValue = this.getNestedValue(result, path);
      if (currentValue !== undefined) {
        try {
          const transformedValue = transformer(currentValue);
          this.setNestedValue(result, path, transformedValue);
        } catch (error) {
          console.warn(`⚠️ Erreur transformation ${path}:`, error);
        }
      }
    });

    return result;
  }

  /**
   * Formater pour Supabase
   */
  private formatForSupabase(data: any): RegistrationDataFormat['supabase'] {
    return {
      email: data.email,
      password: data.password,
      options: {
        data: {
          displayName: data.displayName || data.email?.split('@')[0] || '',
          birthDate: data.birthDate,
          agreeToTerms: Boolean(data.agreeToTerms),
          agreeToNewsletter: Boolean(data.agreeToNewsletter)
        }
      }
    };
  }

  /**
   * Formater pour MySQL
   */
  private formatForMysql(data: any): RegistrationDataFormat['mysql'] {
    return {
      email: data.email,
      password: data.password,
      displayName: data.displayName || data.email?.split('@')[0] || '',
      birthDate: data.birthDate,
      agreeToTerms: Boolean(data.agreeToTerms),
      agreeToNewsletter: Boolean(data.agreeToNewsletter),
      referralCode: data.referralCode || null
    };
  }

  /**
   * Valider les données adaptées
   */
  validateAdaptedData(data: any, format: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (format) {
      case 'supabase':
        if (!data.email) errors.push('Email manquant');
        if (!data.password) errors.push('Mot de passe manquant');
        if (!data.options?.data?.displayName) errors.push('Nom d\'affichage manquant');
        if (!data.options?.data?.agreeToTerms) errors.push('Acceptation CGU manquante');
        break;

      case 'mysql':
        if (!data.email) errors.push('Email manquant');
        if (!data.password) errors.push('Mot de passe manquant');
        if (!data.displayName) errors.push('Nom d\'affichage manquant');
        if (!data.agreeToTerms) errors.push('Acceptation CGU manquante');
        break;

      case 'generic':
        if (!data.email && !data.Email && !data.EMAIL) {
          errors.push('Email manquant (tous formats)');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Adapter des données utilisateur existantes (pour migration)
   */
  adaptUserData(userData: any, sourceFormat: string, targetFormat: string): any {
    const tempConfig: AdapterConfig = {
      sourceFormat: sourceFormat as any,
      targetFormat: targetFormat as any,
      fieldMappings: this.getUserDataMappings(sourceFormat, targetFormat),
      transformations: this.getUserDataTransformations()
    };

    const originalConfig = this.currentConfig.value;
    this.currentConfig.next(tempConfig);
    
    try {
      const adapted = this.adaptRegistrationData(userData, targetFormat);
      return adapted;
    } finally {
      this.currentConfig.next(originalConfig);
    }
  }

  /**
   * Mappings pour données utilisateur (migration)
   */
  private getUserDataMappings(source: string, target: string): { [key: string]: string } {
    const mappings: { [key: string]: { [key: string]: string } } = {
      'supabase-mysql': {
        'id': 'supabaseId',
        'email': 'email',
        'user_metadata.displayName': 'displayName',
        'user_metadata.birthDate': 'birthDate',
        'created_at': 'createdAt',
        'updated_at': 'updatedAt'
      },
      'mysql-supabase': {
        'email': 'email',
        'displayName': 'user_metadata.displayName',
        'birthDate': 'user_metadata.birthDate',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      }
    };

    return mappings[`${source}-${target}`] || {};
  }

  /**
   * Transformations pour données utilisateur
   */
  private getUserDataTransformations(): { [key: string]: (value: any) => any } {
    return {
      'createdAt': (value: any) => new Date(value).toISOString(),
      'updatedAt': (value: any) => new Date(value).toISOString(),
      'birthDate': (value: any) => {
        if (typeof value === 'string') {
          return value.includes('T') ? value.split('T')[0] : value;
        }
        return value;
      }
    };
  }

  /**
   * Utilitaire : obtenir valeur imbriquée
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Utilitaire : définir valeur imbriquée
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Créer un adaptateur pour une API spécifique
   */
  createApiAdapter(apiConfig: { baseUrl: string; format: string }): any {
    return {
      adapt: (data: any) => this.adaptRegistrationData(data, apiConfig.format),
      validate: (data: any) => this.validateAdaptedData(data, apiConfig.format),
      send: async (data: any) => {
        const adapted = this.adaptRegistrationData(data, apiConfig.format);
        const validation = this.validateAdaptedData(adapted, apiConfig.format);
        
        if (!validation.valid) {
          throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
        }

        return await this.http.post(`${apiConfig.baseUrl}/register`, adapted).toPromise();
      }
    };
  }

  /**
   * Migrer des données en masse
   */
  async batchMigration(
    sourceData: any[], 
    sourceFormat: string, 
    targetFormat: string,
    batchSize: number = 10
  ): Promise<{ success: number; errors: any[] }> {
    
    const results = { success: 0, errors: [] as any[] };
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item, index) => {
        try {
          const adapted = this.adaptUserData(item, sourceFormat, targetFormat);
          const validation = this.validateAdaptedData(adapted, targetFormat);
          
          if (validation.valid) {
            results.success++;
            return { success: true, data: adapted, originalIndex: i + index };
          } else {
            results.errors.push({
              index: i + index,
              error: 'Validation failed',
              details: validation.errors,
              original: item
            });
            return { success: false };
          }
        } catch (error) {
          results.errors.push({
            index: i + index,
            error: error instanceof Error ? error.message : 'Unknown error',
            original: item
          });
          return { success: false };
        }
      });

      await Promise.all(batchPromises);
      
      // Pause entre les batches
      if (i + batchSize < sourceData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`📊 Migration batch: ${results.success} réussies, ${results.errors.length} erreurs`);
    return results;
  }

  /**
   * Obtenir les configurations disponibles
   */
  getAvailableConfigs(): string[] {
    return Object.keys(this.predefinedConfigs);
  }

  /**
   * Obtenir la configuration actuelle
   */
  getCurrentConfig(): AdapterConfig {
    return this.currentConfig.value;
  }

  /**
   * Tester l'adaptation avec des données exemple
   */
  testAdaptation(sampleData: any, targetFormat: string): { success: boolean; result?: any; error?: string } {
    try {
      const adapted = this.adaptRegistrationData(sampleData, targetFormat);
      const validation = this.validateAdaptedData(adapted, targetFormat);
      
      return {
        success: validation.valid,
        result: adapted,
        error: validation.valid ? undefined : validation.errors.join(', ')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de test'
      };
    }
  }

  /**
   * Générer un rapport de compatibilité
   */
  generateCompatibilityReport(sourceData: any, targetFormats: string[]): any {
    const report = {
      sourceData,
      timestamp: new Date().toISOString(),
      results: {} as any
    };

    targetFormats.forEach(format => {
      report.results[format] = this.testAdaptation(sourceData, format);
    });

    return report;
  }
}