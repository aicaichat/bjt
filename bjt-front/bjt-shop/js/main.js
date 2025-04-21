// 主JavaScript文件
document.addEventListener('DOMContentLoaded', () => {
    // 初始化路由
    if (typeof Router !== 'undefined') {
        Router.init();
    }
    
    // 初始化头部组件
    loadComponent('header', 'components/header.html').then(() => {
        // 在头部加载完成后初始化认证UI
        updateAuthUI();
        
        // 初始化主题切换器
        if (typeof ThemeSwitcher !== 'undefined') {
            ThemeSwitcher.init();
        }
    });
    
    // 初始化页脚组件
    loadComponent('footer', 'components/footer.html');
    
    // 初始化购物车
    initCart();
    
    // 初始化用户认证
    initAuth();
    
    // 初始化机器选择页面
    initMachinesPage();
});

// 加载组件
async function loadComponent(id, url) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = html;
                
                // 确保DOM更新完成
                setTimeout(() => {
                    // 在加载头部组件后初始化用户认证和主题切换器
                    if (id === 'header') {
                        console.log('Header loaded, initializing auth and theme');
                        
                        // 重新初始化认证状态
                        updateAuthUI();
                        
                        // 确保登录按钮有事件监听器
                        const loginBtn = document.querySelector('.login-btn');
                        if (loginBtn) {
                            console.log('Login button found, attaching event listener');
                            loginBtn.addEventListener('click', function() {
                                console.log('Login button clicked');
                                // 使用相对于当前位置的正确路径
                                if (window.location.pathname.includes('/pages/')) {
                                    window.location.href = 'login.html';
                                } else {
                                    window.location.href = 'pages/login.html';
                                }
                            });
                        } else {
                            console.warn('Login button not found in header');
                        }
                        
                        // 初始化主题切换器
                        if (typeof ThemeSwitcher !== 'undefined') {
                            ThemeSwitcher.init();
                        } else {
                            console.warn('ThemeSwitcher not available');
                        }
                    }
                    
                    resolve(element);
                }, 0);
            } else {
                console.warn(`Element with id '${id}' not found`);
                resolve(null);
            }
        } catch (error) {
            console.error(`加载组件 ${id} 错误:`, error);
            reject(error);
        }
    });
}

// 购物车功能
function initCart() {
    // 从本地存储加载购物车
    window.cart = JSON.parse(localStorage.getItem('bjt-cart') || '{"items":[],"total":0}');
    
    // 购物车事件监听器
    document.addEventListener('add-to-cart', (e) => {
        const item = e.detail;
        const existingItem = cart.items.find(i => i.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += (item.quantity || 1);
        } else {
            cart.items.push({...item, quantity: item.quantity || 1});
        }
        
        updateCartTotal();
        saveCart();
        updateCartUI();
        
        // 显示添加到购物车的通知
        showNotification(`成功添加 ${item.name} 到购物车`);
    });
    
    // 更新购物车UI
    updateCartUI();
}

// 更新购物车总计
function updateCartTotal() {
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// 保存购物车到本地存储
function saveCart() {
    localStorage.setItem('bjt-cart', JSON.stringify(cart));
}

// 更新购物车UI
function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'block' : 'none';
    }

    // 以下是购物车详情页面的元素，可能不在所有页面都存在
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // 如果购物车详情元素不存在，说明当前页面可能不是购物车页面，无需更新
    if (!cartItems || !cartTotal) {
        return;
    }
    
    if (cart.items.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-muted">购物车为空</p>';
        cartTotal.textContent = '¥0.00';
        return;
    }
    
    let html = '';
    let totalAmount = 0;
    
    cart.items.forEach(item => {
        html += `
            <div class="dropdown-item d-flex justify-content-between align-items-center py-2">
                <div>
                    <p class="mb-0 fw-bold">${item.name}</p>
                    <p class="mb-0 small text-muted">${item.quantity} × ¥${formatPrice(item.price)}</p>
                </div>
                <div class="ms-3 text-end">
                    <p class="mb-0 text-primary">¥${formatPrice(item.price * item.quantity)}</p>
                    <button class="btn btn-sm btn-link text-danger p-0 remove-cart-item" data-id="${item.id}">删除</button>
                </div>
            </div>
            <hr class="my-1">
        `;
        
        totalAmount += (item.price * item.quantity);
    });
    
    cartItems.innerHTML = html;
    cartTotal.textContent = `¥${formatPrice(totalAmount)}`;
    
    // 添加移除购物车项目的事件监听
    document.querySelectorAll('.remove-cart-item').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止点击事件冒泡
            const itemId = parseInt(this.getAttribute('data-id'));
            removeCartItem(itemId);
        });
    });
}

