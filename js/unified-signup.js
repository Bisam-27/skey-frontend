// Simplified Signup Handler with Vendor Redirect
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  if (authService.isAuthenticated()) {
    const user = authService.getUser();
    if (user) {
      // Redirect based on role
      if (user.role === 'admin') {
        authService.redirectToAdminPanel();
      } else if (user.role === 'vendor') {
        authService.redirectToVendorPanel();
      } else {
        authService.redirectToHome();
      }
      return;
    }
  }

  // Initialize signup form
  initializeSignupForm();
});

function initializeSignupForm() {
  const signupForm = document.querySelector('#signupForm');
  const userTypeRadios = document.querySelectorAll('input[name="userType"]');

  if (!signupForm || !userTypeRadios.length) return;

  // Handle user type toggle
  userTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'vendor') {
        // Redirect to vendor signup page
        window.location.href = '../vendor pannel/register.html';
      }
      // If user selects customer, stay on current page (no action needed)
    });
  });

  // Handle customer signup form submission
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await handleCustomerSignup(e);
  });

  // Clear errors on input
  const inputs = signupForm.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      FormValidator.clearError(this);
    });
  });
}

async function handleCustomerSignup(event) {
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  // Clear previous errors
  FormValidator.clearAllErrors(form);

  // Get form data
  const formData = {
    email: form.querySelector('#signupEmail').value.trim(),
    password: form.querySelector('#signupPassword').value,
    confirmPassword: form.querySelector('#signupConfirmPassword').value
  };

  // Validate form
  const validation = validateCustomerSignupForm(formData);
  if (!validation.isValid) {
    showValidationErrors(form, validation.errors);
    return;
  }

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creating Account...';
  submitBtn.disabled = true;

  try {
    // Use regular user registration
    const signupResult = await authService.register(formData.email, formData.password);

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'signup__success';
    successDiv.style.cssText = `
      background-color: #d4edda;
      color: #155724;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
      text-align: center;
      border: 1px solid #c3e6cb;
      font-weight: bold;
    `;

    successDiv.innerHTML = `
      <h3>Account Created Successfully!</h3>
      <p>Welcome to sKeyy! Your customer account has been created.</p>
      <p>Redirecting to homepage...</p>
    `;

    form.insertBefore(successDiv, form.firstChild);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Redirect to homepage
    setTimeout(() => {
      authService.redirectToHome();
    }, 2000);

  } catch (error) {
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'signup__error';
    errorDiv.style.cssText = `
      background-color: #f8d7da;
      color: #721c24;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
      text-align: center;
      border: 1px solid #f5c6cb;
      font-weight: bold;
    `;
    errorDiv.innerHTML = `
      <h3>Signup Failed</h3>
      <p>${error.message}</p>
    `;

    form.insertBefore(errorDiv, form.firstChild);
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } finally {
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Customer form validation
function validateCustomerSignupForm(formData) {
  const errors = [];

  // Basic validation
  if (!formData.email) {
    errors.push({ field: 'signupEmail', message: 'Email is required' });
  } else if (!FormValidator.validateEmail(formData.email)) {
    errors.push({ field: 'signupEmail', message: 'Please enter a valid email' });
  }

  if (!formData.password) {
    errors.push({ field: 'signupPassword', message: 'Password is required' });
  } else if (formData.password.length < 6) {
    errors.push({ field: 'signupPassword', message: 'Password must be at least 6 characters long' });
  }

  if (!formData.confirmPassword) {
    errors.push({ field: 'signupConfirmPassword', message: 'Please confirm your password' });
  } else if (formData.password !== formData.confirmPassword) {
    errors.push({ field: 'signupConfirmPassword', message: 'Passwords do not match' });
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Show validation errors
function showValidationErrors(form, errors) {
  errors.forEach(error => {
    const input = form.querySelector(`#${error.field}`);
    if (input) {
      FormValidator.showError(input, error.message);
    }
  });
}
