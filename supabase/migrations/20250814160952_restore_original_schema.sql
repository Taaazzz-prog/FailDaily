--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_net"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: badge_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."badge_definitions" (
    "description" "text" NOT NULL,
    "name" "text" NOT NULL,
    "id" "text" NOT NULL,
    "requirement_type" "text" NOT NULL,
    "requirement_value" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "category" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "rarity" "text" NOT NULL
);


ALTER TABLE "public"."badge_definitions" OWNER TO "postgres";

--
-- Name: TABLE "badge_definitions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."badge_definitions" IS 'Définitions des badges disponibles';


--
-- Name: badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."badges" (
    "unlocked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "icon" "text" NOT NULL,
    "description" "text" NOT NULL,
    "name" "text" NOT NULL,
    "rarity" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "badge_type" "text" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."badges" OWNER TO "postgres";

--
-- Name: TABLE "badges"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."badges" IS 'Badges obtenus par les utilisateurs';


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fail_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_encouragement" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "content" "text" NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";

--
-- Name: TABLE "comments"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."comments" IS 'Commentaires d''encouragement sur les échecs';


--
-- Name: fails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."fails" (
    "reactions" "jsonb" DEFAULT '{"laugh": 0, "courage": 0, "empathy": 0, "support": 0}'::"jsonb",
    "user_id" "uuid" NOT NULL,
    "comments_count" integer DEFAULT 0,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url" "text",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "title" "text" NOT NULL,
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fails" OWNER TO "postgres";

--
-- Name: TABLE "fails"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."fails" IS 'Publications d''échecs partagées par les utilisateurs';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "email_confirmed" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stats" "jsonb" DEFAULT '{"badges": [], "totalFails": 0, "couragePoints": 0}'::"jsonb",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "legal_consent" "jsonb",
    "age_verification" "jsonb",
    "registration_completed" boolean DEFAULT false,
    "username" "text",
    "email" "text",
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: TABLE "profiles"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."profiles" IS 'Profils utilisateurs avec informations complètes';


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "reaction_type" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "fail_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";

--
-- Name: TABLE "reactions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."reactions" IS 'Réactions aux échecs (courage, empathie, soutien, rire)';


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "created_at" timestamp with time zone DEFAULT "now"(),
    "badge_id" character varying(50) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";

--
-- Name: TABLE "user_badges"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."user_badges" IS 'Association utilisateurs-badges avec dates d''obtention';


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" NOT NULL,
    "notifications_enabled" boolean DEFAULT true,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "privacy_mode" boolean DEFAULT false,
    "show_real_name" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";

--
-- Name: user_profiles_complete; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_profiles_complete" (
    "age_verification" "jsonb",
    "bio" "text",
    "id" "uuid",
    "email_confirmed" boolean,
    "registration_completed" boolean,
    "is_currently_minor" boolean,
    "calculated_age" numeric,
    "avatar_url" "text",
    "preferences" "jsonb",
    "legal_compliance_status" "text",
    "legal_consent" "jsonb",
    "updated_at" timestamp with time zone,
    "created_at" timestamp without time zone,
    "stats" "jsonb",
    "username" "text",
    "display_name" "text",
    "email" "text"
);


ALTER TABLE "public"."user_profiles_complete" OWNER TO "postgres";

--
-- Name: badge_definitions badge_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."badge_definitions"
    ADD CONSTRAINT "badge_definitions_pkey" PRIMARY KEY ("id");


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");


--
-- Name: fails fails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."fails"
    ADD CONSTRAINT "fails_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");


--
-- Name: idx_badges_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_badges_user_id" ON "public"."badges" USING "btree" ("user_id");


--
-- Name: idx_comments_fail_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_comments_fail_id" ON "public"."comments" USING "btree" ("fail_id");


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");


--
-- Name: idx_fails_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_fails_category" ON "public"."fails" USING "btree" ("category");


--
-- Name: idx_fails_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_fails_created_at" ON "public"."fails" USING "btree" ("created_at" DESC);


--
-- Name: idx_fails_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_fails_user_id" ON "public"."fails" USING "btree" ("user_id");


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");


--
-- Name: idx_profiles_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");


--
-- Name: idx_reactions_fail_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reactions_fail_id" ON "public"."reactions" USING "btree" ("fail_id");


--
-- Name: idx_reactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reactions_user_id" ON "public"."reactions" USING "btree" ("user_id");


