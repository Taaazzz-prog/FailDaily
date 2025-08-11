-- Supprimer les tables existantes si elles existent
drop table if exists public.reactions;
drop table if exists public.fails;
drop table if exists public.badges;
drop table if exists public.user_badges;
drop table if exists public.user_preferences;
drop table if exists public.profiles;

-- Création de la table profiles (utilisateurs)
create table public.profiles (
  id uuid not null primary key, -- Suppression de la référence auth.users pour les tests
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  is_anonymous boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Contraintes
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20),
  constraint display_name_length check (char_length(display_name) >= 1 and char_length(display_name) <= 50),
  constraint bio_length check (char_length(bio) <= 500)
);

-- Création de la table user_preferences (préférences utilisateur)
create table public.user_preferences (
  id uuid references public.profiles(id) on delete cascade not null primary key,
  notifications_enabled boolean default true,
  email_notifications boolean default true,
  push_notifications boolean default true,
  privacy_mode boolean default false,
  show_real_name boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Création de la table badges
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  icon text,
  category text,
  condition_type text not null, -- 'post_count', 'reaction_count', 'streak', etc.
  condition_value integer not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Création de la table user_badges (badges obtenus par les utilisateurs)
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Contrainte d'unicité pour éviter les doublons
  unique(user_id, badge_id)
);

-- Création de la table fails (publications d'échecs)
create table public.fails (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  category text,
  severity text default 'medium', -- 'low', 'medium', 'high'
  is_anonymous boolean default false,
  is_moderated boolean default false,
  moderation_reason text,
  view_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Contraintes
  constraint title_length check (char_length(title) >= 3 and char_length(title) <= 200),
  constraint description_length check (char_length(description) <= 1000),
  constraint severity_values check (severity in ('low', 'medium', 'high'))
);

-- Création de la table reactions (réactions aux fails)
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  fail_id uuid references public.fails(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'laugh', 'sad', 'support', 'shock'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Contrainte d'unicité pour éviter les doublons de réactions
  unique(fail_id, user_id),
  -- Contrainte sur les types de réactions autorisés
  constraint reaction_types check (type in ('laugh', 'sad', 'support', 'shock'))
);

-- Index pour améliorer les performances
create index idx_profiles_username on public.profiles(username);
create index idx_fails_user_id on public.fails(user_id);
create index idx_fails_created_at on public.fails(created_at desc);
create index idx_reactions_fail_id on public.reactions(fail_id);
create index idx_user_badges_user_id on public.user_badges(user_id);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.fails enable row level security;
alter table public.reactions enable row level security;

-- Politiques RLS pour profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Politiques RLS pour user_preferences
create policy "Users can view own preferences" on public.user_preferences
  for select using (auth.uid() = id);

create policy "Users can insert own preferences" on public.user_preferences
  for insert with check (auth.uid() = id);

create policy "Users can update own preferences" on public.user_preferences
  for update using (auth.uid() = id);

-- Politiques RLS pour badges
create policy "Badges are viewable by everyone" on public.badges
  for select using (true);

-- Politiques RLS pour user_badges
create policy "User badges are viewable by everyone" on public.user_badges
  for select using (true);

create policy "Users can insert own badges" on public.user_badges
  for insert with check (auth.uid() = user_id);

-- Politiques RLS pour fails
create policy "Fails are viewable by everyone" on public.fails
  for select using (true);

create policy "Users can insert own fails" on public.fails
  for insert with check (auth.uid() = user_id);

create policy "Users can update own fails" on public.fails
  for update using (auth.uid() = user_id);

create policy "Users can delete own fails" on public.fails
  for delete using (auth.uid() = user_id);

-- Politiques RLS pour reactions
create policy "Reactions are viewable by everyone" on public.reactions
  for select using (true);

create policy "Users can insert own reactions" on public.reactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own reactions" on public.reactions
  for update using (auth.uid() = user_id);

create policy "Users can delete own reactions" on public.reactions
  for delete using (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Triggers pour mettre à jour updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.fails
  for each row execute procedure public.handle_updated_at();

-- Fonction pour créer automatiquement les préférences utilisateur (désactivée pour les tests)
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- as $$
-- begin
--   insert into public.profiles (id, username)
--   values (new.id, new.email);
  
--   insert into public.user_preferences (id)
--   values (new.id);
  
--   return new;
-- end;
-- $$;

-- Trigger pour créer automatiquement le profil et les préférences (désactivé pour les tests)
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- Données de test pour les badges
insert into public.badges (name, description, icon, category, condition_type, condition_value) values
  ('First Fail', 'Posted your first fail', 'trophy', 'milestone', 'post_count', 1),
  ('Prolific Failer', 'Posted 10 fails', 'star', 'milestone', 'post_count', 10),
  ('Fail Master', 'Posted 50 fails', 'crown', 'milestone', 'post_count', 50),
  ('Supportive', 'Gave 25 support reactions', 'heart', 'social', 'reaction_count', 25),
  ('Comedian', 'Received 100 laugh reactions', 'smile', 'social', 'received_laugh', 100),
  ('Week Warrior', 'Posted fails for 7 consecutive days', 'calendar', 'streak', 'daily_streak', 7),
  ('Monthly Champion', 'Posted fails for 30 consecutive days', 'flame', 'streak', 'daily_streak', 30);
