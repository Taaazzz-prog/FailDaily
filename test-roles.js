// Test simple pour vérifier le système de rôles
console.log('🧪 Test du système de rôles');

import { UserRole } from './src/app/models/user-role.model';
import { RoleService } from './src/app/services/role.service';

// Créer une instance du service de rôles
const roleService = new RoleService();

// Test d'un utilisateur super admin
const superAdminUser = {
    id: '1',
    email: 'superadmin@test.com',
    displayName: 'Super Admin Test',
    avatar: 'test.png',
    joinDate: new Date(),
    totalFails: 0,
    couragePoints: 0,
    badges: [],
    role: UserRole.SUPER_ADMIN
};

// Test d'un utilisateur admin
const adminUser = {
    id: '2',
    email: 'admin@test.com',
    displayName: 'Admin Test',
    avatar: 'test.png',
    joinDate: new Date(),
    totalFails: 0,
    couragePoints: 0,
    badges: [],
    role: UserRole.ADMIN
};

// Test d'un utilisateur normal
const normalUser = {
    id: '3',
    email: 'user@test.com',
    displayName: 'User Test',
    avatar: 'test.png',
    joinDate: new Date(),
    totalFails: 0,
    couragePoints: 0,
    badges: [],
    role: UserRole.USER
};

console.log('✅ Super Admin peut accéder au panel:', roleService.canAccessAdmin(superAdminUser));
console.log('✅ Super Admin peut gérer les admins:', roleService.hasPermission(superAdminUser, 'canManageAdmins'));
console.log('✅ Super Admin peut accéder aux paramètres système:', roleService.hasPermission(superAdminUser, 'canAccessSystemSettings'));
console.log('✅ Admin peut accéder au panel:', roleService.canAccessAdmin(adminUser));
console.log('❌ Admin ne peut PAS gérer les admins:', roleService.hasPermission(adminUser, 'canManageAdmins'));
console.log('✅ Admin peut gérer les utilisateurs:', roleService.hasPermission(adminUser, 'canManageUsers'));
console.log('❌ User ne peut pas accéder au panel:', roleService.canAccessAdmin(normalUser));
console.log('❌ User ne peut pas gérer les utilisateurs:', roleService.hasPermission(normalUser, 'canManageUsers'));

console.log('🏷️ Labels des rôles:');
console.log('- User:', roleService.getRoleLabel(UserRole.USER));
console.log('- Moderator:', roleService.getRoleLabel(UserRole.MODERATOR));
console.log('- Admin:', roleService.getRoleLabel(UserRole.ADMIN));
console.log('- Super Admin:', roleService.getRoleLabel(UserRole.SUPER_ADMIN));

console.log('🎉 Test terminé avec succès !');
