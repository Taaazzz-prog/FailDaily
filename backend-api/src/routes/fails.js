const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createFail, getFails, getFailById, updateFail, deleteFail } = require('../controllers/failController');
const CommentsController = require('../controllers/commentsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

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

// GET /api/fails/public - Récupérer uniquement les fails anonymes (is_public = 1)
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Validation des paramètres
    if (isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Paramètre page invalide"
      });
    }
    
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Paramètre limit invalide (1-100)"
      });
    }
    
    // Construire la requête avec interpolation directe pour éviter les problèmes de liaison
    // is_public = 1 signifie "affiché anonymement" (pas d'identité auteur visible)
    const query = `SELECT id, user_id, title, description, category, image_url, is_public, created_at, updated_at FROM fails WHERE is_public = 1 ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const fails = await executeQuery(query, []);
    
    // Traiter le résultat - anonymiser les données sensibles pour les fails publics
    const processed = Array.isArray(fails) ? fails.map(fail => ({
      id: fail.id,
      title: fail.title,
      description: fail.description,
      category: fail.category,
      image_url: fail.image_url,
      is_public: !!fail.is_public,
      created_at: fail.created_at,
      // user_id et updated_at omis pour préserver l'anonymat
    })) : [];

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
