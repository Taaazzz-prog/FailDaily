# Structure de la Base de Données FailDaily

## Fichier SQL Source
Basé sur : `backend-api/migrations/faildaily.sql`

## Tables et Structure

### 1. **users** - Table principale des utilisateurs
```sql
CREATE TABLE `users` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `email` varchar(255) NOT NULL UNIQUE,
  `email_confirmed` tinyint(1) DEFAULT '0',
  `password_hash` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `last_login` timestamp NULL DEFAULT NULL,
  `login_count` int DEFAULT '0',
  `account_status` enum('active','suspended','deleted') DEFAULT 'active',
  `registration_step` enum('basic','age_verified','legal_accepted','completed') DEFAULT 'basic',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. **profiles** - Profils des utilisateurs
```sql
CREATE TABLE `profiles` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL UNIQUE,
  `username` varchar(255) DEFAULT NULL UNIQUE,
  `display_name` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `bio` text,
  `registration_completed` tinyint(1) DEFAULT '0',
  `legal_consent` longtext COMMENT 'JSON data',
  `age_verification` longtext COMMENT 'JSON data',
  `preferences` longtext COMMENT 'JSON data',
  `stats` longtext COMMENT 'JSON data',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### 3. **fails** - Posts de fails des utilisateurs
```sql
CREATE TABLE `fails` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `image_url` text,
  `is_public` tinyint(1) DEFAULT '1',
  `reactions` longtext COMMENT 'JSON data',
  `comments_count` int DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### 4. **badge_definitions** - Définitions des badges disponibles
```sql
CREATE TABLE `badge_definitions` (
  `id` varchar(100) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `rarity` varchar(50) NOT NULL,
  `requirement_type` varchar(50) NOT NULL,
  `requirement_value` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 5. **badges** - Badges débloqués par les utilisateurs
```sql
CREATE TABLE `badges` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `rarity` varchar(50) NOT NULL,
  `badge_type` varchar(50) NOT NULL,
  `unlocked_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### 6. **user_badges** - Relation utilisateurs-badges
```sql
CREATE TABLE `user_badges` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `badge_id` varchar(100) NOT NULL,
  `unlocked_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_badge` (`user_id`,`badge_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`badge_id`) REFERENCES `badge_definitions` (`id`) ON DELETE CASCADE
);
```

### 7. **reactions** - Réactions sur les fails
```sql
CREATE TABLE `reactions` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `fail_id` char(36) NOT NULL,
  `reaction_type` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_fail_reaction` (`user_id`,`fail_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE
);
```

### 8. **comments** - Commentaires sur les fails
```sql
CREATE TABLE `comments` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `fail_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `is_encouragement` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### 9. **activity_logs** - Logs d'activité
```sql
CREATE TABLE `activity_logs` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `event_type` varchar(100) NOT NULL,
  `event_category` varchar(50) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `message` text NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `target_user_id` char(36) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_display_name` varchar(255) DEFAULT NULL,
  `user_role` varchar(50) DEFAULT NULL,
  `resource_type` varchar(100) DEFAULT NULL,
  `resource_id` char(36) DEFAULT NULL,
  `payload` longtext COMMENT 'JSON data',
  `details` longtext COMMENT 'JSON data',
  `old_values` longtext COMMENT 'JSON data',
  `new_values` longtext COMMENT 'JSON data',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `session_id` varchar(255) DEFAULT NULL,
  `correlation_id` char(36) DEFAULT NULL,
  `success` tinyint(1) DEFAULT '1',
  `error_code` varchar(50) DEFAULT NULL,
  `error_message` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);
```

### 10. **user_activities** - Activités des utilisateurs
```sql
CREATE TABLE `user_activities` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `details` longtext COMMENT 'JSON data',
  `fail_id` char(36) DEFAULT NULL,
  `reaction_type` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);
```

## Badges Prédéfinis (70 badges)

### Catégories de badges :
- **COURAGE** : Pour les actions courageuses (partager des fails)
- **PERSEVERANCE** : Pour la régularité et la persistance
- **HUMOUR** : Pour les contenus drôles
- **RESILIENCE** : Pour la capacité à rebondir
- **ENTRAIDE** : Pour l'aide à la communauté
- **SPECIAL** : Badges spéciaux et événements

### Raretés :
- **common** : Badges communs, faciles à obtenir
- **rare** : Badges rares, nécessitent plus d'effort
- **epic** : Badges épiques, défis importants
- **legendary** : Badges légendaires, très difficiles à obtenir

### Types de requirements :
- `fail_count` : Nombre de fails postés
- `streak_days` : Jours consécutifs d'activité
- `reaction_given` : Réactions données
- `reactions_received` : Réactions reçues
- `login_days` : Jours de connexion
- `laugh_reactions` : Réactions de rire reçues
- Et bien d'autres...

## Triggers et Fonctions

### Trigger sur `users` :
```sql
CREATE TRIGGER `users_after_insert` AFTER INSERT ON `users` FOR EACH ROW 
BEGIN
    INSERT INTO profiles (id, user_id, preferences, stats) 
    VALUES (UUID(), NEW.id, '{}', '{"badges": [], "totalFails": 0, "couragePoints": 0}');
END
```

### Trigger sur `fails` :
```sql
CREATE TRIGGER `fails_before_insert` BEFORE INSERT ON `fails` FOR EACH ROW 
BEGIN
    IF NEW.reactions IS NULL THEN
        SET NEW.reactions = '{"laugh": 0, "courage": 0, "empathy": 0, "support": 0}';
    END IF;
END
```

### Trigger sur `profiles` :
```sql
CREATE TRIGGER `profiles_before_insert` BEFORE INSERT ON `profiles` FOR EACH ROW 
BEGIN
    IF NEW.preferences IS NULL THEN
        SET NEW.preferences = '{}';
    END IF;
    IF NEW.stats IS NULL THEN
        SET NEW.stats = '{"badges": [], "totalFails": 0, "couragePoints": 0}';
    END IF;
END
```

### Fonction UUID :
```sql
CREATE FUNCTION `generate_uuid` () RETURNS CHAR(36) 
DETERMINISTIC READS SQL DATA 
BEGIN
    RETURN UUID();
END
```

## Vue `user_profiles_complete`
Vue qui joint les tables `users` et `profiles` avec des calculs d'âge et de conformité légale.

## Tables de Configuration et Logs

### Tables supplémentaires :
- `app_config` : Configuration de l'application
- `legal_documents` : Documents légaux (CGU, politique de confidentialité)
- `user_legal_acceptances` : Acceptations des documents légaux
- `parental_consents` : Consentements parentaux pour mineurs
- `user_preferences` : Préférences utilisateur
- `reaction_logs` : Logs des réactions
- `system_logs` : Logs système
- `user_management_logs` : Logs de gestion utilisateur

## Configuration de Base
- Charset : `utf8mb4`
- Collation : `utf8mb4_unicode_ci`
- Engine : `InnoDB` (pour la plupart des tables)
- Support des UUID en char(36)
- Support des données JSON dans les champs `longtext`
