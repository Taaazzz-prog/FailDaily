

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_and_unlock_badges"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    badge_record RECORD;
    user_stats RECORD;
BEGIN
    -- Récupérer les statistiques de l'utilisateur
    SELECT
        COUNT(DISTINCT f.id) as total_fails,
        COALESCE(SUM(CASE WHEN r.reaction_type = 'courage' THEN 1 ELSE 0 END), 0) as courage_hearts,
        COALESCE(SUM(CASE WHEN r.reaction_type = 'laugh' THEN 1 ELSE 0 END), 0) as laugh_reactions,
        0 as current_streak -- À implémenter plus tard
    INTO user_stats
    FROM fails f
    LEFT JOIN reactions r ON f.id = r.fail_id
    WHERE f.user_id = NEW.user_id;

    -- Parcourir tous les badges et vérifier les conditions
    FOR badge_record IN
        SELECT bd.* FROM badge_definitions bd
        WHERE bd.id NOT IN (
            SELECT badge_type FROM badges WHERE user_id = NEW.user_id AND badge_type IS NOT NULL
        )
    LOOP
        DECLARE
            should_unlock BOOLEAN := FALSE;
        BEGIN
            CASE badge_record.requirement_type
                WHEN 'fail_count' THEN
                    should_unlock := user_stats.total_fails >= badge_record.requirement_value;
                WHEN 'reactions_received' THEN
                    should_unlock := user_stats.courage_hearts >= badge_record.requirement_value;
                WHEN 'laugh_reactions' THEN
                    should_unlock := user_stats.laugh_reactions >= badge_record.requirement_value;
                WHEN 'streak_days' THEN
                    should_unlock := user_stats.current_streak >= badge_record.requirement_value;
                ELSE
                    should_unlock := FALSE;
            END CASE;

            IF should_unlock THEN
                -- Utiliser la structure existante de la table badges
                INSERT INTO badges (
                    user_id,
                    badge_type,
                    category,
                    rarity,
                    name,
                    description,
                    icon,
                    unlocked_at,
                    created_at
                )
                VALUES (
                    NEW.user_id,
                    badge_record.id,
                    badge_record.category,
                    badge_record.rarity,
                    badge_record.name,
                    badge_record.description,
                    badge_record.icon,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (user_id, badge_type) DO NOTHING;
            END IF;
        END;
    END LOOP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_and_unlock_badges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_registration_status"("user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    profile_record RECORD;
    result JSONB;
BEGIN
    -- Récupérer le profil utilisateur
    SELECT 
        id,
        registration_completed,
        legal_consent,
        age_verification,
        email_confirmed,
        created_at,
        updated_at
    INTO profile_record
    FROM public.profiles 
    WHERE id = user_id;

    -- Si pas de profil trouvé
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'exists', false,
            'registration_completed', false,
            'needs_completion', true,
            'user_id', user_id
        );
        RETURN result;
    END IF;

    -- Construire la réponse avec les détails du statut
    result := jsonb_build_object(
        'exists', true,
        'user_id', user_id,
        'registration_completed', COALESCE(profile_record.registration_completed, false),
        'email_confirmed', COALESCE(profile_record.email_confirmed, false),
        'has_legal_consent', (profile_record.legal_consent IS NOT NULL),
        'has_age_verification', (profile_record.age_verification IS NOT NULL),
        'needs_completion', NOT COALESCE(profile_record.registration_completed, false),
        'created_at', profile_record.created_at,
        'updated_at', profile_record.updated_at
    );

    -- Ajouter des détails sur le consentement parental si applicable
    IF profile_record.age_verification IS NOT NULL THEN
        result := result || jsonb_build_object(
            'is_minor', COALESCE((profile_record.age_verification->>'isMinor')::boolean, false),
            'needs_parental_consent', COALESCE((profile_record.age_verification->>'needsParentalConsent')::boolean, false),
            'parent_email', profile_record.age_verification->>'parentEmail'
        );
    END IF;

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner les détails
        result := jsonb_build_object(
            'exists', false,
            'error', SQLERRM,
            'user_id', user_id
        );
        RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_user_registration_status"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_user_registration_status"("user_id" "uuid") IS 'Vérifie le statut d''inscription d''un utilisateur';



