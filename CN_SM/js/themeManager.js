// Theme Management System
class ThemeManager {
  constructor() {
    // Removed dark theme - keeping only light theme
    this.currentTheme = 'light';
    this.init();
  }

  init() {
    // Light theme is default - no special initialization needed
  }

  // Method to get current theme colors for other components
  getCurrentThemeColors() {
    return {
      primary: '#6366f1',
      secondary: '#4338ca',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0'
    };
  }
}