/**
 * BJT Shop Authentication Functionality
 */

// Mock user data for demo purposes
const MOCK_USERS = [
    {
        username: 'admin',
        password: 'admin123',
        name: '管理员',
        role: 'admin',
        avatar: '../images/admin-avatar.jpg'
    },
    {
        username: 'sales',
        password: 'sales123',
        name: '销售人员',
        role: 'sales',
        avatar: '../images/sales-avatar.jpg'
    },
    {
        username: 'customer',
        password: 'customer123',
        name: '客户',
        role: 'customer',
        avatar: '../images/customer-avatar.jpg'
    }
];

/**
 * Initialize authentication functionality
 */
function initAuth() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check redirect parameter
    const redirectUrl = BJTUtils.getUrlParam('redirect');
    if (redirectUrl) {
        // Store redirect URL in form for use after login
        const redirectInput = document.createElement('input');
        redirectInput.type = 'hidden';
        redirectInput.name = 'redirect';
        redirectInput.value = redirectUrl;
        loginForm?.appendChild(redirectInput);
    }
}

/**
 * Handle login form submission
 * @param {Event} event - The form submit event
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!username || !password) {
        BJTUtils.showNotification('请输入用户名和密码');
        return;
    }
    
    // Attempt login
    const user = authenticateUser(username, password);
    
    if (user) {
        // Login successful
        loginUser(user);
        
        // 触发登录成功事件
        document.dispatchEvent(new CustomEvent('login', { detail: user }));
        
        // Check for redirect
        const redirectInput = document.querySelector('input[name="redirect"]');
        const redirectUrl = redirectInput?.value;
        
        BJTUtils.showNotification('登录成功！');
        
        // Redirect after a short delay
        setTimeout(() => {
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                // Check if we're already in the pages directory
                const currentPath = window.location.pathname;
                if (currentPath.includes('/pages/')) {
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'pages/home.html';
                }
            }
        }, 1000);
    } else {
        // Login failed
        BJTUtils.showNotification('用户名或密码错误');
    }
}

/**
 * Authenticate a user with username and password
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Object|null} - The user object if authenticated, null otherwise
 */
function authenticateUser(username, password) {
    // In a real application, this would make an API request to authenticate
    // For demo purposes, we're using mock data
    const user = MOCK_USERS.find(user => 
        user.username === username && user.password === password
    );
    
    if (user) {
        // Create a copy without the password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    return null;
}

/**
 * Login a user by storing their data in localStorage
 * @param {Object} user - The user data to store
 */
function loginUser(user) {
    localStorage.setItem('bjt_user_data', JSON.stringify(user));
}

/**
 * Logout the current user
 */
function logoutUser() {
    localStorage.removeItem('bjt_user_data');
    // 使用Router导航系统，适配http-server环境
    if (typeof Router !== 'undefined' && Router.navigateToFile) {
        Router.navigateToFile('login.html');
    } else {
        // Check if we're already in the pages directory
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'pages/login.html';
        }
    }
}

/**
 * Get the current logged in user
 * @returns {Object|null} - The current user or null if not logged in
 */
function getCurrentUser() {
    const userData = localStorage.getItem('bjt_user_data');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Check if a user is logged in
 * @returns {boolean} - Whether a user is logged in
 */
function isLoggedIn() {
    return !!getCurrentUser();
}

/**
 * Check if the current user has a specific role
 * @param {string|Array} roles - The role(s) to check
 * @returns {boolean} - Whether the user has the role
 */
function hasRole(roles) {
    const user = getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(roles)) {
        return roles.includes(user.role);
    }
    
    return user.role === roles;
}

// Export auth functions for use in other files
window.BJTAuth = {
    initAuth,
    loginUser,
    logoutUser,
    getCurrentUser,
    isLoggedIn,
    hasRole
}; 