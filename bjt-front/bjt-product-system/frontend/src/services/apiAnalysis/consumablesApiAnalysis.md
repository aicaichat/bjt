# 耗材页面 API 分析

## 1. API 调用概述

### 1.1 主要API调用
```typescript
// 获取耗材列表
const response = await consumablesService.getConsumables(filters);
```

### 1.2 请求参数结构
```typescript
interface ConsumableFilters {
  model: string;          // 型号
  brand?: string;         // 品牌
  part_number?: string;   // 料号
  pak_shape?: string;     // 包装形状
  material?: string;      // 材料
  thickness_met?: string; // 厚度(公制)
  thickness_imp?: string; // 厚度(英制)
  gram_met?: string;      // 克重(公制)
  gram_imp?: string;      // 克重(英制)
  pcs_width_met?: string; // 宽度(公制)
  pcs_width_imp?: string; // 宽度(英制)
  pcs_length_met?: string;// 长度(公制)
  pcs_length_imp?: string;// 长度(英制)
  page: number;          // 页码
  page_size: number;     // 每页数量
  region: string;        // 区域
  lang: string;          // 语言
}
```

## 2. 后端API实现建议

### 2.1 耗材表结构
```sql
CREATE TABLE IF NOT EXISTS `wp_bjt_consumables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `model` varchar(100) NOT NULL COMMENT '型号',
  `brand` varchar(100) DEFAULT NULL COMMENT '品牌',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `package_size` varchar(100) DEFAULT NULL COMMENT '包装尺寸',
  `package_weight` decimal(10,2) DEFAULT NULL COMMENT '包装重量',
  `pallet_size` varchar(100) DEFAULT NULL COMMENT '托盘尺寸',
  `pcs_per_pallet_1` int(11) DEFAULT NULL COMMENT '每托盘数量1',
  `pallet_height_1` decimal(10,2) DEFAULT NULL COMMENT '托盘高度1',
  `pcs_per_pallet_2` int(11) DEFAULT NULL COMMENT '每托盘数量2',
  `pallet_height_2` decimal(10,2) DEFAULT NULL COMMENT '托盘高度2',
  `pcs_per_pallet_3` int(11) DEFAULT NULL COMMENT '每托盘数量3',
  `pallet_height_3` decimal(10,2) DEFAULT NULL COMMENT '托盘高度3',
  `app_model` varchar(255) DEFAULT NULL COMMENT '适用型号',
  `pak_shape` varchar(100) DEFAULT NULL COMMENT '包装形状',
  `material` varchar(100) DEFAULT NULL COMMENT '材料',
  `thickness_met` decimal(10,2) DEFAULT NULL COMMENT '厚度(公制)',
  `thickness_imp` decimal(10,2) DEFAULT NULL COMMENT '厚度(英制)',
  `gram_met` decimal(10,2) DEFAULT NULL COMMENT '克重(公制)',
  `gram_imp` decimal(10,2) DEFAULT NULL COMMENT '克重(英制)',
  `pcs_width_met` decimal(10,2) DEFAULT NULL COMMENT '宽度(公制)',
  `pcs_width_imp` decimal(10,2) DEFAULT NULL COMMENT '宽度(英制)',
  `pcs_length_met` decimal(10,2) DEFAULT NULL COMMENT '长度(公制)',
  `pcs_length_imp` decimal(10,2) DEFAULT NULL COMMENT '长度(英制)',
  `total_length_met` decimal(10,2) DEFAULT NULL COMMENT '总长度(公制)',
  `total_length_imp` decimal(10,2) DEFAULT NULL COMMENT '总长度(英制)',
  `inner_diameter` decimal(10,2) DEFAULT NULL COMMENT '内径',
  `roll_diameter` decimal(10,2) DEFAULT NULL COMMENT '卷径',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `status` varchar(20) DEFAULT 'publish' COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`part_number`),
  KEY `idx_model` (`model`),
  KEY `idx_brand` (`brand`),
  KEY `idx_material` (`material`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.2 价格表结构
```sql
CREATE TABLE IF NOT EXISTS `wp_bjt_consumable_prices` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `consumable_id` bigint(20) NOT NULL COMMENT '耗材ID',
  `range` varchar(50) NOT NULL COMMENT '数量范围',
  `price` decimal(10,2) NOT NULL COMMENT '基础价格',
  `price_eu` decimal(10,2) DEFAULT NULL COMMENT '欧洲价格',
  `price_na` decimal(10,2) DEFAULT NULL COMMENT '北美价格',
  `price_au` decimal(10,2) DEFAULT NULL COMMENT '澳洲价格',
  `price_cn` decimal(10,2) DEFAULT NULL COMMENT '中国价格',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consumable` (`consumable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.3 库存表结构
```sql
CREATE TABLE IF NOT EXISTS `wp_bjt_consumable_inventory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `consumable_id` bigint(20) NOT NULL COMMENT '耗材ID',
  `region` varchar(10) NOT NULL COMMENT '区域',
  `quantity` int(11) NOT NULL DEFAULT 0 COMMENT '库存数量',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consumable_region` (`consumable_id`, `region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 3. API控制器实现

### 3.1 耗材列表API
```php
class BJT_Consumables_Controller extends WP_REST_Controller {
    public function register_routes() {
        register_rest_route('bjt/v1', '/consumables', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args' => [
                    'model' => [
                        'type' => 'string',
                        'required' => true,
                    ],
                    'brand' => [
                        'type' => 'string',
                    ],
                    'part_number' => [
                        'type' => 'string',
                    ],
                    'pak_shape' => [
                        'type' => 'string',
                    ],
                    'material' => [
                        'type' => 'string',
                    ],
                    'thickness_met' => [
                        'type' => 'string',
                    ],
                    'thickness_imp' => [
                        'type' => 'string',
                    ],
                    'gram_met' => [
                        'type' => 'string',
                    ],
                    'gram_imp' => [
                        'type' => 'string',
                    ],
                    'pcs_width_met' => [
                        'type' => 'string',
                    ],
                    'pcs_width_imp' => [
                        'type' => 'string',
                    ],
                    'pcs_length_met' => [
                        'type' => 'string',
                    ],
                    'pcs_length_imp' => [
                        'type' => 'string',
                    ],
                    'page' => [
                        'type' => 'integer',
                        'default' => 1,
                    ],
                    'page_size' => [
                        'type' => 'integer',
                        'default' => 10,
                    ],
                    'region' => [
                        'type' => 'string',
                        'default' => 'CN',
                    ],
                    'lang' => [
                        'type' => 'string',
                        'enum' => ['zh', 'en'],
                        'default' => 'zh',
                    ],
                ],
            ]
        ]);
    }
    
    public function get_items($request) {
        global $wpdb;
        
        $model = $request['model'];
        $brand = $request['brand'];
        $part_number = $request['part_number'];
        $pak_shape = $request['pak_shape'];
        $material = $request['material'];
        $thickness_met = $request['thickness_met'];
        $thickness_imp = $request['thickness_imp'];
        $gram_met = $request['gram_met'];
        $gram_imp = $request['gram_imp'];
        $pcs_width_met = $request['pcs_width_met'];
        $pcs_width_imp = $request['pcs_width_imp'];
        $pcs_length_met = $request['pcs_length_met'];
        $pcs_length_imp = $request['pcs_length_imp'];
        $page = $request['page'];
        $page_size = $request['page_size'];
        $region = $request['region'];
        $lang = $request['lang'];
        
        // 构建查询条件
        $where = ['c.status = "publish"'];
        $params = [];
        
        $where[] = 'c.model = %s';
        $params[] = $model;
        
        if ($brand) {
            $where[] = 'c.brand = %s';
            $params[] = $brand;
        }
        
        if ($part_number) {
            $where[] = 'c.part_number = %s';
            $params[] = $part_number;
        }
        
        if ($pak_shape) {
            $where[] = 'c.pak_shape = %s';
            $params[] = $pak_shape;
        }
        
        if ($material) {
            $where[] = 'c.material = %s';
            $params[] = $material;
        }
        
        if ($thickness_met) {
            $where[] = 'c.thickness_met = %s';
            $params[] = $thickness_met;
        }
        
        if ($thickness_imp) {
            $where[] = 'c.thickness_imp = %s';
            $params[] = $thickness_imp;
        }
        
        if ($gram_met) {
            $where[] = 'c.gram_met = %s';
            $params[] = $gram_met;
        }
        
        if ($gram_imp) {
            $where[] = 'c.gram_imp = %s';
            $params[] = $gram_imp;
        }
        
        if ($pcs_width_met) {
            $where[] = 'c.pcs_width_met = %s';
            $params[] = $pcs_width_met;
        }
        
        if ($pcs_width_imp) {
            $where[] = 'c.pcs_width_imp = %s';
            $params[] = $pcs_width_imp;
        }
        
        if ($pcs_length_met) {
            $where[] = 'c.pcs_length_met = %s';
            $params[] = $pcs_length_met;
        }
        
        if ($pcs_length_imp) {
            $where[] = 'c.pcs_length_imp = %s';
            $params[] = $pcs_length_imp;
        }
        
        // 计算分页
        $offset = ($page - 1) * $page_size;
        
        // 获取总数
        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bjt_consumables c WHERE " . implode(' AND ', $where),
            $params
        ));
        
        // 获取数据
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT c.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'range', p.range,
                            'price', p.price,
                            'price_eu', p.price_eu,
                            'price_na', p.price_na,
                            'price_au', p.price_au,
                            'price_cn', p.price_cn
                        )
                    ) as pricing,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'region', i.region,
                            'quantity', i.quantity
                        )
                    ) as inventory
             FROM {$wpdb->prefix}bjt_consumables c
             LEFT JOIN {$wpdb->prefix}bjt_consumable_prices p ON p.consumable_id = c.id
             LEFT JOIN {$wpdb->prefix}bjt_consumable_inventory i ON i.consumable_id = c.id
             WHERE " . implode(' AND ', $where) . "
             GROUP BY c.id
             LIMIT %d OFFSET %d",
            array_merge($params, [$page_size, $offset])
        ));
        
        // 处理数据
        foreach ($items as &$item) {
            $item->pricing = json_decode('[' . $item->pricing . ']');
            $item->inventory = json_decode('[' . $item->inventory . ']');
        }
        
        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'items' => $items,
                'total' => (int)$total,
                'total_pages' => ceil($total / $page_size)
            ]
        ]);
    }
}
```

## 4. 数据缓存策略

### 4.1 缓存键设计
```php
$cache_key = sprintf(
    'bjt_consumables_%s_%s_%s_%s_%s_%s_%s_%d_%d_%s_%s',
    $model,
    $shape,
    $material,
    $thickness,
    $weight,
    $width,
    $length,
    $page,
    $page_size,
    $region,
    $lang
);
```

### 4.2 缓存实现
```php
// 获取缓存
$cached_data = wp_cache_get($cache_key, 'bjt_consumables');

