drop function if exists "public"."find_orphaned_reactions"();

create table "public"."activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "event_type" text not null,
    "user_id" uuid,
    "target_id" uuid,
    "message" text not null,
    "details" jsonb,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."activity_logs" enable row level security;

create table "public"."user_management_logs" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid not null,
    "target_user_id" uuid not null,
    "action_type" text not null,
    "target_object_id" uuid,
    "old_values" jsonb,
    "new_values" jsonb,
    "reason" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_management_logs" enable row level security;

CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);

CREATE INDEX idx_activity_logs_event_type ON public.activity_logs USING btree (event_type);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);

CREATE INDEX idx_user_mgmt_logs_admin ON public.user_management_logs USING btree (admin_id);

CREATE INDEX idx_user_mgmt_logs_created_at ON public.user_management_logs USING btree (created_at DESC);

CREATE INDEX idx_user_mgmt_logs_target ON public.user_management_logs USING btree (target_user_id);

CREATE UNIQUE INDEX user_management_logs_pkey ON public.user_management_logs USING btree (id);

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."user_management_logs" add constraint "user_management_logs_pkey" PRIMARY KEY using index "user_management_logs_pkey";

alter table "public"."activity_logs" add constraint "activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_user_id_fkey";

alter table "public"."user_management_logs" add constraint "user_management_logs_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES profiles(id) not valid;

alter table "public"."user_management_logs" validate constraint "user_management_logs_admin_id_fkey";

alter table "public"."user_management_logs" add constraint "user_management_logs_target_user_id_fkey" FOREIGN KEY (target_user_id) REFERENCES profiles(id) not valid;

alter table "public"."user_management_logs" validate constraint "user_management_logs_target_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fix_reaction_counts(fail_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    courage_count integer;
    laugh_count integer;
    empathy_count integer;
    support_count integer;
