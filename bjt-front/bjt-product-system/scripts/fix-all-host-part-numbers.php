<?php
/**
 * 修复所有关系表中错误的host_part_number字段
 * 
 * 使用方法：
 * php scripts/fix-all-host-part-numbers.php
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/../backend/wp-load.php');

function fix_all_host_part_numbers() {
    global $wpdb;
    
    $relations_table = $wpdb->prefix . 'bjt_relations';
    
    echo "=== 修复所有关系表的host_part_number字段 ===\n\n";
    
    // 获取所有关系记录
    $all_relations = $wpdb->get_results(
        "SELECT id, product_line_id, host_part_number, part_number, parent_part_number, child_part_number, level 
         FROM {$relations_table} 
         ORDER BY product_line_id ASC, level ASC, id ASC"
    );
    
    if (empty($all_relations)) {
        echo "❌ 没有找到关系记录\n";
        return;
    }
    
    echo "找到 " . count($all_relations) . " 条关系记录\n\n";
    
    // 按产品线分组处理
    $relations_by_product_line = [];
    foreach ($all_relations as $relation) {
        $relations_by_product_line[$relation->product_line_id][] = $relation;
    }
    
    $total_fixed = 0;
    $total_errors = 0;
    
    foreach ($relations_by_product_line as $product_line_id => $relations) {
        echo "处理产品线 {$product_line_id}:\n";
        
        // 找到所有主机料号（parent_part_number为null的记录）
        $hosts = array_filter($relations, function($r) {
            return empty($r->parent_part_number);
        });
        
        echo "  找到 " . count($hosts) . " 个主机:\n";
        foreach ($hosts as $host) {
            echo "    - {$host->part_number}\n";
        }
        
        // 为每个主机修复其子级关系
        foreach ($hosts as $host) {
            $host_part_number = $host->part_number;
            echo "  \n  修复主机 {$host_part_number} 的关系:\n";
            
            // 找到所有应属于此主机的关系（递归查找）
            $host_relations = find_all_descendant_relations($relations, $host_part_number);
            
            foreach ($host_relations as $relation) {
                if ($relation->host_part_number !== $host_part_number) {
                    echo "    修复 ID:{$relation->id} - {$relation->part_number} → {$relation->child_part_number}\n";
                    echo "      原host_part_number: {$relation->host_part_number}\n";
                    echo "      新host_part_number: {$host_part_number}\n";
                    
                    $update_result = $wpdb->update(
                        $relations_table,
                        ['host_part_number' => $host_part_number],
                        ['id' => $relation->id],
                        ['%s'],
                        ['%d']
                    );
                    
                    if ($update_result !== false) {
                        $total_fixed++;
                        echo "      ✅ 修复成功\n";
                    } else {
                        $total_errors++;
                        echo "      ❌ 修复失败: " . $wpdb->last_error . "\n";
                    }
                }
            }
        }
        
        echo "\n";
    }
    
    echo "=== 修复完成 ===\n";
    echo "总共修复: {$total_fixed} 条记录\n";
    echo "修复失败: {$total_errors} 条记录\n";
    
    // 验证修复结果
    echo "\n=== 验证修复结果 ===\n";
    verify_fix_results();
}

/**
 * 递归查找某个主机的所有后代关系
 */
function find_all_descendant_relations($all_relations, $host_part_number, $visited = []) {
    $descendants = [];
    
    // 防止循环引用
    if (in_array($host_part_number, $visited)) {
        return $descendants;
    }
    $visited[] = $host_part_number;
    
    // 找到所有以host_part_number为part_number的关系
    foreach ($all_relations as $relation) {
        if ($relation->part_number === $host_part_number) {
            $descendants[] = $relation;
            
            // 递归查找子级
            if (!empty($relation->child_part_number)) {
                $child_descendants = find_all_descendant_relations($all_relations, $relation->child_part_number, $visited);
                $descendants = array_merge($descendants, $child_descendants);
            }
        }
    }
    
    return $descendants;
}

/**
 * 验证修复结果
 */
function verify_fix_results() {
    global $wpdb;
    
    $relations_table = $wpdb->prefix . 'bjt_relations';
    
    // 检查是否还有不一致的host_part_number
    $inconsistent_relations = $wpdb->get_results("
        SELECT r1.id, r1.host_part_number, r1.part_number, r1.child_part_number, r1.product_line_id
        FROM {$relations_table} r1
        LEFT JOIN {$relations_table} r2 ON r1.host_part_number = r2.part_number 
            AND r2.parent_part_number IS NULL 
            AND r1.product_line_id = r2.product_line_id
        WHERE r2.id IS NULL AND r1.parent_part_number IS NOT NULL
    ");
    
    if (empty($inconsistent_relations)) {
        echo "✅ 所有host_part_number字段都已正确修复\n";
    } else {
        echo "❌ 仍有 " . count($inconsistent_relations) . " 条记录的host_part_number不正确:\n";
        foreach ($inconsistent_relations as $relation) {
            echo "  ID:{$relation->id} - host_part_number:{$relation->host_part_number}, 但在产品线{$relation->product_line_id}中找不到对应的主机记录\n";
        }
    }
    
    // 按产品线显示修复后的结构
    $product_lines = $wpdb->get_col("SELECT DISTINCT product_line_id FROM {$relations_table} ORDER BY product_line_id");
    
    foreach ($product_lines as $product_line_id) {
        echo "\n产品线 {$product_line_id} 的关系结构:\n";
        
        $relations = $wpdb->get_results($wpdb->prepare("
            SELECT id, host_part_number, part_number, parent_part_number, child_part_number, level
            FROM {$relations_table} 
            WHERE product_line_id = %d 
            ORDER BY host_part_number, level, id
        ", $product_line_id));
        
        $current_host = '';
        foreach ($relations as $relation) {
            if ($relation->host_part_number !== $current_host) {
                $current_host = $relation->host_part_number;
                echo "  主机: {$current_host}\n";
            }
            
            $indent = str_repeat('    ', $relation->level);
            echo "{$indent}[ID:{$relation->id}, Level:{$relation->level}] {$relation->part_number} → {$relation->child_part_number}\n";
        }
    }
}

// 运行修复
try {
    fix_all_host_part_numbers();
} catch (Exception $e) {
    echo "❌ 修复异常: " . $e->getMessage() . "\n";
    echo "异常追踪:\n" . $e->getTraceAsString() . "\n";
} 