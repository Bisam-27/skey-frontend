class OrderSuccess {
  constructor() {
    this.orderDetails = null;
    this.init();
  }

  init() {
    this.loadOrderDetails();
    this.displayOrderSummary();
  }

  loadOrderDetails() {
    // Get order details from localStorage (set during checkout)
    const orderData = localStorage.getItem('order_details');
    if (orderData) {
      try {
        this.orderDetails = JSON.parse(orderData);
        console.log('Order details loaded:', this.orderDetails);
      } catch (error) {
        console.error('Error parsing order details:', error);
      }
    }
  }

  displayOrderSummary() {
    if (!this.orderDetails) {
      this.showGenericSuccess();
      return;
    }

    const summaryContainer = document.querySelector('.success-summary');
    if (!summaryContainer) {
      console.warn('Success summary container not found');
      return;
    }

    summaryContainer.innerHTML = `
      <div class="order-success-details">
        <div class="order-header">
          <h2>Order Placed Successfully! 🎉</h2>
          <div class="order-info">
            <div class="order-id">Order ID: <strong>${this.orderDetails.order_id}</strong></div>
            <div class="invoice-id">Invoice: <strong>${this.orderDetails.invoice_id}</strong></div>
            <div class="order-date">Date: <strong>${new Date(this.orderDetails.order_date).toLocaleDateString()}</strong></div>
          </div>
        </div>

        <div class="order-items">
          <h3>Items Ordered</h3>
          ${this.orderDetails.items.map(item => `
            <div class="order-item">
              <div class="item-details">
                <div class="item-name">${item.product_name}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
                <div class="item-price">Price: ₹${item.price} each</div>
                <div class="item-subtotal">Subtotal: ₹${item.subtotal}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="payment-summary">
          <h3>Payment Summary</h3>
          <div class="payment-details">
            <div class="payment-row">
              <span>Bag Total:</span>
              <span>₹${this.orderDetails.payment_details.bag_total}</span>
            </div>
            ${this.orderDetails.payment_details.bag_discount > 0 ? `
              <div class="payment-row discount">
                <span>Bag Discount:</span>
                <span>-₹${this.orderDetails.payment_details.bag_discount}</span>
              </div>
            ` : ''}
            ${this.orderDetails.payment_details.delivery_fee > 0 ? `
              <div class="payment-row">
                <span>Delivery Fee:</span>
                <span>₹${this.orderDetails.payment_details.delivery_fee}</span>
              </div>
            ` : ''}
            <div class="payment-row total">
              <span><strong>Amount Paid:</strong></span>
              <span><strong>₹${this.orderDetails.payment_details.amount_payable}</strong></span>
            </div>
          </div>
        </div>

        <div class="shipping-info">
          <h3>Shipping Address</h3>
          <div class="address-details">
            <div>${this.orderDetails.shipping_address.full_name}</div>
            <div>${this.orderDetails.shipping_address.address_line_1}</div>
            ${this.orderDetails.shipping_address.address_line_2 ? `<div>${this.orderDetails.shipping_address.address_line_2}</div>` : ''}
            <div>${this.orderDetails.shipping_address.city}, ${this.orderDetails.shipping_address.state} ${this.orderDetails.shipping_address.postal_code}</div>
            <div>Phone: ${this.orderDetails.shipping_address.phone_number}</div>
          </div>
        </div>

        <div class="stock-updates">
          <h3>Stock Updates</h3>
          <div class="stock-info">
            ${this.orderDetails.stock_updates.map(update => `
              <div class="stock-item">
                <span class="product-name">${update.product_name}</span>
                <span class="stock-change">Ordered: ${update.ordered_quantity}</span>
                <span class="remaining-stock">Remaining: ${update.remaining_stock}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="order-actions">
          <a href="browse.html" class="btn btn--primary">Continue Shopping</a>
          <a href="orders.html" class="btn btn--secondary">View Orders</a>
        </div>
      </div>
    `;

    // Clear order details from localStorage after displaying
    localStorage.removeItem('order_details');
  }

  showGenericSuccess() {
    const summaryContainer = document.querySelector('.success-summary');
    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="generic-success">
          <h2>Order Placed Successfully! 🎉</h2>
          <p>Thank you for your order. You will receive a confirmation email shortly.</p>
          <div class="order-actions">
            <a href="browse.html" class="btn btn--primary">Continue Shopping</a>
            <a href="orders.html" class="btn btn--secondary">View Orders</a>
          </div>
        </div>
      `;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OrderSuccess();
});
