<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap">
    <div class="bjt-admin-header">
        <img src="<?php echo plugins_url('assets/images/logo.png', dirname(__FILE__)); ?>" alt="BJT Logo" class="bjt-logo">
        <h1>BJT Machine Management System</h1>
    </div>
    
    <div class="bjt-admin-container">
        <!-- 侧边栏导航 -->
        <div class="bjt-admin-sidebar">
            <div class="bjt-admin-menu">
                <a href="<?php echo admin_url('admin.php?page=bjt-product-admin'); ?>" class="bjt-menu-item">
                    <span class="bjt-menu-icon">🏠</span>
                    <span class="bjt-menu-text">首页</span>
                </a>
                
                <div class="bjt-menu-group">
                    <div class="bjt-menu-item expandable">
                        <span class="bjt-menu-icon">📄</span>
                        <span class="bjt-menu-text">页面编辑</span>
                        <span class="bjt-menu-arrow">▶</span>
                    </div>
                    <div class="bjt-submenu">
                        <a href="#" class="bjt-menu-item">产品线1</a>
                        <a href="#" class="bjt-menu-item">产品线2</a>
                        <a href="#" class="bjt-menu-item">产品线3</a>
                        <a href="#" class="bjt-menu-item">产品线4</a>
                    </div>
                </div>
                
                <div class="bjt-menu-group">
                    <div class="bjt-menu-item expandable active">
                        <span class="bjt-menu-icon">🛋️</span>
                        <span class="bjt-menu-text">气垫机</span>
                        <span class="bjt-menu-arrow">▶</span>
                    </div>
                    <div class="bjt-submenu active">
                        <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=hosts'); ?>" class="bjt-menu-item active">主机</a>
                        <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=accessories'); ?>" class="bjt-menu-item">配件</a>
                        <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=consumables'); ?>" class="bjt-menu-item">耗材</a>
                        <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=spare-parts'); ?>" class="bjt-menu-item">备件</a>
                    </div>
                </div>
                
                <div class="bjt-menu-group">
                    <div class="bjt-menu-item expandable">
                        <span class="bjt-menu-icon">📃</span>
                        <span class="bjt-menu-text">纸机</span>
                        <span class="bjt-menu-arrow">▶</span>
                    </div>
                    <div class="bjt-submenu">
                        <a href="#" class="bjt-menu-item">主机</a>
                        <a href="#" class="bjt-menu-item">配件</a>
                        <a href="#" class="bjt-menu-item">耗材</a>
                        <a href="#" class="bjt-menu-item">备件</a>
                    </div>
                </div>
                
                <div class="bjt-menu-group">
                    <div class="bjt-menu-item expandable">
                        <span class="bjt-menu-icon">🧵</span>
                        <span class="bjt-menu-text">胶带机</span>
                        <span class="bjt-menu-arrow">▶</span>
                    </div>
                    <div class="bjt-submenu">
                        <a href="#" class="bjt-menu-item">主机</a>
                        <a href="#" class="bjt-menu-item">配件</a>
                        <a href="#" class="bjt-menu-item">耗材</a>
                        <a href="#" class="bjt-menu-item">备件</a>
                    </div>
                </div>
                
                <div class="bjt-menu-group">
                    <div class="bjt-menu-item expandable">
                        <span class="bjt-menu-icon">💼</span>
                        <span class="bjt-menu-text">气柱袋</span>
                        <span class="bjt-menu-arrow">▶</span>
                    </div>
                    <div class="bjt-submenu">
                        <a href="#" class="bjt-menu-item">耗材</a>
                    </div>
                </div>
                
                <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=users'); ?>" class="bjt-menu-item">
                    <span class="bjt-menu-icon">👤</span>
                    <span class="bjt-menu-text">用户管理</span>
                </a>
                
                <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=settings'); ?>" class="bjt-menu-item">
                    <span class="bjt-menu-icon">⚙️</span>
                    <span class="bjt-menu-text">系统设置</span>
                </a>
            </div>
        </div>
        
        <!-- 主要内容区域 -->
        <div class="bjt-admin-content">
            <?php
            // 根据action参数加载不同的内容
            $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
            
            switch ($action) {
                case 'hosts':
                    include plugin_dir_path(__FILE__) . 'hosts/list.php';
                    break;
                case 'accessories':
                    include plugin_dir_path(__FILE__) . 'accessories/list.php';
                    break;
                case 'consumables':
                    include plugin_dir_path(__FILE__) . 'consumables/list.php';
                    break;
                case 'spare-parts':
                    include plugin_dir_path(__FILE__) . 'spare-parts/list.php';
                    break;
                case 'users':
                    include plugin_dir_path(__FILE__) . 'users/list.php';
                    break;
                case 'settings':
                    include plugin_dir_path(__FILE__) . 'settings.php';
                    break;
                default:
                    include plugin_dir_path(__FILE__) . 'dashboard.php';
                    break;
            }
            ?>
        </div>
    </div>
