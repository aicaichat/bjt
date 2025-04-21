/**
 * BJT Shop Products Functionality
 */

// Store loaded product data
let productData = {
    machines: [],
    consumables: [],
    spareParts: []
};

// Store current filter state
let currentFilters = {
    category: 'all',
    model: 'all',
    minPrice: 0,
    maxPrice: Infinity
};

/**
 * Initialize the products functionality
 * @param {string} productType - The product type to initialize (machines, consumables, spareParts)
 * @param {Function} callback - Optional callback function to execute after loading
 */
function initProducts(productType, callback) {
    // Load product data
    loadProductData(function() {
        // Set up event listeners
        setupProductEventListeners(productType);
        
        // Display products
        displayProducts(productType);
        
        // Run callback if provided
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
}

/**
 * Load product data from JSON file
 * @param {Function} callback - Callback function to execute after loading
 */
function loadProductData(callback) {
    fetch('../data/products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            productData = data;
            
            if (callback && typeof callback === 'function') {
                callback();
            }
        })
        .catch(error => {
            console.error('Error loading product data:', error);
        });
}

/**
 * Set up product event listeners
 * @param {string} productType - The product type (machines, consumables, spareParts)
 */
function setupProductEventListeners(productType) {
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            displayProducts(productType);
        });
    }
    
    // Model filter
    const modelFilter = document.getElementById('model-filter');
    if (modelFilter) {
        modelFilter.addEventListener('change', function() {
            currentFilters.model = this.value;
            displayProducts(productType);
        });
    }
    
    // Price range filters
    const minPriceFilter = document.getElementById('min-price-filter');
    if (minPriceFilter) {
        minPriceFilter.addEventListener('change', function() {
            currentFilters.minPrice = parseInt(this.value) || 0;
            displayProducts(productType);
        });
    }
    
    const maxPriceFilter = document.getElementById('max-price-filter');
    if (maxPriceFilter) {
        maxPriceFilter.addEventListener('change', function() {
            currentFilters.maxPrice = parseInt(this.value) || Infinity;
            displayProducts(productType);
        });
    }
    
    // Search input
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', BJTUtils.debounce(function() {
            currentFilters.search = this.value.toLowerCase();
            displayProducts(productType);
        }, 300));
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetFilters(productType);
        });
    }
}

/**
 * Reset all filters to default values
 * @param {string} productType - The product type (machines, consumables, spareParts)
 */
function resetFilters(productType) {
    currentFilters = {
        category: 'all',
        model: 'all',
        minPrice: 0,
        maxPrice: Infinity,
        search: ''
    };
    
    // Reset UI elements
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.value = 'all';
    
    const modelFilter = document.getElementById('model-filter');
    if (modelFilter) modelFilter.value = 'all';
    
    const minPriceFilter = document.getElementById('min-price-filter');
    if (minPriceFilter) minPriceFilter.value = '';
    
    const maxPriceFilter = document.getElementById('max-price-filter');
    if (maxPriceFilter) maxPriceFilter.value = '';
    
    const searchInput = document.getElementById('product-search');
    if (searchInput) searchInput.value = '';
    
    // Display products with reset filters
    displayProducts(productType);
}

/**
 * Display products based on current filters
 * @param {string} productType - The product type to display (machines, consumables, spareParts)
 */
