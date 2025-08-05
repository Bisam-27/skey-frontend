// Product Management Functions
class ProductManager {
  constructor() {
    this.currentPage = 1;
    this.currentLimit = 6; // Changed to 6 for infinite scroll
    this.currentFilters = {};
    this.currentCategory = null;
    this.currentSubcategory = null;
    this.currentSortBy = 'created_at';
    this.currentSortOrder = 'DESC';
    this.currentSearch = '';

    // Infinite scroll properties
    this.allProducts = []; // Store all loaded products
    this.isLoading = false;
    this.hasMoreProducts = true;
    this.totalProducts = 0;
    this.scrollThreshold = 200; // Pixels from bottom to trigger load
  }

  // Initialize product listing page
  async init() {
    try {
      // Get URL parameters
      const categorySlug = Utils.getUrlParameter('category');
      const subcategorySlug = Utils.getUrlParameter('subcategory');
      const page = Utils.getUrlParameter('page') || 1;
      const sortBy = Utils.getUrlParameter('sortBy') || 'created_at';
      const sortOrder = Utils.getUrlParameter('sortOrder') || 'DESC';
      const limit = Utils.getUrlParameter('limit') || 12;
      const search = Utils.getUrlParameter('search') || '';

      this.currentPage = parseInt(page);
      this.currentSortBy = sortBy;
      this.currentSortOrder = sortOrder;
      this.currentLimit = parseInt(limit);
      this.currentSearch = search;
      this.currentSubcategory = subcategorySlug && subcategorySlug !== 'null' && subcategorySlug !== 'undefined' ? subcategorySlug : null;

      // Set initial values in UI
      this.updateUIControls();

      if (categorySlug) {
        await this.loadProductsByCategory(categorySlug, this.currentSubcategory);
      } else {
        await this.loadAllProducts();
      }

      this.setupEventListeners();
      this.setupInfiniteScroll();
    } catch (error) {
      console.error('Failed to initialize product manager:', error);
      this.showError('Failed to load products');
    }
  }

