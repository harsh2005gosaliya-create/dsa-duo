// src/components/GoalTracker.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  groupId: string;
}

export const GoalTracker: React.FC<Props> = ({ groupId }) => {
  const [target, setTarget] = useState<number>(1);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [progress, setProgress] = useState<number>(0);
  const [totalTarget, setTotalTarget] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Load current goal and progress
  useEffect(() => {
    const fetchGoal = async () => {
      const { data, error } = await supabase.rpc('get_group_goal', { p_group_id: groupId });
      if (!error && data && data.length) {
        setTarget(data[0].target_per_member);
        setPeriod(data[0].period);
      }
    };
    const fetchProgress = async () => {
      const { data, error } = await supabase.from('group_goal_progress').select('solved_today,total_target').eq('group_id', groupId).single();
      if (!error && data) {
        setProgress(data.solved_today);
        setTotalTarget(data.total_target);
      }
    };
    fetchGoal();
    fetchProgress();
  }, [groupId]);

  const saveGoal = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('set_group_goal', {
      p_group_id: groupId,
      p_target: target,
      p_period: period,
    });
    setLoading(false);
    if (error) toast.error('Failed to save goal');
    else toast.success('Goal updated');
  };

  const percent = totalTarget ? Math.min(100, (progress / totalTarget) * 100) : 0;

  return (
    <div className="space-y-3 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-medium">Group Goal ({period})</h3>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min={1}
          className="w-16 border rounded px-2 py-1"
          value={target}
          onChange={e => setTarget(parseInt(e.target.value) || 1)}
        />
        <span>problems per member</span>
      </div>
      <div className="flex items-center space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={period}
          onChange={e => setPeriod(e.target.value as any)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <Button onClick={saveGoal} disabled={loading}>
          {loading ? 'Saving…' : 'Save Goal'}
        </Button>
      </div>
      <div className="mt-2">
        <Progress value={percent} className="w-full" />
        <p className="text-sm text-center mt-1">{progress}/{totalTarget} solved today</p>
      </div>
    </div>
  );
};
