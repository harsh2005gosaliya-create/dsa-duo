-- --------------------------------------------------------------
-- 20231106_streak_functions.sql
--  Helper functions for heat‑map, streak and analytics
-- --------------------------------------------------------------

/* Returns total solves per day for a given group (used by the HeatMap UI) */
create or replace function public.group_daily_solve_counts(p_group_id uuid)
returns table (day text, count bigint) as
$$
  select
    to_char(date_trunc('day', s.created_at), 'YYYY-MM-DD') as day,
    count(*) as count
  from submissions s
  join shares sh on sh.problem_id = s.problem_id
  where sh.group_id = p_group_id
    and s.status = 'solved'
  group by day
  order by day;
$$ language sql stable;

/* Returns the length (in days) of the *current* streak – consecutive days
   up to today where the group had at least one solved problem. */
create or replace function public.group_current_streak(p_group_id uuid)
returns int as
$$
  with daily as (
    select distinct date_trunc('day', s.created_at)::date as d
    from submissions s
    join shares sh on sh.problem_id = s.problem_id
    where sh.group_id = p_group_id
      and s.status = 'solved'
  ), seq as (
    select d,
      row_number() over (order by d) -
      row_number() over (partition by true order by d) as grp
    from daily
  )
  select count(*) from seq
  where d >= current_date - (count(*) - 1);
$$ language sql stable;
