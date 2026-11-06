// src/hooks/useThemePreference.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useThemePreference = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);

  // Load from profile on mount
  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('pref_theme')
        .eq('id', user.id)
        .single();
      if (error) {
        toast.error('Failed to load theme preference');
        console.error(error);
      } else if (data) {
        setTheme(data.pref_theme);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ pref_theme: newTheme })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to save theme');
      console.error(error);
    }
  };

  return { theme, toggle, loading };
};
