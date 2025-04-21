/**
 * BJT Shop - Utility Functions
 * Contains reusable utility functions used across the application
 */

/**
 * Load HTML content into a DOM element
 * @param {string} url - The URL of the HTML to load
 * @param {string} elementId - The ID of the element to load the HTML into
 * @param {function} callback - Optional callback function to execute after loading
 */
function loadComponent(url, elementId, callback) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (callback && typeof callback === 'function') {
                callback();
            }
        })
        .catch(error => {
            console.error('Error loading component:', error);
        });
}

/**
 * Format currency with the specified locale and currency
 * @param {number} amount - The amount to format
 * @param {string} locale - The locale to use (default: 'zh-CN')
 * @param {string} currency - The currency to use (default: 'CNY')
 * @returns {string} - The formatted currency string
 */
function formatCurrency(amount, locale = 'zh-CN', currency = 'CNY') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Get URL parameter value by name
 * @param {string} name - The name of the parameter
 * @returns {string|null} - The parameter value or null if not found
 */
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Set the active navigation link based on the current page
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop();
    
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Set active class based on filename
    if (filename === '' || filename === 'index.html') {
        document.getElementById('nav-home')?.classList.add('active');
    } else if (filename === 'products.html') {
        document.getElementById('nav-products')?.classList.add('active');
    } else if (filename === 'consumables.html') {
        document.getElementById('nav-consumables')?.classList.add('active');
    } else if (filename === 'spare-parts.html') {
        document.getElementById('nav-spare-parts')?.classList.add('active');
    } else if (filename === 'orders.html') {
        document.getElementById('nav-orders')?.classList.add('active');
    }
}

/**
 * Show a notification message
 * @param {string} message - The message to show
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (!notification || !notificationMessage) {
        return;
    }
    
    notificationMessage.textContent = message;
    notification.style.display = 'block';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, duration);
}

/**
 * Debounce function to limit how often a function can be called
 * @param {function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Set up language selector functionality
 */
function setupLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    if (!languageSelect) return;
    
    // Set the current language from localStorage or default to 'zh'
    const currentLanguage = localStorage.getItem('bjt_language') || 'zh';
    languageSelect.value = currentLanguage;
    
    // Listen for changes
    languageSelect.addEventListener('change', function() {
        const selectedLanguage = this.value;
        localStorage.setItem('bjt_language', selectedLanguage);
        
        // For now, just reload the page. In a real app, this would switch the language
        showNotification(`语言已更改为: ${selectedLanguage}`);
    });
}

/**
 * Initialize the page with common functionality
 */
function initPage() {
    // Set active navigation link
    setActiveNavLink();
    
    // Set up language selector
    setupLanguageSelector();
    
    // Check if user is logged in
    updateUserUI();
}

/**
 * Update UI based on user login status
 */
function updateUserUI() {
    const userDropdown = document.getElementById('user-dropdown');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const logoutLink = document.getElementById('logout-link');
    
    if (!userDropdown || !userName) return;
    
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('bjt_user_data') || 'null');
    
    if (userData) {
        // User is logged in
        userName.textContent = userData.name || userData.username;
        if (userAvatar) {
            userAvatar.src = userData.avatar || '../images/user-avatar.jpg';
        }
        
        // Set up logout functionality
        if (logoutLink) {
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('bjt_user_data');
                showNotification('您已成功退出登录');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            });
        }
    } else {
        // User is not logged in
        userName.textContent = '登录';
        userName.parentElement.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
        
        // Hide dropdown content if not logged in
        const dropdownContent = userDropdown.querySelector('.dropdown-content');
        if (dropdownContent) {
            dropdownContent.style.display = 'none';
        }
    }
}

/**
 * Check if user is logged in, redirect to login page if not
 * @returns {boolean} - Whether the user is logged in
 */
function requireLogin() {
    const userData = JSON.parse(localStorage.getItem('bjt_user_data') || 'null');
    if (!userData) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }
    return true;
}

/**
 * 实用工具函数
 */

