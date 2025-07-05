<?php
/**
 * 关联关系重复记录修复脚本
 * 用于清理数据库中的重复记录
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

class BJT_Duplicate_Relations_Fixer {
    private $wpdb;
    private $relations_table;
    private $dry_run = true;
    
    public function __construct($dry_run = true) {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->relations_table = $wpdb->prefix . 'bjt_relations';
        $this->dry_run = $dry_run;
    }
    
    /**
     * 运行完整修复
     */
    public function run_fix($host_part_number = '60A01113', $product_line_id = 1) {
        echo "🔧 开始修复关联关系重复记录...\n";
        echo "目标主机: {$host_part_number}\n";
        echo "产品线ID: {$product_line_id}\n";
        echo "模式: " . ($this->dry_run ? "预览模式（不实际修改）" : "执行模式（实际修改）") . "\n";
        echo str_repeat("=", 80) . "\n";
        
        // 1. 检查重复记录
        $duplicates = $this->find_duplicate_records($host_part_number, $product_line_id);
        
        if (empty($duplicates)) {
            echo "✅ 没有发现重复记录，无需修复\n";
            return;
        }
        
        echo "🔍 发现 " . count($duplicates) . " 组重复记录\n\n";
        
        // 2. 显示重复记录详情
        $this->display_duplicates($duplicates);
        
        // 3. 执行修复
        if ($this->dry_run) {
            echo "🔍 预览模式：以上重复记录将被修复\n";
            echo "💡 要执行实际修复，请运行: php " . basename(__FILE__) . " {$host_part_number} {$product_line_id} --execute\n";
        } else {
            $this->execute_fix($duplicates);
        }
    }
    
    /**
     * 查找重复记录
     */
    private function find_duplicate_records($host_part_number, $product_line_id) {
        $duplicate_query = "
            SELECT 
                host_part_number,
                part_number, 
                parent_part_number, 
                child_part_number, 
                child_type,
                level,
                COUNT(*) as duplicate_count,
                GROUP_CONCAT(id ORDER BY id) as ids,
                GROUP_CONCAT(created_at ORDER BY id) as created_dates
            FROM {$this->relations_table} 
            WHERE host_part_number = %s AND product_line_id = %d
            GROUP BY host_part_number, part_number, parent_part_number, child_part_number, child_type, level
            HAVING COUNT(*) > 1
            ORDER BY duplicate_count DESC, part_number
        ";
        
        return $this->wpdb->get_results($this->wpdb->prepare($duplicate_query, $host_part_number, $product_line_id));
    }
    
    /**
     * 显示重复记录详情
     */
    private function display_duplicates($duplicates) {
        echo "📋 重复记录详情:\n";
        echo str_repeat("-", 120) . "\n";
        printf("%-10s %-15s %-15s %-15s %-10s %-10s %s\n", 
            "重复次数", "主机料号", "料号", "子料号", "类型", "层级", "记录IDs");
        echo str_repeat("-", 120) . "\n";
        
        foreach ($duplicates as $dup) {
            printf("%-10d %-15s %-15s %-15s %-10s %-10d %s\n", 
                $dup->duplicate_count,
                $dup->host_part_number,
                $dup->part_number ?? 'NULL',
                $dup->child_part_number ?? 'NULL',
                $dup->child_type ?? 'NULL',
                $dup->level,
                $dup->ids
            );
        }
        echo str_repeat("-", 120) . "\n";
    }
    
    /**
     * 执行修复
     */
    private function execute_fix($duplicates) {
        echo "🔧 开始执行修复...\n";
        
        $total_removed = 0;
        $total_groups = count($duplicates);
        
        // 开始事务
        $this->wpdb->query('START TRANSACTION');
        
        try {
            foreach ($duplicates as $index => $dup) {
                echo "修复第 " . ($index + 1) . "/{$total_groups} 组重复记录...\n";
                
                $ids = explode(',', $dup->ids);
                $created_dates = explode(',', $dup->created_dates);
                
                // 保留最早创建的记录（ID最小的）
                $keep_id = min($ids);
                $remove_ids = array_filter($ids, function($id) use ($keep_id) {
                    return $id != $keep_id;
                });
                
                echo "  保留记录ID: {$keep_id}\n";
                echo "  删除记录ID: " . implode(', ', $remove_ids) . "\n";
                
                // 删除重复记录
                if (!empty($remove_ids)) {
                    $id_placeholders = implode(',', array_fill(0, count($remove_ids), '%d'));
                    $delete_query = "DELETE FROM {$this->relations_table} WHERE id IN ({$id_placeholders})";
                    $result = $this->wpdb->query($this->wpdb->prepare($delete_query, $remove_ids));
                    
                    if ($result === false) {
                        throw new Exception("删除记录失败: " . $this->wpdb->last_error);
                    }
                    
                    $total_removed += count($remove_ids);
                    echo "  ✅ 删除了 " . count($remove_ids) . " 条重复记录\n";
                }
                
                echo "\n";
            }
            
            // 提交事务
            $this->wpdb->query('COMMIT');
            
            echo "✅ 修复完成!\n";
            echo "总共删除了 {$total_removed} 条重复记录\n";
            echo "保留了 {$total_groups} 条唯一记录\n";
            
        } catch (Exception $e) {
            // 回滚事务
            $this->wpdb->query('ROLLBACK');
            echo "❌ 修复失败: " . $e->getMessage() . "\n";
            echo "已回滚所有更改\n";
        }
    }
    
    /**
     * 创建备份
     */
    private function create_backup($host_part_number, $product_line_id) {
        $backup_table = $this->relations_table . '_backup_' . date('Y_m_d_H_i_s');
        
        $backup_query = "
            CREATE TABLE {$backup_table} AS 
            SELECT * FROM {$this->relations_table} 
            WHERE host_part_number = %s AND product_line_id = %d
        ";
        
        $result = $this->wpdb->query($this->wpdb->prepare($backup_query, $host_part_number, $product_line_id));
        
        if ($result !== false) {
            echo "✅ 备份创建成功: {$backup_table}\n";
            return $backup_table;
        } else {
            echo "❌ 备份创建失败: " . $this->wpdb->last_error . "\n";
            return false;
        }
    }
    
    /**
     * 添加唯一索引防止未来重复
     */
    public function add_unique_index() {
        echo "🔧 添加唯一索引防止重复记录...\n";
        
        $index_name = 'unique_relation_context';
        
        // 检查索引是否已存在
        $existing_index = $this->wpdb->get_var("
            SELECT COUNT(*) FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name = '{$this->relations_table}' 
            AND index_name = '{$index_name}'
        ");
        
        if ($existing_index > 0) {
            echo "✅ 唯一索引已存在\n";
            return;
        }
        
        // 创建唯一索引
        $create_index_query = "
            ALTER TABLE {$this->relations_table} 
            ADD UNIQUE KEY {$index_name} (host_part_number, part_number, parent_part_number, child_part_number, child_type, level)
        ";
        
        if ($this->dry_run) {
            echo "🔍 预览模式：将执行以下SQL:\n";
            echo $create_index_query . "\n";
        } else {
            $result = $this->wpdb->query($create_index_query);
            
            if ($result !== false) {
                echo "✅ 唯一索引创建成功\n";
            } else {
                echo "❌ 唯一索引创建失败: " . $this->wpdb->last_error . "\n";
            }
        }
    }
    
    /**
     * 优化表
     */
    public function optimize_table() {
        echo "🔧 优化表结构...\n";
        
        if ($this->dry_run) {
            echo "🔍 预览模式：将执行表优化\n";
        } else {
            $result = $this->wpdb->query("OPTIMIZE TABLE {$this->relations_table}");
            
            if ($result !== false) {
                echo "✅ 表优化完成\n";
            } else {
                echo "❌ 表优化失败: " . $this->wpdb->last_error . "\n";
            }
        }
    }
}

// 如果直接运行此脚本
if (php_sapi_name() === 'cli') {
    // 从命令行参数获取参数
    $host_part_number = isset($argv[1]) ? $argv[1] : '60A01113';
    $product_line_id = isset($argv[2]) ? intval($argv[2]) : 1;
    $execute = isset($argv[3]) && $argv[3] === '--execute';
    
    // 创建修复器实例
    $fixer = new BJT_Duplicate_Relations_Fixer(!$execute);
    
    // 运行修复
    $fixer->run_fix($host_part_number, $product_line_id);
    
    // 如果是执行模式，添加索引和优化表
    if ($execute) {
        echo "\n";
        $fixer->add_unique_index();
        $fixer->optimize_table();
    }
} 