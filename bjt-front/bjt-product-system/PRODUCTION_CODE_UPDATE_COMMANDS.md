# 🚀 生产环境代码更新指令

## 问题描述
部署验证显示API修复没有生效，原因是生产环境代码没有更新到最新版本。

## 解决方案：手动更新生产代码

### 步骤1：在生产服务器上更新代码
```bash
# 1. 进入项目目录
cd /path/to/bjt-product-system

# 2. 检查当前状态
echo "当前分支: $(git branch --show-current)"
echo "当前提交: $(git log --oneline -1)"

# 3. 获取最新代码
git fetch origin
git pull origin main

# 4. 确认更新成功
echo "更新后提交: $(git log --oneline -1)"
git log --oneline -5 | grep -E "(API|host_part_number|关联)"
```

### 步骤2：验证API修复代码存在
```bash
# 检查关键修复是否存在
grep -n "host_part_number.*sanitize_text_field" plugins/bjt-core-entities/controllers/class-relation-controller.php

# 应该看到类似输出：
# 189:            $prepared_args['host_part_number'] = sanitize_text_field($request['host_part_number']);
# 925:            $data['host_part_number'] = sanitize_text_field(strtoupper(trim($params['host_part_number'])));
```

### 步骤3：更新生产环境容器
```bash
# 如果使用Docker，需要重新部署以应用代码更改
# 选择适合的命令：

# 选项A：重新构建并启动（推荐）
docker-compose -f docker/prod/docker-compose.prod.yml down
docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 选项B：如果只是PHP代码更改，可以直接复制
# (参考 scripts/deploy-api-fix.sh 脚本)
```

### 步骤4：验证修复生效
```bash
# 运行API验证脚本
sh scripts/deploy-api-verification.sh

# 或手动测试API
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/relations?host_part_number=60A01113&per_page=5" | head -c 500
```

## 🔍 期望结果

### 更新前的问题
- API验证失败：`❌ host_part_number参数定义缺失`
- API返回多个主机的混合数据

### 更新后的预期
- API验证成功：`✅ host_part_number参数定义存在`
- API只返回指定主机的数据
- 树形结构不再显示重复数据

## 📞 如果遇到问题

1. **权限问题**：确保有 git pull 权限
2. **代码冲突**：如果有本地修改，先备份再更新
3. **容器问题**：检查 Docker 服务状态
4. **网络问题**：确保能访问 GitHub

## 🎯 关键修复提交

需要确保包含以下关键提交：
- `687fa63` - Fix relations API filtering: Add missing host_part_number parameter support
- `13f34bb` - 增强部署和测试脚本

## ⚡ 快速验证命令

```bash
# 一键检查所有关键修复是否存在
echo "🔍 检查API修复..." && \
grep -q "host_part_number.*sanitize_text_field" plugins/bjt-core-entities/controllers/class-relation-controller.php && \
echo "✅ API修复存在" || echo "❌ API修复缺失"
```

---

**📝 执行完成后，请重新运行验证脚本确认修复生效：**
```bash
sh scripts/deploy-api-verification.sh
``` 