// Cart Management Class
class CartManager {
  constructor() {
    this.cart = null;
    this.isLoading = false;
  }

  // Initialize cart manager
  async init() {
    // Check if user is authenticated
    const token = localStorage.getItem('skeyy_auth_token');
    if (!token) {
      this.redirectToLogin();
      return;
    }

    // Load cart data
    await this.loadCart();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update cart count in navbar
    this.updateNavbarCartCount();
  }

  // Load cart from API
  async loadCart() {
    try {
      this.showLoading();
      const response = await apiService.getCart();
      
      if (response.success) {
        this.cart = response.data;
        this.renderCart();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      this.showError('Failed to load cart items');
    } finally {
      this.hideLoading();
    }
  }

  // Render cart items
  renderCart() {
    const cartContainer = document.querySelector('.cart__contents');
    const cartTitle = document.querySelector('.cart__title');
    
    if (!cartContainer) return;

    // Update cart title
    if (cartTitle) {
      const itemCount = this.cart.item_count || 0;
      cartTitle.textContent = `Shopping Bag (${itemCount} items)`;
    }

    // Clear existing content
    cartContainer.innerHTML = '';

    // Check if cart is empty
    if (!this.cart.items || this.cart.items.length === 0) {
      this.renderEmptyCart(cartContainer);
      return;
    }

    // Render cart items
    this.cart.items.forEach(item => {
      const cartItemElement = this.createCartItemElement(item);
      cartContainer.appendChild(cartItemElement);
    });

    // Update cart summary
    this.updateCartSummary();
  }

  // Create cart item element
  createCartItemElement(item) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart__single';
    cartItem.dataset.productId = item.product_id;

    cartItem.innerHTML = `
      <div class="cart__img-wrapper">
        <img src="${this.getProductImageUrl(item.product_image)}" alt="${item.product_name}" class="cart__img" />
      </div>
      <div class="cart__contents-wrapper">
        <div class="cart__content-details">
          <div class="s bold">${item.product_name}</div>
          <div class="cart__price">₹${item.price}</div>
          <div class="bold cart__subtotal">Subtotal: ₹${item.subtotal}</div>
          <div class="cart__select-wrapper">
            <div>Qty:</div>
            <select class="cart__select" data-product-id="${item.product_id}">
              ${this.generateQuantityOptions(item.quantity)}
            </select>
          </div>
        </div>
        <div class="cart__interactions">
          <button class="cart__wishlist-btn" data-product-id="${item.product_id}">
            <img src="img/icon-heart-black.svg" alt="" class="cart__icon" />
          </button>
          <button class="cart__delete-btn" data-product-id="${item.product_id}">
            <img src="img/icon-trash.svg" alt="" class="cart__icon" />
          </button>
        </div>
      </div>
    `;

    return cartItem;
  }

  // Generate quantity options for select dropdown
  generateQuantityOptions(currentQuantity) {
    let options = '';
    for (let i = 1; i <= 10; i++) {
      const selected = i === currentQuantity ? 'selected' : '';
      options += `<option value="${i}" ${selected}>${i}</option>`;
    }
    return options;
  }

  // Render empty cart
  renderEmptyCart(container) {
    container.innerHTML = `
      <div class="cart__empty">
        <div class="cart__empty-content">
          <img src="img/icon-cart.svg" alt="Empty Cart" class="cart__empty-icon" />
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
          <a href="browse.html" class="btn btn--primary">Continue Shopping</a>
        </div>
      </div>
    `;

    // Hide cart summary
    const cartSummary = document.querySelector('.cart__summary');
    if (cartSummary) {
      cartSummary.style.display = 'none';
    }
  }

  // Update cart summary
  updateCartSummary() {
    const summaryContainer = document.querySelector('.cart__summary');
    if (!summaryContainer) return;

    const totalAmount = this.cart.total_amount || 0;
    const itemCount = this.cart.item_count || 0;

    // Show summary
    summaryContainer.style.display = 'block';

    // Update total amount displays
    const totalElements = summaryContainer.querySelectorAll('.cart__total-amount');
    totalElements.forEach(element => {
      element.textContent = `₹${totalAmount}`;
    });

    // Update item count
    const itemCountElements = summaryContainer.querySelectorAll('.cart__item-count');
    itemCountElements.forEach(element => {
      element.textContent = itemCount;
    });
  }

