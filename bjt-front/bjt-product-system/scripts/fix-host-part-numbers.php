<?php
/**
 * 修复关系表中错误的host_part_number字段
 * 
 * 使用方法：
 * php scripts/fix-host-part-numbers.php
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/../backend/wp-load.php');

function fix_host_part_numbers() {
    global $wpdb;
    
    $relations_table = $wpdb->prefix . 'bjt_relations';
    
    echo "开始修复关系表中的host_part_number字段...\n";
    
    // 获取所有关系记录
    $relations = $wpdb->get_results("
        SELECT id, product_line_id, part_number, parent_part_number, child_part_number, host_part_number 
        FROM {$relations_table} 
        ORDER BY id ASC
    ");
    
    if (!$relations) {
        echo "没有找到关系记录。\n";
        return;
    }
    
    echo "找到 " . count($relations) . " 条关系记录。\n";
    
    $updated_count = 0;
    $error_count = 0;
    
    foreach ($relations as $relation) {
        try {
            $correct_host_part_number = find_correct_host_part_number($relation, $relations);
            
            if ($correct_host_part_number !== $relation->host_part_number) {
                // 更新记录
                $result = $wpdb->update(
                    $relations_table,
                    ['host_part_number' => $correct_host_part_number],
                    ['id' => $relation->id],
                    ['%s'],
                    ['%d']
                );
                
                if ($result !== false) {
                    echo "已更新记录 ID {$relation->id}: {$relation->host_part_number} -> {$correct_host_part_number}\n";
                    $updated_count++;
                } else {
                    echo "更新记录 ID {$relation->id} 失败: " . $wpdb->last_error . "\n";
                    $error_count++;
                }
            } else {
                echo "记录 ID {$relation->id} 的host_part_number已正确: {$relation->host_part_number}\n";
            }
        } catch (Exception $e) {
            echo "处理记录 ID {$relation->id} 时出错: " . $e->getMessage() . "\n";
            $error_count++;
        }
    }
    
    echo "\n修复完成！\n";
    echo "更新记录数: {$updated_count}\n";
    echo "错误记录数: {$error_count}\n";
    echo "总记录数: " . count($relations) . "\n";
}

function find_correct_host_part_number($relation, $all_relations) {
    // 如果parent_part_number为空，说明这是主机记录
    if (empty($relation->parent_part_number)) {
        return $relation->part_number;
    }
    
    // 否则需要递归查找主机
    return find_root_host_part_number_recursive($relation->child_part_number, $relation->product_line_id, $all_relations);
}

function find_root_host_part_number_recursive($part_number, $product_line_id, $all_relations, $visited = []) {
    // 防止循环引用
    if (in_array($part_number, $visited)) {
        throw new Exception("检测到循环引用: " . implode(' -> ', $visited) . " -> {$part_number}");
    }
    $visited[] = $part_number;
    
    // 查找以当前料号为child_part_number的关系
    $parent_relation = null;
    foreach ($all_relations as $rel) {
        if ($rel->child_part_number === $part_number && $rel->product_line_id == $product_line_id) {
            $parent_relation = $rel;
            break;
        }
    }
    
    if (!$parent_relation) {
        // 如果找不到父级关系，当前料号就是主机
        return $part_number;
    }
    
    if (empty($parent_relation->parent_part_number)) {
        // 如果parent_part_number为null，说明父级是主机
        return $parent_relation->part_number;
    } else {
        // 如果父级还有父级，继续向上递归查找
        return find_root_host_part_number_recursive($parent_relation->part_number, $product_line_id, $all_relations, $visited);
    }
}

// 执行修复
if (php_sapi_name() === 'cli') {
    fix_host_part_numbers();
} else {
    echo "此脚本只能在命令行模式下运行。\n";
} 