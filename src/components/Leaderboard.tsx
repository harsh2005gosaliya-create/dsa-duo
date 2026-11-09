// src/components/Leaderboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Props {
  groupId: string;
}

interface Row {
  user_id: string;
  username: string;
  solved: number;
}

export const Leaderboard: React.FC<Props> = ({ groupId }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('group_leaderboard', { p_group_id: groupId });
      if (error) {
        toast.error('Failed to load leaderboard');
        console.error(error);
      } else {
        setRows(data as Row[]);
      }
      setLoading(false);
    };
    fetch();
  }, [groupId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Leaderboard (this month)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading…</p>
        ) : rows.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          <ol className="list-decimal list-inside space-y-1">
            {rows.map((r, idx) => (
              <li key={r.user_id} className="flex items-center space-x-2">
                <Avatar src={`/api/avatar/${r.user_id}`} alt={r.username} className="w-6 h-6" />
                <span className="font-medium">{r.username}</span>
                <span className="ml-auto">{r.solved} solved</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