</div>

<style>
.bjt-admin-header {
    display: flex;
    align-items: center;
    padding: 15px 25px;
    background-color: #fff;
    border-bottom: 1px solid #e1e5eb;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.bjt-logo {
    height: 45px;
    margin-right: 20px;
}

.bjt-admin-container {
    display: flex;
    min-height: calc(100vh - 100px);
}

.bjt-admin-sidebar {
    width: 220px;
    background-color: #1a3c70;
    color: #fff;
    padding: 15px 0;
}

.bjt-admin-menu {
    display: flex;
    flex-direction: column;
}

.bjt-menu-item {
    padding: 12px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
    font-size: 14px;
}

.bjt-menu-item:hover {
    background-color: rgba(255,255,255,0.1);
    color: #fff;
}

.bjt-menu-item.active {
    background-color: rgba(255,255,255,0.15);
    color: #fff;
    border-left-color: #4dabf7;
}

.bjt-menu-icon {
    margin-right: 10px;
    opacity: 0.8;
    font-size: 16px;
}

.bjt-menu-text {
    flex: 1;
}

.bjt-menu-arrow {
    font-size: 10px;
    transition: transform 0.2s;
}

.bjt-menu-item.expandable.active .bjt-menu-arrow {
    transform: rotate(90deg);
}

.bjt-submenu {
    display: none;
    background-color: rgba(0,0,0,0.15);
}

.bjt-submenu.active {
    display: block;
}

.bjt-submenu .bjt-menu-item {
    padding-left: 40px;
    font-size: 13px;
}

.bjt-admin-content {
    flex: 1;
    padding: 30px;
    background-color: #fff;
    overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .bjt-admin-sidebar {
        width: 60px;
    }
    
    .bjt-menu-text {
        display: none;
    }
    
    .bjt-menu-icon {
        margin-right: 0;
    }
    
    .bjt-submenu {
        position: absolute;
        left: 60px;
        width: 200px;
        z-index: 1000;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    // 修复子菜单展开问题，添加特定的命名空间
    function initializeMenu() {
        // 1. 清除所有可能存在的事件监听器，防止重复绑定
        $('.bjt-menu-item.expandable').off('click');
        
        // 2. 重新添加点击事件
        $('.bjt-menu-item.expandable').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 获取子菜单
            const submenu = $(this).next('.bjt-submenu');
            
            // 默认保持展开状态，不自动关闭
            $(this).addClass('active');
            submenu.addClass('active');
            
            // 更新箭头方向
            const arrow = $(this).find('.bjt-menu-arrow');
            arrow.css('transform', 'rotate(90deg)');
        });
        
        // 3. 为子菜单项添加点击事件
        $('.bjt-submenu .bjt-menu-item').on('click', function(e) {
            // 移除所有子菜单项的active类
            $('.bjt-submenu .bjt-menu-item').removeClass('active');
            
            // 将当前点击的子菜单项设为active
            $(this).addClass('active');
        });
        
        // 4. 确保当前活跃菜单项的父菜单是展开的
        $('.bjt-submenu .bjt-menu-item.active').each(function() {
            const parentMenu = $(this).closest('.bjt-submenu').prev('.bjt-menu-item.expandable');
            parentMenu.addClass('active');
            parentMenu.next('.bjt-submenu').addClass('active');
            
            // 更新箭头方向
            const arrow = parentMenu.find('.bjt-menu-arrow');
            arrow.css('transform', 'rotate(90deg)');
        });
    }
    
    // 执行初始化
    initializeMenu();
    
    // 延迟200ms再次初始化，避免其他脚本干扰
    setTimeout(initializeMenu, 200);
});
</script> 