// 移除购物车项目
function removeCartItem(itemId) {
    if (!cart || !cart.items) {
        console.warn('Cart is not properly initialized');
        return;
    }
    
    const index = cart.items.findIndex(item => item.id === itemId);
    if (index === -1) return;
    
    cart.items.splice(index, 1);
    updateCartTotal();
    saveCart();
    updateCartUI();
    showToast('已从购物车中移除');
}

// 更新购物车项目数量
function updateCartItemQuantity(id, quantity) {
    const item = cart.items.find(item => item.id === id);
    if (item) {
        item.quantity = parseInt(quantity);
        if (item.quantity <= 0) {
            removeCartItem(id);
        } else {
            updateCartTotal();
            saveCart();
            updateCartUI();
            
            // 如果当前在购物车页面，更新页面
            if (window.location.pathname === '/cart') {
                const pageScript = document.getElementById('page-script');
                if (pageScript && typeof renderCart === 'function') {
                    renderCart();
                }
            }
        }
    }
}

// 清空购物车
function clearCart() {
    cart.items = [];
    cart.total = 0;
    saveCart();
    updateCartUI();
}

// 用户认证
function initAuth() {
    // 从本地存储加载用户信息
    window.user = JSON.parse(localStorage.getItem('bjt-user') || 'null');
    
    // 更新用户UI
    updateAuthUI();
    
    // 监听登录/登出事件
    document.addEventListener('login', (e) => {
        window.user = e.detail;
        localStorage.setItem('bjt-user', JSON.stringify(window.user));
        updateAuthUI();
        
        // 如果在登录页面，重定向到首页
        if (window.location.pathname === '/login') {
            Router.navigate('/');
        }
    });
    
    document.addEventListener('logout', () => {
        window.user = null;
        localStorage.removeItem('bjt-user');
        updateAuthUI();
        
        // 重定向到登录页面
        Router.navigate('/login');
    });
}

// 更新用户认证UI
function updateAuthUI() {
    const userDropdown = document.getElementById('user-dropdown');
    const userMenuName = document.getElementById('user-name');
    const loginButtons = document.querySelectorAll('.login-btn');
    const logoutLinks = document.querySelectorAll('#logout-link');
    
    if (window.user) {
        // 已登录状态
        if (userMenuName) {
            userMenuName.textContent = window.user.name || window.user.username;
        }
        
        // 显示用户下拉菜单，隐藏登录按钮
        if (userDropdown) {
            userDropdown.style.display = 'flex';
        }
        
        loginButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // 添加登出事件
        logoutLinks.forEach(link => {
            // 移除所有已有的事件监听器
            const newLink = link.cloneNode(true);
            if (link.parentNode) {
                link.parentNode.replaceChild(newLink, link);
            }
            
            // 添加新的事件监听器
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                // 清除用户数据
                window.user = null;
                localStorage.removeItem('bjt-user');
                
                // 更新UI
                updateAuthUI();
                
                // 提示用户
                showToast('您已成功退出登录');
                
                // 如果当前是需要登录的页面，则重定向到首页
                if (window.location.pathname.includes('orders') || 
                    window.location.pathname.includes('account')) {
                    window.location.href = 'index.html';
                }
            });
        });
    } else {
        // 未登录状态
        if (userMenuName) {
            userMenuName.textContent = '登录';
        }
        
        // 隐藏用户下拉菜单，显示登录按钮
        if (userDropdown) {
            userDropdown.style.display = 'none';
        }
        
        loginButtons.forEach(btn => {
            // 移除所有已有的事件监听器
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // 显示按钮并添加新的事件监听器
            newBtn.style.display = 'inline-block';
            newBtn.addEventListener('click', () => {
                console.log('Login button clicked'); // 调试用
                window.location.href = 'login.html';
            });
        });
    }
}

// 显示通知消息
function showNotification(message, type = 'success', duration = 3000) {
    // 查找或创建通知容器
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // 添加关闭按钮事件
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
}

// 表单验证
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
            
            // 添加错误消息
            let errorMsg = input.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                errorMsg = document.createElement('span');
                errorMsg.className = 'error-message';
                input.parentNode.insertBefore(errorMsg, input.nextElementSibling);
            }
            errorMsg.textContent = '此字段为必填项';
        } else {
            input.classList.remove('invalid');
            
            // 移除错误消息
            const errorMsg = input.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
        }
    });
    
    return isValid;
}

// 获取URL参数
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 格式化价格
function formatPrice(price) {
    return '¥' + parseFloat(price).toFixed(2);
}

