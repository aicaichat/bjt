import React, { useEffect, useState } from 'react';
import '../styles/ThemeSwitcher.css';

// 定义主题常量
export const THEMES = {
  MODERN: 'theme-modern',
  SIMPLE: 'theme-simple',
  VIBRANT: 'theme-vibrant',
  CLASSIC: 'theme-classic',
  TECH: 'theme-tech',
  ELEGANT: 'theme-elegant',
  PLAYFUL: 'theme-playful',
  AUTO: 'theme-auto' // 添加自动模式
};

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
  const [activeTheme, setActiveTheme] = useState<string>(THEMES.MODERN);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [systemThemeIsDark, setSystemThemeIsDark] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const themes = [
    { id: THEMES.AUTO, label: 'Auto' },
    { id: THEMES.MODERN, label: 'Modern Tech' },
    { id: THEMES.SIMPLE, label: 'Clean Simple' },
    { id: THEMES.VIBRANT, label: 'Vibrant Style' },
    { id: THEMES.CLASSIC, label: 'Classic Business' },
    { id: THEMES.TECH, label: 'Dark Tech' },
    { id: THEMES.ELEGANT, label: 'Elegant Style' },
    { id: THEMES.PLAYFUL, label: 'Playful Interactive' }
  ];

  // 根据系统设置选择亮色或暗色主题
  const getAutoTheme = (): string => {
    return systemThemeIsDark ? THEMES.TECH : THEMES.MODERN;
  };

  // 验证主题是否有效
  const isValidTheme = (theme: string): boolean => {
    return Object.values(THEMES).includes(theme);
  };

  // 应用主题
  const applyTheme = (theme: string, withTransition: boolean = true) => {
    let themeToApply = theme;
    
    // 如果是自动模式，则根据系统设置选择主题
    if (theme === THEMES.AUTO) {
      themeToApply = getAutoTheme();
    }
    
    if (withTransition) {
      document.documentElement.classList.add('theme-transition');
    }
    
    document.documentElement.className = withTransition 
      ? `${themeToApply} theme-transition` 
      : themeToApply;
    
    if (withTransition) {
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 500);
    }
  };

  // 监听系统主题变化
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemThemeIsDark(e.matches);
      
      // 如果当前是自动模式，则切换主题
      if (activeTheme === THEMES.AUTO) {
        applyTheme(THEMES.AUTO);
      }
    };
    
    // 添加系统主题变化监听器
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // 兼容旧版浏览器
      darkModeMediaQuery.addListener(handleSystemThemeChange);
    }
    
    return () => {
      // 移除监听器
      if (darkModeMediaQuery.removeEventListener) {
        darkModeMediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        darkModeMediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [activeTheme]);

  useEffect(() => {
    // 添加淡入CSS类
    document.documentElement.classList.add('theme-transition');
    
    // 初始化从localStorage获取主题或设置默认值
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme && isValidTheme(savedTheme) ? savedTheme : THEMES.MODERN;
    
    setActiveTheme(initialTheme);
    applyTheme(initialTheme, false); // 初始化时不使用过渡效果
    
    // 短暂延迟后移除过渡效果，以确保后续主题切换时有过渡效果
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
      setIsInitialized(true);
    }, 100);

    // 监听其他标签页的主题变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue && isValidTheme(e.newValue)) {
        setActiveTheme(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleThemeChange = (themeId: string) => {
    if (!isValidTheme(themeId)) return;
    
    setActiveTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('theme', themeId);
  };

  if (!isInitialized) return null; // 初始化完成前不渲染组件

  return (
    <div className={`bjt-theme-switcher ${className}`}>
      <span className="bjt-theme-switcher-label">Theme:</span>
      <div className="bjt-theme-options">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`bjt-theme-option ${activeTheme === theme.id ? 'active' : ''}`}
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
