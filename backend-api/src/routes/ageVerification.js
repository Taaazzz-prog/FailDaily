const express = require('express');
const AgeVerificationController = require('../controllers/ageVerificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Route publique pour vérifier l'âge
router.post('/verify', AgeVerificationController.verifyAge);

// Routes protégées (nécessitent une authentification)
router.put('/update-birth-date', authenticateToken, AgeVerificationController.updateBirthDate);
router.get('/user-age', authenticateToken, AgeVerificationController.getUserAge);
router.get('/statistics', authenticateToken, AgeVerificationController.getAgeStatistics);
router.get('/coppa-compliance', authenticateToken, AgeVerificationController.checkCoppaCompliance);

module.exports = router;
