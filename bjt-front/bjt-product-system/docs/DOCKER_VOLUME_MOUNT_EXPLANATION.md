# Docker Volume挂载配置详解

## 📝 配置行解析

```yaml
# 上传文件目录挂载 - 统一使用volume避免权限冲突
- uploads_data:/usr/share/nginx/html/uploads:rw
```

### 语法结构

```
<volume_name>:<container_path>:<options>
```

### 各部分含义

#### 1. `uploads_data` - Volume名称

- **定义位置**：在文件底部的 `volumes:` 部分（第240行）
  ```yaml
  volumes:
    uploads_data:
      driver: local
  ```
- **含义**：这是一个Docker命名volume（named volume）
- **存储位置**：由Docker管理，通常存储在 `/var/lib/docker/volumes/<project_name>_uploads_data/`
- **特点**：
  - ✅ 持久化存储（容器删除后数据保留）
  - ✅ 跨容器共享（多个容器可以挂载同一个volume）
  - ✅ 独立于容器生命周期

#### 2. `:/usr/share/nginx/html/uploads` - 容器内路径

- **含义**：将volume挂载到Nginx容器内的这个路径
- **`/usr/share/nginx/html/`**：Nginx的默认web根目录
- **`/uploads/`**：上传文件的子目录
- **完整路径**：`/usr/share/nginx/html/uploads/`

#### 3. `:rw` - 挂载选项

- **`rw`** = Read-Write（读写模式）
- **含义**：容器可以读取和写入这个目录
- **对比**：
  - `:ro` = Read-Only（只读模式）
  - `:rw` = Read-Write（读写模式，默认值，可省略）

### 完整含义

**这行配置的意思是**：
> 将名为 `uploads_data` 的Docker volume挂载到Nginx容器内的 `/usr/share/nginx/html/uploads/` 目录，并允许读写访问。

## 🔄 在项目中的使用

### 多个容器共享同一个volume

在 `docker-compose.prod.yml` 中，`uploads_data` volume被挂载到多个容器：

#### 1. Nginx容器（第23行）
```yaml
nginx:
  volumes:
    - uploads_data:/usr/share/nginx/html/uploads:rw
```
- **目的**：让Nginx可以直接提供静态文件服务
- **路径**：`/usr/share/nginx/html/uploads/`

#### 2. WordPress容器（第90-91行）
```yaml
wordpress:
  volumes:
    - uploads_data:/var/www/html/wp-content/uploads
    - uploads_data:/var/www/html/wp-content/upgrade
```
- **目的**：让WordPress可以保存上传的文件
- **路径**：
  - `/var/www/html/wp-content/uploads/`（WordPress标准上传目录）
  - `/var/www/html/wp-content/upgrade/`（WordPress升级文件目录）

### 为什么使用volume而不是本地目录？

#### 使用volume的优势

1. **权限管理**：
   - 避免宿主机和容器之间的用户ID/组ID不匹配问题
   - Docker自动处理权限

2. **跨容器共享**：
   - Nginx和WordPress可以访问同一个文件
   - 不需要文件同步

3. **持久化**：
   - 容器删除重建后，数据仍然保留
   - 不依赖宿主机目录结构

4. **性能**：
   - Docker volume通常有更好的I/O性能
   - 适合生产环境

#### 对比：如果使用本地目录挂载

```yaml
# 不推荐的方式
- ../../frontend/public/uploads:/usr/share/nginx/html/uploads:rw
```

**问题**：
- ❌ 权限问题：宿主机用户和容器用户可能不匹配
- ❌ 路径依赖：需要确保宿主机路径存在
- ❌ 跨容器共享困难：需要确保多个容器挂载同一个路径

## 🎯 当前配置的问题

### 问题分析

虽然配置了 `uploads_data` volume，但**Plugin实际保存文件的位置不在volume中**：

```
Plugin保存位置: /var/www/html/frontend/public/uploads/
  ↓ (本地目录挂载)
本地: frontend/public/uploads/

Nginx访问位置: /usr/share/nginx/html/uploads/
  ↓ (volume挂载)
Docker volume: uploads_data
```

**结果**：两个路径不共享，文件无法被Nginx访问。

### 解决方案

需要修改Plugin代码，让文件保存到volume挂载点：

```
应该保存到: /var/www/html/wp-content/uploads/
  ↓ (volume挂载)
Docker volume: uploads_data
  ↓ (Nginx也挂载)
Nginx访问: /usr/share/nginx/html/uploads/
```

## 📊 配置关系图

```
┌─────────────────────────────────────────────────┐
│         Docker Volume: uploads_data             │
│    (存储在 /var/lib/docker/volumes/...)         │
└─────────────────────────────────────────────────┘
           ↑                    ↑
           │                    │
    ┌──────┴──────┐      ┌──────┴──────┐
    │             │      │             │
┌───┴────────┐ ┌─┴──────┴─┐ ┌─────────┴──────┐
│ Nginx容器  │ │WordPress容器│ │ 其他容器...   │
│            │ │            │ │                │
│ /usr/share/│ │/var/www/  │ │                │
│ nginx/html/│ │html/wp-   │ │                │
│ uploads/   │ │content/   │ │                │
│            │ │uploads/    │ │                │
└────────────┘ └────────────┘ └────────────────┘
```

## 🔍 检查命令

### 查看volume信息

```bash
# 查看所有volumes
docker volume ls | grep uploads

# 查看volume详细信息
docker volume inspect bjt-product-system_uploads_data

# 查看volume中的文件
docker run --rm -v bjt-product-system_uploads_data:/data alpine ls -la /data
```

### 查看容器挂载

```bash
# 查看Nginx容器的挂载
docker compose -f docker/prod/docker-compose.prod.yml exec nginx mount | grep uploads

# 查看WordPress容器的挂载
docker compose -f docker/prod/docker-compose.prod.yml exec wordpress mount | grep uploads
```

---

**总结**：这行配置是为了让Nginx和WordPress共享同一个上传文件存储空间，使用Docker volume来避免权限问题和实现数据持久化。
