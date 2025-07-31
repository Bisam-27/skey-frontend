// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Service Class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic API call method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Category API methods
  async getCategories(includeSubcategories = true) {
    const endpoint = `/categories?include_subcategories=${includeSubcategories}`;
    return this.makeRequest(endpoint);
  }

  async getCategoryById(id, includeSubcategories = true) {
    const endpoint = `/categories/${id}?include_subcategories=${includeSubcategories}`;
    return this.makeRequest(endpoint);
  }

  async getSubcategoriesByCategory(categoryId) {
    const endpoint = `/categories/${categoryId}/subcategories`;
    return this.makeRequest(endpoint);
  }

  async getProductsByCategory(categoryId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/categories/${categoryId}/products${queryParams ? '?' + queryParams : ''}`;
    return this.makeRequest(endpoint);
  }

  // Product API methods
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/products${queryParams ? '?' + queryParams : ''}`;
    return this.makeRequest(endpoint);
  }

  async getProductById(id) {
    const endpoint = `/products/${id}`;
    return this.makeRequest(endpoint);
  }

  async createProduct(productData) {
    const endpoint = '/products';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    const endpoint = `/products/${id}`;
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    const endpoint = `/products/${id}`;
    return this.makeRequest(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication API methods
  async login(email, password) {
    const endpoint = '/auth/login';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email, password, confirmPassword) {
    const endpoint = '/auth/register';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword }),
    });
  }

  async logout() {
    const endpoint = '/auth/logout';
    return this.makeRequest(endpoint, {
      method: 'POST',
    });
  }

  async getProfile() {
    const token = localStorage.getItem('skeyy_auth_token');
    const endpoint = '/auth/profile';
    return this.makeRequest(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

// Create a global instance
const apiService = new ApiService();

// Product Display Helper Functions
class ProductDisplayHelper {
  static formatPrice(price, discount = 0) {
    const finalPrice = discount > 0 ? price - (price * discount / 100) : price;
    return `₹${finalPrice.toLocaleString()}`;
  }

  static getDiscountedPrice(price, discount) {
    if (!discount || discount === 0) return price;
    return price - (price * discount / 100);
  }

  static formatDiscount(discount) {
    return discount > 0 ? `${discount}% OFF` : '';
  }

  static getImageUrl(product, imageType = 'image_1_url') {
    return product[imageType] || product.img_url || 'img/placeholder.jpg';
  }

  static getThumbnailUrl(product, thumbnailType = 'image_1_thumbnail') {
    return product[thumbnailType] || this.getImageUrl(product);
  }

  static createProductCard(product) {
    const originalPrice = product.price;
    const discountedPrice = this.getDiscountedPrice(originalPrice, product.discount);
    const imageUrl = this.getImageUrl(product);
    const discountText = this.formatDiscount(product.discount);

    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-card__img-wrapper">
          <a href="product.html?id=${product.id}" class="product-card__img-link-wrapper">
            <img src="${imageUrl}" alt="${product.name}" class="product-card__img" />
          </a>
          
          <button class="product-card__wishlist-btn" onclick="toggleWishlist(${product.id})">
            <img src="img/icon-heart.svg" alt="" class="product-card__wishlist-icon" />
          </button>
          
          <button class="product-card__cart-btn" onclick="addToCart(${product.id})">
            <img src="img/icon-cart.svg" alt="" class="product-card__icon" />
            <span class="product-card__text">Add to Cart</span>
          </button>
        </div>
        
        <div class="product-card__content">
          <a href="product.html?id=${product.id}" class="bold product-card__link">
            ${product.name}
          </a>
          
          <div class="product-card__price">
            ${discountedPrice < originalPrice ? 
              `<span class="product-card__price--discounted">${this.formatPrice(discountedPrice)}</span>
               <span class="product-card__price--original">${this.formatPrice(originalPrice)}</span>` :
              this.formatPrice(originalPrice)
            }
            ${discountText ? `<span class="product-card__discount">${discountText}</span>` : ''}
          </div>
          
          ${product.subcategory ? 
            `<div class="product-card__category">
              ${product.subcategory.category?.name} > ${product.subcategory.name}
            </div>` : ''
          }
        </div>
      </div>
    `;
  }
}

// Category Navigation Helper
class CategoryNavigationHelper {
  static createCategoryNavItem(category) {
    return `
      <a href="browse.html?category=${category.slug}" class="category__card">
        <img src="${category.image_url || 'img/cat-1.jpg'}" alt="${category.name}" class="category__img" />
        <div class="category__content">
          <h3 class="s">${category.name}</h3>
        </div>
      </a>
    `;
  }

  static createSubcategoryFilter(subcategory, isActive = false) {
    return `
      <div class="sidebar__list-item ${isActive ? 'sidebar__list-item--active' : ''}" 
           data-subcategory-id="${subcategory.id}" 
           data-subcategory-slug="${subcategory.slug}">
        ${subcategory.name}
      </div>
    `;
  }

  static async loadCategoryNavigation() {
    try {
      const response = await apiService.getCategories(true);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  }
}

// Utility Functions
const Utils = {
  // Get URL parameters
  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  // Show loading state
  showLoading(element) {
    if (element) {
      element.innerHTML = '<div class="loading">Loading...</div>';
    }
  },

  // Show error message
  showError(element, message) {
    if (element) {
      element.innerHTML = `<div class="error">Error: ${message}</div>`;
    }
  },

  // Debounce function for search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { apiService, ProductDisplayHelper, CategoryNavigationHelper, Utils };
}
