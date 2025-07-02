# BJT 环境配置指南

## 🎯 问题背景

在Docker环境中，不同环境的WordPress服务名可能不同：
- **开发环境**: `dev-wordpress-1`
- **生产环境**: `wordpress`

硬编码服务名导致配置不够灵活，本文档提供了多种解决方案。

## 🔧 解决方案总览

| 方案 | 适用场景 | 复杂度 | 推荐度 |
|------|----------|--------|--------|
| [环境变量方案](#solution1) | 所有环境 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| [智能检测方案](#solution2) | 自动化部署 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| [Nginx代理方案](#solution3) | 生产环境 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| [环境检测脚本](#solution4) | 批量部署 | ⭐⭐ | ⭐⭐⭐⭐ |

---

## <a id="solution1"></a>🚀 方案1: 环境变量配置

### 特点
- ✅ 最简单直接
- ✅ 易于维护
- ✅ 支持所有环境

### 使用方法

#### 1. 创建环境配置文件

```bash
# 开发环境
cp frontend/env.example frontend/.env.local
```

#### 2. 编辑配置文件

```bash
# frontend/.env.local

# 开发环境
VITE_WORDPRESS_HOST=http://dev-wordpress-1:80

# 生产环境  
# VITE_WORDPRESS_HOST=http://wordpress:80

# 使用Nginx代理时
# VITE_WORDPRESS_HOST=
```

#### 3. 重启前端服务

```bash
docker restart dev-frontend-1
```

---

## <a id="solution2"></a>🧠 方案2: 智能检测配置

### 特点
- ✅ 自动检测环境
- ✅ 无需手动配置
- ✅ 支持多种部署方式

### 工作原理

前端构建时自动检测：
1. **环境变量**: `VITE_WORDPRESS_HOST`
2. **开发环境**: `NODE_ENV=development`
3. **Docker环境**: `DOCKER_ENV` 或 `COMPOSE_PROJECT_NAME`
4. **默认策略**: 使用相对路径（适用于Nginx代理）

### 检测逻辑

```typescript
// vite.config.ts 中的智能检测
const getWordPressHost = () => {
  // 1. 优先使用环境变量
  if (process.env.VITE_WORDPRESS_HOST) {
    return process.env.VITE_WORDPRESS_HOST;
  }
  
  // 2. Docker开发环境
  if (isDev && isDocker) {
    return 'http://dev-wordpress-1:80';
  }
  
  // 3. Docker生产环境
  if (!isDev && isDocker) {
    return 'http://wordpress:80';
  }
  
  // 4. 默认：相对路径（Nginx代理）
  return '';
};
```

---

## <a id="solution3"></a>🌐 方案3: Nginx统一代理

### 特点
- ✅ 生产环境标准做法
- ✅ 完全解决服务名依赖
- ✅ 支持负载均衡
- ✅ 更好的性能和安全性

### 配置文件

生产环境通过Nginx统一代理，前端无需知道WordPress服务名：

```nginx
# nginx/conf.d/api-proxy.conf

upstream wordpress_backend {
    server wordpress:80;
    # server wordpress-2:80 backup;  # 可选的备用服务器
}

location /wp-json/ {
    proxy_pass http://wordpress_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 前端配置

```bash
# 生产环境使用相对路径
VITE_WORDPRESS_HOST=
VITE_USE_PROXY=false
```

---

## <a id="solution4"></a>🤖 方案4: 自动化配置脚本

### 特点
- ✅ 一键配置
- ✅ 自动检测环境
- ✅ 验证连接状态

### 使用方法

```bash
# 运行配置脚本
./scripts/setup-environment.sh
```

### 脚本功能

1. **环境检测**: 自动识别Docker/本地环境
2. **配置生成**: 自动生成对应的环境变量文件
3. **连接验证**: 测试WordPress API连接
4. **使用指南**: 显示后续操作步骤

---

## 📋 环境配置对照表

| 环境类型 | WordPress主机 | 代理设置 | 配置文件 |
|----------|---------------|----------|----------|
| **开发 (Docker)** | `http://dev-wordpress-1:80` | ✅ 启用 | `.env.local` |
| **生产 (Docker)** | `http://wordpress:80` | ❌ 关闭 | `.env.production` |
| **生产 (Nginx)** | 相对路径 (空) | ❌ 关闭 | `.env.production` |
| **本地开发** | `http://localhost:8080` | ❌ 关闭 | `.env.local` |

---

## 🚀 快速启动指南

### 开发环境

```bash
# 1. 配置环境变量
echo "VITE_WORDPRESS_HOST=http://dev-wordpress-1:80" > frontend/.env.local

# 2. 启动服务
docker-compose -f docker/dev/docker-compose.yml up -d

# 3. 重启前端
docker restart dev-frontend-1
```

### 生产环境

```bash
# 1. 使用Nginx代理（推荐）
echo "VITE_WORDPRESS_HOST=" > frontend/.env.production

# 2. 启动生产服务
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

---

## 🔍 故障排除

### 问题1: 403 Forbidden 错误

**原因**: WordPress服务名不匹配或代理配置错误

**解决方案**:
1. 检查环境变量配置
2. 验证Docker服务名
3. 确认代理目标地址

```bash
# 检查当前服务名
docker ps | grep wordpress

# 测试连接
curl http://localhost:5173/wp-json/bjt/v1/
```

### 问题2: 代理连接失败

**原因**: 网络配置或服务未启动

**解决方案**:
1. 确认WordPress服务运行状态
2. 检查Docker网络配置
3. 验证端口映射

```bash
# 检查服务状态
docker ps | grep -E "(wordpress|nginx)"

# 检查网络连接
docker network ls
docker network inspect dev_bjt_network
```

---

## 💡 最佳实践

### 1. 推荐配置组合

- **开发环境**: 环境变量 + Docker服务名
- **生产环境**: Nginx代理 + 相对路径

### 2. 安全考虑

- 生产环境避免直接暴露WordPress端口
- 使用Nginx进行API网关和安全过滤
- 配置适当的CORS和认证策略

### 3. 性能优化

- 启用Nginx缓存
- 配置适当的超时时间
- 使用负载均衡分发请求

---

## 📞 技术支持

如果遇到配置问题，请：

1. 检查日志: `docker logs dev-frontend-1`
2. 验证网络: `docker network inspect dev_bjt_network`
3. 测试连接: `curl http://localhost:5173/wp-json/bjt/v1/`

---

**更新时间**: 2025-07-02  
**版本**: v1.0  
**维护者**: BJT开发团队 