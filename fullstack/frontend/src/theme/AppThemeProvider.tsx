import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext, type ThemeContextType, type ThemeMode } from './ThemeContext';

const THEME_STORAGE_KEY = 'freshly-theme';

const getDeviceTheme = (): ThemeMode => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
};

const storeTheme = (theme: ThemeMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme() || getDeviceTheme());
  const [isDeviceTheme, setIsDeviceTheme] = useState<boolean>(() => !getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  useEffect(() => {
    if (isDeviceTheme) {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      storeTheme(mode);
    }
  }, [isDeviceTheme, mode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const onDeviceThemeChange = (event: MediaQueryListEvent) => {
      if (isDeviceTheme) {
        setMode(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', onDeviceThemeChange);
    return () => mediaQuery.removeEventListener('change', onDeviceThemeChange);
  }, [isDeviceTheme]);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      mode,
      isDeviceTheme,
      toggleColorMode: () => {
        setIsDeviceTheme(false);
        setMode((previousMode) => (previousMode === 'light' ? 'dark' : 'light'));
      },
      resetToDeviceTheme: () => {
        setIsDeviceTheme(true);
        setMode(getDeviceTheme());
      },
    }),
    [isDeviceTheme, mode]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
