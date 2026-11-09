// src/components/ThemeToggle.tsx
import { useThemePreference } from '@/hooks/useThemePreference';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggle, loading } = useThemePreference();

  if (loading) return null;

  return (
    <Button variant="ghost" size="sm" onClick={toggle}>
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
};
