// Category Management Functions
class CategoryManager {
  constructor() {
    this.categories = [];
    this.currentCategory = null;
  }

  // Initialize category manager
  async init() {
    try {
      await this.loadCategories();
      this.renderCategoryNavigation();
      this.setupCategoryFilters();
    } catch (error) {
      console.error('Failed to initialize category manager:', error);
    }
  }

  // Load categories from API
  async loadCategories() {
    try {
      const response = await apiService.getCategories(true);
      if (response.success) {
        this.categories = response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      this.categories = [];
    }
  }

  // Render category navigation on homepage
  renderCategoryNavigation() {
    const categoryGrid = document.querySelector('.category__grid');
    if (!categoryGrid || this.categories.length === 0) return;

    // Show main categories only (first 4-6 for homepage)
    const mainCategories = this.categories.slice(0, 6);
    
    const categoriesHTML = mainCategories.map(category => 
      CategoryNavigationHelper.createCategoryNavItem(category)
    ).join('');

    categoryGrid.innerHTML = categoriesHTML;
  }

  // Setup category filters for browse page
  setupCategoryFilters() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    this.renderCategorySidebar();
    this.setupSidebarToggles();
  }

  // Render category sidebar for browse page
  renderCategorySidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Get current category from URL
    const currentCategorySlug = Utils.getUrlParameter('category');
    const currentSubcategorySlug = Utils.getUrlParameter('subcategory');

    let sidebarHTML = `
      <div class="sidebar__header">
        <div class="bold copy">Refine by</div>
      </div>
    `;

    // Add category filter section
    sidebarHTML += `
      <div class="sidebar__category">
        <div class="sidebar__title">
          <div>Category</div>
          <div class="sidebar__icon">-</div>
        </div>
        <div class="sidebar__list">
    `;

    // Add "All Categories" option
    const isAllActive = !currentCategorySlug ? 'sidebar__list-item--active' : '';
    sidebarHTML += `
      <div class="sidebar__list-item ${isAllActive}" onclick="categoryManager.filterByCategory(null)">
        All Categories
      </div>
    `;

    // Add each category
    this.categories.forEach(category => {
      const isActive = category.slug === currentCategorySlug ? 'sidebar__list-item--active' : '';
      sidebarHTML += `
        <div class="sidebar__list-item ${isActive}" onclick="categoryManager.filterByCategory('${category.slug}')">
          ${category.name}
        </div>
      `;
    });

    sidebarHTML += '</div></div>';

    // Add subcategory filter if a category is selected
    if (currentCategorySlug) {
      const currentCategory = this.categories.find(cat => cat.slug === currentCategorySlug);
      if (currentCategory && currentCategory.subcategories && currentCategory.subcategories.length > 0) {
        sidebarHTML += `
          <div class="sidebar__category">
            <div class="sidebar__title">
              <div>Subcategory</div>
              <div class="sidebar__icon">-</div>
            </div>
            <div class="sidebar__list">
        `;

        // Add "All Subcategories" option
        const isAllSubActive = !currentSubcategorySlug ? 'sidebar__list-item--active' : '';
        sidebarHTML += `
          <div class="sidebar__list-item ${isAllSubActive}" onclick="categoryManager.filterBySubcategory(null)">
            All ${currentCategory.name}
          </div>
        `;

        // Add each subcategory
        currentCategory.subcategories.forEach(subcategory => {
          const isActive = subcategory.short_name === currentSubcategorySlug ? 'sidebar__list-item--active' : '';
          sidebarHTML += `
            <div class="sidebar__list-item ${isActive}" onclick="categoryManager.filterBySubcategory('${subcategory.short_name}')">
              ${subcategory.name}
            </div>
          `;
        });

        sidebarHTML += '</div></div>';
      }
    }

    // Add price filter section
    sidebarHTML += `
      <div class="sidebar__category">
        <div class="sidebar__title">
          <div>Price Range</div>
          <div class="sidebar__icon">-</div>
        </div>
        <div class="sidebar__list">
          <div class="price-filter">
            <input type="number" id="min-price" placeholder="Min Price" class="price-input">
            <input type="number" id="max-price" placeholder="Max Price" class="price-input">
            <button id="apply-price-filter" class="btn btn--small">Apply</button>
          </div>
        </div>
      </div>
    `;

    // Add clear filters button
    sidebarHTML += `
      <div class="sidebar__category">
        <button id="clear-filters" class="btn btn--secondary btn--full-width">Clear All Filters</button>
      </div>
    `;

    sidebar.innerHTML = sidebarHTML;
  }

  // Filter by category
  filterByCategory(categorySlug) {
    if (categorySlug) {
      window.location.href = `browse.html?category=${categorySlug}`;
    } else {
      window.location.href = 'browse.html';
    }
  }

  // Filter by subcategory
  filterBySubcategory(subcategorySlug) {
    const currentCategorySlug = Utils.getUrlParameter('category');
    
    if (subcategorySlug && currentCategorySlug) {
      window.location.href = `browse.html?category=${currentCategorySlug}&subcategory=${subcategorySlug}`;
    } else if (currentCategorySlug) {
      window.location.href = `browse.html?category=${currentCategorySlug}`;
    } else {
      window.location.href = 'browse.html';
    }
  }

  // Get category by slug
  getCategoryBySlug(slug) {
    return this.categories.find(category => category.slug === slug);
  }

  // Get subcategory by slug within a category
  getSubcategoryBySlug(categorySlug, subcategorySlug) {
    const category = this.getCategoryBySlug(categorySlug);
    if (!category || !category.subcategories) return null;
    
    return category.subcategories.find(subcategory => subcategory.slug === subcategorySlug);
  }

  // Setup sidebar toggle functionality
  setupSidebarToggles() {
    const sidebarTitles = document.querySelectorAll('.sidebar__title');
    
    sidebarTitles.forEach(title => {
      title.addEventListener('click', () => {
        const category = title.parentElement;
        const list = category.querySelector('.sidebar__list');
        const icon = title.querySelector('.sidebar__icon');
        
        if (list) {
          list.style.display = list.style.display === 'none' ? 'block' : 'none';
          icon.textContent = icon.textContent === '+' ? '-' : '+';
        }
      });
    });
  }
}

// Breadcrumb Helper
class BreadcrumbHelper {
  static renderBreadcrumb() {
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (!breadcrumbContainer) return;

    const categorySlug = Utils.getUrlParameter('category');
    const subcategorySlug = Utils.getUrlParameter('subcategory');

    let breadcrumbHTML = '<a href="index.html">Home</a>';

    if (categorySlug) {
      // You would need to get category name from the API or store it globally
      breadcrumbHTML += ` > <a href="browse.html?category=${categorySlug}">Category</a>`;
      
      if (subcategorySlug) {
        breadcrumbHTML += ` > <span>Subcategory</span>`;
      }
    } else {
      breadcrumbHTML += ' > <span>All Products</span>';
    }

    breadcrumbContainer.innerHTML = breadcrumbHTML;
  }
}

// Initialize category manager
let categoryManager;

document.addEventListener('DOMContentLoaded', () => {
  categoryManager = new CategoryManager();
  categoryManager.init();
  
  // Setup breadcrumb if on browse page
  if (window.location.pathname.includes('browse.html')) {
    BreadcrumbHelper.renderBreadcrumb();
  }
});

// Export for global access
if (typeof window !== 'undefined') {
  window.categoryManager = categoryManager;
  window.BreadcrumbHelper = BreadcrumbHelper;
}
