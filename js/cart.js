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

    // Update wishlist count in navbar
    this.updateNavbarWishlistCount();
  }

  // Load cart from API
  async loadCart() {
    try {
      this.showLoading();
      const response = await apiService.getCart();

      if (response.success) {
        this.cart = response.data;
        // Render cart quickly first, then load wishlist status
        await this.renderCart(true); // Skip wishlist check for faster rendering
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
  async renderCart(skipWishlistCheck = false) {
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

    // Get wishlist data once for all items (only if not skipping)
    let wishlistItems = [];
    if (!skipWishlistCheck) {
      try {
        const wishlistResponse = await apiService.getWishlist();
        if (wishlistResponse.success) {
          wishlistItems = wishlistResponse.data.items || [];
        }
      } catch (error) {
        console.error('Failed to load wishlist for comparison:', error);
      }
    }

    // Render cart items
    this.cart.items.forEach(item => {
      const isInWishlist = skipWishlistCheck ? false : wishlistItems.some(wishlistItem => wishlistItem.product_id == item.product_id);
      const cartItemElement = this.createCartItemElement(item, isInWishlist);
      cartContainer.appendChild(cartItemElement);
    });

    // Update cart summary
    this.updateCartSummary();

    // Load wishlist status after rendering if we skipped it initially
    if (skipWishlistCheck) {
      this.loadWishlistStatusForCartItems();
    }
  }

  // Load wishlist status for cart items without re-rendering
  async loadWishlistStatusForCartItems() {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Wishlist loading timeout')), 5000)
      );

      const wishlistPromise = apiService.getWishlist();
      const wishlistResponse = await Promise.race([wishlistPromise, timeoutPromise]);

      if (wishlistResponse.success) {
        const wishlistItems = wishlistResponse.data.items || [];

        // Update each cart item's wishlist button state
        if (this.cart && this.cart.items) {
          this.cart.items.forEach(item => {
            const isInWishlist = wishlistItems.some(wishlistItem => wishlistItem.product_id == item.product_id);
            this.updateWishlistButtonState(item.product_id, isInWishlist);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load wishlist status:', error);
      // Don't show error to user as this is background loading
    }
  }

  // Create cart item element
  createCartItemElement(item, isInWishlist = false) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart__single';
    cartItem.dataset.productId = item.product_id;

    // Determine wishlist button appearance
    const heartIcon = isInWishlist ? 'img/icon-heart-filled.svg' : 'img/icon-heart-black.svg';
    const heartStyle = isInWishlist ? 'filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);' : '';
    const heartTitle = isInWishlist ? 'Remove from wishlist' : 'Add to wishlist';

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
          <button class="cart__wishlist-btn" data-product-id="${item.product_id}" title="${heartTitle}">
            <img src="${heartIcon}" alt="" class="cart__icon" style="${heartStyle}" />
          </button>
          <button class="cart__delete-btn" data-product-id="${item.product_id}" title="Remove from cart">
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
        await this.renderCart(true); // Skip wishlist check for faster rendering
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
        await this.renderCart(true); // Skip wishlist check for faster rendering
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

  // Add to wishlist with condition handling
  async addToWishlist(productId) {
    const wishlistBtn = document.querySelector(`.cart__wishlist-btn[data-product-id="${productId}"]`);

    try {
      // Show button loading state instead of full page loading
      if (wishlistBtn) {
        wishlistBtn.disabled = true;
        wishlistBtn.style.opacity = '0.6';
      }

      // Check if product is already in wishlist
      const wishlistResponse = await apiService.getWishlist();

      if (wishlistResponse.success) {
        const isInWishlist = wishlistResponse.data.items.some(item => item.product_id == productId);

        if (isInWishlist) {
          // Product is already in wishlist, remove it
          const removeResponse = await apiService.removeFromWishlist(productId);

          if (removeResponse.success) {
            this.updateWishlistButtonState(productId, false);
            this.showNotification('Product removed from wishlist', 'success');
            this.updateNavbarWishlistCount();
          } else {
            throw new Error(removeResponse.message || 'Failed to remove from wishlist');
          }
        } else {
          // Product is not in wishlist, add it
          const addResponse = await apiService.addToWishlist(productId);

          if (addResponse.success) {
            this.updateWishlistButtonState(productId, true);
            this.showNotification('Product added to wishlist', 'success');
            this.updateNavbarWishlistCount();
          } else {
            throw new Error(addResponse.message || 'Failed to add to wishlist');
          }
        }
      } else {
        throw new Error('Failed to check wishlist status');
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      this.showNotification('Failed to update wishlist', 'error');
    } finally {
      // Restore button state
      if (wishlistBtn) {
        wishlistBtn.disabled = false;
        wishlistBtn.style.opacity = '1';
      }
    }
  }

  // Update wishlist button visual state
  updateWishlistButtonState(productId, isInWishlist) {
    const wishlistBtn = document.querySelector(`.cart__wishlist-btn[data-product-id="${productId}"]`);
    if (wishlistBtn) {
      const icon = wishlistBtn.querySelector('img');
      if (isInWishlist) {
        // Product is in wishlist - show filled heart
        icon.src = 'img/icon-heart-filled.svg';
        icon.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)';
        wishlistBtn.title = 'Remove from wishlist';
      } else {
        // Product is not in wishlist - show empty heart
        icon.src = 'img/icon-heart-black.svg';
        icon.style.filter = '';
        wishlistBtn.title = 'Add to wishlist';
      }
    }
  }

  // Update navbar wishlist count
  async updateNavbarWishlistCount() {
    try {
      const response = await apiService.getWishlistCount();
      if (response.success) {
        const wishlistCountElements = document.querySelectorAll('#wishlist-count');
        const count = response.data.count;

        wishlistCountElements.forEach(element => {
          if (count > 0) {
            element.style.display = 'block';
            element.textContent = count;
          } else {
            element.style.display = 'none';
          }
        });
      }
    } catch (error) {
      console.error('Failed to update wishlist count:', error);
    }
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
