-- --------------------------------------------------------------
-- 20231106_badges.sql
--  Badge catalogue and per‑user badge tracking
-- --------------------------------------------------------------

create table if not exists public.badge_catalog (
  key         text primary key,
  title       text not null,
  description text not null,
  icon        text                     -- optional icon name (e.g. "star", "trophy")
);

insert into public.badge_catalog (key, title, description, icon) values
  ('first_group_solve',        'First Group Solve',        'Solved the first problem inside a group',       'star'),
  ('group_30_day_streak',      '30‑Day Group Streak',      'All members solved at least one problem for 30 consecutive days', 'trophy'),
  ('leader_of_the_pack',       'Leader of the Pack',       'Top solver in the group for the current month', 'crown')
on conflict do nothing;

create table if not exists public.user_badges (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles (id) on delete cascade,
  badge_key   text references public.badge_catalog (key) on delete cascade,
  earned_at   timestamp with time zone default now() not null,
  unique (user_id, badge_key)
);
