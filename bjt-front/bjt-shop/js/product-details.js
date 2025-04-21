/**
 * BJT Shop - Product Details Page
 * 
 * Manages the product details page functionality including:
 * - Loading product data from JSON
 * - Displaying product information
 * - Image gallery functionality
 * - Adding products to cart
 * - Handling related products
 */

// Global variables
let productData = null;
let currentProduct = null;
let relatedProducts = [];

// DOM Elements
const elements = {
    // Loading indicator
    loadingPlaceholder: document.getElementById('productLoadingPlaceholder'),
    productContent: document.getElementById('productContent'),
    
    // Product details
    productName: document.getElementById('productName'),
    productImage: document.getElementById('productImage'),
    productShortDescription: document.getElementById('productShortDescription'),
    productId: document.getElementById('productId'),
    productCategory: document.getElementById('productCategory'),
    productPartNumberContainer: document.getElementById('productPartNumberContainer'),
    productPartNumber: document.getElementById('productPartNumber'),
    productDescription: document.getElementById('productDescription'),
    
    // Pricing
    productPrice: document.getElementById('productPrice'),
    productOriginalPrice: document.getElementById('productOriginalPrice'),
    tieredPriceSection: document.getElementById('tieredPriceSection'),
    productTieredPrices: document.getElementById('productTieredPrices'),
    
    // Inventory
    inventorySection: document.getElementById('inventorySection'),
    inventoryStatus: document.getElementById('inventoryStatus'),
    inventoryQuantity: document.getElementById('inventoryQuantity'),
    
    // Image gallery
    imageGallery: document.getElementById('imageGallery'),
    
    // Tabs
    productTabsSection: document.getElementById('productTabsSection'),
    specificationsTableBody: document.getElementById('specificationsTableBody'),
    featuresList: document.getElementById('featuresList'),
    featuresTabItem: document.getElementById('featuresTabItem'),
    compatibilityContent: document.getElementById('compatibilityContent'),
    compatibilityTabItem: document.getElementById('compatibilityTabItem'),
    
    // Related products
    relatedProductsSection: document.getElementById('relatedProductsSection'),
    relatedProductsList: document.getElementById('relatedProductsList'),
    relatedProductTemplate: document.getElementById('relatedProductTemplate'),
    
    // Cart
    cartButton: document.getElementById('cartButton'),
    cartCount: document.getElementById('cartCount'),
    cartPreview: document.getElementById('cartPreview'),
    cartItems: document.getElementById('cartItems'),
    emptyCartMessage: document.getElementById('emptyCartMessage'),
    cartTotal: document.getElementById('cartTotal'),
    
    // Quantity
    productQuantity: document.getElementById('productQuantity'),
    decreaseQuantity: document.getElementById('decreaseQuantity'),
    increaseQuantity: document.getElementById('increaseQuantity'),
    
    // Buttons
    addToCartBtn: document.getElementById('addToCartBtn'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    clearCartBtn: document.getElementById('clearCartBtn'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    
    // Confirmations
    clearCartConfirmation: document.getElementById('clearCartConfirmation'),
    cancelClearBtn: document.getElementById('cancelClearBtn'),
    confirmClearBtn: document.getElementById('confirmClearBtn'),
    
    // Notification
    notification: document.getElementById('notification')
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer components
    loadComponent('components/header.html', 'header-placeholder');
    loadComponent('components/footer.html', 'footer-placeholder');
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showNotification('Product ID is missing', 'error');
        return;
    }
    
    // Load product data
    loadProductData(productId);
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Load product data from JSON file
 * @param {string} productId - The ID of the product to load
 */
function loadProductData(productId) {
    fetch('data/products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            productData = data;
            
            // Find the product in machines, consumables, or spareParts
            let product = data.machines.find(item => item.id === productId);
            
            if (!product) {
                product = data.consumables.find(item => item.id === productId);
            }
            
            if (!product) {
                product = data.spareParts.find(item => item.id === productId);
            }
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            currentProduct = product;
            
            // Update the UI with product data
            updateProductUI(product);
            
            // Find related products
            relatedProducts = findRelatedProducts(data, product);
            
            // Hide loading placeholder
            elements.loadingPlaceholder.style.display = 'none';
            elements.productContent.style.display = 'flex';
            elements.productTabsSection.style.display = 'block';
            
            // Display related products if available
            if (relatedProducts.length > 0) {
                elements.relatedProductsSection.style.display = 'block';
            }
            
            // Update page title
            document.title = `${product.name} - BJT Shop`;
            
            // Update cart display
            updateCartDisplay();
        })
        .catch(error => {
            console.error('Error loading product data:', error);
            showNotification('Failed to load product data', 'error');
        });
}

/**
 * Update the product UI with product data
 * @param {Object} product - The product object
 */
function updateProductUI(product) {
    // Basic product info
    elements.productName.textContent = product.name;
    elements.productShortDescription.textContent = product.shortDescription;
    elements.productId.textContent = product.id;
    elements.productCategory.textContent = formatCategory(product.category);
    
    // Part number (if available)
    if (product.partNumber) {
        elements.productPartNumberContainer.style.display = 'block';
        elements.productPartNumber.textContent = product.partNumber;
    }
    
    // Product image
    if (product.image) {
        elements.productImage.src = product.image;
        elements.productImage.alt = product.name;
    }
    
    // Image gallery
    if (product.images && product.images.length > 0) {
        elements.imageGallery.innerHTML = '';
        product.images.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.alt = `${product.name} - Image ${index + 1}`;
            thumbnail.className = index === 0 ? 'thumbnail active' : 'thumbnail';
            thumbnail.addEventListener('click', () => setActiveImage(image, thumbnail));
            elements.imageGallery.appendChild(thumbnail);
        });
    } else if (product.image) {
        // Create a single thumbnail for the main image
        elements.imageGallery.innerHTML = '';
        const thumbnail = document.createElement('img');
        thumbnail.src = product.image;
        thumbnail.alt = product.name;
        thumbnail.className = 'thumbnail active';
        elements.imageGallery.appendChild(thumbnail);
    }
    
    // Description
    elements.productDescription.innerHTML = product.description;
    
    // Price information
    updatePriceDisplay(product);
    
    // Inventory status (for consumables)
    updateInventoryStatus(product);
    
    // Specifications
    updateSpecifications(product);
    
    // Features (for machines)
    if (product.features && product.features.length > 0) {
        updateFeatures(product);
        elements.featuresTabItem.style.display = 'block';
    }
    
    // Compatibility (for consumables and spare parts)
    if (product.compatibleModels && product.compatibleModels.length > 0) {
        updateCompatibility(product);
        elements.compatibilityTabItem.style.display = 'block';
    }
}

