# 🚀 线上环境部署指南 - 耗材筛选功能优化

## 📋 部署概览

本次部署主要修复耗材页面的筛选功能，通过标准化数据库字段来解决筛选选项不匹配的问题。

## 🎯 修复目标

- ✅ 修复形状筛选功能（Pillow, Bubble, Tube等）
- ✅ 修复材质筛选功能（HDPE, 50% HDPE, PAPER等）
- ✅ 修复机型筛选功能（LA-E4C, LA-E4S V2.0等）
- ✅ 确保数值筛选基于真实数据

## 🛠️ 部署方案

### 方案一：使用自动化脚本（推荐）

```bash
# 1. 上传脚本到服务器
scp scripts/production-database-fix.sh user@your-server:/tmp/

# 2. 在服务器执行
ssh user@your-server
cd /tmp
chmod +x production-database-fix.sh

# 3. 修改数据库连接配置
vim production-database-fix.sh
# 修改以下配置：
# DB_HOST="localhost"
# DB_USER="root" 
# DB_PASS="your_password"
# DB_NAME="your_database_name"

# 4. 执行修复
./production-database-fix.sh
```

### 方案二：直接执行SQL（简单快速）

```bash
# 1. 上传SQL文件到服务器
scp scripts/production-database-fix.sql user@your-server:/tmp/

# 2. 在服务器执行SQL
ssh user@your-server
mysql -u root -p your_database_name < /tmp/production-database-fix.sql
```

## ⚠️ 重要注意事项

### 执行前检查
1. **确认数据库连接信息**
2. **确保有足够的磁盘空间**（备份需要空间）
3. **建议在业务低峰期执行**
4. **通知相关人员维护时间**

### 安全措施
1. **自动创建备份表**：`wp_bjt_consumables_backup_production`
2. **可快速回滚**：如有问题可立即恢复
3. **只修改发布状态的产品**：不影响草稿数据

## 🧪 验证步骤

### 1. 数据库验证
执行SQL后会自动显示验证结果，检查：
- bag_type分布是否标准化
- material分布是否标准化  
- 数据完整性是否100%

### 2. API验证
```bash
# 检查API响应
curl "https://your-domain.com/wp-json/bjt/v1/consumables?limit=1"

# 检查筛选功能
curl "https://your-domain.com/wp-json/bjt/v1/consumables?shape=Pillow&limit=5"
curl "https://your-domain.com/wp-json/bjt/v1/consumables?material=HDPE&limit=5"
```

### 3. 前端验证
1. 访问耗材页面：`https://your-domain.com/consumables`
2. 检查筛选选项是否正确显示
3. 测试各个筛选功能是否正常工作
4. 验证筛选结果数量是否正确

## 🔄 回滚方案

如果修复后出现问题，可以快速回滚：

```sql
-- 方法1：使用备份表回滚
DROP TABLE wp_bjt_consumables;
RENAME TABLE wp_bjt_consumables_backup_production TO wp_bjt_consumables;

-- 方法2：如果有SQL备份文件
mysql -u root -p your_database_name < backup_file.sql
```

## 📊 预期效果

修复完成后，耗材页面应该：

### 形状筛选
- ✅ 显示标准化的形状选项
- ✅ 每个选项显示正确的产品数量
- ✅ 筛选结果准确匹配

### 材质筛选  
- ✅ 显示标准化的材质选项
- ✅ 支持百分比格式（50% HDPE）
- ✅ 纸质材料正确分类

### 机型筛选
- ✅ 正确解析复杂格式（带引号、逗号分隔）
- ✅ 显示所有适用机型
- ✅ 筛选结果精确匹配

### 数值筛选
- ✅ 厚度/重量筛选基于真实数据
- ✅ 宽度/长度筛选选项完整
- ✅ 纸质材料显示重量(gsm)，塑料材料显示厚度(um)

## 📞 联系支持

如果在部署过程中遇到问题：

