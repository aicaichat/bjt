# 阿里云服务器部署指南

## 前提条件

确保阿里云服务器已安装以下软件：
- podman (已验证版本: 4.9.4-rhel)  
- podman-compose

## 部署步骤

### 1. 克隆代码库到服务器

```bash
mkdir -p /var/bjt
cd /var/bjt
git clone <repository-url> bjt
cd bjt/bjt-front/bjt-product-system
```

### 2. 使用 podman-compose 进行部署

我们需要使用特别为 podman 优化的 docker-compose 文件：

```bash
# 首先确保旧的 pod 已删除
podman pod rm -f dev

# 使用 podman-compose 启动服务
podman-compose -f docker/dev/docker-compose.podman.yml up
```

### 3. 常见问题及解决方案

#### 问题: 出现 "Error: invalid config provided: extra host entries must be specified on the pod"

原因: podman 与 docker 在网络配置方面有差异，尤其是共享网络时主机条目的处理方式。

解决方法: 使用优化后的 `docker-compose.podman.yml` 文件，该文件使用了 podman 的 pod 功能，并在 pod 级别处理端口映射。

#### 问题: 容器无法相互通信

在 podman pod 内部，所有容器共享同一网络命名空间，因此容器间通信应使用 `localhost` 而不是服务名称。已在 `docker-compose.podman.yml` 中修改 WordPress 配置，使其通过 `localhost` 连接 MySQL。

### 4. 验证部署

服务启动后，可通过以下 URL 访问：

- 前端: http://<服务器IP>:5173/
- WordPress: http://<服务器IP>:8080/

### 5. 常用命令

```bash
# 查看所有容器状态
podman ps -a

# 查看日志
podman logs <container_id>

# 停止服务
podman-compose -f docker/dev/docker-compose.podman.yml down

# 进入容器
podman exec -it <container_id> /bin/bash
``` 

## 修改后的 docker-compose.podman.yml

```yaml
frontend:
  build:
    context: ../..
    dockerfile: docker/dev/nginx/Dockerfile
    args:
      - VITE_USE_MOCK=true
  environment:
    - VITE_USE_MOCK=true 
```

## 修改后的 Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
ARG VITE_USE_MOCK=false
ENV VITE_USE_MOCK=${VITE_USE_MOCK}
COPY ../../frontend/package*.json ./
RUN npm install
COPY ../../frontend ./
RUN npm run build 