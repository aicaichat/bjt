<?php
/**
 * Plugin Name: BJT API Routes Loader
 * Description: 注册BJT所有API路由
 * Version: 1.0.0
 * Author: BJT Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 注册所有API控制器
function bjt_register_all_api_routes() {
    // 检查控制器类是否存在
    $plugin_dir = plugin_dir_path(dirname(__FILE__)) . 'plugins/bjt-product-admin/includes/api/';
    
    // 记录注册过程的调试信息
    error_log('开始注册BJT API路由');
    
    // 1. 产品线控制器
    if (class_exists('BJT_Product_Lines_Controller') || file_exists($plugin_dir . 'class-bjt-product-lines-controller.php')) {
        if (!class_exists('BJT_Product_Lines_Controller')) {
            require_once($plugin_dir . 'class-bjt-product-lines-controller.php');
        }
        $controller = new BJT_Product_Lines_Controller();
        $controller->register_routes();
        error_log('已注册产品线控制器');
    }
    
    // 2. 授权控制器
    if (class_exists('BJT_Auth_Controller') || file_exists($plugin_dir . 'class-bjt-auth-controller.php')) {
        if (!class_exists('BJT_Auth_Controller')) {
            require_once($plugin_dir . 'class-bjt-auth-controller.php');
        }
        $controller = new BJT_Auth_Controller();
        $controller->register_routes();
        error_log('已注册授权控制器');
    }
    
    // 3. 机器/设备控制器
    if (class_exists('BJT_Host_Models_Controller') || file_exists($plugin_dir . 'class-bjt-host-models-controller.php')) {
        if (!class_exists('BJT_Host_Models_Controller')) {
            require_once($plugin_dir . 'class-bjt-host-models-controller.php');
        }
        $controller = new BJT_Host_Models_Controller();
        $controller->register_routes();
        error_log('已注册设备控制器');
    }
    
    // 4. 配件控制器
    if (class_exists('BJT_Accessory_Models_Controller') || file_exists($plugin_dir . 'class-bjt-accessory-models-controller.php')) {
        if (!class_exists('BJT_Accessory_Models_Controller')) {
            require_once($plugin_dir . 'class-bjt-accessory-models-controller.php');
        }
        $controller = new BJT_Accessory_Models_Controller();
        $controller->register_routes();
        error_log('已注册配件控制器');
    }
    
    // 5. 耗材控制器
    if (class_exists('BJT_Consumables_Controller') || file_exists($plugin_dir . 'class-bjt-consumables-controller.php')) {
        if (!class_exists('BJT_Consumables_Controller')) {
            require_once($plugin_dir . 'class-bjt-consumables-controller.php');
        }
        $controller = new BJT_Consumables_Controller();
        $controller->register_routes();
        error_log('已注册耗材控制器');
    }
    
    // 6. 备件控制器
    if (class_exists('BJT_Spare_Parts_Controller') || file_exists($plugin_dir . 'class-bjt-spare-parts-controller.php')) {
        if (!class_exists('BJT_Spare_Parts_Controller')) {
            require_once($plugin_dir . 'class-bjt-spare-parts-controller.php');
        }
        $controller = new BJT_Spare_Parts_Controller();
        $controller->register_routes();
        error_log('已注册备件控制器');
    }
    
    // 7. 批量处理控制器
    if (class_exists('BJT_Batch_Controller') || file_exists($plugin_dir . 'class-bjt-batch-controller.php')) {
        if (!class_exists('BJT_Batch_Controller')) {
            require_once($plugin_dir . 'class-bjt-batch-controller.php');
        }
        $controller = new BJT_Batch_Controller();
        $controller->register_routes();
        error_log('已注册批量处理控制器');
    }
    
    error_log('BJT API路由注册完成');
}

// 使用late_priority确保所有需要的类都已加载
add_action('rest_api_init', 'bjt_register_all_api_routes', 999); 