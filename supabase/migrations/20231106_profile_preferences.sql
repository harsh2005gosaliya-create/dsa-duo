-- --------------------------------------------------------------
-- 20231106_profile_preferences.sql
--  Add user theme and font‑size preferences
-- --------------------------------------------------------------

alter table public.profiles
  add column if not exists pref_theme text not null default 'light',  -- 'light' | 'dark'
  add column if not exists pref_font_size integer not null default 14; -- px

-- Index for quick lookup (optional)
create index if not exists profiles_pref_theme_idx on public.profiles (pref_theme);