BEGIN
    -- Compter les vraies réactions
    SELECT COUNT(*) INTO courage_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'courage';
    
    SELECT COUNT(*) INTO laugh_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'laugh';
    
    SELECT COUNT(*) INTO empathy_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'empathy';
    
    SELECT COUNT(*) INTO support_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'support';
    
    -- Mettre à jour les compteurs
    UPDATE fails SET 
        courage_count = fix_reaction_counts.courage_count,
        laugh_count = fix_reaction_counts.laugh_count,
        empathy_count = fix_reaction_counts.empathy_count,
        support_count = fix_reaction_counts.support_count
    WHERE id = fix_reaction_counts.fail_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_activity_logs_by_type(log_type text, period_hours integer DEFAULT NULL::integer, max_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, log_timestamp timestamp with time zone, level text, category text, message text, user_id uuid, user_name text, user_email text, details jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.created_at as log_timestamp,
        CASE 
            WHEN al.event_type LIKE '%error%' THEN 'error'
            WHEN al.event_type LIKE '%warning%' THEN 'warning'
            ELSE 'info'
        END as level,
        CASE al.event_type
            WHEN 'account_created' THEN 'Comptes'
            WHEN 'fail_created' THEN 'Fails'
            WHEN 'reaction_added' THEN 'Réactions'
            WHEN 'user_login' THEN 'Connexions'
            WHEN 'admin_action' THEN 'Admin'
            ELSE 'Système'
        END as category,
        al.message,
        al.user_id,
        COALESCE(p.display_name, p.username) as user_name,
        p.email as user_email,
        al.details
    FROM activity_logs al
    LEFT JOIN profiles p ON al.user_id = p.id
    WHERE 
        (log_type = 'all' OR 
         (log_type = 'connexions' AND al.event_type IN ('user_login', 'user_logout', 'login_failed')) OR
         (log_type = 'fails' AND al.event_type IN ('fail_created', 'fail_updated', 'fail_deleted')) OR
         (log_type = 'reactions' AND al.event_type = 'reaction_added') OR
         (log_type = 'erreurs' AND al.event_type LIKE '%error%') OR
         (log_type = 'admin' AND al.event_type LIKE 'admin_%') OR
         (log_type = 'securite' AND al.event_type IN ('login_failed', 'suspicious_activity')) OR
         (log_type = 'performances' AND al.event_type LIKE '%slow%'))
        AND (period_hours IS NULL OR al.created_at >= NOW() - (period_hours || ' hours')::interval)
    ORDER BY al.created_at DESC
    LIMIT max_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_activity(p_event_type text, p_user_id uuid DEFAULT NULL::uuid, p_target_id uuid DEFAULT NULL::uuid, p_message text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO activity_logs (event_type, user_id, target_id, message, details)
    VALUES (p_event_type, p_user_id, p_target_id, p_message, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_login(p_user_id uuid, p_ip text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_name text;
    log_id uuid;
BEGIN
    SELECT COALESCE(display_name, username, email) INTO user_name 
    FROM profiles WHERE id = p_user_id;
    
    INSERT INTO activity_logs (event_type, user_id, message, details, ip_address, user_agent)
    VALUES (
        'user_login',
        p_user_id,
        'Connexion utilisateur: ' || COALESCE(user_name, 'Utilisateur inconnu'),
        jsonb_build_object(
            'user_name', user_name,
            'login_time', NOW()
        ),
        p_ip,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_management_action(p_admin_id uuid, p_target_user_id uuid, p_action_type text, p_target_object_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    log_id uuid;
    admin_name text;
    target_name text;
BEGIN
    SELECT COALESCE(display_name, username) INTO admin_name FROM profiles WHERE id = p_admin_id;
    SELECT COALESCE(display_name, username) INTO target_name FROM profiles WHERE id = p_target_user_id;
    
    INSERT INTO user_management_logs 
    (admin_id, target_user_id, action_type, target_object_id, old_values, new_values, reason)
    VALUES (p_admin_id, p_target_user_id, p_action_type, p_target_object_id, p_old_values, p_new_values, p_reason)
    RETURNING id INTO log_id;
    
    -- Aussi ajouter dans activity_logs pour visibilité globale
    PERFORM log_activity(
        'admin_user_management',
        p_admin_id,
        p_target_user_id,
        admin_name || ' a effectué l''action "' || p_action_type || '" sur ' || target_name,
        jsonb_build_object(
            'action_type', p_action_type,
            'target_user', target_name,
            'reason', p_reason
        )
    );
    
    RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_log_fail_created()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM log_activity(
        'fail_created',
        NEW.user_id,
        NEW.id,
        'Nouveau fail créé: ' || NEW.title,
        jsonb_build_object(
            'title', NEW.title,
            'anonymous', NEW.anonymous,
            'category', NEW.category
        )
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_log_profile_created()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM log_activity(
        'account_created',
        NEW.id,
        NULL,
        'Nouveau compte créé: ' || COALESCE(NEW.display_name, NEW.username, NEW.email),
        jsonb_build_object(
            'email', NEW.email,
            'username', NEW.username,
            'display_name', NEW.display_name,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_log_reaction_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    fail_title text;
BEGIN
    -- Récupérer le titre du fail
    SELECT title INTO fail_title FROM fails WHERE id = NEW.fail_id;
    
    PERFORM log_activity(
        'reaction_added',
        NEW.user_id,
        NEW.id,
        'Réaction "' || NEW.reaction_type || '" ajoutée au fail: ' || COALESCE(fail_title, 'Fail inconnu'),
        jsonb_build_object(
            'reaction_type', NEW.reaction_type,
            'fail_id', NEW.fail_id,
            'fail_title', fail_title
        )
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_invalid_reaction_counts()
 RETURNS TABLE(fail_id uuid, fail_title text, stored_courage integer, actual_courage bigint, stored_laugh integer, actual_laugh bigint, stored_empathy integer, actual_empathy bigint, stored_support integer, actual_support bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as fail_id,
        f.title as fail_title,
        f.courage_count as stored_courage,
        COALESCE(courage_stats.count, 0) as actual_courage,
        f.laugh_count as stored_laugh,
        COALESCE(laugh_stats.count, 0) as actual_laugh,
        f.empathy_count as stored_empathy,
        COALESCE(empathy_stats.count, 0) as actual_empathy,
        f.support_count as stored_support,
        COALESCE(support_stats.count, 0) as actual_support
    FROM fails f
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'courage' 
        GROUP BY fail_id
    ) courage_stats ON f.id = courage_stats.fail_id
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'laugh' 
        GROUP BY fail_id
    ) laugh_stats ON f.id = laugh_stats.fail_id
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'empathy' 
        GROUP BY fail_id
    ) empathy_stats ON f.id = empathy_stats.fail_id
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'support' 
        GROUP BY fail_id
    ) support_stats ON f.id = support_stats.fail_id
    WHERE 
        f.courage_count != COALESCE(courage_stats.count, 0) OR
        f.laugh_count != COALESCE(laugh_stats.count, 0) OR
        f.empathy_count != COALESCE(empathy_stats.count, 0) OR
        f.support_count != COALESCE(support_stats.count, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_orphaned_reactions()
 RETURNS TABLE(reaction_id uuid, fail_id uuid, user_id uuid, reaction_type text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as reaction_id,
        r.fail_id,
        r.user_id,
        r.reaction_type,
        r.created_at
    FROM reactions r
    LEFT JOIN fails f ON r.fail_id = f.id
    WHERE f.id IS NULL;
END;
$function$
;

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant references on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant trigger on table "public"."activity_logs" to "anon";

grant truncate on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant references on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant trigger on table "public"."activity_logs" to "authenticated";

grant truncate on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant references on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant trigger on table "public"."activity_logs" to "service_role";

grant truncate on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."user_management_logs" to "anon";

grant insert on table "public"."user_management_logs" to "anon";

grant references on table "public"."user_management_logs" to "anon";

grant select on table "public"."user_management_logs" to "anon";

grant trigger on table "public"."user_management_logs" to "anon";

grant truncate on table "public"."user_management_logs" to "anon";

grant update on table "public"."user_management_logs" to "anon";

grant delete on table "public"."user_management_logs" to "authenticated";

grant insert on table "public"."user_management_logs" to "authenticated";

grant references on table "public"."user_management_logs" to "authenticated";

grant select on table "public"."user_management_logs" to "authenticated";

grant trigger on table "public"."user_management_logs" to "authenticated";

grant truncate on table "public"."user_management_logs" to "authenticated";

grant update on table "public"."user_management_logs" to "authenticated";

grant delete on table "public"."user_management_logs" to "service_role";

grant insert on table "public"."user_management_logs" to "service_role";

grant references on table "public"."user_management_logs" to "service_role";

grant select on table "public"."user_management_logs" to "service_role";

grant trigger on table "public"."user_management_logs" to "service_role";

grant truncate on table "public"."user_management_logs" to "service_role";

grant update on table "public"."user_management_logs" to "service_role";

create policy "Admin can view all activity logs"
on "public"."activity_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Admin can view user management logs"
on "public"."user_management_logs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


CREATE TRIGGER trigger_fail_created AFTER INSERT ON public.fails FOR EACH ROW EXECUTE FUNCTION trigger_log_fail_created();

CREATE TRIGGER trigger_profile_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_log_profile_created();

CREATE TRIGGER trigger_reaction_added AFTER INSERT ON public.reactions FOR EACH ROW EXECUTE FUNCTION trigger_log_reaction_added();


