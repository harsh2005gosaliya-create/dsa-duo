-- --------------------------------------------------------------
-- 20231106_add_groups.sql
--  Adds groups, group members, nudges and a view for group missions
-- --------------------------------------------------------------

/*====================================================================
  1️⃣  groups – container for any number of users
====================================================================*/
create table if not exists public.groups (
  id            uuid      default gen_random_uuid() primary key,
  name          text      not null,               -- set by the creator (free‑form)
  created_by    uuid      references public.profiles (id) on delete set null,
  created_at    timestamp with time zone default now() not null,
  updated_at    timestamp with time zone default now() not null
);

/*====================================================================
  2️⃣  group_members – many‑to‑many link between users and groups
====================================================================*/
create table if not exists public.group_members (
  group_id      uuid      references public.groups (id) on delete cascade,
  user_id       uuid      references public.profiles (id) on delete cascade,
  role          text      default 'member',      -- 'admin' for creator, 'member' otherwise
  joined_at     timestamp with time zone default now() not null,
  primary key (group_id, user_id)
);

/*====================================================================
  3️⃣  shares – shift from duo → group
====================================================================*/
alter table public.shares
  add column if not exists group_id uuid references public.groups (id) on delete cascade,
  add column if not exists sharer_id uuid references public.profiles (id) on delete set null;

-- Keep the old duo columns for backward compatibility – they will be
-- ignored by the new UI.  You can drop them later once you’re sure
-- everything works.
-- alter table public.shares drop column if exists from_user;
-- alter table public.shares drop column if exists to_user;

create index if not exists shares_group_id_idx on public.shares (group_id);

/*====================================================================
  4️⃣  nudges – store nudge events (for analytics / history)
====================================================================*/
create table if not exists public.nudges (
  id            uuid      default gen_random_uuid() primary key,
  group_id      uuid      references public.groups (id) on delete cascade,
  sender_id     uuid      references public.profiles (id) on delete set null,
  target_id     uuid      references public.profiles (id) on delete set null, -- null = “all members”
  message       text      not null,               -- the motivational phrase
  created_at    timestamp with time zone default now() not null
);

/*====================================================================
  5️⃣  Helper view – current mission data for a group (used by UI)
====================================================================*/
create view if not exists public.group_missions as
select
  g.id               as group_id,
  p.id               as problem_id,
  p.title,
  p.url,
  p.tags,
  s.created_at       as shared_at,
  array_agg(sm.user_id) filter (where sm.status = 'solved') as solved_by,
  array_agg(sm.user_id) filter (where sm.status = 'pending') as pending_by
from public.groups g
join public.shares s          on s.group_id = g.id
join public.problems p        on p.id = s.problem_id
left join public.submissions sm on sm.problem_id = p.id
group by g.id, p.id, p.title, p.url, p.tags, s.created_at
order by s.created_at desc;
