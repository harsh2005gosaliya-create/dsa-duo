// src/hooks/useGroup.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export interface GroupMember {
  user_id: string;
  username: string;
  role: 'admin' | 'member';
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  members: GroupMember[];
}

/** Hook that fetches the current group (if any) for the logged‑in user */
export function useGroup() {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        setSession(sess);
        if (sess?.user) await fetchGroup(sess.user.id);
        setLoading(false);
      }
    );
    // initial fetch
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchGroup(data.session.user.id);
      setLoading(false);
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  /** Load the group the user belongs to (assumes single active group) */
  async function fetchGroup(userId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id!inner(id, name, created_by), role')
      .eq('user_id', userId)
      .single();
    if (error || !data) {
      setGroup(null);
      return;
    }
    const { group_id, role } = data as any;
    // fetch all members of this group
    const { data: members, error: memErr } = await supabase
      .from('group_members')
      .select('user_id, role, profiles(username)')
      .eq('group_id', group_id.id);
    if (memErr) {
      console.error(memErr);
      setGroup(null);
      return;
    }
    const enriched: GroupMember[] = (members as any[]).map((m) => ({
      user_id: m.user_id,
      username: m.profiles?.username ?? '',
      role: m.role,
    }));
    setGroup({
      id: group_id.id,
      name: group_id.name,
      created_by: group_id.created_by,
      members: enriched,
    });
  }

  /** Create a new group with a free‑form name */
  async function createGroup(name: string) {
    if (!session?.user) return;
    const { error } = await supabase.rpc('create_group', {
      p_name: name,
      p_creator_id: session.user.id,
    });
    if (error) throw error;
    await fetchGroup(session.user.id);
  }

  /** Join an existing group by its UUID (invite code) */
  async function joinGroup(groupId: string) {
    if (!session?.user) return;
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: session.user.id, role: 'member' });
    if (error) throw error;
    await fetchGroup(session.user.id);
  }

  return { group, loading, createGroup, joinGroup, reload: () => group && fetchGroup(group.id) };
}