// API请求
async function apiRequest(endpoint, method = 'GET', data = null) {
    const API_BASE_URL = '/api'; // API基础URL
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

/**
 * 机器配置页面功能
 */
function initMachinesPage() {
    if (!document.querySelector('.product-radio')) return;

    // 购物车功能
    setupCartFunctionality();
    
    // 初始化产品和配件选择逻辑
    initProductSelection();
    
    // 初始化模态框
    initModals();
}

/**
 * 初始化购物车功能
 */
function setupCartFunctionality() {
    // 购物车按钮点击事件
    const cartButton = document.querySelector('.floating-cart-button');
    const cartModal = document.getElementById('cart-modal');
    
    cartButton.addEventListener('click', () => {
        renderCartItems();
        cartModal.style.display = 'flex';
    });
    
    // 关闭购物车模态框
    const closeModal = document.querySelector('.close-modal');
    closeModal.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    // 清空购物车按钮
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const clearConfirm = document.getElementById('clear-confirm');
    
    clearCartBtn.addEventListener('click', () => {
        if (cart.items.length > 0) {
            clearConfirm.style.display = 'flex';
        } else {
            showToast('购物车已经是空的');
        }
    });
    
    // 清空购物车确认对话框
    const cancelClear = document.getElementById('cancel-clear');
    const confirmClear = document.getElementById('confirm-clear');
    
    cancelClear.addEventListener('click', () => {
        clearConfirm.style.display = 'none';
    });
    
    confirmClear.addEventListener('click', () => {
        cart.items = [];
        cart.total = 0;
        saveCart();
        updateCartUI();
        clearConfirm.style.display = 'none';
        showToast('购物车已清空');
    });
    
    // 结算按钮
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        if (cart.items.length > 0) {
            // 这里可以跳转到结算页面
            showToast('正在前往结算页面...');
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 1000);
        } else {
            showToast('购物车是空的，请先添加商品');
        }
    });
}

/**
 * 初始化产品选择逻辑
 */
function initProductSelection() {
    // 获取所有产品卡片的添加按钮
    const addButtons = document.querySelectorAll('.add-to-cart');
    
    addButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-id');
            const productName = productCard.querySelector('.product-title').textContent;
            const productPrice = parseFloat(productCard.querySelector('.product-price').getAttribute('data-price'));
            const productImage = productCard.querySelector('img').src;
            
            // 获取选择的配件
            const selectedAccessories = [];
            const accessoryContainers = productCard.querySelectorAll('.accessory-container');
            
            accessoryContainers.forEach(container => {
                if (container.style.display !== 'none') {
                    const accessorySelects = container.querySelectorAll('select');
                    
                    accessorySelects.forEach(select => {
                        if (select.value !== "none") {
                            const accessoryId = select.value;
                            const accessoryName = select.options[select.selectedIndex].text;
                            const accessoryPrice = parseFloat(select.options[select.selectedIndex].getAttribute('data-price') || 0);
                            
                            selectedAccessories.push({
                                id: accessoryId,
                                name: accessoryName,
                                price: accessoryPrice
                            });
                        }
                    });
                }
            });
            
            // 添加到购物车
            addToCart(productId, productName, productPrice, productImage, selectedAccessories);
        });
    });
    
    // 初始化配件选择器的变化
    initAccessorySelectionChanges();
}

// 初始化配件选择变化
function initAccessorySelectionChanges() {
    // 获取所有配件类型复选框
    const accessoryToggles = document.querySelectorAll('.accessory-toggle');
    
    accessoryToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const productCard = this.closest('.product-card');
            const accessoryType = this.getAttribute('data-type');
            const accessoryContainer = productCard.querySelector(`.accessory-container[data-type="${accessoryType}"]`);
            
            if (this.checked) {
                accessoryContainer.style.display = 'block';
            } else {
                accessoryContainer.style.display = 'none';
                
                // 重置该类型的所有配件选择
                const selects = accessoryContainer.querySelectorAll('select');
                selects.forEach(select => {
                    select.value = "none";
                });
            }
        });
    });
}

/**
 * 初始化模态框
 */
function initModals() {
    // 产品详情模态框
    const detailButtons = document.querySelectorAll('.view-details');
    const productModal = document.getElementById('product-modal');
    const closeDetailModal = productModal?.querySelector('.close-modal');
    
    if (productModal && closeDetailModal) {
        detailButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productId = productCard.getAttribute('data-id');
                const productName = productCard.querySelector('.product-title').textContent;
                const productPrice = productCard.querySelector('.product-price').textContent;
                const productDesc = productCard.getAttribute('data-description') || '暂无详细描述';
                const productImage = productCard.querySelector('img').src;
                
                // 填充产品详情
                productModal.querySelector('.modal-product-title').textContent = productName;
                productModal.querySelector('.modal-product-price').textContent = productPrice;
                productModal.querySelector('.modal-product-description').textContent = productDesc;
                productModal.querySelector('.modal-product-image').src = productImage;
                
                productModal.style.display = 'flex';
            });
        });
        
        // 关闭产品详情模态框
        closeDetailModal.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
        
        // 点击产品详情模态框外部关闭
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                productModal.style.display = 'none';
            }
        });
    }
}

