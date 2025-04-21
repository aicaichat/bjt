import React, { useEffect, useState } from 'react';
import '../styles/ThemeSwitcher.css';

const ThemeSwitcher: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<string>('theme-modern');

  const themes = [
    { id: 'theme-modern', label: 'Modern Tech' },
    { id: 'theme-simple', label: 'Clean Simple' },
    { id: 'theme-dark', label: 'Dark Mode' }
  ];

  useEffect(() => {
    // Initialize from localStorage or set default
    const savedTheme = localStorage.getItem('theme') || 'theme-modern';
    setActiveTheme(savedTheme);
    document.documentElement.className = savedTheme;

    // Listen for theme changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setActiveTheme(e.newValue);
        document.documentElement.className = e.newValue;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    document.documentElement.className = themeId;
    localStorage.setItem('theme', themeId);
  };

  return (
    <div className="theme-switcher">
      <span className="theme-switcher-label">Theme:</span>
      <div className="theme-options">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-option ${activeTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            aria-label={`Switch to ${theme.label} theme`}
          >
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
