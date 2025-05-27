-- 测试必选备件功能的SQL脚本
-- 添加一些有必选备件关系的测试数据

-- 首先添加一些基础备件（作为必选备件）
INSERT INTO `wp_bjt_spare_parts` (
  `product_line_id`, `app_model`, `model`, `is_consumable`, `image_url`, 
  `part_number`, `name_zh`, `name_en`, `spec`, `spec_imperial`, `app_sn`, 
  `package_size_cm`, `package_size_inch`, `net_weight_kg`, `net_weight_lbs`, 
  `gross_weight_kg`, `gross_weight_lbs`, `pcs_per_box`, 
  `required_parts`, `required_quantity`, `status`, `created_at`, `updated_at`, `unit`
) VALUES
-- 基础必选备件1：螺丝
(1, 'LA-E4S,LA-E5P', 'SCREW-001', 1, '/images/spare-parts/screw.jpg', 
 'SCR001', '固定螺丝', 'Fixing Screw', 'M4x10mm', 'M4x0.4in', 'All', 
 '1x1x1', '0.4x0.4x0.4', 0.01, 0.02, 0.02, 0.04, 100, 
 NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),

-- 基础必选备件2：垫片
(1, 'LA-E4S,LA-E5P', 'WASHER-001', 1, '/images/spare-parts/washer.jpg', 
 'WSH001', '密封垫片', 'Sealing Washer', '内径4mm', 'ID 0.16in', 'All', 
 '1x1x0.2', '0.4x0.4x0.08', 0.005, 0.01, 0.01, 0.02, 200, 
 NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),

-- 主备件：气泵组件（需要螺丝和垫片）
(1, 'LA-E4S', 'PUMP-ASSY', 0, '/images/spare-parts/pump-assembly.jpg', 
 'PMP001', 'E4S气泵组件', 'E4S Pump Assembly', '完整组件', 'Complete Assembly', 'E4S-001,E4S-002', 
 '15x10x8', '5.9x3.9x3.1', 0.5, 1.1, 0.6, 1.32, 1, 
 'SCR001,WSH001', '4,4', 'publish', NOW(), NOW(), 'pcs'),

-- 主备件：控制板（需要螺丝）
(1, 'LA-E5P', 'CTRL-BOARD', 0, '/images/spare-parts/control-board.jpg', 
 'CTL001', 'E5P控制板', 'E5P Control Board', 'PCB板', 'PCB Board', 'E5P-001', 
 '12x8x2', '4.7x3.1x0.8', 0.2, 0.44, 0.25, 0.55, 1, 
 'SCR001', '2', 'publish', NOW(), NOW(), 'pcs');

-- 更新现有的8A保险丝，添加必选备件（假设需要固定螺丝）
UPDATE `wp_bjt_spare_parts` 
SET `required_parts` = 'SCR001', `required_quantity` = '2'
WHERE `part_number` = '08A0105795';

-- 查看更新结果
SELECT part_number, name_zh, required_parts, required_quantity 
FROM `wp_bjt_spare_parts` 
WHERE required_parts IS NOT NULL; 