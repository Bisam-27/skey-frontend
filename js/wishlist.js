// Wishlist Management Class
class WishlistManager {
  constructor() {
    this.wishlist = null;
    this.isLoading = false;
  }

  // Initialize wishlist manager
  async init() {
    // Check if user is authenticated
    const token = localStorage.getItem('skeyy_auth_token');
    if (!token) {
      this.redirectToLogin();
      return;
    }

    // Load wishlist data
    await this.loadWishlist();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update wishlist count in navbar
    this.updateNavbarWishlistCount();
  }

  // Load wishlist from API
  async loadWishlist() {
    try {
      this.showLoading();
      const response = await apiService.getWishlist();
      
      if (response.success) {
        this.wishlist = response.data;
        this.renderWishlist();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      this.showError('Failed to load wishlist items');
    } finally {
      this.hideLoading();
    }
  }

  // Render wishlist items
  renderWishlist() {
    const wishlistContainer = document.querySelector('.wishlist__contents');
    const wishlistTitle = document.querySelector('.wishlist__title');
    
    if (!wishlistContainer) return;

    // Update wishlist title
    if (wishlistTitle) {
      const itemCount = this.wishlist.item_count || 0;
      wishlistTitle.textContent = `My Wishlist (${itemCount} items)`;
    }

    // Clear existing content
    wishlistContainer.innerHTML = '';

    // Check if wishlist is empty
    if (!this.wishlist.items || this.wishlist.items.length === 0) {
      this.renderEmptyWishlist(wishlistContainer);
      return;
    }

    // Render wishlist items
    this.wishlist.items.forEach(item => {
      const wishlistItemElement = this.createWishlistItemElement(item);
      wishlistContainer.appendChild(wishlistItemElement);
    });
  }

  // Create wishlist item element
  createWishlistItemElement(item) {
    const wishlistItem = document.createElement('div');
    wishlistItem.className = 'wishlist__item';
    wishlistItem.dataset.productId = item.product_id;

    // Handle product image URL properly
    const imageUrl = this.getProductImageUrl(item.product.image_url);

    wishlistItem.innerHTML = `
      <div class="wishlist__item-image">
        <img src="${imageUrl}" alt="${item.product.name}" class="wishlist__img" />
      </div>
      <div class="wishlist__item-details">
        <h3 class="wishlist__item-name">${item.product.name}</h3>
        <div class="wishlist__item-price">
          ${item.product.discount > 0 ? 
            `<span class="wishlist__price-original">₹${item.product.price}</span>
             <span class="wishlist__price-discounted">₹${item.product.discounted_price}</span>
             <span class="wishlist__discount">${item.product.discount}% OFF</span>` :
            `<span class="wishlist__price">₹${item.product.price}</span>`
          }
        </div>
        <div class="wishlist__item-stock ${item.product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
          ${item.product.stock > 0 ? `In Stock (${item.product.stock} available)` : 'Out of Stock'}
        </div>
        <div class="wishlist__item-added">
          Added on ${new Date(item.added_at).toLocaleDateString()}
        </div>
      </div>
      <div class="wishlist__item-actions">
        <button class="btn btn--primary wishlist__add-to-cart-btn" 
                data-product-id="${item.product_id}"
                ${item.product.stock <= 0 ? 'disabled' : ''}>
          <img src="img/icon-cart.svg" alt="" class="btn__icon">
          Add to Cart
        </button>
        <button class="btn btn--secondary wishlist__remove-btn" 
                data-product-id="${item.product_id}">
          <img src="img/icon-trash.svg" alt="" class="btn__icon">
          Remove
        </button>
      </div>
    `;

    return wishlistItem;
  }

  // Render empty wishlist
  renderEmptyWishlist(container) {
    container.innerHTML = `
      <div class="wishlist__empty">
        <div class="wishlist__empty-content">
          <img src="img/icon-heart.svg" alt="Empty Wishlist" class="wishlist__empty-icon" />
          <h3>Your wishlist is empty</h3>
          <p>Save your favorite products to your wishlist!</p>
          <a href="browse.html" class="btn btn--primary">Start Shopping</a>
        </div>
      </div>
    `;
  }

  // Set up event listeners
  setupEventListeners() {
    const wishlistContainer = document.querySelector('.wishlist__contents');
    if (!wishlistContainer) return;

    // Add to cart button handler
    wishlistContainer.addEventListener('click', async (e) => {
      if (e.target.closest('.wishlist__add-to-cart-btn')) {
        const productId = e.target.closest('.wishlist__add-to-cart-btn').dataset.productId;
        await this.addToCart(productId);
      }
    });

    // Remove button handler
    wishlistContainer.addEventListener('click', async (e) => {
      if (e.target.closest('.wishlist__remove-btn')) {
        const productId = e.target.closest('.wishlist__remove-btn').dataset.productId;
        await this.removeFromWishlist(productId);
      }
    });
  }

  // Add item to cart from wishlist
  async addToCart(productId) {
    try {
      this.showLoading();
      const response = await apiService.addToCart(productId, 1);
      
      if (response.success) {
        this.showNotification('Product added to cart successfully!', 'success');
        // Update cart count in navbar
        if (typeof updateCartCount === 'function') {
          updateCartCount();
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      this.showNotification('Failed to add product to cart', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // Remove item from wishlist
  async removeFromWishlist(productId) {
    if (!confirm('Are you sure you want to remove this item from your wishlist?')) {
      return;
    }

    try {
      this.showLoading();
      const response = await apiService.removeFromWishlist(productId);
      
      if (response.success) {
        this.wishlist.items = this.wishlist.items.filter(item => item.product_id != productId);
        this.wishlist.item_count = this.wishlist.items.length;
        this.renderWishlist();
        this.updateNavbarWishlistCount();
        this.showNotification('Item removed from wishlist', 'success');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      this.showNotification('Failed to remove item', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // Update navbar wishlist count
  async updateNavbarWishlistCount() {
    try {
      const response = await apiService.getWishlistCount();
      if (response.success) {
        const wishlistCount = response.data.item_count;
        
        // Update any wishlist count displays
        const wishlistCountElements = document.querySelectorAll('.wishlist-count, .wishlist-badge');
        wishlistCountElements.forEach(element => {
          element.textContent = wishlistCount > 0 ? wishlistCount : '';
          element.style.display = wishlistCount > 0 ? 'inline' : 'none';
        });
      }
    } catch (error) {
      console.error('Failed to update wishlist count:', error);
    }
  }

  // Get product image URL with proper fallback
  getProductImageUrl(imageUrl) {
    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
      return 'img/product/default.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it starts with a slash, it's an absolute path
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }
    
    // Handle media/ paths from database
    if (imageUrl.startsWith('media/')) {
      return imageUrl;
    }
    
    // If it's a relative path starting with img/, use as is
    if (imageUrl.startsWith('img/')) {
      return imageUrl;
    }
    
    // If it's just a filename, assume it's in the media/products directory
    return `media/products/${imageUrl}`;
  }

  // Show loading state
  showLoading() {
    this.isLoading = true;
    const wishlistContainer = document.querySelector('.wishlist__contents');
    if (wishlistContainer) {
      wishlistContainer.innerHTML = '<div class="loading">Loading wishlist items...</div>';
    }
  }

  // Hide loading state
  hideLoading() {
    this.isLoading = false;
  }

  // Show error message
  showError(message) {
    const wishlistContainer = document.querySelector('.wishlist__contents');
    if (wishlistContainer) {
      wishlistContainer.innerHTML = `
        <div class="error">
          <p>${message}</p>
          <button onclick="wishlistManager.loadWishlist()" class="btn btn--secondary">Retry</button>
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

  // Redirect to login
  redirectToLogin() {
    alert('Please login to view your wishlist');
    window.location.href = 'login.html';
  }
}

// Initialize wishlist manager when DOM is loaded
let wishlistManager;

document.addEventListener('DOMContentLoaded', () => {
  wishlistManager = new WishlistManager();
  wishlistManager.init();
});

// Export for global access
if (typeof window !== 'undefined') {
  window.wishlistManager = wishlistManager;
}
