const express = require('express');
const router = express.Router();
const CommentsController = require('../controllers/commentsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * POST /api/fails/:id/comments
 * Ajouter un commentaire à un fail
 */
router.post('/:id/comments', authenticateToken, CommentsController.addComment);

/**
 * GET /api/fails/:id/comments
 * Récupérer tous les commentaires d'un fail
 */
router.get('/:id/comments', optionalAuth, CommentsController.getComments);

/**
 * PUT /api/fails/:id/comments/:commentId
 * Modifier un commentaire
 */
router.put('/:id/comments/:commentId', authenticateToken, CommentsController.updateComment);

/**
 * DELETE /api/fails/:id/comments/:commentId
 * Supprimer un commentaire
 */
router.delete('/:id/comments/:commentId', authenticateToken, CommentsController.deleteComment);

/**
 * GET /api/user/comments/stats
 * Récupérer les statistiques des commentaires de l'utilisateur
 */
router.get('/user/comments/stats', authenticateToken, CommentsController.getUserCommentStats);

module.exports = router;
