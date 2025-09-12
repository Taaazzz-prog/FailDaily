import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Avatar {
    name: string;
    url: string;
    isDefault: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AvatarService {

    private readonly avatarPath = '/assets/profil/';
    private readonly defaultAvatar = 'face.png';

    constructor(private http: HttpClient) { }

    /**
     * Obtenir tous les avatars disponibles dans le dossier assets/profil
     * Cette méthode lit le fichier avatars-list.json et vérifie que chaque image existe
     */
    async getAvailableAvatars(): Promise<Avatar[]> {
        try {
            // Lire la liste des avatars depuis le fichier JSON
            const response = await this.http.get<string[]>('/assets/profil/avatars-list.json').toPromise();
            const avatarNames = response || [];

            const availableAvatars: Avatar[] = [];

            // Tester chaque image pour voir si elle existe
            for (const avatarName of avatarNames) {
                const avatarUrl = this.avatarPath + avatarName;
                const exists = await this.checkImageExists(avatarUrl);

                if (exists) {
                    availableAvatars.push({
                        name: avatarName,
                        url: avatarUrl,
                        isDefault: avatarName === this.defaultAvatar
                    });
                }
            }

            // Si aucun avatar n'est trouvé, au moins retourner l'avatar par défaut
            if (availableAvatars.length === 0) {
                availableAvatars.push({
                    name: this.defaultAvatar,
                    url: this.avatarPath + this.defaultAvatar,
                    isDefault: true
                });
            }

            console.log(`✅ ${availableAvatars.length} avatars trouvés:`, availableAvatars.map(a => a.name));
            return availableAvatars;

        } catch (error) {
            console.error('Erreur lors du chargement de la liste des avatars:', error);

            // En cas d'erreur, retourner au moins l'avatar par défaut
            return [{
                name: this.defaultAvatar,
                url: this.avatarPath + this.defaultAvatar,
                isDefault: true
            }];
        }
    }    /**
     * Vérifier si une image existe en tentant de la charger
     */
    private checkImageExists(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;

            // Timeout après 2 secondes
            setTimeout(() => resolve(false), 2000);
        });
    }

    /**
     * Obtenir l'URL de l'avatar par défaut
     */
    getDefaultAvatar(): string {
        return this.avatarPath + this.defaultAvatar;
    }

    /**
     * Vérifier si un avatar est l'avatar par défaut
     */
    isDefaultAvatar(avatarUrl: string): boolean {
        return avatarUrl.includes(this.defaultAvatar);
    }
}
