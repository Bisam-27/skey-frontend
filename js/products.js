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
function addToCart(productId) {
  // TODO: Implement cart functionality
  console.log('Adding product to cart:', productId);
  // You can implement local storage or API call here
  alert('Product added to cart!');
}

function toggleWishlist(productId) {
  // TODO: Implement wishlist functionality
  console.log('Toggling wishlist for product:', productId);
  // You can implement local storage or API call here
  alert('Product added to wishlist!');
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
