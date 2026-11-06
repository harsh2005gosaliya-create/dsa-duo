// src/components/NudgeButton.tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, SelectItem } from '@/components/ui/select';

const DEFAULT_MESSAGES = [
  'Let’s push through!',
  'You’ve got this!',
  'Keep coding, the finish line is near!',
  'One more problem, we can do it!'
];

type Props = {
  group: { id: string; members: { user_id: string; username: string }[] };
  senderId: string;
};

export const NudgeButton: React.FC<Props> = ({ group, senderId }) => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>(''); // empty = all
  const [msg, setMsg] = useState<string>(DEFAULT_MESSAGES[0]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    await supabase.from('nudges').insert({
      group_id: group.id,
      sender_id: senderId,
      target_id: target || null,
      message: msg,
    });
    setSending(false);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} disabled={sending}>
        <Zap className="mr-1 h-4 w-4" /> Nudge
      </Button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded bg-white p-3 shadow-lg">
          <label className="block text-xs font-medium mb-1">To (optional)</label>
          <select
            className="w-full border rounded px-2 py-1 mb-2 text-sm"
            value={target}
            onChange={e => setTarget(e.target.value)}
          >
            <option value="">All members</option>
            {group.members.map(m => (
              <option key={m.user_id} value={m.user_id}> {m.username} </option>
            ))}
          </select>
          <label className="block text-xs font-medium mb-1">Message</label>
          <select
            className="w-full border rounded px-2 py-1 mb-2 text-sm"
            value={msg}
            onChange={e => setMsg(e.target.value)}
          >
            {DEFAULT_MESSAGES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <Button className="w-full" onClick={send} disabled={sending}>
            <Check className="mr-1 h-4 w-4" /> Send
          </Button>
        </div>
      )}
    </div>
  );
};
