<?php
/**
 * Plugin Name: BJT API Test
 * Description: 测试WordPress REST API功能
 * Version: 1.0.0
 * Author: System Admin
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 注册REST API路由
 */
function bjt_api_test_register_rest_routes() {
    register_rest_route('bjt-api-test/v1', '/hello', array(
        'methods' => 'GET',
        'callback' => 'bjt_api_test_hello_callback',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-api-test/v1', '/echo', array(
        'methods' => 'POST',
        'callback' => 'bjt_api_test_echo_callback',
        'permission_callback' => '__return_true'
    ));
}

/**
 * Hello API回调
 */
function bjt_api_test_hello_callback($request) {
    return array(
        'success' => true,
        'message' => 'Hello from BJT API Test',
        'time' => current_time('mysql'),
        'request' => $request->get_params()
    );
}

/**
 * Echo API回调
 */
function bjt_api_test_echo_callback($request) {
    $params = $request->get_params();
    
    return array(
        'success' => true,
        'message' => 'Echo from BJT API Test',
        'time' => current_time('mysql'),
        'echo' => $params
    );
}

// 注册REST API路由
add_action('rest_api_init', 'bjt_api_test_register_rest_routes');

/**
 * 添加管理菜单
 */
function bjt_api_test_admin_menu() {
    add_menu_page(
        'BJT API 测试',
        'BJT API 测试',
        'manage_options',
        'bjt-api-test',
        'bjt_api_test_admin_page',
        'dashicons-rest-api',
        99
    );
}
add_action('admin_menu', 'bjt_api_test_admin_menu');

/**
 * 管理页面
 */
function bjt_api_test_admin_page() {
    ?>
    <div class="wrap">
        <h1>BJT API 测试</h1>
        <div id="bjt-api-test-result" style="margin-top: 20px; padding: 20px; background: #f8f8f8; border: 1px solid #ddd;">
            <h2>测试结果</h2>
            <p>点击下面的按钮测试API</p>
            <button id="bjt-api-test-button" class="button button-primary">测试API</button>
            <div id="bjt-api-test-output" style="margin-top: 20px; padding: 10px; background: #fff; border: 1px solid #ddd; display: none;"></div>
        </div>
        <div style="margin-top: 20px;">
            <h2>API 信息</h2>
            <p>API URL: <code><?php echo rest_url('bjt-api-test/v1/hello'); ?></code></p>
            <p>测试命令: <code>curl <?php echo rest_url('bjt-api-test/v1/hello'); ?></code></p>
        </div>
    </div>
    <script>
        jQuery(document).ready(function($) {
            $('#bjt-api-test-button').on('click', function() {
                var $output = $('#bjt-api-test-output');
                $output.html('加载中...').show();
                
                $.ajax({
                    url: '<?php echo rest_url('bjt-api-test/v1/hello'); ?>',
                    method: 'GET',
                    success: function(response) {
                        $output.html('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
                    },
                    error: function(xhr, status, error) {
                        $output.html('<div style="color: red;">错误: ' + error + '</div>');
                        if (xhr.responseText) {
                            $output.append('<pre>' + xhr.responseText + '</pre>');
                        }
                    }
                });
            });
        });
    </script>
    <?php
} 