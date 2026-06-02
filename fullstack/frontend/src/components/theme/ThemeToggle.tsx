import { useTheme } from '../../theme/useTheme';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { mode, toggleColorMode } = useTheme();
  const isDark = mode === 'dark';


  
  return (
    <button
      type="button"
      onClick={toggleColorMode}
      className="inline-flex items-center justify-center rounded-xl p-2 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
