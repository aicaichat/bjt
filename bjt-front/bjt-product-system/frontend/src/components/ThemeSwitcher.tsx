import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import '../styles/ThemeSwitcher.css';

interface ThemeSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '', variant = 'default' }) => {
  const { theme, mode, toggleMode, isLoading } = useTheme();
  const { t, i18n } = useTranslation();

  // 根据当前语言获取文本
  const getText = () => {
    const isZh = i18n.language.includes('zh');
    return {
      themeLabel: isZh ? '主题:' : 'Theme:',
      themeName: isZh ? 'BJT 科技' : 'BJT Tech',
      lightMode: isZh ? '浅色模式' : 'Light Mode',
      darkMode: isZh ? '深色模式' : 'Dark Mode',
      switchToLight: isZh ? '切换到浅色模式' : 'Switch to Light Mode',
      switchToDark: isZh ? '切换到深色模式' : 'Switch to Dark Mode',
      lightLabel: isZh ? '浅色' : 'Light',
      darkLabel: isZh ? '深色' : 'Dark',
    };
  };

  const texts = getText();

  if (isLoading) {
    return (
      <div className={`bjt-theme-switcher ${className}`} data-variant={variant}>
        <div className="bjt-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`bjt-theme-switcher ${className}`} data-variant={variant}>
      {variant !== 'inline' && variant !== 'compact' && (
        <span className="bjt-theme-switcher-label">{texts.themeLabel}</span>
      )}
      <div className="bjt-theme-info">
        {variant !== 'inline' && (
          <div className="bjt-current-theme">
            <span className="bjt-theme-name">{texts.themeName}</span>
            {variant !== 'compact' && (
              <span className="bjt-theme-mode">
                {mode === 'light' ? texts.lightMode : texts.darkMode}
              </span>
            )}
          </div>
        )}
        <button
          className="bjt-theme-toggle"
          onClick={toggleMode}
          aria-label={mode === 'light' ? texts.switchToDark : texts.switchToLight}
          title={mode === 'light' ? texts.switchToDark : texts.switchToLight}
        >
          <div className="bjt-toggle-track">
            <div className={`bjt-toggle-thumb ${mode}`}>
              {mode === 'light' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="m12 1 0 2"/>
                  <path d="m12 21 0 2"/>
                  <path d="m4.22 4.22 1.42 1.42"/>
                  <path d="m18.36 18.36 1.42 1.42"/>
                  <path d="m1 12 2 0"/>
                  <path d="m21 12 2 0"/>
                  <path d="m4.22 19.78 1.42-1.42"/>
                  <path d="m18.36 5.64 1.42-1.42"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </div>
          </div>
          {variant !== 'compact' && variant !== 'inline' && (
            <span className="bjt-toggle-label">
              {mode === 'light' ? texts.darkLabel : texts.lightLabel}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
