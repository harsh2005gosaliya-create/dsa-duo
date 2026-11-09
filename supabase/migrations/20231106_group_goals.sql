-- --------------------------------------------------------------
-- 20231106_group_goals.sql
--  Table to store a daily/weekly goal for each group
-- --------------------------------------------------------------

create table if not exists public.group_goals (
  id            uuid default gen_random_uuid() primary key,
  group_id      uuid references public.groups (id) on delete cascade,
  target_per_member integer not null default 1,   -- e.g., each member solves at least 1 problem per day
  period        text   not null default 'daily',   -- can be 'daily', 'weekly', 'monthly'
  created_at    timestamp with time zone default now() not null,
  updated_at    timestamp with time zone default now() not null
);

create index if not exists group_goals_group_id_idx on public.group_goals (group_id);

-- RPC to set or update a goal for a group
create or replace function public.set_group_goal(p_group_id uuid, p_target integer, p_period text)
returns void as $$
begin
  insert into public.group_goals (group_id, target_per_member, period)
  values (p_group_id, p_target, p_period)
  on conflict (group_id) do update set
    target_per_member = excluded.target_per_member,
    period = excluded.period,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- RPC to fetch the current goal for a group
create or replace function public.get_group_goal(p_group_id uuid)
returns table (target_per_member integer, period text) as $$
  select target_per_member, period
  from public.group_goals
  where group_id = p_group_id;
$$ language sql stable;

-- View to compute current progress for each group (solved today vs target)
create or replace view public.group_goal_progress as
select
  g.id as group_id,
  gg.target_per_member * count(distinct gm.user_id) as total_target,
  coalesce(sum(case when s.status = 'solved' and s.created_at >= date_trunc('day', now()) then 1 else 0 end),0) as solved_today
from public.groups g
join public.group_goals gg on gg.group_id = g.id
join public.group_members gm on gm.group_id = g.id
left join public.shares sh on sh.group_id = g.id
left join public.submissions s on s.problem_id = sh.problem_id and s.user_id = gm.user_id
group by g.id, gg.target_per_member;

-- --------------------------------------------------------------
-- END OF MIGRATION
--------------------------------------------------------------
