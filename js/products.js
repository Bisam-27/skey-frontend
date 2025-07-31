// Product Management Functions
class ProductManager {
  constructor() {
    this.currentPage = 1;
    this.currentLimit = 12;
    this.currentFilters = {};
    this.currentCategory = null;
    this.currentSubcategory = null;
  }

  // Initialize product listing page
  async init() {
    try {
      // Get URL parameters
      const categorySlug = Utils.getUrlParameter('category');
      const subcategorySlug = Utils.getUrlParameter('subcategory');
      const page = Utils.getUrlParameter('page') || 1;

      this.currentPage = parseInt(page);

      if (categorySlug) {
        await this.loadProductsByCategory(categorySlug, subcategorySlug);
      } else {
        await this.loadAllProducts();
      }

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize product manager:', error);
      this.showError('Failed to load products');
    }
  }

  // Load products by category
  async loadProductsByCategory(categorySlug, subcategorySlug = null) {
    try {
      const productsContainer = document.querySelector('.products__cards-grid');
      if (!productsContainer) return;

      Utils.showLoading(productsContainer);

      const params = {
        page: this.currentPage,
        limit: this.currentLimit,
        ...this.currentFilters
      };

      if (subcategorySlug) {
        params.subcategory = subcategorySlug;
      }

      const response = await apiService.getProductsByCategory(categorySlug, params);

      if (response.success) {
        this.currentCategory = response.data.category;
        this.renderProducts(response.data.products);
        this.renderPagination(response.data.pagination);
        this.updatePageTitle();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load products by category:', error);
      this.showError('Failed to load products');
    }
  }

  // Load all products
  async loadAllProducts() {
    try {
      const productsContainer = document.querySelector('.products__cards-grid');
      if (!productsContainer) return;

      Utils.showLoading(productsContainer);

      const params = {
        page: this.currentPage,
        limit: this.currentLimit,
        ...this.currentFilters
      };

      const response = await apiService.getProducts(params);

      if (response.success) {
        this.renderProducts(response.data.products);
        this.renderPagination(response.data.pagination);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showError('Failed to load products');
    }
  }

  // Render products in the grid
  renderProducts(products) {
    const productsContainer = document.querySelector('.products__cards-grid');
    if (!productsContainer) return;

    if (!products || products.length === 0) {
      productsContainer.innerHTML = '<div class="no-products">No products found</div>';
      return;
    }

    const productsHTML = products.map(product => 
      ProductDisplayHelper.createProductCard(product)
    ).join('');

    productsContainer.innerHTML = productsHTML;
  }

  // Render pagination
  renderPagination(pagination) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer || !pagination) return;

    const { page, totalPages, total } = pagination;
    
    let paginationHTML = '<div class="pagination__info">';
    paginationHTML += `Showing page ${page} of ${totalPages} (${total} products)`;
    paginationHTML += '</div><div class="pagination__controls">';

    // Previous button
    if (page > 1) {
      paginationHTML += `<button class="pagination__btn" onclick="productManager.goToPage(${page - 1})">Previous</button>`;
    }

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === page ? 'pagination__btn--active' : '';
      paginationHTML += `<button class="pagination__btn ${isActive}" onclick="productManager.goToPage(${i})">${i}</button>`;
    }

    // Next button
    if (page < totalPages) {
      paginationHTML += `<button class="pagination__btn" onclick="productManager.goToPage(${page + 1})">Next</button>`;
    }

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
  }

  // Go to specific page
  async goToPage(page) {
    this.currentPage = page;
    
    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory);
    } else {
      await this.loadAllProducts();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Apply filters
  async applyFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.currentPage = 1; // Reset to first page

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory);
    } else {
      await this.loadAllProducts();
    }
  }

  // Clear filters
  async clearFilters() {
    this.currentFilters = {};
    this.currentPage = 1;

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory);
    } else {
      await this.loadAllProducts();
    }
  }

  // Update page title based on current category
  updatePageTitle() {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle && this.currentCategory) {
      headerTitle.textContent = `Browse ${this.currentCategory.name}`;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Price filter
    const minPriceInput = document.querySelector('#min-price');
    const maxPriceInput = document.querySelector('#max-price');
    const priceFilterBtn = document.querySelector('#apply-price-filter');

    if (priceFilterBtn) {
      priceFilterBtn.addEventListener('click', () => {
        const minPrice = minPriceInput?.value;
        const maxPrice = maxPriceInput?.value;
        
        const priceFilters = {};
        if (minPrice) priceFilters.minPrice = minPrice;
        if (maxPrice) priceFilters.maxPrice = maxPrice;
        
        this.applyFilters(priceFilters);
      });
    }

    // Clear filters button
    const clearFiltersBtn = document.querySelector('#clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
        
        // Clear input fields
        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';
      });
    }
  }

  // Show error message
  showError(message) {
    const productsContainer = document.querySelector('.products__cards-grid');
    if (productsContainer) {
      Utils.showError(productsContainer, message);
    }
  }
}

