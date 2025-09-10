// Theme Management System
class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        name: 'Light',
        icon: '🌞',
        colors: {
          primary: '#6366f1',
          secondary: '#4338ca',
          background: '#f8fafc',
          surface: '#ffffff',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0'
        }
      },
      dark: {
        name: 'Dark',
        icon: '🌙',
        colors: {
          primary: '#818cf8',
          secondary: '#6366f1',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#334155'
        }
      }
    };
    
    this.currentTheme = this.loadTheme();
    this.init();
  }

  loadTheme() {
    return localStorage.getItem('cn_theme') || 'light';
  }

  saveTheme(theme) {
    localStorage.setItem('cn_theme', theme);
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeToggle();
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Update body classes
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${themeName}`);

    // Apply theme-specific styles
    if (themeName === 'dark') {
      this.applyDarkTheme();
    } else {
      this.applyLightTheme();
    }

    this.currentTheme = themeName;
    this.saveTheme(themeName);
    this.updateThemeToggle();
  }

  applyDarkTheme() {
    const style = document.getElementById('theme-styles') || document.createElement('style');
    style.id = 'theme-styles';
    style.textContent = `
      body.theme-dark {
        background-color: #0f172a !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .sidebar-bg {
        background: linear-gradient(180deg, #1e293b, #334155) !important;
      }
      
      .theme-dark .bg-white {
        background-color: #1e293b !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .bg-gray-50 {
        background-color: #0f172a !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .bg-gray-100 {
        background-color: #334155 !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .text-gray-800,
      .theme-dark .text-gray-700,
      .theme-dark .text-slate-800 {
        color: #f1f5f9 !important;
      }
      
      .theme-dark .text-gray-600,
      .theme-dark .text-slate-600 {
        color: #cbd5e1 !important;
      }
      
      .theme-dark .text-gray-500,
      .theme-dark .text-slate-500 {
        color: #94a3b8 !important;
      }
      
      .theme-dark .border-gray-200 {
        border-color: #475569 !important;
      }
      
      .theme-dark .border-gray-300 {
        border-color: #64748b !important;
      }
      
      .theme-dark .border-gray-100 {
        border-color: #374151 !important;
      }
      
      .theme-dark .shadow-md {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3) !important;
      }
      
      .theme-dark .shadow-lg {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3) !important;
      }
      
      .theme-dark .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2) !important;
      }
      
      .theme-dark .input,
      .theme-dark input[type="text"],
      .theme-dark input[type="email"],
      .theme-dark input[type="tel"],
      .theme-dark input[type="url"],
      .theme-dark textarea {
        background-color: #334155 !important;
        border-color: #64748b !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .input:focus,
      .theme-dark input:focus,
      .theme-dark textarea:focus {
        border-color: #818cf8 !important;
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1) !important;
      }
      
      .theme-dark .resume-preview {
        background-color: #1e293b !important;
      }
      
      .theme-dark .resume-page {
        background-color: #ffffff !important;
        color: #1e293b !important;
      }
      
      .theme-dark .hover\\:bg-gray-50:hover {
        background-color: #374151 !important;
      }
      
      .theme-dark .hover\\:bg-gray-100:hover {
        background-color: #4b5563 !important;
      }
      
      .theme-dark .hover\\:shadow-md:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4) !important;
      }
      
      .theme-dark .glass-effect {
        background: rgba(30, 41, 59, 0.8) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(148, 163, 184, 0.2) !important;
      }
      
      .theme-dark .input-field {
        background: rgba(51, 65, 85, 0.9) !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .input-field:focus {
        background: rgba(51, 65, 85, 1) !important;
      }
      
      .theme-dark .chip {
        background-color: #374151 !important;
        color: #f1f5f9 !important;
      }
      
      .theme-dark .chip:hover {
        background-color: #4b5563 !important;
      }
      
      .theme-dark .resume-pill {
        background-color: #374151 !important;
        color: #f1f5f9 !important;
        border-color: #4b5563 !important;
      }
    `;
    
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  }

  applyLightTheme() {
    const style = document.getElementById('theme-styles');
    if (style) {
      style.remove();
    }
  }

  createThemeToggle() {
    // Check if toggle already exists
    if (document.getElementById('themeToggle')) return;

    const toggle = document.createElement('button');
    toggle.id = 'themeToggle';
    toggle.className = 'fixed top-4 right-4 z-50 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full shadow-lg hover:bg-white/30 transition-all duration-300 hover:scale-110';
    toggle.innerHTML = `<span class="text-xl">${this.themes[this.currentTheme].icon}</span>`;
    toggle.title = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;
    
    toggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    document.body.appendChild(toggle);
  }

  updateThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.innerHTML = `<span class="text-xl">${this.themes[this.currentTheme].icon}</span>`;
      toggle.title = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    
    // Add a subtle animation
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  // Method to get current theme colors for other components
  getCurrentThemeColors() {
    return this.themes[this.currentTheme].colors;
  }
}