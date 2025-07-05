<?php
/**
 * 修复关联关系API过滤逻辑问题
 * 问题：API没有正确按host_part_number参数过滤数据
 */

if (!defined('ABSPATH')) {
    // 在WordPress环境中运行
    require_once '/var/www/html/wp-config.php';
}

class BJT_Relations_API_Filter_Fix {
    private $wpdb;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }
    
    /**
     * 诊断API过滤问题
     */
    public function diagnose_filter_issue() {
        echo "🔍 诊断关联关系API过滤问题...\n";
        echo str_repeat("=", 60) . "\n";
        
        // 1. 检查关系表结构
        $this->check_table_structure();
        
        // 2. 测试查询逻辑
        $this->test_query_logic();
        
        // 3. 检查API控制器逻辑
        $this->check_api_controller();
    }
    
    /**
     * 检查表结构
     */
    private function check_table_structure() {
        echo "\n📊 1. 检查数据库表结构\n";
        echo str_repeat("-", 40) . "\n";
        
        $relations_table = $this->wpdb->prefix . 'bjt_relations';
        
        // 检查表是否存在
        $table_exists = $this->wpdb->get_var("SHOW TABLES LIKE '{$relations_table}'");
        if (!$table_exists) {
            echo "❌ 表不存在: {$relations_table}\n";
            return;
        }
        
        // 检查字段结构
        $columns = $this->wpdb->get_results("DESCRIBE {$relations_table}");
        echo "✅ 表存在，字段结构:\n";
        
        $has_host_field = false;
        foreach ($columns as $column) {
            if ($column->Field === 'host_part_number') {
                $has_host_field = true;
                echo "  ✅ host_part_number: {$column->Type}\n";
            }
            if (in_array($column->Field, ['product_line_id', 'part_number', 'child_part_number'])) {
                echo "  - {$column->Field}: {$column->Type}\n";
            }
        }
        
        if (!$has_host_field) {
            echo "  ❌ 缺少 host_part_number 字段\n";
        }
    }
    
    /**
     * 测试查询逻辑
     */
    private function test_query_logic() {
        echo "\n🔍 2. 测试查询逻辑\n";
        echo str_repeat("-", 40) . "\n";
        
        $relations_table = $this->wpdb->prefix . 'bjt_relations';
        $test_host = '60A01113';
        $test_product_line = 1;
        
        // 模拟正确的查询逻辑
        echo "测试参数:\n";
        echo "  主机料号: {$test_host}\n";
        echo "  产品线ID: {$test_product_line}\n\n";
        
        // 1. 正确的查询（应该只返回指定主机的数据）
        $correct_query = "
            SELECT COUNT(*) as count, host_part_number 
            FROM {$relations_table} 
            WHERE host_part_number = %s AND product_line_id = %d
            GROUP BY host_part_number
        ";
        
        $correct_results = $this->wpdb->get_results(
            $this->wpdb->prepare($correct_query, $test_host, $test_product_line)
        );
        
        echo "✅ 正确查询结果:\n";
        foreach ($correct_results as $result) {
            echo "  - {$result->host_part_number}: {$result->count} 条记录\n";
        }
        
        // 2. 错误的查询（当前API可能的查询方式）
        $wrong_query = "
            SELECT COUNT(*) as count, host_part_number 
            FROM {$relations_table} 
            WHERE product_line_id = %d
            GROUP BY host_part_number
            ORDER BY count DESC
            LIMIT 10
        ";
        
        $wrong_results = $this->wpdb->get_results(
            $this->wpdb->prepare($wrong_query, $test_product_line)
        );
        
        echo "\n❌ 错误查询结果（当前API可能的情况）:\n";
        foreach ($wrong_results as $result) {
            echo "  - {$result->host_part_number}: {$result->count} 条记录\n";
        }
        
        // 3. 检查具体的API查询
        echo "\n🔍 模拟API查询:\n";
        $api_query = "
            SELECT * FROM {$relations_table} 
            WHERE product_line_id = %d
            ORDER BY id DESC 
            LIMIT 10
        ";
        
        $api_results = $this->wpdb->get_results(
            $this->wpdb->prepare($api_query, $test_product_line)
        );
        
        echo "API查询返回的记录:\n";
        foreach ($api_results as $record) {
            $match = ($record->host_part_number === $test_host) ? "✅" : "❌";
            echo "  {$match} ID:{$record->id} | Host:{$record->host_part_number} | Child:{$record->child_part_number}\n";
        }
    }
    
    /**
     * 检查API控制器
     */
    private function check_api_controller() {
        echo "\n🔧 3. 检查API控制器逻辑\n";
        echo str_repeat("-", 40) . "\n";
        
        // 查找关联关系API控制器文件
        $controller_paths = [
            '/var/www/html/wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php',
            '/var/www/html/wp-content/plugins/bjt-product-admin/includes/api/class-bjt-relations-controller.php'
        ];
        
        foreach ($controller_paths as $path) {
            if (file_exists($path)) {
                echo "✅ 找到控制器文件: {$path}\n";
                $this->analyze_controller_file($path);
            } else {
                echo "❌ 控制器文件不存在: {$path}\n";
            }
        }
    }
    
    /**
     * 分析控制器文件
     */
    private function analyze_controller_file($file_path) {
        $content = file_get_contents($file_path);
        
        // 检查关键的过滤逻辑
        if (strpos($content, 'host_part_number') !== false) {
            echo "  ✅ 代码中包含 host_part_number 字段\n";
        } else {
            echo "  ❌ 代码中缺少 host_part_number 字段处理\n";
        }
        
        // 检查WHERE子句构建
        if (strpos($content, 'WHERE') !== false) {
            echo "  ✅ 包含WHERE子句构建逻辑\n";
        }
        
        // 检查参数获取
        if (strpos($content, 'get_param') !== false) {
            echo "  ✅ 包含参数获取逻辑\n";
        }
        
        // 查找可能的问题模式
        $problematic_patterns = [
            'WHERE product_line_id = %d' => '可能缺少host_part_number过滤',
            'WHERE 1=1' => '可能使用了通用WHERE子句但缺少具体过滤'
        ];
        
        foreach ($problematic_patterns as $pattern => $issue) {
            if (strpos($content, $pattern) !== false) {
                echo "  ⚠️  发现潜在问题: {$issue}\n";
            }
        }
    }
    
    /**
     * 生成修复建议
     */
    public function generate_fix_suggestions() {
        echo "\n💡 修复建议\n";
        echo str_repeat("=", 60) . "\n";
        
        echo "1. 🔧 立即修复措施:\n";
        echo "   - 检查API控制器中的WHERE子句构建逻辑\n";
        echo "   - 确保 host_part_number 参数被正确添加到查询条件中\n";
        echo "   - 验证参数获取和传递逻辑\n\n";
        
        echo "2. 🎯 具体修复步骤:\n";
        echo "   a) 找到关联关系API控制器\n";
        echo "   b) 检查 get_items() 方法\n";
        echo "   c) 确保 WHERE 子句包含：host_part_number = %s\n";
        echo "   d) 验证参数绑定正确\n\n";
        
        echo "3. 🧪 测试验证:\n";
        echo "   - 直接测试API端点\n";
        echo "   - 确认只返回指定主机的数据\n";
        echo "   - 验证前端显示正常\n\n";
        
        echo "4. 📋 监控措施:\n";
        echo "   - 添加API请求日志\n";
        echo "   - 监控返回的数据量\n";
        echo "   - 定期验证过滤逻辑\n\n";
    }
    
    /**
     * 模拟正确的API响应
     */
    public function simulate_correct_response($host_part_number = '60A01113', $product_line_id = 1) {
        echo "\n🎯 模拟正确的API响应\n";
        echo str_repeat("=", 60) . "\n";
        
        $relations_table = $this->wpdb->prefix . 'bjt_relations';
        
        // 正确的查询逻辑
        $query = "
            SELECT * FROM {$relations_table} 
            WHERE host_part_number = %s 
            AND product_line_id = %d 
            ORDER BY id DESC 
            LIMIT 100
        ";
        
        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, $host_part_number, $product_line_id)
        );
        
        $total_query = "
            SELECT COUNT(*) FROM {$relations_table} 
            WHERE host_part_number = %s 
            AND product_line_id = %d
        ";
        
        $total = $this->wpdb->get_var(
            $this->wpdb->prepare($total_query, $host_part_number, $product_line_id)
        );
        
        echo "正确的API响应应该是:\n";
        echo "{\n";
        echo "  \"items\": [\n";
        
        foreach ($results as $index => $item) {
            if ($index > 0) echo ",\n";
            echo "    {\n";
            echo "      \"id\": {$item->id},\n";
            echo "      \"host_part_number\": \"{$item->host_part_number}\",\n";
            echo "      \"child_part_number\": \"{$item->child_part_number}\"\n";
            echo "    }";
        }
        
        echo "\n  ],\n";
        echo "  \"total\": {$total},\n";
        echo "  \"page\": 1,\n";
        echo "  \"per_page\": 100\n";
        echo "}\n\n";
        
        echo "📊 统计信息:\n";
        echo "  - 总记录数: {$total}\n";
        echo "  - 返回记录数: " . count($results) . "\n";
        echo "  - 主机匹配率: 100% (所有记录都属于 {$host_part_number})\n";
    }
}

// 如果直接运行此脚本
if (php_sapi_name() === 'cli') {
    $fixer = new BJT_Relations_API_Filter_Fix();
    
    echo "🚨 关联关系API过滤问题诊断和修复\n";
    echo "发现问题：API返回了所有主机的数据，而不是指定主机的数据\n\n";
    
    $fixer->diagnose_filter_issue();
    $fixer->generate_fix_suggestions();
    $fixer->simulate_correct_response();
} 