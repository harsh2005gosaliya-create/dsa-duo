// src/components/HeatMap.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Props {
  groupId: string;
}

interface DayCount {
  day: string; // YYYY‑MM‑DD
  count: number;
}

/** Simple 7x53 grid heat‑map (similar to GitHub contributions) */
export const HeatMap: React.FC<Props> = ({ groupId }) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase.rpc('group_daily_solve_counts', { p_group_id: groupId });
      if (error) {
        toast.error('Failed to load heat‑map');
        console.error(error);
      } else if (rows) {
        const map: Record<string, number> = {};
        (rows as DayCount[]).forEach(r => (map[r.day] = r.count));
        setData(map);
      }
      setLoading(false);
    };
    fetch();
  }, [groupId]);

  // Generate weeks (53) and days (0‑6) – we pad missing days with empty cells
  const weeks = Array.from({ length: 53 }, (_, i) => i);
  const days = Array.from({ length: 7 }, (_, i) => i);

  const colorFor = (cnt: number) => {
    if (cnt === 0) return 'bg-gray-200';
    if (cnt < 2) return 'bg-green-200';
    if (cnt < 5) return 'bg-green-400';
    return 'bg-green-600';
  };

  // Build a map from ISO date string to count, but the grid expects keys like "YYYY‑MM‑DD"
  // We'll use the date string directly.
  return (
    <Card>
      <CardHeader><CardTitle>Group Heat‑Map (solves per day)</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="grid grid-cols-53 gap-px">
            {weeks.map(w =>
              days.map(d => {
                // Compute the calendar date for this cell: start from the most recent Sunday
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() - w * 7);
                const cellDate = new Date(startOfWeek);
                cellDate.setDate(startOfWeek.getDate() + d);
                const iso = cellDate.toISOString().split('T')[0];
                const cnt = data[iso] ?? 0;
                return (
                  <div
                    key={`${w}-${d}`}
                    className={`w-2 h-2 ${colorFor(cnt)} rounded-sm`}
                    title={`${cnt} solves on ${iso}`}
                  />
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