--
-- Name: idx_user_badges_badge_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");


--
-- Name: idx_user_badges_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");


--
-- Name: comments handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


--
-- Name: fails handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."fails" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


--
-- Name: profiles handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


--
-- Name: user_preferences handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


--
-- Name: badges badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: comments comments_fail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_fail_id_fkey" FOREIGN KEY ("fail_id") REFERENCES "public"."fails"("id") ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: fails fails_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."fails"
    ADD CONSTRAINT "fails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: reactions reactions_fail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_fail_id_fkey" FOREIGN KEY ("fail_id") REFERENCES "public"."fails"("id") ON DELETE CASCADE;


--
-- Name: reactions reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: badge_definitions Badge definitions are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Badge definitions are viewable by everyone" ON "public"."badge_definitions" FOR SELECT USING (true);


--
-- Name: badges Badges are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Badges are viewable by everyone" ON "public"."badges" FOR SELECT USING (true);


--
-- Name: comments Comments are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);


--
-- Name: fails Public fails are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public fails are viewable by everyone" ON "public"."fails" FOR SELECT USING (("is_public" = true));


--
-- Name: profiles Public profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);


--
-- Name: reactions Reactions are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Reactions are viewable by everyone" ON "public"."reactions" FOR SELECT USING (true);


--
-- Name: user_badges User badges are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User badges are viewable by everyone" ON "public"."user_badges" FOR SELECT USING (true);


--
-- Name: comments Users can delete own comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: fails Users can delete own fails; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own fails" ON "public"."fails" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: reactions Users can delete own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own reactions" ON "public"."reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: badges Users can insert own badges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own badges" ON "public"."badges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: comments Users can insert own comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: fails Users can insert own fails; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own fails" ON "public"."fails" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: reactions Users can insert own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own reactions" ON "public"."reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_badges Users can insert own user_badges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own user_badges" ON "public"."user_badges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: comments Users can update own comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: fails Users can update own fails; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own fails" ON "public"."fails" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: reactions Users can update own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own reactions" ON "public"."reactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: badge_definitions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."badge_definitions" ENABLE ROW LEVEL SECURITY;

--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: fails; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."fails" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: reactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

-- CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: SCHEMA "net"; Type: ACL; Schema: -; Owner: supabase_admin
--

-- GRANT USAGE ON SCHEMA "net" TO "supabase_functions_admin";
-- GRANT USAGE ON SCHEMA "net" TO "postgres";
-- GRANT USAGE ON SCHEMA "net" TO "anon";
-- GRANT USAGE ON SCHEMA "net" TO "authenticated";
-- GRANT USAGE ON SCHEMA "net" TO "service_role";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer); Type: ACL; Schema: net; Owner: supabase_admin
--

-- REVOKE ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) FROM PUBLIC;
-- GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "supabase_functions_admin";
-- GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "postgres";
-- GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "anon";
-- GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "authenticated";
-- GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "service_role";


--
-- Name: FUNCTION "http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer); Type: ACL; Schema: net; Owner: supabase_admin
--

-- REVOKE ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) FROM PUBLIC;
-- GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "supabase_functions_admin";
-- GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "postgres";
-- GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "anon";
-- GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "authenticated";
-- GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "service_role";


--
-- Name: FUNCTION "handle_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: supabase_admin
--

-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "badge_definitions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."badge_definitions" TO "anon";
GRANT ALL ON TABLE "public"."badge_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."badge_definitions" TO "service_role";


--
-- Name: TABLE "badges"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";


--
-- Name: TABLE "comments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";


--
-- Name: TABLE "fails"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."fails" TO "anon";
GRANT ALL ON TABLE "public"."fails" TO "authenticated";
GRANT ALL ON TABLE "public"."fails" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "reactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reactions" TO "anon";
GRANT ALL ON TABLE "public"."reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."reactions" TO "service_role";


--
-- Name: TABLE "user_badges"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";


--
-- Name: TABLE "user_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";


--
-- Name: TABLE "user_profiles_complete"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_profiles_complete" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles_complete" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles_complete" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
--          WHEN TAG IN ('DROP EXTENSION')
--    EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


-- ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


-- ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE FUNCTION')
--    EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


-- ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


-- ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
--    EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


-- ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
--    EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


-- ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

RESET ALL;
