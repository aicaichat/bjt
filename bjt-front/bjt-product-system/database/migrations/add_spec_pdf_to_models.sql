-- 数据库迁移脚本：为型号表添加规格PDF字段
-- 执行时间：2025-06-05
-- 作者：开发团队

-- 添加规格PDF字段到主机型号表
-- 执行时间: 2025-06-10
-- 目的: 支持主机型号的规格PDF文件上传功能

-- 检查字段是否已存在，如果不存在则添加
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) = 0 THEN 
            'ALTER TABLE `wp_bjt_host_models` ADD COLUMN `spec_pdf` varchar(255) COMMENT ''规格PDF文件URL'' AFTER `explosion_diagram_pdf`;'
        ELSE 
            'SELECT ''Field spec_pdf already exists in wp_bjt_host_models'' as result;'
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'wp_bjt_host_models' 
    AND COLUMN_NAME = 'spec_pdf'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查配件型号表是否需要添加spec_pdf字段
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) = 0 THEN 
            'ALTER TABLE `wp_bjt_accessory_models` ADD COLUMN `spec_pdf` varchar(255) COMMENT ''规格PDF文件URL'' AFTER `explosion_diagram_pdf`;'
        ELSE 
            'SELECT ''Field spec_pdf already exists in wp_bjt_accessory_models'' as result;'
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'wp_bjt_accessory_models' 
    AND COLUMN_NAME = 'spec_pdf'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查备件型号表是否需要添加spec_pdf字段
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) = 0 THEN 
            'ALTER TABLE `wp_bjt_spare_part_models` ADD COLUMN `spec_pdf` varchar(255) COMMENT ''规格PDF文件URL'' AFTER `explosion_diagram_pdf`;'
        ELSE 
            'SELECT ''Field spec_pdf already exists in wp_bjt_spare_part_models'' as result;'
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'wp_bjt_spare_part_models' 
    AND COLUMN_NAME = 'spec_pdf'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验证字段是否添加成功
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('wp_bjt_host_models', 'wp_bjt_accessory_models', 'wp_bjt_spare_part_models')
AND COLUMN_NAME = 'spec_pdf'
ORDER BY TABLE_NAME; 