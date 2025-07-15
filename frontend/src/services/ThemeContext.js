// ThemeContext.js - Version sans JSX pour extension .js

import { createContext, useContext, useState, useEffect, createElement } from 'react';

// Créer le contexte de thème
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le contexte de thème
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
};

// Configuration des thèmes
const themeConfig = {
  light: {
    name: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  }
};

// Fonction pour détecter la préférence système
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Fonction pour appliquer le thème au DOM
const applyTheme = (themeName) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const theme = themeConfig[themeName] || themeConfig.light;
  
  // Supprimer les anciennes classes
  root.classList.remove('light', 'dark');
  root.classList.add(theme.name);
  
  // Appliquer les variables CSS
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
};

// Provider du contexte (sans JSX)
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || getSystemTheme();
  });

  // Surveiller les changements système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      if (!localStorage.getItem('theme')) {
        setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Appliquer le thème
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setThemeManual = (newTheme) => {
    if (themeConfig[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeManual,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    colors: themeConfig[theme]?.colors || themeConfig.light.colors
  };

  // Utiliser createElement au lieu de JSX
  return createElement(ThemeContext.Provider, { value }, children);
};

export default ThemeContext;