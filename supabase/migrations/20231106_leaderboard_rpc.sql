-- --------------------------------------------------------------
-- 20231106_leaderboard_rpc.sql
--  RPC that returns monthly solved counts per member for a group
-- --------------------------------------------------------------

create or replace function public.group_leaderboard(p_group_id uuid)
returns table (
  user_id uuid,
  username text,
  solved bigint
) as
$$
  select
    gm.user_id,
    p.username,
    count(s.id) as solved
  from group_members gm
  join profiles p on p.id = gm.user_id
  left join submissions s
    on s.user_id = gm.user_id
   and s.status = 'solved'
   and s.created_at >= date_trunc('month', now())
  where gm.group_id = p_group_id
  group by gm.user_id, p.username
  order by solved desc;
$$ language sql stable;