/**
 * 添加商品到购物车
 * @param {string} id - 商品ID
 * @param {string} name - 商品名称
 * @param {number} price - 商品价格
 * @param {string} image - 商品图片
 * @param {Array} accessories - 配件列表
 */
function addToCart(id, name, price, image, accessories = []) {
    // 计算配件总价
    const accessoriesTotalPrice = accessories.reduce((total, accessory) => total + accessory.price, 0);
    
    // 检查是否已在购物车中
    const existingItemIndex = cart.items.findIndex(item => 
        item.id === id && 
        JSON.stringify(item.accessories.map(a => a.id).sort()) === 
        JSON.stringify(accessories.map(a => a.id).sort())
    );
    
    if (existingItemIndex !== -1) {
        // 商品已存在，增加数量
        cart.items[existingItemIndex].quantity += 1;
    } else {
        // 添加新商品
        cart.items.push({
            id,
            name,
            price,
            image,
            accessories,
            quantity: 1,
            totalPrice: price + accessoriesTotalPrice
        });
    }
    
    // 保存购物车到本地存储
    saveCart();
    
    // 更新购物车按钮
    updateCartButton();
    
    // 显示添加成功提示
    showToast('商品已添加到购物车');
}

// 渲染购物车项目
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.items.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">购物车是空的</div>';
        cartTotal.textContent = '0';
        return;
    }
    
    let totalPrice = 0;
    let cartItemsHTML = '';
    
    cart.items.forEach((item, index) => {
        const itemTotalPrice = item.totalPrice * item.quantity;
        totalPrice += itemTotalPrice;
        
        // 配件列表
        let accessoriesHTML = '';
        if (item.accessories && item.accessories.length > 0) {
            accessoriesHTML = '<div class="cart-item-accessories">';
            item.accessories.forEach(accessory => {
                accessoriesHTML += `<div class="cart-accessory">+ ${accessory.name} (¥${accessory.price.toFixed(2)})</div>`;
            });
            accessoriesHTML += '</div>';
        }
        
        cartItemsHTML += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name} x ${item.quantity}</div>
                    <div class="cart-item-price">¥${item.price.toFixed(2)}</div>
                    ${accessoriesHTML}
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-total">¥${itemTotalPrice.toFixed(2)}</div>
                    <button class="remove-item" data-index="${index}">删除</button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartItemsHTML;
    cartTotal.textContent = totalPrice.toFixed(2);
    
    // 添加删除按钮事件监听
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeCartItem(index);
        });
    });
}

// 更新购物车按钮
function updateCartButton() {
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) return;
    
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        cartCount.style.display = 'flex';
    } else {
        cartCount.style.display = 'none';
    }
}

// 显示提示
function showToast(message, type = 'info') {
    console.log(`Showing toast: "${message}" (${type})`);
    let toast = document.getElementById('toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
        
        // 添加样式
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '2000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-in-out';
        
        console.log('Created new toast element');
    }
    
    // 根据类型设置不同的颜色
    let bgColor;
    switch(type) {
        case 'success':
            bgColor = 'rgba(40, 167, 69, 0.9)';
            break;
        case 'warning':
            bgColor = 'rgba(255, 193, 7, 0.9)';
            break;
        case 'error':
            bgColor = 'rgba(220, 53, 69, 0.9)';
            break;
        default:
            bgColor = 'rgba(0, 123, 255, 0.9)';
    }
    
    toast.style.backgroundColor = bgColor;
    toast.style.color = type === 'warning' ? '#212529' : 'white';
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // 清除任何现有的超时
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    // 设置新的超时
    toast.timeoutId = setTimeout(() => {
        toast.style.opacity = '0';
        
        // 在动画完成后移除toast元素
        setTimeout(() => {
            if (toast && toast.parentNode) {
                try {
                    toast.parentNode.removeChild(toast);
                    console.log('Toast removed from DOM');
                } catch (e) {
                    console.error('Error removing toast:', e);
                }
            }
        }, 300);
    }, 3000);
}

