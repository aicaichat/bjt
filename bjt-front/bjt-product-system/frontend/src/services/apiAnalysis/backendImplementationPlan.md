# BJT Product Management System - 后端实现方案

## 1. 数据库表更新

### 1.1 产品线表 (wp_bjt_product_lines)
```sql
CREATE TABLE IF NOT EXISTS `wp_bjt_product_lines` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL COMMENT '产品线代码',
  `name_cn` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `status` varchar(20) DEFAULT 'active' COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 1.2 主机表更新 (wp_bjt_hosts)
```sql
ALTER TABLE `wp_bjt_hosts`
ADD COLUMN `product_line_id` bigint(20) DEFAULT NULL COMMENT '产品线ID',
ADD COLUMN `voltage_options` varchar(255) DEFAULT NULL COMMENT '电压选项，JSON格式',
ADD FOREIGN KEY (`product_line_id`) REFERENCES `wp_bjt_product_lines` (`id`);
```

### 1.3 必选备件表 (wp_bjt_required_accessories)
```sql
CREATE TABLE IF NOT EXISTS `wp_bjt_required_accessories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `accessory_id` bigint(20) NOT NULL COMMENT '配件ID',
  `required_accessory_id` bigint(20) NOT NULL COMMENT '必选备件ID',
  `quantity` int(11) DEFAULT 1 COMMENT '必选数量',
  `description` varchar(255) DEFAULT NULL COMMENT '必选说明',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_accessory_required` (`accessory_id`, `required_accessory_id`),
  FOREIGN KEY (`accessory_id`) REFERENCES `wp_bjt_accessories` (`id`),
  FOREIGN KEY (`required_accessory_id`) REFERENCES `wp_bjt_accessories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 2. API 端点实现

### 2.1 产品线相关
```php
// includes/api/class-bjt-product-lines-controller.php

class BJT_Product_Lines_Controller extends WP_REST_Controller {
    public function register_routes() {
        register_rest_route('bjt/v1', '/product-lines', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
            ]
        ]);
        
        register_rest_route('bjt/v1', '/product-lines/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'get_item_permissions_check'],
            ]
        ]);
    }
    
    public function get_items($request) {
        global $wpdb;
        $items = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}bjt_product_lines WHERE status = 'active'"
        );
        return new WP_REST_Response(['success' => true, 'data' => $items]);
    }
    
    public function get_item($request) {
        global $wpdb;
        $id = $request['id'];
        $item = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bjt_product_lines WHERE id = %d",
            $id
        ));
        return new WP_REST_Response(['success' => true, 'data' => $item]);
    }
}
```

### 2.2 设备相关
```php
// includes/api/class-bjt-machines-controller.php

class BJT_Machines_Controller extends WP_REST_Controller {
    public function register_routes() {
        register_rest_route('bjt/v1', '/machines', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args' => [
                    'product_line_id' => [
                        'required' => true,
                        'type' => 'integer',
                    ],
                    'region' => [
                        'type' => 'string',
                    ],
                    'lang' => [
                        'type' => 'string',
                        'enum' => ['zh', 'en'],
                    ],
                ],
            ]
        ]);
    }
    
    public function get_items($request) {
        global $wpdb;
        
        $product_line_id = $request['product_line_id'];
        $region = $request['region'] ?? 'CN';
        $lang = $request['lang'] ?? 'zh';
        
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT h.*, 
                    CASE WHEN %s = 'zh' THEN h.name_cn ELSE h.name_en END as name,
                    h.voltage_options
             FROM {$wpdb->prefix}bjt_hosts h
             WHERE h.product_line_id = %d
             AND h.status = 'active'",
            $lang,
            $product_line_id
        ));
        
        return new WP_REST_Response(['success' => true, 'data' => $items]);
    }
}
```

### 2.3 必选备件相关
```php
// includes/api/class-bjt-required-accessories-controller.php