  // Load products by category
  async loadProductsByCategory(categorySlug, subcategorySlug = null, append = false) {
    try {
      if (this.isLoading) return;
      this.isLoading = true;

      const productsContainer = document.querySelector('.products__cards-grid');
      if (!productsContainer) return;

      if (!append) {
        Utils.showLoading(productsContainer);
        this.allProducts = [];
        this.currentPage = 1;
      }

      const params = {
        page: this.currentPage,
        limit: this.currentLimit,
        sortBy: this.currentSortBy,
        sortOrder: this.currentSortOrder,
        ...this.currentFilters
      };

      if (subcategorySlug && subcategorySlug !== 'null' && subcategorySlug !== 'undefined') {
        params.subcategory = subcategorySlug;
      }

      let response;

      // If there's a search term, use search API instead of category API
      if (this.currentSearch && this.currentSearch.trim()) {
        response = await apiService.searchProducts(this.currentSearch.trim(), params);
      } else {
        response = await apiService.getProductsByCategory(categorySlug, params);
      }

      if (response.success) {
        this.currentCategory = response.data.category;
        this.currentSubcategory = subcategorySlug && subcategorySlug !== 'null' && subcategorySlug !== 'undefined' ? subcategorySlug : null;
        this.totalProducts = response.data.pagination.totalProducts;

        // Debug logging for category products loading
        console.log(`🏷️ Loading Category Products:`, {
          category: categorySlug,
          subcategory: subcategorySlug,
          page: this.currentPage,
          append: append,
          newProducts: response.data.products.length,
          totalProducts: this.totalProducts,
          hasMoreProducts: response.data.pagination.hasNextPage
        });

        if (append) {
          const previousCount = this.allProducts.length;
          this.allProducts = [...this.allProducts, ...response.data.products];
          console.log(`➕ Appended ${response.data.products.length} products. Total: ${previousCount} → ${this.allProducts.length}`);

          // Log details of newly loaded products
          response.data.products.forEach((product, index) => {
            console.log(`📦 Product ${previousCount + index + 1}:`, {
              id: product.id,
              name: product.name,
              price: product.price,
              category: product.category?.name,
              subcategory: product.subcategory?.name
            });
          });
        } else {
          this.allProducts = response.data.products;
          console.log(`🔄 Initial load: ${response.data.products.length} products`);

          // Log details of initial products
          response.data.products.forEach((product, index) => {
            console.log(`📦 Product ${index + 1}:`, {
              id: product.id,
              name: product.name,
              price: product.price,
              category: product.category?.name,
              subcategory: product.subcategory?.name
            });
          });
        }

        this.hasMoreProducts = response.data.pagination.hasNextPage;
        console.log(`🔄 Has more products: ${this.hasMoreProducts}`);

        // Set loading to false before rendering
        this.isLoading = false;

        this.renderInfiniteProducts();
        this.updateInfiniteResultsCount();
        this.updatePageTitle();
        this.updateURL();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load products by category:', error);
      this.showError('Failed to load products');
      this.isLoading = false; // Reset loading state on error
    }
  }

  // Load all products
  async loadAllProducts(append = false) {
    try {
      if (this.isLoading) return;
      this.isLoading = true;

      const productsContainer = document.querySelector('.products__cards-grid');
      if (!productsContainer) return;

      if (!append) {
        Utils.showLoading(productsContainer);
        this.allProducts = [];
        this.currentPage = 1;
      }

      const params = {
        page: this.currentPage,
        limit: this.currentLimit,
        sortBy: this.currentSortBy,
        sortOrder: this.currentSortOrder,
        ...this.currentFilters
      };

      let response;

      // Use search API if there's a search term, otherwise use regular products API
      if (this.currentSearch && this.currentSearch.trim()) {
        response = await apiService.searchProducts(this.currentSearch.trim(), params);
      } else {
        response = await apiService.getProducts(params);
      }

      if (response.success) {
        this.totalProducts = response.data.pagination.totalProducts;

        // Debug logging for all products loading
        console.log(`🌐 Loading All Products:`, {
          page: this.currentPage,
          append: append,
          newProducts: response.data.products.length,
          totalProducts: this.totalProducts,
          hasMoreProducts: response.data.pagination.hasNextPage,
          searchTerm: this.currentSearch || 'none'
        });

        if (append) {
          const previousCount = this.allProducts.length;
          this.allProducts = [...this.allProducts, ...response.data.products];
          console.log(`➕ Appended ${response.data.products.length} products. Total: ${previousCount} → ${this.allProducts.length}`);

          // Log details of newly loaded products
          response.data.products.forEach((product, index) => {
            console.log(`📦 Product ${previousCount + index + 1}:`, {
              id: product.id,
              name: product.name,
              price: product.price,
              category: product.category?.name,
              subcategory: product.subcategory?.name
            });
          });
        } else {
          this.allProducts = response.data.products;
          console.log(`🔄 Initial load: ${response.data.products.length} products`);

          // Log details of initial products
          response.data.products.forEach((product, index) => {
            console.log(`📦 Product ${index + 1}:`, {
              id: product.id,
              name: product.name,
              price: product.price,
              category: product.category?.name,
              subcategory: product.subcategory?.name
            });
          });
        }

        this.hasMoreProducts = response.data.pagination.hasNextPage;
        console.log(`🔄 Has more products: ${this.hasMoreProducts}`);

        // Set loading to false before rendering
        this.isLoading = false;

        this.renderInfiniteProducts();
        this.updateInfiniteResultsCount();
        this.updateURL();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showError('Failed to load products');
      this.isLoading = false; // Reset loading state on error
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

  // Render products for infinite scroll
  renderInfiniteProducts() {
    const productsContainer = document.querySelector('.products__cards-grid');
    if (!productsContainer) return;

    if (!this.allProducts || this.allProducts.length === 0) {
      productsContainer.innerHTML = '<div class="no-products">No products found</div>';
      return;
    }

    const productsHTML = this.allProducts.map(product =>
      ProductDisplayHelper.createProductCard(product)
    ).join('');

    productsContainer.innerHTML = productsHTML;

    // Add appropriate indicator based on loading state
    if (this.isLoading) {
      // Show loading spinner when actively loading
      productsContainer.innerHTML += `
        <div class="infinite-scroll-loader loading" style="
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          margin: 2rem 0;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #dee2e6;
        ">
          <div class="loader-content" style="
            display: flex;
            align-items: center;
            gap: 12px;
            color: #495057;
            font-size: 16px;
            font-weight: 500;
          ">
            <div class="loader-spinner" style="
              width: 24px;
              height: 24px;
              border: 3px solid #e9ecef;
              border-top: 3px solid #007bff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            "></div>
            <span>Loading more products...</span>
          </div>
        </div>
      `;
    } else if (this.hasMoreProducts) {
      // Show scroll prompt when more products are available
      productsContainer.innerHTML += `
        <div class="infinite-scroll-loader scroll-prompt" style="
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          margin: 2rem 0;
          background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 2px dashed #dee2e6;
          transition: all 0.3s ease;
        ">
          <div class="scroll-content" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #6c757d;
            text-align: center;
          ">
            <div style="
              font-size: 24px;
              margin-bottom: 4px;
              animation: bounce 2s infinite;
            ">⬇️</div>
            <span style="
              font-size: 16px;
              font-weight: 500;
              color: #495057;
            ">Scroll down to load more products</span>
            <span style="
              font-size: 14px;
              color: #6c757d;
              opacity: 0.8;
            ">${this.allProducts.length} of ${this.totalProducts} products loaded</span>
          </div>
        </div>
      `;
    } else if (this.allProducts.length > 0) {
      // Show completion message when all products are loaded
      productsContainer.innerHTML += `
        <div class="infinite-scroll-loader completed" style="
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          margin: 2rem 0;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.15);
          border: 2px solid #b8dacc;
        ">
          <div class="completion-content" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            text-align: center;
          ">
            <div class="success-icon" style="
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
              animation: pulse 2s infinite;
            ">
              <span style="
                color: white;
                font-size: 24px;
                font-weight: bold;
              ">✓</span>
            </div>
            <div style="
              color: #155724;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 4px;
            ">All products loaded!</div>
            <div style="
              color: #155724;
              font-size: 14px;
              opacity: 0.8;
            ">You've seen everything we have (${this.allProducts.length} products)</div>
          </div>
        </div>
      `;

      // Debug log when all products are loaded
      console.log(`✅ All products loaded: ${this.allProducts.length} of ${this.totalProducts} products displayed`);
    }
  }

  // Update results count for infinite scroll
  updateInfiniteResultsCount() {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      const loadedCount = this.allProducts.length;
      const totalCount = this.totalProducts;

      if (loadedCount === totalCount && totalCount > 0) {
        resultsCount.textContent = `Showing all ${totalCount} products`;
      } else if (totalCount > 0) {
        resultsCount.textContent = `Showing ${loadedCount} of ${totalCount} products`;
      } else {
        resultsCount.textContent = `No products found`;
      }

      // Debug logging for product count updates
      console.log(`📊 Product Count Updated: ${loadedCount} of ${totalCount} products displayed`);
    }
  }

  // Render pagination (hidden for infinite scroll)
  renderPagination(pagination) {
    const paginationContainer = document.querySelector('.pagination');
    if (paginationContainer) {
      // Hide traditional pagination for infinite scroll
      paginationContainer.innerHTML = '';
      paginationContainer.style.display = 'none';
    }
  }

  // Go to specific page (for legacy pagination - now resets infinite scroll)
  async goToPage(page) {
    this.currentPage = 1; // Reset to first page for infinite scroll
    this.allProducts = [];

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory, false);
    } else {
      await this.loadAllProducts(false);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Apply filters
  async applyFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.currentPage = 1; // Reset to first page
    this.allProducts = []; // Clear existing products

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory, false);
    } else {
      await this.loadAllProducts(false);
    }
  }

