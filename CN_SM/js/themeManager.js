// Enhanced Theme Management System with Dark Mode
class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        primary: '#6366f1',
        secondary: '#4338ca',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        cardBg: '#ffffff',
        sidebarBg: 'linear-gradient(180deg, #4338ca, #6366f1)',
        accent: '#10b981'
      },
      dark: {
        primary: '#818cf8',
        secondary: '#6366f1',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
        cardBg: '#1e293b',
        sidebarBg: 'linear-gradient(180deg, #1e293b, #334155)',
        accent: '#34d399'
      }
    };
    
    this.currentTheme = this.loadTheme();
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createToggleButton();
  }

  loadTheme() {
    const saved = localStorage.getItem('cn_theme');
    return saved || 'light';
  }

  saveTheme(theme) {
    localStorage.setItem('cn_theme', theme);
  }

  createToggleButton() {
    // Check if we're on dashboard page
    if (!document.querySelector('.sidebar')) return;

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'fixed top-4 right-4 z-50';
    toggleContainer.innerHTML = `
      <button id="themeToggle" class="theme-toggle-btn p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110">
        <i class="fas ${this.currentTheme === 'light' ? 'fa-moon' : 'fa-sun'} text-xl"></i>
      </button>
    `;

    document.body.appendChild(toggleContainer);

    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.addEventListener('click', () => this.toggleTheme());
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.saveTheme(this.currentTheme);
    this.applyTheme(this.currentTheme);
    this.updateToggleIcon();
  }

  updateToggleIcon() {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
      icon.className = `fas ${this.currentTheme === 'light' ? 'fa-moon' : 'fa-sun'} text-xl`;
    }
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeName}`);

    // Update specific elements
    this.updateElementStyles(theme);
  }

  updateElementStyles(theme) {
    // Update body background
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;

    // Update sidebar
    const sidebar = document.querySelector('.sidebar-bg');
    if (sidebar) {
      sidebar.style.background = theme.sidebarBg;
    }

    // Update cards
    const cards = document.querySelectorAll('.bg-white');
    cards.forEach(card => {
      card.style.backgroundColor = theme.cardBg;
      card.style.color = theme.text;
      card.style.borderColor = theme.border;
    });

    // Update inputs
    const inputs = document.querySelectorAll('.input');
    inputs.forEach(input => {
      input.style.backgroundColor = theme.surface;
      input.style.color = theme.text;
      input.style.borderColor = theme.border;
    });

    // Update theme toggle button
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.style.backgroundColor = theme.surface;
      toggleBtn.style.color = theme.text;
      toggleBtn.style.borderColor = theme.border;
    }
  }

  getCurrentThemeColors() {
    return this.themes[this.currentTheme];
  }

  // Method for charts to get theme-appropriate colors
  getChartColors() {
    const isDark = this.currentTheme === 'dark';
    return {
      primary: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
      background: isDark ? '#1e293b' : '#ffffff',
      text: isDark ? '#f1f5f9' : '#1e293b',
      grid: isDark ? '#334155' : '#e5e7eb',
      tooltip: {
        background: isDark ? '#334155' : '#ffffff',
        text: isDark ? '#f1f5f9' : '#1e293b',
        border: isDark ? '#475569' : '#d1d5db'
      }
    };
  }
}