// Format price for display with currency symbol
function formatPrice(price, locale = 'zh-CN', currency = 'CNY') {
    if (price === undefined || price === null) return '';
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

// Create HTML for star ratings
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// Create HTML for pagination
function createPagination(currentPage, totalPages, baseUrl) {
    if (totalPages <= 1) return '';
    
    let paginationHtml = '<ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="${baseUrl}?page=${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="${baseUrl}?page=${i}">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="${baseUrl}?page=${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    paginationHtml += '</ul>';
    
    return paginationHtml;
}

// Show notification toast
function showNotification(message, type = 'success', duration = 3000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(toast => {
        document.body.removeChild(toast);
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Generate options for a select element based on quantity tiers
function generateQuantityOptions(inventoryCount, maxOptions = 10) {
    const options = [];
    
    // Default to 10 options if inventory is high enough
    const maxQty = inventoryCount ? Math.min(inventoryCount, maxOptions) : maxOptions;
    
    for (let i = 1; i <= maxQty; i++) {
        options.push(`<option value="${i}">${i}</option>`);
    }
    
    return options.join('');
}

// Get URL parameters as an object
function getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    
    return params;
}

// Update URL with new parameters without reloading page
function updateUrlParams(params) {
    const url = new URL(window.location);
    
    // Remove all existing parameters
    url.search = '';
    
    // Add new parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });
    
    // Update URL without reloading
    window.history.pushState({}, '', url);
}

// Check if user is logged in
function isUserLoggedIn() {
    const userInfo = localStorage.getItem('userInfo');
    return !!userInfo;
}

// Get user info from localStorage
function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// Check if current user has specified role
function hasUserRole(role) {
    const userInfo = getUserInfo();
    return userInfo && userInfo.role === role;
}

// Get compatible products for a machine
function getCompatibleProducts(machineId, productType) {
    return new Promise((resolve, reject) => {
        // In a real application, this would be an API call
        // For demo purposes, we're using localStorage as a cache
        const cacheKey = `compatibleProducts_${machineId}_${productType}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            resolve(JSON.parse(cachedData));
            return;
        }
        
        // Simulate API call
        fetch(`/api/products/compatible?machineId=${machineId}&type=${productType}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch compatible products');
                }
                return response.json();
            })
            .then(data => {
                // Cache the result
                localStorage.setItem(cacheKey, JSON.stringify(data));
                resolve(data);
            })
            .catch(error => {
                console.error('Error fetching compatible products:', error);
                reject(error);
            });
    });
}

// Calculate tiered price based on quantity
function calculateTieredPrice(product, quantity) {
    if (!product.priceTiers || product.priceTiers.length === 0) {
        return product.price * quantity;
    }
    
    // Sort tiers by minQuantity in descending order
    const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    
    // Find the applicable tier
    for (const tier of sortedTiers) {
        if (quantity >= tier.minQuantity) {
            return tier.price * quantity;
        }
    }
    
    // Default to base price if no tier matches
    return product.price * quantity;
}

// Export utility functions
window.utils = {
    formatPrice,
    createStarRating,
    createPagination,
    showNotification,
    generateQuantityOptions,
    getUrlParams,
    updateUrlParams,
    loadComponent,
    isUserLoggedIn,
    getUserInfo,
    hasUserRole,
    getCompatibleProducts,
    calculateTieredPrice
};

// Export functions for use in other files
window.BJTUtils = {
    loadComponent,
    formatCurrency,
    getUrlParam,
    setActiveNavLink,
    showNotification,
    debounce,
    setupLanguageSelector,
    initPage,
    updateUserUI,
    requireLogin
};

// 导出工具函数
window.formatPrice = formatPrice;
window.createStarRating = createStarRating;
window.createPagination = createPagination;
window.showNotification = showNotification;
window.generateQuantityOptions = generateQuantityOptions;
window.getUrlParams = getUrlParams;
window.updateUrlParams = updateUrlParams;
window.isUserLoggedIn = isUserLoggedIn;
window.getUserInfo = getUserInfo;
window.hasUserRole = hasUserRole;
window.getCompatibleProducts = getCompatibleProducts;
window.calculateTieredPrice = calculateTieredPrice; 