  // Clear filters
  async clearFilters() {
    this.currentFilters = {};
    this.currentPage = 1;
    this.allProducts = []; // Clear existing products

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory, false);
    } else {
      await this.loadAllProducts(false);
    }
  }

  // Update results count display
  updateResultsCount(pagination) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount && pagination) {
      const { currentPage, totalProducts, productsPerPage } = pagination;
      const startItem = ((currentPage - 1) * productsPerPage) + 1;
      const endItem = Math.min(currentPage * productsPerPage, totalProducts);

      resultsCount.textContent = `Showing ${startItem}-${endItem} of ${totalProducts} products`;
    }
  }

  // Update UI controls with current values
  updateUIControls() {
    const sortSelect = document.getElementById('sort-select');
    const itemsPerPageSelect = document.getElementById('items-per-page');

    if (sortSelect) {
      sortSelect.value = `${this.currentSortBy}-${this.currentSortOrder}`;
    }

    if (itemsPerPageSelect) {
      itemsPerPageSelect.value = this.currentLimit.toString();
    }
  }

  // Update URL with current parameters
  updateURL() {
    const params = new URLSearchParams();

    // Add category and subcategory parameters
    if (this.currentCategory) params.set('category', this.currentCategory.slug);
    if (this.currentSubcategory && this.currentSubcategory !== 'null' && this.currentSubcategory !== 'undefined') {
      params.set('subcategory', this.currentSubcategory);
    }

    if (this.currentPage > 1) params.set('page', this.currentPage);
    if (this.currentSortBy !== 'created_at') params.set('sortBy', this.currentSortBy);
    if (this.currentSortOrder !== 'DESC') params.set('sortOrder', this.currentSortOrder);
    if (this.currentLimit !== 12) params.set('limit', this.currentLimit);
    if (this.currentSearch) params.set('search', this.currentSearch);

    // Add filter parameters
    Object.keys(this.currentFilters).forEach(key => {
      if (this.currentFilters[key]) {
        params.set(key, this.currentFilters[key]);
      }
    });

    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newURL);
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
    // Sort dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [sortBy, sortOrder] = e.target.value.split('-');
        this.applySorting(sortBy, sortOrder);
      });
    }

    // Items per page dropdown
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
      itemsPerPageSelect.addEventListener('change', (e) => {
        this.changeItemsPerPage(parseInt(e.target.value));
      });
    }



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



  // Apply sorting
  async applySorting(sortBy, sortOrder) {
    this.currentSortBy = sortBy;
    this.currentSortOrder = sortOrder;
    this.currentPage = 1; // Reset to first page when sorting changes
    this.allProducts = []; // Clear existing products

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory, false);
    } else {
      await this.loadAllProducts(false);
    }
  }

  // Change items per page (for infinite scroll, this changes the batch size)
  async changeItemsPerPage(limit) {
    this.currentLimit = limit;
    this.currentPage = 1; // Reset to first page when limit changes
    this.allProducts = []; // Clear existing products

    if (this.currentCategory) {
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory, false);
    } else {
      await this.loadAllProducts(false);
    }
  }

  // Setup infinite scroll
  setupInfiniteScroll() {
    console.log(`🚀 Infinite Scroll Setup:`, {
      batchSize: this.currentLimit,
      scrollThreshold: this.scrollThreshold,
      message: 'Infinite scroll pagination is now active!'
    });

    let scrollTimeout;

    window.addEventListener('scroll', () => {
      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Set a new timeout to avoid too frequent calls
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 100);
    });
  }

  // Handle scroll events for infinite loading
  handleScroll() {
    if (this.isLoading || !this.hasMoreProducts) {
      // Debug logging for scroll conditions
      if (this.isLoading) {
        console.log(`⏳ Scroll ignored: Already loading products`);
      }
      if (!this.hasMoreProducts) {
        console.log(`🔚 Scroll ignored: No more products available`);
      }
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Check if user scrolled near the bottom
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    // Debug logging for scroll position
    console.log(`📜 Scroll Position:`, {
      scrollTop: Math.round(scrollTop),
      windowHeight: windowHeight,
      documentHeight: documentHeight,
      distanceFromBottom: Math.round(distanceFromBottom),
      threshold: this.scrollThreshold,
      shouldLoad: distanceFromBottom < this.scrollThreshold
    });

    if (distanceFromBottom < this.scrollThreshold) {
      console.log(`🚀 Triggering load more products - distance from bottom: ${Math.round(distanceFromBottom)}px`);
      this.loadMoreProducts();
    }
  }

  // Load more products for infinite scroll
  async loadMoreProducts() {
    if (this.isLoading || !this.hasMoreProducts) return;

    console.log(`🔄 Loading More Products:`, {
      currentPage: this.currentPage,
      nextPage: this.currentPage + 1,
      currentlyLoaded: this.allProducts.length,
      totalProducts: this.totalProducts,
      category: this.currentCategory?.slug || 'all',
      subcategory: this.currentSubcategory || 'none',
      searchTerm: this.currentSearch || 'none'
    });

    this.currentPage++;

    if (this.currentCategory) {
      console.log(`📂 Loading more from category: ${this.currentCategory.slug}`);
      await this.loadProductsByCategory(this.currentCategory.slug, this.currentSubcategory, true);
    } else {
      console.log(`🌐 Loading more from all products`);
      await this.loadAllProducts(true);
    }

    console.log(`✅ Load more completed. Now showing ${this.allProducts.length} of ${this.totalProducts} products`);
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

async function toggleWishlist(productId) {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('skeyy_auth_token');
    if (!token) {
      alert('Please login to manage your wishlist');
      window.location.href = 'login.html';
      return;
    }

    // Find the wishlist button for this product
    const wishlistBtn = document.querySelector(`[onclick="toggleWishlist(${productId})"]`);
    const heartIcon = wishlistBtn ? wishlistBtn.querySelector('img') : null;

    // Show loading state
    if (wishlistBtn) {
      wishlistBtn.disabled = true;
      if (heartIcon) {
        heartIcon.style.opacity = '0.5';
      }
    }

    // Toggle wishlist via API
    const response = await apiService.toggleWishlist(productId);

    if (response.success) {
      const action = response.data.action;
      const isInWishlist = response.data.is_in_wishlist;

      // Update heart icon based on wishlist status
      if (heartIcon) {
        if (isInWishlist) {
          heartIcon.src = 'img/icon-heart-filled.svg'; // Use filled heart
          heartIcon.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'; // Red color
        } else {
          heartIcon.src = 'img/icon-heart.svg'; // Use outline heart
          heartIcon.style.filter = 'none'; // Default color
        }
      }

      // Show success message
      const message = action === 'added' ? 'Product added to wishlist!' : 'Product removed from wishlist!';
      showNotification(message, 'success');

      // Update wishlist count in navbar
      updateWishlistCount();

      console.log('Wishlist toggled:', response.data);
    } else {
      throw new Error(response.message);
    }

    // Restore button state
    if (wishlistBtn) {
      wishlistBtn.disabled = false;
      if (heartIcon) {
        heartIcon.style.opacity = '1';
      }
    }

  } catch (error) {
    console.error('Failed to toggle wishlist:', error);

    // Show error message
    let errorMessage = 'Failed to update wishlist';
    if (error.message.includes('login') || error.message.includes('token')) {
      errorMessage = 'Please login to manage your wishlist';
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else if (error.message) {
      errorMessage = error.message;
    }

    showNotification(errorMessage, 'error');

    // Restore button state
    const wishlistBtn = document.querySelector(`[onclick="toggleWishlist(${productId})"]`);
    const heartIcon = wishlistBtn ? wishlistBtn.querySelector('img') : null;
    if (wishlistBtn) {
      wishlistBtn.disabled = false;
      if (heartIcon) {
        heartIcon.style.opacity = '1';
      }
    }
  }
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

// Helper function to update wishlist count in navbar
async function updateWishlistCount() {
  try {
    const token = localStorage.getItem('skeyy_auth_token');
    if (!token) return;

    const response = await apiService.getWishlistCount();
    if (response.success) {
      const wishlistCount = response.data.item_count;

      // Update wishlist badge if exists
      const wishlistBadge = document.querySelector('.wishlist-badge');
      if (wishlistBadge) {
        wishlistBadge.textContent = wishlistCount;
        wishlistBadge.style.display = wishlistCount > 0 ? 'block' : 'none';
      }

      // Update wishlist link text if exists
      const wishlistLinks = document.querySelectorAll('a[href="wishlist.html"]');
      wishlistLinks.forEach(link => {
        const existingBadge = link.querySelector('.wishlist-count');
        if (existingBadge) {
          existingBadge.textContent = wishlistCount > 0 ? `(${wishlistCount})` : '';
        } else if (wishlistCount > 0) {
          const badge = document.createElement('span');
          badge.className = 'wishlist-count';
          badge.textContent = `(${wishlistCount})`;
          link.appendChild(badge);
        }
      });
    }
  } catch (error) {
    console.error('Failed to update wishlist count:', error);
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
