# 本地开发环境部署指南

## 🚀 快速开始

### 1. 基本部署
```bash
# 完整部署（推荐）
./scripts/deploy-spec-pdf-feature-dev.sh

# 强制部署，跳过确认
./scripts/deploy-spec-pdf-feature-dev.sh --force

# 仅验证，不修改
./scripts/deploy-spec-pdf-feature-dev.sh --verify-only
```

### 2. 适配你的Docker配置

#### 如果你使用不同的compose文件：
```bash
# 使用自定义compose文件
./scripts/deploy-spec-pdf-feature-dev.sh -c your-docker-compose.yml

# 如果compose文件在其他目录
./scripts/deploy-spec-pdf-feature-dev.sh -c path/to/docker-compose.yml
```

#### 常见的Docker配置变体：

**标准开发配置：**
```bash
./scripts/deploy-spec-pdf-feature-dev.sh -c docker-compose.yml
```

**使用dev目录：**
```bash
./scripts/deploy-spec-pdf-feature-dev.sh -c docker/dev/docker-compose.yml
```

**生产测试：**
```bash
./scripts/deploy-spec-pdf-feature-dev.sh -c docker-compose.prod.yml
```

## 📋 部署前检查清单

- [ ] Docker Desktop 已启动
- [ ] 项目已在本地克隆
- [ ] 在项目根目录执行脚本
- [ ] 数据库中有重要数据的话已备份

## 🔍 验证部署结果

### 自动验证
```bash
./scripts/deploy-spec-pdf-feature-dev.sh --verify-only
```

### 手动验证

#### 1. 检查数据库表结构
```bash
# 进入MySQL容器
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql mysql -u wordpress -pwordpress bjt_product

# 检查字段是否添加
SHOW COLUMNS FROM wp_bjt_host_models LIKE 'spec_pdf';
SHOW COLUMNS FROM wp_bjt_accessory_models LIKE 'spec_pdf';
SHOW COLUMNS FROM wp_bjt_spare_part_models LIKE 'spec_pdf';
```

#### 2. 检查服务状态
```bash
# 查看所有服务状态
docker-compose -f docker/dev/docker-compose.nginx.yml ps

# 查看服务日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs frontend
docker-compose -f docker/dev/docker-compose.nginx.yml logs wordpress
```

#### 3. 测试前端界面
访问: http://localhost/admin/machines
- 检查是否有"规格PDF"上传字段
- 尝试创建/编辑主机型号

#### 4. 测试API接口
```bash
# 测试主机型号API
curl http://localhost:8080/wp-json/bjt/v1/host-models

# 检查响应是否包含spec_pdf字段
```

## 🐛 常见问题排查

### 问题1：服务启动失败
```bash
# 停止所有服务
docker-compose -f docker/dev/docker-compose.nginx.yml down

# 清理并重新启动
docker-compose -f docker/dev/docker-compose.nginx.yml up -d --build

# 等待服务启动后重新部署
./scripts/deploy-spec-pdf-feature-dev.sh
```

### 问题2：数据库连接失败
```bash
# 检查MySQL容器状态
docker-compose -f docker/dev/docker-compose.nginx.yml ps mysql

# 查看MySQL日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs mysql

# 重启MySQL
docker-compose -f docker/dev/docker-compose.nginx.yml restart mysql
```

### 问题3：前端编译错误
```bash
# 查看前端日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs frontend

# 重新构建前端
docker-compose -f docker/dev/docker-compose.nginx.yml up -d --build frontend
```

### 问题4：权限错误
```bash
# 确保脚本有执行权限
chmod +x scripts/deploy-spec-pdf-feature-dev.sh

# 检查文件权限
ls -la scripts/deploy-spec-pdf-feature-dev.sh
```

## 🔄 回滚操作

如果需要回滚数据库变更：

```sql
-- 手动删除添加的字段
ALTER TABLE wp_bjt_host_models DROP COLUMN spec_pdf;
ALTER TABLE wp_bjt_accessory_models DROP COLUMN spec_pdf;
ALTER TABLE wp_bjt_spare_part_models DROP COLUMN spec_pdf;
```

## 📞 技术支持

### 查看脚本帮助
```bash
./scripts/deploy-spec-pdf-feature-dev.sh --help
```

### 生成详细报告
脚本会自动生成部署报告：`deployment-checklist-dev-YYYYMMDD-HHMMSS.md`

### 日志收集
```bash
# 收集所有服务日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs > deployment-logs.txt
```

## 🎯 测试用例

部署完成后，执行以下测试：

1. **基本功能测试**
   - [ ] 访问 http://localhost/admin/machines
   - [ ] 创建新主机型号，上传PDF
   - [ ] 编辑现有主机型号，更新PDF
   - [ ] 删除PDF文件
   - [ ] 导出功能包含spec_pdf字段

2. **API测试**
   - [ ] GET /wp-json/bjt/v1/host-models 包含spec_pdf
   - [ ] POST /wp-json/bjt/v1/host-models 支持spec_pdf
   - [ ] PUT /wp-json/bjt/v1/host-models/{id} 支持spec_pdf

3. **文件上传测试**
   - [ ] 仅允许PDF文件上传
   - [ ] 文件大小限制10MB
   - [ ] 上传进度显示
   - [ ] 文件URL正确生成

## ⚡ 性能优化

### 开发环境优化建议

1. **资源限制**
   ```yaml
   # 在docker-compose.yml中添加资源限制
   services:
     frontend:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: '0.5'
   ```

2. **缓存优化**
   ```bash
   # 清理Docker缓存
   docker system prune -f
   
   # 重新构建镜像
   docker-compose build --no-cache
   ```

3. **数据持久化**
   确保MySQL数据卷正确配置，避免数据丢失。 