// 模拟数据
const machines = [
    {
        id: 1,
        name: "CNC铣床 BLJ-M1000",
        price: 180000,
        image: "https://via.placeholder.com/500x300?text=BLJ-M1000",
        description: "高精度数控铣床，适用于复杂零件加工，配备FANUC控制系统，定位精度±0.005mm。",
        specs: {
            "工作台尺寸": "1200 × 500 mm",
            "主轴转速": "50-8000 rpm",
            "主轴功率": "11 kW",
            "行程 (X/Y/Z)": "1000/500/500 mm",
            "控制系统": "FANUC 0i-MF",
            "刀库容量": "24 把"
        }
    },
    {
        id: 2,
        name: "数控车床 BLJ-L800",
        price: 150000,
        image: "https://via.placeholder.com/500x300?text=BLJ-L800",
        description: "高速数控车床，适用于轴类零件加工，配备西门子控制系统，加工精度高，稳定性好。",
        specs: {
            "最大回转直径": "Ø500 mm",
            "最大加工长度": "800 mm",
            "主轴转速": "50-4000 rpm",
            "主轴功率": "15 kW",
            "控制系统": "SIEMENS 828D",
            "刀位数": "12 个"
        }
    },
    {
        id: 3,
        name: "精密磨床 BLJ-G600",
        price: 220000,
        image: "https://via.placeholder.com/500x300?text=BLJ-G600",
        description: "高精度磨床，适用于精密零件的最终加工，表面粗糙度可达Ra0.2，精度高。",
        specs: {
            "工作台尺寸": "600 × 300 mm",
            "磨削行程": "650 mm",
            "砂轮直径": "Ø350 mm",
            "砂轮宽度": "40 mm",
            "砂轮转速": "1450 rpm",
            "定位精度": "±0.001 mm"
        }
    },
    {
        id: 4,
        name: "加工中心 BLJ-V1200",
        price: 350000,
        image: "https://via.placeholder.com/500x300?text=BLJ-V1200",
        description: "立式加工中心，适用于模具加工，配备高速主轴，加工效率高，精度稳定。",
        specs: {
            "工作台尺寸": "1400 × 600 mm",
            "主轴转速": "50-12000 rpm",
            "主轴功率": "18.5 kW",
            "行程 (X/Y/Z)": "1200/600/600 mm",
            "控制系统": "FANUC 0i-MF",
            "刀库容量": "30 把"
        }
    }
];

// 配件数据
const accessories = {
    cooling: [
        { id: 101, name: "标准冷却系统", price: 5000, image: "https://via.placeholder.com/100?text=冷却系统", description: "标准循环冷却系统，适用于一般加工场景" },
        { id: 102, name: "高压冷却系统", price: 12000, image: "https://via.placeholder.com/100?text=高压冷却", description: "70bar高压冷却系统，适用于深孔加工" },
        { id: 103, name: "油雾冷却系统", price: 8000, image: "https://via.placeholder.com/100?text=油雾冷却", description: "最小量润滑系统，环保型冷却方案" }
    ],
    tools: [
        { id: 201, name: "基础刀具套装", price: 15000, image: "https://via.placeholder.com/100?text=基础刀具", description: "包含10把常用刀具，适合一般加工需求" },
        { id: 202, name: "高级刀具套装", price: 28000, image: "https://via.placeholder.com/100?text=高级刀具", description: "包含20把高精度刀具，适合精密加工" },
        { id: 203, name: "专用刀柄套装", price: 8500, image: "https://via.placeholder.com/100?text=刀柄", description: "热胀刀柄系统，提高加工精度" }
    ],
    measuring: [
        { id: 301, name: "触发式测头", price: 18000, image: "https://via.placeholder.com/100?text=测头", description: "RENISHAW触发式测头，用于工件定位和测量" },
        { id: 302, name: "刀具检测仪", price: 15000, image: "https://via.placeholder.com/100?text=刀检", description: "激光刀具检测仪，测量刀具长度和直径" },
        { id: 303, name: "在机检测软件", price: 12000, image: "https://via.placeholder.com/100?text=检测软件", description: "集成测量软件，支持自动化检测流程" }
    ],
    software: [
        { id: 401, name: "CAD/CAM软件", price: 35000, image: "https://via.placeholder.com/100?text=CAD/CAM", description: "专业CAD/CAM软件，支持复杂零件编程" },
        { id: 402, name: "远程监控系统", price: 18000, image: "https://via.placeholder.com/100?text=远程监控", description: "设备远程监控系统，实时了解设备状态" },
        { id: 403, name: "预防性维护系统", price: 20000, image: "https://via.placeholder.com/100?text=维护系统", description: "设备状态监测和预防性维护提醒系统" }
    ]
};

// 状态变量
let selectedMachine = null;
let selectedAccessories = [];
let cart = [];

