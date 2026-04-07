import React, { useState } from 'react';

// Import React components if available
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const UIComponentsExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    option: 'option1',
    terms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">UI Components Example</h1>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-accent">Accent Button</button>
          <button className="btn btn-outline">Outline Button</button>
          <button className="btn btn-link">Link Button</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="btn btn-primary btn-sm">Small Button</button>
          <button className="btn btn-primary">Default Button</button>
          <button className="btn btn-primary btn-lg">Large Button</button>
        </div>
        <div className="mb-4">
          <button className="btn btn-primary btn-block">Full Width Button</button>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="md">React Button</Button>
          <Button variant="secondary" size="md">React Button</Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Card Title</h3>
              <p className="card-subtitle">Card Subtitle</p>
            </div>
            <div className="card-body">
              <p>Card content goes here. This is a basic card example.</p>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary">Action</button>
            </div>
          </div>
          
          <div className="card card-hover">
            <div className="card-header">
              <h3 className="card-title">Hover Card</h3>
            </div>
            <div className="card-body">
              <p>This card has a hover effect. Try hovering over it!</p>
            </div>
            <div className="card-footer">
              <button className="btn btn-outline">Learn More</button>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h3 className="text-xl font-semibold mb-2">Simple Card</h3>
              <p>A simpler card without header and footer sections.</p>
              <button className="btn btn-primary mt-4">Click Me</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                name="username"
                className="form-control" 
                placeholder="Enter username" 
                value={formValues.username}
                onChange={handleInputChange}
              />
              <div className="form-helper">Your unique username for the platform</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                name="email"
                className="form-control border-error" 
                placeholder="Enter email" 
                value={formValues.email}
                onChange={handleInputChange}
              />
              <div className="form-error">Please enter a valid email address</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Select Option</label>
              <div className="select-wrapper">
                <select 
                  className="select-control"
                  name="option"
                  value={formValues.option}
                  onChange={(e) => setFormValues({...formValues, option: e.target.value})}
                >
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <div className="form-group">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="form-checkbox" 
                  name="terms"
                  checked={formValues.terms}
                  onChange={handleInputChange}
                />
                <span className="ml-2">I accept the terms and conditions</span>
              </label>
            </div>
            
            <div className="form-group">
              <legend className="form-label mb-2">Choose an option:</legend>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" className="form-radio" name="radio-group" value="option1" />
                  <span className="ml-2">Option 1</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" className="form-radio" name="radio-group" value="option2" />
                  <span className="ml-2">Option 2</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" className="form-radio" name="radio-group" value="option3" />
                  <span className="ml-2">Option 3</span>
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <Input 
                label="React Input Component" 
                helperText="This is a React input component" 
                fullWidth={true}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Tables</h2>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-cell-head">Name</th>
                <th className="table-cell-head">Email</th>
                <th className="table-cell-head">Role</th>
                <th className="table-cell-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row">
                <td className="table-cell">John Doe</td>
                <td className="table-cell">john@example.com</td>
                <td className="table-cell">Admin</td>
                <td className="table-cell">
                  <button className="btn btn-sm btn-outline">Edit</button>
                </td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">Jane Smith</td>
                <td className="table-cell">jane@example.com</td>
                <td className="table-cell">User</td>
                <td className="table-cell">
                  <button className="btn btn-sm btn-outline">Edit</button>
                </td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">Robert Johnson</td>
                <td className="table-cell">robert@example.com</td>
                <td className="table-cell">Manager</td>
                <td className="table-cell">
                  <button className="btn btn-sm btn-outline">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Badges & Alerts</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-error">Error</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-info">Info</span>
        </div>
        <div className="space-y-4">
          <div className="alert alert-info">
            <p>This is an information alert with important details.</p>
          </div>
          <div className="alert alert-success">
            <p>Your changes have been saved successfully!</p>
          </div>
          <div className="alert alert-warning">
            <p>Be careful! This action cannot be undone.</p>
          </div>
          <div className="alert alert-error">
            <p>An error occurred while processing your request.</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Tabs</h2>
        <div className="tabs mb-4">
          <button 
            className={`tab ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            Tab 1
          </button>
          <button 
            className={`tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            Tab 2
          </button>
          <button 
            className={`tab ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            Tab 3
          </button>
        </div>
        <div className="p-4 border rounded-md">
          {activeTab === 0 && <p>Content for Tab 1</p>}
          {activeTab === 1 && <p>Content for Tab 2</p>}
          {activeTab === 2 && <p>Content for Tab 3</p>}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Product Components</h2>
        <div className="product-grid">
          <div className="product-card">
            <img src="https://via.placeholder.com/300x200" alt="Product" className="product-image" />
            <div className="product-body">
              <h3 className="product-title">Product Title</h3>
              <p className="product-description">Product description goes here. This is a sample product.</p>
              <div className="product-price">$99.99</div>
              <div className="product-meta">
                <span className="product-stock stock-available">In Stock</span>
              </div>
            </div>
          </div>
          <div className="product-card">
            <img src="https://via.placeholder.com/300x200" alt="Product" className="product-image" />
            <div className="product-body">
              <h3 className="product-title">Another Product</h3>
              <p className="product-description">Another product description goes here.</p>
              <div className="product-price">$149.99</div>
              <div className="product-meta">
                <span className="product-stock stock-low">Low Stock</span>
              </div>
            </div>
          </div>
          <div className="product-card">
            <img src="https://via.placeholder.com/300x200" alt="Product" className="product-image" />
            <div className="product-body">
              <h3 className="product-title">Out of Stock Product</h3>
              <p className="product-description">This product is currently unavailable.</p>
              <div className="product-price">$199.99</div>
              <div className="product-meta">
                <span className="product-stock stock-unavailable">Out of Stock</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Cart Components</h2>
        <div className="space-y-4">
          <div className="cart-item">
            <img src="https://via.placeholder.com/80x80" alt="Product" className="cart-item-image" />
            <div className="cart-item-details">
              <h3 className="cart-item-title">Product Title</h3>
              <div className="cart-item-price">$99.99</div>
              <div className="cart-item-quantity">
                <button className="quantity-btn">-</button>
                <input type="number" className="quantity-input" value="1" min="1" readOnly />
                <button className="quantity-btn">+</button>
              </div>
            </div>
            <div className="cart-item-actions">
              <button className="btn btn-sm btn-outline">Remove</button>
            </div>
          </div>
          <div className="cart-item">
            <img src="https://via.placeholder.com/80x80" alt="Product" className="cart-item-image" />
            <div className="cart-item-details">
              <h3 className="cart-item-title">Another Product</h3>
              <div className="cart-item-price">$149.99</div>
              <div className="cart-item-quantity">
                <button className="quantity-btn">-</button>
                <input type="number" className="quantity-input" value="2" min="1" readOnly />
                <button className="quantity-btn">+</button>
              </div>
            </div>
            <div className="cart-item-actions">
              <button className="btn btn-sm btn-outline">Remove</button>
            </div>
          </div>
          <div className="cart-summary">
            <div className="cart-total">
              <span>Total:</span>
              <span>$399.97</span>
            </div>
            <button className="btn btn-primary btn-block">Checkout</button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Loading & Skeleton</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="loader"></div>
          <span>Loading...</span>
        </div>
        <div className="space-y-2">
          <div className="skeleton skeleton-text w-3/4"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text w-1/2"></div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="skeleton skeleton-circle w-12 h-12"></div>
          <div className="space-y-2">
            <div className="skeleton skeleton-text w-48"></div>
            <div className="skeleton skeleton-text w-24"></div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Modal</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          Open Modal
        </button>
        
        {isModalOpen && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Modal Title</h3>
                  <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <p>This is the modal content. You can put any elements here.</p>
                  <div className="form-group mt-4">
                    <label className="form-label">Sample Input</label>
                    <input type="text" className="form-control" placeholder="Enter text" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="React Modal Component"
            size="md"
          >
            <p>This is a React Modal component example.</p>
          </Modal>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Tooltip</h2>
        <div className="flex items-center gap-4">
          <div className="tooltip">
            Hover me
            <div className="tooltip-content">This is a tooltip</div>
          </div>
          <div className="tooltip">
            Another tooltip
            <div className="tooltip-content">This is another tooltip with longer content</div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Responsive Design</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hidden-sm p-4 bg-primary-bg text-primary rounded">
            This is hidden on small screens
          </div>
          <div className="hidden-md p-4 bg-secondary-bg text-secondary rounded">
            This is hidden on medium screens
          </div>
          <div className="hidden-lg p-4 bg-accent-bg text-accent rounded">
            This is hidden on large screens
          </div>
        </div>
      </section>
    </div>
  );
};

export default UIComponentsExample; 