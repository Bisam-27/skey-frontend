// Global Search Functionality
class GlobalSearch {
  constructor() {
    this.searchForms = [];
    this.searchInputs = [];
    this.searchTimeouts = new Map(); // Store timeouts for each input
    this.searchDropdowns = new Map(); // Store dropdown elements for each input
    this.currentSearchRequests = new Map(); // Store active search requests
  }

  // Initialize global search functionality
  init() {
    this.setupSearchForms();
    this.setupEventListeners();
  }

  // Set up all search forms on the page
  setupSearchForms() {
    // Find all search forms
    const forms = document.querySelectorAll('.nav__search-wrapper, form[action="browse.html"]');
    forms.forEach(form => {
      // Prevent default form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearchSubmit(form);
      });
      this.searchForms.push(form);
    });

    // Find all search inputs
    const inputs = document.querySelectorAll('.nav__input, input[placeholder*="Search"]');
    inputs.forEach(input => {
      // Add enter key listener
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearchFromInput(input);
        }
      });

      // Add real-time search functionality
      this.setupRealTimeSearch(input);
      this.searchInputs.push(input);
    });

    // Find all search buttons
    const buttons = document.querySelectorAll('.nav__search-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const form = button.closest('form') || button.closest('.nav__search-wrapper');
        if (form) {
          this.handleSearchSubmit(form);
        }
      });
    });
  }

  // Set up additional event listeners
  setupEventListeners() {
    // Listen for URL parameter changes (for back/forward navigation)
    window.addEventListener('popstate', () => {
      this.updateSearchInputsFromURL();
      this.handleURLSearch();
    });

    // Update search inputs when page loads
    this.updateSearchInputsFromURL();

    // Handle search from URL parameters on page load
    this.handleURLSearch();
  }

  // Handle search from URL parameters
  handleURLSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery && window.location.pathname.includes('browse.html')) {
      // If we're on browse page with search parameter, perform search
      setTimeout(() => {
        if (typeof productManager !== 'undefined' && productManager) {
          productManager.currentSearch = searchQuery;
          productManager.currentPage = 1;
          productManager.currentCategory = null;
          productManager.currentSubcategory = null;
          productManager.loadAllProducts();

          // Update page title and heading
          document.title = `Search: ${searchQuery} - Skeyy`;
          this.updatePageHeading(searchQuery);

          // Update search inputs to show the search term
          this.searchInputs.forEach(input => {
            if (input) {
              input.value = searchQuery;
            }
          });
        }
      }, 100); // Small delay to ensure ProductManager is initialized
    }
  }

  // Handle search form submission
  handleSearchSubmit(form) {
    const input = form.querySelector('input[type="text"], .nav__input');
    if (input && input.value.trim()) {
      this.performSearch(input.value.trim());
    }
  }

  // Handle search from input directly
  handleSearchFromInput(input) {
    if (input.value.trim()) {
      this.performSearch(input.value.trim());
    }
  }

  // Perform search - always use browse page for consistent experience
  performSearch(query) {
    if (!query || !query.trim()) return;

    const trimmedQuery = query.trim();

    // Check if we're on the browse page
    if (window.location.pathname.includes('browse.html')) {
      // Perform search on the current browse page
      this.performBrowsePageSearch(trimmedQuery);
    } else {
      // Redirect to browse page with search for all other pages
      const browseURL = `browse.html?search=${encodeURIComponent(trimmedQuery)}`;
      window.location.href = browseURL;
    }
  }

  // Perform search on browse page
  async performBrowsePageSearch(query) {
    try {
      // Show search feedback
      this.showSearchFeedback(query);

      // Check if ProductManager is available
      if (typeof productManager !== 'undefined' && productManager) {
        // Use the existing ProductManager to perform search
        productManager.currentSearch = query;
        productManager.currentPage = 1;

        // Clear category filters when searching
        productManager.currentCategory = null;
        productManager.currentSubcategory = null;

        // Load products with search
        await productManager.loadAllProducts();

        // Update URL to reflect search
        const url = new URL(window.location);
        url.searchParams.set('search', query);
        url.searchParams.delete('category');
        url.searchParams.delete('subcategory');
        window.history.pushState({}, '', url);

        // Update page title
        document.title = `Search: ${query} - Skeyy`;

        // Update breadcrumb if available
        if (typeof BreadcrumbHelper !== 'undefined') {
          BreadcrumbHelper.updateBreadcrumb([
            { name: 'Home', url: 'index.html' },
            { name: 'Browse', url: 'browse.html' },
            { name: `Search: ${query}`, url: null }
          ]);
        }

        // Update page heading
        this.updatePageHeading(query);
      } else {
        // Fallback: redirect to browse page
        const browseURL = `browse.html?search=${encodeURIComponent(query)}`;
        window.location.href = browseURL;
      }
    } catch (error) {
      console.error('Error performing browse page search:', error);
      // Fallback: redirect to browse page
      const browseURL = `browse.html?search=${encodeURIComponent(query)}`;
      window.location.href = browseURL;
    }
  }

  // Show search feedback
  showSearchFeedback(query) {
    // Show a temporary notification
    const notification = document.createElement('div');
    notification.className = 'search-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 80px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        Searching for "${query}"...
      </div>
    `;

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2000);
  }

  // Update page heading to show search results
  updatePageHeading(query) {
    // Update main page heading
    const pageHeading = document.querySelector('.products__title, h1, .page-title');
    if (pageHeading) {
      if (query && query.trim()) {
        pageHeading.textContent = `Search Results for "${query}"`;
      } else {
        pageHeading.textContent = 'All Products';
      }
    }

    // Update browse page specific heading if it exists
    const browseHeading = document.querySelector('.products__header h1, .browse-title');
    if (browseHeading) {
      if (query && query.trim()) {
        browseHeading.textContent = `Search Results for "${query}"`;
      } else {
        browseHeading.textContent = 'Browse Products';
      }
    }

    // Update any "Browse Product" headings
    const browseProductHeading = document.querySelector('h1');
    if (browseProductHeading && (browseProductHeading.textContent.includes('Browse Product') || browseProductHeading.textContent.includes('Search Results'))) {
      if (query && query.trim()) {
        browseProductHeading.textContent = `Search Results for "${query}"`;
      } else {
        browseProductHeading.textContent = 'Browse Products';
      }
    }

    // Update results count display if available
    const resultsCount = document.querySelector('.products__count, .results-count');
    if (resultsCount && query && query.trim()) {
      // This will be updated by the ProductManager after loading results
      resultsCount.textContent = 'Searching...';
    }
  }

  // Update search inputs from URL parameters
  updateSearchInputsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    
    this.searchInputs.forEach(input => {
      if (input) {
        input.value = query;
      }
    });
  }

  // Set up real-time search for a specific input
  setupRealTimeSearch(input) {
    // Check if we're on the browse page for real-time product grid updates
    const isOnBrowsePage = window.location.pathname.includes('browse.html');

    if (isOnBrowsePage) {
      // Set up real-time product grid search
      this.setupRealTimeProductSearch(input);
    } else {
      // Set up dropdown suggestions for other pages
      this.setupDropdownSuggestions(input);
    }
  }

  // Set up real-time product grid search (for browse page)
  setupRealTimeProductSearch(input) {
    // Add input event listener for real-time search
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      // Clear existing timeout for this input
      if (this.searchTimeouts.has(input)) {
        clearTimeout(this.searchTimeouts.get(input));
      }

      // Cancel existing request for this input
      if (this.currentSearchRequests.has(input)) {
        this.currentSearchRequests.delete(input);
      }

      // If query is empty, reload all products
      if (query.length === 0) {
        this.clearSearchAndReloadProducts();
        return;
      }

      // Only search if query is 2+ characters
      if (query.length < 2) {
        return;
      }

      // Set new timeout for debounced search
      const timeoutId = setTimeout(async () => {
        await this.performRealTimeProductSearch(input, query);
      }, 300); // 300ms debounce

      this.searchTimeouts.set(input, timeoutId);
    });

    // Handle focus events
    input.addEventListener('focus', () => {
      const query = input.value.trim();
      if (query.length >= 2) {
        this.performRealTimeProductSearch(input, query);
      }
    });
  }

  // Set up dropdown suggestions (for other pages)
  setupDropdownSuggestions(input) {
    // Create suggestions dropdown container
    const dropdown = this.createSuggestionsDropdown(input);
    this.searchDropdowns.set(input, dropdown);

    // Add input event listener for real-time search
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      // Clear existing timeout for this input
      if (this.searchTimeouts.has(input)) {
        clearTimeout(this.searchTimeouts.get(input));
      }

      // Cancel existing request for this input
      if (this.currentSearchRequests.has(input)) {
        this.currentSearchRequests.delete(input);
      }

      if (query.length === 0) {
        this.hideSuggestions(input);
        return;
      }

      if (query.length < 2) {
        this.hideSuggestions(input);
        return;
      }

      // Show loading state immediately for longer queries
      if (query.length >= 3) {
        this.showLoadingState(input);
      }

      // Set new timeout for debounced search
      const timeoutId = setTimeout(async () => {
        await this.performRealTimeSearch(input, query);
      }, 250); // 250ms debounce for faster response

      this.searchTimeouts.set(input, timeoutId);
    });

    // Handle focus and blur events
    input.addEventListener('focus', () => {
      const query = input.value.trim();
      if (query.length >= 2) {
        this.performRealTimeSearch(input, query);
      }
    });

    input.addEventListener('blur', (e) => {
      // Delay hiding to allow clicking on suggestions
      setTimeout(() => {
        if (!dropdown.contains(document.activeElement)) {
          this.hideSuggestions(input);
        }
      }, 150);
    });

    // Handle keyboard navigation
    input.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e, input, dropdown);
    });
  }

  // Perform real-time product search (updates product grid)
  async performRealTimeProductSearch(input, query) {
    try {
      // Check if ProductManager is available
      if (typeof productManager === 'undefined' || !productManager) {
        console.warn('ProductManager not available for real-time search');
        return;
      }

      // Mark this request as active
      const requestId = Date.now();
      this.currentSearchRequests.set(input, requestId);

      // Show loading state in product grid
      this.showProductGridLoading();

      // Update ProductManager search state
      productManager.currentSearch = query;
      productManager.currentPage = 1;
      productManager.currentCategory = null;
      productManager.currentSubcategory = null;

      // Load products with search
      await productManager.loadAllProducts(false);

      // Check if this request is still active
      if (this.currentSearchRequests.get(input) === requestId) {
        // Update URL to reflect search
        const url = new URL(window.location);
        url.searchParams.set('search', query);
        url.searchParams.delete('category');
        url.searchParams.delete('subcategory');
        window.history.replaceState({}, '', url);

        // Update page title and heading
        document.title = `Search: ${query} - Skeyy`;
        this.updatePageHeading(query);

        this.currentSearchRequests.delete(input);
      }
    } catch (error) {
      console.error('Error performing real-time product search:', error);
      this.showProductGridError(query);
    }
  }

  // Clear search and reload all products
  async clearSearchAndReloadProducts() {
    try {
      // Check if ProductManager is available
      if (typeof productManager === 'undefined' || !productManager) {
        return;
      }

      // Clear search state
      productManager.currentSearch = '';
      productManager.currentPage = 1;

      // Load all products
      await productManager.loadAllProducts(false);

      // Update URL to remove search
      const url = new URL(window.location);
      url.searchParams.delete('search');
      window.history.replaceState({}, '', url);

      // Reset page title and heading
      document.title = 'Browse Products - Skeyy';
      this.updatePageHeading('');
    } catch (error) {
      console.error('Error clearing search:', error);
    }
  }

  // Show loading state in product grid
  showProductGridLoading() {
    const productsContainer = document.querySelector('.products__cards-grid');
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="search-loading">
          <div class="loading-spinner"></div>
          <p>Searching products...</p>
        </div>
      `;
    }
  }

  // Show error state in product grid
  showProductGridError(query) {
    const productsContainer = document.querySelector('.products__cards-grid');
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="search-error">
          <p>Error searching for "${query}". Please try again.</p>
        </div>
      `;
    }
  }

  // Create suggestions dropdown element
  createSuggestionsDropdown(input) {
    const dropdown = document.createElement('div');
    dropdown.className = 'search-suggestions-dropdown';
    dropdown.style.display = 'none';

    // Position relative to input
    const inputContainer = input.closest('.nav__search-wrapper') || input.parentElement;
    inputContainer.style.position = 'relative';
    inputContainer.appendChild(dropdown);

    return dropdown;
  }

  // Perform real-time search
  async performRealTimeSearch(input, query) {
    try {
      // Mark this request as active
      const requestId = Date.now();
      this.currentSearchRequests.set(input, requestId);

      const suggestions = await this.getSearchSuggestions(query);

      // Check if this request is still active (not superseded by a newer one)
      if (this.currentSearchRequests.get(input) === requestId) {
        this.showSuggestions(input, suggestions, query);
        this.currentSearchRequests.delete(input);
      }
    } catch (error) {
      console.error('Error performing real-time search:', error);
      this.showEmptyState(input, query);
    }
  }

  // Handle keyboard navigation in suggestions
  handleKeyboardNavigation(e, input, dropdown) {
    const suggestions = dropdown.querySelectorAll('.search-suggestion');
    if (suggestions.length === 0) return;

    const currentActive = dropdown.querySelector('.search-suggestion.active');
    let activeIndex = currentActive ? Array.from(suggestions).indexOf(currentActive) : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = (activeIndex + 1) % suggestions.length;
        this.setActiveSuggestion(suggestions, activeIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
        this.setActiveSuggestion(suggestions, activeIndex);
        break;
      case 'Enter':
        if (currentActive) {
          e.preventDefault();
          currentActive.click();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.hideSuggestions(input);
        input.blur();
        break;
    }
  }

  // Set active suggestion for keyboard navigation
  setActiveSuggestion(suggestions, activeIndex) {
    suggestions.forEach((suggestion, index) => {
      suggestion.classList.toggle('active', index === activeIndex);
    });
  }

  // Quick search suggestions (enhanced for real-time search)
  async getSearchSuggestions(query) {
    try {
      if (!query || query.length < 2) return [];

      // Call search API with limited results for suggestions
      const response = await apiService.searchProducts(query, { limit: 10 });
      if (response.success && response.data.products) {
        return response.data.products.map(product => {
          // Calculate final price after discount
          const originalPrice = parseFloat(product.price);
          const discount = parseFloat(product.discount) || 0;
          const finalPrice = originalPrice - (originalPrice * discount / 100);

          // Determine stock status
          const stock = parseInt(product.stock) || 0;
          let stockStatus = 'In Stock';
          let stockClass = 'in-stock';

          if (stock === 0) {
            stockStatus = 'Out of Stock';
            stockClass = 'out-of-stock';
          } else if (stock <= 5) {
            stockStatus = `Only ${stock} left`;
            stockClass = 'low-stock';
          }

          return {
            type: 'product',
            id: product.id,
            name: product.name,
            shortName: product.short_name,
            description: product.description,
            category: product.subcategory?.category?.name,
            subcategory: product.subcategory?.name,
            brand: product.brand?.name,
            price: finalPrice.toFixed(2),
            originalPrice: discount > 0 ? originalPrice.toFixed(2) : null,
            discount: discount > 0 ? discount : null,
            stock: stock,
            stockStatus: stockStatus,
            stockClass: stockClass,
            rating: product.rating || 0,
            url: `product.html?id=${product.id}`,
            image: product.image_url || 'img/prod-1.jpg'
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Show search suggestions dropdown
  showSuggestions(input, suggestions, query = '') {
    const dropdown = this.searchDropdowns.get(input);
    if (!dropdown) return;

    // Show empty state if no results
    if (!suggestions || suggestions.length === 0) {
      if (query) {
        this.showEmptyState(input, query);
      } else {
        this.hideSuggestions(input);
      }
      return;
    }

    // Populate dropdown with suggestions
    const suggestionsHtml = suggestions.map(suggestion => `
      <div class="search-suggestion" onclick="window.location.href='${suggestion.url}'" tabindex="0">
        <div class="search-suggestion__image">
          <img src="${suggestion.image}" alt="${suggestion.name}" onerror="this.src='img/prod-1.jpg'">
        </div>
        <div class="search-suggestion__content">
          <div class="search-suggestion__header">
            <div class="search-suggestion__name" title="${suggestion.name}">${suggestion.name}</div>
            ${suggestion.brand ? `<div class="search-suggestion__brand">${suggestion.brand}</div>` : ''}
          </div>

          ${suggestion.description ? `<div class="search-suggestion__description" title="${suggestion.description}">
            ${suggestion.description.length > 80 ? suggestion.description.substring(0, 80) + '...' : suggestion.description}
          </div>` : ''}

          <div class="search-suggestion__details">
            ${suggestion.category ? `<div class="search-suggestion__category">
              <span class="category-label">Category:</span> ${suggestion.category}${suggestion.subcategory ? ` > ${suggestion.subcategory}` : ''}
            </div>` : ''}

            <div class="search-suggestion__stock ${suggestion.stockClass}">
              <span class="stock-label">Stock:</span> ${suggestion.stockStatus}
            </div>
          </div>

          <div class="search-suggestion__footer">
            <div class="search-suggestion__price">
              ${suggestion.discount ? `<span class="original-price">$${suggestion.originalPrice}</span>` : ''}
              <span class="final-price">$${suggestion.price}</span>
              ${suggestion.discount ? `<span class="discount">${suggestion.discount}% OFF</span>` : ''}
            </div>

            ${suggestion.rating > 0 ? `<div class="search-suggestion__rating">
              <div class="stars">
                ${Array.from({length: 5}, (_, i) =>
                  `<span class="star ${i < Math.floor(suggestion.rating) ? 'filled' : ''}"">★</span>`
                ).join('')}
              </div>
              <span class="rating-value">(${suggestion.rating})</span>
            </div>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Add "View All Results" option if there are many suggestions
    const viewAllHtml = suggestions.length >= 8 ? `
      <div class="search-suggestion-view-all" onclick="globalSearch.performSearch('${query.replace(/'/g, "\\'")}')">
        <div class="view-all-content">
          <span class="view-all-text">View all results for "${query}"</span>
          <span class="view-all-arrow">→</span>
        </div>
      </div>
    ` : '';

    dropdown.innerHTML = suggestionsHtml + viewAllHtml;

    // Show dropdown
    dropdown.style.display = 'block';
  }

  // Show loading state
  showLoadingState(input) {
    const dropdown = this.searchDropdowns.get(input);
    if (!dropdown) return;

    dropdown.innerHTML = `
      <div class="search-suggestions-loading">
        Searching for products...
      </div>
    `;
    dropdown.style.display = 'block';
  }

  // Show empty state
  showEmptyState(input, query) {
    const dropdown = this.searchDropdowns.get(input);
    if (!dropdown) return;

    dropdown.innerHTML = `
      <div class="search-suggestions-empty">
        No products found for "${query}"
      </div>
    `;
    dropdown.style.display = 'block';
  }

  // Hide search suggestions for specific input or all
  hideSuggestions(input = null) {
    if (input) {
      // Hide suggestions for specific input
      const dropdown = this.searchDropdowns.get(input);
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    } else {
      // Hide all suggestions
      this.searchDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
      });
    }
  }
}

// Initialize global search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const globalSearch = new GlobalSearch();
  globalSearch.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalSearch;
}
