<?php
/**
 * 测试级联删除逻辑的脚本
 * 
 * 用于验证修复后的级联删除逻辑是否正确工作
 * 确保只删除选中记录的子树，不会误删其他分支
 */

// 引入WordPress环境
require_once dirname(__FILE__) . '/../wp-config.php';
require_once dirname(__FILE__) . '/../plugins/bjt-core-entities/controllers/class-relation-controller.php';

class CascadeDeleteTester {
    private $wpdb;
    private $table_name;
    private $test_relations = [];
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_relations';
    }
    
    /**
     * 运行完整的测试套件
     */
    public function run_tests() {
        echo "🧪 开始测试级联删除逻辑...\n\n";
        
        // 1. 清理测试数据
        $this->cleanup_test_data();
        
        // 2. 创建测试数据
        $this->create_test_data();
        
        // 3. 显示测试数据结构
        $this->display_test_structure();
        
        // 4. 测试级联删除
        $this->test_cascade_delete();
        
        // 5. 验证结果
        $this->verify_results();
        
        // 6. 清理测试数据
        $this->cleanup_test_data();
        
        echo "\n✅ 测试完成！\n";
    }
    
    /**
     * 创建测试数据
     */
    private function create_test_data() {
        echo "📝 创建测试数据...\n";
        
        $test_data = [
            // 主机关系
            [
                'id' => 1000,
                'product_line_id' => 1,
                'host_part_number' => 'TEST_HOST',
                'part_number' => 'TEST_HOST',
                'parent_part_number' => null,
                'child_part_number' => 'PART_A',
                'level' => 1,
                'quantity' => 1,
                'status' => 'publish'
            ],
            [
                'id' => 1001,
                'product_line_id' => 1,
                'host_part_number' => 'TEST_HOST',
                'part_number' => 'TEST_HOST',
                'parent_part_number' => null,
                'child_part_number' => 'PART_B',
                'level' => 1,
                'quantity' => 1,
                'status' => 'publish'
            ],
            
            // 分支1：TEST_HOST → PART_A → PART_X → PART_Y
            [
                'id' => 1100,
                'product_line_id' => 1,
                'host_part_number' => 'TEST_HOST',
                'part_number' => 'PART_A',
                'parent_part_number' => 'TEST_HOST',
                'child_part_number' => 'PART_X',
                'level' => 2,
                'quantity' => 2,
                'status' => 'publish'
            ],
            [
                'id' => 1110,
                'product_line_id' => 1,
                'host_part_number' => 'TEST_HOST',
                'part_number' => 'PART_X',
                'parent_part_number' => 'PART_A',
                'child_part_number' => 'PART_Y',
                'level' => 3,
                'quantity' => 1,
                'status' => 'publish'
            ],
            
            // 分支2：TEST_HOST → PART_B → PART_X → PART_Z
            // 注意：这里PART_X在不同分支中出现
            [
                'id' => 1200,
                'product_line_id' => 1,
                'host_part_number' => 'TEST_HOST',
                'part_number' => 'PART_B',
                'parent_part_number' => 'TEST_HOST',
                'child_part_number' => 'PART_X',
                'level' => 2,
                'quantity' => 1,
                'status' => 'publish'
            ],
            [
                'id' => 1210,
                'product_line_id' => 1,
                'host_part_number' => 'TEST_HOST',
                'part_number' => 'PART_X',
                'parent_part_number' => 'PART_B',
                'child_part_number' => 'PART_Z',
                'level' => 3,
                'quantity' => 3,
                'status' => 'publish'
            ],
        ];
        
        // 插入测试数据
        foreach ($test_data as $relation) {
            $this->wpdb->insert($this->table_name, $relation);
            $this->test_relations[] = $relation['id'];
        }
        
        echo "   ✅ 插入了 " . count($test_data) . " 条测试关系\n";
    }
    
    /**
     * 显示测试数据结构
     */
    private function display_test_structure() {
        echo "\n🌲 测试数据结构：\n";
        echo "TEST_HOST (主机)\n";
        echo "├── PART_A (ID: 1000)\n";
        echo "│   └── PART_X (ID: 1100)\n";
        echo "│       └── PART_Y (ID: 1110)\n";
        echo "└── PART_B (ID: 1001)\n";
        echo "    └── PART_X (ID: 1200)  ← 同样的料号，不同分支\n";
        echo "        └── PART_Z (ID: 1210)\n";
        echo "\n";
    }
    
    /**
     * 测试级联删除
     */
    private function test_cascade_delete() {
        echo "🔥 测试级联删除...\n";
        echo "   目标：删除关系 ID 1100 (PART_A → PART_X)\n";
        echo "   预期：只删除 [1100, 1110]，保留 [1000, 1001, 1200, 1210]\n\n";
        
        // 获取要删除的关系
        $target_relation = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            1100
        ));
        
        if (!$target_relation) {
            echo "   ❌ 未找到目标关系 ID 1100\n";
            return;
        }
        
        // 模拟级联删除逻辑
        $relations_to_delete = $this->find_cascade_delete_relations($target_relation);
        
        echo "   🔍 找到需要删除的关系：\n";
        foreach ($relations_to_delete as $relation) {
            echo "      - ID: {$relation->id} ({$relation->part_number} → {$relation->child_part_number})\n";
        }
        
        // 执行删除
        $deleted_ids = [];
        foreach ($relations_to_delete as $relation) {
            $result = $this->wpdb->delete($this->table_name, ['id' => $relation->id], ['%d']);
            if ($result) {
                $deleted_ids[] = $relation->id;
            }
        }
        
        echo "   ✅ 实际删除了 " . count($deleted_ids) . " 条关系：[" . implode(', ', $deleted_ids) . "]\n";
    }
    
    /**
     * 验证结果
     */
    private function verify_results() {
        echo "\n🔍 验证删除结果...\n";
        
        // 检查剩余的关系
        $remaining_relations = $this->wpdb->get_results(
            "SELECT id, part_number, child_part_number FROM {$this->table_name} WHERE id IN (1000, 1001, 1100, 1110, 1200, 1210) ORDER BY id"
        );
        
        echo "   剩余关系：\n";
        foreach ($remaining_relations as $relation) {
            echo "      - ID: {$relation->id} ({$relation->part_number} → {$relation->child_part_number})\n";
        }
        
        // 验证预期结果
        $expected_remaining = [1000, 1001, 1200, 1210];
        $actual_remaining = array_column($remaining_relations, 'id');
        
        $missing = array_diff($expected_remaining, $actual_remaining);
        $unexpected = array_diff($actual_remaining, $expected_remaining);
        
        if (empty($missing) && empty($unexpected)) {
            echo "   ✅ 验证成功！删除结果符合预期\n";
            echo "      - 分支1的子树 [1100, 1110] 被正确删除\n";
            echo "      - 分支2的关系 [1200, 1210] 被正确保留\n";
            echo "      - 主机关系 [1000, 1001] 被正确保留\n";
        } else {
            echo "   ❌ 验证失败！\n";
            if (!empty($missing)) {
                echo "      - 缺失的关系：[" . implode(', ', $missing) . "]\n";
            }
            if (!empty($unexpected)) {
                echo "      - 意外保留的关系：[" . implode(', ', $unexpected) . "]\n";
            }
        }
    }
    
    /**
     * 模拟级联删除查找逻辑
     */
    private function find_cascade_delete_relations($root_relation) {
        $relations_to_delete = [$root_relation];
        
        $this->find_direct_child_relations_recursive(
            $root_relation->child_part_number,
            $root_relation->product_line_id,
            $root_relation->host_part_number,
            $relations_to_delete
        );
        
        return $relations_to_delete;
    }
    
    /**
     * 递归查找直接子级关系
     */
    private function find_direct_child_relations_recursive($parent_part_number, $product_line_id, $host_part_number, &$relations_to_delete) {
        $child_relations = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE parent_part_number = %s 
             AND product_line_id = %d 
             AND host_part_number = %s
             AND status = 'publish'
             ORDER BY level ASC, id ASC",
            $parent_part_number,
            $product_line_id,
            $host_part_number
        ));
        
        foreach ($child_relations as $child_relation) {
            $relations_to_delete[] = $child_relation;
            
            if (!empty($child_relation->child_part_number)) {
                $this->find_direct_child_relations_recursive(
                    $child_relation->child_part_number,
                    $product_line_id,
                    $host_part_number,
                    $relations_to_delete
                );
            }
        }
    }
    
    /**
     * 清理测试数据
     */
    private function cleanup_test_data() {
        echo "🧹 清理测试数据...\n";
        
        $this->wpdb->query("DELETE FROM {$this->table_name} WHERE id >= 1000 AND id <= 1999");
        $this->test_relations = [];
        
        echo "   ✅ 清理完成\n";
    }
}

// 运行测试
$tester = new CascadeDeleteTester();
$tester->run_tests(); 