-- --------------------------------------------------------------
-- 20231106_create_group_rpc.sql
--  RPC to create a group and automatically add the creator as admin
-- --------------------------------------------------------------

create or replace function public.create_group(p_name text, p_creator_id uuid)
returns uuid as $$
declare
  new_gid uuid;
begin
  insert into public.groups (name, created_by)
  values (p_name, p_creator_id)
  returning id into new_gid;

  insert into public.group_members (group_id, user_id, role)
  values (new_gid, p_creator_id, 'admin');

  return new_gid;
end;
$$ language plpgsql security definer;