// DOM元素
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 初始化路由
        if (typeof Router !== 'undefined') {
            Router.init();
        }
        
        // 初始化各模块
        try {
            // 初始化产品列表
            initProductList();
        } catch (e) {
            console.error('Error initializing product list:', e);
        }
        
        try {
            // 初始化配件标签页
            initAccessoryTabs();
        } catch (e) {
            console.error('Error initializing accessory tabs:', e);
        }
        
        try {
            // 初始化购物车控制
            initCartControls();
        } catch (e) {
            console.error('Error initializing cart controls:', e);
        }
        
        // 检查是否在登录页面
        if (window.location.pathname.includes('login.html')) {
            try {
                setupLoginForm();
            } catch (e) {
                console.error('Error setting up login form:', e);
            }
        }
        
        // 事件监听 - 添加null检查
        const backToMachinesBtn = document.getElementById('backToMachines');
        if (backToMachinesBtn) {
            backToMachinesBtn.addEventListener('click', showMachineList);
        }
        
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', addToCart);
        }
        
        const selectProductBtn = document.getElementById('selectProductBtn');
        if (selectProductBtn) {
            selectProductBtn.addEventListener('click', selectMachine);
        }
    } catch (e) {
        console.error('Error in page initialization:', e);
    }
});

// 设置登录表单处理
function setupLoginForm() {
    console.log('Setting up login form...');
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.warn('Login form not found on page');
        return;
    }
    
    console.log('Login form found, attaching submit event');
    
    // 移除旧的事件监听器（如果有）
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);
    
    // 添加新的事件监听器
    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        console.log(`Attempting login with username: ${username}`);
        
        if (!username || !password) {
            showToast('请输入用户名和密码', 'warning');
            return;
        }
        
        // 模拟登录 - 在真实环境中应该调用API
        const mockUsers = [
            { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
            { username: 'user', password: 'user123', name: '普通用户', role: 'user' }
        ];
        
        const user = mockUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
            // 登录成功
            console.log('Login successful for user:', user.username);
            const { password, ...userInfo } = user; // 移除密码
            
            // 保存用户信息
            localStorage.setItem('bjt-user', JSON.stringify(userInfo));
            window.user = userInfo;
            
            // 触发登录事件
            document.dispatchEvent(new CustomEvent('login', { detail: userInfo }));
            
            // 显示成功消息
            showToast('登录成功，欢迎回来！', 'success');
            
            // 跳转到首页或之前的页面
            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                if (redirect) {
                    console.log('Redirecting to:', redirect);
                    window.location.href = redirect;
                } else {
                    // Check if we're already in the pages directory
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/pages/')) {
                        console.log('Redirecting to: home.html');
                        window.location.href = 'home.html';
                    } else {
                        console.log('Redirecting to: pages/home.html');
                        window.location.href = 'pages/home.html';
                    }
                }
            }, 1000);
        } else {
            // 登录失败
            console.log('Login failed: invalid credentials');
            showToast('用户名或密码错误', 'error');
        }
    });
}