if ($cached_data !== false) {
    return new WP_REST_Response($cached_data);
}

// 设置缓存
wp_cache_set($cache_key, $response_data, 'bjt_consumables', 3600); // 缓存1小时
```

## 5. 性能优化建议

### 5.1 索引优化
1. 为常用查询字段添加复合索引
2. 为价格和库存表添加适当的索引
3. 定期优化表结构

### 5.2 查询优化
1. 使用预处理语句
2. 合理使用JOIN
3. 限制返回字段
4. 使用分页

### 5.3 缓存优化
1. 实现多级缓存
2. 设置合理的缓存时间
3. 实现缓存预热
4. 实现缓存更新机制

## 6. 安全考虑

### 6.1 数据验证
1. 验证所有输入参数
2. 过滤特殊字符
3. 限制查询范围

### 6.2 权限控制
1. 实现适当的权限检查
2. 限制敏感数据访问
3. 记录操作日志

## 7. 错误处理

### 7.1 错误响应格式
```php
return new WP_REST_Response([
    'success' => false,
    'error' => [
        'code' => 'invalid_parameter',
        'message' => 'Invalid parameter value',
        'details' => $validation_errors
    ]
], 400);
```

### 7.2 异常处理
```php
try {
    // API逻辑
} catch (Exception $e) {
    error_log($e->getMessage());
    return new WP_REST_Response([
        'success' => false,
        'error' => [
            'code' => 'internal_error',
            'message' => 'Internal server error'
        ]
    ], 500);
}
```

## 8. 监控和日志

### 8.1 性能监控
1. 记录API响应时间
2. 监控缓存命中率
3. 监控数据库查询性能

### 8.2 错误日志
1. 记录API错误
2. 记录数据验证错误
3. 记录权限错误

---

> 注：本分析基于前端代码的实现需求，实际实现时可能需要根据具体情况进行调整。 