// Role-based Redirection Utility
class RoleRedirect {
  constructor() {
    this.tokenKey = 'skeyy_auth_token';
    this.userKey = 'skeyy_user_data';
  }

  // Get stored user data
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Get current page path
  getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  // Get current directory
  getCurrentDirectory() {
    const path = window.location.pathname;
    if (path.includes('/admin pannel/')) return 'admin';
    if (path.includes('/vendor pannel/')) return 'vendor';
    return 'frontend';
  }

  // Check if current page is a login/signup page
  isAuthPage() {
    const page = this.getCurrentPage();
    return ['login.html', 'signup.html', 'register.html'].includes(page);
  }

  // Check if current page requires authentication
  isProtectedPage() {
    const page = this.getCurrentPage();
    const protectedPages = [
      'profile.html', 
      'orders.html', 
      'checkout.html',
      'wishlist.html',
      'index.html' // vendor and admin dashboards
    ];
    
    const currentDir = this.getCurrentDirectory();
    
    // All admin and vendor panel pages are protected
    if (currentDir === 'admin' || currentDir === 'vendor') {
      return true;
    }
    
    // Some frontend pages are protected
    return protectedPages.includes(page);
  }

  // Redirect to appropriate dashboard based on role
  redirectToDashboard(user = null) {
    const userData = user || this.getUser();
    
    if (!userData) {
      this.redirectToLogin();
      return;
    }

    switch (userData.role) {
      case 'admin':
        window.location.href = this.getAdminPanelUrl();
        break;
      case 'vendor':
        window.location.href = this.getVendorPanelUrl();
        break;
      case 'user':
      default:
        window.location.href = this.getFrontendUrl();
        break;
    }
  }

  // Redirect to login page from any location
  redirectToLogin() {
    const currentDir = this.getCurrentDirectory();

    switch (currentDir) {
      case 'admin':
        window.location.href = '../frontend/login.html';
        break;
      case 'vendor':
        window.location.href = '../frontend/login.html'; // redirect to main login
        break;
      case 'frontend':
      default:
        window.location.href = 'login.html';
        break;
    }
  }

  // Get URL paths for different panels
  getFrontendUrl(page = 'index.html') {
    const currentDir = this.getCurrentDirectory();
    
    switch (currentDir) {
      case 'admin':
        return `../frontend/${page}`;
      case 'vendor':
        return `../frontend/${page}`;
      case 'frontend':
      default:
        return page;
    }
  }

  getAdminPanelUrl(page = 'index.html') {
    const currentDir = this.getCurrentDirectory();
    
    switch (currentDir) {
      case 'admin':
        return page;
      case 'vendor':
        return `../admin pannel/${page}`;
      case 'frontend':
      default:
        return `../admin pannel/${page}`;
    }
  }

  getVendorPanelUrl(page = 'index.html') {
    const currentDir = this.getCurrentDirectory();
    
    switch (currentDir) {
      case 'admin':
        return `../vendor pannel/${page}`;
      case 'vendor':
        return page;
      case 'frontend':
      default:
        return `../vendor pannel/${page}`;
    }
  }

  // Check access permissions for current page
  checkPageAccess() {
    const user = this.getUser();
    const currentDir = this.getCurrentDirectory();
    const isAuthenticated = this.isAuthenticated();

    // If not authenticated and on protected page, redirect to login
    if (!isAuthenticated && this.isProtectedPage()) {
      this.redirectToLogin();
      return false;
    }

    // If authenticated and on auth page, redirect to dashboard
    if (isAuthenticated && this.isAuthPage()) {
      this.redirectToDashboard(user);
      return false;
    }

    // If authenticated, check role-based access
    if (isAuthenticated && user) {
      // Admin trying to access vendor panel or vice versa
      if (currentDir === 'admin' && user.role !== 'admin') {
        this.redirectToDashboard(user);
        return false;
      }
      
      if (currentDir === 'vendor' && user.role !== 'vendor') {
        this.redirectToDashboard(user);
        return false;
      }
    }

    return true;
  }

  // Initialize role-based redirection on page load
  init() {
    // Check page access permissions
    if (!this.checkPageAccess()) {
      return; // Redirection happened, stop execution
    }

    // Update navigation based on user role
    this.updateNavigation();
  }

  // Update navigation elements based on user role
  updateNavigation() {
    const user = this.getUser();
    const isAuthenticated = this.isAuthenticated();

    // Update login/logout buttons
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');

    if (isAuthenticated) {
      // Hide login links
      loginLinks.forEach(link => {
        if (link.textContent.toLowerCase().includes('login')) {
          link.style.display = 'none';
        }
      });

      // Show logout buttons
      logoutButtons.forEach(btn => {
        btn.style.display = 'inline-block';
      });

      // Add user info if available
      if (user) {
        this.addUserInfo(user);
      }
    } else {
      // Show login links
      loginLinks.forEach(link => {
        link.style.display = 'inline-block';
      });

      // Hide logout buttons
      logoutButtons.forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }

  // Add user information to navigation
  addUserInfo(user) {
    const userInfoElements = document.querySelectorAll('.user-info, .user-email');
    userInfoElements.forEach(element => {
      if (element.classList.contains('user-email')) {
        element.textContent = user.email;
      } else {
        element.textContent = `Welcome, ${user.role}`;
      }
    });
  }
}

// Create global instance
const roleRedirect = new RoleRedirect();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  roleRedirect.init();
});
