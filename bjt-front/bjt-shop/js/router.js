// 简单的客户端路由系统
const Router = {
    routes: {
        '/': 'pages/home.html',
        '/login': 'pages/login.html',
        '/products': 'pages/products.html',
        '/spare-parts': 'pages/spare-parts.html',
        '/cart': 'pages/cart.html',
        '/order-confirm': 'pages/order-confirm.html',
        '/order-complete': 'pages/order-complete.html',
        // 添加文件形式的路由支持
        '/login.html': 'pages/login.html',
        '/products.html': 'pages/products.html',
        '/spare-parts.html': 'pages/spare-parts.html',
        '/cart.html': 'pages/cart.html',
        '/order-confirm.html': 'pages/order-confirm.html',
        '/order-complete.html': 'pages/order-complete.html'
    },
    
    pageScripts: {
        '/': 'js/pages/home.js',
        '/login': 'js/pages/login.js',
        '/products': 'js/pages/products.js',
        '/spare-parts': 'js/pages/spare-parts.js',
        '/cart': 'js/pages/cart.js',
        '/order-confirm': 'js/pages/order-confirm.js',
        '/order-complete': 'js/pages/order-complete.js',
        // 添加文件形式的路由支持
        '/login.html': 'js/pages/login.js',
        '/products.html': 'js/pages/products.js',
        '/spare-parts.html': 'js/pages/spare-parts.js',
        '/cart.html': 'js/pages/cart.js',
        '/order-confirm.html': 'js/pages/order-confirm.js',
        '/order-complete.html': 'js/pages/order-complete.js'
    },

    pageStyles: {
        '/': 'css/pages/home.css',
        '/login': 'css/pages/login.css',
        '/products': 'css/pages/products.css',
        '/spare-parts': 'css/pages/spare-parts.css',
        '/cart': 'css/pages/cart.css',
        '/order-confirm': 'css/pages/order-confirm.css',
        '/order-complete': 'css/pages/order-complete.css',
        // 添加文件形式的路由支持
        '/login.html': 'css/pages/login.css',
        '/products.html': 'css/pages/products.css',
        '/spare-parts.html': 'css/pages/spare-parts.css',
        '/cart.html': 'css/pages/cart.css',
        '/order-confirm.html': 'css/pages/order-confirm.css',
        '/order-complete.html': 'css/pages/order-complete.css'
    },
    
    // 将路径转换为一致格式的辅助函数
    normalizePath(path) {
        // 移除末尾斜杠
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return path;
    },
    
    init() {
        // 监听页面导航
        window.addEventListener('popstate', () => this.route());
        
        // 处理链接点击
        document.addEventListener('click', (e) => {
            if (e.target.matches('a') && e.target.href.includes(window.location.origin)) {
                e.preventDefault();
                const url = new URL(e.target.href);
                this.navigate(url.pathname);
            }
        });
        
        // 初始路由
        this.route();
    },
    
    async route() {
        let path = window.location.pathname || '/';
        
        // 处理末尾的斜杠，使 /path 和 /path/ 相同
        path = this.normalizePath(path);
        
        // 检查路由是否存在，否则使用首页
        const route = this.routes[path] || this.routes['/'];
        
        // 加载页面内容
        try {
            const response = await fetch(route);
            const html = await response.text();
            const contentElement = document.getElementById('content');
            
            // 添加检查确保内容元素存在
            if (contentElement) {
                contentElement.innerHTML = html;
            } else {
                console.warn('Content element not found. Skipping route content update.');
                return; // 如果内容元素不存在，不继续更新其他内容
            }
            
            // 更新页面样式
            const pageStylesLink = document.getElementById('page-styles');
            if (pageStylesLink) {
                pageStylesLink.href = this.pageStyles[path] || this.pageStyles['/'];
            }
            
            // 加载页面特定脚本
            this.loadPageScript(path);
            
            // 更新导航高亮
            this.updateNavHighlight(path);
            
            // 滚动到页面顶部
            window.scrollTo(0, 0);
            
            // 更新标题
            document.title = this.getPageTitle(path);
        } catch (error) {
            console.error('路由错误:', error);
        }
    },
    
    navigate(path) {
        // 对路径格式进行规范化（可选）
        path = this.normalizePath(path);
        
        window.history.pushState({}, '', path);
        this.route();
    },
    
    // 支持直接导航到HTML文件
    navigateToFile(filename) {
        window.location.href = filename;
    },
    
    loadPageScript(path) {
        const scriptPath = this.pageScripts[path];
        if (!scriptPath) return;
        
        // 移除之前的页面脚本
        const oldScript = document.getElementById('page-script');
        if (oldScript) {
            oldScript.remove();
        }
        
        // 添加新的页面脚本
        const script = document.createElement('script');
        script.id = 'page-script';
        script.src = scriptPath;
        document.body.appendChild(script);
    },
    
    updateNavHighlight(path) {
        // 移除所有导航链接的活动状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 找到匹配当前路径的链接并添加活动状态
        const currentNavLink = document.querySelector(`.nav-link[href="${path}"]`);
        if (currentNavLink) {
            currentNavLink.classList.add('active');
        } else {
            // 处理子路径，如 /products/1 应该高亮 /products
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                const baseUrl = '/' + segments[0];
                const baseLink = document.querySelector(`.nav-link[href="${baseUrl}"]`);
                if (baseLink) {
                    baseLink.classList.add('active');
                }
            }
        }
    },
    
    getPageTitle(path) {
        const titles = {
            '/': 'BJT产品管理系统',
            '/login': 'BJT - 登录',
            '/products': 'BJT - 产品列表',
            '/spare-parts': 'BJT - 备件分类',
            '/cart': 'BJT - 购物车',
            '/order-confirm': 'BJT - 确认订单',
            '/order-complete': 'BJT - 订单完成',
            // 添加文件形式的路由支持
            '/login.html': 'BJT - 登录',
            '/products.html': 'BJT - 产品列表',
            '/spare-parts.html': 'BJT - 备件分类',
            '/cart.html': 'BJT - 购物车',
            '/order-confirm.html': 'BJT - 确认订单',
            '/order-complete.html': 'BJT - 订单完成'
        };
        return titles[path] || 'BJT产品管理系统';
    }
}; 