function displayProducts(productType) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    // Get products based on type
    const products = productData[productType] || [];
    
    // Apply filters
    const filteredProducts = products.filter(product => {
        // Category filter
        if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
            return false;
        }
        
        // Model filter (for consumables and spare parts)
        if (currentFilters.model !== 'all' && product.compatibleModels) {
            if (!product.compatibleModels.includes(currentFilters.model) && 
                !product.compatibleModels.includes('ALL')) {
                return false;
            }
        }
        
        // Price range filter
        if (product.price < currentFilters.minPrice || product.price > currentFilters.maxPrice) {
            return false;
        }
        
        // Search filter
        if (currentFilters.search && currentFilters.search.trim() !== '') {
            const searchTerm = currentFilters.search.toLowerCase();
            const nameMatch = product.name.toLowerCase().includes(searchTerm);
            const descMatch = product.description.toLowerCase().includes(searchTerm);
            const shortDescMatch = product.shortDescription?.toLowerCase().includes(searchTerm);
            
            if (!nameMatch && !descMatch && !shortDescMatch) {
                return false;
            }
        }
        
        return true;
    });
    
    // Clear products container
    productsContainer.innerHTML = '';
    
    // Display message if no products found
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products-message">
                <p>没有找到符合条件的产品</p>
                <button class="btn btn-primary" id="reset-filters-btn">重置筛选条件</button>
            </div>
        `;
        
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                resetFilters(productType);
            });
        }
        
        return;
    }
    
    // Display products
    filteredProducts.forEach(product => {
        const productElement = createProductElement(product, productType);
        productsContainer.appendChild(productElement);
    });
    
    // Set up add to cart buttons
    setupAddToCartButtons();
}

/**
 * Create a product element for display
 * @param {Object} product - The product data
 * @param {string} productType - The product type (machines, consumables, spareParts)
 * @returns {HTMLElement} - The product element
 */
function createProductElement(product, productType) {
    const productElement = document.createElement('div');
    productElement.className = 'product-card';
    
    // Create HTML based on product type
    if (productType === 'machines') {
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-short-desc">${product.shortDescription}</p>
                <p class="product-description">${truncateText(product.description, 120)}</p>
                <div class="product-meta">
                    <div class="product-price">
                        ${product.originalPrice ? `<span class="original-price">${BJTUtils.formatCurrency(product.originalPrice)}</span>` : ''}
                        <span class="current-price">${BJTUtils.formatCurrency(product.price)}</span>
                    </div>
                    <a href="product-detail.html?id=${product.id}&type=${productType}" class="btn btn-primary">查看详情</a>
                </div>
            </div>
        `;
    } else if (productType === 'consumables') {
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-short-desc">${product.shortDescription}</p>
                <p><strong>料号:</strong> ${product.partNumber}</p>
                <p><strong>规格:</strong> ${product.specifications}</p>
                <div class="product-meta">
                    <div class="product-price">
                        <span class="current-price">${BJTUtils.formatCurrency(product.price)}</span>
                        <span class="price-tier">(${product.priceTiers[0].range})</span>
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" 
                        data-id="${product.id}" 
                        data-name="${product.name}" 
                        data-price="${product.price}"
                        data-image="${product.image}">
                        加入购物车
                    </button>
                </div>
            </div>
        `;
    } else if (productType === 'spareParts') {
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-short-desc">${product.shortDescription}</p>
                <p><strong>料号:</strong> ${product.partNumber}</p>
                <p><strong>适用型号:</strong> ${Array.isArray(product.compatibleModels) ? product.compatibleModels.join(', ') : product.compatibleModels}</p>
                <div class="product-meta">
                    <div class="product-price">
                        ${product.originalPrice ? `<span class="original-price">${BJTUtils.formatCurrency(product.originalPrice)}</span>` : ''}
                        <span class="current-price">${BJTUtils.formatCurrency(product.price)}</span>
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" 
                        data-id="${product.id}" 
                        data-name="${product.name}" 
                        data-price="${product.price}"
                        data-image="${product.image}">
                        加入购物车
                    </button>
                </div>
            </div>
        `;
    }
    
    return productElement;
}

/**
 * Set up add to cart buttons
 */
function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            const productName = this.dataset.name;
            const productPrice = parseFloat(this.dataset.price);
            const productImage = this.dataset.image;
            
            // Add product to cart
            BJTCart.addToCart({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });
        });
    });
}

/**
 * Truncate text to a specific length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} - The truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Load and display product details
 * @param {string} productId - The product ID
 * @param {string} productType - The product type
 */
function loadProductDetails(productId, productType) {
    loadProductData(function() {
        const product = findProductById(productId, productType);
        
        if (product) {
            displayProductDetails(product, productType);
        } else {
            // Product not found
            document.getElementById('product-details-container').innerHTML = `
                <div class="product-not-found">
                    <h2>产品未找到</h2>
                    <p>抱歉，无法找到指定的产品。</p>
                    <a href="products.html" class="btn btn-primary">返回产品列表</a>
                </div>
            `;
        }
    });
}

/**
 * Find a product by ID
 * @param {string} productId - The product ID
 * @param {string} productType - The product type
 * @returns {Object|null} - The product or null if not found
 */
function findProductById(productId, productType) {
    const products = productData[productType] || [];
    return products.find(product => product.id === productId) || null;
}

/**
 * Display product details
 * @param {Object} product - The product data
 * @param {string} productType - The product type
 */