  // Set up event listeners
  setupEventListeners() {
    const cartContainer = document.querySelector('.cart__contents');
    if (!cartContainer) return;

    // Quantity change handler
    cartContainer.addEventListener('change', async (e) => {
      if (e.target.classList.contains('cart__select')) {
        const productId = e.target.dataset.productId;
        const newQuantity = parseInt(e.target.value);
        await this.updateItemQuantity(productId, newQuantity);
      }
    });

    // Delete button handler
    cartContainer.addEventListener('click', async (e) => {
      if (e.target.closest('.cart__delete-btn')) {
        const productId = e.target.closest('.cart__delete-btn').dataset.productId;
        await this.removeItem(productId);
      }
    });

    // Wishlist button handler (placeholder)
    cartContainer.addEventListener('click', (e) => {
      if (e.target.closest('.cart__wishlist-btn')) {
        const productId = e.target.closest('.cart__wishlist-btn').dataset.productId;
        this.addToWishlist(productId);
      }
    });
  }

  // Update item quantity
  async updateItemQuantity(productId, quantity) {
    try {
      this.showLoading();
      const response = await apiService.updateCartItem(productId, quantity);
      
      if (response.success) {
        this.cart = response.data;
        this.renderCart();
        this.updateNavbarCartCount();
        this.showNotification('Cart updated successfully', 'success');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      this.showNotification('Failed to update cart item', 'error');
      // Reload cart to reset state
      await this.loadCart();
    } finally {
      this.hideLoading();
    }
  }

  // Remove item from cart
  async removeItem(productId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }

    try {
      this.showLoading();
      const response = await apiService.removeFromCart(productId);
      
      if (response.success) {
        this.cart = response.data;
        this.renderCart();
        this.updateNavbarCartCount();
        this.showNotification('Item removed from cart', 'success');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      this.showNotification('Failed to remove item', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // Add to wishlist (placeholder)
  addToWishlist(productId) {
    console.log('Adding to wishlist:', productId);
    this.showNotification('Wishlist functionality coming soon!', 'info');
  }

  // Update navbar cart count
  async updateNavbarCartCount() {
    try {
      const response = await apiService.getCartCount();
      if (response.success) {
        const cartCount = response.data.item_count;
        
        // Update any cart count displays
        const cartCountElements = document.querySelectorAll('.cart-count, .cart-badge');
        cartCountElements.forEach(element => {
          element.textContent = cartCount > 0 ? cartCount : '';
          element.style.display = cartCount > 0 ? 'inline' : 'none';
        });
      }
    } catch (error) {
      console.error('Failed to update cart count:', error);
    }
  }

  // Show loading state
  showLoading() {
    this.isLoading = true;
    const cartContainer = document.querySelector('.cart__contents');
    if (cartContainer) {
      cartContainer.innerHTML = '<div class="loading">Loading cart items...</div>';
    }
  }

  // Hide loading state
  hideLoading() {
    this.isLoading = false;
  }

  // Show error message
  showError(message) {
    const cartContainer = document.querySelector('.cart__contents');
    if (cartContainer) {
      cartContainer.innerHTML = `
        <div class="error">
          <p>${message}</p>
          <button onclick="cartManager.loadCart()" class="btn btn--secondary">Retry</button>
        </div>
      `;
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Use the same notification system as products.js
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      alert(message); // Fallback
    }
  }

  // Get product image URL with proper fallback
  getProductImageUrl(imageUrl) {
    console.log('Processing image URL:', imageUrl);

    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
      console.log('No image URL provided, using default');
      return 'img/product/default.jpg';
    }

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('Using full URL:', imageUrl);
      return imageUrl;
    }

    // If it starts with a slash, it's an absolute path
    if (imageUrl.startsWith('/')) {
      console.log('Using absolute path:', imageUrl);
      return imageUrl;
    }

    // Handle media/ paths from your database (like media/products/product2_front.jpg)
    if (imageUrl.startsWith('media/')) {
      console.log('Using media path:', imageUrl);
      return imageUrl;
    }

    // If it's a relative path starting with img/, use as is
    if (imageUrl.startsWith('img/')) {
      console.log('Using img path:', imageUrl);
      return imageUrl;
    }

    // If it's just a filename, assume it's in the media/products directory
    console.log('Assuming filename in media/products:', imageUrl);
    return `media/products/${imageUrl}`;
  }

  // Redirect to login
  redirectToLogin() {
    alert('Please login to view your cart');
    window.location.href = 'login.html';
  }
}

// Initialize cart manager when DOM is loaded
let cartManager;

document.addEventListener('DOMContentLoaded', () => {
  cartManager = new CartManager();
  cartManager.init();
});

// Export for global access
if (typeof window !== 'undefined') {
  window.cartManager = cartManager;
}
