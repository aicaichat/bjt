-- 修复BJT数据库中的文件路径
-- 移除多余的 /frontend/public/ 前缀
-- 使用方法：在WordPress数据库中执行这些SQL语句

-- 修复主机表中的路径
UPDATE wp_bjt_host_part_numbers 
SET image1_url = REPLACE(image1_url, '/frontend/public/', '/') 
WHERE image1_url LIKE '%/frontend/public/%';

UPDATE wp_bjt_host_part_numbers 
SET image2_url = REPLACE(image2_url, '/frontend/public/', '/') 
WHERE image2_url LIKE '%/frontend/public/%';

UPDATE wp_bjt_host_part_numbers 
SET image3_url = REPLACE(image3_url, '/frontend/public/', '/') 
WHERE image3_url LIKE '%/frontend/public/%';

UPDATE wp_bjt_host_part_numbers 
SET explosion_diagram_pdf = REPLACE(explosion_diagram_pdf, '/frontend/public/', '/') 
WHERE explosion_diagram_pdf LIKE '%/frontend/public/%';

UPDATE wp_bjt_host_part_numbers 
SET spec_pdf = REPLACE(spec_pdf, '/frontend/public/', '/') 
WHERE spec_pdf LIKE '%/frontend/public/%';

-- 修复零件表中的路径（如果存在）
UPDATE wp_bjt_parts 
SET image1_url = REPLACE(image1_url, '/frontend/public/', '/') 
WHERE image1_url LIKE '%/frontend/public/%';

UPDATE wp_bjt_parts 
SET image2_url = REPLACE(image2_url, '/frontend/public/', '/') 
WHERE image2_url LIKE '%/frontend/public/%';

UPDATE wp_bjt_parts 
SET image3_url = REPLACE(image3_url, '/frontend/public/', '/') 
WHERE image3_url LIKE '%/frontend/public/%';

UPDATE wp_bjt_parts 
SET spec_pdf = REPLACE(spec_pdf, '/frontend/public/', '/') 
WHERE spec_pdf LIKE '%/frontend/public/%';

-- 查看修复结果
SELECT 'bjt_host_part_numbers' as table_name, id, code, image1_url, spec_pdf 
FROM wp_bjt_host_part_numbers 
WHERE image1_url IS NOT NULL OR spec_pdf IS NOT NULL 
LIMIT 5; 