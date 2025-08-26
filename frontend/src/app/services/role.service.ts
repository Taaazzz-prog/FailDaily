import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { UserRole, RolePermissions, ROLE_PERMISSIONS } from '../models/user-role.model';

@Injectable({
    providedIn: 'root'
})
export class RoleService {

    constructor() { }

    private normalizeRole(role: any): UserRole {
        const r = String(role || '').toLowerCase().trim();
        if (['super_admin', 'super-admin', 'superadmin', 'owner', 'root'].includes(r)) {
            return UserRole.SUPER_ADMIN;
        }
        if (['admin', 'administrator'].includes(r)) {
            return UserRole.ADMIN;
        }
        if (['moderator', 'mod'].includes(r)) {
            return UserRole.MODERATOR;
        }
        if (Object.values<string>(UserRole as any).includes(r)) {
            return r as UserRole;
        }
        return UserRole.USER;
    }

    /**
     * Obtenir les permissions d'un utilisateur basées sur son rôle
     */
    getUserPermissions(user: User | null): RolePermissions {
        if (!user) {
            return ROLE_PERMISSIONS[UserRole.USER]; // Permissions par défaut pour les non-connectés
        }

        const normalized = this.normalizeRole(user.role);
        return ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS[UserRole.USER];
    }

    /**
     * Vérifier si un utilisateur a une permission spécifique
     */
    hasPermission(user: User | null, permission: keyof RolePermissions): boolean {
        const permissions = this.getUserPermissions(user);
        return permissions[permission];
    }

    /**
     * Vérifier si un utilisateur a le rôle admin
     */
    isAdmin(user: User | null): boolean {
        return this.normalizeRole(user?.role) === UserRole.ADMIN;
    }

    /**
     * Vérifier si un utilisateur a le rôle super admin
     */
    isSuperAdmin(user: User | null): boolean {
        return this.normalizeRole(user?.role) === UserRole.SUPER_ADMIN;
    }

    /**
     * Vérifier si un utilisateur a le rôle modérateur ou plus
     */
    isModerator(user: User | null): boolean {
        const r = this.normalizeRole(user?.role);
        return r === UserRole.MODERATOR || r === UserRole.ADMIN || r === UserRole.SUPER_ADMIN;
    }    /**
     * Vérifier si un utilisateur peut accéder au panel admin
     */
    canAccessAdmin(user: User | null): boolean {
        return this.hasPermission(user, 'canAccessAdmin');
    }

    /**
     * Obtenir la liste de tous les rôles disponibles
     */
    getAllRoles(): UserRole[] {
        return Object.values(UserRole);
    }

    /**
     * Obtenir le libellé d'un rôle en français
     */
    getRoleLabel(role: UserRole): string {
        const labels = {
            [UserRole.USER]: 'Utilisateur',
            [UserRole.MODERATOR]: 'Modérateur',
            [UserRole.ADMIN]: 'Administrateur',
            [UserRole.SUPER_ADMIN]: 'Super Administrateur'
        };
        return labels[role];
    }    /**
     * Obtenir la couleur associée à un rôle pour l'affichage
     */
    getRoleColor(role: UserRole): string {
        const colors = {
            [UserRole.USER]: 'primary',
            [UserRole.MODERATOR]: 'warning',
            [UserRole.ADMIN]: 'danger',
            [UserRole.SUPER_ADMIN]: 'dark'
        };
        return colors[role];
    }

    /**
     * Vérifier si un rôle est supérieur à un autre
     */
    isHigherRole(roleA: UserRole, roleB: UserRole): boolean {
        const hierarchy = {
            [UserRole.USER]: 1,
            [UserRole.MODERATOR]: 2,
            [UserRole.ADMIN]: 3,
            [UserRole.SUPER_ADMIN]: 4
        };
        return hierarchy[roleA] > hierarchy[roleB];
    }
}
