/**
 * BJT Shop Cart Functionality
 */

// Initialize the cart from localStorage
window.cart = window.cart || [];

/**
 * Initialize the cart functionality
 */
function initCart() {
    // Load the cart data from localStorage
    loadCart();
    
    // Set up event listeners
    setupCartEventListeners();
    
    // Update the cart display
    updateCartDisplay();
}

/**
 * Load cart data from localStorage
 */
function loadCart() {
    try {
        const savedCart = localStorage.getItem('bjt_cart');
        if (savedCart && savedCart !== "undefined" && savedCart !== "null") {
            window.cart = JSON.parse(savedCart);
        } else {
            window.cart = [];
        }
    } catch (e) {
        console.error('Error loading cart data:', e);
        window.cart = [];
    }
}

/**
 * Save cart data to localStorage
 */
function saveCart() {
    localStorage.setItem('bjt_cart', JSON.stringify(window.cart));
}

/**
 * Set up cart event listeners
 */
function setupCartEventListeners() {
    // Cart toggle button
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
    }
    
    // Close cart button
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartPanel);
    }
    
    // Clear cart button
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', showClearCartConfirmation);
    }
    
    // Cart confirmation buttons
    const cancelClearBtn = document.getElementById('cart-confirm-cancel');
    if (cancelClearBtn) {
        cancelClearBtn.addEventListener('click', hideClearCartConfirmation);
    }
    
    const confirmClearBtn = document.getElementById('cart-confirm-proceed');
    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', clearCart);
    }
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }
    
    // Close cart when clicking outside
    document.addEventListener('click', function(event) {
        const cartPreview = document.getElementById('cart-preview');
        const cartToggle = document.getElementById('cart-toggle');
        
        if (cartPreview && cartPreview.classList.contains('active') && 
            !cartPreview.contains(event.target) && 
            !cartToggle.contains(event.target)) {
            closeCartPanel();
        }
    });
}

/**
 * Toggle the cart panel display
 */
function toggleCart() {
    const cartPreview = document.getElementById('cart-preview');
    if (cartPreview) {
        cartPreview.classList.toggle('active');
    }
}

/**
 * Close the cart panel
 */
function closeCartPanel() {
    const cartPreview = document.getElementById('cart-preview');
    if (cartPreview) {
        cartPreview.classList.remove('active');
    }
}

/**
 * Show the clear cart confirmation panel
 */
function showClearCartConfirmation() {
    const confirmPanel = document.getElementById('cart-confirm');
    if (confirmPanel) {
        confirmPanel.classList.add('show');
    }
}

/**
 * Hide the clear cart confirmation panel
 */
function hideClearCartConfirmation() {
    const confirmPanel = document.getElementById('cart-confirm');
    if (confirmPanel) {
        confirmPanel.classList.remove('show');
    }
}

/**
 * Clear all items from the cart
 */
function clearCart() {
    window.cart = [];
    saveCart();
    updateCartDisplay();
    hideClearCartConfirmation();
    BJTUtils.showNotification('购物车已清空');
}

/**
 * Update the cart display
 */
function updateCartDisplay() {
    updateCartCount();
    
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (!cartItemsContainer) return;
    
    // Clear existing cart items
    while (cartItemsContainer.firstChild && cartItemsContainer.firstChild !== emptyCartMessage) {
        cartItemsContainer.removeChild(cartItemsContainer.firstChild);
    }
    
    // Show/hide empty cart message
    if (emptyCartMessage) {
        emptyCartMessage.style.display = window.cart.length === 0 ? 'block' : 'none';
    }
    
    if (window.cart.length === 0) {
        if (cartTotalElement) {
            cartTotalElement.textContent = '¥0.00';
        }
        return;
    }
    
    // Calculate total
    let total = 0;
    
    // Add each cart item to the display
    window.cart.forEach((item, index) => {
        const itemElement = createCartItemElement(item, index);
        cartItemsContainer.appendChild(itemElement);
        
        // Add to total
        total += (item.price * item.quantity);
    });
    
    // Update total display
    if (cartTotalElement) {
        cartTotalElement.textContent = BJTUtils.formatCurrency(total);
    }
}

/**
 * Create a cart item element
 * @param {Object} item - The cart item
 * @param {number} index - The item index in the cart
 * @returns {HTMLElement} - The cart item element
 */
