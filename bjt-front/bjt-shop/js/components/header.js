/**
 * 头部组件
 * 包含导航栏、Logo、菜单、语言选择器、登录按钮和主题切换
 */

// 默认语言
const DEFAULT_LANGUAGE = 'zh-CN';

// 可用语言列表
const AVAILABLE_LANGUAGES = {
    'zh-CN': {
        name: '中文',
        flag: '🇨🇳'
    },
    'en-US': {
        name: 'English',
        flag: '🇺🇸'
    }
};

// 头部导航菜单配置
const NAV_ITEMS = {
    'zh-CN': [
        {
            text: '产品',
            href: '#',
            hasSubmenu: true,
            submenu: [
                {
                    text: '气垫包装系统',
                    hasSubmenu: true,
                    submenu: [
                        { text: '气垫机及配件', href: 'air-cushion.html' },
                        { text: '气垫膜选项', href: 'air-film.html' },
                        { text: '备件', href: 'air-spare-parts.html' }
                    ]
                },
                {
                    text: '纸垫包装系统',
                    hasSubmenu: true,
                    submenu: [
                        { text: '纸垫机及配件', href: 'paper-cushion.html' },
                        { text: '纸张选项', href: 'paper-options.html' },
                        { text: '备件', href: 'paper-spare-parts.html' }
                    ]
                },
                {
                    text: '水胶带系统',
                    hasSubmenu: true,
                    submenu: [
                        { text: '水胶带分配器及配件', href: 'water-tape-dispenser.html' },
                        { text: '水胶带选项', href: 'water-tape-options.html' },
                        { text: '备件', href: 'water-tape-spare-parts.html' }
                    ]
                }
            ]
        },
        {
            text: '支持',
            href: '#',
            hasSubmenu: true,
            submenu: [
                { text: '售后服务', href: 'after-sales.html' },
                { text: '文档下载', href: 'documents.html' },
                { text: '常见问题', href: 'faq.html' }
            ]
        },
        {
            text: '联系我们',
            href: 'contact.html',
            hasSubmenu: false
        }
    ],
    'en-US': [
        {
            text: 'Products',
            href: '#',
            hasSubmenu: true,
            submenu: [
                {
                    text: 'Air Cushioning System',
                    hasSubmenu: true,
                    submenu: [
                        { text: 'Air Cushion Machine & Accessory', href: 'air-cushion.html' },
                        { text: 'Film Options', href: 'air-film.html' },
                        { text: 'Spare Parts', href: 'air-spare-parts.html' }
                    ]
                },
                {
                    text: 'Paper Cushioning System',
                    hasSubmenu: true,
                    submenu: [
                        { text: 'Paper Cushion Machine & Accessory', href: 'paper-cushion.html' },
                        { text: 'Paper Options', href: 'paper-options.html' },
                        { text: 'Spare Parts', href: 'paper-spare-parts.html' }
                    ]
                },
                {
                    text: 'Water Activated Tape System',
                    hasSubmenu: true,
                    submenu: [
                        { text: 'Water Activated Tape Dispenser & Accessory', href: 'water-tape-dispenser.html' },
                        { text: 'Water Activated Tape Options', href: 'water-tape-options.html' },
                        { text: 'Spare Parts', href: 'water-tape-spare-parts.html' }
                    ]
                }
            ]
        },
        {
            text: 'Support',
            href: '#',
            hasSubmenu: true,
            submenu: [
                { text: 'After-sales Service', href: 'after-sales.html' },
                { text: 'Document Download', href: 'documents.html' },
                { text: 'FAQ', href: 'faq.html' }
            ]
        },
        {
            text: 'Contact Us',
            href: 'contact.html',
            hasSubmenu: false
        }
    ]
};

// 多语言文本
const TRANSLATIONS = {
    'zh-CN': {
        login: '登录',
        logout: '退出',
        theme: '主题',
        light: '浅色',
        dark: '深色',
        language: '语言',
        menu: '菜单'
    },
    'en-US': {
        login: 'Login',
        logout: 'Logout',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        language: 'Language',
        menu: 'Menu'
    }
};

/**
 * 初始化头部组件
 * @param {string} containerId - 容器元素的ID
 */
