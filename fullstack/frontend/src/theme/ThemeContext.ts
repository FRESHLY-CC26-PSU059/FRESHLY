import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  isDeviceTheme: boolean;
  toggleColorMode: () => void;
  resetToDeviceTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
