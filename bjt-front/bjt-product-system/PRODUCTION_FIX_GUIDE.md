# 生产环境 pcs_per_box 显示问题修复指南

## 问题确认
- ✅ 开发环境：正确隐藏 pcs_per_box=0 的字段
- ❌ 生产环境：仍然显示 pcs_per_box=0 的字段

## 诊断步骤

### 1. 在生产环境运行诊断脚本
1. 访问生产环境的耗材页面
2. 打开浏览器开发者工具 (F12)
3. 切换到 Console 标签
4. 复制并运行 `check-production-environment.js` 中的代码
5. 记录输出结果

### 2. 检查代码版本
```bash
# 检查当前代码提交
git log --oneline -5

# 检查关键文件的最新修改
git log -p frontend/src/hooks/useConsumableFieldDisplay.ts | head -20
```

### 3. 验证构建配置
```bash
# 检查生产环境构建
cd frontend
npm run build

# 检查构建输出中的环境变量
grep -r "VITE_USE_STANDARDIZED_FIELDS" dist/ || echo "环境变量未找到"
```

## 修复方案

### 方案A：重新部署最新代码
```bash
# 1. 确保代码为最新版本
git pull origin main

# 2. 重新构建前端
cd frontend
npm install
npm run build

# 3. 重新部署
./deploy-production.sh
```

### 方案B：强制清除缓存
```bash
# 1. 清除服务器缓存
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx

# 2. 更新静态资源版本
# 在 frontend/index.html 中添加版本参数
```

### 方案C：验证环境变量
```bash
# 检查生产环境容器中的实际环境变量
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx env | grep VITE_
```

## 验证修复
1. 访问生产环境耗材页面
2. 检查 pcs_per_box=0 的产品是否隐藏了该字段
3. 在浏览器控制台运行诊断脚本确认修复

## 预防措施
1. 建立代码版本检查机制
2. 添加自动化测试验证字段显示逻辑
3. 部署前进行完整的回归测试
4. 建立生产环境监控告警
