<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="container">
    <div class="product-section">
        <?php
        $product_lines = BJT_Product_Line_Management::get_instance()->get_all_product_lines();
        foreach ($product_lines as $line) {
            ?>
            <div class="section-header">
                <?php echo esc_html($line['title_' . get_locale()]); ?>
            </div>
            <div class="section-content">
                <div class="section-text">
                    <p class="introduction"><?php echo esc_html($line['description_' . get_locale()]); ?></p>
                    <div class="divider"></div>
                    <p><?php echo esc_html($line['subitem1_' . get_locale()]); ?></p>
                    
                    <div class="product-links">
                        <?php
                        $hosts = BJT_Host_Management::get_instance()->get_hosts_by_product_line($line['id']);
                        foreach ($hosts as $host) {
                            ?>
                            <a href="#" class="product-link" data-host-id="<?php echo esc_attr($host['id']); ?>">
                                <?php echo esc_html($host['title_' . get_locale()]); ?>
                            </a>
                            <?php
                        }
                        ?>
                    </div>
                </div>
                <div class="section-image">
                    <img src="<?php echo esc_url($line['image_url']); ?>" alt="<?php echo esc_attr($line['title_' . get_locale()]); ?>">
                </div>
            </div>
            <?php
        }
        ?>
    </div>
</div>

