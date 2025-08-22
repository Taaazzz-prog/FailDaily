const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createFail, getFails, getFailById, updateFail, deleteFail } = require('../controllers/failController');
const CommentsController = require('../controllers/commentsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'fail-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accepter seulement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 // 5MB par défaut
  }
});

// POST /api/fails - Créer un fail
router.post('/', authenticateToken, upload.single('image'), createFail);

// GET /api/fails - Récupérer les fails (avec pagination et filtres)
router.get('/', authenticateToken, getFails);

// GET /api/fails/public - Récupérer uniquement les fails publics (sans authentification)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { executeQuery } = require('../config/database');
    const query = `
      SELECT id, user_id, title, description, category, image_url, is_public,
             created_at, updated_at
      FROM fails
      WHERE is_public = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const fails = await executeQuery(query, [limitNum, offset]);
    const processed = fails.map(fail => ({
      ...fail,
      is_public: !!fail.is_public
    }));

    res.json(processed);
  } catch (error) {
    console.error('❌ Erreur récupération fails publics:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des fails publics"
    });
  }
});

// GET /api/fails/:id - Récupérer un fail spécifique
router.get('/:id', authenticateToken, getFailById);

// PUT /api/fails/:id - Modifier un fail
router.put('/:id', authenticateToken, updateFail);

// DELETE /api/fails/:id - Supprimer un fail
router.delete('/:id', authenticateToken, deleteFail);

// GET /api/fails/:id/comments - Récupérer les commentaires d'un fail
router.get('/:id/comments', authenticateToken, CommentsController.getComments);

// POST /api/fails/:id/comments - Ajouter un commentaire
router.post('/:id/comments', authenticateToken, CommentsController.addComment);

module.exports = router;
