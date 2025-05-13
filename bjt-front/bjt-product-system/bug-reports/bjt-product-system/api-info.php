<?php
/**
 * BJT产品系统API信息
 * 
 * 该文件提供关于BJT产品系统API的重要信息
 */

// 设置输出为JSON格式
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// 构建API信息
$api_info = array(
    'success' => true,
    'name' => 'BJT产品系统API',
    'version' => '1.0.0',
    'description' => '由于WordPress REST API问题，我们提供了一个直接的API访问方法',
    'temporary_solution' => true,
    'base_url' => 'http://localhost:8080/wp-content/plugins/bjt-product-system/rest-override.php',
    'endpoints' => array(
        array(
            'name' => 'test',
            'description' => '测试API连接',
            'url' => 'rest-override.php?endpoint=test',
            'method' => 'GET',
            'params' => array()
        ),
        array(
            'name' => '产品线列表',
            'description' => '获取所有产品线',
            'url' => 'rest-override.php?endpoint=product-lines',
            'method' => 'GET',
            'params' => array(
                'page' => '页码（默认为1）',
                'per_page' => '每页数量（默认为10）',
                'status' => '状态（默认为publish）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '产品线详情',
            'description' => '获取单个产品线详情',
            'url' => 'rest-override.php?endpoint=product-lines&id={id}',
            'method' => 'GET',
            'params' => array(
                'id' => '产品线ID（必填）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '主机型号列表',
            'description' => '获取所有主机型号',
            'url' => 'rest-override.php?endpoint=host-models',
            'method' => 'GET',
            'params' => array(
                'page' => '页码（默认为1）',
                'per_page' => '每页数量（默认为10）',
                'status' => '状态（默认为publish）',
                'product_line_id' => '产品线ID（可选）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '主机型号详情',
            'description' => '获取单个主机型号详情',
            'url' => 'rest-override.php?endpoint=host-models&id={id}',
            'method' => 'GET',
            'params' => array(
                'id' => '主机型号ID（必填）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '配件列表',
            'description' => '获取所有配件',
            'url' => 'rest-override.php?endpoint=accessories',
            'method' => 'GET',
            'params' => array(
                'page' => '页码（默认为1）',
                'per_page' => '每页数量（默认为10）',
                'status' => '状态（默认为publish）',
                'host_model_id' => '主机型号ID（可选）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '配件详情',
            'description' => '获取单个配件详情',
            'url' => 'rest-override.php?endpoint=accessories&id={id}',
            'method' => 'GET',
            'params' => array(
                'id' => '配件ID（必填）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '耗材列表',
            'description' => '获取所有耗材',
            'url' => 'rest-override.php?endpoint=consumables',
            'method' => 'GET',
            'params' => array(
                'page' => '页码（默认为1）',
                'per_page' => '每页数量（默认为10）',
                'status' => '状态（默认为publish）',
                'host_model_id' => '主机型号ID（可选）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '耗材详情',
            'description' => '获取单个耗材详情',
            'url' => 'rest-override.php?endpoint=consumables&id={id}',
            'method' => 'GET',
            'params' => array(
                'id' => '耗材ID（必填）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '零部件列表',
            'description' => '获取所有零部件',
            'url' => 'rest-override.php?endpoint=spare-parts',
            'method' => 'GET',
            'params' => array(
                'page' => '页码（默认为1）',
                'per_page' => '每页数量（默认为10）',
                'status' => '状态（默认为publish）',
                'host_model_id' => '主机型号ID（可选）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '零部件详情',
            'description' => '获取单个零部件详情',
            'url' => 'rest-override.php?endpoint=spare-parts&id={id}',
            'method' => 'GET',
            'params' => array(
                'id' => '零部件ID（必填）',
                'lang' => '语言（zh或en，默认为zh）'
            )
        ),
        array(
            'name' => '用户登录',
            'description' => '用户登录并获取令牌',
            'url' => 'rest-override.php?endpoint=auth/login',
            'method' => 'POST',
            'params' => array(
                'username' => '用户名（必填）',
                'password' => '密码（必填）'
            ),
            'body_example' => json_encode(array(
                'username' => 'admin',
                'password' => 'password'
            ), JSON_UNESCAPED_UNICODE)
        )
    ),
    'common_response_format' => array(
        'success' => 'true/false，表示请求是否成功',
        'data' => '返回的数据，仅在success为true时存在',
        'message' => '错误消息，仅在success为false时存在',
        'code' => '错误代码，仅在success为false时存在'
    ),
    'example_list_response' => array(
        'success' => true,
        'data' => array(
            'items' => array(/* 项目数组 */),
            'total' => 42, // 总项目数
            'page' => 1, // 当前页码
            'per_page' => 10, // 每页项目数
            'total_pages' => 5 // 总页数
        )
    ),
    'troubleshooting' => array(
        'rest_api_issue' => 'WordPress REST API目前存在问题，正在解决中',
        'alternative' => '在解决问题之前，请使用此直接API访问方法',
        'contact' => '如有问题，请联系开发人员'
    )
);

// 输出JSON
echo json_encode($api_info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); 