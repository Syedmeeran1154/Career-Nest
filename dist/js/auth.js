// Authentication and User Management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.init();
  }

  init() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('cn_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.redirectToDashboard();
      } catch (error) {
        localStorage.removeItem('cn_current_user');
      }
    }
  }

  loadUsers() {
    try {
      return JSON.parse(localStorage.getItem('cn_users')) || {};
    } catch {
      return {};
    }
  }

  saveUsers() {
    localStorage.setItem('cn_users', JSON.stringify(this.users));
  }

  hashPassword(password) {
    // Simple hash function for demo purposes
    // In production, use proper hashing like bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    return password.length >= 6;
  }

  async signup(name, email, password, confirmPassword) {
    try {
      // Validation
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      
      if (!this.validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!this.validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (this.users[email]) {
        throw new Error('An account with this email already exists');
      }

      // Create user
      const hashedPassword = this.hashPassword(password);
      const user = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        profile: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: '',
          bio: '',
          photo: ''
        }
      };

      this.users[email] = user;
      this.saveUsers();
      
      return { success: true, message: 'Account created successfully!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async login(email, password) {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password) {
        throw new Error('Password is required');
      }

      const user = this.users[email.toLowerCase().trim()];
      if (!user) {
        throw new Error('No account found with this email address');
      }

      const hashedPassword = this.hashPassword(password);
      if (user.password !== hashedPassword) {
        throw new Error('Incorrect password');
      }

      this.currentUser = user;
      localStorage.setItem('cn_current_user', JSON.stringify(user));
      
      return { success: true, message: 'Welcome back!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('cn_current_user');
    window.location.href = 'index.html';
  }

  redirectToDashboard() {
    window.location.href = 'dashboard.html';
  }
}

// UI Functions
function showAuth(type) {
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  modal.classList.remove('hidden');
  
  if (type === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function hideAuth() {
  document.getElementById('authModal').classList.add('hidden');
}

function switchAuth(type) {
  showAuth(type);
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function showMessage(message, isError = false) {
  const successEl = document.getElementById('successMessage');
  const errorEl = document.getElementById('errorMessage');
  
  if (isError) {
    document.getElementById('errorText').textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 4000);
  } else {
    document.getElementById('successText').textContent = message;
    successEl.classList.remove('hidden');
    setTimeout(() => successEl.classList.add('hidden'), 4000);
  }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Form Event Listeners
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const result = await authManager.login(email, password);
  
  if (result.success) {
    showMessage(result.message);
    setTimeout(() => {
      hideAuth();
      authManager.redirectToDashboard();
    }, 1000);
  } else {
    showMessage(result.message, true);
  }
});

document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  const result = await authManager.signup(name, email, password, confirmPassword);
  
  if (result.success) {
    showMessage(result.message);
    setTimeout(() => {
      switchAuth('login');
      // Pre-fill login form
      document.getElementById('loginEmail').value = email;
    }, 1500);
  } else {
    showMessage(result.message, true);
  }
});

// Close modal on outside click
document.getElementById('authModal').addEventListener('click', (e) => {
  if (e.target.id === 'authModal') {
    hideAuth();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideAuth();
  }
});