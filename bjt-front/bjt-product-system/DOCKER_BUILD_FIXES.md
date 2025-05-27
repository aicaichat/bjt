# Docker构建配置修复说明

## 发现的问题

在检查Docker配置时，发现了以下问题：

### 1. 前端构建目录不匹配
**问题**: 
- Vite配置中构建输出目录是 `build`
- 但Dockerfile中使用的是 `dist`

**修复**:
```dockerfile
# 修复前
COPY --from=builder /app/dist /usr/share/nginx/html

# 修复后  
COPY --from=builder /app/build /usr/share/nginx/html
```

### 2. npm依赖安装不正确
**问题**: 
- 使用 `npm ci --only=production` 会跳过devDependencies
- 但构建时需要devDependencies（如TypeScript、Vite等）

**修复**:
```dockerfile
# 修复前
RUN npm ci --only=production

# 修复后
RUN npm ci
```

### 3. Docker Compose卷挂载路径错误
**问题**: 
- 前端构建服务的卷挂载路径不匹配

**修复**:
```yaml
# 修复前
volumes:
  - frontend_build:/app/dist

# 修复后
volumes:
  - frontend_build:/app/build
```

### 4. 架构设计优化
**问题**: 
- 原来的设计使用单独的前端构建服务，然后通过卷共享给nginx
- 这种方式复杂且容易出错

**修复**: 
- 重新设计为多阶段构建
- 在nginx镜像构建过程中直接构建前端
- 简化了架构，提高了可靠性

## 修复后的架构

### 新的构建流程
1. **第一阶段**: 使用Node.js镜像构建前端应用
2. **第二阶段**: 使用Nginx镜像，复制构建好的前端文件

### 新的Dockerfile结构
```dockerfile
# 第一阶段：构建前端
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# 第二阶段：构建nginx
FROM nginx:alpine
COPY --from=frontend-builder /app/build /usr/share/nginx/html
COPY nginx/conf.d/production.conf /etc/nginx/conf.d/default.conf
```

### Docker Compose配置
```yaml
nginx:
  build:
    context: ../../
    dockerfile: docker/nginx/Dockerfile.prod
    args:
      - VITE_API_URL=https://${DOMAIN_NAME}/wp-json/bjt/v1
```

## 测试验证

创建了测试脚本 `test-docker-build.sh` 来验证所有Docker构建配置：

```bash
chmod +x test-docker-build.sh
./test-docker-build.sh
```

## 部署流程优化

移除了部署脚本中不必要的本地前端构建步骤，因为Docker会在容器内完成构建。

## 文件变更清单

1. `frontend/Dockerfile.prod` - 修复构建目录和依赖安装
2. `docker/nginx/Dockerfile.prod` - 新建多阶段构建文件
3. `docker/prod/docker-compose.prod.yml` - 重新设计服务架构
4. `deploy.sh` - 移除不必要的本地构建步骤
5. `test-docker-build.sh` - 新建测试脚本

## 优势

1. **简化架构**: 减少了服务间的依赖关系
2. **提高可靠性**: 避免了卷挂载可能的问题
3. **更好的缓存**: Docker层缓存更有效
4. **易于维护**: 构建逻辑更清晰
5. **环境一致性**: 确保构建环境的一致性 