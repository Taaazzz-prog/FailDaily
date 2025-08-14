-- ====================================================================
-- STRUCTURE COMPLÈTE DE LA BASE DE DONNÉES FAILDAILY
-- Générée le 14 août 2025
-- ====================================================================

-- ====================================================================
-- SCHÉMAS DISPONIBLES
-- ====================================================================
/*
_realtime (3 tables) - Système realtime interne
auth (19 tables) - Authentification Supabase
net (2 tables) - Requêtes HTTP
public (15 tables) - Application FailDaily
realtime (8 tables) - Messages temps réel
storage (9 tables) - Stockage fichiers
supabase_functions (2 tables) - Fonctions Edge
supabase_migrations (1 table) - Migrations
vault (1 table) - Secrets
*/

-- ====================================================================
-- TABLES DU SCHÉMA PUBLIC (APPLICATION FAILDAILY)
-- ====================================================================

-- Table: activity_logs (9 colonnes)
-- Description: Journalisation des activités utilisateur
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Table: app_config (6 colonnes)
-- Description: Configuration de l'application
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Table: badge_definitions (9 colonnes)
-- Description: Définitions des badges disponibles
-- ⚠️ ATTENTION: Cette table ne doit PAS être vidée via le panel admin
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: badges (10 colonnes)
-- Description: Badges obtenus par les utilisateurs (historique)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    badge_definition_id UUID REFERENCES public.badge_definitions(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    earned_value INTEGER,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: comments (7 colonnes)
-- Description: Commentaires sur les fails
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fail_id UUID REFERENCES public.fails(id),
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Table: fails (11 colonnes)
-- Description: Table principale des échecs partagés
CREATE TABLE IF NOT EXISTS public.fails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reaction_counts JSONB DEFAULT '{}',
    total_reactions INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Table: profiles (15 colonnes)
-- Description: Profils étendus des utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    stats JSONB DEFAULT '{}',
    achievements JSONB DEFAULT '[]'
);

-- Table: reaction_logs (13 colonnes)
-- Description: Historique complet des réactions
CREATE TABLE IF NOT EXISTS public.reaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    fail_id UUID REFERENCES public.fails(id),
    reaction_type TEXT NOT NULL,
    action TEXT NOT NULL, -- 'add', 'remove', 'change'
    old_reaction_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    metadata JSONB,
    points_awarded INTEGER DEFAULT 0,
    batch_id UUID -- Pour grouper les actions multiples
);

-- Table: reactions (5 colonnes)
-- Description: Réactions actuelles sur les fails
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    fail_id UUID REFERENCES public.fails(id),
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, fail_id)
);

-- Table: system_logs (8 colonnes)
-- Description: Logs système et erreurs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL, -- 'error', 'warning', 'info', 'debug'
    message TEXT NOT NULL,
    category TEXT,
    metadata JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Table: user_activities (12 colonnes)
-- Description: Suivi détaillé des activités utilisateur
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    entity_type TEXT, -- 'fail', 'comment', 'reaction', etc.
    entity_id UUID,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE DEFAULT CURRENT_DATE,
    session_id UUID,
    ip_address INET,
    user_agent TEXT
);

-- Table: user_badges (5 colonnes)
-- Description: Attribution des badges aux utilisateurs
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    badge_definition_id UUID REFERENCES public.badge_definitions(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, badge_definition_id)
);

-- Table: user_management_logs (9 colonnes)
-- Description: Logs de gestion des utilisateurs par les admins
CREATE TABLE IF NOT EXISTS public.user_management_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    session_id UUID
);

-- Table: user_preferences (8 colonnes)
-- Description: Préférences utilisateur personnalisables
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    theme TEXT DEFAULT 'auto',
    language TEXT DEFAULT 'fr',
    notifications JSONB DEFAULT '{}',
    privacy JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_profiles_complete (17 colonnes)
-- Description: Vue complète des profils avec statistiques
-- Note: Probablement une VIEW, pas une table
-- Cette "table" combine profiles + stats + badges

-- ====================================================================
-- TABLES DU SCHÉMA AUTH (AUTHENTIFICATION SUPABASE)
-- ====================================================================
-- Ces tables sont gérées par Supabase Auth
-- Principales tables : users (35 colonnes), sessions, refresh_tokens, identities

-- ====================================================================
-- TABLES DU SCHÉMA REALTIME (TEMPS RÉEL)
-- ====================================================================
-- messages (8 colonnes) - Messages temps réel
-- messages_2025_08_13 à messages_2025_08_17 (8 colonnes chacune) - Partitions par date
-- subscription (7 colonnes) - Abonnements temps réel

-- ====================================================================
-- TABLES DU SCHÉMA STORAGE (STOCKAGE)
-- ====================================================================
-- buckets (11 colonnes) - Buckets de stockage
-- objects (13 colonnes) - Objets stockés
-- Et autres tables de gestion du storage

-- ====================================================================
-- INDEX ET CONTRAINTES RECOMMANDÉS
-- ====================================================================

-- Index sur les colonnes fréquemment utilisées
CREATE INDEX IF NOT EXISTS idx_fails_user_id ON public.fails(user_id);
CREATE INDEX IF NOT EXISTS idx_fails_created_at ON public.fails(created_at);
CREATE INDEX IF NOT EXISTS idx_reactions_fail_id ON public.reactions(fail_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_fail_id ON public.comments(fail_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_date ON public.user_activities(date);

-- ====================================================================
-- POLITIQUE RLS (ROW LEVEL SECURITY)
-- ====================================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RÉSUMÉ DES TABLES PAR SCHÉMA
-- ====================================================================
/*
_realtime: 3 tables (extensions, schema_migrations, tenants)
auth: 19 tables (users, sessions, identities, etc.)
net: 2 tables (_http_response, http_request_queue)
public: 15 tables (fails, reactions, profiles, badges, etc.)
realtime: 8 tables (messages + partitions, subscription)
storage: 9 tables (buckets, objects, etc.)
supabase_functions: 2 tables (hooks, migrations)
supabase_migrations: 1 table (schema_migrations)
vault: 1 table (secrets)

TOTAL: 60 tables dans la base de données
*/

-- ====================================================================
-- NOTES IMPORTANTES
-- ====================================================================
/*
1. La table badge_definitions ne doit PAS être vidée via le panel admin
2. Les tables auth.* nécessitent des permissions spéciales
3. Les tables realtime utilisent un partitioning par date
4. Les tables storage gèrent les fichiers uploadés
5. user_profiles_complete semble être une VIEW agrégée
*/