function initHeader(containerId = 'header') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Header container with id "${containerId}" not found`);
        return;
    }

    // 获取当前语言
    const currentLanguage = localStorage.getItem('bjt-language') || DEFAULT_LANGUAGE;
    
    // 构建头部HTML
    container.innerHTML = createHeaderHTML(currentLanguage);
    
    // 添加事件监听
    setupHeaderEvents();
}

/**
 * 创建头部HTML
 * @param {string} language - 当前语言
 * @returns {string} - 头部HTML
 */
function createHeaderHTML(language) {
    const navItems = NAV_ITEMS[language] || NAV_ITEMS[DEFAULT_LANGUAGE];
    const translations = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
    
    // 创建导航菜单HTML
    let navItemsHTML = '';
    navItems.forEach(item => {
        if (item.hasSubmenu) {
            // 有子菜单的项
            let submenuItemsHTML = '';
            item.submenu.forEach(subItem => {
                if (subItem.hasSubmenu) {
                    // 有二级子菜单的项
                    let submenu2ItemsHTML = '';
                    subItem.submenu.forEach(sub2Item => {
                        submenu2ItemsHTML += `
                            <li class="submenu__item">
                                <a href="${sub2Item.href}" class="submenu__link product-link">${sub2Item.text}</a>
                            </li>
                        `;
                    });
                    
                    submenuItemsHTML += `
                        <li class="submenu__item has-submenu">
                            <span class="submenu__link">${subItem.text}</span>
                            <ul class="submenu submenu--level-2">
                                ${submenu2ItemsHTML}
                            </ul>
                        </li>
                    `;
                } else {
                    // 无二级子菜单的项
                    submenuItemsHTML += `
                        <li class="submenu__item">
                            <a href="${subItem.href}" class="submenu__link">${subItem.text}</a>
                        </li>
                    `;
                }
            });
            
            navItemsHTML += `
                <li class="nav__item has-submenu">
                    <a href="${item.href}" class="nav__link">${item.text} <span class="dropdown-icon">▼</span></a>
                    <ul class="submenu">
                        ${submenuItemsHTML}
                    </ul>
                </li>
            `;
        } else {
            // 无子菜单的项
            navItemsHTML += `
                <li class="nav__item">
                    <a href="${item.href}" class="nav__link">${item.text}</a>
                </li>
            `;
        }
    });
    
    // 创建语言选择器HTML
    let languageSelectorHTML = '';
    Object.entries(AVAILABLE_LANGUAGES).forEach(([lang, info]) => {
        languageSelectorHTML += `
            <li class="language-selector__item ${lang === language ? 'active' : ''}">
                <button class="language-selector__btn" data-lang="${lang}">${info.flag} ${info.name}</button>
            </li>
        `;
    });
    
    // 创建头部完整HTML
    return `
        <div class="header">
            <div class="container">
                <div class="header__content">
                    <div class="header__logo">
                        <a href="index.html" class="logo">
                            <svg class="logo__svg" width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 0H40C40 11.05 31.05 20 20 20C8.95 20 0 11.05 0 0H20Z" fill="var(--primary-color)"/>
                                <path d="M20 40H0C0 28.95 8.95 20 20 20C31.05 20 40 28.95 40 40H20Z" fill="var(--primary-color)"/>
                                <path d="M50 10H65C69.4 10 73 13.6 73 18V22C73 26.4 69.4 30 65 30H50V10ZM58 16V24H65C65.4 24 66 23.4 66 22V18C66 16.6 65.4 16 65 16H58Z" fill="var(--text-color)"/>
                                <path d="M75 10H82V23C82 24.7 83.3 26 85 26C86.7 26 88 24.7 88 23V10H95V23C95 28.5 90.5 33 85 33C79.5 33 75 28.5 75 23V10Z" fill="var(--text-color)"/>
                                <path d="M105 10H98V30H105C112.2 30 118 24.2 118 20C118 15.8 112.2 10 105 10ZM105 24H104V16H105C108.3 16 111 17.8 111 20C111 22.2 108.3 24 105 24Z" fill="var(--text-color)"/>
                            </svg>
                        </a>
                    </div>
                    
                    <nav class="header__nav nav" id="main-nav">
                        <button class="nav__toggle" id="nav-toggle" aria-label="${translations.menu}">
                            <span class="nav__toggle-bar"></span>
                            <span class="nav__toggle-bar"></span>
                            <span class="nav__toggle-bar"></span>
                        </button>
                        
                        <ul class="nav__list">
                            ${navItemsHTML}
                        </ul>
                    </nav>
                    
                    <div class="header__actions">
                        <div class="language-selector">
                            <button class="language-selector__current">
                                ${AVAILABLE_LANGUAGES[language].flag} <span class="dropdown-icon">▼</span>
                            </button>
                            <ul class="language-selector__list">
                                ${languageSelectorHTML}
                            </ul>
                        </div>
                        
                        <button class="theme-toggle" id="theme-toggle" aria-label="${translations.theme}">
                            <svg class="theme-toggle__icon theme-toggle__icon--light" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                            <svg class="theme-toggle__icon theme-toggle__icon--dark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        </button>
                        
                        <button class="btn btn-outline login-btn" id="login-btn">
                            ${translations.login}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 设置头部事件监听
 */