/**
 * Format category name for display
 * @param {string} category - The category ID
 * @returns {string} - The formatted category name
 */
function formatCategory(category) {
    const categories = {
        'machine': 'Machine',
        'film': 'Film',
        'sparePart': 'Spare Part'
    };
    
    return categories[category] || category;
}

/**
 * Set the active image in the gallery
 * @param {string} imgSrc - The image source URL
 * @param {HTMLElement} thumbElement - The thumbnail element that was clicked
 */
function setActiveImage(imgSrc, thumbElement) {
    elements.productImage.src = imgSrc;
    
    // Update active thumbnail
    const thumbnails = elements.imageGallery.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbElement.classList.add('active');
}

/**
 * Update the price display
 * @param {Object} product - The product object
 */
function updatePriceDisplay(product) {
    // Regular price display
    elements.productPrice.textContent = formatPrice(product.price);
    
    // Original price (if there's a discount)
    if (product.originalPrice && product.originalPrice > product.price) {
        elements.productOriginalPrice.textContent = formatPrice(product.originalPrice);
        elements.productOriginalPrice.style.display = 'inline-block';
    } else {
        elements.productOriginalPrice.style.display = 'none';
    }
    
    // Tiered pricing (for consumables)
    if (product.priceTiers && product.priceTiers.length > 0) {
        elements.tieredPriceSection.style.display = 'block';
        elements.productTieredPrices.innerHTML = '';
        
        product.priceTiers.forEach(tier => {
            const tierItem = document.createElement('div');
            tierItem.className = 'tiered-price-item';
            
            // Format tier quantity
            let quantityText = '';
            if (tier.quantity === 1) {
                quantityText = '1 unit';
            } else {
                quantityText = `${tier.quantity}+ units`;
            }
            
            tierItem.innerHTML = `
                <span>${quantityText}</span>
                <span>${formatPrice(tier.price)} / unit</span>
            `;
            
            elements.productTieredPrices.appendChild(tierItem);
        });
    } else {
        elements.tieredPriceSection.style.display = 'none';
    }
}

