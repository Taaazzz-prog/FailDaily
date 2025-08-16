const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createFail, getFails, getFailById, deleteFail } = require('../controllers/failController');
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

// GET /api/fails/:id - Récupérer un fail spécifique
router.get('/:id', authenticateToken, getFailById);

// PUT /api/fails/:id - Modifier un fail (placeholder)
router.put('/:id', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Fail update endpoint - implementation en cours'
  });
});

// DELETE /api/fails/:id - Supprimer un fail
router.delete('/:id', authenticateToken, deleteFail);

// GET /api/fails/:id/comments - Récupérer les commentaires d'un fail (placeholder)
router.get('/:id/comments', authenticateToken, (req, res) => {
  res.json({
    comments: [],
    message: 'Comments endpoint - implementation en cours'
  });
});

// POST /api/fails/:id/comments - Ajouter un commentaire (placeholder)
router.post('/:id/comments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    comment: {
      id: Date.now(),
      content: req.body.content,
      author: req.user.email,
      created_at: new Date()
    },
    message: 'Comment creation endpoint - implementation en cours'
  });
});

module.exports = router;
