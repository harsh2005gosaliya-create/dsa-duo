// src/components/BadgeList.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface BadgeInfo {
  key: string;
  title: string;
  description: string;
  icon?: string; // optional icon name from lucide-react
}

export const BadgeList: React.FC<{ userId: string }> = ({ userId }) => {
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Join user_badges with badge_catalog to get full info
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_key')
        .eq('user_id', userId);
      if (error) {
        toast.error('Failed to load badges');
        console.error(error);
        setLoading(false);
        return;
      }
      const keys = (data as any[]).map((b) => b.badge_key);
      if (keys.length === 0) {
        setBadges([]);
        setLoading(false);
        return;
      }
      const { data: catalog, error: catErr } = await supabase
        .from('badge_catalog')
        .select('*')
        .in('key', keys);
      if (catErr) {
        toast.error('Failed to load badge catalog');
        console.error(catErr);
      } else {
        setBadges(catalog as BadgeInfo[]);
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) return <p>Loading badges…</p>;

  if (badges.length === 0) return <p>No badges earned yet.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Badges</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {badges.map((b) => (
          <Badge key={b.key} className="flex items-center space-x-2 p-2">
            {b.icon && <span className="text-xl">{b.icon}</span>}
            <div>
              <div className="font-medium">{b.title}</div>
              <div className="text-sm text-gray-600">{b.description}</div>
            </div>
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
};