function displayProductDetails(product, productType) {
    const detailsContainer = document.getElementById('product-details-container');
    if (!detailsContainer) return;
    
    let detailsHTML = `
        <div class="product-details">
            <div class="product-gallery">
                <img src="${product.image}" alt="${product.name}" class="product-main-image">
            </div>
            <div class="product-info-details">
                <h1>${product.name}</h1>
                <p class="product-sku">料号: ${product.partNumber || 'N/A'}</p>
                <p class="product-description">${product.description}</p>
    `;
    
    // Add type-specific details
    if (productType === 'machines') {
        detailsHTML += `
                <div class="product-features">
                    <h3>主要特点</h3>
                    <ul>
                        ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                <div class="product-specifications">
                    <h3>技术规格</h3>
                    <table class="specs-table">
                        <tr><td>尺寸:</td><td>${product.specifications.dimensions}</td></tr>
                        <tr><td>重量:</td><td>${product.specifications.weight}</td></tr>
                        <tr><td>电源:</td><td>${product.specifications.power}</td></tr>
                        <tr><td>输出:</td><td>${product.specifications.airOutput || product.specifications.paperOutput}</td></tr>
                        <tr><td>噪音级别:</td><td>${product.specifications.noiseLevel}</td></tr>
                    </table>
                </div>
        `;
    } else if (productType === 'consumables') {
        detailsHTML += `
                <div class="product-compatibility">
                    <h3>兼容机型</h3>
                    <p>${Array.isArray(product.compatibleModels) ? product.compatibleModels.join(', ') : product.compatibleModels}</p>
                </div>
                <div class="product-specifications">
                    <h3>规格参数</h3>
                    <table class="specs-table">
                        <tr><td>材质/类型:</td><td>${product.specifications}</td></tr>
                        <tr><td>厚度/克重:</td><td>${product.dimensions.thickness || product.dimensions.weight}</td></tr>
                        <tr><td>宽度:</td><td>${product.dimensions.width}</td></tr>
                        <tr><td>长度:</td><td>${product.dimensions.length}</td></tr>
                    </table>
                </div>
        `;
    } else if (productType === 'spareParts') {
        detailsHTML += `
                <div class="product-compatibility">
                    <h3>兼容机型</h3>
                    <p>${Array.isArray(product.compatibleModels) ? product.compatibleModels.join(', ') : product.compatibleModels}</p>
                </div>
                <div class="product-specifications">
                    <h3>规格参数</h3>
                    <table class="specs-table">
                        <tr><td>序列号范围:</td><td>${product.serialRange}</td></tr>
                        <tr><td>尺寸:</td><td>${product.dimensions}</td></tr>
                        <tr><td>重量:</td><td>${product.weight}</td></tr>
                        <tr><td>类型:</td><td>${product.type === 'spare' ? '备件' : '非耗材部件'}</td></tr>
                    </table>
                </div>
        `;
    }
    
    // Add price and add to cart button
    detailsHTML += `
                <div class="product-price-info">
                    ${product.originalPrice ? `<span class="product-original-price">${BJTUtils.formatCurrency(product.originalPrice)}</span>` : ''}
                    <span class="product-current-price">${BJTUtils.formatCurrency(product.price)}</span>
    `;
    
    // Add price tiers if available
    if (product.priceTiers) {
        detailsHTML += `
                    <div class="product-tiers">
                        价格阶梯: 
                        ${product.priceTiers.map(tier => 
                            `<span>${BJTUtils.formatCurrency(tier.price)} (${tier.range})</span>`
                        ).join(' | ')}
                    </div>
        `;
    }
    
    detailsHTML += `
                </div>
                <div class="product-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" id="decrease-quantity">-</button>
                        <input type="number" id="product-quantity" class="quantity-input" value="1" min="1">
                        <button class="quantity-btn" id="increase-quantity">+</button>
                    </div>
                    <button id="add-to-cart-btn" class="btn btn-primary">加入购物车</button>
                </div>
            </div>
        </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    
    // Set up quantity controls
    const quantityInput = document.getElementById('product-quantity');
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value) || 1;
            quantityInput.value = Math.max(1, currentValue - 1);
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value) || 1;
            quantityInput.value = currentValue + 1;
        });
    }
    
    // Set up add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const quantity = parseInt(quantityInput.value) || 1;
            
            // Calculate price based on quantity if price tiers exist
            let price = product.price;
            if (product.priceTiers) {
                price = BJTCart.calculateTieredPrice(product.priceTiers, quantity);
            }
            
            // Add product to cart
            BJTCart.addToCart({
                id: product.id,
                name: product.name,
                price: price,
                image: product.image,
                quantity: quantity
            });
        });
    }
}

// Export product functions for use in other files
window.BJTProducts = {
    initProducts,
    loadProductData,
    displayProducts,
    loadProductDetails,
    findProductById
}; 