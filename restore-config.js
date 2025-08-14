// Script de restauration d'urgence - à exécuter dans la console du navigateur
const adminService = window.ng?.getComponent(document.querySelector('ion-app'))?.adminService;
if (adminService) {
    adminService.restoreEssentialConfigurations()
        .then(() => console.log('✅ Configurations restaurées avec succès'))
        .catch(err => console.error('❌ Erreur restauration:', err));
} else {
    console.error('AdminService non trouvé');
}
