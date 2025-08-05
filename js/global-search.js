// Global Search Functionality
class GlobalSearch {
  constructor() {
    this.searchForms = [];
    this.searchInputs = [];
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
      pageHeading.textContent = `Search Results for "${query}"`;
    }

    // Update browse page specific heading if it exists
    const browseHeading = document.querySelector('.products__header h1, .browse-title');
    if (browseHeading) {
      browseHeading.textContent = `Search Results for "${query}"`;
    }

    // Update any "Browse Product" headings
    const browseProductHeading = document.querySelector('h1');
    if (browseProductHeading && browseProductHeading.textContent.includes('Browse Product')) {
      browseProductHeading.textContent = `Search Results for "${query}"`;
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

  // Quick search suggestions (for future enhancement)
  async getSearchSuggestions(query) {
    try {
      if (!query || query.length < 2) return [];
      
      // This could be enhanced to call a suggestions API
      const response = await apiService.searchProducts(query, { limit: 5 });
      if (response.success && response.data.products) {
        return response.data.products.map(product => ({
          type: 'product',
          name: product.name,
          category: product.subcategory?.category?.name,
          url: `product.html?id=${product.id}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Show search suggestions dropdown (for future enhancement)
  showSuggestions(input, suggestions) {
    // Remove existing suggestions
    this.hideSuggestions();

    if (!suggestions || suggestions.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'search-suggestions';
    dropdown.innerHTML = suggestions.map(suggestion => `
      <div class="search-suggestion" onclick="window.location.href='${suggestion.url}'">
        <div class="search-suggestion__name">${suggestion.name}</div>
        ${suggestion.category ? `<div class="search-suggestion__category">${suggestion.category}</div>` : ''}
      </div>
    `).join('');

    // Position dropdown below input
    const inputRect = input.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.top = `${inputRect.bottom + window.scrollY}px`;
    dropdown.style.left = `${inputRect.left + window.scrollX}px`;
    dropdown.style.width = `${inputRect.width}px`;
    dropdown.style.zIndex = '1000';

    document.body.appendChild(dropdown);

    // Hide suggestions when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.hideSuggestions.bind(this), { once: true });
    }, 100);
  }

  // Hide search suggestions
  hideSuggestions() {
    const existing = document.querySelector('.search-suggestions');
    if (existing) {
      existing.remove();
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