/**
 * Update the inventory status display
 * @param {Object} product - The product object
 */
function updateInventoryStatus(product) {
    if (product.inventory !== undefined) {
        elements.inventorySection.style.display = 'block';
        
        const isInStock = product.inventory > 0;
        const statusClass = isInStock ? 'in-stock' : 'out-of-stock';
        const statusText = isInStock ? 'In Stock' : 'Out of Stock';
        
        elements.inventoryStatus.textContent = statusText;
        elements.inventoryStatus.className = `inventory-status ${statusClass}`;
        
        // Show quantity only if in stock
        if (isInStock) {
            const quantityText = product.inventory > 10 
                ? 'More than 10 available' 
                : `${product.inventory} available`;
            
            elements.inventoryQuantity.textContent = quantityText;
            elements.inventoryQuantity.style.display = 'inline';
            
            // Update quantity input max value
            elements.productQuantity.max = product.inventory;
            if (parseInt(elements.productQuantity.value) > product.inventory) {
                elements.productQuantity.value = product.inventory;
            }
        } else {
            elements.inventoryQuantity.style.display = 'none';
            elements.addToCartBtn.disabled = true;
            elements.addToCartBtn.textContent = 'Out of Stock';
        }
    } else {
        elements.inventorySection.style.display = 'none';
    }
}

/**
 * Update the specifications table
 * @param {Object} product - The product object
 */
function updateSpecifications(product) {
    if (!product.specifications) return;
    
    elements.specificationsTableBody.innerHTML = '';
    
    // Convert specifications object to array for easier sorting
    const specs = Object.entries(product.specifications).map(([name, value]) => ({ name, value }));
    
    // Sort specifications alphabetically
    specs.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create table rows
    specs.forEach(spec => {
        const row = document.createElement('tr');
        
        const th = document.createElement('th');
        th.textContent = formatSpecName(spec.name);
        
        const td = document.createElement('td');
        td.textContent = formatSpecValue(spec.value);
        
        row.appendChild(th);
        row.appendChild(td);
        
        elements.specificationsTableBody.appendChild(row);
    });
}

/**
 * Format specification name for display
 * @param {string} name - The specification name
 * @returns {string} - The formatted name
 */
function formatSpecName(name) {
    // Capitalize first letter and add spaces before capital letters
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, function(str) { return str.toUpperCase(); })
        .trim();
}

/**
 * Format specification value for display
 * @param {any} value - The specification value
 * @returns {string} - The formatted value
 */
function formatSpecValue(value) {
    return String(value);
}

/**
 * Update the features list
 * @param {Object} product - The product object
 */
function updateFeatures(product) {
    if (!product.features || product.features.length === 0) return;
    
    elements.featuresList.innerHTML = '';
    
    product.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        elements.featuresList.appendChild(li);
    });
    
    // Show the features tab
    document.getElementById('features-tab').click();
}

/**
 * Update the compatibility information
 * @param {Object} product - The product object
 */
function updateCompatibility(product) {
    if (!product.compatibleModels || product.compatibleModels.length === 0) return;
    
    elements.compatibilityContent.innerHTML = '';
    
    // Create compatibility information
    const compatTitle = document.createElement('h5');
    compatTitle.textContent = 'Compatible with:';
    elements.compatibilityContent.appendChild(compatTitle);
    
    const modelList = document.createElement('ul');
    modelList.className = 'list-unstyled';
    
    product.compatibleModels.forEach(model => {
        const li = document.createElement('li');
        li.className = 'mb-2';
        
        if (model === 'all') {
            li.innerHTML = '<i class="fas fa-check-circle text-success mr-2"></i> All BJT machines';
        } else {
            li.innerHTML = `<i class="fas fa-check-circle text-success mr-2"></i> ${model}`;
        }
        
        modelList.appendChild(li);
    });
    
    elements.compatibilityContent.appendChild(modelList);
}

/**
 * Find related products based on the current product
 * @param {Object} data - The product data
 * @param {Object} product - The current product
 * @returns {Array} - Array of related products
 */
