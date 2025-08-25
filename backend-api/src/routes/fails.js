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

// GET /api/fails/public - Récupérer tous les fails avec anonymisation conditionnelle
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
    
    // Récupérer TOUS les fails avec les infos utilisateur pour l'anonymisation
    const query = `
      SELECT 
        f.id, 
        f.user_id, 
        f.title, 
        f.description, 
        f.category, 
        f.image_url, 
        f.is_public, 
        f.created_at, 
        f.updated_at,
        f.comments_count,
        f.reactions,
        u.email,
        p.username,
        p.display_name,
        p.avatar_url
      FROM fails f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN profiles p ON f.user_id = p.user_id
      ORDER BY f.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const fails = await executeQuery(query, []);
    
    // Traiter le résultat - anonymiser conditionnellement selon is_public
    const processed = Array.isArray(fails) ? fails.map(fail => ({
      id: fail.id,
      title: fail.title,
      description: fail.description,
      category: fail.category,
      imageUrl: fail.image_url,
      is_public: !!fail.is_public,
      commentsCount: fail.comments_count || 0,
      reactions: fail.reactions ? JSON.parse(fail.reactions) : { courage: 0, empathy: 0, laugh: 0, support: 0 },
      createdAt: fail.created_at,
      // Anonymisation conditionnelle :
      // Si is_public = 1 (public) : afficher pseudo/avatar
      // Si is_public = 0 (anonyme) : masquer pseudo/avatar
      authorId: fail.user_id,
      authorName: fail.is_public ? (fail.display_name || fail.username || 'Utilisateur') : 'Anonyme',
      authorAvatar: fail.is_public ? (fail.avatar_url || 'assets/profil/face.png') : 'assets/profil/anonymous.png'
    })) : [];

    console.log(`📊 Récupération fails publics: ${processed.length} fails trouvés`);
    res.json(processed);
  } catch (error) {
    console.error('❌ Erreur récupération fails publics:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des fails"
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
