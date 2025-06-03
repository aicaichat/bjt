-- 关系数据测试插入
-- 为当前的机器料号添加配件关系

INSERT INTO `wp_bjt_relations` (`product_line_id`, `host_part_number`, `part_number`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`, `sort_order`, `status`) VALUES
-- 60A01148 的配件关系
(1, '60A01148', '60A01148', NULL, '60A04038', 'accessory', 1, 1, 10, 'publish'),
(1, '60A01148', '60A01148', NULL, '60A06006', 'accessory', 1, 1, 20, 'publish'),
(1, '60A01148', '60A01148', NULL, '60A10003', 'accessory', 1, 1, 30, 'publish'),

-- 60A01149 的配件关系
(1, '60A01149', '60A01149', NULL, '60A04038', 'accessory', 1, 1, 10, 'publish'),
(1, '60A01149', '60A01149', NULL, '60A06006', 'accessory', 1, 1, 20, 'publish'),
(1, '60A01149', '60A01149', NULL, '60A10003', 'accessory', 1, 1, 30, 'publish'),

-- 60A01143 的配件关系
(1, '60A01143', '60A01143', NULL, '60A04038', 'accessory', 1, 1, 10, 'publish'),
(1, '60A01143', '60A01143', NULL, '60A06006', 'accessory', 1, 1, 20, 'publish'),
(1, '60A01143', '60A01143', NULL, '60A10003', 'accessory', 1, 1, 30, 'publish'),

-- 二级配件关系（配件的子配件）
(1, '60A01148', '60A04038', '60A04038', '60A04039', 'accessory', 2, 1, 10, 'publish'),
(1, '60A01148', '60A06006', '60A06006', '60A06007', 'accessory', 2, 1, 10, 'publish'),
(1, '60A01148', '60A10003', '60A10003', '60A10004', 'accessory', 2, 1, 10, 'publish'); 