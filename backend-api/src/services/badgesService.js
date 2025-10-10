const { executeQuery } = require('../config/database');
const { sendPushToUser } = require('../utils/push');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeLoginDayValue(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }

  const stringValue = String(value).trim();
  if (!stringValue) return null;

  const timestamp = Date.parse(`${stringValue}T00:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

async function getDistinctLoginDayValues(userId) {
  try {
    const rows = await executeQuery(
      `SELECT DATE(created_at) AS login_day
       FROM request_logs
       WHERE user_id = ?
         AND method = 'POST'
         AND url = '/api/auth/login'
         AND status_code BETWEEN 200 AND 299
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [userId],
      { textProtocol: true }
    );

    const values = rows
      .map((row) => normalizeLoginDayValue(row.login_day))
      .filter((value) => value !== null);

    return Array.from(new Set(values)).sort((a, b) => a - b);
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      console.warn('⚠️ Table request_logs indisponible pour le calcul des logins:', error.message);
      return [];
    }
    throw error;
  }
}

function calculateMaxConsecutiveDays(dayValues) {
  if (!Array.isArray(dayValues) || dayValues.length === 0) {
    return 0;
  }

  let maxStreak = 0;
  let currentStreak = 0;
  let previousDay = null;

  for (const dayValue of dayValues) {
    if (previousDay !== null && dayValue - previousDay === ONE_DAY_MS) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    previousDay = dayValue;
  }

  return maxStreak;
}

// Charger les seuils configurables pour certains badges
async function getBadgeThresholds() {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['badge_thresholds']);
    if (row && row[0] && row[0].value) {
      try { return JSON.parse(row[0].value); } catch {}
    }
  } catch {}
  return {
    funny_fails: { laughsPerFail: 5 },
    trends_created: { reactionsPerFail: 20 },
    popular_discussions: { commentsPerFail: 25 }
  };
}

// Vérifier et débloquer automatiquement les badges d'un utilisateur
async function checkAndUnlockBadges(userId) {
  try {
    // Récupérer définitions et badges déjà obtenus
    const badgeDefinitions = await executeQuery(`
      SELECT id, name, description, icon, category, rarity, requirement_type, requirement_value
      FROM badge_definitions
    `);
    const userBadges = await executeQuery(`
      SELECT badge_id FROM user_badges WHERE user_id = ?
    `, [userId]);
    const owned = new Set(userBadges.map(b => b.badge_id));

    const newBadges = [];
    for (const def of badgeDefinitions) {
      if (owned.has(def.id)) continue;
      const ok = await checkBadgeRequirement(userId, def);
      if (!ok) continue;

      const { v4: uuidv4 } = require('uuid');
      await executeQuery(
        `INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, created_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE unlocked_at = COALESCE(unlocked_at, NOW())`,
        [uuidv4(), userId, def.id]
      );
      newBadges.push(def);

      try {
        await sendPushToUser(userId, {
          title: '🏆 Badge débloqué',
          body: `${def.name} - ${def.description}`,
          data: { type: 'badge_unlocked', badgeId: def.id }
        });
      } catch {}
    }
    return newBadges;
  } catch (e) {
    console.error('checkAndUnlockBadges error:', e);
    return [];
  }
}

