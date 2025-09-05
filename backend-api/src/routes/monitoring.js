// src/routes/monitoring.js
const express = require('express');
const router = express.Router();
const rateLimitMonitor = require('../middleware/rateLimitMonitor');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 📊 Endpoint pour obtenir les statistiques de rate limiting (Admin seulement)
router.get('/rate-limit-stats', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const stats = rateLimitMonitor.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        serverUptime: process.uptime(),
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de rate limiting:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// 🚨 Endpoint pour obtenir la liste des IPs suspectes (Admin seulement)
router.get('/suspicious-ips', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const stats = rateLimitMonitor.getStats();
    
    res.json({
      success: true,
      data: {
        suspiciousIPs: stats.topSuspiciousIPs,
        totalCount: stats.suspiciousIPsCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des IPs suspectes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// 🧹 Endpoint pour nettoyer manuellement le cache de monitoring (Admin seulement)
router.post('/cleanup-monitoring', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    rateLimitMonitor.cleanup();
    
    res.json({
      success: true,
      message: 'Nettoyage du monitoring effectué avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage du monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage'
    });
  }
});

// 🔄 Endpoint pour réinitialiser complètement le monitoring (Admin seulement - usage en développement)
router.post('/reset-monitoring', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Action non autorisée en production'
      });
    }
    
    rateLimitMonitor.reset();
    
    res.json({
      success: true,
      message: 'Monitoring réinitialisé avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation'
    });
  }
});

module.exports = router;
