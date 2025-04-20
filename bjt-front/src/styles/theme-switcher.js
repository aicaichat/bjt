/**
 * 主题切换器
 * 用于管理网站主题的切换和保存用户主题偏好
 */

// 可用的主题
const THEMES = {
  DEFAULT: 'theme-default',   // 默认主题
  SIMPLE: 'theme-simple',     // 简约主题
  DARK: 'theme-dark'          // 深色主题
};

// 本地存储的主题设置键名
const THEME_STORAGE_KEY = 'bjt-theme-preference';

// 初始化主题切换器
function initThemeSwitcher() {
  // 从本地存储获取保存的主题
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  
  // 如果有已保存的主题，应用该主题，否则使用默认主题
  if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
    setTheme(savedTheme);
  } else {
    setTheme(THEMES.DEFAULT);
  }
  
  // 初始化主题下拉菜单
  initThemeDropdown();
}

// 设置主题
function setTheme(themeName) {
  // 移除所有主题类
  document.body.classList.remove(...Object.values(THEMES));
  
  // 添加选择的主题类
  document.body.classList.add(themeName);
  
  // 保存到本地存储
  localStorage.setItem(THEME_STORAGE_KEY, themeName);
  
  // 更新切换按钮的状态
  updateThemeButtonStates(themeName);
}

// 初始化主题下拉菜单
function initThemeDropdown() {
  // 查找页面上的主题切换按钮
  const themeButtons = document.querySelectorAll('[data-theme]');
  
  // 为每个按钮添加点击事件
  themeButtons.forEach(button => {
    const themeName = button.getAttribute('data-theme');
    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (Object.values(THEMES).includes(themeName)) {
        setTheme(themeName);
      }
    });
  });
  
  // 初始时更新按钮状态
  const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || THEMES.DEFAULT;
  updateThemeButtonStates(currentTheme);
}

// 更新主题按钮的状态
function updateThemeButtonStates(activeTheme) {
  const themeButtons = document.querySelectorAll('[data-theme]');
  
  themeButtons.forEach(button => {
    const themeName = button.getAttribute('data-theme');
    
    // 移除所有活动状态类
    button.classList.remove('active');
    
    // 为当前活动主题添加活动状态类
    if (themeName === activeTheme) {
      button.classList.add('active');
    }
  });
}

// 当DOM内容加载完成后初始化主题切换器
document.addEventListener('DOMContentLoaded', initThemeSwitcher);

// 导出函数供其他模块使用
export { setTheme, THEMES }; 