// Vérifie une condition de badge spécifique
async function checkBadgeRequirement(userId, badgeDefinition) {
  try {
    const { requirement_type, requirement_value } = badgeDefinition;

    switch (requirement_type) {
      case 'fail_count': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM fails WHERE user_id = ?', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'reactions_received': {
        const rows = await executeQuery(`
          SELECT COUNT(r.id) AS c
          FROM fails f
          LEFT JOIN reactions r ON r.fail_id = f.id
          WHERE f.user_id = ? AND r.user_id IS NOT NULL AND r.user_id <> f.user_id
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      // Corrigé: first_reaction = première réaction REÇUE sur un fail de l'utilisateur
      case 'first_reaction': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c
          FROM reactions r
          JOIN fails f ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.user_id <> ?
        `, [userId, userId]);
        return (rows[0]?.c || 0) >= 1;
      }

      case 'reaction_given': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM reactions WHERE user_id = ?', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'login_days': {
        const dayValues = await getDistinctLoginDayValues(userId);
        return dayValues.length >= requirement_value;
      }

      case 'streak_days': {
        const dayValues = await getDistinctLoginDayValues(userId);
        const longestStreak = calculateMaxConsecutiveDays(dayValues);
        return longestStreak >= requirement_value;
      }

      case 'total_laughs':
      case 'laugh_reactions': {
        const rows = await executeQuery(`
          SELECT COUNT(r.id) AS c
          FROM reactions r
          JOIN fails f ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.reaction_type = 'laugh'
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'support_given': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM reactions WHERE user_id = ? AND reaction_type = "support"', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'help_count':
      case 'helpful_comments': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM comments WHERE user_id = ?', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'unique_interactions': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT r.user_id) AS c
          FROM reactions r JOIN fails f ON f.id = r.fail_id
          WHERE f.user_id = ?
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'categories_used': {
        const rows = await executeQuery('SELECT COUNT(DISTINCT category) AS c FROM fails WHERE user_id = ?', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'beta_participation': {
        const rows = await executeQuery('SELECT created_at FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!rows[0]?.created_at) return false;
        return new Date(rows[0].created_at) < new Date('2025-01-01T00:00:00Z');
      }

      case 'anniversary_participation': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c FROM user_activities
          WHERE user_id = ? AND DATE_FORMAT(created_at, '%m-%d') = '09-11'
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'bounce_back_count':
      case 'comeback_count': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c FROM (
            SELECT created_at, LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_created
            FROM fails WHERE user_id = ?
          ) t
          WHERE prev_created IS NOT NULL AND TIMESTAMPDIFF(DAY, prev_created, created_at) > 30
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'active_months': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT DATE_FORMAT(created_at, '%Y-%m')) AS c
          FROM fails WHERE user_id = ?
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'popular_discussions': {
        const th = await getBadgeThresholds();
        const perFail = Number(th?.popular_discussions?.commentsPerFail) || 25;
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM fails WHERE user_id = ? AND comments_count >= ?', [userId, perFail]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'user_rank': {
        const rows = await executeQuery(`
          SELECT rn FROM (
            SELECT user_id, ROW_NUMBER() OVER (ORDER BY points_total DESC) AS rn
            FROM user_points
          ) ranked WHERE user_id = ?
        `, [userId]);
        return !!rows[0]?.rn && rows[0].rn <= requirement_value;
      }

      case 'empathy_given': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM reactions WHERE user_id = ? AND reaction_type = "empathy"', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'countries_count': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT country_code) AS c
          FROM fails WHERE user_id = ? AND country_code IS NOT NULL AND country_code <> ''
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'positive_reactions': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c
          FROM reactions r JOIN fails f ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.reaction_type IN ('courage','support','empathy','laugh')
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'holiday_fails': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c FROM fails
          WHERE user_id = ? AND (
            (MONTH(created_at) = 12 AND DAY(created_at) BETWEEN 20 AND 31) OR
            (MONTH(created_at) = 1 AND DAY(created_at) BETWEEN 1 AND 10) OR
            (MONTH(created_at) = 7 AND DAY(created_at) = 14) OR
            (MONTH(created_at) = 10 AND DAY(created_at) = 31)
          )
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'inspired_users': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT r.user_id) AS c
          FROM reactions r JOIN fails f ON r.fail_id = f.id
          WHERE f.user_id = ? AND r.user_id <> ?
        `, [userId, userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'resilience_count': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c FROM fails
          WHERE user_id = ? AND (
            description LIKE '%après%' OR description LIKE '%malgré%' OR description LIKE '%encore%'
            OR category = 'professional'
          )
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'new_year_fail': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM fails WHERE user_id = ? AND MONTH(created_at) = 1 AND DAY(created_at) = 1', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'major_comebacks': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c FROM (
            SELECT created_at, LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_created
            FROM fails WHERE user_id = ?
          ) t
          WHERE prev_created IS NOT NULL AND TIMESTAMPDIFF(DAY, prev_created, created_at) > 90
        `, [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'features_used': {
        // Comptabiliser des fonctionnalités réellement disponibles pour approcher requirement_value (=10)
        try {
          const checks = await Promise.all([
            executeQuery('SELECT EXISTS(SELECT 1 FROM fails WHERE user_id = ?) AS e', [userId]),                      // 1: fail créé
            executeQuery('SELECT EXISTS(SELECT 1 FROM comments WHERE user_id = ?) AS e', [userId]),                  // 2: commentaire posté
            executeQuery('SELECT EXISTS(SELECT 1 FROM reactions WHERE user_id = ?) AS e', [userId]),                 // 3: réaction donnée
            executeQuery('SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = ? AND avatar_url IS NOT NULL AND avatar_url <> "") AS e', [userId]), // 4: avatar défini
            executeQuery('SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = ? AND bio IS NOT NULL AND bio <> "") AS e', [userId]),              // 5: bio renseignée
            executeQuery('SELECT EXISTS(SELECT 1 FROM user_push_tokens WHERE user_id = ?) AS e', [userId]),          // 6: push enregistré
            executeQuery('SELECT EXISTS(SELECT 1 FROM fails WHERE user_id = ? AND image_url IS NOT NULL AND image_url <> "") AS e', [userId]),     // 7: upload image
            executeQuery('SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = ? AND username IS NOT NULL AND username <> "") AS e', [userId]),     // 8: username défini
            executeQuery(`SELECT EXISTS(
              SELECT 1 FROM reactions r JOIN fails f ON f.id = r.fail_id WHERE f.user_id = ? AND r.user_id <> ?
            ) AS e`, [userId, userId]),                                                                             // 9: réaction reçue
            executeQuery('SELECT EXISTS(SELECT 1 FROM user_points WHERE user_id = ? AND points_total > 0) AS e', [userId]) // 10: points acquis
          ]);
          const used = checks.reduce((acc, r) => acc + (r[0]?.e ? 1 : 0), 0);
          return used >= Math.min(requirement_value, 10);
        } catch (error) {
          if (error?.code === 'ER_NO_SUCH_TABLE') {
            console.warn('⚠️ Table manquante pour le badge features_used:', error.message);
            return false;
          }
          throw error;
        }
      }

      case 'positive_days': {
        const rows = await executeQuery('SELECT COUNT(DISTINCT DATE(created_at)) AS c FROM fails WHERE user_id = ?', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'weekend_fails': {
        const rows = await executeQuery('SELECT COUNT(*) AS c FROM fails WHERE user_id = ? AND DAYOFWEEK(created_at) IN (1,7)', [userId]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'funny_fails': {
        const th = await getBadgeThresholds();
        const perFail = Number(th?.funny_fails?.laughsPerFail) || 5;
        const rows = await executeQuery(`
          SELECT COUNT(*) AS c FROM fails f
          WHERE f.user_id = ? AND (
            SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id AND r.reaction_type = 'laugh'
          ) >= ?
        `, [userId, perFail]);
        return (rows[0]?.c || 0) >= requirement_value;
      }

      case 'long_streaks': {
        const rows = await executeQuery(`
          SELECT COALESCE(MAX(streak_length), 0) AS max_streak FROM (
            SELECT COUNT(*) AS streak_length FROM (
              SELECT DATE(created_at) AS d, ROW_NUMBER() OVER (ORDER BY DATE(created_at)) AS rn
              FROM fails WHERE user_id = ? GROUP BY DATE(created_at)
            ) x GROUP BY DATE_SUB(d, INTERVAL rn DAY)
          ) s
        `, [userId]);
        return (rows[0]?.max_streak || 0) >= requirement_value;
      }

      default:
        // Type non supporté: ne pas bloquer, juste ignorer
        return false;
    }
  } catch (e) {
    console.error(`checkBadgeRequirement error for ${badgeDefinition.requirement_type}:`, e);
    return false;
  }
}

module.exports = {
  getBadgeThresholds,
  checkAndUnlockBadges,
  checkBadgeRequirement
};
