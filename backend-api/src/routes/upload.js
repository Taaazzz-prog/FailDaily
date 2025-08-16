const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Créer le dossier uploads s'il n'existe pas
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configuration multer pour les images de fails
const failImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/fails');
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `fail-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Configuration multer pour les avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Filtre de fichiers (images seulement)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

// Limitations de taille
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB max
};

// Middleware upload pour images de fails
const uploadFailImage = multer({
  storage: failImageStorage,
  fileFilter: fileFilter,
  limits: limits
}).single('image');

// Middleware upload pour avatars
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max pour avatars
  }
}).single('avatar');

/**
 * POST /api/upload/image
 * Upload d'une image pour un fail
 */
router.post('/image', authenticateToken, (req, res) => {
  uploadFailImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Fichier trop volumineux (max 5MB)',
          code: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'upload',
        code: 'UPLOAD_ERROR'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        code: 'INVALID_FILE'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
        code: 'NO_FILE'
      });
    }

    // Construire l'URL publique
    const imageUrl = `/uploads/fails/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        imageUrl: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  });
});

/**
 * POST /api/upload/avatar
 * Upload d'un avatar utilisateur
 */
router.post('/avatar', authenticateToken, (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Fichier trop volumineux (max 2MB)',
          code: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'upload',
        code: 'UPLOAD_ERROR'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        code: 'INVALID_FILE'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
        code: 'NO_FILE'
      });
    }

    try {
      // Mettre à jour l'avatar dans la base de données
      const { executeQuery } = require('../config/database');
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      await executeQuery(
        'UPDATE profiles SET avatar_url = ?, updated_at = NOW() WHERE user_id = ?',
        [avatarUrl, req.user.id]
      );

      res.json({
        success: true,
        message: 'Avatar mis à jour avec succès',
        data: {
          avatarUrl: avatarUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour avatar:', error);
      
      // Supprimer le fichier en cas d'erreur
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('❌ Erreur suppression fichier:', unlinkError);
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'avatar',
        code: 'DATABASE_ERROR'
      });
    }
  });
});

/**
 * DELETE /api/upload/image/:filename
 * Supprimer une image uploadée
 */
router.delete('/image/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Vérifier que le nom de fichier est sécurisé
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Nom de fichier invalide',
        code: 'INVALID_FILENAME'
      });
    }

    const filePath = path.join(__dirname, '../../uploads/fails', filename);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Supprimer le fichier
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      code: 'DELETION_ERROR'
    });
  }
});

/**
 * GET /api/upload/info/:filename
 * Récupérer les informations d'un fichier uploadé
 */
router.get('/info/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Vérifier que le nom de fichier est sécurisé
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Nom de fichier invalide',
        code: 'INVALID_FILENAME'
      });
    }

    // Chercher dans les deux dossiers
    const failPath = path.join(__dirname, '../../uploads/fails', filename);
    const avatarPath = path.join(__dirname, '../../uploads/avatars', filename);
    
    let filePath = null;
    let type = null;

    if (fs.existsSync(failPath)) {
      filePath = failPath;
      type = 'fail';
    } else if (fs.existsSync(avatarPath)) {
      filePath = avatarPath;
      type = 'avatar';
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
        code: 'FILE_NOT_FOUND'
      });
    }

    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      data: {
        filename: filename,
        type: type,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      }
    });

  } catch (error) {
    console.error('❌ Erreur info fichier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations',
      code: 'INFO_ERROR'
    });
  }
});

module.exports = router;
