# 🎨 Skeyy Frontend - Customer Portal

The customer-facing web application for the Skeyy e-commerce platform with modern UI, Google OAuth integration, and comprehensive shopping features.

## 🔗 Related Repositories

- **Frontend Portal**: [https://github.com/Bisam-27/skey-frontend](https://github.com/Bisam-27/skey-frontend) (This Repository)
- **Backend API**: [https://github.com/Bisam-27/skey-backend](https://github.com/Bisam-27/skey-backend)
- **Admin Panel**: [https://github.com/Bisam-27/skey-adminpannel](https://github.com/Bisam-27/skey-adminpannel)
- **Vendor Panel**: [https://github.com/Bisam-27/skey-vendorpannel](https://github.com/Bisam-27/skey-vendorpannel)

## 📚 Documentation Links

- [Backend API Documentation](https://github.com/Bisam-27/skey-backend#readme)
- [Admin Panel Documentation](https://github.com/Bisam-27/skey-adminpannel#readme)
- [Vendor Panel Documentation](https://github.com/Bisam-27/skey-vendorpannel#readme)

## 🌟 Features

### 🔐 Authentication System
- **Traditional Login/Signup**: Email and password authentication
- **Google OAuth Integration**: One-click signup/login with role selection modal
- **JWT Token Management**: Secure client-side token handling
- **Role-based Redirects**: Automatic redirection based on user role
- **Session Management**: Persistent login sessions

### 🛒 Shopping Experience
- **Product Browsing**: Category-based product exploration
- **Real-time Search**: Instant search results as you type
- **Advanced Filtering**: Price, category, brand filters
- **Product Details**: Comprehensive product information
- **Shopping Cart**: Add, remove, update quantities
- **Wishlist**: Save products for later
- **Secure Checkout**: Complete purchase flow

### 📱 User Interface
- **Responsive Design**: Mobile-first approach
- **Modern UI/UX**: Clean, intuitive interface
- **Interactive Elements**: Smooth animations and transitions
- **Accessibility**: WCAG compliant design
- **Cross-browser Support**: Works on all modern browsers

## 🛠 Technology Stack

- **HTML5**: Semantic markup and structure
- **CSS3/SCSS**: Styling with Sass preprocessing
- **Vanilla JavaScript**: Dynamic functionality and API integration
- **Google OAuth 2.0**: Third-party authentication
- **JWT Tokens**: Secure authentication
- **Swiper.js**: Touch slider/carousel functionality
- **Responsive Design**: Mobile-first approach
- **RESTful API Integration**: Backend communication

## 📁 File Structure

```
frontend/
├── index.html              # Homepage
├── login.html             # Login page with Google OAuth
├── signup.html            # Signup page with role selection
├── browse.html            # Product browsing
├── product.html           # Product details
├── cart.html              # Shopping cart
├── checkout.html          # Checkout process
├── profile.html           # User profile
├── orders.html            # Order history
├── wishlist.html          # User wishlist
├── about.html             # About page
├── faqs.html              # FAQ page
├── success.html           # Order success page
├── address.html           # Address management
├── change-address.html    # Address modification
├── css/
│   ├── abstracts/         # SCSS variables, mixins, functions
│   ├── base/              # Base styles, typography, utilities
│   ├── components/        # Reusable UI components
│   ├── layout/            # Navigation, header, footer
│   ├── pages/             # Page-specific styles
│   ├── main.scss          # Main SCSS file
│   ├── main.min.css       # Compiled & minified CSS
│   ├── auth.css           # Authentication styles with Google OAuth
│   ├── dynamic.css        # Dynamic content styles
│   └── success.css        # Success page styles
├── js/
│   ├── auth.js            # Authentication & Google OAuth
│   ├── products.js        # Product management
│   ├── cart.js            # Shopping cart
│   ├── checkout.js        # Checkout process
│   ├── orders.js          # Order history
│   ├── wishlist.js        # Wishlist management
│   ├── global-search.js   # Real-time search
│   ├── unified-signup.js  # Signup handling
│   ├── product-detail.js  # Product details
│   ├── categories.js      # Category management
│   ├── success.js         # Success page logic
│   └── app.js             # Main application logic
├── img/                   # Images and assets
└── media/                 # Product images
    └── products/          # Product image directory
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