// 初始化产品列表
function initProductList() {
    const container = document.getElementById('productContainer');
    if (!container) {
        console.log('Product container not found, skipping product list initialization');
        return;
    }
    
    container.innerHTML = '';
    
    machines.forEach(machine => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-3 mb-4';
        card.innerHTML = `
            <div class="product-card">
                <img src="${machine.image}" class="card-img-top product-image" alt="${machine.name}">
                <div class="card-body">
                    <h5 class="card-title">${machine.name}</h5>
                    <p class="card-text text-muted">¥${formatPrice(machine.price)}</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary view-details" data-id="${machine.id}">查看详情</button>
                        <button class="btn btn-primary select-machine" data-id="${machine.id}">选择此机床</button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // 添加事件监听
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const machineId = parseInt(this.getAttribute('data-id'));
            showProductDetails(machineId);
        });
    });
    
    document.querySelectorAll('.select-machine').forEach(button => {
        button.addEventListener('click', function() {
            const machineId = parseInt(this.getAttribute('data-id'));
            selectAndNavigateToAccessories(machineId);
        });
    });
}

// 显示产品详情
function showProductDetails(machineId) {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    const modalBody = document.getElementById('productModalBody');
    let specsHtml = '';
    
    for (const [key, value] of Object.entries(machine.specs)) {
        specsHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
    }
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${machine.image}" class="img-fluid" alt="${machine.name}">
            </div>
            <div class="col-md-6">
                <h4>${machine.name}</h4>
                <p class="text-primary fw-bold">¥${formatPrice(machine.price)}</p>
                <p>${machine.description}</p>
                <h5 class="mt-3">技术参数</h5>
                <table class="table table-sm">
                    <tbody>${specsHtml}</tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('selectProductBtn').setAttribute('data-id', machine.id);
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// 选择机床并导航到配件选择
function selectAndNavigateToAccessories(machineId) {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    selectedMachine = machine;
    selectedAccessories = [];
    
    document.getElementById('selectedMachine').textContent = machine.name;
    document.getElementById('productContainer').classList.add('d-none');
    document.getElementById('accessorySection').classList.remove('d-none');
    
    // 默认显示第一个类别的配件
    document.querySelector('#accessoryTabs a.active').click();
}

// 选择模态框中的机床
function selectMachine() {
    const machineId = parseInt(document.getElementById('selectProductBtn').getAttribute('data-id'));
    
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    selectAndNavigateToAccessories(machineId);
}

// 初始化配件标签页
function initAccessoryTabs() {
    const tabs = document.querySelectorAll('#accessoryTabs a');
    if (tabs.length === 0) {
        console.log('Accessory tabs not found, skipping accessory tabs initialization');
        return;
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 更新活动标签
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应类别的配件
            const category = this.getAttribute('data-category');
            renderAccessories(category);
        });
    });
}

// 渲染配件列表
function renderAccessories(category) {
    const container = document.getElementById('accessoryItems');
    container.innerHTML = '';
    
    if (!accessories[category] || accessories[category].length === 0) {
        container.innerHTML = '<p class="text-center text-muted">此类别下暂无配件</p>';
        return;
    }
    
    accessories[category].forEach(accessory => {
        const isSelected = selectedAccessories.some(a => a.id === accessory.id);
        
        const item = document.createElement('div');
        item.className = `accessory-item ${isSelected ? 'selected' : ''}`;
        item.setAttribute('data-id', accessory.id);
        item.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${accessory.image}" class="img-fluid accessory-image" alt="${accessory.name}">
                </div>
                <div class="col-md-7">
                    <h5>${accessory.name}</h5>
                    <p class="mb-0">${accessory.description}</p>
                </div>
                <div class="col-md-3 text-end">
                    <p class="text-primary fw-bold mb-2">¥${formatPrice(accessory.price)}</p>
                    <button class="btn btn-sm ${isSelected ? 'btn-danger remove-accessory' : 'btn-outline-primary add-accessory'}">
                        ${isSelected ? '移除' : '添加'}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
    
    // 添加事件监听
    document.querySelectorAll('.add-accessory').forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.accessory-item');
            const accessoryId = parseInt(item.getAttribute('data-id'));
            addAccessory(accessoryId, category);
        });
    });
    
    document.querySelectorAll('.remove-accessory').forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.accessory-item');
            const accessoryId = parseInt(item.getAttribute('data-id'));
            removeAccessory(accessoryId);
        });
    });
}

// 添加配件
function addAccessory(accessoryId, category) {
    const accessory = accessories[category].find(a => a.id === accessoryId);
    if (!accessory) return;
    
    // 检查是否已添加
    if (!selectedAccessories.some(a => a.id === accessoryId)) {
        selectedAccessories.push({...accessory, category});
        renderAccessories(category);
        showToast(`已添加配件: ${accessory.name}`);
    }
}

// 移除配件
function removeAccessory(accessoryId) {
    const index = selectedAccessories.findIndex(a => a.id === accessoryId);
    if (index === -1) return;
    
    const removedAccessory = selectedAccessories[index];
    selectedAccessories.splice(index, 1);
    
    const activeTab = document.querySelector('#accessoryTabs a.active');
    renderAccessories(activeTab.getAttribute('data-category'));
    showToast(`已移除配件: ${removedAccessory.name}`);
}

// 显示机床列表
function showMachineList() {
    document.getElementById('productContainer').classList.remove('d-none');
    document.getElementById('accessorySection').classList.add('d-none');
    selectedMachine = null;
    selectedAccessories = [];
}

// 添加到购物车
function addToCart() {
    if (!selectedMachine) {
        showToast('请先选择一台机床', 'danger');
        return;
    }
    
    const cartItem = {
        id: Date.now(), // 生成唯一ID
        machine: selectedMachine,
        accessories: [...selectedAccessories],
        total: calculateTotal()
    };
    
    cart.push(cartItem);
    updateCartUI();
    showToast('已添加到购物车', 'success');
    
    // 返回机床列表
    showMachineList();
}

// 计算当前选择的总价
function calculateTotal() {
    let total = selectedMachine ? selectedMachine.price : 0;
    selectedAccessories.forEach(accessory => {
        total += accessory.price;
    });
    return total;
}

// 初始化购物车控制
function initCartControls() {
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // 检查元素是否存在再添加事件监听器
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            cart.items = [];
            cart.total = 0;
            saveCart();
            updateCartUI();
            showToast('购物车已清空');
        });
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (!cart.items || cart.items.length === 0) {
                showToast('购物车为空，请先添加商品', 'warning');
                return;
            }
            
            // 这里应该跳转到结算页面
            showToast('跳转到结算页面...', 'success');
        });
    }
}

/**
 * 初始化导航菜单
 */
function initNavigation() {
    console.log('Initializing navigation');
    
    // 处理移动端菜单切换
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            document.body.classList.toggle('mobile-menu-open');
        });
    }
    
    // 为移动端添加下拉菜单点击事件
    const dropdownLinks = document.querySelectorAll('.dropdown > .nav-link');
    if (dropdownLinks.length > 0) {
        console.log('Setting up dropdown menu interactions');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // 只在移动端触发
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const parent = this.parentElement;
                    // 切换当前dropdown的活动状态
                    parent.classList.toggle('active');
                    
                    // 关闭其他dropdown
                    dropdownLinks.forEach(otherLink => {
                        if (otherLink !== link) {
                            otherLink.parentElement.classList.remove('active');
                        }
                    });
                }
            });
        });
    }
}

/**
 * 检查用户是否登录
 * @returns {boolean} 是否已登录
 */
function isUserLoggedIn() {
    return localStorage.getItem('bjt-user') !== null;
}

/**
 * 添加产品链接点击事件，未登录时提示登录
 */
function setupProductLinks() {
    console.log('Setting up product links');
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // 检查登录状态
            if (!isUserLoggedIn()) {
                e.preventDefault();
                showLoginPrompt();
            }
        });
    });
}

/**
 * 显示登录提示并跳转到登录页面
 */
function showLoginPrompt() {
    if (typeof showNotification === 'function') {
        showNotification('请先登录以访问产品信息', 'warning');
        
        // 延迟后跳转到登录页面
        setTimeout(() => {
            const currentPath = window.location.pathname;
            // 根据当前路径决定登录页面的相对路径
            const loginPath = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        }, 2000);
    } else {
        alert('请先登录以访问此内容');
        const currentPath = window.location.pathname;
        const loginPath = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
        window.location.href = loginPath;
    }
}

/**
 * 语言切换功能
 */
function setupLanguageSelector() {
    console.log('Setting up language selector');
    const languageSelect = document.querySelector('.language-select');
    if (languageSelect) {
        // 设置保存的语言
        const savedLanguage = localStorage.getItem('bjt-language');
        if (savedLanguage) {
            languageSelect.value = savedLanguage;
        }
        
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            localStorage.setItem('bjt-language', selectedLanguage);
            
            // 显示语言切换通知
            if (typeof showNotification === 'function') {
                const languageNames = {
                    'en': 'English',
                    'zh': '中文',
                    'ja': '日本語',
                    'ko': '한국어',
                    'de': 'Deutsch',
                    'fr': 'Français',
                    'es': 'Español'
                };
                showNotification(`语言已更改为 ${languageNames[selectedLanguage]}`, 'success');
            }
            
            // 此处可以添加实际语言切换逻辑
        });
    }
}

/**
 * 在DOM加载完毕后初始化所有功能
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // 加载页面组件
    loadPageComponents().then(() => {
        // 在组件加载完成后初始化功能
        // 初始化主题切换器
        if (typeof ThemeSwitcher !== 'undefined') {
            ThemeSwitcher.init();
        }
        
        // 初始化导航
        initNavigation();
        
        // 设置产品链接
        setupProductLinks();
        
        // 设置语言选择器
        setupLanguageSelector();
        
        // 初始化登录按钮
        setupLoginButton();
    });
});

/**
 * 设置登录按钮事件
 */
function setupLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // 根据当前路径决定登录页面的相对路径
            const currentPath = window.location.pathname;
            const loginPath = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        });
    }
}

/**
 * 加载页面组件（头部和页脚）
 * @returns {Promise} 组件加载完成的Promise
 */
function loadPageComponents() {
    return new Promise((resolve) => {
        const promises = [];
        
        // 如果DOM中没有自定义的header/footer内容，则加载组件
        if (document.getElementById('header') && document.getElementById('header').children.length === 0) {
            promises.push(loadComponent('header', 'header'));
        }
        
        if (document.getElementById('footer') && document.getElementById('footer').children.length === 0) {
            promises.push(loadComponent('footer', 'footer'));
        }
        
        // 所有组件加载完成后执行回调
        if (promises.length > 0) {
            Promise.all(promises).then(() => {
                console.log('All components loaded');
                resolve();
            }).catch(error => {
                console.error('Error loading components:', error);
                resolve(); // 即使出错也继续执行
            });
        } else {
            resolve(); // 如果没有需要加载的组件，直接返回
        }
    });
} 