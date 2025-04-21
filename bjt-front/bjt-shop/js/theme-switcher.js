/**
 * BJT Shop - Theme Switcher
 * 提供暗色模式和亮色模式切换功能
 */

(function() {
  // 存储主题选择的键名
  const THEME_STORAGE_KEY = 'bjt-theme-preference';
  
  // 初始化主题切换器
  function initThemeSwitcher() {
    console.log('Initializing theme switcher');
    
    // 创建主题切换按钮
    createThemeSwitcher();
    
    // 从本地存储加载主题设置
    loadThemePreference();
    
    // 监听系统主题变化
    listenForSystemThemeChanges();
  }
  
  // 创建主题切换按钮
  function createThemeSwitcher() {
    // 检查是否已经存在主题切换按钮
    if (document.getElementById('theme-toggle')) {
      return;
    }
    
    // 寻找顶部导航栏
    const headerNav = document.querySelector('header nav ul') || document.querySelector('header .nav');
    
    if (!headerNav) {
      console.warn('Could not find navigation in header to add theme switcher');
      return;
    }
    
    // 创建主题切换按钮容器
    const themeToggleItem = document.createElement('li');
    themeToggleItem.className = 'nav-item theme-toggle-container';
    
    // 创建主题切换按钮
    const themeToggle = document.createElement('button');
    themeToggle.id = 'theme-toggle';
    themeToggle.className = 'btn-icon';
    themeToggle.setAttribute('aria-label', '切换主题');
    themeToggle.innerHTML = `
      <span class="light-icon">🌞</span>
      <span class="dark-icon">🌙</span>
    `;
    
    // 添加点击事件监听器
    themeToggle.addEventListener('click', toggleTheme);
    
    // 添加到导航栏
    themeToggleItem.appendChild(themeToggle);
    headerNav.appendChild(themeToggleItem);
    
    // 添加相关样式
    addThemeSwitcherStyles();
  }
  
  // 添加主题切换器的样式
  function addThemeSwitcherStyles() {
    // 检查是否已经添加了样式
    if (document.getElementById('theme-switcher-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'theme-switcher-styles';
    style.textContent = `
      .theme-toggle-container {
        margin-left: auto;
      }
      
      #theme-toggle {
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        padding: 0.25rem;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        transition: background-color 0.3s;
      }
      
      #theme-toggle:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .dark-theme #theme-toggle:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .light-icon, .dark-icon {
        transition: opacity 0.3s, transform 0.3s;
      }
      
      .dark-theme .light-icon {
        opacity: 0;
        transform: translateY(10px);
        position: absolute;
      }
      
      .light-theme .dark-icon,
      :root:not(.dark-theme) .dark-icon {
        opacity: 0;
        transform: translateY(10px);
        position: absolute;
      }
      
      .dark-theme .dark-icon,
      .light-theme .light-icon,
      :root:not(.dark-theme) .light-icon {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // 切换主题
  function toggleTheme() {
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    
    if (isDarkTheme) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }
  
  // 设置主题
  function setTheme(theme) {
    console.log(`Setting theme to: ${theme}`);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.add('light-theme');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
    
    // 触发自定义事件
    const event = new CustomEvent('themeChange', { detail: { theme } });
    document.dispatchEvent(event);
  }
  
  // 加载用户主题偏好
  function loadThemePreference() {
    // 获取存储的主题偏好
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (storedTheme) {
      // 如果有存储的偏好，使用它
      setTheme(storedTheme);
    } else {
      // 否则，检查系统偏好
      checkSystemThemePreference();
    }
  }
  
  // 检查系统主题偏好
  function checkSystemThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }
  
  // 监听系统主题变化
  function listenForSystemThemeChanges() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 添加变化监听器
      try {
        // Chrome & Firefox
        mediaQuery.addEventListener('change', (e) => {
          // 只有当用户没有明确设置主题时才跟随系统
          if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        });
      } catch (e1) {
        try {
          // Safari
          mediaQuery.addListener((e) => {
            // 只有当用户没有明确设置主题时才跟随系统
            if (!localStorage.getItem(THEME_STORAGE_KEY)) {
              setTheme(e.matches ? 'dark' : 'light');
            }
          });
        } catch (e2) {
          console.error('Could not add listener for media query', e2);
        }
      }
    }
  }
  
  // 导出公共API
  window.themeManager = {
    toggleTheme,
    setTheme,
    initThemeSwitcher
  };
  
  // 当DOM加载完成后初始化
  document.addEventListener('DOMContentLoaded', initThemeSwitcher);
  
  // 如果DOM已经加载完成，立即初始化
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initThemeSwitcher();
  }
})(); 