function findRelatedProducts(data, product) {
    const related = [];
    
    // Logic to find related products based on category and compatibility
    if (product.category === 'machine') {
        // For machines, show compatible consumables and spare parts
        const compatibleConsumables = data.consumables.filter(item => 
            item.compatibleModels && 
            (item.compatibleModels.includes(product.id) || item.compatibleModels.includes('all'))
        );
        
        const compatibleSpareParts = data.spareParts.filter(item => 
            item.compatibleModels && 
            (item.compatibleModels.includes(product.id) || item.compatibleModels.includes('all'))
        );
        
        // Add up to 4 related products
        [...compatibleConsumables, ...compatibleSpareParts].slice(0, 4).forEach(item => {
            related.push(item);
        });
    } else if (product.category === 'film' || product.category === 'sparePart') {
        // For consumables and spare parts, show compatible machines and other compatible items
        if (product.compatibleModels && product.compatibleModels.length > 0) {
            // Find compatible machines
            const compatibleMachines = data.machines.filter(machine => 
                product.compatibleModels.includes(machine.id) || product.compatibleModels.includes('all')
            );
            
            // Find other compatible items
            const sameCategory = product.category === 'film' ? data.consumables : data.spareParts;
            const otherCompatibleItems = sameCategory.filter(item => 
                item.id !== product.id && 
                item.compatibleModels && 
                product.compatibleModels.some(model => 
                    item.compatibleModels.includes(model) || item.compatibleModels.includes('all')
                )
            );
            
            // Add up to 4 related products
            [...compatibleMachines, ...otherCompatibleItems].slice(0, 4).forEach(item => {
                related.push(item);
            });
        }
    }
    
    // Display related products
    if (related.length > 0) {
        elements.relatedProductsList.innerHTML = '';
        
        related.forEach(item => {
            const template = elements.relatedProductTemplate.content.cloneNode(true);
            
            const img = template.querySelector('img');
            img.src = item.image || 'img/product-placeholder.jpg';
            img.alt = item.name;
            
            template.querySelector('.related-product-name').textContent = item.name;
            template.querySelector('.related-product-description').textContent = item.shortDescription;
            template.querySelector('.related-product-price').textContent = formatPrice(item.price);
            
            const viewDetailsBtn = template.querySelector('.view-details-btn');
            viewDetailsBtn.addEventListener('click', () => {
                window.location.href = `product-details.html?id=${item.id}`;
            });
            
            elements.relatedProductsList.appendChild(template);
        });
    }
    
    return related;
}

/**
 * Add the current product to the cart
 */
function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(elements.productQuantity.value);
    if (isNaN(quantity) || quantity < 1) {
        showNotification('Please select a valid quantity', 'warning');
        return;
    }
    
    // Check inventory if applicable
    if (currentProduct.inventory !== undefined && quantity > currentProduct.inventory) {
        showNotification(`Only ${currentProduct.inventory} items available`, 'warning');
        elements.productQuantity.value = currentProduct.inventory;
        return;
    }
    
    // Add to cart (using cart.js functionality)
    if (typeof cart !== 'undefined' && typeof cart.addItem === 'function') {
        cart.addItem(currentProduct, quantity);
        showNotification(`${quantity} x ${currentProduct.name} added to cart`, 'success');
        updateCartDisplay();
    } else {
        // Fallback if cart.js isn't loaded properly
        const cartItems = JSON.parse(localStorage.getItem('bjt_cart') || '[]');
        
        // Check if item already exists in cart
        const existingItemIndex = cartItems.findIndex(item => item.id === currentProduct.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            cartItems[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cartItems.push({
                id: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                image: currentProduct.image,
                quantity: quantity
            });
        }
        
        // Save to localStorage
        localStorage.setItem('bjt_cart', JSON.stringify(cartItems));
        showNotification(`${quantity} x ${currentProduct.name} added to cart`, 'success');
        updateCartDisplay();
    }
}

/**
 * Update the cart display (count and preview)
 */
function updateCartDisplay() {
    // Get cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('bjt_cart') || '[]');
    
    // Update cart count
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    
    // Update cart preview
    if (cartItems.length === 0) {
        elements.cartItems.innerHTML = '';
        elements.emptyCartMessage.style.display = 'flex';
    } else {
        elements.emptyCartMessage.style.display = 'none';
        elements.cartItems.innerHTML = '';
        
        let totalPrice = 0;
        
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item mb-3';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image || 'img/product-placeholder.jpg'}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            elements.cartItems.appendChild(cartItem);
        });
        
        // Update total price
        elements.cartTotal.textContent = formatPrice(totalPrice);
        
        // Add event listeners to cart item buttons
        addCartItemEventListeners();
    }
}

