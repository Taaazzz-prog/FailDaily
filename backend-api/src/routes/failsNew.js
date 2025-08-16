const express = require('express');
const router = express.Router();
const FailsController = require('../controllers/failsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// GET /api/fails - Récupérer les fails (avec pagination et filtres)
router.get('/', optionalAuth, FailsController.getFails);

// GET /api/fails/search - Rechercher des fails
router.get('/search', optionalAuth, FailsController.searchFails);

// GET /api/fails/categories - Récupérer les catégories
router.get('/categories', FailsController.getCategories);

// GET /api/fails/tags - Récupérer les tags populaires
router.get('/tags', FailsController.getPopularTags);

// GET /api/fails/stats - Récupérer les statistiques des fails
router.get('/stats', optionalAuth, FailsController.getFailsStats);

// POST /api/fails - Créer un fail
router.post('/', authenticateToken, FailsController.createFail);

// GET /api/fails/:id - Récupérer un fail spécifique
router.get('/:id', optionalAuth, FailsController.getFailByIdEndpoint);

// PUT /api/fails/:id - Modifier un fail
router.put('/:id', authenticateToken, FailsController.updateFail);

// DELETE /api/fails/:id - Supprimer un fail
router.delete('/:id', authenticateToken, FailsController.deleteFail);

module.exports = router;
