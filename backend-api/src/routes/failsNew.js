const express = require('express');
const router = express.Router();
const FailsController = require('../controllers/failsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

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

// GET /api/fails/public - Récupérer uniquement les fails publics
router.get('/public', optionalAuth, FailsController.getPublicFails);

// POST /api/fails - Créer un fail
router.post('/', authenticateToken, FailsController.createFail);

// GET /api/fails/:id - Récupérer un fail spécifique
router.get('/:id', optionalAuth, FailsController.getFailByIdEndpoint);

// PUT /api/fails/:id - Modifier un fail
router.put('/:id', authenticateToken, FailsController.updateFail);

// DELETE /api/fails/:id - Supprimer un fail
router.delete('/:id', authenticateToken, FailsController.deleteFail);

// POST /api/fails/:id/report - Signaler un fail (compte pour modération)
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details } = req.body || {};
    await executeQuery(
      'INSERT INTO system_logs (level, message, details, user_id, action, created_at) VALUES (?,?,?,?,?,NOW())',
      [
        'warning',
        `Fail reported` ,
        JSON.stringify({ failId: id, reason: reason || null, extra: details || null }),
        req.user.id,
        'fail_report'
      ]
    );
    res.json({ success: true, message: 'Signalement enregistré' });
  } catch (error) {
    console.error('❌ Error reporting fail:', error);
    res.status(500).json({ success: false, message: "Erreur lors du signalement" });
  }
});

module.exports = router;
