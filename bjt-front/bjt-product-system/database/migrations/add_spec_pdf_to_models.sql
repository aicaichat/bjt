-- 数据库迁移脚本：为型号表添加规格PDF字段
-- 执行时间：2025-06-05
-- 作者：开发团队

-- 主机型号表添加规格PDF字段
ALTER TABLE `wp_bjt_host_models` 
ADD COLUMN `spec_pdf` varchar(255) COMMENT '规格PDF文件URL' AFTER `explosion_diagram_pdf`;

-- 配件型号表添加规格PDF字段  
ALTER TABLE `wp_bjt_accessory_models` 
ADD COLUMN `spec_pdf` varchar(255) COMMENT '规格PDF文件URL' AFTER `explosion_diagram_pdf`;

-- 备件型号表添加规格PDF字段
ALTER TABLE `wp_bjt_spare_part_models` 
ADD COLUMN `spec_pdf` varchar(255) COMMENT '规格PDF文件URL' AFTER `explosion_diagram_pdf`;

-- 验证字段添加成功
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT 
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('wp_bjt_host_models', 'wp_bjt_accessory_models', 'wp_bjt_spare_part_models')
    AND COLUMN_NAME = 'spec_pdf'; 