/**
 * Add event listeners to cart item buttons
 */
function addCartItemEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.cart-item .quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.id;
            const action = this.dataset.action;
            
            updateCartItemQuantity(itemId, action === 'increase' ? 1 : -1);
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.id;
            removeCartItem(itemId);
        });
    });
}

/**
 * Update the quantity of an item in the cart
 * @param {string} itemId - The ID of the item to update
 * @param {number} change - The amount to change the quantity by (positive or negative)
 */
function updateCartItemQuantity(itemId, change) {
    const cartItems = JSON.parse(localStorage.getItem('bjt_cart') || '[]');
    
    const itemIndex = cartItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    cartItems[itemIndex].quantity += change;
    
    // Remove item if quantity is 0 or less
    if (cartItems[itemIndex].quantity <= 0) {
        cartItems.splice(itemIndex, 1);
    }
    
    // Save to localStorage
    localStorage.setItem('bjt_cart', JSON.stringify(cartItems));
    
    // Update display
    updateCartDisplay();
}

/**
 * Remove an item from the cart
 * @param {string} itemId - The ID of the item to remove
 */
function removeCartItem(itemId) {
    const cartItems = JSON.parse(localStorage.getItem('bjt_cart') || '[]');
    
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    
    // Save to localStorage
    localStorage.setItem('bjt_cart', JSON.stringify(updatedItems));
    
    // Update display
    updateCartDisplay();
    showNotification('Item removed from cart', 'info');
}

/**
 * Format price for display
 * @param {number} price - The price to format
 * @returns {string} - The formatted price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(price);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Quantity selector
    elements.decreaseQuantity.addEventListener('click', function() {
        const currentVal = parseInt(elements.productQuantity.value);
        if (currentVal > 1) {
            elements.productQuantity.value = currentVal - 1;
        }
    });
    
    elements.increaseQuantity.addEventListener('click', function() {
        const currentVal = parseInt(elements.productQuantity.value);
        const max = elements.productQuantity.max ? parseInt(elements.productQuantity.max) : 99;
        
        if (currentVal < max) {
            elements.productQuantity.value = currentVal + 1;
        }
    });
    
    elements.productQuantity.addEventListener('change', function() {
        let value = parseInt(this.value);
        const max = this.max ? parseInt(this.max) : 99;
        
        if (isNaN(value) || value < 1) {
            value = 1;
        } else if (value > max) {
            value = max;
        }
        
        this.value = value;
    });
    
    // Add to cart button
    elements.addToCartBtn.addEventListener('click', function() {
        addToCart();
    });
    
    // Cart toggle
    elements.cartButton.addEventListener('click', function() {
        elements.cartPreview.classList.toggle('show');
    });
    
    elements.closeCartBtn.addEventListener('click', function() {
        elements.cartPreview.classList.remove('show');
    });
    
    // Clear cart
    elements.clearCartBtn.addEventListener('click', function() {
        elements.clearCartConfirmation.style.display = 'flex';
    });
    
    elements.cancelClearBtn.addEventListener('click', function() {
        elements.clearCartConfirmation.style.display = 'none';
    });
    
    elements.confirmClearBtn.addEventListener('click', function() {
        localStorage.removeItem('bjt_cart');
        updateCartDisplay();
        elements.clearCartConfirmation.style.display = 'none';
        showNotification('Cart cleared', 'info');
    });
    
    // Checkout
    elements.checkoutBtn.addEventListener('click', function() {
        const cartItems = JSON.parse(localStorage.getItem('bjt_cart') || '[]');
        
        if (cartItems.length === 0) {
            showNotification('Your cart is empty', 'warning');
            return;
        }
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    });
    
    // Close cart when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInside = elements.cartPreview.contains(event.target) || 
                             elements.cartButton.contains(event.target);
        
        if (!isClickInside && elements.cartPreview.classList.contains('show')) {
            elements.cartPreview.classList.remove('show');
        }
    });
}

/**
 * Show a notification
 * @param {string} message - The message to show
 * @param {string} type - The type of notification (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
    if (!elements.notification) return;
    
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
    
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

/**
 * Load a component from an HTML file
 * @param {string} url - The URL of the component to load
 * @param {string} targetId - The ID of the element to load the component into
 */
function loadComponent(url, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            target.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading component:', error);
        });
} 