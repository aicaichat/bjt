<?php
/**
 * 关联关系重复记录诊断脚本
 * 用于分析线上环境重复记录的根因
 */

if (!defined('ABSPATH')) {
    // 如果不在WordPress环境中，尝试加载WordPress
    $wp_config_path = dirname(__FILE__) . '/../wp-config.php';
    if (file_exists($wp_config_path)) {
        require_once $wp_config_path;
    } else {
        die("无法找到WordPress配置文件\n");
    }
}

class BJT_Duplicate_Relations_Diagnostics {
    private $wpdb;
    private $relations_table;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->relations_table = $wpdb->prefix . 'bjt_relations';
    }
    
    /**
     * 运行完整诊断
     */
    public function run_full_diagnostics($host_part_number = '60A01113', $product_line_id = 1) {
        echo "🔍 开始诊断关联关系重复记录问题...\n";
        echo "目标主机: {$host_part_number}\n";
        echo "产品线ID: {$product_line_id}\n";
        echo str_repeat("=", 80) . "\n";
        
        // 1. 检查数据库基本状态
        $this->check_database_basics();
        
        // 2. 检查重复记录
        $this->check_duplicate_records($host_part_number, $product_line_id);
        
        // 3. 分析分页查询
        $this->analyze_pagination_queries($host_part_number, $product_line_id);
        
        // 4. 检查数据库索引
        $this->check_database_indexes();
        
        // 5. 模拟API分页请求
        $this->simulate_api_pagination($host_part_number, $product_line_id);
        
        // 6. 检查数据库一致性
        $this->check_data_consistency($host_part_number, $product_line_id);
        
        echo "\n🎯 诊断完成\n";
    }
    
    /**
     * 1. 检查数据库基本状态
     */
    private function check_database_basics() {
        echo "\n📊 1. 数据库基本状态检查\n";
        echo str_repeat("-", 40) . "\n";
        
        // 检查表是否存在
        $table_exists = $this->wpdb->get_var("SHOW TABLES LIKE '{$this->relations_table}'");
        echo "表存在状态: " . ($table_exists ? "✅ 存在" : "❌ 不存在") . "\n";
        
        if (!$table_exists) {
            echo "❌ 表不存在，无法继续检查\n";
            return;
        }
        
        // 检查总记录数
        $total_records = $this->wpdb->get_var("SELECT COUNT(*) FROM {$this->relations_table}");
        echo "总记录数: {$total_records}\n";
        
        // 检查不同主机的数量
        $host_count = $this->wpdb->get_var("SELECT COUNT(DISTINCT host_part_number) FROM {$this->relations_table}");
        echo "不同主机数量: {$host_count}\n";
        
        // 检查数据库引擎
        $engine = $this->wpdb->get_var("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$this->relations_table}'");
        echo "数据库引擎: {$engine}\n";
    }
    
    /**
     * 2. 检查重复记录
     */
    private function check_duplicate_records($host_part_number, $product_line_id) {
        echo "\n🔍 2. 重复记录检查\n";
        echo str_repeat("-", 40) . "\n";
        
        // 检查完全重复的记录
        $duplicate_query = "
            SELECT 
                host_part_number,
                part_number, 
                parent_part_number, 
                child_part_number, 
                child_type,
                level,
                COUNT(*) as duplicate_count,
                GROUP_CONCAT(id ORDER BY id) as ids
            FROM {$this->relations_table} 
            WHERE host_part_number = %s AND product_line_id = %d
            GROUP BY host_part_number, part_number, parent_part_number, child_part_number, child_type, level
            HAVING COUNT(*) > 1
            ORDER BY duplicate_count DESC
        ";
        
        $duplicates = $this->wpdb->get_results($this->wpdb->prepare($duplicate_query, $host_part_number, $product_line_id));
        
        if (empty($duplicates)) {
            echo "✅ 未发现完全重复的记录\n";
        } else {
            echo "❌ 发现 " . count($duplicates) . " 组重复记录:\n";
            foreach ($duplicates as $dup) {
                echo "  - 重复{$dup->duplicate_count}次: {$dup->part_number} → {$dup->child_part_number} (IDs: {$dup->ids})\n";
            }
        }
        
        // 检查相同ID的记录（这不应该存在）
        $same_id_query = "
            SELECT id, COUNT(*) as count 
            FROM {$this->relations_table} 
            WHERE host_part_number = %s AND product_line_id = %d
            GROUP BY id 
            HAVING COUNT(*) > 1
        ";
        
        $same_ids = $this->wpdb->get_results($this->wpdb->prepare($same_id_query, $host_part_number, $product_line_id));
        
        if (empty($same_ids)) {
            echo "✅ 未发现相同ID的重复记录\n";
        } else {
            echo "❌ 发现相同ID的重复记录 (数据库严重错误):\n";
            foreach ($same_ids as $same) {
                echo "  - ID {$same->id} 出现 {$same->count} 次\n";
            }
        }
    }
    
    /**
     * 3. 分析分页查询
     */
    private function analyze_pagination_queries($host_part_number, $product_line_id) {
        echo "\n📄 3. 分页查询分析\n";
        echo str_repeat("-", 40) . "\n";
        
        $per_page = 100;
        $total_query = "SELECT COUNT(*) FROM {$this->relations_table} WHERE host_part_number = %s AND product_line_id = %d";
        $total = $this->wpdb->get_var($this->wpdb->prepare($total_query, $host_part_number, $product_line_id));
        
        echo "当前主机总记录数: {$total}\n";
        
        if ($total == 0) {
            echo "⚠️  当前主机无记录，跳过分页分析\n";
            return;
        }
        
        $total_pages = ceil($total / $per_page);
        echo "预期分页数: {$total_pages}\n";
        
        // 模拟分页查询，检查是否有重复
        $all_ids = [];
        $duplicate_ids = [];
        
        for ($page = 1; $page <= $total_pages; $page++) {
            $offset = ($page - 1) * $per_page;
            
            // 模拟API查询逻辑
            $page_query = "
                SELECT id, part_number, child_part_number 
                FROM {$this->relations_table} 
                WHERE host_part_number = %s AND product_line_id = %d
                ORDER BY id DESC 
                LIMIT %d OFFSET %d
            ";
            
            $page_results = $this->wpdb->get_results($this->wpdb->prepare(
                $page_query, 
                $host_part_number, 
                $product_line_id, 
                $per_page, 
                $offset
            ));
            
            echo "第{$page}页: " . count($page_results) . " 条记录\n";
            
            foreach ($page_results as $result) {
                if (in_array($result->id, $all_ids)) {
                    $duplicate_ids[] = $result->id;
                    echo "  ❌ 重复ID: {$result->id} ({$result->part_number} → {$result->child_part_number})\n";
                } else {
                    $all_ids[] = $result->id;
                }
            }
        }
        
        if (empty($duplicate_ids)) {
            echo "✅ 分页查询无重复ID\n";
        } else {
            echo "❌ 分页查询发现重复ID: " . implode(', ', $duplicate_ids) . "\n";
        }
    }
    
    /**
     * 4. 检查数据库索引
     */
    private function check_database_indexes() {
        echo "\n📊 4. 数据库索引检查\n";
        echo str_repeat("-", 40) . "\n";
        
        $indexes = $this->wpdb->get_results("SHOW INDEX FROM {$this->relations_table}");
        
        if (empty($indexes)) {
            echo "❌ 表没有任何索引\n";
            return;
        }
        
        echo "当前索引:\n";
        $index_info = [];
        foreach ($indexes as $index) {
            $key_name = $index->Key_name;
            if (!isset($index_info[$key_name])) {
                $index_info[$key_name] = [];
            }
            $index_info[$key_name][] = $index->Column_name;
        }
        
        foreach ($index_info as $index_name => $columns) {
            echo "  - {$index_name}: " . implode(', ', $columns) . "\n";
        }
        
        // 检查关键索引是否存在
        $key_columns = ['host_part_number', 'product_line_id', 'id'];
        foreach ($key_columns as $column) {
            $has_index = false;
            foreach ($index_info as $columns) {
                if (in_array($column, $columns)) {
                    $has_index = true;
                    break;
                }
            }
            echo ($has_index ? "✅" : "❌") . " {$column} 列有索引\n";
        }
    }
    
    /**
     * 5. 模拟API分页请求
     */
    private function simulate_api_pagination($host_part_number, $product_line_id) {
        echo "\n🔄 5. 模拟API分页请求\n";
        echo str_repeat("-", 40) . "\n";
        
        // 模拟前端API请求的完整逻辑
        $per_page = 100;
        $page = 1;
        $all_relations = [];
        $page_results = [];
        
        do {
            $offset = ($page - 1) * $per_page;
            
            // 完全模拟API控制器的查询逻辑
            $where_clauses = ["1=1"];
            $where_values = [];
            
            // 产品线ID筛选
            $where_clauses[] = "product_line_id = %d";
            $where_values[] = $product_line_id;
            
            // 主机料号筛选（注意：这里可能是问题所在）
            $where_clauses[] = "host_part_number = %s";
            $where_values[] = $host_part_number;
            
            $where_sql = implode(" AND ", $where_clauses);
            
            // 获取总数
            $count_query = "SELECT COUNT(id) FROM {$this->relations_table} WHERE {$where_sql}";
            $total_items = (int) $this->wpdb->get_var($this->wpdb->prepare($count_query, $where_values));
            
            // 获取分页数据
            $items_query = "SELECT * FROM {$this->relations_table} WHERE {$where_sql} ORDER BY id DESC LIMIT %d OFFSET %d";
            $query_values = array_merge($where_values, [$per_page, $offset]);
            $items = $this->wpdb->get_results($this->wpdb->prepare($items_query, $query_values));
            
            echo "API第{$page}页: 查询到 " . count($items) . " 条记录 (总数: {$total_items})\n";
            
            if (empty($items)) {
                break;
            }
            
            // 检查当前页是否有重复ID
            $current_page_ids = array_column($items, 'id');
            $previous_ids = array_column($all_relations, 'id');
            $duplicate_in_page = array_intersect($current_page_ids, $previous_ids);
            
            if (!empty($duplicate_in_page)) {
                echo "  ❌ 当前页与之前页面有重复ID: " . implode(', ', $duplicate_in_page) . "\n";
            }
            
            $all_relations = array_merge($all_relations, $items);
            $page_results[] = [
                'page' => $page,
                'count' => count($items),
                'ids' => $current_page_ids
            ];
            
            $total_pages = ceil($total_items / $per_page);
            $page++;
            
        } while ($page <= $total_pages);
        
        // 最终重复检查
        $all_ids = array_column($all_relations, 'id');
        $unique_ids = array_unique($all_ids);
        
        if (count($all_ids) === count($unique_ids)) {
            echo "✅ API模拟查询无重复记录\n";
        } else {
            echo "❌ API模拟查询发现重复记录\n";
            $duplicates = array_diff_assoc($all_ids, $unique_ids);
            echo "  重复的ID: " . implode(', ', $duplicates) . "\n";
        }
        
        echo "总页数: " . count($page_results) . "\n";
        echo "总记录数: " . count($all_relations) . "\n";
        echo "唯一记录数: " . count($unique_ids) . "\n";
    }
    
    /**
     * 6. 检查数据一致性
     */
    private function check_data_consistency($host_part_number, $product_line_id) {
        echo "\n🔍 6. 数据一致性检查\n";
        echo str_repeat("-", 40) . "\n";
        
        // 检查host_part_number字段的数据类型和值
        $host_field_info = $this->wpdb->get_results("DESCRIBE {$this->relations_table} host_part_number");
        if (!empty($host_field_info)) {
            $field = $host_field_info[0];
            echo "host_part_number字段类型: {$field->Type}\n";
            echo "允许NULL: {$field->Null}\n";
            echo "默认值: " . ($field->Default ?? 'NULL') . "\n";
        }
        
        // 检查特定主机的所有记录
        $host_records = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT id, host_part_number, part_number, child_part_number, product_line_id 
             FROM {$this->relations_table} 
             WHERE host_part_number = %s AND product_line_id = %d 
             ORDER BY id",
            $host_part_number,
            $product_line_id
        ));
        
        echo "指定主机记录数: " . count($host_records) . "\n";
        
        if (count($host_records) > 0) {
            echo "记录ID范围: {$host_records[0]->id} - " . end($host_records)->id . "\n";
            
            // 检查是否有ID缺失（可能导致分页问题）
            $expected_sequence = range($host_records[0]->id, end($host_records)->id);
            $actual_ids = array_column($host_records, 'id');
            $missing_ids = array_diff($expected_sequence, $actual_ids);
            
            if (!empty($missing_ids)) {
                echo "⚠️  ID序列有缺失: " . implode(', ', array_slice($missing_ids, 0, 10));
                if (count($missing_ids) > 10) {
                    echo " ... (+" . (count($missing_ids) - 10) . " more)";
                }
                echo "\n";
            } else {
                echo "✅ ID序列连续\n";
            }
        }
        
        // 检查其他主机是否有类似数据
        $other_hosts = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT host_part_number, COUNT(*) as count 
             FROM {$this->relations_table} 
             WHERE product_line_id = %d AND host_part_number != %s
             GROUP BY host_part_number 
             ORDER BY count DESC 
             LIMIT 5",
            $product_line_id,
            $host_part_number
        ));
        
        echo "其他主机记录数对比:\n";
        foreach ($other_hosts as $host) {
            echo "  - {$host->host_part_number}: {$host->count} 条记录\n";
        }
    }
    
    /**
     * 生成修复建议
     */
    public function generate_fix_recommendations($host_part_number = '60A01113', $product_line_id = 1) {
        echo "\n💡 修复建议\n";
        echo str_repeat("=", 40) . "\n";
        
        // 基于诊断结果提供建议
        echo "1. 🔧 数据库层面修复:\n";
        echo "   - 添加唯一索引防止重复数据\n";
        echo "   - 优化排序索引提高查询性能\n";
        echo "   - 清理已存在的重复记录\n\n";
        
        echo "2. 🌐 API层面优化:\n";
        echo "   - 强化去重逻辑\n";
        echo "   - 添加请求缓存标识\n";
        echo "   - 优化分页查询逻辑\n\n";
        
        echo "3. 🔍 监控和预防:\n";
        echo "   - 定期运行此诊断脚本\n";
        echo "   - 监控API响应时间\n";
        echo "   - 记录重复数据出现频率\n\n";
    }
}

// 如果直接运行此脚本
if (php_sapi_name() === 'cli') {
    $diagnostics = new BJT_Duplicate_Relations_Diagnostics();
    
    // 从命令行参数获取主机号和产品线ID
    $host_part_number = isset($argv[1]) ? $argv[1] : '60A01113';
    $product_line_id = isset($argv[2]) ? intval($argv[2]) : 1;
    
    $diagnostics->run_full_diagnostics($host_part_number, $product_line_id);
    $diagnostics->generate_fix_recommendations($host_part_number, $product_line_id);
} 