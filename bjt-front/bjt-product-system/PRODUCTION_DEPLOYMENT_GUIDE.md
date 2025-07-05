# 生产环境部署操作指南

## 🚀 正确的部署流程

### ⚠️ 重要原则：手动控制代码更新

在生产环境中，**代码更新必须手动执行**，确保部署的安全性和可控性。

## 📋 标准部署步骤

### 1. 部署前准备
```bash
# 在生产服务器上执行以下步骤：

# 1.1 进入项目目录
cd /path/to/bjt-product-system

# 1.2 检查当前状态
git status
git log --oneline -3

# 1.3 手动更新代码（关键步骤）
git pull origin main

# 1.4 确认更新成功
git log --oneline -1
```

### 2. 验证代码完整性
```bash
# 2.1 检查API修复是否存在
grep -n "host_part_number.*sanitize_text_field" plugins/bjt-core-entities/controllers/class-relation-controller.php

# 2.2 检查关键文件
ls -la plugins/bjt-core-entities/controllers/class-relation-controller.php
ls -la frontend/src/

# 2.3 确认没有冲突文件
git status --porcelain
```

### 3. 执行部署
```bash
# 3.1 运行部署脚本
./deploy-production.sh

# 或使用增强版（包含更多功能）
./deploy-production-enhanced.sh
```

### 4. 部署后验证
```bash
# 4.1 验证API修复
./scripts/deploy-api-verification.sh

# 4.2 检查服务状态
docker compose ps

# 4.3 测试关键功能
curl "https://eorder.lockedair.com/wp-json/bjt/v1/relations?host_part_number=60A01113&per_page=5"
```

## 🛡️ 安全检查清单

### 部署前必须确认：
- [ ] ✅ 已手动执行 `git pull origin main`
- [ ] ✅ 确认当前分支是 `main` 分支
- [ ] ✅ 确认最新提交包含所需的修复
- [ ] ✅ 检查并解决任何代码冲突
- [ ] ✅ 验证关键修复代码存在
- [ ] ✅ 备份当前生产环境（自动执行）

### 部署中自动执行：
- [ ] 🔄 备份数据库和uploads目录
- [ ] 🔄 保护用户上传的图片文件
- [ ] 🔄 构建前端应用
- [ ] 🔄 更新Docker服务
- [ ] 🔄 执行数据库迁移
- [ ] 🔄 健康检查和验证

### 部署后必须验证：
- [ ] ✅ API过滤功能正常工作
- [ ] ✅ 前端页面正常访问
- [ ] ✅ 图片文件没有丢失
- [ ] ✅ 树组件不再显示重复数据
- [ ] ✅ 所有关键功能测试通过

## 🚨 常见问题和解决方案

### Q1: 为什么不在脚本中自动执行 git pull？
**A:** 为了安全性和可控性：
- 避免拉取到不稳定的代码
- 管理员可以检查要部署的具体版本
- 防止自动覆盖重要的本地配置
- 确保代码冲突能被及时发现和解决

### Q2: 如果 git pull 有冲突怎么办？
```bash
# 查看冲突文件
git status

# 手动解决冲突
git mergetool
# 或手动编辑冲突文件

# 提交解决结果
git add .
git commit -m "解决部署前的代码冲突"
```

### Q3: 部署脚本检查代码版本失败怎么办？
```bash
# 确保API修复代码存在
grep -n "host_part_number" plugins/bjt-core-entities/controllers/class-relation-controller.php

# 如果不存在，检查是否正确拉取了代码
git log --grep="API修复" --oneline

# 重新拉取代码
git pull origin main --force
```

### Q4: 如何回滚到之前的版本？
```bash
# 查看提交历史
git log --oneline -10

# 回滚到指定版本
git reset --hard <commit_hash>

# 重新部署
./deploy-production.sh
```

## 🔧 高级部署选项

### 1. 带强制清理的部署
```bash
# 使用增强版脚本的强制清理选项
./deploy-production-enhanced.sh -f
```

### 2. 快速部署（跳过备份）
```bash
# 仅在紧急情况下使用
./deploy-production-enhanced.sh -s -n
```

### 3. 仅验证不部署
```bash
# 只检查代码和环境，不执行实际部署
./scripts/deploy-api-verification.sh
```

## 📊 部署监控

### 实时监控命令：
```bash
# 查看部署日志
docker compose logs -f

# 监控API响应
watch -n 5 'curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/relations?host_part_number=60A01113&per_page=1" | jq ".items | length"'

# 监控服务状态
watch -n 10 'docker compose ps'
```

## 📈 性能优化建议

1. **CDN缓存管理**
   - 部署后立即清理CDN缓存
   - 使用版本号破坏缓存

2. **数据库优化**
   - 定期检查索引使用情况
   - 监控查询性能

3. **图片优化**
   - 定期压缩上传的图片
   - 使用WebP格式提高加载速度

---

## 🎯 快速参考

### 标准部署命令序列：
```bash
cd /path/to/bjt-product-system
git pull origin main
./deploy-production.sh
./scripts/deploy-api-verification.sh
```

### 应急回滚命令序列：
```bash
cd /path/to/bjt-product-system
git log --oneline -5
git reset --hard <previous_commit>
./deploy-production.sh
```

**⚠️ 记住：生产环境部署无小事，每一步都要谨慎确认！** 