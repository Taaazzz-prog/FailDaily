export enum UserRole {
    USER = 'user',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin'
}

export interface RolePermissions {
    canDeletePosts: boolean;
    canBanUsers: boolean;
    canManageBadges: boolean;
    canAccessAdmin: boolean;
    canModerateComments: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canManageAdmins: boolean; // ✅ Nouveau : gérer les autres admins
    canAccessSystemSettings: boolean; // ✅ Nouveau : accès aux paramètres système
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    [UserRole.USER]: {
        canDeletePosts: false,
        canBanUsers: false,
        canManageBadges: false,
        canAccessAdmin: false,
        canModerateComments: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canManageAdmins: false,
        canAccessSystemSettings: false
    },
    [UserRole.MODERATOR]: {
        canDeletePosts: true,
        canBanUsers: false,
        canManageBadges: false,
        canAccessAdmin: false,
        canModerateComments: true,
        canViewAnalytics: true,
        canManageUsers: false,
        canManageAdmins: false,
        canAccessSystemSettings: false
    },
    [UserRole.ADMIN]: {
        canDeletePosts: true,
        canBanUsers: true,
        canManageBadges: true,
        canAccessAdmin: true,
        canModerateComments: true,
        canViewAnalytics: true,
        canManageUsers: true,
        canManageAdmins: false,
        canAccessSystemSettings: false
    },
    [UserRole.SUPER_ADMIN]: {
        canDeletePosts: true,
        canBanUsers: true,
        canManageBadges: true,
        canAccessAdmin: true,
        canModerateComments: true,
        canViewAnalytics: true,
        canManageUsers: true,
        canManageAdmins: true, // ✅ Peut gérer les autres admins
        canAccessSystemSettings: true // ✅ Accès complet aux paramètres système
    }
};