<script>
// 购物车管理
let cart = {
    items: [],
    requiredParts: new Map(), // 存储必选备件信息

    // 添加主机到购物车
    addMachine: function(productName, price, specs) {
        this.addToCart(productName, price, 'machine', specs);
    },

    // 添加配件到购物车
    addAccessory: async function(productName, price, specs) {
        // 先添加配件本身
        this.addToCart(productName, price, 'accessory', specs);
        
        // 获取并添加必选备件
        try {
            const response = await fetch('/wp-json/bjt-product/v1/required-parts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>'
                },
                body: JSON.stringify({
                    model: selectedModel, // 全局变量，存储当前选择的主机型号
                    accessory_part_number: productName
                })
            });

            if (response.ok) {
                const requiredParts = await response.json();
                if (requiredParts.success && requiredParts.data.length > 0) {
                    // 存储必选备件信息
                    this.requiredParts.set(productName, requiredParts.data);
                    
                    // 自动添加必选备件到购物车
                    requiredParts.data.forEach(part => {
                        this.addToCart(
                            part.required_part_number,
                            part.price,
                            'spare_part',
                            {
                                name_cn: part.name_cn,
                                name_en: part.name_en,
                                quantity: part.quantity,
                                parent_accessory: productName
                            }
                        );
                    });

                    // 显示提示信息
                    showToast(`已自动添加 ${requiredParts.data.length} 个必选备件`);
                }
            }
        } catch (error) {
            console.error('Error fetching required parts:', error);
        }
    },

    // 基础添加到购物车方法
    addToCart: function(productName, price, type, specs) {
        const quantityInput = event.target.previousElementSibling;
        const quantity = parseInt(quantityInput.value);
        
        if (quantity > 0) {
            // 检查是否已存在
            const existingItem = this.items.find(item => 
                item.name === productName && 
                (!specs.parent_accessory || item.specs.parent_accessory === specs.parent_accessory)
            );
            
            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.subtotal = existingItem.quantity * existingItem.price;
            } else {
                this.items.push({
                    name: productName,
                    price: price,
                    quantity: quantity,
                    subtotal: price * quantity,
                    type: type,
                    specs: specs
                });
            }
            
            this.updateDisplay();
            this.saveToLocalStorage();
            
            // 显示添加成功提示
            showToast(`${quantity} x ${productName} 已添加到购物车`);
            
            quantityInput.value = 1;
        }
    },

    // 从购物车移除商品
    removeFromCart: function(index) {
        const item = this.items[index];
        
        // 如果是配件，同时移除其必选备件
        if (item.type === 'accessory') {
            const requiredParts = this.requiredParts.get(item.name);
            if (requiredParts) {
                // 移除所有关联的必选备件
                this.items = this.items.filter(cartItem => 
                    !(cartItem.type === 'spare_part' && 
                      cartItem.specs.parent_accessory === item.name)
                );
            }
        }
        
        // 移除商品本身
        this.items.splice(index, 1);
        
        this.updateDisplay();
        this.saveToLocalStorage();
    },

    // 更新购物车显示
    updateDisplay: function() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountDisplay = document.getElementById('cartCount');
        const cartTotalDisplay = document.getElementById('cart-total');
        
        // 更新购物车计数
        const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        cartCountDisplay.textContent = totalItems;
        
        // 更新总金额
        const total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        
        // 清空并重新渲染购物车内容
        cartItemsContainer.innerHTML = '';
        
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty">购物车为空</div>';
            return;
        }

        // 分类显示
        const categories = {
            machine: { title: '主机产品', items: [] },
            accessory: { title: '配件产品', items: [] },
            spare_part: { title: '备件', items: [] }
        };

        // 对商品进行分类
        this.items.forEach((item, index) => {
            categories[item.type].items.push({...item, index});
        });

        // 渲染各分类
        Object.values(categories).forEach(category => {
            if (category.items.length > 0) {
                // 添加分类标题
                const titleDiv = document.createElement('div');
                titleDiv.className = 'cart-category-title';
                titleDiv.textContent = category.title;
                cartItemsContainer.appendChild(titleDiv);

                // 添加该分类的商品
                category.items.forEach(item => {
                    this.renderCartItem(cartItemsContainer, item);
                });
            }
        });

        // 添加总计
        const totalDiv = document.createElement('div');
        totalDiv.className = 'cart-total';
        totalDiv.innerHTML = `
            <span>总计:</span>
            <span>¥${total.toLocaleString()}</span>
        `;
        cartItemsContainer.appendChild(totalDiv);
    },

    // 渲染购物车单个商品
    renderCartItem: function(container, item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        
        // 添加必选备件标记
        const requiredBadge = item.type === 'spare_part' && item.specs.parent_accessory
            ? '<span class="required-badge">必选</span>'
            : '';

        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">
                    ${item.name} ${requiredBadge}
                    ${item.specs.parent_accessory ? 
                        `<span class="parent-accessory">配套${item.specs.parent_accessory}</span>` : 
                        ''}
                </div>
                <div class="cart-item-price">
                    ¥${item.price} × ${item.quantity} = ¥${item.subtotal}
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="cart-item-decrease">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button class="cart-item-increase">+</button>
                <button class="cart-item-remove">删除</button>
            </div>
        `;

        // 添加事件监听器
        const decreaseBtn = itemDiv.querySelector('.cart-item-decrease');
        const increaseBtn = itemDiv.querySelector('.cart-item-increase');
        const removeBtn = itemDiv.querySelector('.cart-item-remove');

        decreaseBtn.addEventListener('click', () => this.updateItemQuantity(item.index, -1));
        increaseBtn.addEventListener('click', () => this.updateItemQuantity(item.index, 1));
        removeBtn.addEventListener('click', () => this.removeFromCart(item.index));

        container.appendChild(itemDiv);
    },

    // 更新商品数量
    updateItemQuantity: function(index, delta) {
        const item = this.items[index];
        const newQuantity = item.quantity + delta;

        if (newQuantity > 0) {
            item.quantity = newQuantity;
            item.subtotal = item.price * newQuantity;

            // 如果是配件，同时更新其必选备件的数量
            if (item.type === 'accessory') {
                const requiredParts = this.requiredParts.get(item.name);
                if (requiredParts) {
                    this.items.forEach(cartItem => {
                        if (cartItem.type === 'spare_part' && 
                            cartItem.specs.parent_accessory === item.name) {
                            const requiredPart = requiredParts.find(
                                rp => rp.required_part_number === cartItem.name
                            );
                            if (requiredPart) {
                                cartItem.quantity = newQuantity * requiredPart.quantity;
                                cartItem.subtotal = cartItem.price * cartItem.quantity;
                            }
                        }
                    });
                }
            }

            this.updateDisplay();
            this.saveToLocalStorage();
        }
    },

    // 保存到本地存储
    saveToLocalStorage: function() {
        localStorage.setItem('bjt_cart', JSON.stringify({
            items: this.items,
            requiredParts: Array.from(this.requiredParts.entries())
        }));
    },

    // 从本地存储加载
    loadFromLocalStorage: function() {
        const savedCart = localStorage.getItem('bjt_cart');
        if (savedCart) {
            const parsed = JSON.parse(savedCart);
            this.items = parsed.items || [];
            this.requiredParts = new Map(parsed.requiredParts || []);
            this.updateDisplay();
        }
    }
};

// 页面加载时初始化购物车
document.addEventListener('DOMContentLoaded', function() {
    cart.loadFromLocalStorage();
});

// 添加到购物车的事件处理函数
function addToCart(type, productName, price, specs) {
    if (type === 'machine') {
        cart.addMachine(productName, price, specs);
    } else if (type === 'accessory') {
        cart.addAccessory(productName, price, specs);
    }
}
</script>

<style>
/* 购物车样式 */
.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.cart-item-info {
    flex: 1;
}

.cart-item-name {
    font-weight: 500;
    margin-bottom: 5px;
}

.required-badge {
    background-color: #ff4757;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    margin-left: 5px;
}

.parent-accessory {
    color: #666;
    font-size: 12px;
    margin-left: 10px;
}

.cart-category-title {
    background-color: #f8f9fa;
    padding: 10px;
    margin-top: 15px;
    font-weight: 500;
    color: #1a57a5;
    border-radius: 4px;
}

/* 其他样式保持不变 */
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Handle product link clicks
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const hostId = this.getAttribute('data-host-id');
            
            // Check if user is logged in
            if (!<?php echo is_user_logged_in() ? 'true' : 'false'; ?>) {
                alert('<?php echo esc_js(__('Please login to access this content.', 'bjt-product-admin')); ?>');
                return;
            }
            
            // Fetch host details
            fetch(`/wp-json/bjt-product/v1/hosts/${hostId}`)
                .then(response => response.json())
                .then(data => {
                    // Display host details
                    console.log('Host details:', data);
                    // TODO: Implement host details display
                })
                .catch(error => {
                    console.error('Error fetching host details:', error);
                    alert('<?php echo esc_js(__('Error loading host details.', 'bjt-product-admin')); ?>');
                });
        });
    });
    
    // Handle language selector
    const languageSelect = document.querySelector('.language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            // TODO: Implement language change
            console.log('Language changed to:', selectedLang);
        });
    }
    
    // Handle login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = '<?php echo esc_js(wp_login_url()); ?>';
        });
    }
});
</script> 