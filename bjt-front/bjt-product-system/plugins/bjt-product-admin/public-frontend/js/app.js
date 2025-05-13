document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    initTabs();
    loadAndRenderProducts();
    initEventListeners();
});

// 初始化标签页切换
function initTabs() {
    const tabLinks = document.querySelectorAll('nav a');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            
            // 切换选项卡
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            // 更新导航状态
            tabLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 初始化语言选项卡
    const langTabBtns = document.querySelectorAll('.tab-btn');
    langTabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            
            // 切换语言选项卡
            langTabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.lang-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelector(`.lang-content[data-lang="${lang}"]`).classList.add('active');
        });
    });
}

// 加载产品数据并渲染
async function loadAndRenderProducts() {
    try {
        const products = await mockData.apiSettings.fetchProducts();
        renderProductList(products);
    } catch (error) {
        console.error('Failed to load products:', error);
        showToast('加载产品数据失败，请刷新页面重试', 'error');
    }
}

// 渲染产品列表
function renderProductList(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    
    if (!products || products.length === 0) {
        productList.innerHTML = '<tr><td colspan="5" class="empty-message">暂无产品数据</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.model}</td>
            <td>${product.title}</td>
            <td>${product.description}</td>
            <td>
                <button class="button edit-btn" data-id="${product.id}">编辑</button>
                <button class="button delete-btn" data-id="${product.id}">删除</button>
            </td>
        `;
        productList.appendChild(row);
    });
    
    // 添加编辑和删除事件监听器
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            deleteProduct(productId);
        });
    });
}

// 初始化各种事件监听器
function initEventListeners() {
    // 新增按钮
    document.getElementById('addModelBtn').addEventListener('click', function() {
        // 切换到添加产品表单
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById('add-product').classList.add('active');
        
        // 更新导航状态
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if(link.dataset.tab === 'add-product') {
                link.classList.add('active');
            }
        });
        
        // 重置表单
        document.getElementById('productForm').reset();
        document.getElementById('productForm').removeAttribute('data-product-id');
        document.getElementById('imagePreview').style.backgroundImage = '';
    });
    
    // 表单提交
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 收集表单数据
        const formData = {
            model: document.getElementById('model').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            title_zh: document.querySelector('input[name="title_zh"]').value,
            description_zh: document.querySelector('textarea[name="description_zh"]').value,
            title_en: document.querySelector('input[name="title_en"]').value,
            description_en: document.querySelector('textarea[name="description_en"]').value
        };
        
        try {
            // 如果有ID字段，表示是编辑现有产品
            if(this.dataset.productId) {
                formData.id = parseInt(this.dataset.productId);
                await mockData.apiSettings.saveProduct(formData);
                showToast('产品更新成功');
            } else {
                // 否则是新增产品
                await mockData.apiSettings.saveProduct(formData);
                showToast('新产品添加成功');
            }
            
            // 重新加载产品列表
            await loadAndRenderProducts();
            
            // 切换回产品列表
            setTimeout(() => {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.getElementById('products').classList.add('active');
                
                document.querySelectorAll('nav a').forEach(link => {
                    link.classList.remove('active');
                    if(link.dataset.tab === 'products') {
                        link.classList.add('active');
                    }
                });
            }, 1000);
        } catch (error) {
            console.error('Error saving product:', error);
            showToast('保存失败，请重试', 'error');
        }
    });
    
    // 取消按钮
    document.getElementById('cancelBtn').addEventListener('click', function() {
        // 切换回产品列表
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById('products').classList.add('active');
        
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if(link.dataset.tab === 'products') {
                link.classList.add('active');
            }
        });
    });
    
    // 上传图片按钮
    document.getElementById('uploadBtn').addEventListener('click', function() {
        // 在实际环境中，这里会打开文件选择对话框
        // 这里模拟上传成功
        const randomImage = `https://via.placeholder.com/150?text=Product-${Math.floor(Math.random() * 100)}`;
        document.getElementById('imagePreview').style.backgroundImage = `url(${randomImage})`;
    });
    
    // 批量翻译按钮
    document.querySelector('.batch-translate').addEventListener('click', function() {
        // 模拟翻译功能 - 将中文内容简单复制到英文字段
        const titleZh = document.querySelector('input[name="title_zh"]').value;
        const descZh = document.querySelector('textarea[name="description_zh"]').value;
        
        if(titleZh) {
            document.querySelector('input[name="title_en"]').value = `EN: ${titleZh}`;
        }
        
        if(descZh) {
            document.querySelector('textarea[name="description_en"]').value = `EN: ${descZh}`;
        }
        
        // 切换到英文选项卡
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.lang === 'en') {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.lang-content').forEach(content => {
            content.classList.remove('active');
            if(content.dataset.lang === 'en') {
                content.classList.add('active');
            }
        });
        
        showToast('翻译完成');
    });
    
    // 模态框关闭按钮
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('editLabelModal').style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('editLabelModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 编辑产品
async function editProduct(productId) {
    try {
        // 获取当前产品数据
        const products = await mockData.apiSettings.fetchProducts();
        const product = products.find(p => p.id === productId);
        
        if(!product) {
            showToast('找不到该产品', 'error');
            return;
        }
        
        // 填充表单
        document.getElementById('model').value = product.model || '';
        document.getElementById('title').value = product.title || '';
        document.getElementById('description').value = product.description || '';
        document.querySelector('input[name="title_zh"]').value = product.title_zh || '';
        document.querySelector('textarea[name="description_zh"]').value = product.description_zh || '';
        document.querySelector('input[name="title_en"]').value = product.title_en || '';
        document.querySelector('textarea[name="description_en"]').value = product.description_en || '';
        
        if(product.image) {
            document.getElementById('imagePreview').style.backgroundImage = `url(${product.image})`;
        } else {
            document.getElementById('imagePreview').style.backgroundImage = '';
        }
        
        // 设置表单数据ID
        document.getElementById('productForm').dataset.productId = productId;
        
        // 切换到编辑表单
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById('add-product').classList.add('active');
        
        // 更新导航状态
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if(link.dataset.tab === 'add-product') {
                link.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error loading product for edit:', error);
        showToast('加载产品数据失败', 'error');
    }
}

// 删除产品
async function deleteProduct(productId) {
    if(confirm('确定要删除这个产品吗？')) {
        try {
            // 模拟删除操作 - 实际项目中应该调用API
            mockData.products = mockData.products.filter(p => p.id !== productId);
            await loadAndRenderProducts();
            showToast('删除成功');
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('删除失败，请重试', 'error');
        }
    }
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.querySelector('.toast-message');
    
    toastMessage.textContent = message;
    
    // 设置提示类型
    toast.className = 'toast';
    if (type === 'error') {
        toast.classList.add('toast-error');
        toast.style.backgroundColor = '#f44336';
    } else {
        toast.style.backgroundColor = '#4caf50';
    }
    
    toast.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
} 