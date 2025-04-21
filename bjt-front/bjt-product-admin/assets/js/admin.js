/**
 * BJT Admin JavaScript
 * Handles menu interactions and form handling for the BJT Product Management System
 */

(function($) {
    'use strict';
    
    // 使用window.BJTAdmin而不是顶级变量声明，避免重复声明错误
    window.BJTAdmin = window.BJTAdmin || {
        // Store active states
        activeMenu: null,
        activeSubMenu: null,
        menuExpanded: false,
        isMobile: window.innerWidth < 768,

        /**
         * Initialize the admin interface
         */
        init: function() {
            // Initialize menu interactions
            this.setupMenuItems();
            this.setupMobileMenu();
            
            // Initialize form handling
            BJTForms.init();
            
            // Restore menu state from localStorage if available
            this.restoreMenuState();
            
            // Handle window resize
            window.addEventListener('resize', this.handleResize.bind(this));

            // Listen for URL changes that might need menu updates
            this.handleURLBasedMenu();
        },

        /**
         * Setup menu item click handlers
         */
        setupMenuItems: function() {
            // Main menu item clicks
            document.querySelectorAll('.bjt-menu-item').forEach(menuItem => {
                menuItem.addEventListener('click', (e) => {
                    const menuKey = menuItem.dataset.menuKey;
                    
                    if (menuItem.classList.contains('has-submenu')) {
        e.preventDefault();
                        this.toggleSubMenu(menuKey);
                    } else {
                        this.setActiveMenu(menuKey);
                    }
                });
            });

            // Submenu item clicks
            document.querySelectorAll('.bjt-submenu-item').forEach(subMenuItem => {
                subMenuItem.addEventListener('click', (e) => {
                    const menuKey = subMenuItem.closest('.bjt-submenu-container').dataset.parentMenu;
                    const subMenuKey = subMenuItem.dataset.submenuKey;
                    
                    this.setActiveMenu(menuKey, subMenuKey);
                });
            });
        },

        /**
         * Toggle submenu visibility
         */
        toggleSubMenu: function(menuKey) {
            const menuItem = document.querySelector(`.bjt-menu-item[data-menu-key="${menuKey}"]`);
            const subMenu = document.querySelector(`.bjt-submenu-container[data-parent-menu="${menuKey}"]`);
            
            if (!menuItem || !subMenu) return;
            
            const isExpanded = menuItem.classList.contains('expanded');
            
            // Close any open submenus that aren't the current one
            document.querySelectorAll('.bjt-menu-item.expanded').forEach(item => {
                if (item !== menuItem) {
                    item.classList.remove('expanded');
                    const relatedSubmenu = document.querySelector(`.bjt-submenu-container[data-parent-menu="${item.dataset.menuKey}"]`);
                    if (relatedSubmenu) {
                        relatedSubmenu.style.maxHeight = '0px';
                        relatedSubmenu.classList.remove('expanded');
                    }
                }
            });

            // Toggle current submenu
            if (isExpanded) {
                menuItem.classList.remove('expanded');
                subMenu.style.maxHeight = '0px';
                subMenu.classList.remove('expanded');
            } else {
                menuItem.classList.add('expanded');
                subMenu.style.maxHeight = subMenu.scrollHeight + 'px';
                subMenu.classList.add('expanded');
                
                // Set as active menu
                this.setActiveMenu(menuKey);
            }
            
            // Save state
            this.saveMenuState();
        },

        /**
         * Analyze the current URL and set the appropriate menu item active
         */
        handleURLBasedMenu: function() {
            // Get page parameter from URL
            const urlParams = new URLSearchParams(window.location.search);
            const page = urlParams.get('page');
            
            if (page) {
                // Map page parameter to menu key
                let menuKey = null;
                let subMenuKey = null;
                
                // Map main sections
                if (page.includes('settings')) {
                    menuKey = 'settings';
                } else if (page.includes('users')) {
                    menuKey = 'user_management';
                } else if (page.includes('hosts')) {
                    menuKey = 'air_cushion';
                    subMenuKey = 'hosts';
                } else if (page.includes('accessories')) {
                    menuKey = 'air_cushion';
                    subMenuKey = 'accessories';
                } else if (page.includes('consumables')) {
                    menuKey = 'air_cushion';
                    subMenuKey = 'consumables';
                } else if (page.includes('spare-parts')) {
                    menuKey = 'air_cushion';
                    subMenuKey = 'spare_parts';
                } else if (page.includes('paper')) {
                    menuKey = 'paper_machine';
                    // Determine paper machine submenu
                    if (page.includes('paper-hosts')) {
                        subMenuKey = 'paper_hosts';
                    } else if (page.includes('paper-accessories')) {
                        subMenuKey = 'paper_accessories';
                    } else if (page.includes('paper-consumables')) {
                        subMenuKey = 'paper_consumables';
                    } else if (page.includes('paper-spare-parts')) {
                        subMenuKey = 'paper_spare_parts';
                    }
                } else if (page.includes('tape')) {
                    menuKey = 'tape_machine';
                    // Determine tape machine submenu
                    if (page.includes('tape-hosts')) {
                        subMenuKey = 'tape_hosts';
                    } else if (page.includes('tape-accessories')) {
                        subMenuKey = 'tape_accessories';
                    } else if (page.includes('tape-consumables')) {
                        subMenuKey = 'tape_consumables';
                    } else if (page.includes('tape-spare-parts')) {
                        subMenuKey = 'tape_spare_parts';
                    }
                } else if (page.includes('air-column')) {
                    menuKey = 'air_column_bag';
                    if (page.includes('air-column-consumables')) {
                        subMenuKey = 'air_column_consumables';
                    }
                } else if (page.includes('product-line')) {
                    menuKey = 'page_edit';
                    // Determine product line submenu
                    if (page.includes('product-line1')) {
                        subMenuKey = 'product_line1';
                    } else if (page.includes('product-line2')) {
                        subMenuKey = 'product_line2';
                    } else if (page.includes('product-line3')) {
                        subMenuKey = 'product_line3';
                    } else if (page.includes('product-line4')) {
                        subMenuKey = 'product_line4';
                    }
                } else {
                    // 默认到页面编辑而不是首页
                    menuKey = 'page_edit';
                }
                
                // Set active menu based on URL
                if (menuKey) {
                    this.setActiveMenu(menuKey, subMenuKey);
                }
            }
        },

        /**
         * Set active menu and submenu
         */
        setActiveMenu: function(menuKey, subMenuKey = null) {
            // Remove active class from all menu items
            document.querySelectorAll('.bjt-menu-item.active, .bjt-submenu-item.active').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to selected menu
            const menuItem = document.querySelector(`.bjt-menu-item[data-menu-key="${menuKey}"]`);
            if (menuItem) {
                menuItem.classList.add('active');
                
                // Expand parent if it's a submenu
                if (menuItem.classList.contains('has-submenu') && subMenuKey) {
                    this.toggleSubMenu(menuKey);
                }
            }
            
            // Add active class to selected submenu if applicable
            if (subMenuKey) {
                const subMenuItem = document.querySelector(`.bjt-submenu-item[data-submenu-key="${subMenuKey}"]`);
                if (subMenuItem) {
                    subMenuItem.classList.add('active');
                }
            }
            
            // Update active states
            this.activeMenu = menuKey;
            this.activeSubMenu = subMenuKey;
            
            // Save state
            this.saveMenuState();
        },

        /**
         * Setup mobile menu toggle
         */
        setupMobileMenu: function() {
            const menuToggle = document.querySelector('.bjt-mobile-menu-toggle');
            const sidebarMenu = document.querySelector('.bjt-sidebar-menu');
            
            if (menuToggle && sidebarMenu) {
                menuToggle.addEventListener('click', () => {
                    this.menuExpanded = !this.menuExpanded;
                    menuToggle.classList.toggle('expanded', this.menuExpanded);
                    sidebarMenu.classList.toggle('expanded', this.menuExpanded);
                    
                    // Save state
                    this.saveMenuState();
                });
            }
        },

        /**
         * Handle window resize events
         */
        handleResize: function() {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            // Handle transition between mobile and desktop
            if (wasMobile !== this.isMobile) {
                const sidebarMenu = document.querySelector('.bjt-sidebar-menu');
                const menuToggle = document.querySelector('.bjt-mobile-menu-toggle');
                
                if (!this.isMobile) {
                    // Switching to desktop
                    sidebarMenu.classList.remove('expanded');
                    menuToggle.classList.remove('expanded');
                    this.menuExpanded = false;
                }
                
                // Save state
                this.saveMenuState();
            }
        },

        /**
         * Save menu state to localStorage
         */
        saveMenuState: function() {
            const state = {
                activeMenu: this.activeMenu,
                activeSubMenu: this.activeSubMenu,
                menuExpanded: this.menuExpanded
            };
            
            localStorage.setItem('bjtAdminMenuState', JSON.stringify(state));
        },

        /**
         * Restore menu state from localStorage
         */
        restoreMenuState: function() {
            const savedState = localStorage.getItem('bjtAdminMenuState');
            
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    
                    // Restore active menu
                    if (state.activeMenu) {
                        this.setActiveMenu(state.activeMenu, state.activeSubMenu);
                    }
                    
                    // Restore mobile menu state if we're on mobile
                    if (this.isMobile && state.menuExpanded) {
                        const sidebarMenu = document.querySelector('.bjt-sidebar-menu');
                        const menuToggle = document.querySelector('.bjt-mobile-menu-toggle');
                        
                        if (sidebarMenu && menuToggle) {
                            this.menuExpanded = state.menuExpanded;
                            sidebarMenu.classList.toggle('expanded', this.menuExpanded);
                            menuToggle.classList.toggle('expanded', this.menuExpanded);
                        }
                    }
                } catch (e) {
                    console.error('Error restoring menu state:', e);
                }
            }
        },

        // 获取AJAX数据，首先检查各种可能的变量名
        getAjaxData: function() {
            // 按优先级检查各个变量名，返回第一个可用的
            if (typeof bjt_admin_vars !== 'undefined') {
                return bjt_admin_vars;
            } else if (typeof bjt_admin_data !== 'undefined') {
                return bjt_admin_data;
            } else if (typeof bjt_pages_data !== 'undefined') {
                return bjt_pages_data;
            } else {
                // 如果都不存在，返回默认值
                console.warn('找不到BJT admin数据，使用默认值');
                return {
                    ajaxurl: '/wp-admin/admin-ajax.php',
                    nonce: ''
                };
            }
        },

        /**
         * 发送AJAX请求的通用方法
         */
        sendAjaxRequest: function(action, data, successCallback, errorCallback) {
            const ajaxData = this.getAjaxData();
            
            // 准备基础数据
            const requestData = {
                action: action,
                nonce: ajaxData.nonce,
                ...data
            };
            
            // 发送请求
            $.ajax({
                url: ajaxData.ajaxurl,
                type: 'POST',
                data: requestData,
                success: successCallback,
                error: errorCallback || this.handleAjaxError
            });
        }
    };
    
    // 在文档加载完成后初始化
    $(document).ready(function() {
        if (typeof window.BJTAdmin !== 'undefined') {
            window.BJTAdmin.init();
        }
    });
    
})(jQuery);

