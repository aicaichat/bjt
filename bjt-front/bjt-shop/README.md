# BJT Product Management System

A standalone front-end application for BJT product catalog, including product listing, login, spare parts selection, order processing, and order confirmation.

## Features

- Comprehensive product catalog with machines, consumables, and spare parts
- User authentication system
- Shopping cart functionality with localStorage persistence
- Multi-tier pricing system
- Order management and history
- Responsive design for all devices
- Multi-language support (UI prepared for localization)

## Project Structure

```
bjt-shop/
├── css/               # Stylesheets
│   ├── variables.css  # CSS variables for design system
│   ├── styles.css     # Global styles
│   └── components.css # Component-specific styles
├── js/                # JavaScript files
│   ├── utils.js       # Utility functions
│   ├── auth.js        # Authentication functionality
│   ├── cart.js        # Shopping cart functionality
│   ├── products.js    # Product display functionality
│   └── app.js         # Main application functionality
├── data/              # Data files
│   └── products.json  # Product data
├── images/            # Image assets
├── components/        # Reusable HTML components
│   ├── header.html    # Page header
│   ├── footer.html    # Page footer
│   └── cart.html      # Cart component
├── pages/             # HTML pages
│   ├── login.html     # Login page
│   ├── products.html  # Products listing page
│   ├── consumables.html # Consumables listing page
│   ├── spare-parts.html # Spare parts listing page
│   ├── product-detail.html # Product detail page
│   ├── checkout.html  # Checkout page
│   └── orders.html    # Orders history page
└── index.html         # Main entry point
```

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository or download the ZIP file
2. Open the project folder
3. Open `index.html` in your browser

Alternatively, you can use a simple web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

Then navigate to `http://localhost:8000` or the URL provided by the web server.

## Usage

### Demo Accounts

The application includes the following demo accounts:

- Admin: Username: `admin`, Password: `admin123`
- Sales: Username: `sales`, Password: `sales123`
- Customer: Username: `customer`, Password: `customer123`

### Main Workflows

1. **Browsing Products**: Visit the home page and navigate to products, consumables, or spare parts pages
2. **Adding to Cart**: Click "Add to Cart" on product cards or product detail pages
3. **Checkout Process**: View cart, proceed to checkout, fill in details, and submit order
4. **Order Management**: View order history and details on the orders page

## Data Storage

This standalone application uses localStorage for data persistence:

- `bjt_user_data`: Current user information
- `bjt_cart`: Shopping cart items
- `bjt_orders`: Order history
- `bjt_language`: Selected language preference

## Development Notes

- The application is built with vanilla JavaScript, HTML, and CSS without any external dependencies
- The design system is implemented using CSS variables for consistency
- Modular code organization with separation of concerns
- Responsive design using flexbox and media queries

## License

This project is proprietary and owned by Hangzhou Bingjia Tech. Co., Ltd. 