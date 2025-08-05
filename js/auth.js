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

  // Google OAuth login
  async googleLogin(googleToken, selectedRole = null) {
    try {
      console.log('Sending Google OAuth request with role:', selectedRole); // Debug log

      const response = await fetch(`${this.baseURL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: googleToken,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      // Store auth data
      this.setAuthData(data.data.token, data.data.user);

      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
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

  // Redirect to admin panel
  redirectToAdminPanel() {
    window.location.href = '../admin pannel/index.html';
  }

  // Redirect to vendor panel
  redirectToVendorPanel() {
    window.location.href = '../vendor pannel/index.html';
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

  validatePhone(phone) {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
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
      const loginResult = await authService.login(email, password);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'login__success';
      successDiv.textContent = 'Login successful! Redirecting...';
      loginForm.appendChild(successDiv);

      // Check user role and redirect accordingly
      const user = loginResult.data.user;
      setTimeout(() => {
        if (user.role === 'admin') {
          authService.redirectToAdminPanel();
        } else if (user.role === 'vendor') {
          authService.redirectToVendorPanel();
        } else {
          authService.redirectToHome();
        }
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

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '96328381016-bmfdjscc3rfh8576dhpmlo57pgk9d0ue.apps.googleusercontent.com'; // Replace with your actual client ID

// Initialize Google OAuth
function initializeGoogleAuth() {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn
    });

    // Render button immediately if on auth pages
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'signup.html') {
      renderGoogleSignInButton('google-signin-button');
    }
  }
}

// Handle Google Sign-In response
async function handleGoogleSignIn(response) {
  try {
    // First, check if user already exists
    const existingUserCheck = await checkExistingGoogleUser(response.credential);

    if (existingUserCheck.exists) {
      // User exists, proceed with normal login
      await processGoogleLogin(response.credential);
    } else {
      // New user, show role selection modal
      showRoleSelectionModal(response.credential);
    }

  } catch (error) {
    console.error('Google sign-in error:', error);

    const form = document.querySelector('.login__form') || document.querySelector('.signup__form');
    if (form) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'login__error';
      errorDiv.textContent = error.message || 'Google sign-in failed. Please try again.';
      form.appendChild(errorDiv);
    }
  }
}

// Check if Google user already exists
async function checkExistingGoogleUser(googleToken) {
  try {
    const response = await fetch(`${authService.baseURL}/google/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: googleToken })
    });

    const data = await response.json();
    return { exists: data.exists || false };
  } catch (error) {
    console.error('Error checking existing user:', error);
    return { exists: false };
  }
}

// Process Google login for existing users
async function processGoogleLogin(googleToken, selectedRole = null) {
  try {
    const submitBtn = document.querySelector('.btn--primary');
    const originalText = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
      submitBtn.textContent = 'Signing in with Google...';
      submitBtn.disabled = true;
    }

    const result = await authService.googleLogin(googleToken, selectedRole);

    // Show success message
    const form = document.querySelector('.login__form') || document.querySelector('.signup__form');
    if (form) {
      const successDiv = document.createElement('div');
      successDiv.className = 'login__success';
      successDiv.textContent = 'Google sign-in successful! Redirecting...';
      form.appendChild(successDiv);
    }

    // Check user role and redirect accordingly
    const user = result.data.user;
    setTimeout(() => {
      if (user.role === 'admin') {
        authService.redirectToAdminPanel();
      } else if (user.role === 'vendor') {
        authService.redirectToVendorPanel();
      } else {
        authService.redirectToHome();
      }
    }, 1000);

  } catch (error) {
    console.error('Google login processing error:', error);

    const form = document.querySelector('.login__form') || document.querySelector('.signup__form');
    if (form) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'login__error';
      errorDiv.textContent = error.message || 'Google sign-in failed. Please try again.';
      form.appendChild(errorDiv);
    }
  } finally {
    const submitBtn = document.querySelector('.btn--primary');
    if (submitBtn) {
      submitBtn.textContent = originalText || 'Login';
      submitBtn.disabled = false;
    }
  }
}

// Show role selection modal for new Google users
function showRoleSelectionModal(googleToken) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'role-modal-overlay';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'role-modal-content';

  modalContent.innerHTML = `
    <div class="role-modal-header">
      <h3>Choose Your Account Type</h3>
      <p>Please select how you want to use your account:</p>
    </div>

    <div class="role-modal-options">
      <div class="role-option" data-role="user">
        <div class="role-icon">👤</div>
        <div class="role-info">
          <h4>Customer</h4>
          <p>Browse and purchase products</p>
        </div>
      </div>

      <div class="role-option" data-role="vendor">
        <div class="role-icon">🏪</div>
        <div class="role-info">
          <h4>Vendor/Business</h4>
          <p>Sell products and manage inventory</p>
        </div>
      </div>
    </div>

    <div class="role-modal-actions">
      <button class="btn btn--secondary" id="cancelRoleSelection">Cancel</button>
      <button class="btn btn--primary" id="confirmRoleSelection" disabled>Continue</button>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  let selectedRole = null;

  // Handle role selection
  const roleOptions = modalContent.querySelectorAll('.role-option');
  const confirmBtn = modalContent.querySelector('#confirmRoleSelection');

  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove previous selection
      roleOptions.forEach(opt => opt.classList.remove('selected'));

      // Add selection to clicked option
      option.classList.add('selected');
      selectedRole = option.dataset.role;

      // Enable confirm button
      confirmBtn.disabled = false;
    });
  });

  // Handle confirm button
  confirmBtn.addEventListener('click', async () => {
    if (selectedRole) {
      modalOverlay.remove();

      // Special handling for vendor role
      if (selectedRole === 'vendor') {
        // Store Google token and redirect to vendor registration
        sessionStorage.setItem('googleToken', googleToken);
        sessionStorage.setItem('pendingRole', selectedRole);
        window.location.href = '../vendor pannel/register.html';
      } else {
        // Process normal login for user role
        await processGoogleLogin(googleToken, selectedRole);
      }
    }
  });

  // Handle cancel button
  modalContent.querySelector('#cancelRoleSelection').addEventListener('click', () => {
    modalOverlay.remove();
  });

  // Handle overlay click to close
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });
}

// Render Google Sign-In button
function renderGoogleSignInButton(elementId) {
  if (typeof google !== 'undefined' && google.accounts) {
    const container = document.getElementById(elementId);
    if (container) {
      // Clear loading message
      container.innerHTML = '';

      google.accounts.id.renderButton(
        container,
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with'
        }
      );
    }
  }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Google OAuth
  initializeGoogleAuth();

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

  // Render Google Sign-In buttons on auth pages
  if (currentPage === 'login.html' || currentPage === 'signup.html') {
    // Try to render immediately, then retry if needed
    const googleButtonContainer = document.getElementById('google-signin-button');
    if (googleButtonContainer) {
      // Try immediate render
      if (typeof google !== 'undefined' && google.accounts) {
        renderGoogleSignInButton('google-signin-button');
      } else {
        // If Google API not loaded yet, wait a bit and retry
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
          if (typeof google !== 'undefined' && google.accounts) {
            renderGoogleSignInButton('google-signin-button');
            clearInterval(retryInterval);
          } else if (retryCount >= maxRetries) {
            clearInterval(retryInterval);
            console.warn('Google API failed to load');
          }
          retryCount++;
        }, 100); // Check every 100ms instead of waiting 1 second
      }
    }
  }

  // Initialize forms
  initializeLoginForm();
  initializeSignupForm();
});