CREATE OR REPLACE FUNCTION "public"."complete_user_registration"("user_id" "uuid", "legal_consent_data" "jsonb", "age_verification_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;

    -- Mettre à jour le profil avec les données légales
    UPDATE public.profiles 
    SET 
        legal_consent = legal_consent_data,
        age_verification = age_verification_data,
        registration_completed = true,
        updated_at = NOW()
    WHERE id = user_id;

    -- Si le profil n'existe pas encore, le créer
    IF NOT FOUND THEN
        INSERT INTO public.profiles (
            id,
            legal_consent,
            age_verification,
            registration_completed,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            legal_consent_data,
            age_verification_data,
            true,
            NOW(),
            NOW()
        );
    END IF;

    -- Retourner le statut de succès
    result := jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'registration_completed', true,
        'completed_at', NOW()
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner les détails
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', user_id
        );
        RETURN result;
END;
$$;


ALTER FUNCTION "public"."complete_user_registration"("user_id" "uuid", "legal_consent_data" "jsonb", "age_verification_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_user_registration"("user_id" "uuid", "legal_consent_data" "jsonb", "age_verification_data" "jsonb") IS 'Finalise l''inscription utilisateur avec les données légales et de vérification d''âge';



CREATE OR REPLACE FUNCTION "public"."create_profile_manually"("user_id" "uuid", "user_email" "text", "username" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_profile profiles%ROWTYPE;
BEGIN
    INSERT INTO profiles (
        id,
        username,
        email,
        display_name,
        email_confirmed,
        registration_completed,
        created_at,
        updated_at,
        stats,
        preferences
    )
    VALUES (
        user_id,
        username,
        user_email,
        username,
        true,
        false,
        NOW(),
        NOW(),
        '{"totalFails": 0, "couragePoints": 0, "badges": []}',
        '{}'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, profiles.username),
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        updated_at = NOW()
    RETURNING * INTO new_profile;

    RETURN row_to_json(new_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_profile_manually"("user_id" "uuid", "user_email" "text", "username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_stats"("user_id" "uuid", "new_stats" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    updated_profile profiles%ROWTYPE;
BEGIN
    UPDATE profiles
    SET
        stats = new_stats,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
    END IF;

    RETURN row_to_json(updated_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating stats: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."update_user_stats"("user_id" "uuid", "new_stats" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_age_verification"("age_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF age_data IS NULL THEN
        RETURN TRUE; -- NULL est autorisé
    END IF;
    
    -- Vérifier la structure minimale
    IF NOT (
        age_data ? 'birthDate' AND
        age_data ? 'isMinor' AND
        age_data ? 'needsParentalConsent'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Si consentement parental nécessaire, vérifier l'email parent
    IF (age_data->>'needsParentalConsent')::boolean = true THEN
        IF NOT (age_data ? 'parentEmail' AND age_data->>'parentEmail' != '') THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_age_verification"("age_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_legal_consent"("consent" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF consent IS NULL THEN
        RETURN TRUE; -- NULL est autorisé
    END IF;
    
    -- Vérifier la structure minimale
    IF NOT (
        consent ? 'documentsAccepted' AND
        consent ? 'consentDate' AND
        consent ? 'consentVersion' AND
        consent ? 'marketingOptIn'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier que documentsAccepted est un array contenant au moins terms-of-service
    IF NOT (
        jsonb_typeof(consent->'documentsAccepted') = 'array' AND
        consent->'documentsAccepted' @> '["terms-of-service"]'::jsonb
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_legal_consent"("consent" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_parental_consent"("user_id" "uuid", "parent_token" "text", "parent_consent_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
    current_age_verification JSONB;
BEGIN
    -- Récupérer les données de vérification d'âge actuelles
    SELECT age_verification INTO current_age_verification
    FROM public.profiles 
    WHERE id = user_id;

    -- Vérifier que l'utilisateur existe et a besoin d'un consentement parental
    IF current_age_verification IS NULL OR 
       NOT COALESCE((current_age_verification->>'needsParentalConsent')::boolean, false) THEN
        RAISE EXCEPTION 'Consentement parental non requis pour cet utilisateur';
    END IF;

    -- Mettre à jour avec le consentement parental
    UPDATE public.profiles 
    SET 
        age_verification = current_age_verification || jsonb_build_object(
            'parentConsentDate', NOW(),
            'parentConsentValidated', true,
            'parentConsentData', parent_consent_data
        ),
        registration_completed = true,
        updated_at = NOW()
    WHERE id = user_id;

    -- Retourner le succès
    result := jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'parental_consent_validated', true,
        'registration_completed', true,
        'validated_at', NOW()
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', user_id
        );
        RETURN result;
END;
$$;


ALTER FUNCTION "public"."validate_parental_consent"("user_id" "uuid", "parent_token" "text", "parent_consent_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_parental_consent"("user_id" "uuid", "parent_token" "text", "parent_consent_data" "jsonb") IS 'Valide le consentement parental pour les utilisateurs mineurs';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."badge_definitions" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "category" "text" NOT NULL,
    "rarity" "text" NOT NULL,
    "requirement_type" "text" NOT NULL,
    "requirement_value" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "badge_definitions_rarity_check" CHECK (("rarity" = ANY (ARRAY['common'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text"])))
);


ALTER TABLE "public"."badge_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "rarity" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "badges_category_check" CHECK (("category" = ANY (ARRAY['COURAGE'::"text", 'HUMOUR'::"text", 'ENTRAIDE'::"text", 'PERSEVERANCE'::"text", 'SPECIAL'::"text", 'RESILIENCE'::"text"]))),
    CONSTRAINT "badges_rarity_check" CHECK (("rarity" = ANY (ARRAY['common'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text"])))
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fail_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_encouragement" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "image_url" "text",
    "reactions" "jsonb" DEFAULT '{"laugh": 0, "courage": 0, "empathy": 0, "support": 0}'::"jsonb",
    "comments_count" integer DEFAULT 0,
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fails_category_check" CHECK (("category" = ANY (ARRAY['courage'::"text", 'humour'::"text", 'entraide'::"text", 'perseverance'::"text", 'special'::"text", 'travail'::"text", 'sport'::"text", 'cuisine'::"text", 'transport'::"text", 'technologie'::"text", 'relations'::"text", 'finances'::"text", 'bricolage'::"text", 'apprentissage'::"text", 'santé'::"text", 'voyage'::"text", 'communication'::"text"])))
);


ALTER TABLE "public"."fails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "email" "text",
    "display_name" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "avatar_url" "text",
    "bio" "text",
    "stats" "jsonb" DEFAULT '{"badges": [], "totalFails": 0, "couragePoints": 0}'::"jsonb",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "legal_consent" "jsonb",
    "age_verification" "jsonb",
    "email_confirmed" boolean DEFAULT false,
    "registration_completed" boolean DEFAULT false,
    CONSTRAINT "check_age_verification" CHECK ("public"."validate_age_verification"("age_verification")),
    CONSTRAINT "check_email_format" CHECK ((("email" IS NULL) OR ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))),
    CONSTRAINT "check_legal_consent" CHECK ("public"."validate_legal_consent"("legal_consent")),
    CONSTRAINT "check_username_length" CHECK ((("username" IS NULL) OR (("length"("username") >= 3) AND ("length"("username") <= 30))))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fail_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reactions_reaction_type_check" CHECK (("reaction_type" = ANY (ARRAY['courage'::"text", 'empathy'::"text", 'laugh'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" character varying(50) NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_badges" IS 'Table pour stocker les badges débloqués par chaque utilisateur';



COMMENT ON COLUMN "public"."user_badges"."user_id" IS 'Référence à l''utilisateur qui a débloqué le badge';



COMMENT ON COLUMN "public"."user_badges"."badge_id" IS 'Identifiant du badge (correspond aux IDs définis dans BadgeService)';



COMMENT ON COLUMN "public"."user_badges"."unlocked_at" IS 'Date et heure de débloquage du badge';



CREATE OR REPLACE VIEW "public"."user_profiles_complete" AS
 SELECT "id",
    "username",
    "display_name",
    "email",
    "avatar_url",
    "bio",
    "created_at",
    "updated_at",
    "legal_consent",
    "age_verification",
    "email_confirmed",
    "registration_completed",
    "stats",
    "preferences",
        CASE
            WHEN (("age_verification" ->> 'birthDate'::"text") IS NOT NULL) THEN EXTRACT(year FROM "age"((CURRENT_DATE)::timestamp with time zone, ((("age_verification" ->> 'birthDate'::"text"))::"date")::timestamp with time zone))
            ELSE NULL::numeric
        END AS "calculated_age",
        CASE
            WHEN (("age_verification" ->> 'birthDate'::"text") IS NOT NULL) THEN (EXTRACT(year FROM "age"((CURRENT_DATE)::timestamp with time zone, ((("age_verification" ->> 'birthDate'::"text"))::"date")::timestamp with time zone)) < (18)::numeric)
            ELSE NULL::boolean
        END AS "is_currently_minor",
        CASE
            WHEN (("legal_consent" IS NOT NULL) AND ("age_verification" IS NOT NULL)) THEN 'complete'::"text"
            WHEN (("legal_consent" IS NOT NULL) OR ("age_verification" IS NOT NULL)) THEN 'partial'::"text"
            ELSE 'none'::"text"
        END AS "legal_compliance_status"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."user_profiles_complete" OWNER TO "postgres";


ALTER TABLE ONLY "public"."badge_definitions"
    ADD CONSTRAINT "badge_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_badge_type_key" UNIQUE ("user_id", "badge_type");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fails"
    ADD CONSTRAINT "fails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_fail_id_user_id_reaction_type_key" UNIQUE ("fail_id", "user_id", "reaction_type");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



CREATE INDEX "fails_created_at_idx" ON "public"."fails" USING "btree" ("created_at" DESC);



CREATE INDEX "fails_user_id_idx" ON "public"."fails" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_age_verification" ON "public"."profiles" USING "gin" ("age_verification");



CREATE INDEX "idx_profiles_email_confirmed" ON "public"."profiles" USING "btree" ("email_confirmed");



CREATE INDEX "idx_profiles_legal_consent" ON "public"."profiles" USING "gin" ("legal_consent");



CREATE INDEX "idx_profiles_preferences" ON "public"."profiles" USING "gin" ("preferences");



CREATE INDEX "idx_profiles_registration_completed" ON "public"."profiles" USING "btree" ("registration_completed");



CREATE INDEX "idx_profiles_stats" ON "public"."profiles" USING "gin" ("stats");



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "trigger_check_badges_on_fail" AFTER INSERT ON "public"."fails" FOR EACH ROW EXECUTE FUNCTION "public"."check_and_unlock_badges"();



CREATE OR REPLACE TRIGGER "trigger_check_badges_on_reaction" AFTER INSERT OR UPDATE ON "public"."reactions" FOR EACH ROW EXECUTE FUNCTION "public"."check_and_unlock_badges"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_fails_updated_at" BEFORE UPDATE ON "public"."fails" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_badge_type_fkey" FOREIGN KEY ("badge_type") REFERENCES "public"."badge_definitions"("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_fail_id_fkey" FOREIGN KEY ("fail_id") REFERENCES "public"."fails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fails"
    ADD CONSTRAINT "fails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_fail_id_fkey" FOREIGN KEY ("fail_id") REFERENCES "public"."fails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow badge insertion" ON "public"."user_badges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view public fails" ON "public"."fails" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Anyone can view reactions" ON "public"."reactions" FOR SELECT USING (true);



CREATE POLICY "Badge definitions are public" ON "public"."badge_definitions" FOR SELECT USING (true);



CREATE POLICY "System can create badges" ON "public"."badges" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert badges for users" ON "public"."user_badges" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create fails" ON "public"."fails" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create reactions" ON "public"."reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own fails" ON "public"."fails" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own reactions" ON "public"."reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own badges" ON "public"."user_badges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only see their own badges" ON "public"."user_badges" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own fails" ON "public"."fails" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view all badges" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "Users can view all profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can view own fails" ON "public"."fails" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own badges" ON "public"."user_badges" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."badge_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;

























































































































































GRANT ALL ON FUNCTION "public"."check_user_registration_status"("user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."complete_user_registration"("user_id" "uuid", "legal_consent_data" "jsonb", "age_verification_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_profile_manually"("user_id" "uuid", "user_email" "text", "username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_manually"("user_id" "uuid", "user_email" "text", "username" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."update_user_stats"("user_id" "uuid", "new_stats" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."validate_parental_consent"("user_id" "uuid", "parent_token" "text", "parent_consent_data" "jsonb") TO "authenticated";


















GRANT ALL ON TABLE "public"."badge_definitions" TO "authenticated";



GRANT ALL ON TABLE "public"."badges" TO "authenticated";



GRANT ALL ON TABLE "public"."comments" TO "authenticated";



GRANT ALL ON TABLE "public"."fails" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "anon";



GRANT ALL ON TABLE "public"."reactions" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."user_badges" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_profiles_complete" TO "authenticated";

































RESET ALL;
