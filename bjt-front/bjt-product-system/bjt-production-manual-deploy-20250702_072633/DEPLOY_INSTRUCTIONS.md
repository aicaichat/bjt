# BJT 生产环境手动部署说明

## 🚀 **部署概述**
本部署包包含最新的BJT插件代码，修复了PO页面显示问题。

**部署时间**: $(date)
**版本**: 包含诊断API端点和产品信息解析器修复

## 📋 **部署步骤**

### 1. **备份现有文件**
```bash
# 在生产服务器上执行
cd /var/www/html/wp-content/plugins/
cp -r bjt-core-entities bjt-core-entities.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. **上传新文件**
- 将本部署包中的 `plugins/bjt-core-entities/` 目录上传到生产服务器
- 覆盖路径: `/var/www/html/wp-content/plugins/bjt-core-entities/`

### 3. **重启PHP服务**
```bash
# 根据服务器配置选择合适的命令
sudo systemctl reload php-fpm
# 或
sudo systemctl reload php8.0-fpm
# 或
sudo systemctl reload php8.1-fpm
```

### 4. **清理缓存**
```bash
# 清理OPcache (如果启用)
php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache cleared\n'; }"

# 如果使用Redis缓存
redis-cli FLUSHALL
```

## 🔍 **验证部署**

### 1. **访问诊断端点**
```
https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic
```
**预期结果**: 返回JSON格式的环境信息

### 2. **测试PO页面**
```
https://eorder.lockedair.com/po
```
**预期结果**: PO页面显示完整的产品信息

### 3. **测试产品解析器**
在诊断端点的响应中查看 `debug_info.product_resolver_test` 字段，确认产品信息解析正常。

## 🔧 **关键更新内容**

### **诊断API端点** (`bjt-product-api.php`)
- 新增 `/wp-json/bjt/v1/diagnostic` 端点
- 提供环境信息、文件状态、类加载状态
- 包含产品解析器测试功能

### **产品信息解析器** (`includes/class-product-info-resolver.php`)
- 修复PO页面产品信息显示问题
- 添加模糊匹配算法
- 支持料号变体匹配 (如: 92R01006 ↔ 92R01006666)

### **订单控制器** (`controllers/class-order-controller.php`)
- 优化订单数据处理逻辑
- 改进产品信息获取流程

## ⚠️ **注意事项**

### **权限设置**
确保文件权限正确:
```bash
chown -R www-data:www-data /var/www/html/wp-content/plugins/bjt-core-entities/
chmod -R 755 /var/www/html/wp-content/plugins/bjt-core-entities/
```

### **数据库**
本次更新不涉及数据库结构变更，无需执行SQL脚本。

### **回滚方案**
如遇问题，恢复备份:
```bash
cd /var/www/html/wp-content/plugins/
rm -rf bjt-core-entities
mv bjt-core-entities.backup.YYYYMMDD_HHMMSS bjt-core-entities
sudo systemctl reload php-fpm
```

## 🛠️ **问题排查**

### 如果诊断端点返回错误:
1. 检查PHP错误日志: `/var/log/php/error.log`
2. 检查WordPress调试日志: `/wp-content/debug.log`
3. 确认插件已激活: WordPress后台 → 插件

### 如果PO页面仍显示空白:
1. 访问诊断端点查看 `product_resolver_test` 结果
2. 检查数据库连接状态
3. 确认产品数据表完整性

## 📞 **支持联系**

如遇部署问题或需要技术支持，请联系开发团队。

---
**部署包生成时间**: $(date)
**版本**: BJT Production Fix v1.1 