// Cart and Wishlist Functions
async function addToCart(productId, quantity = 1) {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('skeyy_auth_token');
    if (!token) {
      // Redirect to login page or show login modal
      alert('Please login to add items to cart');
      window.location.href = 'login.html';
      return;
    }

    // Show loading state
    const addToCartBtn = document.querySelector(`[onclick="addToCart(${productId})"]`);
    if (addToCartBtn) {
      const originalText = addToCartBtn.innerHTML;
      addToCartBtn.innerHTML = '<span class="product-card__text">Adding...</span>';
      addToCartBtn.disabled = true;
    }

    // Add to cart via API
    const response = await apiService.addToCart(productId, quantity);

    if (response.success) {
      // Show success message
      showNotification('Product added to cart successfully!', 'success');

      // Update cart count in navbar if exists
      updateCartCount();

      console.log('Product added to cart:', response.data);
    } else {
      throw new Error(response.message);
    }

    // Restore button state
    if (addToCartBtn) {
      addToCartBtn.innerHTML = '<img src="img/icon-cart.svg" alt="" class="product-card__icon"><span class="product-card__text">Add to Cart</span>';
      addToCartBtn.disabled = false;
    }

  } catch (error) {
    console.error('Failed to add product to cart:', error);

    // Show error message
    let errorMessage = 'Failed to add product to cart';
    if (error.message.includes('login') || error.message.includes('token')) {
      errorMessage = 'Please login to add items to cart';
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else if (error.message.includes('stock')) {
      errorMessage = 'Product is out of stock';
    } else if (error.message) {
      errorMessage = error.message;
    }

    showNotification(errorMessage, 'error');

    // Restore button state
    const addToCartBtn = document.querySelector(`[onclick="addToCart(${productId})"]`);
    if (addToCartBtn) {
      addToCartBtn.innerHTML = '<img src="img/icon-cart.svg" alt="" class="product-card__icon"><span class="product-card__text">Add to Cart</span>';
      addToCartBtn.disabled = false;
    }
  }
}

function toggleWishlist(productId) {
  // TODO: Implement wishlist functionality
  console.log('Toggling wishlist for product:', productId);
  // You can implement local storage or API call here
  alert('Product added to wishlist!');
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <div class="notification__content">
      <span class="notification__message">${message}</span>
      <button class="notification__close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  // Add styles if not already present
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
      }
      .notification--success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .notification--error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      .notification--info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
      .notification__content { display: flex; justify-content: space-between; align-items: center; }
      .notification__close { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; margin-left: 10px; }
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;
    document.head.appendChild(styles);
  }

  // Add to page
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Helper function to update cart count in navbar
async function updateCartCount() {
  try {
    const token = localStorage.getItem('skeyy_auth_token');
    if (!token) return;

    const response = await apiService.getCartCount();
    if (response.success) {
      const cartCount = response.data.item_count;

      // Update cart badge if exists
      const cartBadge = document.querySelector('.cart-badge');
      if (cartBadge) {
        cartBadge.textContent = cartCount;
        cartBadge.style.display = cartCount > 0 ? 'block' : 'none';
      }

      // Update cart link text if exists
      const cartLinks = document.querySelectorAll('a[href="cart.html"]');
      cartLinks.forEach(link => {
        const existingBadge = link.querySelector('.cart-count');
        if (existingBadge) {
          existingBadge.textContent = cartCount > 0 ? `(${cartCount})` : '';
        } else if (cartCount > 0) {
          const badge = document.createElement('span');
          badge.className = 'cart-count';
          badge.textContent = `(${cartCount})`;
          link.appendChild(badge);
        }
      });
    }
  } catch (error) {
    console.error('Failed to update cart count:', error);
  }
}

// Initialize product manager when DOM is loaded
let productManager;

document.addEventListener('DOMContentLoaded', () => {
  productManager = new ProductManager();
  productManager.init();
});

// Export for global access
if (typeof window !== 'undefined') {
  window.productManager = productManager;
  window.addToCart = addToCart;
  window.toggleWishlist = toggleWishlist;
}