/**
 * BJT Forms handling
 */
const BJTForms = {
    /**
     * Initialize form handling
     */
    init: function() {
        this.setupFormValidation();
        this.setupMediaUpload();
    },
    
    /**
     * Setup form validation
     */
    setupFormValidation: function() {
        document.querySelectorAll('.bjt-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    },
    
    /**
     * Validate form fields
     */
    validateForm: function(form) {
        let isValid = true;
        
        // Clear previous error messages
        form.querySelectorAll('.bjt-error-message').forEach(error => error.remove());
        
        // Validate required fields
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                this.showFieldError(field, 'This field is required');
            }
        });
        
        // Validate numeric fields
        form.querySelectorAll('input[type="number"], input[data-type="numeric"]').forEach(field => {
            if (field.value && isNaN(parseFloat(field.value))) {
                isValid = false;
                this.showFieldError(field, 'Please enter a valid number');
            }
        });
        
        return isValid;
    },
    
    /**
     * Show error message for a field
     */
    showFieldError: function(field, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'bjt-error-message';
        errorElement.textContent = message;
        
        field.classList.add('bjt-field-error');
        field.parentNode.appendChild(errorElement);
        
        // Remove error styling when field is edited
        field.addEventListener('input', () => {
            field.classList.remove('bjt-field-error');
            const error = field.parentNode.querySelector('.bjt-error-message');
            if (error) error.remove();
        }, { once: true });
    },
    
    /**
     * Setup media upload handlers
     */
    setupMediaUpload: function() {
        // Check if WordPress media uploader is available
        if (typeof wp !== 'undefined' && wp.media) {
            document.querySelectorAll('.bjt-media-upload-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const targetInput = document.getElementById(button.dataset.target);
                    const previewElement = document.getElementById(button.dataset.preview);
                    
                    if (!targetInput) return;
                    
                    const mediaFrame = wp.media({
                        title: 'Select or Upload Media',
                        button: {
                            text: 'Use this media'
                        },
                        multiple: false
                    });
                    
                    mediaFrame.on('select', function() {
                        const attachment = mediaFrame.state().get('selection').first().toJSON();
                        targetInput.value = attachment.url;
                        
                        // Update preview if available
                        if (previewElement) {
                            if (previewElement.tagName === 'IMG') {
                                previewElement.src = attachment.url;
                                previewElement.style.display = 'block';
                            } else {
                                previewElement.style.backgroundImage = `url(${attachment.url})`;
                            }
                        }
                    });
                    
                    mediaFrame.open();
                });
            });
        }
    }
}; 