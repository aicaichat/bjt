import React, { createContext, useContext, useEffect, useState } from 'react';

// BJT Tech Theme Types
export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'bjt-tech';

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// BJT Tech Theme Configuration
const THEME_CONFIG = {
  'bjt-tech': {
    name: 'BJT Tech',
    description: 'Professional, playful, and clean technology company theme',
    cssFile: 'bjt-tech.css',
    primaryColor: '#1a57a5',
    secondaryColor: '#ff6b35',
    modes: ['light', 'dark'] as ThemeMode[],
  }
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'bjt-tech',
  defaultMode = 'light',
}) => {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from localStorage
  useEffect(() => {
    const loadThemePreferences = () => {
      try {
        const savedTheme = localStorage.getItem('bjt-theme') as ThemeName;
        const savedMode = localStorage.getItem('bjt-theme-mode') as ThemeMode;
        
        if (savedTheme && THEME_CONFIG[savedTheme]) {
          setTheme(savedTheme);
        }
        
        if (savedMode && ['light', 'dark'].includes(savedMode)) {
          setMode(savedMode);
        } else {
          // Auto-detect user preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setMode(prefersDark ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('Failed to load theme preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreferences();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return;

    const applyTheme = () => {
      try {
        // Remove any existing theme classes
        document.documentElement.classList.remove('bjt-tech', 'bjt-dark-mode');
        
        // Apply BJT Tech theme
        document.documentElement.classList.add('bjt-tech');
        
        // Apply mode-specific classes
        if (mode === 'dark') {
          document.documentElement.classList.add('bjt-dark-mode');
        }

        // Set CSS custom properties for dynamic theming
        const root = document.documentElement;
        const config = THEME_CONFIG[theme];
        
        root.style.setProperty('--theme-primary', config.primaryColor);
        root.style.setProperty('--theme-secondary', config.secondaryColor);
        root.style.setProperty('--theme-mode', mode);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', config.primaryColor);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = config.primaryColor;
          document.head.appendChild(meta);
        }

        // Announce theme change to screen readers
        const announcement = `Theme changed to ${config.name} ${mode} mode`;
        const srOnlyElement = document.createElement('div');
        srOnlyElement.setAttribute('aria-live', 'polite');
        srOnlyElement.setAttribute('aria-atomic', 'true');
        srOnlyElement.className = 'bjt-sr-only';
        srOnlyElement.textContent = announcement;
        document.body.appendChild(srOnlyElement);
        
        setTimeout(() => {
          document.body.removeChild(srOnlyElement);
        }, 1000);

      } catch (error) {
        console.error('Failed to apply theme:', error);
      }
    };

    applyTheme();
  }, [theme, mode, isLoading]);

  // Save preferences to localStorage
  useEffect(() => {
    if (isLoading) return;

    try {
      localStorage.setItem('bjt-theme', theme);
      localStorage.setItem('bjt-theme-mode', mode);
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }, [theme, mode, isLoading]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem('bjt-theme-mode');
      if (!hasManualPreference) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSetTheme = (newTheme: ThemeName) => {
    if (THEME_CONFIG[newTheme]) {
      setTheme(newTheme);
    }
  };

  const handleSetMode = (newMode: ThemeMode) => {
    if (['light', 'dark'].includes(newMode)) {
      setMode(newMode);
    }
  };

  const toggleMode = () => {
    setMode(current => current === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    theme,
    mode,
    setTheme: handleSetTheme,
    setMode: handleSetMode,
    toggleMode,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme utility functions
export const getThemeConfig = (themeName: ThemeName) => {
  return THEME_CONFIG[themeName];
};

export const getAllThemes = () => {
  return Object.entries(THEME_CONFIG).map(([key, config]) => ({
    key: key as ThemeName,
    ...config,
  }));
};

// CSS-in-JS helper for theme-aware styling
export const createThemeStyles = (lightStyles: any, darkStyles: any = {}) => {
  return {
    ...lightStyles,
    '@media (prefers-color-scheme: dark)': {
      '.bjt-dark-mode &': darkStyles,
    },
  };
};

// Higher-order component for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: ThemeName; mode: ThemeMode }>
) => {
  return (props: P) => {
    const { theme, mode } = useTheme();
    return <Component {...props} theme={theme} mode={mode} />;
  };
};

export default ThemeContext; 