function createCartItemElement(item, index) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    
    let imageUrl = item.image || '../images/placeholder.jpg';
    
    cartItem.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">${BJTUtils.formatCurrency(item.price)} × ${item.quantity}</div>
            <div class="cart-item-quantity">
                <button class="quantity-btn quantity-decrease" data-index="${index}">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                <button class="quantity-btn quantity-increase" data-index="${index}">+</button>
                <button class="cart-item-remove" data-index="${index}">×</button>
            </div>
        </div>
    `;
    
    // Add event listeners to the buttons
    const decreaseBtn = cartItem.querySelector('.quantity-decrease');
    decreaseBtn.addEventListener('click', function() {
        updateCartItemQuantity(index, item.quantity - 1);
    });
    
    const increaseBtn = cartItem.querySelector('.quantity-increase');
    increaseBtn.addEventListener('click', function() {
        updateCartItemQuantity(index, item.quantity + 1);
    });
    
    const quantityInput = cartItem.querySelector('.quantity-input');
    quantityInput.addEventListener('change', function() {
        updateCartItemQuantity(index, parseInt(this.value) || 1);
    });
    
    const removeBtn = cartItem.querySelector('.cart-item-remove');
    removeBtn.addEventListener('click', function() {
        removeFromCart(index);
    });
    
    return cartItem;
}

/**
 * Update the cart item count display
 */
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const count = window.cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCount.textContent = count;
    }
}

/**
 * Add an item to the cart
 * @param {Object} product - The product to add to the cart
 * @param {number} quantity - The quantity to add
 */
function addToCart(product, quantity = 1) {
    if (!product || !product.id || !product.name || !product.price) {
        console.error('Invalid product data', product);
        return;
    }
    
    // Check if the product is already in the cart
    const existingItemIndex = window.cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
        // Update quantity of existing item
        updateCartItemQuantity(existingItemIndex, window.cart[existingItemIndex].quantity + quantity);
    } else {
        // Add new item
        window.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            type: product.type || 'product'
        });
        
        saveCart();
        updateCartDisplay();
    }
    
    BJTUtils.showNotification(`已添加 ${quantity} 个 ${product.name} 到购物车`);
}

/**
 * Remove an item from the cart
 * @param {number} index - The index of the item to remove
 */
function removeFromCart(index) {
    if (index >= 0 && index < window.cart.length) {
        const removedItem = window.cart[index];
        window.cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
        BJTUtils.showNotification(`已从购物车中移除 ${removedItem.name}`);
    }
}

/**
 * Update the quantity of a cart item
 * @param {number} index - The index of the item to update
 * @param {number} quantity - The new quantity
 */
function updateCartItemQuantity(index, quantity) {
    if (index >= 0 && index < window.cart.length) {
        // Ensure quantity is at least 1
        quantity = Math.max(1, quantity);
        
        // Update the item
        window.cart[index].quantity = quantity;
        saveCart();
        updateCartDisplay();
    }
}

/**
 * Calculate price based on tiered pricing
 * @param {Array} priceTiers - The price tiers array
 * @param {number} quantity - The quantity
 * @returns {number} - The calculated price
 */
function calculateTieredPrice(priceTiers, quantity) {
    if (!priceTiers || priceTiers.length === 0) {
        return 0;
    }
    
    for (const tier of priceTiers) {
        // Parse the range values
        if (tier.range.includes('-')) {
            // Format: "1-10"
            const [min, max] = tier.range.split('-').map(n => parseInt(n));
            if (quantity >= min && quantity <= max) {
                return tier.price;
            }
        } else if (tier.range.includes('>')) {
            // Format: ">100"
            const min = parseInt(tier.range.replace('>', ''));
            if (quantity > min) {
                return tier.price;
            }
        } else if (tier.range.includes('+')) {
            // Format: "1+"
            const min = parseInt(tier.range.replace('+', ''));
            if (quantity >= min) {
                return tier.price;
            }
        }
    }
    
    // Default to the last tier if no match found
    return priceTiers[priceTiers.length - 1].price;
}

/**
 * Proceed to checkout
 */
function proceedToCheckout() {
    if (window.cart.length === 0) {
        BJTUtils.showNotification('购物车为空，无法结算');
        return;
    }
    
    // Check if user is logged in
    if (!BJTUtils.requireLogin()) {
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Export cart functions for use in other files
window.BJTCart = {
    initCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    calculateTieredPrice,
    getCart: () => window.cart
}; 