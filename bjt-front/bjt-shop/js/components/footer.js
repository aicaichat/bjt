/**
 * 页脚组件
 * 包含公司信息、联系方式、导航链接和版权信息
 */

// 默认语言
const DEFAULT_LANGUAGE = 'zh-CN';

// 多语言文本
const TRANSLATIONS = {
    'zh-CN': {
        companyInfo: '公司介绍',
        companyDesc: 'BJT包装是专业的包装解决方案提供商，致力于为各行业客户提供高效、环保、经济的包装系统。',
        quickLinks: '快速链接',
        products: '产品',
        support: '支持',
        contact: '联系我们',
        blog: '博客',
        about: '关于我们',
        careers: '招聘信息',
        legal: '法律信息',
        privacy: '隐私政策',
        terms: '使用条款',
        contactUs: '联系我们',
        address: '地址：江苏省苏州市工业园区XX路XX号',
        phone: '电话：+86 512-XXXX XXXX',
        email: '邮箱：info@bjt-packaging.com',
        subscribeText: '订阅我们的新闻',
        subscribeBtn: '订阅',
        subscribeSuccess: '订阅成功！',
        subscribePlaceholder: '请输入您的邮箱',
        copyright: '© 2023 BJT包装科技有限公司. 保留所有权利.',
    },
    'en-US': {
        companyInfo: 'Company Info',
        companyDesc: 'BJT Packaging is a professional packaging solution provider, dedicated to providing efficient, environmentally friendly, and economical packaging systems for customers in various industries.',
        quickLinks: 'Quick Links',
        products: 'Products',
        support: 'Support',
        contact: 'Contact Us',
        blog: 'Blog',
        about: 'About Us',
        careers: 'Careers',
        legal: 'Legal',
        privacy: 'Privacy Policy',
        terms: 'Terms of Use',
        contactUs: 'Contact Us',
        address: 'Address: XX Road, Industrial Park, Suzhou, Jiangsu Province',
        phone: 'Phone: +86 512-XXXX XXXX',
        email: 'Email: info@bjt-packaging.com',
        subscribeText: 'Subscribe to Our Newsletter',
        subscribeBtn: 'Subscribe',
        subscribeSuccess: 'Subscription successful!',
        subscribePlaceholder: 'Enter your email',
        copyright: '© 2023 BJT Packaging Technology Co., Ltd. All rights reserved.',
    }
};

/**
 * 初始化页脚组件
 * @param {string} containerId - 容器元素的ID
 */
function initFooter(containerId = 'footer') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Footer container with id "${containerId}" not found`);
        return;
    }

    // 获取当前语言
    const currentLanguage = localStorage.getItem('bjt-language') || DEFAULT_LANGUAGE;
    
    // 构建页脚HTML
    container.innerHTML = createFooterHTML(currentLanguage);
    
    // 添加事件监听
    setupFooterEvents();
}

/**
 * 创建页脚HTML
 * @param {string} language - 当前语言
 * @returns {string} - 页脚HTML
 */
function createFooterHTML(language) {
    const translations = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
    
    // 获取当前年份用于版权信息
    const currentYear = new Date().getFullYear();
    
    // 创建页脚完整HTML
    return `
        <div class="footer">
            <div class="container">
                <div class="footer__top">
                    <div class="footer__column">
                        <h3 class="footer__heading">${translations.companyInfo}</h3>
                        <div class="footer__logo">
                            <svg class="logo__svg" width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 0H40C40 11.05 31.05 20 20 20C8.95 20 0 11.05 0 0H20Z" fill="var(--primary-color)"/>
                                <path d="M20 40H0C0 28.95 8.95 20 20 20C31.05 20 40 28.95 40 40H20Z" fill="var(--primary-color)"/>
                                <path d="M50 10H65C69.4 10 73 13.6 73 18V22C73 26.4 69.4 30 65 30H50V10ZM58 16V24H65C65.4 24 66 23.4 66 22V18C66 16.6 65.4 16 65 16H58Z" fill="var(--text-color)"/>
                                <path d="M75 10H82V23C82 24.7 83.3 26 85 26C86.7 26 88 24.7 88 23V10H95V23C95 28.5 90.5 33 85 33C79.5 33 75 28.5 75 23V10Z" fill="var(--text-color)"/>
                                <path d="M105 10H98V30H105C112.2 30 118 24.2 118 20C118 15.8 112.2 10 105 10ZM105 24H104V16H105C108.3 16 111 17.8 111 20C111 22.2 108.3 24 105 24Z" fill="var(--text-color)"/>
                            </svg>
                        </div>
                        <p class="footer__description">${translations.companyDesc}</p>
                        <div class="footer__social">
                            <a href="#" class="footer__social-link" aria-label="Facebook">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </a>
                            <a href="#" class="footer__social-link" aria-label="Twitter">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                </svg>
                            </a>
                            <a href="#" class="footer__social-link" aria-label="LinkedIn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect x="2" y="9" width="4" height="12"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                            </a>
                            <a href="#" class="footer__social-link" aria-label="Instagram">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div class="footer__column">
                        <h3 class="footer__heading">${translations.quickLinks}</h3>
                        <ul class="footer__links">
                            <li><a href="products.html" class="footer__link">${translations.products}</a></li>
                            <li><a href="faq.html" class="footer__link">${translations.support}</a></li>
                            <li><a href="contact.html" class="footer__link">${translations.contact}</a></li>
                            <li><a href="blog.html" class="footer__link">${translations.blog}</a></li>
                            <li><a href="about.html" class="footer__link">${translations.about}</a></li>
                            <li><a href="careers.html" class="footer__link">${translations.careers}</a></li>
                        </ul>
                    </div>
                    <div class="footer__column">
                        <h3 class="footer__heading">${translations.legal}</h3>
                        <ul class="footer__links">
                            <li><a href="privacy.html" class="footer__link">${translations.privacy}</a></li>
                            <li><a href="terms.html" class="footer__link">${translations.terms}</a></li>
                        </ul>
                    </div>
                    <div class="footer__column">
                        <h3 class="footer__heading">${translations.contactUs}</h3>
                        <ul class="footer__contact">
                            <li class="footer__contact-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>${translations.address}</span>
                            </li>
                            <li class="footer__contact-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <span>${translations.phone}</span>
                            </li>
                            <li class="footer__contact-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <span>${translations.email}</span>
                            </li>
                        </ul>
                        <div class="footer__newsletter">
                            <h3 class="footer__heading">${translations.subscribeText}</h3>
                            <form class="footer__form" id="newsletter-form">
                                <input type="email" class="footer__input" placeholder="${translations.subscribePlaceholder}" required>
                                <button type="submit" class="footer__button">${translations.subscribeBtn}</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="footer__bottom">
                    <p class="footer__copyright">${translations.copyright.replace('2023', currentYear)}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 设置页脚事件监听
 */
function setupFooterEvents() {
    // 处理订阅表单提交
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                // 此处可以添加实际的订阅逻辑，例如API调用
                console.log('Newsletter subscription:', emailInput.value);
                
                // 清空输入框并显示成功消息
                emailInput.value = '';
                
                // 获取当前语言的成功消息
                const currentLanguage = localStorage.getItem('bjt-language') || DEFAULT_LANGUAGE;
                const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];
                
                // 显示成功消息
                if (typeof window.showToast === 'function') {
                    window.showToast(translations.subscribeSuccess, 'success');
                } else {
                    alert(translations.subscribeSuccess);
                }
            }
        });
    }
}

// 导出函数
window.FooterComponent = {
    init: initFooter
}; 