/**
 * BJT Shop Application
 * Main application entry point
 */

// Main application object
const BJTApp = {
    // Initialize the application
    init: function() {
        console.log('BJT Shop Application Initializing...');
        
        // Load components (header, footer, cart, etc.)
        this.loadComponents();
        
        // Initialize utilities
        this.initializeUtils();
        
        // Initialize page-specific functionality
        this.initializePage();
        
        console.log('BJT Shop Application Initialized');
    },
    
    // Load components into the page
    loadComponents: function() {
        // Header component
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            BJTUtils.loadComponent('../components/header.html', 'header-container', function() {
                // Initialize header functionality after loading
                BJTUtils.updateUserUI();
                BJTUtils.setupLanguageSelector();
                BJTUtils.setActiveNavLink();
            });
        }
        
        // Footer component
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            BJTUtils.loadComponent('../components/footer.html', 'footer-container');
        }
        
        // Cart component
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            BJTUtils.loadComponent('../components/cart.html', 'cart-container', function() {
                // Initialize cart functionality after loading
                BJTCart.initCart();
            });
        }
    },
    
    // Initialize utility functions
    initializeUtils: function() {
        // Set up any global event listeners
        window.addEventListener('storage', function(event) {
            // React to localStorage changes from other tabs
            if (event.key === 'bjt_cart') {
                BJTCart.initCart();
            } else if (event.key === 'bjt_user_data') {
                BJTUtils.updateUserUI();
            } else if (event.key === 'bjt_language') {
                BJTUtils.setupLanguageSelector();
            }
        });
    },
    
    // Initialize page-specific functionality
    initializePage: function() {
        // Get current page from URL
        const path = window.location.pathname;
        const page = path.split('/').pop();
        
        // Initialize based on page
        switch (page) {
            case '':
            case 'index.html':
                this.initHomePage();
                break;
            case 'login.html':
                this.initLoginPage();
                break;
            case 'products.html':
                this.initProductsPage();
                break;
            case 'consumables.html':
                this.initConsumablesPage();
                break;
            case 'spare-parts.html':
                this.initSparePartsPage();
                break;
            case 'product-detail.html':
                this.initProductDetailPage();
                break;
            case 'checkout.html':
                this.initCheckoutPage();
                break;
            case 'orders.html':
                this.initOrdersPage();
                break;
            default:
                // Generic initialization
                break;
        }
    },
    
    // Home page initialization
    initHomePage: function() {
        console.log('Initializing Home Page');
        // Featured products
        const featuredProductsContainer = document.getElementById('featured-products');
        if (featuredProductsContainer) {
            BJTProducts.loadProductData(function() {
                // Get 4 featured products (2 machines, 2 consumables)
                const featuredMachines = BJTProducts.productData.machines.slice(0, 2);
                const featuredConsumables = BJTProducts.productData.consumables.slice(0, 2);
                
                const featuredHTML = `
                    <div class="row">
                        ${featuredMachines.map(product => `
                            <div class="col col-sm-6 col-lg-3">
                                <div class="product-card">
                                    <img src="${product.image}" alt="${product.name}" class="product-image">
                                    <div class="product-info">
                                        <h3 class="product-title">${product.name}</h3>
                                        <p class="product-short-desc">${product.shortDescription}</p>
                                        <div class="product-meta">
                                            <div class="product-price">
                                                <span class="current-price">${BJTUtils.formatCurrency(product.price)}</span>
                                            </div>
                                            <a href="product-detail.html?id=${product.id}&type=machines" class="btn btn-primary">查看详情</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${featuredConsumables.map(product => `
                            <div class="col col-sm-6 col-lg-3">
                                <div class="product-card">
                                    <img src="${product.image}" alt="${product.name}" class="product-image">
                                    <div class="product-info">
                                        <h3 class="product-title">${product.name}</h3>
                                        <p class="product-short-desc">${product.shortDescription}</p>
                                        <div class="product-meta">
                                            <div class="product-price">
                                                <span class="current-price">${BJTUtils.formatCurrency(product.price)}</span>
                                            </div>
                                            <a href="product-detail.html?id=${product.id}&type=consumables" class="btn btn-primary">查看详情</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                featuredProductsContainer.innerHTML = featuredHTML;
            });
        }
    },
    
    // Login page initialization
    initLoginPage: function() {
        console.log('Initializing Login Page');
        // Initialize authentication
        BJTAuth.initAuth();
    },
    
    // Products page initialization
    initProductsPage: function() {
        console.log('Initializing Products Page');
        // Initialize products
        BJTProducts.initProducts('machines');
    },
    
    // Consumables page initialization
    initConsumablesPage: function() {
        console.log('Initializing Consumables Page');
        // Initialize consumables
        BJTProducts.initProducts('consumables');
    },
    
    // Spare parts page initialization
    initSparePartsPage: function() {
        console.log('Initializing Spare Parts Page');
        // Initialize spare parts
        BJTProducts.initProducts('spareParts');
        
        // Check if user is logged in
        if (!BJTUtils.requireLogin()) {
            return;
        }
    },
    
    // Product detail page initialization
    initProductDetailPage: function() {
        console.log('Initializing Product Detail Page');
        
        // Get product ID and type from URL parameters
        const productId = BJTUtils.getUrlParam('id');
        const productType = BJTUtils.getUrlParam('type');
        
        if (productId && productType) {
            // Load and display product details
            BJTProducts.loadProductDetails(productId, productType);
        } else {
            // Missing parameters
            document.getElementById('product-details-container').innerHTML = `
                <div class="product-not-found">
                    <h2>产品未找到</h2>
                    <p>缺少必要的产品参数</p>
                    <a href="products.html" class="btn btn-primary">返回产品列表</a>
                </div>
            `;
        }
    },
    
    // Checkout page initialization
    initCheckoutPage: function() {
        console.log('Initializing Checkout Page');
        
        // Check if user is logged in
        if (!BJTUtils.requireLogin()) {
            return;
        }
        
        // Load cart for checkout
        const checkoutItemsContainer = document.getElementById('checkout-items');
        const checkoutTotalElement = document.getElementById('checkout-total');
        
        if (checkoutItemsContainer && checkoutTotalElement) {
            const cart = BJTCart.getCart();
            
            if (cart.length === 0) {
                // Empty cart
                checkoutItemsContainer.innerHTML = `
                    <div class="empty-cart-message">
                        <p>购物车为空，无法结算</p>
                        <a href="products.html" class="btn btn-primary">浏览产品</a>
                    </div>
                `;
                return;
            }
            
            // Display checkout items
            let checkoutHTML = '';
            let total = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                
                checkoutHTML += `
                    <div class="checkout-item">
                        <div class="checkout-item-info">
                            <img src="${item.image}" alt="${item.name}" class="checkout-item-image">
                            <div>
                                <div class="checkout-item-name">${item.name}</div>
                                <div class="checkout-item-price">${BJTUtils.formatCurrency(item.price)} × ${item.quantity}</div>
                            </div>
                        </div>
                        <div class="checkout-item-total">${BJTUtils.formatCurrency(itemTotal)}</div>
                    </div>
                `;
            });
            
            checkoutItemsContainer.innerHTML = checkoutHTML;
            checkoutTotalElement.textContent = BJTUtils.formatCurrency(total);
            
            // Set up checkout form submission
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm) {
                checkoutForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // In a real application, this would submit the order to a server
                    // For demo purposes, just show a success message and clear the cart
                    
                    // Get form data
                    const formData = new FormData(this);
                    const orderData = {
                        name: formData.get('name'),
                        email: formData.get('email'),
                        address: formData.get('address'),
                        city: formData.get('city'),
                        country: formData.get('country'),
                        zipCode: formData.get('zip'),
                        paymentMethod: formData.get('payment-method'),
                        items: BJTCart.getCart(),
                        total: total,
                        date: new Date().toISOString()
                    };
                    
                    // Save order to localStorage
                    saveOrder(orderData);
                    
                    // Clear cart
                    BJTCart.clearCart();
                    
                    // Show success message
                    BJTUtils.showNotification('订单已提交成功！');
                    
                    // Redirect to orders page
                    setTimeout(() => {
                        window.location.href = 'orders.html';
                    }, 1500);
                });
            }
        }
    },
    
    // Orders page initialization
    initOrdersPage: function() {
        console.log('Initializing Orders Page');
        
        // Check if user is logged in
        if (!BJTUtils.requireLogin()) {
            return;
        }
        
        // Load and display orders
        const ordersContainer = document.getElementById('orders-container');
        if (ordersContainer) {
            const orders = getOrders();
            
            if (orders.length === 0) {
                // No orders
                ordersContainer.innerHTML = `
                    <div class="no-orders-message">
                        <p>您还没有任何订单</p>
                        <a href="products.html" class="btn btn-primary">浏览产品</a>
                    </div>
                `;
                return;
            }
            
            // Display orders
            let ordersHTML = '';
            
            orders.forEach((order, index) => {
                const orderDate = new Date(order.date).toLocaleDateString('zh-CN');
                const orderItems = order.items.map(item => item.name).join(', ');
                
                ordersHTML += `
                    <div class="order-card">
                        <div class="order-header">
                            <div class="order-number">订单 #${orders.length - index}</div>
                            <div class="order-date">${orderDate}</div>
                        </div>
                        <div class="order-content">
                            <div class="order-items">${orderItems}</div>
                            <div class="order-total">${BJTUtils.formatCurrency(order.total)}</div>
                        </div>
                        <div class="order-footer">
                            <button class="btn btn-secondary order-detail-btn" data-index="${index}">查看详情</button>
                        </div>
                    </div>
                `;
            });
            
            ordersContainer.innerHTML = ordersHTML;
            
            // Set up order detail buttons
            const orderDetailButtons = document.querySelectorAll('.order-detail-btn');
            orderDetailButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const orderIndex = parseInt(this.dataset.index);
                    displayOrderDetails(orders[orderIndex]);
                });
            });
        }
    }
};

// Helper function to save an order to localStorage
function saveOrder(orderData) {
    // Get existing orders
    const orders = getOrders();
    
    // Add new order
    orders.unshift(orderData);
    
    // Save to localStorage
    localStorage.setItem('bjt_orders', JSON.stringify(orders));
}

// Helper function to get orders from localStorage
function getOrders() {
    const ordersData = localStorage.getItem('bjt_orders');
    return ordersData ? JSON.parse(ordersData) : [];
}

// Helper function to display order details
function displayOrderDetails(order) {
    // Create and show modal
    const modalHTML = `
        <div class="modal" id="order-detail-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>订单详情</h3>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="order-customer-info">
                        <h4>客户信息</h4>
                        <p><strong>姓名:</strong> ${order.name}</p>
                        <p><strong>邮箱:</strong> ${order.email}</p>
                        <p><strong>地址:</strong> ${order.address}, ${order.city}, ${order.country} ${order.zipCode}</p>
                        <p><strong>支付方式:</strong> ${order.paymentMethod}</p>
                    </div>
                    
                    <div class="order-items-list">
                        <h4>订单商品</h4>
                        <table class="order-items-table">
                            <thead>
                                <tr>
                                    <th>商品</th>
                                    <th>数量</th>
                                    <th>单价</th>
                                    <th>小计</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>${BJTUtils.formatCurrency(item.price)}</td>
                                        <td>${BJTUtils.formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" class="text-right"><strong>总计:</strong></td>
                                    <td><strong>${BJTUtils.formatCurrency(order.total)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="close-modal-btn">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);
    
    // Show modal
    const modal = document.getElementById('order-detail-modal');
    modal.style.display = 'block';
    
    // Set up close button and click outside
    const closeBtn = modal.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    closeModalBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    BJTApp.init();
}); 