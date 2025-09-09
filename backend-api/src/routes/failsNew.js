const express = require('express');
const router = express.Router();
const FailsController = require('../controllers/failsController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/fails - Récupérer les fails (avec pagination et filtres) - PROTÉGÉ
router.get('/', authenticateToken, FailsController.getFails);

// GET /api/fails/search - Rechercher des fails - PROTÉGÉ
router.get('/search', authenticateToken, FailsController.searchFails);

// GET /api/fails/categories - Récupérer les catégories
router.get('/categories', FailsController.getCategories);

// GET /api/fails/stats - Récupérer les statistiques des fails - PROTÉGÉ
router.get('/stats', authenticateToken, FailsController.getFailsStats);

// GET /api/fails/public - Récupérer uniquement les fails publics - PROTÉGÉ
router.get('/public', authenticateToken, FailsController.getPublicFails);

// POST /api/fails - Créer un fail
router.post('/', authenticateToken, FailsController.createFail);

// GET /api/fails/:id - Récupérer un fail spécifique - PROTÉGÉ
router.get('/:id', authenticateToken, FailsController.getFailByIdEndpoint);

// PUT /api/fails/:id - Modifier un fail
router.put('/:id', authenticateToken, FailsController.updateFail);

// DELETE /api/fails/:id - Supprimer un fail
router.delete('/:id', authenticateToken, FailsController.deleteFail);

// POST /api/fails/:id/report - Signaler un fail (compte pour modération)
router.post('/:id/report', authenticateToken, (req, res) => FailsController.reportFail(req, res));

module.exports = router;
