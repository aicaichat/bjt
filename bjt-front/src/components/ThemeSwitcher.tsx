import React, { useState, useEffect } from 'react';
import { THEMES, setTheme } from '../styles/theme-switcher.js';
import '../styles/ThemeSwitcher.css';

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
  const [activeTheme, setActiveTheme] = useState<string>(
    localStorage.getItem('bjt-theme-preference') || THEMES.DEFAULT
  );
  
  const themeLabels = {
    [THEMES.DEFAULT]: 'BJT Blue',
    [THEMES.SIMPLE]: 'Clean Simple',
    [THEMES.DARK]: 'Dark Mode'
  };
  
  useEffect(() => {
    // Initialize from localStorage
    const savedTheme = localStorage.getItem('bjt-theme-preference') || THEMES.DEFAULT;
    setActiveTheme(savedTheme);
    setTheme(savedTheme); // Apply theme on component mount

    // Listen for storage events (if changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bjt-theme-preference') {
        setActiveTheme(e.newValue || THEMES.DEFAULT);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const handleThemeChange = (themeName: string) => {
    setTheme(themeName);
    setActiveTheme(themeName);
  };
  
  return (
    <div className={`theme-switcher ${className}`}>
      <div className="theme-options">
        {Object.entries(themeLabels).map(([theme, label]) => (
          <button
            key={theme}
            className={`theme-option ${activeTheme === theme ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme)}
            aria-label={`Switch to ${label} theme`}
          >
            <span className="theme-color-preview" data-theme={theme}></span>
            <span className="theme-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
