class OrdersManager {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5000/api';
    this.token = localStorage.getItem('skeyy_auth_token');
    this.currentPage = 1;
    this.ordersPerPage = 10;
    
    this.init();
  }

  init() {
    // Check authentication
    if (!this.token) {
      window.location.href = 'login.html';
      return;
    }

    // Load orders when page loads
    this.loadOrders();
  }

  async loadOrders(page = 1) {
    try {
      this.showLoading();
      this.currentPage = page;

      const queryParams = new URLSearchParams({
        page: page,
        limit: this.ordersPerPage,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });

      const url = `${this.apiBaseUrl}/user/orders?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('skeyy_auth_token');
          window.location.href = 'login.html';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.displayOrders(result.data.orders);
        this.setupPagination(result.data.pagination);
      } else {
        throw new Error(result.message || 'Failed to load orders');
      }

    } catch (error) {
      console.error('Error loading orders:', error);
      this.showError('Failed to load orders. Please try again.');
    }
  }

  showLoading() {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const ordersContainer = document.getElementById('orders-container');
    
    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (ordersContainer) ordersContainer.style.display = 'none';
  }

  displayOrders(orders) {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const ordersContainer = document.getElementById('orders-container');
    
    if (loadingState) loadingState.style.display = 'none';
    
    if (!orders || orders.length === 0) {
      if (ordersContainer) ordersContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (ordersContainer) {
      ordersContainer.style.display = 'block';
      ordersContainer.innerHTML = orders.map(order => this.createOrderHTML(order)).join('');
    }
  }

  createOrderHTML(order) {
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const orderItems = order.items.map(item => this.createOrderItemHTML(item)).join('');

    return `
      <div class="orders__single">
        <div class="orders__preview-wrapper">
          <div class="bold orders__number">Order #: ${order.order_number}</div>
          <a href="#" class="orders__track" onclick="orderManager.trackOrder('${order.order_number}')">Track</a>
        </div>

        <div class="orders__details-wrapper">
          <div class="orders__title-wrapper">
            <div class="brand">
              Order placed on: ${orderDate}
            </div>
            <div class="bold">Total: ₹${order.total_amount}</div>
          </div>

          ${orderItems}
        </div>
      </div>
    `;
  }

  createOrderItemHTML(item) {
    const imageUrl = item.product_image || 'img/placeholder.jpg';
    const size = item.size ? `<div class="orders__item-info">Size <span class="bold">${item.size}</span></div>` : '';
    const color = item.color ? `<div class="orders__item-info">Color <span class="bold">${item.color}</span></div>` : '';

    return `
      <div class="orders__item">
        <img src="${imageUrl}" alt="${item.product_name}" class="orders__img" />

        <div class="orders__item-details">
          <div class="s bold orders__item-name">
            ${item.product_name}
          </div>

          ${size}
          ${color}

          <div class="orders__item-totals">
            <div class="orders__item-info">
              Qty <span class="bold">${item.quantity}</span>
            </div>
            <div class="orders__item-info">
              Subtotal <span class="bold">₹${item.line_total}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupPagination(pagination) {
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer || pagination.totalPages <= 1) {
      if (paginationContainer) paginationContainer.style.display = 'none';
      return;
    }

    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (pagination.hasPrevPage) {
      paginationHTML += `<button onclick="orderManager.loadOrders(${pagination.currentPage - 1})" class="pagination__btn">Previous</button>`;
    }

    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
      const activeClass = i === pagination.currentPage ? 'pagination__btn--active' : '';
      paginationHTML += `<button onclick="orderManager.loadOrders(${i})" class="pagination__btn ${activeClass}">${i}</button>`;
    }

    // Next button
    if (pagination.hasNextPage) {
      paginationHTML += `<button onclick="orderManager.loadOrders(${pagination.currentPage + 1})" class="pagination__btn">Next</button>`;
    }

    paginationHTML += '</div>';
    
    paginationContainer.innerHTML = paginationHTML;
    paginationContainer.style.display = 'block';
  }

  trackOrder(orderNumber) {
    // For now, just show an alert. This can be enhanced later with actual tracking functionality
    alert(`Tracking information for Order #${orderNumber} will be available soon.`);
  }

  showError(message) {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const ordersContainer = document.getElementById('orders-container');
    
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (ordersContainer) {
      ordersContainer.style.display = 'block';
      ordersContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h3>Error Loading Orders</h3>
          <p>${message}</p>
          <button onclick="orderManager.loadOrders()" class="btn btn--primary" style="margin-top: 1rem;">Try Again</button>
        </div>
      `;
    }
  }
}

// Initialize orders manager when DOM is loaded
let orderManager;
document.addEventListener('DOMContentLoaded', function() {
  orderManager = new OrdersManager();
});
