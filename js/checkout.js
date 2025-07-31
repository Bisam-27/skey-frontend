class CheckoutManager {
  constructor() {
    this.checkoutData = null;
    this.selectedAddressId = null;
    this.init();
  }

  init() {
    this.loadCheckoutData();
    this.bindEvents();
  }

  bindEvents() {
    // Save address button
    const saveAddressBtn = document.getElementById('save-address-btn');
    if (saveAddressBtn) {
      saveAddressBtn.addEventListener('click', () => this.saveAddress());
    }

    // Apply coupon button
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => this.applyCoupon());
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.processCheckout());
    }

    // Real-time validation for form fields
    this.bindFormValidation();
  }

  bindFormValidation() {
    // Postal code validation
    const postalCodeInput = document.getElementById('postal-code');
    if (postalCodeInput) {
      postalCodeInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/\D/g, '');
        e.target.value = value.slice(0, 6);
      });
    }

    // Phone number validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/\D/g, '');
        e.target.value = value.slice(0, 10);
      });
    }

    // Name fields validation (no numbers)
    ['first-name', 'last-name', 'address-name'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/[0-9]/g, '');
        });
      }
    });
  }

  async loadCheckoutData() {
    try {
      const token = localStorage.getItem('skeyy_auth_token');

      // Check if we're running from file:// protocol (direct file access)
      if (window.location.protocol === 'file:') {
        // For file access, fetch data from database using API calls
        await this.loadDataFromDatabase();
        return;
      }

      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      const apiUrl = window.location.protocol === 'file:' ?
        'http://localhost:5000/api/checkout' :
        '/api/checkout';

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        this.checkoutData = data.data;
        this.renderCheckoutData();
      } else {
        if (data.message === 'Cart is empty') {
          this.showEmptyCart();
        } else {
          this.showError(data.message);
        }
      }
    } catch (error) {
      console.error('Load checkout data error:', error);
      // Fallback to localStorage data if API fails
      const cartData = this.getCartFromLocalStorage();
      if (cartData && cartData.items && cartData.items.length > 0) {
        this.checkoutData = {
          cart: cartData,
          addresses: this.getAddressesFromLocalStorage(),
          user: this.getUserFromLocalStorage()
        };
        this.renderCheckoutData();
      } else {
        this.showError('Failed to load checkout data');
      }
    }
  }

  renderCheckoutData() {
    this.renderAddresses();
    this.renderCartProducts();
    this.renderPaymentDetails();
  }

  renderAddresses() {
    const addressesContainer = document.getElementById('checkout-addresses');
    const noAddressesDiv = document.getElementById('no-addresses');

    if (!this.checkoutData.addresses || this.checkoutData.addresses.length === 0) {
      noAddressesDiv.style.display = 'block';
      return;
    }

    noAddressesDiv.style.display = 'none';
    addressesContainer.innerHTML = '';

    this.checkoutData.addresses.forEach((address, index) => {
      const isSelected = address.is_default || index === 0;
      if (isSelected && !this.selectedAddressId) {
        this.selectedAddressId = address.id;
      }

      const addressElement = this.createAddressElement(address, isSelected);
      addressesContainer.appendChild(addressElement);
    });
  }

  createAddressElement(address, isSelected = false) {
    const addressDiv = document.createElement('div');
    addressDiv.className = `cart__address ${isSelected ? 'cart__address--selected' : ''}`;
    addressDiv.dataset.addressId = address.id;

    addressDiv.innerHTML = `
      <div class="cart__address-title-wrapper">
        <div class="bold">${address.name}</div>
        <img
          src="img/icon-tick.svg"
          alt=""
          class="cart__address-icon"
          style="display: ${isSelected ? 'block' : 'none'}"
        />
      </div>
      <p>
        ${address.getFullName ? address.getFullName() : `${address.first_name} ${address.last_name}`}<br>
        ${address.getFormattedAddress ? address.getFormattedAddress() : this.formatAddress(address)}
        ${address.phone ? `<br>Phone: ${address.phone}` : ''}
      </p>
    `;

    // Add click event to select address
    addressDiv.addEventListener('click', () => this.selectAddress(address.id));

    return addressDiv;
  }

  formatAddress(address) {
    let formatted = address.address_line_1;
    if (address.address_line_2) {
      formatted += `, ${address.address_line_2}`;
    }
    formatted += `, ${address.city}, ${address.state} ${address.postal_code}`;
    if (address.country) {
      formatted += `, ${address.country}`;
    }
    return formatted;
  }

  selectAddress(addressId) {
    // Remove selection from all addresses
    document.querySelectorAll('.cart__address').forEach(addr => {
      addr.classList.remove('cart__address--selected');
      const icon = addr.querySelector('.cart__address-icon');
      if (icon) icon.style.display = 'none';
    });

    // Select the clicked address
    const selectedAddress = document.querySelector(`[data-address-id="${addressId}"]`);
    if (selectedAddress) {
      selectedAddress.classList.add('cart__address--selected');
      const icon = selectedAddress.querySelector('.cart__address-icon');
      if (icon) icon.style.display = 'block';
    }

    this.selectedAddressId = addressId;
  }

  renderCartProducts() {
    const productsContainer = document.getElementById('checkout-products');
    const loadingDiv = document.getElementById('checkout-loading');

    if (!this.checkoutData.cart.items || this.checkoutData.cart.items.length === 0) {
      if (productsContainer) {
        productsContainer.innerHTML = '<p>No items in cart</p>';
      }
      return;
    }

    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }

    if (productsContainer) {
      productsContainer.innerHTML = '';

      this.checkoutData.cart.items.forEach(item => {
        const productElement = this.createProductElement(item);
        productsContainer.appendChild(productElement);
      });
    }
  }

  createProductElement(item) {
    const productDiv = document.createElement('div');
    productDiv.className = 'cart__single';

    // Calculate pricing display
    const originalPrice = item.original_price || item.price;
    const discountedPrice = item.discounted_price || item.price;
    const hasDiscount = item.discount_percent && item.discount_percent > 0;

    let priceDisplay = '';
    if (hasDiscount) {
      priceDisplay = `
        <div class="cart__price">
          <span class="cart__price--discounted">₹${discountedPrice}</span>
          <span class="cart__price--original">₹${originalPrice}</span>
          <span class="cart__discount-badge">${item.discount_percent}% OFF</span>
        </div>
      `;
    } else {
      priceDisplay = `<div class="cart__price">₹${item.price}</div>`;
    }

    productDiv.innerHTML = `
      <div class="cart__img-wrapper">
        <img
          src="${this.getProductImageUrl(item.product_image)}"
          alt="${item.product_name}"
          class="cart__img"
        />
      </div>
      <div class="cart__contents-wrapper">
        <div class="cart__content-details">
          <div class="s bold">${item.product_name}</div>
          ${priceDisplay}
          <div class="cart__select-wrapper">
            <div>Qty: ${item.quantity}</div>
          </div>
          <div class="bold cart__subtotal">Subtotal: ₹${item.subtotal}</div>
        </div>
      </div>
    `;

    return productDiv;
  }

  getProductImageUrl(imagePath) {
    if (!imagePath) {
      return 'img/product/default.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return `http://localhost:5000${imagePath}`;
    }
    
    return `http://localhost:5000/${imagePath}`;
  }

  renderPaymentDetails() {
    // Check if we have payment_details from API or need to calculate from cart
    let paymentDetails;

    if (this.checkoutData.payment_details) {
      // Use payment details from API
      paymentDetails = this.checkoutData.payment_details;
    } else {
      // Calculate from cart data
      const cart = this.checkoutData.cart;
      const bagTotal = cart.total_amount || 0;
      const bagDiscount = cart.discount_amount || 0;
      const deliveryFee = cart.delivery_fee || 99;
      const amountPayable = bagTotal - bagDiscount + deliveryFee;

      paymentDetails = {
        bag_total: bagTotal,
        bag_discount: bagDiscount,
        delivery_fee: deliveryFee,
        amount_payable: amountPayable
      };
    }

    // Update the payment details in the UI
    const bagTotalElement = document.getElementById('bag-total');
    const bagDiscountElement = document.getElementById('bag-discount');
    const deliveryFeeElement = document.getElementById('delivery-fee');
    const amountPayableElement = document.getElementById('amount-payable');

    if (bagTotalElement) bagTotalElement.textContent = `₹${paymentDetails.bag_total}`;
    if (bagDiscountElement) bagDiscountElement.textContent = `₹${paymentDetails.bag_discount}`;
    if (deliveryFeeElement) deliveryFeeElement.textContent = `₹${paymentDetails.delivery_fee}`;
    if (amountPayableElement) amountPayableElement.textContent = `₹${paymentDetails.amount_payable}`;
  }

  async saveAddress() {
    const addressData = this.getAddressFormData();
    
    if (!this.validateAddressData(addressData)) {
      return;
    }

    try {
      const token = localStorage.getItem('skeyy_auth_token');
      const apiUrl = window.location.protocol === 'file:' ?
        'http://localhost:5000/api/checkout/address' :
        '/api/checkout/address';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('Address saved successfully');
        this.clearAddressForm();
        this.loadCheckoutData(); // Reload to show new address
      } else {
        this.showError(data.message);
      }
    } catch (error) {
      console.error('Save address error:', error);
      this.showError('Failed to save address');
    }
  }

  getAddressFormData() {
    return {
      name: document.getElementById('address-name').value.trim(),
      first_name: document.getElementById('first-name').value.trim(),
      last_name: document.getElementById('last-name').value.trim(),
      address_line_1: document.getElementById('address-line-1').value.trim(),
      address_line_2: document.getElementById('address-line-2').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      postal_code: document.getElementById('postal-code').value.trim(),
      country: document.getElementById('country').value,
      phone: document.getElementById('phone').value.trim(),
      is_default: document.getElementById('is-default').checked
    };
  }

  validateAddressData(data) {
    const required = ['name', 'first_name', 'last_name', 'address_line_1', 'city', 'state', 'postal_code'];

    for (const field of required) {
      if (!data[field]) {
        this.showError(`${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`);
        return false;
      }
    }

    // Validate postal code format (basic validation for Indian postal codes)
    if (data.postal_code && !/^\d{6}$/.test(data.postal_code)) {
      this.showError('Please enter a valid 6-digit postal code');
      return false;
    }

    // Validate phone number if provided
    if (data.phone && !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) {
      this.showError('Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  }

  clearAddressForm() {
    document.getElementById('address-name').value = '';
    document.getElementById('first-name').value = '';
    document.getElementById('last-name').value = '';
    document.getElementById('address-line-1').value = '';
    document.getElementById('address-line-2').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('postal-code').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('is-default').checked = false;
  }

  async applyCoupon() {
    const couponCode = document.getElementById('coupon-code').value.trim();
    
    if (!couponCode) {
      this.showError('Please enter a coupon code');
      return;
    }

    try {
      const token = localStorage.getItem('skeyy_auth_token');
      const apiUrl = window.location.protocol === 'file:' ?
        'http://localhost:5000/api/cart/coupon' :
        '/api/cart/coupon';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coupon_code: couponCode })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('Coupon applied successfully');
        this.loadCheckoutData(); // Reload to show updated pricing
      } else {
        this.showError(data.message);
      }
    } catch (error) {
      console.error('Apply coupon error:', error);
      this.showError('Failed to apply coupon');
    }
  }

  async processCheckout() {
    if (!this.selectedAddressId) {
      this.showError('Please select a shipping address');
      return;
    }

    try {
      // Show loading state
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        const originalText = checkoutBtn.textContent;
        checkoutBtn.textContent = 'Processing Order...';
        checkoutBtn.disabled = true;
      }

      // Check if we're running from file:// protocol
      if (window.location.protocol === 'file:') {
        // For file protocol, simulate order completion
        this.simulateOrderCompletion();
        return;
      }

      const token = localStorage.getItem('skeyy_auth_token');
      const apiUrl = window.location.protocol === 'file:' ?
        'http://localhost:5000/api/checkout/complete' :
        '/api/checkout/complete';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address_id: this.selectedAddressId,
          payment_method: 'COD' // Default to Cash on Delivery
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store order details for success page
        localStorage.setItem('order_details', JSON.stringify(data.data));

        // Clear cart from localStorage since order is completed
        localStorage.removeItem('cart');

        // Redirect to success page
        window.location.href = 'success.html';
      } else {
        // Restore button state
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
          checkoutBtn.textContent = 'Place Order';
          checkoutBtn.disabled = false;
        }

        this.showError(data.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);

      // Restore button state
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.textContent = 'Place Order';
        checkoutBtn.disabled = false;
      }

      this.showError('Failed to process order. Please try again.');
    }
  }

  showEmptyCart() {
    document.querySelector('.checkout__grid').innerHTML = `
      <div class="checkout__empty">
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart to proceed with checkout.</p>
        <a href="browse.html" class="btn btn--primary">Continue Shopping</a>
      </div>
    `;
  }

  showError(message) {
    // Simple alert for now - you can implement a better notification system
    alert('Error: ' + message);
  }

  showSuccess(message) {
    // Simple alert for now - you can implement a better notification system
    alert('Success: ' + message);
  }

  simulateOrderCompletion() {
    // For file:// protocol, simulate order completion with mock data
    const mockOrderDetails = {
      order_id: Date.now(),
      invoice_id: `INV-${Date.now()}-DEMO`,
      items: this.checkoutData.cart.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.discounted_price || item.price,
        subtotal: item.subtotal
      })),
      payment_details: this.checkoutData.payment_details || {
        bag_total: this.checkoutData.cart.total_amount,
        bag_discount: this.checkoutData.cart.discount_amount || 0,
        delivery_fee: this.checkoutData.cart.delivery_fee || 99,
        amount_payable: (this.checkoutData.cart.total_amount || 0) - (this.checkoutData.cart.discount_amount || 0) + (this.checkoutData.cart.delivery_fee || 99)
      },
      shipping_address: this.getSelectedAddress(),
      payment_method: 'COD',
      order_date: new Date().toISOString(),
      stock_updates: this.checkoutData.cart.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        ordered_quantity: item.quantity,
        remaining_stock: Math.max(0, (item.stock || 50) - item.quantity) // Mock remaining stock
      }))
    };

    // Store order details for success page
    localStorage.setItem('order_details', JSON.stringify(mockOrderDetails));

    // Clear cart from localStorage since order is completed
    localStorage.removeItem('cart');

    // Redirect to success page
    window.location.href = 'success.html';
  }

  getSelectedAddress() {
    // Get the selected address from the addresses list
    if (this.checkoutData.addresses && this.selectedAddressId) {
      const selectedAddr = this.checkoutData.addresses.find(addr => addr.id == this.selectedAddressId);
      if (selectedAddr) {
        return selectedAddr;
      }
    }

    // Return mock address if none found
    return {
      id: this.selectedAddressId,
      full_name: 'Demo User',
      address_line_1: '123 Demo Street',
      address_line_2: 'Demo Area',
      city: 'Demo City',
      state: 'Demo State',
      postal_code: '123456',
      phone_number: '9876543210'
    };
  }

  // Method to load data from database via API calls
  async loadDataFromDatabase() {
    try {
      const token = localStorage.getItem('skeyy_auth_token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      // Show loading state
      this.showLoading();

      // Fetch all checkout data from database in one call
      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        this.checkoutData = data.data;
        this.hideLoading();
        this.renderCheckoutData();
      } else {
        this.hideLoading();
        if (data.message === 'Cart is empty') {
          this.showEmptyCart();
        } else {
          this.showError(data.message);
        }
      }

    } catch (error) {
      console.error('Error loading data from database:', error);
      this.hideLoading();
      this.showError('Failed to load checkout data from database');
    }
  }



  showLoading() {
    const loadingDiv = document.getElementById('checkout-loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'block';
      loadingDiv.innerHTML = '<p>Loading checkout data...</p>';
    }
  }

  hideLoading() {
    const loadingDiv = document.getElementById('checkout-loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }

  // Helper methods to get data from localStorage
  getCartFromLocalStorage() {
    try {
      // Try to get cart data from localStorage (similar to cart.js)
      const cartData = localStorage.getItem('cart_data');
      if (cartData) {
        return JSON.parse(cartData);
      }

      // If no stored cart data, create sample cart data from products
      return {
        items: [
          {
            id: 1,
            product_id: 1,
            name: "Premium Watch",
            price: 2999,
            discounted_price: 2399,
            quantity: 1,
            image_url: "img/product/watch-1.jpg",
            size: "Medium",
            color: "Black"
          },
          {
            id: 2,
            product_id: 2,
            name: "Casual Shirt",
            price: 1299,
            discounted_price: 999,
            quantity: 2,
            image_url: "img/product/shirt-1.jpg",
            size: "Large",
            color: "Blue"
          }
        ],
        total_amount: 4397,
        discount_amount: 600,
        delivery_fee: 99,
        applied_coupon: null
      };
    } catch (error) {
      console.error('Error getting cart from localStorage:', error);
      return null;
    }
  }

  getAddressesFromLocalStorage() {
    try {
      const addresses = localStorage.getItem('user_addresses');
      if (addresses) {
        return JSON.parse(addresses);
      }

      // Default addresses if none stored
      return [
        {
          id: 1,
          name: "John Doe",
          phone: "+91 9876543210",
          address_line_1: "123 Main Street",
          address_line_2: "Apartment 4B",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          is_default: true
        }
      ];
    } catch (error) {
      console.error('Error getting addresses from localStorage:', error);
      return [];
    }
  }

  getUserFromLocalStorage() {
    try {
      const userData = localStorage.getItem('skeyy_user_data');
      if (userData) {
        return JSON.parse(userData);
      }

      // Default user data if none stored
      return {
        id: 1,
        email: "user@example.com",
        name: "John Doe"
      };
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
      return null;
    }
  }
}

// Initialize checkout manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CheckoutManager();
});
