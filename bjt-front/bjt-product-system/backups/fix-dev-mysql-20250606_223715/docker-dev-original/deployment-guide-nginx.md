# 基于Nginx的阿里云服务器部署指南

## 概述

本指南介绍如何使用Nginx在阿里云服务器上部署前端应用。此方案比开发服务器方案更适合生产环境，并使用标准的80端口提供访问。

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

### 2. 创建必要的目录

```bash
mkdir -p docker/dev/nginx
```

### 3. 确保配置文件存在

确认以下文件已存在：
- `docker/dev/nginx/frontend.conf`: Nginx的前端配置文件
- `docker/dev/nginx/Dockerfile`: 构建前端Nginx镜像的Dockerfile
- `docker/dev/docker-compose.nginx-podman.yml`: 使用Nginx部署的podman-compose配置

### 4. 使用 podman-compose 进行部署

```bash
# 首先确保旧的 pod 已删除
podman pod rm -f dev

# 使用基于Nginx的配置启动服务
podman-compose -f docker/dev/docker-compose.nginx-podman.yml up -d
```

## 部署架构说明

这个部署方案包含三个主要组件：

1. **前端 (Nginx)**: 
   - 使用Nginx服务静态文件
   - 使用标准80端口
   - 自动编译前端代码并部署到Nginx
   - 配置反向代理将API请求转发到WordPress

2. **WordPress**: 
   - 使用8080端口
   - 与MySQL通信使用共享网络中的localhost

3. **MySQL**: 
   - 数据持久化使用volume
   - 初始数据通过init.sql加载

## 访问应用

部署完成后，可通过以下URL访问：

- 前端: http://<服务器IP>/
- WordPress管理界面: http://<服务器IP>:8080/wp-admin/

## 常见问题解决

### 问题: 无法访问前端应用

可能原因:
1. Nginx配置问题
2. 前端构建失败

解决方法:
```bash
# 检查Nginx容器日志
podman logs dev_frontend_1

# 如果构建失败，可以进入容器查看详情
podman exec -it dev_frontend_1 /bin/sh
```

### 问题: API请求无法到达WordPress

可能原因:
1. Nginx反向代理配置问题
2. WordPress服务未正常运行

解决方法:
```bash
# 检查WordPress容器状态
podman exec -it dev_wordpress_1 /bin/sh -c "curl -I http://localhost:8080"

# 检查Nginx配置是否正确
podman exec -it dev_frontend_1 cat /etc/nginx/conf.d/default.conf
```