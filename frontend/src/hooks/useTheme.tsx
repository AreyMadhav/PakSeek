import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Settings } from '../types';

interface ThemeContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  getThemeColors: () => { 
    primary: string; 
    secondary: string; 
    accent: string;
    background: string;
    surface: string;
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themePresets = {
  default: { 
    primary: '#6366f1', 
    secondary: '#8b5cf6', 
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155'
  },
  purple: { 
    primary: '#8b5cf6', 
    secondary: '#a855f7', 
    accent: '#d946ef',
    background: '#1a0a2e',
    surface: '#16213e',
    border: '#4c1d95'
  },
  blue: { 
    primary: '#3b82f6', 
    secondary: '#06b6d4', 
    accent: '#0ea5e9',
    background: '#0c1426',
    surface: '#1e3a8a',
    border: '#1d4ed8'
  },
  green: { 
    primary: '#10b981', 
    secondary: '#059669', 
    accent: '#06b6d4',
    background: '#0a2520',
    surface: '#064e3b',
    border: '#065f46'
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    darkMode: true,
    accentColor: '#6366f1',
    themePreset: 'default'
  });

  useEffect(() => {
    const saved = localStorage.getItem('asset-mapper-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('asset-mapper-settings', JSON.stringify(updated));
  };

  const getThemeColors = () => {
    return themePresets[settings.themePreset];
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, getThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}