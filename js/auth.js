// Authentication Service
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/auth';
    this.tokenKey = 'skeyy_auth_token';
    this.userKey = 'skeyy_user_data';
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user data
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Store token and user data
  setAuthData(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear auth data
  clearAuthData() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Make authenticated API request
  async makeAuthRequest(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    if (options.headers) {
      finalOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }

    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear auth data
          this.clearAuthData();
          this.redirectToLogin();
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Auth API request failed:', error);
      throw error;
    }
  }

  // Register new user
  async register(email, password, confirmPassword) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, confirmPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store auth data
      this.setAuthData(data.data.token, data.data.user);

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth data
      this.setAuthData(data.data.token, data.data.user);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      await this.makeAuthRequest('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      this.redirectToLogin();
    }
  }

  // Get user profile
  async getProfile() {
    return await this.makeAuthRequest('/profile');
  }

  // Redirect to login page
  redirectToLogin() {
    if (window.location.pathname !== '/login.html') {
      window.location.href = 'login.html';
    }
  }

  // Redirect to home page
  redirectToHome() {
    window.location.href = 'index.html';
  }

  // Update navigation based on auth status
  updateNavigation() {
    // Target the user icon in the navbar (links to either login.html or profile.html)
    const userIcon = document.querySelector('.nav__list-item a[href="login.html"], .nav__list-item a[href="profile.html"]');
    const userIconParent = userIcon?.parentElement;

    if (this.isAuthenticated()) {
      if (userIconParent) {
        userIconParent.innerHTML = `
          <div class="nav__user-dropdown">
            <button class="nav__user-btn">
              <img src="img/icon-user.svg" alt="" class="nav__btn-icon" />
            </button>
            <div class="nav__user-menu">
              <a href="profile.html" class="nav__user-link">
                <img src="img/icon-profile.svg" alt="" class="nav__menu-icon" />
                Profile
              </a>
              <button onclick="authService.logout()" class="nav__user-link nav__logout-btn">
                <img src="img/icon-right.svg" alt="" class="nav__menu-icon" />
                Logout
              </button>
            </div>
          </div>
        `;
      }
    } else {
      if (userIconParent) {
        userIconParent.innerHTML = `
          <a href="login.html" class="nav__btn">
            <img src="img/icon-user.svg" alt="" class="nav__btn-icon" />
          </a>
        `;
      }
    }
  }
}

// Create global auth service instance
const authService = new AuthService();

// Form validation utilities
const FormValidator = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password) {
    return password && password.length >= 6;
  },

  validatePasswordMatch(password, confirmPassword) {
    return password === confirmPassword;
  },

  showError(element, message) {
    this.clearError(element);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input__error';
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
    element.classList.add('input__control--error');
  },

  clearError(element) {
    const errorDiv = element.parentNode.querySelector('.input__error');
    if (errorDiv) {
      errorDiv.remove();
    }
    element.classList.remove('input__control--error');
  },

  clearAllErrors(form) {
    const errorDivs = form.querySelectorAll('.input__error');
    errorDivs.forEach(div => div.remove());
    
    const errorInputs = form.querySelectorAll('.input__control--error');
    errorInputs.forEach(input => input.classList.remove('input__control--error'));
  }
};

// Login form handler
function initializeLoginForm() {
  const loginForm = document.querySelector('.login__form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const emailInput = loginForm.querySelector('input[type="email"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');
    const submitBtn = loginForm.querySelector('.btn--primary');

    // Clear previous errors
    FormValidator.clearAllErrors(loginForm);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation
    let hasErrors = false;

    if (!email) {
      FormValidator.showError(emailInput, 'Email is required');
      hasErrors = true;
    } else if (!FormValidator.validateEmail(email)) {
      FormValidator.showError(emailInput, 'Please enter a valid email');
      hasErrors = true;
    }

    if (!password) {
      FormValidator.showError(passwordInput, 'Password is required');
      hasErrors = true;
    }

    if (hasErrors) return;

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
      await authService.login(email, password);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'login__success';
      successDiv.textContent = 'Login successful! Redirecting...';
      loginForm.appendChild(successDiv);

      // Redirect after short delay
      setTimeout(() => {
        authService.redirectToHome();
      }, 1000);

    } catch (error) {
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'login__error';
      errorDiv.textContent = error.message;
      loginForm.appendChild(errorDiv);

    } finally {
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Signup form handler
function initializeSignupForm() {
  const signupForm = document.querySelector('.signup__form');
  if (!signupForm) return;

  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const emailInput = signupForm.querySelector('input[type="email"]');
    const passwordInputs = signupForm.querySelectorAll('input[type="password"]');
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = passwordInputs[1];
    const submitBtn = signupForm.querySelector('.btn--primary');

    // Clear previous errors
    FormValidator.clearAllErrors(signupForm);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    let hasErrors = false;

    if (!email) {
      FormValidator.showError(emailInput, 'Email is required');
      hasErrors = true;
    } else if (!FormValidator.validateEmail(email)) {
      FormValidator.showError(emailInput, 'Please enter a valid email');
      hasErrors = true;
    }

    if (!password) {
      FormValidator.showError(passwordInput, 'Password is required');
      hasErrors = true;
    } else if (!FormValidator.validatePassword(password)) {
      FormValidator.showError(passwordInput, 'Password must be at least 6 characters long');
      hasErrors = true;
    }

    if (!confirmPassword) {
      FormValidator.showError(confirmPasswordInput, 'Please confirm your password');
      hasErrors = true;
    } else if (!FormValidator.validatePasswordMatch(password, confirmPassword)) {
      FormValidator.showError(confirmPasswordInput, 'Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) return;

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    try {
      await authService.register(email, password, confirmPassword);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'signup__success';
      successDiv.textContent = 'Account created successfully! Redirecting...';
      signupForm.appendChild(successDiv);

      // Redirect after short delay
      setTimeout(() => {
        authService.redirectToHome();
      }, 1000);

    } catch (error) {
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'signup__error';
      errorDiv.textContent = error.message;
      signupForm.appendChild(errorDiv);

    } finally {
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  // Update navigation based on auth status
  authService.updateNavigation();

  // Check if user is on a protected page without authentication
  const protectedPages = ['profile.html', 'orders.html', 'checkout.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (protectedPages.includes(currentPage) && !authService.isAuthenticated()) {
    authService.redirectToLogin();
    return;
  }

  // If user is authenticated and on login/signup page, redirect to home
  if ((currentPage === 'login.html' || currentPage === 'signup.html') && authService.isAuthenticated()) {
    authService.redirectToHome();
    return;
  }

  // Initialize forms
  initializeLoginForm();
  initializeSignupForm();
});
