# Skeyy E-commerce Frontend

A modern, responsive frontend for the Skeyy e-commerce platform, built with vanilla HTML, CSS (SCSS), and JavaScript.

## 🚀 Overview

The frontend provides a complete e-commerce shopping experience with a clean, modern design. It features responsive layouts, dynamic content loading, user authentication, shopping cart functionality, and comprehensive product browsing capabilities.

## 🛠 Technology Stack

- **HTML5**: Semantic markup and structure
- **CSS3/SCSS**: Styling with Sass preprocessing
- **Vanilla JavaScript**: Dynamic functionality and API integration
- **Swiper.js**: Touch slider/carousel functionality
- **Responsive Design**: Mobile-first approach
- **RESTful API Integration**: Backend communication

## 📁 Project Structure

```
frontend/
├── css/
│   ├── abstracts/
│   │   ├── _mixins.scss           # SCSS mixins
│   │   ├── _functions.scss        # SCSS functions
│   │   └── _variables.scss        # SCSS variables
│   ├── base/
│   │   ├── _typography.scss       # Typography styles
│   │   ├── _base.scss            # Base styles
│   │   ├── _utilities.scss       # Utility classes
│   │   └── _animations.scss      # Animation definitions
│   ├── components/
│   │   ├── _buttons.scss         # Button styles
│   │   ├── _input.scss           # Input field styles
│   │   ├── _links.scss           # Link styles
│   │   ├── _toast.scss           # Toast notification styles
│   │   └── _card.scss            # Card component styles
│   ├── layout/
│   │   ├── _navigation.scss      # Navigation styles
│   │   ├── _footer.scss          # Footer styles
│   │   └── _header.scss          # Header styles
│   ├── pages/
│   │   ├── _home.scss            # Homepage styles
│   │   ├── _products.scss        # Product page styles
│   │   ├── _cart.scss            # Cart page styles
│   │   ├── _login.scss           # Login page styles
│   │   ├── _dashboard.scss       # Dashboard styles
│   │   ├── _orders.scss          # Orders page styles
│   │   ├── _profile.scss         # Profile page styles
│   │   ├── _checkout.scss        # Checkout page styles
│   │   ├── _success.scss         # Success page styles
│   │   ├── _about.scss           # About page styles
│   │   └── _search.scss          # Search page styles
│   ├── main.scss                 # Main SCSS file
│   ├── main.css                  # Compiled CSS
│   ├── main.min.css             # Minified CSS
│   ├── auth.css                  # Authentication styles
│   ├── dynamic.css              # Dynamic styles
│   ├── navbar-dropdown.css      # Navigation dropdown styles
│   └── success.css              # Success page styles
├── js/
│   ├── api.js                    # API communication layer
│   ├── app.js                    # Main application logic
│   ├── auth.js                   # Authentication handling
│   ├── cart.js                   # Shopping cart functionality
│   ├── categories.js             # Category management
│   ├── checkout.js               # Checkout process
│   ├── global-search.js          # Global search functionality
│   ├── product-detail.js         # Product detail page logic
│   ├── products.js               # Product listing logic
│   ├── success.js                # Success page logic
│   └── wishlist.js               # Wishlist functionality
├── img/                          # Static images and icons
├── media/
│   └── products/                 # Product images
├── about.html                    # About page
├── address.html                  # Address management
├── browse.html                   # Product browsing
├── cart.html                     # Shopping cart
├── change-address.html           # Address modification
├── checkout.html                 # Checkout process
├── faqs.html                     # FAQ page
├── index.html                    # Homepage
├── login.html                    # User login
├── orders.html                   # Order history
├── product.html                  # Product detail page
├── profile.html                  # User profile
├── signup.html                   # User registration
├── success.html                  # Order success page
└── wishlist.html                 # User wishlist
```

## 🎨 Design System

### Color Palette
- **Primary**: #575fcf (Purple)
- **Secondary**: #3c40c6 (Dark Purple)
- **Accent Background**: #fbfbfb (Light Gray)
- **Accent**: #f6f6f6 (Gray)
- **Black**: #000
- **Gray**: #cacaca
- **Dark Gray**: #9f9f9f
- **White**: #fff

### Typography
- **Font Family**: System fonts with fallbacks
- **Responsive Typography**: Fluid font sizing
- **Font Weights**: Light (300), Normal (400), Bold (700)

### Responsive Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## 🌟 Key Features

### User Experience
- **Responsive Design**: Optimized for all devices
- **Fast Loading**: Optimized assets and lazy loading
- **Intuitive Navigation**: Clear menu structure
- **Search Functionality**: Global product search
- **Filter & Sort**: Advanced product filtering

### E-commerce Functionality
- **Product Catalog**: Browse products by category
- **Product Details**: Detailed product information
- **Shopping Cart**: Add, remove, and modify cart items
- **Wishlist**: Save products for later
- **User Authentication**: Login, signup, and profile management
- **Checkout Process**: Streamlined order placement
- **Order History**: View past orders
- **Address Management**: Multiple shipping addresses

### Interactive Elements
- **Image Carousels**: Swiper.js integration
- **Dynamic Content**: AJAX-powered content loading
- **Toast Notifications**: User feedback system
- **Form Validation**: Client-side validation
- **Loading States**: Visual feedback during operations

