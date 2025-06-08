-- 修复耗材数值字段：从spec字段解析数值填充到对应的筛选字段
-- 问题：数据导入时只填充了spec字符串，数值字段都是0.00，导致前端筛选失效

USE bjt_dev;

-- 1. 修复厚度字段 (thickness_met)
-- 从 "厚度: 50.00 um" 中提取 50.00
UPDATE wp_bjt_consumables 
SET thickness_met = CAST(
    TRIM(
        SUBSTRING_INDEX(
            SUBSTRING_INDEX(spec, '厚度: ', -1), 
            ' um', 
            1
        )
    ) AS DECIMAL(10,2)
)
WHERE spec LIKE '%厚度: %um%' 
  AND (thickness_met IS NULL OR thickness_met = 0.00);

-- 2. 修复宽度字段 (width_met) 
-- 从 "宽度: 20.00 mm" 中提取 20.00
UPDATE wp_bjt_consumables 
SET width_met = CAST(
    TRIM(
        SUBSTRING_INDEX(
            SUBSTRING_INDEX(spec, '宽度: ', -1), 
            ' mm', 
            1
        )
    ) AS DECIMAL(10,2)
)
WHERE spec LIKE '%宽度: %mm%' 
  AND (width_met IS NULL OR width_met = 0.00);

-- 3. 修复长度字段 (length_met)
-- 从 "长度: 13.00 m" 中提取 13.00
UPDATE wp_bjt_consumables 
SET length_met = CAST(
    TRIM(
        SUBSTRING_INDEX(
            SUBSTRING_INDEX(spec, '长度: ', -1), 
            ' m', 
            1
        )
    ) AS DECIMAL(10,2)
)
WHERE spec LIKE '%长度: %m%' 
  AND (length_met IS NULL OR length_met = 0.00);

-- 4. 修复总长字段 (total_length_met)
-- 从 "总长: 220.00 m" 中提取 220.00
UPDATE wp_bjt_consumables 
SET total_length_met = CAST(
    TRIM(
        SUBSTRING_INDEX(
            SUBSTRING_INDEX(spec, '总长: ', -1), 
            ' m', 
            1
        )
    ) AS DECIMAL(10,2)
)
WHERE spec LIKE '%总长: %m%' 
  AND (total_length_met IS NULL OR total_length_met = 0.00);

-- 验证修复结果
SELECT 
    id,
    part_number,
    spec,
    thickness_met,
    width_met, 
    length_met,
    total_length_met,
    CASE 
        WHEN thickness_met > 0 OR width_met > 0 OR length_met > 0 THEN '✅ 已修复'
        ELSE '❌ 需检查'
    END as status
FROM wp_bjt_consumables 
WHERE spec IS NOT NULL
ORDER BY id DESC
LIMIT 10;

-- 统计修复情况
SELECT 
    COUNT(*) as total_records,
    SUM(CASE WHEN thickness_met > 0 THEN 1 ELSE 0 END) as thickness_fixed,
    SUM(CASE WHEN width_met > 0 THEN 1 ELSE 0 END) as width_fixed,
    SUM(CASE WHEN length_met > 0 THEN 1 ELSE 0 END) as length_fixed,
    SUM(CASE WHEN total_length_met > 0 THEN 1 ELSE 0 END) as total_length_fixed
FROM wp_bjt_consumables 
WHERE spec IS NOT NULL; 