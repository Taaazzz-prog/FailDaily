const express = require('express');
const router = express.Router();
const ReactionsController = require('../controllers/reactionsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * POST /api/fails/:id/reactions
 * Ajouter ou modifier une réaction à un fail
 */
router.post('/:id/reactions', authenticateToken, ReactionsController.addReaction);

/**
 * DELETE /api/fails/:id/reactions
 * Supprimer la réaction de l'utilisateur pour un fail
 */
router.delete('/:id/reactions', authenticateToken, ReactionsController.removeReaction);

/**
 * GET /api/fails/:id/reactions
 * Récupérer toutes les réactions d'un fail
 */
router.get('/:id/reactions', optionalAuth, ReactionsController.getReactions);

/**
 * GET /api/user/reactions/stats
 * Récupérer les statistiques des réactions de l'utilisateur
 */
router.get('/user/reactions/stats', authenticateToken, ReactionsController.getUserReactionStats);

module.exports = router;
