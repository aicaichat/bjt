// Theme constants
export const THEMES = {
  DEFAULT: 'default-theme',
  SIMPLE: 'simple-theme',
  DARK: 'dark-theme'
};

/**
 * Sets the active theme by adding the appropriate class to the document body
 * and saving the preference to localStorage
 */
export const setTheme = (themeName: string): void => {
  // Remove any existing theme classes
  document.body.classList.remove(...Object.values(THEMES));
  
  // Add the new theme class
  document.body.classList.add(themeName);
  
  // Store the theme preference
  localStorage.setItem('bjt-theme-preference', themeName);
};

/**
 * Initialize the theme when the application loads
 */
export const initTheme = (): void => {
  const savedTheme = localStorage.getItem('bjt-theme-preference') || THEMES.DEFAULT;
  setTheme(savedTheme);
}; 