## 🔧 Installation & Setup

### Prerequisites
- Modern web browser
- Backend API server running
- Node.js (for SCSS compilation, optional)

### Setup Steps

1. **Clone the repository**
   ```bash
   cd frontend
   ```

2. **SCSS Compilation (Optional)**
   If you want to modify styles:
   ```bash
   npm install -g sass
   sass --watch css/main.scss:css/main.css
   ```

3. **Serve the files**
   - Use a local server (Live Server, Python HTTP server, etc.)
   - Or access through the backend server at `http://localhost:5000`

4. **Configuration**
   - Ensure backend API is running on `http://localhost:5000`
   - Update API endpoints in `js/api.js` if needed

## 📱 Pages Overview

### Public Pages
- **Homepage (`index.html`)**: Featured products, categories, banners
- **Browse (`browse.html`)**: Product catalog with filtering
- **Product (`product.html`)**: Individual product details
- **About (`about.html`)**: Company information
- **FAQs (`faqs.html`)**: Frequently asked questions
- **Login (`login.html`)**: User authentication
- **Signup (`signup.html`)**: User registration

### Protected Pages (Require Authentication)
- **Profile (`profile.html`)**: User account management
- **Cart (`cart.html`)**: Shopping cart management
- **Checkout (`checkout.html`)**: Order placement
- **Orders (`orders.html`)**: Order history
- **Wishlist (`wishlist.html`)**: Saved products
- **Address (`address.html`)**: Address management
- **Change Address (`change-address.html`)**: Address modification
- **Success (`success.html`)**: Order confirmation

## 🔌 API Integration

### API Service (`js/api.js`)
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT token-based
- **Error Handling**: Comprehensive error management
- **Request Methods**: GET, POST, PUT, DELETE

### Key API Methods
```javascript
// Authentication
api.login(credentials)
api.register(userData)
api.logout()

// Products
api.getProducts(params)
api.searchProducts(query)
api.getProductById(id)

// Cart
api.getCart()
api.addToCart(productId, quantity)
api.updateCartItem(itemId, quantity)
api.removeFromCart(itemId)

// Wishlist
api.getWishlist()
api.toggleWishlist(productId)

// Orders
api.checkout(orderData)
api.getOrders()

// Coupons
api.validateCoupon(code, amount)
```

## 🎯 JavaScript Modules

### Core Modules
- **`app.js`**: Main application initialization and utilities
- **`api.js`**: API communication layer
- **`auth.js`**: Authentication management

### Feature Modules
- **`cart.js`**: Shopping cart functionality
- **`products.js`**: Product listing and filtering
- **`product-detail.js`**: Individual product page logic
- **`checkout.js`**: Checkout process management
- **`wishlist.js`**: Wishlist operations
- **`categories.js`**: Category management
- **`global-search.js`**: Search functionality

## 🔐 Authentication Flow

### User States
- **Anonymous**: Can browse products, view details
- **Authenticated**: Full access to cart, wishlist, orders
- **Admin**: Redirected to admin panel

### Token Management
- **Storage**: localStorage (`skeyy_auth_token`)
- **Auto-refresh**: Token validation on page load
- **Expiration**: Automatic logout on token expiry

### Protected Routes
- Automatic redirection to login for protected pages
- Navigation updates based on authentication state
- Role-based access control

## 🎨 Styling Architecture

### SCSS Organization
- **Abstracts**: Variables, mixins, functions
- **Base**: Reset, typography, base styles
- **Components**: Reusable UI components
- **Layout**: Page structure elements
- **Pages**: Page-specific styles

### CSS Methodology
- **BEM**: Block Element Modifier naming convention
- **Mobile-first**: Responsive design approach
- **Component-based**: Modular styling approach

## 📊 Performance Optimizations

### Loading Performance
- **Minified CSS**: Compressed stylesheets
- **Optimized Images**: Compressed and properly sized
- **Lazy Loading**: Images loaded on demand
- **CDN Integration**: External libraries from CDN

### Runtime Performance
- **Efficient DOM Manipulation**: Minimal reflows
- **Event Delegation**: Optimized event handling
- **Debounced Search**: Reduced API calls
- **Caching**: Local storage for frequently accessed data

## 🔧 Development Guidelines

### Code Organization
- **Modular JavaScript**: Separate concerns into modules
- **Consistent Naming**: Clear, descriptive variable names
- **Error Handling**: Comprehensive error management
- **Documentation**: Inline comments for complex logic

### Best Practices
- **Progressive Enhancement**: Works without JavaScript
- **Accessibility**: ARIA labels and semantic HTML
- **SEO Friendly**: Proper meta tags and structure
- **Cross-browser Compatibility**: Tested across browsers

## 🚀 Deployment

### Production Build
1. **Compile SCSS**: Generate minified CSS
2. **Optimize Images**: Compress all images
3. **Minify JavaScript**: Compress JS files
4. **Update API URLs**: Configure production endpoints

### Hosting Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFlare, AWS CloudFront
- **Traditional Hosting**: Apache, Nginx

## 📞 Support

For frontend-related issues or questions, check the browser console for errors and ensure the backend API is running properly.
