# BJT Product Management System UI Components Guide

This guide provides documentation for all UI components and styles available in the project.

## Theme System

The project uses a theme system defined in `src/styles/theme.css` with CSS variables for consistent styling. These variables are integrated with Tailwind CSS through the `tailwind.config.js` file.

### Color Palette

- Primary: `var(--primary-color)` - #1E88E5
- Primary Light: `var(--primary-light)` - #64B5F6
- Primary Dark: `var(--primary-dark)` - #0D47A1
- Primary Background: `var(--primary-bg)` - #F5F9FF

- Secondary: `var(--secondary-color)` - #455A64
- Secondary Light: `var(--secondary-light)` - #78909C
- Secondary Dark: `var(--secondary-dark)` - #263238

- Accent: `var(--accent-color)` - #FF9800
- Accent Light: `var(--accent-light)` - #FFB74D
- Accent Dark: `var(--accent-dark)` - #F57C00

- Status Colors: Success (#4CAF50), Error (#F44336), Warning (#FFCA28), Info (#29B6F6)

### Spacing

The project uses an 8px spacing system:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Typography

- Font Family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif
- Font Sizes: xs (12px), sm (14px), md (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)
- Line Heights: none (1), tight (1.25), normal (1.5), relaxed (1.75)

## Layout Components

### Main Layout

The `MainLayout` component provides a consistent layout structure with header, main content area, and footer.

```tsx
import MainLayout from './components/layout/MainLayout';

<MainLayout>
  {/* Your page content */}
</MainLayout>
```

### Navbar

```html
<nav className="navbar">
  <div className="navbar-brand">
    <img src="/logo.svg" alt="Logo" className="navbar-logo" />
    <span>Company Name</span>
  </div>
  <div className="navbar-menu">
    <a href="#" className="navbar-item active">Home</a>
    <a href="#" className="navbar-item">Products</a>
    <a href="#" className="navbar-item">About</a>
  </div>
</nav>
```

## UI Components

### Buttons

```html
<!-- Primary Button -->
<button className="btn btn-primary">Primary Button</button>

<!-- Secondary Button -->
<button className="btn btn-secondary">Secondary Button</button>

<!-- Accent Button -->
<button className="btn btn-accent">Accent Button</button>

<!-- Outline Button -->
<button className="btn btn-outline">Outline Button</button>

<!-- Link Button -->
<button className="btn btn-link">Link Button</button>

<!-- Button Sizes -->
<button className="btn btn-primary btn-sm">Small Button</button>
<button className="btn btn-primary">Default Button</button>
<button className="btn btn-primary btn-lg">Large Button</button>

<!-- Full Width Button -->
<button className="btn btn-primary btn-block">Full Width Button</button>

<!-- Icon Button -->
<button className="btn btn-icon">
  <svg><!-- Icon SVG --></svg>
</button>
```

### Cards

```html
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
    <p className="card-subtitle">Card Subtitle</p>
  </div>
  <div className="card-body">
    <p>Card content goes here.</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary">Action</button>
  </div>
</div>

<!-- Card with hover effect -->
<div className="card card-hover">
  <!-- Card content -->
</div>
```

### Form Elements

```html
<!-- Input Field -->
<div className="form-group">
  <label className="form-label">Input Label</label>
  <input type="text" className="form-control" placeholder="Enter text" />
  <div className="form-helper">Helper text goes here</div>
</div>

<!-- Input with Error -->
<div className="form-group">
  <label className="form-label">Input with Error</label>
  <input type="text" className="form-control border-error" />
  <div className="form-error">Error message goes here</div>
</div>

<!-- Select Dropdown -->
<div className="form-group">
  <label className="form-label">Select Option</label>
  <div className="select-wrapper">
    <select className="select-control">
      <option>Option 1</option>
      <option>Option 2</option>
      <option>Option 3</option>
    </select>
  </div>
</div>

<!-- Checkbox -->
<div className="form-group">
  <label className="flex items-center">
    <input type="checkbox" className="form-checkbox" />
    <span className="ml-2">Checkbox Label</span>
  </label>
</div>

<!-- Radio Button -->
<div className="form-group">
  <label className="flex items-center">
    <input type="radio" className="form-radio" name="radio-group" />
    <span className="ml-2">Radio Option</span>
  </label>
</div>
```

### Tables

```html
<div className="table-container">
  <table className="table">
    <thead className="table-header">
      <tr>
        <th className="table-cell-head">Column 1</th>
        <th className="table-cell-head">Column 2</th>
        <th className="table-cell-head">Column 3</th>
      </tr>
    </thead>
    <tbody>
      <tr className="table-row">
        <td className="table-cell">Data 1</td>
        <td className="table-cell">Data 2</td>
        <td className="table-cell">Data 3</td>
      </tr>
      <tr className="table-row">
        <td className="table-cell">Data 4</td>
        <td className="table-cell">Data 5</td>
        <td className="table-cell">Data 6</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Badges

```html
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-info">Info</span>
```

### Alerts

```html
<div className="alert alert-info">
  <p>This is an information alert.</p>
</div>

<div className="alert alert-success">
  <p>This is a success alert.</p>
</div>

<div className="alert alert-warning">
  <p>This is a warning alert.</p>
</div>

<div className="alert alert-error">
  <p>This is an error alert.</p>
</div>
```

### Tabs

```html
<div className="tabs">
  <button className="tab active">Tab 1</button>
  <button className="tab">Tab 2</button>
  <button className="tab">Tab 3</button>
</div>

<div className="tab-content">
  <!-- Tab content goes here -->
</div>
```

### Product Components

```html
<!-- Product Card -->
<div className="product-card">
  <img src="/product.jpg" alt="Product" className="product-image" />
  <div className="product-body">
    <h3 className="product-title">Product Title</h3>
    <p className="product-description">Product description goes here</p>
    <div className="product-price">$99.99</div>
    <div className="product-meta">
      <span className="product-stock stock-available">In Stock</span>
      <!-- or -->
      <span className="product-stock stock-low">Low Stock</span>
      <!-- or -->
      <span className="product-stock stock-unavailable">Out of Stock</span>
    </div>
  </div>
</div>

<!-- Product Grid -->
<div className="product-grid">
  <!-- Multiple product cards go here -->
</div>
```

### Cart Components

```html
<!-- Cart Item -->
<div className="cart-item">
  <img src="/product.jpg" alt="Product" className="cart-item-image" />
  <div className="cart-item-details">
    <h3 className="cart-item-title">Product Title</h3>
    <div className="cart-item-price">$99.99</div>
    <div className="cart-item-quantity">
      <button className="quantity-btn">-</button>
      <input type="number" className="quantity-input" value="1" min="1" />
      <button className="quantity-btn">+</button>
    </div>
  </div>
  <div className="cart-item-actions">
    <button className="btn btn-sm btn-outline">Remove</button>
  </div>
</div>

<!-- Cart Summary -->
<div className="cart-summary">
  <div className="cart-total">
    <span>Total:</span>
    <span>$99.99</span>
  </div>
  <button className="btn btn-primary btn-block">Checkout</button>
</div>
```

### Loading & Skeleton Components

```html
<!-- Loading Spinner -->
<div className="loader"></div>

<!-- Skeleton Loading -->
<div className="skeleton skeleton-text"></div>
<div className="skeleton skeleton-circle"></div>
```

### Modal

```html
<div className="modal-backdrop">
  <div className="modal">
    <div className="modal-content">
      <div className="modal-header">
        <h3 className="modal-title">Modal Title</h3>
        <button className="modal-close">&times;</button>
      </div>
      <div className="modal-body">
        <!-- Modal content goes here -->
      </div>
      <div className="modal-footer">
        <button className="btn btn-outline">Cancel</button>
        <button className="btn btn-primary">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

### Tooltip

```html
<div className="tooltip">
  Hover me
  <div className="tooltip-content">Tooltip text</div>
</div>
```

## Responsive Design

The component library includes responsive utility classes for different screen sizes:

```html
<!-- Hidden on small screens -->
<div className="hidden-sm">This is hidden on small screens</div>

<!-- Hidden on medium screens -->
<div className="hidden-md">This is hidden on medium screens</div>

<!-- Hidden on large screens -->
<div className="hidden-lg">This is hidden on large screens</div>
```

## React Components

The project also includes React component implementations of these UI elements. Here are some examples:

### Button Component

```tsx
import Button from './components/common/Button';

<Button variant="primary" size="md" fullWidth={false}>
  Click Me
</Button>
```

### Input Component

```tsx
import Input from './components/common/Input';

<Input 
  label="Username" 
  helperText="Enter your username"
  error={null}
  fullWidth={true}
  startIcon={<UserIcon />}
/>
```

### Modal Component

```tsx
import Modal from './components/common/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content goes here</p>
</Modal>
```

## Using Tailwind with Custom Theme

The project integrates Tailwind CSS with the custom theme variables. You can use both the component classes defined in `components.css` and Tailwind utility classes together:

```html
<button className="btn btn-primary mt-4 hover:shadow-lg">
  Primary Button with Tailwind Utilities
</button>

<div className="card p-4 bg-background-card text-text-primary">
  <h3 className="text-xl mb-2 font-semibold">Card Title</h3>
  <p>Card content with Tailwind typography</p>
</div>
```

## Live Component Example

We've created a comprehensive example component that demonstrates all the UI components in action. You can view and use this example as a reference for implementing UI components in your application.

### How to Use the Example Component

1. Import the example component into your application:

```tsx
import UIComponentsExample from '../guide/ui-components-example';

// Then use it in your component:
<UIComponentsExample />
```

2. Or navigate to the route where it's available in the development environment (if configured).

### Learning from the Example

The example component (`src/guide/ui-components-example.tsx`) demonstrates:

- How to use all UI components in a real React application
- State management for interactive components like modals, tabs, and forms
- Proper integration of CSS classes with React components
- Responsive layouts using CSS grid and flexbox
- How to combine raw CSS classes with React component props

You can inspect the code to understand how to implement specific UI features in your own components. It serves as both documentation and a practical implementation reference.

### Best Practices Demonstrated

The example component follows these best practices:

1. **Semantic Structure**: Components are organized in a logical, semantic structure with appropriate headings and sections.
2. **Responsive Design**: The layout adjusts properly for different screen sizes.
3. **State Management**: The component uses React hooks for managing state in a clean, maintainable way.
4. **Accessibility**: Form elements have proper labels, and interactive elements have appropriate ARIA attributes.
5. **Consistency**: The styling is consistent throughout the example, following the design system guidelines.

Use this example as a reference when implementing UI components in your application to ensure consistency and follow best practices. 