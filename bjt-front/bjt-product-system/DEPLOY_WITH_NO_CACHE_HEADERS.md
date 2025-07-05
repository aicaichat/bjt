# BJT系统防缓存部署指南

## 🎯 解决方案概述

根据CDN缓存优先级，**源站配置的Cache-Control头具有最高优先级**。我们在后端API中统一添加no-cache头，确保所有动态API响应都不被CDN缓存。

## 🔧 实施的修改

### 1. 后端API修改（已完成）
- 修改了 `plugins/bjt-core-entities/includes/class-bjt-api-controller.php`
- 为所有 `/bjt/v1/` 路径的API响应添加了完整的no-cache头：
  ```
  Cache-Control: no-cache, no-store, must-revalidate, max-age=0
  Pragma: no-cache
  Expires: Thu, 01 Jan 1970 00:00:00 GMT
  ```

### 2. 多层防缓存保障
1. **源站头信息**（优先级最高）
2. **CDN控制台规则**（您已设置的权重1规则）
3. **前端缓存破坏**（必要时的补充）

## 📋 部署步骤

### 第1步：测试本地修改
```bash
# 测试API响应头
./scripts/test-api-no-cache-headers.sh localhost:8080

# 或者手动测试
curl -I "http://localhost:8080/wp-json/bjt/v1/relations"
```

### 第2步：部署到生产环境
```bash
# 使用增强版部署脚本
./deploy-production-enhanced.sh

# 或者使用标准部署脚本
./deploy-production.sh
```

### 第3步：验证生产环境
```bash
# 测试生产环境API响应头
./scripts/test-api-no-cache-headers.sh your-domain.com

# 验证CDN缓存修复
./scripts/verify-cdn-cache-fix.sh your-domain.com
```

## 🧪 测试验证流程

### 1. 检查API响应头
```bash
# 查看完整响应头
curl -I "https://your-domain.com/wp-json/bjt/v1/relations"

# 期望看到的头信息：
# Cache-Control: no-cache, no-store, must-revalidate, max-age=0
# Pragma: no-cache  
# Expires: Thu, 01 Jan 1970 00:00:00 GMT
```

### 2. 验证API过滤功能
```bash
# 测试不存在的主机（应该返回空数组）
curl "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=NONEXISTENT123"

# 测试存在的主机（应该返回数据）
curl "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=60A01113"
```

### 3. 前端功能验证
1. 打开关系管理页面
2. 尝试不同的主机料号筛选
3. 验证树状结构显示正确
4. 检查开发者工具中的网络请求

## 📊 监控和诊断

### 实时监控API响应头
```bash
# 创建监控脚本
cat > monitor-api-headers.sh << 'EOF'
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    curl -I -s "https://your-domain.com/wp-json/bjt/v1/relations" | grep -i -E "(cache-control|pragma|expires|x-cache)"
    echo
    sleep 30
done
EOF

chmod +x monitor-api-headers.sh
./monitor-api-headers.sh
```

### 诊断缓存问题
```bash
# 检查CDN缓存状态
curl -I "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=60A01113" | grep -i x-cache

# 期望结果：
# - X-Cache: MISS (缓存未命中)
# - 没有X-Cache头（表示没有缓存）
```

## 🔥 关键优势

### 1. 最高优先级
- **源站头信息**在CDN缓存优先级中排第一
- 不依赖CDN控制台配置
- 确保所有环境都生效

### 2. 完整覆盖
- 所有 `/bjt/v1/` API自动包含
- 包括现有和未来的新API端点
- 无需单独配置每个端点

### 3. 多重保障
- 源站头 + CDN规则 + 前端缓存破坏
- 三层防护确保万无一失

## 🚨 故障排查

### 问题1：API响应头中没有no-cache
**原因**：代码未正确部署或WordPress插件未激活
**解决**：
```bash
# 检查文件是否存在
ls -la plugins/bjt-core-entities/includes/class-bjt-api-controller.php

# 检查代码是否包含no-cache逻辑
grep -n "no-cache" plugins/bjt-core-entities/includes/class-bjt-api-controller.php

# 重新部署
./deploy-production.sh
```

### 问题2：CDN仍在缓存API响应
**原因**：CDN缓存未清理或配置未生效
**解决**：
```bash
# 清理CDN缓存
# 1. 在CDN控制台执行"目录刷新"
# 2. 路径: https://your-domain.com/wp-json/

# 等待5-10分钟后重新测试
```

### 问题3：前端仍显示重复数据
**原因**：浏览器缓存或前端缓存
**解决**：
```bash
# 强制刷新浏览器
# Chrome/Firefox: Ctrl+F5 或 Cmd+Shift+R

# 清除浏览器缓存
# 或使用无痕模式测试
```

## 🎉 成功标准

### API响应头验证
- ✅ Cache-Control: no-cache, no-store, must-revalidate, max-age=0
- ✅ Pragma: no-cache
- ✅ Expires: Thu, 01 Jan 1970 00:00:00 GMT

### 功能验证
- ✅ 不存在的主机料号返回空数组
- ✅ 存在的主机料号返回正确数据
- ✅ 不同查询参数返回不同结果

### 前端验证
- ✅ 关系管理页面过滤正常
- ✅ 树状结构显示正确
- ✅ 无重复数据显示

## 📞 快速命令参考

```bash
# 部署到生产环境
./deploy-production.sh

# 测试API响应头
./scripts/test-api-no-cache-headers.sh

# 验证CDN缓存修复
./scripts/verify-cdn-cache-fix.sh

# 监控API状态
curl -I "https://your-domain.com/wp-json/bjt/v1/relations"

# 测试API过滤
curl "https://your-domain.com/wp-json/bjt/v1/relations?host_part_number=NONEXISTENT123"
```

这个解决方案通过**源站强制no-cache头**，确保CDN永远不会缓存动态API响应，从根本上解决了缓存导致的数据问题。 