# 🚀 生产环境数据库修复指南

## 📋 您的生产环境信息
- **MySQL容器**: `prod_mysql_1` ✅ (Up healthy)
- **Nginx容器**: `prod_nginx_1` ✅ (Up healthy)  
- **WordPress容器**: `prod_wordpress_1` ✅ (Up healthy)

## 🎯 修复目标
解决耗材页面筛选功能问题：将数据库中的内部代码格式转换为前端期望的描述格式

## 🚀 执行方案

### 方案1：自动化脚本（推荐）
```bash
# 赋予执行权限
chmod +x scripts/prod-database-fix.sh

# 执行修复
./scripts/prod-database-fix.sh
```

### 方案2：手动执行（快速）
```bash
# 1. 检查当前数据
docker exec prod_mysql_1 mysql -uroot -proot -Dbjt_product -e "SELECT bag_type, COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type;"

# 2. 创建备份
docker exec prod_mysql_1 mysqldump -uroot -proot bjt_product wp_bjt_consumables > /tmp/prod_consumables_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. 执行修复（一条命令）
docker exec prod_mysql_1 mysql -uroot -proot -Dbjt_product -e "
UPDATE wp_bjt_consumables 
SET bag_type = CASE 
    WHEN bag_type = 'MEX' THEN 'Pillow'
    WHEN bag_type = 'MEY' THEN 'Precut Air Pillow'
    WHEN bag_type = 'MFB' THEN 'paper Bubble'
    WHEN bag_type = 'MFC' THEN 'Tube'
    WHEN bag_type = 'MFF' THEN 'Bubble'
    ELSE bag_type
END
WHERE status = 'publish' AND bag_type IS NOT NULL;
"

# 4. 验证结果
docker exec prod_mysql_1 mysql -uroot -proot -Dbjt_product -e "SELECT bag_type, COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type;"
```

## 🎯 预期修复结果

**修复前（内部代码）：**
```
bag_type | count
---------|------
MEX      | 22
MFB      | 15
MFC      | 7
MEY      | 5
MFF      | 1
```

**修复后（前端期望）：**
```
bag_type           | count
-------------------|------
Pillow             | 22
paper Bubble       | 15
Tube               | 7
Precut Air Pillow  | 5
Bubble             | 1
```

## 🔧 常见问题处理

### 问题1：数据库连接密码错误
```bash
# 尝试其他常见密码
docker exec prod_mysql_1 mysql -uroot -ppassword -e "SELECT 1;"
docker exec prod_mysql_1 mysql -uroot -pmysql -e "SELECT 1;"
docker exec prod_mysql_1 mysql -uroot -p123456 -e "SELECT 1;"
```

### 问题2：数据库名不确定
```bash
# 查看所有数据库
docker exec prod_mysql_1 mysql -uroot -proot -e "SHOW DATABASES;"

# 可能的数据库名：bjt_product, wordpress, wp_bjt
```

### 问题3：表名不确定
```bash
# 查看所有表
docker exec prod_mysql_1 mysql -uroot -proot -Dbjt_product -e "SHOW TABLES;"

# 查找耗材相关表
docker exec prod_mysql_1 mysql -uroot -proot -Dbjt_product -e "SHOW TABLES LIKE '%consumable%';"
```

## 🔙 回滚方法

如果修复有问题，可以快速回滚：

```bash
# 方法1：从备份文件恢复
docker exec -i prod_mysql_1 mysql -uroot -proot -Dbjt_product < /tmp/prod_consumables_backup_TIMESTAMP.sql

# 方法2：使用备份表回滚（如果使用了自动化脚本）
docker exec prod_mysql_1 mysql -uroot -proot -Dbjt_product -e "
DROP TABLE wp_bjt_consumables;
RENAME TABLE wp_bjt_consumables_backup_prod TO wp_bjt_consumables;
"
```

## 📊 验证修复成功

修复完成后，检查以下几点：

1. **数据格式正确**：bag_type显示为Pillow、Bubble等描述格式
2. **数据数量不变**：总记录数保持不变
3. **前端功能正常**：访问耗材页面，筛选功能应该正常工作

## 🚨 生产环境安全提醒

1. **执行前确认**：确保您有完整的数据库备份
2. **业务时间**：建议在业务低峰期执行
3. **监控准备**：执行后监控前端功能是否正常
4. **回滚准备**：准备好快速回滚方案

## 📞 执行步骤总结

1. **检查环境**：确认生产容器正常运行 ✅
2. **创建备份**：备份当前数据库数据
3. **执行修复**：运行修复脚本或手动执行SQL
4. **验证结果**：检查数据格式和前端功能
5. **监控观察**：观察一段时间确保稳定

执行完成后，您的耗材页面筛选功能应该能正常工作了！ 