class BJT_Required_Accessories_Controller extends WP_REST_Controller {
    public function register_routes() {
        register_rest_route('bjt/v1', '/accessories/(?P<id>[\d]+)/required', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_required_accessories'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
            ]
        ]);
    }
    
    public function get_required_accessories($request) {
        global $wpdb;
        
        $accessory_id = $request['id'];
        
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT a.*, ra.quantity, ra.description
             FROM {$wpdb->prefix}bjt_required_accessories ra
             JOIN {$wpdb->prefix}bjt_accessories a ON a.id = ra.required_accessory_id
             WHERE ra.accessory_id = %d",
            $accessory_id
        ));
        
        return new WP_REST_Response(['success' => true, 'data' => $items]);
    }
}
```

## 3. 管理界面更新

### 3.1 产品线管理页面
```php
// templates/admin/product-lines/list.php
?>
<div class="wrap">
    <h1 class="wp-heading-inline">产品线管理</h1>
    <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=add'); ?>" class="page-title-action">添加新产品线</a>
    
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th>代码</th>
                <th>中文名称</th>
                <th>英文名称</th>
                <th>状态</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($product_lines as $line): ?>
            <tr>
                <td><?php echo esc_html($line->code); ?></td>
                <td><?php echo esc_html($line->name_cn); ?></td>
                <td><?php echo esc_html($line->name_en); ?></td>
                <td><?php echo $line->status === 'active' ? '启用' : '禁用'; ?></td>
                <td>
                    <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=edit&id=' . $line->id); ?>">编辑</a>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
```

### 3.2 主机管理页面更新
```php
// templates/admin/host-management.php

// 添加产品线选择
<tr>
    <th scope="row"><label for="product_line_id">产品线</label></th>
    <td>
        <select name="product_line_id" id="product_line_id" required>
            <option value="">请选择产品线</option>
            <?php foreach ($product_lines as $line): ?>
                <option value="<?php echo esc_attr($line->id); ?>" <?php selected($host->product_line_id, $line->id); ?>>
                    <?php echo esc_html($line->name_cn); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </td>
</tr>

// 添加电压选项
<tr>
    <th scope="row"><label for="voltage_options">电压选项</label></th>
    <td>
        <div class="voltage-options">
            <label><input type="checkbox" name="voltage_options[]" value="110" <?php checked(in_array('110', $voltage_options)); ?>> 110V</label>
            <label><input type="checkbox" name="voltage_options[]" value="220" <?php checked(in_array('220', $voltage_options)); ?>> 220V</label>
            <label><input type="checkbox" name="voltage_options[]" value="230" <?php checked(in_array('230', $voltage_options)); ?>> 230V</label>
            <label><input type="checkbox" name="voltage_options[]" value="240" <?php checked(in_array('240', $voltage_options)); ?>> 240V</label>
        </div>
    </td>
</tr>
```

### 3.3 必选备件管理页面
```php
// templates/admin/required-accessories/list.php
?>
<div class="wrap">
    <h1 class="wp-heading-inline">必选备件管理</h1>
    <a href="<?php echo admin_url('admin.php?page=bjt-required-accessories&action=add'); ?>" class="page-title-action">添加必选备件</a>
    
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th>配件</th>
                <th>必选备件</th>
                <th>数量</th>
                <th>说明</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($required_accessories as $item): ?>
            <tr>
                <td><?php echo esc_html($item->accessory_name); ?></td>
                <td><?php echo esc_html($item->required_accessory_name); ?></td>
                <td><?php echo esc_html($item->quantity); ?></td>
                <td><?php echo esc_html($item->description); ?></td>
                <td>
                    <a href="<?php echo admin_url('admin.php?page=bjt-required-accessories&action=edit&id=' . $item->id); ?>">编辑</a>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
```

## 4. 实施步骤

### 4.1 第一周：数据库更新
1. 创建产品线表
2. 更新主机表
3. 创建必选备件表
4. 数据迁移脚本

### 4.2 第二周：API实现
1. 实现产品线API
2. 更新主机API
3. 实现必选备件API
4. API测试

### 4.3 第三周：管理界面
1. 产品线管理页面
2. 更新主机管理页面
3. 必选备件管理页面
4. 界面测试

## 5. 注意事项

### 5.1 数据安全
1. 所有SQL查询使用预处理语句
2. 实现适当的权限检查
3. 数据验证和清理

### 5.2 性能优化
1. 适当的索引设计
2. 缓存机制
3. 批量操作优化

### 5.3 兼容性
1. 保持与现有功能的兼容
2. 数据迁移方案
3. 版本升级方案

---

> 注：本实施方案需要与前端实现方案协同，确保API接口的一致性。 