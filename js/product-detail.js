// Product Detail Page Management
class ProductDetailManager {
  constructor() {
    this.productId = null;
    this.product = null;
    this.currentImageIndex = 0;
    this.selectedSize = null;
    this.selectedColor = null;
    this.isInWishlist = false;
  }

  // Initialize product detail page
  async init() {
    try {
      // Get product ID from URL
      this.productId = Utils.getUrlParameter('id');
      
      if (!this.productId) {
        this.showError('Product not found');
        return;
      }

      // Show loading state
      this.showLoading();

      // Load product data
      await this.loadProduct();
      
      // Load related data
      await Promise.all([
        this.loadProductReviews(),
        this.loadRelatedProducts(),
        this.checkWishlistStatus()
      ]);

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize product detail page:', error);
      this.showError('Failed to load product details');
    }
  }

  // Load product data
  async loadProduct() {
    try {
      const response = await apiService.getProductById(this.productId);
      
      if (response.success) {
        this.product = response.data;
        this.renderProduct();
        this.updatePageTitle();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      throw error;
    }
  }

  // Load product reviews
  async loadProductReviews() {
    try {
      const response = await apiService.getProductReviews(this.productId, 5);
      
      if (response.success && response.data.testimonials) {
        this.renderReviews(response.data.testimonials);
      }
    } catch (error) {
      console.error('Failed to load product reviews:', error);
      // Don't throw error as reviews are optional
    }
  }

  // Load related products
  async loadRelatedProducts() {
    try {
      let response;

      // Try to get products from same category first (using category_id from subcategory)
      if (this.product.subcategory && this.product.subcategory.category_id) {
        try {
          response = await apiService.getProductsByCategory(this.product.subcategory.category_id, {
            limit: 6,
            exclude: this.productId
          });
        } catch (categoryError) {
          console.log('Category-based related products failed, trying general approach:', categoryError.message);
          response = null;
        }
      }

      // If no category products or category approach failed, get general related products
      if (!response || !response.success || !response.data.products || response.data.products.length === 0) {
        response = await apiService.getRelatedProducts(this.productId, 6);
      }

      if (response && response.success && response.data.products) {
        this.renderRelatedProducts(response.data.products);
      }
    } catch (error) {
      console.error('Failed to load related products:', error);
      // Don't throw error as related products are optional
    }
  }

  // Check if product is in wishlist
  async checkWishlistStatus() {
    try {
      const token = localStorage.getItem('skeyy_auth_token');
      if (!token) return;

      const response = await apiService.checkWishlistStatus(this.productId);
      if (response.success) {
        this.isInWishlist = response.data.is_in_wishlist;
        this.updateWishlistButton();
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
      // Don't throw error as wishlist check is optional
    }
  }

  // Render product details
  renderProduct() {
    if (!this.product) return;

    // Update product images
    this.renderProductImages();
    
    // Update product info
    this.renderProductInfo();
    
    // Update product options
    this.renderProductOptions();

    // Hide loading state
    this.hideLoading();

    // Setup image interactions
    this.setupImageZoom();
  }

  // Render product images
  renderProductImages() {
    const images = this.getProductImages();

    // Update main image
    const mainImage = document.querySelector('.product__img');
    if (mainImage && images.length > 0) {
      mainImage.src = images[0];
      mainImage.alt = this.product.name;

      // Add error handling for main image
      mainImage.onerror = () => {
        mainImage.src = 'img/product/default.jpg';
      };

      // Add loading state
      mainImage.onload = () => {
        mainImage.style.opacity = '1';
      };
      mainImage.style.opacity = '0.5';
    }

    // Update thumbnails
    const thumbnailsContainer = document.querySelector('.product__thumbnails');
    if (thumbnailsContainer && images.length > 0) {
      thumbnailsContainer.innerHTML = images.map((image, index) => `
        <div class="product__thumbnail-wrapper">
          <img
            src="${image}"
            alt="${this.product.name}"
            class="product__thumbnail ${index === 0 ? 'product__thumbnail--selected' : ''}"
            onclick="productDetailManager.selectImage(${index})"
            onerror="this.src='img/product/default.jpg'"
            loading="lazy"
          />
        </div>
      `).join('');
    }

    // Add keyboard navigation for images
    this.setupImageKeyboardNavigation();
  }

  // Render product information
  renderProductInfo() {
    // Update title - replace loading placeholder
    const titleElement = document.querySelector('.product__title');
    if (titleElement) {
      titleElement.innerHTML = this.product.name;
    }

    // Update description - replace loading placeholder
    const descriptionElement = document.querySelector('.product__description');
    if (descriptionElement) {
      descriptionElement.innerHTML = this.product.description || this.product.short_name || '';
    }

    // Update price - replace loading placeholder
    const priceContainer = document.querySelector('.product__price');
    if (priceContainer) {
      const originalPrice = this.product.price;
      const discountedPrice = ProductDisplayHelper.getDiscountedPrice(originalPrice, this.product.discount);

      if (this.product.discount > 0) {
        priceContainer.innerHTML = `
          <span style="text-decoration: line-through; color: #999; margin-right: 8px;">₹${originalPrice}</span>
          ₹${discountedPrice} (Incl. of all taxes)
          <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; margin-left: 8px;">${this.product.discount}% OFF</span>
        `;
      } else {
        priceContainer.innerHTML = `₹${originalPrice} (Incl. of all taxes)`;
      }
    }

    // Update rating - replace loading placeholder
    const ratingElement = document.querySelector('.product__review-wrapper');
    if (ratingElement) {
      ratingElement.innerHTML = `
        <img src="img/icon-star.svg" alt="" class="product__review-icon" />
        4.3
      `;
    }

    // Update product details list - replace loading placeholders
    const productList = document.querySelector('.product__list');
    if (productList) {
      if (this.product.specification) {
        const specs = this.product.specification.split('\n').filter(spec => spec.trim());
        productList.innerHTML = specs.map(spec => `
          <li class="product__list-item">${spec.trim()}</li>
        `).join('');
      } else {
        // Default features if no specification
        productList.innerHTML = `
          <li class="product__list-item">High-quality materials and construction</li>
          <li class="product__list-item">Comfortable fit and stylish design</li>
          <li class="product__list-item">Perfect for everyday wear</li>
        `;
      }
    }

    // Update brand - replace loading placeholder
    const brandElement = document.querySelector('.product__brand');
    if (brandElement) {
      brandElement.innerHTML = `<a href="#" class="link">${this.product.brand_name || 'Brand'}</a>`;
    }

    // Update availability - replace loading placeholder
    const availabilityElement = document.querySelector('.product__availability');
    if (availabilityElement) {
      const isInStock = this.product.stock > 0;
      availabilityElement.innerHTML = `<span class="bold" style="color: ${isInStock ? '#28a745' : '#dc3545'}">${isInStock ? 'In Stock' : 'Out of Stock'}</span>`;
    }
  }

  // Render product options (colors, sizes)
  renderProductOptions() {
    const colorsWrapper = document.querySelector('.product__colors-wrapper');
    const sizesWrapper = document.querySelector('.product__sizes-wrapper');

    // Update colors if available
    if (this.product.color) {
      const colorsContainer = document.querySelector('.product__colors-selection');
      if (colorsContainer) {
        const colors = this.product.color.split(',').map(c => c.trim());
        colorsContainer.innerHTML = colors.map(color => `
          <div
            class="product__color"
            style="background-color: ${this.getColorCode(color)}"
            onclick="productDetailManager.selectColor('${color}')"
            title="${color}"
          ></div>
        `).join('');

        // Show colors wrapper
        if (colorsWrapper) {
          colorsWrapper.style.display = 'block';
        }
      }
    } else if (colorsWrapper) {
      colorsWrapper.style.display = 'none';
    }

    // Update sizes if available
    if (this.product.size) {
      const sizesContainer = document.querySelector('.product__sizes-selection');
      if (sizesContainer) {
        const sizes = this.product.size.split(',').map(s => s.trim());
        sizesContainer.innerHTML = sizes.map(size => `
          <div
            class="product__size"
            onclick="productDetailManager.selectSize('${size}')"
          >
            ${size}
          </div>
        `).join('');

        // Show sizes wrapper
        if (sizesWrapper) {
          sizesWrapper.style.display = 'block';
        }
      }
    } else if (sizesWrapper) {
      sizesWrapper.style.display = 'none';
    }
  }

  // Get product images array
  getProductImages() {
    const images = [];
    
    if (this.product.image_1_url) images.push(this.product.image_1_url);
    if (this.product.image_2_url) images.push(this.product.image_2_url);
    if (this.product.image_3_url) images.push(this.product.image_3_url);
    if (this.product.img_url && !images.includes(this.product.img_url)) images.push(this.product.img_url);
    if (this.product.img_4_url) images.push(this.product.img_4_url);
    
    // If no images, use placeholder
    if (images.length === 0) {
      images.push('img/placeholder.jpg');
    }
    
    return images;
  }

  // Get color code for display
  getColorCode(colorName) {
    const colorMap = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'blue': '#0000ff',
      'green': '#008000',
      'yellow': '#ffff00',
      'pink': '#ffc0cb',
      'purple': '#800080',
      'orange': '#ffa500',
      'brown': '#a52a2a',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    return colorMap[colorName.toLowerCase()] || '#575fcf';
  }

  // Select image
  selectImage(index) {
    const images = this.getProductImages();
    if (index >= 0 && index < images.length) {
      this.currentImageIndex = index;

      // Update main image with smooth transition
      const mainImage = document.querySelector('.product__img');
      if (mainImage) {
        mainImage.style.opacity = '0.5';
        setTimeout(() => {
          mainImage.src = images[index];
          mainImage.style.opacity = '1';
        }, 150);
      }

      // Update thumbnail selection
      const thumbnails = document.querySelectorAll('.product__thumbnail');
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('product__thumbnail--selected', i === index);
      });

      // Scroll thumbnail into view if needed
      const selectedThumbnail = thumbnails[index];
      if (selectedThumbnail) {
        selectedThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }

  // Select color
  selectColor(color) {
    this.selectedColor = color;
    
    // Update UI
    const colorElements = document.querySelectorAll('.product__color');
    colorElements.forEach(el => {
      el.classList.remove('product__color--selected');
      if (el.title === color) {
        el.classList.add('product__color--selected');
      }
    });
  }

  // Select size
  selectSize(size) {
    this.selectedSize = size;

    // Update UI
    const sizeElements = document.querySelectorAll('.product__size');
    sizeElements.forEach(el => {
      el.classList.remove('product__size--selected');
      if (el.textContent.trim() === size) {
        el.classList.add('product__size--selected');
      }
    });
  }

  // Setup keyboard navigation for images
  setupImageKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const images = this.getProductImages();
      if (images.length <= 1) return;

      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.selectImage(this.currentImageIndex > 0 ? this.currentImageIndex - 1 : images.length - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.selectImage(this.currentImageIndex < images.length - 1 ? this.currentImageIndex + 1 : 0);
          break;
      }
    });
  }

  // Setup image zoom functionality
  setupImageZoom() {
    const mainImage = document.querySelector('.product__img');
    if (!mainImage) {
      console.log('Main image not found for zoom setup');
      return;
    }

    console.log('Setting up image zoom for:', mainImage.src);

    // Add click event with error handling
    mainImage.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Image clicked, opening modal');

      try {
        const altText = this.product ? this.product.name : 'Product Image';
        this.openImageModal(mainImage.src, altText);
      } catch (error) {
        console.error('Error opening modal:', error);
        // Fallback: simple alert
        alert('Image zoom temporarily unavailable');
      }
    });

    // Add visual feedback
    mainImage.style.cursor = 'zoom-in';
    mainImage.title = 'Click to zoom';
  }

  // Open image in modal
  openImageModal(imageSrc, altText) {
    console.log('Opening image modal:', imageSrc);

    // Remove any existing modals
    const existingModal = document.querySelector('.image-zoom-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal with CSS classes and inline fallbacks
    const modal = document.createElement('div');
    modal.className = 'image-zoom-modal';
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0,0,0,0.9) !important;
      z-index: 9999 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    `;

    const container = document.createElement('div');
    container.className = 'image-zoom-container';
    container.style.cssText = `
      position: relative !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      max-width: 90vw !important;
      max-height: 90vh !important;
    `;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = altText || 'Product Image';
    img.className = 'image-zoom-img';
    img.style.cssText = `
      max-width: 100% !important;
      max-height: 100% !important;
      width: auto !important;
      height: auto !important;
      object-fit: contain !important;
      border-radius: 8px !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
      transition: transform 0.3s ease !important;
      display: block !important;
      cursor: pointer !important;
    `;

    // Add loading state
    img.style.opacity = '0';
    img.onload = () => {
      img.style.opacity = '1';
      console.log('Modal image loaded successfully');
    };
    img.onerror = () => {
      img.src = 'img/product/default.jpg';
      console.log('Modal image failed to load, using default');
    };

    // Add image hover effect
    img.onmouseenter = () => {
      img.style.transform = 'scale(1.05) !important';
    };
    img.onmouseleave = () => {
      img.style.transform = 'scale(1) !important';
    };

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'image-zoom-close';
    closeBtn.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 50px !important;
      height: 50px !important;
      background: rgba(255,255,255,0.95) !important;
      border: none !important;
      border-radius: 50% !important;
      font-size: 28px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      z-index: 10001 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      transition: all 0.3s ease !important;
    `;

    // Add navigation if multiple images
    const images = this.getProductImages();
    let prevBtn, nextBtn;

    if (images && images.length > 1) {
      prevBtn = document.createElement('button');
      prevBtn.innerHTML = '‹';
      prevBtn.className = 'image-zoom-prev';
      prevBtn.style.cssText = `
        position: fixed !important;
        left: 20px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 60px !important;
        height: 60px !important;
        background: rgba(255,255,255,0.95) !important;
        border: none !important;
        border-radius: 50% !important;
        font-size: 32px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        z-index: 10001 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        transition: all 0.3s ease !important;
      `;

      nextBtn = document.createElement('button');
      nextBtn.innerHTML = '›';
      nextBtn.className = 'image-zoom-next';
      nextBtn.style.cssText = `
        position: fixed !important;
        right: 20px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 60px !important;
        height: 60px !important;
        background: rgba(255,255,255,0.95) !important;
        border: none !important;
        border-radius: 50% !important;
        font-size: 32px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        z-index: 10001 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        transition: all 0.3s ease !important;
      `;
    }

    // Close functionality
    let closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeydown);
      }, 300);
    };

    // Add hover effects
    const addHoverEffect = (btn) => {
      btn.onmouseenter = () => {
        btn.style.background = 'rgba(255,255,255,1) !important';
        btn.style.transform = btn.className.includes('close') ? 'scale(1.1) !important' :
                             btn.className.includes('prev') ? 'translateY(-50%) scale(1.1) !important' :
                             'translateY(-50%) scale(1.1) !important';
      };
      btn.onmouseleave = () => {
        btn.style.background = 'rgba(255,255,255,0.95) !important';
        btn.style.transform = btn.className.includes('close') ? 'scale(1) !important' :
                             btn.className.includes('prev') ? 'translateY(-50%) scale(1) !important' :
                             'translateY(-50%) scale(1) !important';
      };
    };

    addHoverEffect(closeBtn);
    if (prevBtn) addHoverEffect(prevBtn);
    if (nextBtn) addHoverEffect(nextBtn);

    // Event handlers
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeModal();
    };

    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    // Navigation handlers
    if (prevBtn && nextBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        this.navigateModalImage(-1, img);
      };

      nextBtn.onclick = (e) => {
        e.stopPropagation();
        this.navigateModalImage(1, img);
      };
    }

    // Keyboard support
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft' && prevBtn) {
        this.navigateModalImage(-1, img);
      } else if (e.key === 'ArrowRight' && nextBtn) {
        this.navigateModalImage(1, img);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Add responsive adjustments
    const addResponsiveStyles = () => {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        closeBtn.style.cssText += `
          top: 10px !important;
          right: 10px !important;
          width: 40px !important;
          height: 40px !important;
          font-size: 24px !important;
        `;

        if (prevBtn) {
          prevBtn.style.cssText += `
            left: 10px !important;
            width: 50px !important;
            height: 50px !important;
            font-size: 28px !important;
          `;
        }

        if (nextBtn) {
          nextBtn.style.cssText += `
            right: 10px !important;
            width: 50px !important;
            height: 50px !important;
            font-size: 28px !important;
          `;
        }

        container.style.cssText += `
          max-width: 95vw !important;
          max-height: 85vh !important;
          margin: 0 10px !important;
        `;
      }
    };

    addResponsiveStyles();

    // Re-apply responsive styles on window resize
    const handleResize = () => addResponsiveStyles();
    window.addEventListener('resize', handleResize);

    // Assemble modal
    container.appendChild(img);
    modal.appendChild(container);
    modal.appendChild(closeBtn);
    if (prevBtn) modal.appendChild(prevBtn);
    if (nextBtn) modal.appendChild(nextBtn);

    // Add to DOM and show
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Show with animation
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);

    // Update close modal to remove resize listener
    const originalCloseModal = closeModal;
    closeModal = () => {
      window.removeEventListener('resize', handleResize);
      originalCloseModal();
    };

    console.log('Enhanced modal created and shown');
  }



  // Navigate modal image
  navigateModalImage(direction, modalImg) {
    console.log('Navigating modal image:', direction);

    const images = this.getProductImages();
    if (!images || images.length <= 1) return;

    let newIndex = this.currentImageIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    console.log('New image index:', newIndex, 'Image:', images[newIndex]);

    this.currentImageIndex = newIndex;
    modalImg.src = images[newIndex];

    // Update main page thumbnail selection
    const thumbnails = document.querySelectorAll('.product__thumbnail');
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('product__thumbnail--selected', i === newIndex);
    });

    // Update main image
    const mainImage = document.querySelector('.product__img');
    if (mainImage) {
      mainImage.src = images[newIndex];
    }
  }

  // Render reviews
  renderReviews(reviews) {
    if (!reviews || reviews.length === 0) return;

    // Update ratings section
    const ratingsSection = document.querySelector('.product__details-wrapper:last-child');
    if (ratingsSection) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      ratingsSection.innerHTML = `
        <div class="product__details-title">
          Ratings & Reviews (${reviews.length})
          <span class="product__details-icon">-</span>
        </div>
        <div class="product__details-content" style="display: block;">
          <div class="product__rating-summary">
            <div class="product__rating-average">
              <span class="product__rating-number">${avgRating.toFixed(1)}</span>
              <div class="product__rating-stars">
                ${this.renderStars(avgRating)}
              </div>
              <span class="product__rating-count">(${reviews.length} reviews)</span>
            </div>
          </div>
          <div class="product__reviews-list">
            ${reviews.slice(0, 3).map(review => this.renderReviewItem(review)).join('')}
          </div>
        </div>
      `;
    }
  }

  // Render review item
  renderReviewItem(review) {
    return `
      <div class="product__review-item">
        <div class="product__review-header">
          <div class="product__review-author">
            <strong>${review.name}</strong>
            ${review.is_verified ? '<span class="product__verified-badge">Verified Purchase</span>' : ''}
          </div>
          <div class="product__review-rating">
            ${this.renderStars(review.rating)}
          </div>
        </div>
        <div class="product__review-text">${review.review}</div>
        ${review.location ? `<div class="product__review-location">${review.location}</div>` : ''}
      </div>
    `;
  }

  // Render star rating
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
      ${'★'.repeat(fullStars)}
      ${hasHalfStar ? '☆' : ''}
      ${'☆'.repeat(emptyStars)}
    `;
  }

  // Render related products
  renderRelatedProducts(products) {
    if (!products || products.length === 0) return;

    // Update "Shop more" section
    const shopMoreSection = document.querySelector('.related:first-of-type .related__grid');
    if (shopMoreSection) {
      shopMoreSection.innerHTML = products.slice(0, 3).map(product =>
        ProductDisplayHelper.createProductCard(product)
      ).join('');
    }

    // Update "You may also like" section
    const youMayLikeSection = document.querySelector('.related--category .related__grid');
    if (youMayLikeSection) {
      youMayLikeSection.innerHTML = products.slice(3, 6).map(product =>
        ProductDisplayHelper.createProductCard(product)
      ).join('');
    }
  }

  // Update wishlist button
  updateWishlistButton() {
    const wishlistBtn = document.querySelector('.btn--wishlist img');
    if (wishlistBtn) {
      if (this.isInWishlist) {
        wishlistBtn.src = 'img/icon-heart-filled.svg';
        wishlistBtn.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)';
      } else {
        wishlistBtn.src = 'img/icon-heart.svg';
        wishlistBtn.style.filter = 'none';
      }
    }
  }

  // Update page title
  updatePageTitle() {
    if (this.product) {
      document.title = `${this.product.name} - Skeyy`;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Add to cart button
    const addToCartBtn = document.querySelector('.product__btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }

    // Wishlist button
    const wishlistBtn = document.querySelector('.btn--wishlist');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', () => {
        this.toggleWishlist();
      });
    }

    // Product details toggles
    const detailsToggles = document.querySelectorAll('.product__details-title');
    detailsToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.toggleDetails(toggle);
      });
    });
  }

  // Add to cart
  async addToCart() {
    try {
      if (this.product.stock <= 0) {
        this.showNotification('Product is out of stock', 'error');
        return;
      }

      const token = localStorage.getItem('skeyy_auth_token');
      if (!token) {
        this.showNotification('Please login to add items to cart', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        return;
      }

      // Show loading state
      const addToCartBtn = document.querySelector('.product__btn');
      const originalText = addToCartBtn.textContent;
      addToCartBtn.textContent = 'Adding...';
      addToCartBtn.disabled = true;

      const response = await apiService.addToCart(this.productId, 1);

      if (response.success) {
        this.showNotification('Product added to cart successfully!', 'success');
        // Update cart count if function exists
        if (typeof updateCartCount === 'function') {
          updateCartCount();
        }
      } else {
        throw new Error(response.message);
      }

      // Restore button
      addToCartBtn.textContent = originalText;
      addToCartBtn.disabled = false;

    } catch (error) {
      console.error('Failed to add to cart:', error);
      this.showNotification(error.message || 'Failed to add product to cart', 'error');

      // Restore button
      const addToCartBtn = document.querySelector('.product__btn');
      addToCartBtn.textContent = 'Add to cart';
      addToCartBtn.disabled = false;
    }
  }

  // Toggle wishlist
  async toggleWishlist() {
    try {
      const token = localStorage.getItem('skeyy_auth_token');
      if (!token) {
        this.showNotification('Please login to manage your wishlist', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        return;
      }

      const response = await apiService.toggleWishlist(this.productId);

      if (response.success) {
        this.isInWishlist = response.data.is_in_wishlist;
        this.updateWishlistButton();

        const message = response.data.action === 'added' ?
          'Product added to wishlist!' : 'Product removed from wishlist!';
        this.showNotification(message, 'success');

        // Update wishlist count if function exists
        if (typeof updateWishlistCount === 'function') {
          updateWishlistCount();
        }
      } else {
        throw new Error(response.message);
      }

    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      this.showNotification(error.message || 'Failed to update wishlist', 'error');
    }
  }

  // Toggle product details section
  toggleDetails(toggleElement) {
    const icon = toggleElement.querySelector('.product__details-icon');
    const content = toggleElement.nextElementSibling;

    if (content && content.classList.contains('product__details-content')) {
      const isOpen = content.style.display === 'block';
      content.style.display = isOpen ? 'none' : 'block';
      icon.textContent = isOpen ? '+' : '-';
    }
  }

  // Show loading state
  showLoading() {
    const productSection = document.querySelector('.product');
    if (productSection) {
      productSection.style.opacity = '0.5';
    }
  }

  // Hide loading state
  hideLoading() {
    console.log('Hiding loading states and showing content');

    // Hide page loading overlay
    const pageLoading = document.getElementById('page-loading');
    if (pageLoading) {
      pageLoading.style.opacity = '0';
      setTimeout(() => {
        pageLoading.style.display = 'none';
      }, 300);
    }

    // Hide image loading placeholder
    const imgLoading = document.querySelector('.product__img-loading');
    if (imgLoading) {
      imgLoading.style.display = 'none';
    }

    // Show main image
    const mainImg = document.querySelector('.product__img');
    if (mainImg) {
      mainImg.style.display = 'block';
    }

    // Hide options loading placeholder
    const optionsLoading = document.querySelector('.product__options-loading');
    if (optionsLoading) {
      optionsLoading.style.display = 'none';
    }

    // Enable cart buttons
    const wishlistBtn = document.querySelector('.btn--wishlist');
    const addToCartBtn = document.querySelector('.product__btn');

    if (wishlistBtn) {
      wishlistBtn.style.opacity = '1';
      wishlistBtn.style.pointerEvents = 'all';
    }

    if (addToCartBtn) {
      addToCartBtn.style.opacity = '1';
      addToCartBtn.style.pointerEvents = 'all';
      addToCartBtn.innerHTML = 'Add to cart';
    }

    // Show product section with smooth transition
    const productSection = document.querySelector('.product');
    if (productSection) {
      productSection.style.transition = 'opacity 0.5s ease';
      productSection.style.opacity = '1';
    }

    console.log('Loading complete - content visible');
  }

  // Hide page loading overlay
  hidePageLoading() {
    const pageLoading = document.getElementById('page-loading');
    if (pageLoading) {
      pageLoading.style.opacity = '0';
      setTimeout(() => {
        pageLoading.style.display = 'none';
      }, 300);
    }
  }

  // Show error message
  showError(message) {
    const productSection = document.querySelector('.product .container');
    if (productSection) {
      productSection.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem;">
          <h2>Error</h2>
          <p>${message}</p>
          <a href="browse.html" class="btn btn--primary">Browse Products</a>
        </div>
      `;
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Use the existing notification function from products.js if available
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// Initialize product detail manager when DOM is loaded
let productDetailManager;

document.addEventListener('DOMContentLoaded', () => {
  productDetailManager = new ProductDetailManager();
  productDetailManager.init();
});

// Export for global access
if (typeof window !== 'undefined') {
  window.productDetailManager = productDetailManager;
}