1. **检查错误日志**：查看数据库和应用日志
2. **验证数据备份**：确认备份表存在
3. **联系开发团队**：提供详细的错误信息

## 📝 部署清单

- [ ] 确认数据库连接信息
- [ ] 选择部署方案（脚本 or SQL）
- [ ] 上传文件到服务器
- [ ] 执行数据库修复
- [ ] 验证API响应
- [ ] 测试前端筛选功能
- [ ] 确认用户体验正常
- [ ] 记录部署结果

---

**部署时间建议**：业务低峰期（如凌晨2-4点）
**预计耗时**：5-10分钟
**影响范围**：耗材页面筛选功能
**回滚时间**：1-2分钟 

# 生产环境API修复部署指南

## 🎯 问题描述
前端关联关系页面在生产环境（CDN）下出现重复数据，每个树节点展开时显示2条相同记录。本次修复解决了API缺失host_part_number参数过滤的根本问题。

## 🚀 生产环境部署步骤

### 1. 上传代码到生产服务器
```bash
# 1. 将修复代码上传到生产服务器的项目目录
# 确保包含以下文件：
# - plugins/bjt-core-entities/controllers/class-relation-controller.php (修复后的文件)
# - scripts/deploy-production.sh (生产部署脚本)
# - scripts/test-production.sh (生产测试脚本)
```

### 2. 在生产服务器上执行部署
```bash
# 进入项目目录
cd /path/to/bjt-product-system

# 执行生产环境部署脚本
sudo bash scripts/deploy-production.sh
```

### 3. 验证部署效果
```bash
# 运行测试脚本验证修复效果
bash scripts/test-production.sh
```

## 📋 部署脚本功能

### `deploy-production.sh` 部署脚本
- ✅ 自动检测生产环境
- 💾 备份原始文件
- 📁 部署修复后的API控制器
- 🔒 设置正确的文件权限
- 🔄 自动重启Web服务器
- 🧪 执行基础API测试

### `test-production.sh` 测试脚本  
- 🔍 测试多个主机的过滤效果
- 📊 验证数据一致性
- ⚡ 性能测试
- 📝 生成详细测试报告

## 🔧 修复内容
1. **添加参数定义**: 在`get_collection_params()`方法中添加`host_part_number`参数
2. **参数提取**: 在`prepare_items_query()`方法中添加参数提取逻辑
3. **WHERE条件**: 在`get_items()`方法中添加数据库过滤条件

## ✅ 预期效果
- **修复前**: API返回多个主机的混合数据，前端显示重复记录
- **修复后**: API只返回指定主机的数据，前端显示正确的单条记录

## 🚨 回滚方案
如果部署后出现问题，可以快速回滚：
```bash
# 查看备份文件
ls -la /tmp/bjt-backup-*

# 回滚到备份版本
sudo cp /tmp/bjt-backup-YYYYMMDD_HHMMSS/class-relation-controller.php.backup \
       /var/www/html/wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php

# 重启Web服务器
sudo systemctl reload apache2  # 或 nginx
```

## 📈 监控建议
1. **API响应时间**: 监控`/wp-json/bjt/v1/relations`接口的响应时间
2. **错误率**: 关注API返回的错误状态码
3. **CDN缓存**: 清理相关API的CDN缓存
4. **前端功能**: 测试关联关系页面的树展开功能

## 💡 重要提醒
- ⚠️ 请在业务低峰期执行部署
- 🔄 部署完成后务必清理CDN缓存
- 📱 通知前端团队验证功能
- 📊 监控生产环境API日志

## 🆘 故障处理
如果遇到问题，请按以下顺序排查：
1. 检查Web服务器错误日志
2. 验证文件权限和所有者
3. 确认API响应格式
4. 检查数据库连接
5. 如有必要，执行回滚操作

---
**部署时间**: 预计5-10分钟  
**影响范围**: 关联关系API及相关前端功能  
**回滚时间**: 1-2分钟  