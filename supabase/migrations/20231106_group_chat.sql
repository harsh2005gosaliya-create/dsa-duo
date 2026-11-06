-- --------------------------------------------------------------
-- 20231106_group_chat.sql
--  Table for real‑time group chat messages
-- --------------------------------------------------------------

create table if not exists public.group_messages (
  id          uuid default gen_random_uuid() primary key,
  group_id    uuid references public.groups (id) on delete cascade,
  sender_id   uuid references public.profiles (id) on delete set null,
  content     text not null,
  created_at  timestamp with time zone default now() not null
);

create index if not exists group_messages_group_id_idx on public.group_messages (group_id);

-- Enable realtime for the table (Supabase automatically does this if you have the Realtime feature enabled)
