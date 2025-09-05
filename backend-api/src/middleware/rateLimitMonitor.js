// ==========================================
// 🛡️ RATE LIMITING MONITOR - FAILDAILY
// ==========================================
// Monitoring avancé et alertes pour rate limiting

const fs = require('fs').promises;
const path = require('path');

class RateLimitMonitor {
  constructor() {
    this.alertThreshold = parseInt(process.env.RATE_LIMIT_ALERT_THRESHOLD) || 80;
    this.loggingEnabled = process.env.RATE_LIMIT_LOGGING === 'true';
    this.alertsEnabled = process.env.RATE_LIMIT_ALERTS === 'true';
    this.suspiciousIPs = new Map(); // Tracking des IPs suspectes
    this.logPath = path.join(__dirname, '../logs/rate-limits.log');
  }

  /**
   * Log des événements de rate limiting
   */
  async logRateLimit(type, ip, path, userAgent, remaining, limit) {
    if (!this.loggingEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type, // 'ddos', 'auth', 'upload', 'global'
      ip,
      path,
      userAgent: userAgent?.substring(0, 100), // Limiter la taille
      remaining,
      limit,
      percentage: ((limit - remaining) / limit * 100).toFixed(1)
    };

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.logPath, logLine);
      
      // Alerte si seuil critique atteint
      if (logEntry.percentage >= this.alertThreshold) {
        this.triggerAlert(logEntry);
      }

      // Tracking IP suspecte
      this.trackSuspiciousIP(ip, type);
      
    } catch (error) {
      console.error('❌ Erreur logging rate limit:', error);
    }
  }

  /**
   * Détection d'IPs suspectes (pattern d'attaque)
   */
  trackSuspiciousIP(ip, type) {
    if (!this.suspiciousIPs.has(ip)) {
      this.suspiciousIPs.set(ip, { 
        hits: 0, 
        types: new Set(), 
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }

    const ipData = this.suspiciousIPs.get(ip);
    ipData.hits++;
    ipData.types.add(type);
    ipData.lastSeen = Date.now();

    // IP suspecte si :
    // - Plus de 5 rate limits en 10 minutes
    // - Rate limits sur multiple types d'endpoints
    const timeDiff = (Date.now() - ipData.firstSeen) / (1000 * 60); // minutes
    if (ipData.hits >= 5 && timeDiff <= 10) {
      this.flagSuspiciousIP(ip, ipData);
    }
  }

  /**
   * Marquer une IP comme suspecte
   */
  async flagSuspiciousIP(ip, ipData) {
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'SUSPICIOUS_IP',
      ip,
      hits: ipData.hits,
      attackTypes: Array.from(ipData.types),
      duration: `${((ipData.lastSeen - ipData.firstSeen) / (1000 * 60)).toFixed(1)} minutes`,
      recommendation: 'Consider IP blocking or additional monitoring'
    };

    console.warn('🚨 IP SUSPECTE DÉTECTÉE:', alert);
    
    try {
      const alertLine = JSON.stringify(alert) + '\n';
      await fs.appendFile(
        path.join(__dirname, '../logs/security-alerts.log'), 
        alertLine
      );
    } catch (error) {
      console.error('❌ Erreur logging IP suspecte:', error);
    }
  }

  /**
   * Déclencher une alerte
   */
  triggerAlert(logEntry) {
    if (!this.alertsEnabled) return;

    console.warn(`⚠️ RATE LIMIT ALERT: ${logEntry.type.toUpperCase()}`, {
      ip: logEntry.ip,
      path: logEntry.path,
      usage: `${logEntry.percentage}%`,
      remaining: logEntry.remaining,
      limit: logEntry.limit
    });
  }

  /**
   * Middleware pour Express
   */
  middleware() {
    return (req, res, next) => {
      const originalSend = res.send;
      const monitor = this;

      res.send = function(data) {
        // Capturer les headers de rate limiting
        const remaining = res.get('RateLimit-Remaining');
        const limit = res.get('RateLimit-Limit');
        
        if (res.statusCode === 429 || (remaining && limit)) {
          // Déterminer le type de rate limit basé sur le path
          let type = 'global';
          if (req.path.includes('/auth/')) type = 'auth';
          else if (req.path.includes('/upload')) type = 'upload';
          else if (remaining && parseInt(remaining) < parseInt(limit) * 0.1) type = 'ddos';

          monitor.logRateLimit(
            type,
            req.ip,
            req.path,
            req.get('User-Agent'),
            parseInt(remaining) || 0,
            parseInt(limit) || 0
          );
        }

        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Nettoyer les données anciennes (à exécuter périodiquement)
   */
  cleanup() {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > tenMinutes) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  /**
   * Obtenir les statistiques de monitoring
   */
  getStats() {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      alertThreshold: this.alertThreshold,
      loggingEnabled: this.loggingEnabled,
      alertsEnabled: this.alertsEnabled
    };
  }
}

// Instance unique
const rateLimitMonitor = new RateLimitMonitor();

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
  rateLimitMonitor.cleanup();
}, 5 * 60 * 1000);

module.exports = rateLimitMonitor;