function setupHeaderEvents() {
    // 导航菜单切换
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav--active');
        });
    }
    
    // 多级菜单交互
    const hasSubmenuItems = document.querySelectorAll('.has-submenu');
    if (hasSubmenuItems) {
        // 检测是否为移动设备
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        hasSubmenuItems.forEach(item => {
            if (isMobile) {
                // 移动设备上点击展开子菜单
                const link = item.querySelector('.nav__link, .submenu__link');
                if (link) {
                    link.addEventListener('click', function(e) {
                        if (this.parentNode.classList.contains('has-submenu')) {
                            e.preventDefault();
                            this.parentNode.classList.toggle('submenu-active');
                        }
                    });
                }
            } else {
                // 桌面设备上悬停展开子菜单
                item.addEventListener('mouseenter', () => {
                    item.classList.add('submenu-active');
                });
                
                item.addEventListener('mouseleave', () => {
                    item.classList.remove('submenu-active');
                });
            }
        });
    }
    
    // 语言选择器
    const languageSelector = document.querySelector('.language-selector__current');
    const languageList = document.querySelector('.language-selector__list');
    
    if (languageSelector && languageList) {
        languageSelector.addEventListener('click', () => {
            languageList.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.language-selector')) {
                languageList.classList.remove('show');
            }
        });
        
        // 语言切换
        const languageButtons = document.querySelectorAll('.language-selector__btn');
        if (languageButtons) {
            languageButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const lang = this.getAttribute('data-lang');
                    if (lang) {
                        localStorage.setItem('bjt-language', lang);
                        // 重新加载页面以应用新语言
                        window.location.reload();
                    }
                });
            });
        }
    }
    
    // 登录按钮
    setupLoginButton();
    
    // 为产品链接添加登录检查
    setupProductLinks();
}

/**
 * 设置登录按钮
 */
function setupLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        // 检查用户登录状态
        const isLoggedIn = localStorage.getItem('bjt-user') !== null;
        
        // 更新按钮文本
        const currentLanguage = localStorage.getItem('bjt-language') || DEFAULT_LANGUAGE;
        const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];
        
        loginBtn.textContent = isLoggedIn ? translations.logout : translations.login;
        
        // 绑定点击事件
        loginBtn.addEventListener('click', function() {
            if (isLoggedIn) {
                // 登出
                localStorage.removeItem('bjt-user');
                window.location.reload();
            } else {
                // 登录
                const currentPath = window.location.pathname;
                const loginPath = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
            }
        });
    }
}

/**
 * 为产品链接添加登录检查
 */
function setupProductLinks() {
    const productLinks = document.querySelectorAll('.product-link');
    
    if (productLinks) {
        productLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // 检查用户是否已登录
                if (localStorage.getItem('bjt-user') === null) {
                    e.preventDefault();
                    showLoginPrompt();
                }
            });
        });
    }
}

/**
 * 显示登录提示
 */
function showLoginPrompt() {
    // 通过主JS中的showLoginPrompt函数显示提示
    if (typeof window.showLoginPrompt === 'function') {
        window.showLoginPrompt();
    } else {
        const currentLanguage = localStorage.getItem('bjt-language') || DEFAULT_LANGUAGE;
        const loginText = TRANSLATIONS[currentLanguage].login || 'Login';
        
        // 如果主JS中没有定义，则使用alert
        if (confirm('您需要登录才能访问该内容。是否前往登录页面？')) {
            const currentPath = window.location.pathname;
            const loginPath = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        }
    }
}

// 导出函数
window.HeaderComponent = {
    init: initHeader
}; 