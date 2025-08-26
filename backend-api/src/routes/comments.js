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

/**
 * POST /api/fails/:id/comments/:commentId/like
 * Ajouter un like sur un commentaire
 */
router.post('/:id/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    await CommentsController.ensureAuxTables();

    const { commentId } = req.params;
    const userId = req.user.id;

    // Check comment exists and author id
    const rows = await require('../config/database').executeQuery('SELECT id, user_id FROM comments WHERE id = ? LIMIT 1', [commentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });

    const targetUserId = rows[0].user_id;

    // Insert reaction if not exists
    const id = require('uuid').v4();
    try {
      await require('../config/database').executeQuery(
        'INSERT INTO comment_reactions (id, comment_id, user_id, type, created_at) VALUES (?, ?, ?, ?, NOW())',
        [id, commentId, userId, 'like']
      );
      // Award 1 point to comment author (if not self-like still award based on requirement?)
      const pointsCfg = await CommentsController.getPointsConfig();
      if (pointsCfg.commentLikeReward > 0) {
        await CommentsController.awardCouragePoints(targetUserId, pointsCfg.commentLikeReward);
      }
    } catch (_) { /* likely duplicate, ignore */ }

    const [{ likes }] = await require('../config/database').executeQuery(
      'SELECT COUNT(*) AS likes FROM comment_reactions WHERE comment_id = ?',[commentId]
    );
    res.json({ success: true, likes });
  } catch (error) {
    console.error('❌ like comment error:', error);
    res.status(500).json({ success: false, message: 'Erreur like commentaire' });
  }
});

/**
 * DELETE /api/fails/:id/comments/:commentId/like
 * Retirer un like
 */
router.delete('/:id/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    await CommentsController.ensureAuxTables();
    const { commentId } = req.params;
    const userId = req.user.id;
    await require('../config/database').executeQuery(
      'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ? LIMIT 1',
      [commentId, userId]
    );
    const [{ likes }] = await require('../config/database').executeQuery(
      'SELECT COUNT(*) AS likes FROM comment_reactions WHERE comment_id = ?',[commentId]
    );
    res.json({ success: true, likes });
  } catch (error) {
    console.error('❌ unlike comment error:', error);
    res.status(500).json({ success: false, message: 'Erreur unlike commentaire' });
  }
});

/**
 * POST /api/fails/:id/comments/:commentId/report
 * Signaler un commentaire
 */
router.post('/:id/comments/:commentId/report', authenticateToken, async (req, res) => {
  try {
    await CommentsController.ensureAuxTables();
    const { commentId } = req.params;
    const userId = req.user.id;
    const reason = (req.body && req.body.reason) || null;

    const exists = await require('../config/database').executeQuery('SELECT id FROM comments WHERE id = ? LIMIT 1', [commentId]);
    if (exists.length === 0) return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });

    try {
      const id = require('uuid').v4();
      await require('../config/database').executeQuery(
        'INSERT INTO comment_reports (id, comment_id, user_id, reason, created_at) VALUES (?, ?, ?, ?, NOW())',
        [id, commentId, userId, reason]
      );
    } catch (_) { /* duplicate */ }

    const db = require('../config/database');
    const [{ reports }] = await db.executeQuery('SELECT COUNT(*) AS reports FROM comment_reports WHERE comment_id = ?', [commentId]);
    // Threshold (default 1): hide when reached
    let threshold = 1;
    try {
      const row = await db.executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']);
      if (row && row[0]) {
        const cfg = JSON.parse(row[0].value || '{}');
        threshold = Number(cfg.commentReportThreshold) || 1;
      }
    } catch {}
    if (reports >= threshold) {
      await db.executeQuery(
        'INSERT INTO comment_moderation (comment_id, status, created_at, updated_at) VALUES (?, "hidden", NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()',
        [commentId]
      );
    }

    res.json({ success: true, reports });
  } catch (error) {
    console.error('❌ report comment error:', error);
    res.status(500).json({ success: false, message: 'Erreur signalement commentaire' });
  }
});

module.exports = router;
