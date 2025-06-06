# BJT产品管理系统 - 上传文件权限配置指南

## 问题描述

在生产环境中，上传的PDF规格说明书等文件可能遇到以下权限问题：
1. WordPress可以上传文件，但nginx无法提供静态文件服务
2. 文件权限导致前端无法访问已上传的文件
3. 容器间文件共享权限不一致

## 解决方案概述

通过在nginx容器中挂载本地上传目录，实现：
- ✅ nginx直接提供静态文件服务（性能更好）
- ✅ WordPress和nginx共享同一个上传目录
- ✅ 统一的权限管理和备份策略

## 配置改进

### 1. Docker Compose配置更新

#### 生产环境 (`docker/prod/docker-compose.prod.yml`)
```yaml
services:
  nginx:
    volumes:
      # 原有挂载...
      # 新增：上传文件目录挂载
      - ../../frontend/public/uploads:/usr/share/nginx/html/uploads:rw
      - ../../frontend/public/uploads:/var/www/html/frontend/public/uploads:rw
```

#### 热部署环境 (`docker/prod/docker-compose.hot-deploy.yml`)
```yaml
services:
  nginx:
    volumes:
      # 原有挂载...
      # 新增：上传文件目录挂载  
      - ../../frontend/public/uploads:/usr/share/nginx/html/uploads:rw
      - ../../frontend/public/uploads:/var/www/html/frontend/public/uploads:rw
```

### 2. Nginx配置优化 (`nginx/conf.d/production.conf`)

```nginx
# 上传文件目录 - 直接从nginx挂载目录提供静态文件服务
location /uploads/ {
    # 优先从nginx的uploads目录提供文件
    alias /usr/share/nginx/html/uploads/;
    
    # 如果nginx目录中没有，尝试从WordPress目录
    try_files $uri @wordpress_uploads;
    
    # 静态文件缓存
    expires 1d;
    add_header Cache-Control "public, max-age=86400";
    
    # 安全设置 - 禁止执行脚本文件
    location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
        deny all;
    }
    
    # 允许的文件类型
    location ~* \.(pdf|jpg|jpeg|png|gif|svg|doc|docx|xls|xlsx|zip|rar|txt)$ {
        add_header X-Served-By "nginx-static";
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
}

# 备用路由：通过WordPress提供上传文件
location @wordpress_uploads {
    proxy_pass http://wordpress:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    add_header X-Served-By "wordpress-proxy";
}
```

## 部署和权限设置

### 1. 使用权限设置脚本

```bash
# 给脚本执行权限
chmod +x scripts/setup-uploads-permissions.sh

# 创建上传目录结构
./scripts/setup-uploads-permissions.sh --create

# 修复权限问题  
./scripts/setup-uploads-permissions.sh --repair

# 验证权限设置
./scripts/setup-uploads-permissions.sh --verify
```

### 2. 使用前端热部署脚本（推荐）

前端热部署脚本已集成权限设置功能：

```bash
# 生产环境热部署（自动处理权限）
./deploy-frontend-hot.sh -e prod

# 使用蓝绿部署策略
./deploy-frontend-hot.sh -e prod -s blue-green

# 仅验证当前状态（包括权限检查）
./deploy-frontend-hot.sh -e prod --verify
```

### 3. 手动部署时的权限设置

如果使用标准部署脚本，需要额外处理权限：

```bash
# 执行标准部署
./deploy-production.sh

# 设置上传文件权限
./scripts/setup-uploads-permissions.sh --create --repair

# 重启nginx容器应用新挂载
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx
```

## 目录结构

```
frontend/public/uploads/
├── specifications/          # PDF规格说明书
│   ├── 1/                  # 主机ID 1的文件
│   │   └── spec_xxx.pdf
│   └── 2/                  # 主机ID 2的文件
├── machines/               # 主机图片
├── parts/                  # 零件图片  
├── consumables/            # 耗材图片
├── spare-parts/            # 备件图片
├── accessory/              # 配件图片
├── host/                   # 主机相关文件
├── product_lines/          # 产品线文件
└── spare_parts/            # 备件文件（备用目录）
```

## 权限说明

### 文件系统权限
- **目录权限**: 755 (rwxr-xr-x)
- **文件权限**: 644 (rw-r--r--)
- **所有者**: www-data:www-data (容器内)

### 容器内权限
- **Nginx容器**: nginx:nginx 用户访问 `/usr/share/nginx/html/uploads/`
- **WordPress容器**: www-data:www-data 用户访问 `/var/www/html/frontend/public/uploads/`

## 验证和测试

### 1. 权限验证

```bash
# 检查本地目录权限
ls -la frontend/public/uploads/

# 检查nginx容器内权限
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/

# 检查WordPress容器内权限  
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress ls -la /var/www/html/frontend/public/uploads/
```

### 2. 功能测试

```bash
# 测试文件上传（通过WordPress）
curl -X POST "https://your-domain.com/wp-admin/admin-ajax.php" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "action=bjt_upload_specification" \
  -F "host_id=1" \
  -F "pdf_file=@test.pdf"

# 测试文件访问（通过nginx）
curl -I "https://your-domain.com/uploads/specifications/1/test.pdf"
```

### 3. 日志检查

```bash
# 查看nginx访问日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx | grep uploads

# 查看nginx错误日志
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# 查看WordPress上传日志
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress | grep upload
```

## 故障排除

### 常见问题1：文件上传成功但无法访问

**症状**: 文件上传到WordPress成功，但通过nginx访问返回404
**解决**:
```bash
# 检查nginx挂载是否正确
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/

# 重新挂载并重启
docker-compose -f docker/prod/docker-compose.prod.yml down
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

### 常见问题2：权限拒绝错误

**症状**: 上传时出现权限拒绝错误
**解决**:
```bash
# 修复权限
./scripts/setup-uploads-permissions.sh --repair

# 重启容器
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx wordpress
```

### 常见问题3：nginx配置错误

**症状**: nginx返回500错误
**解决**:
```bash
# 测试nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -t

# 重新加载配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload
```

## 性能优化

### 1. 缓存策略
- 静态文件缓存1天
- 添加适当的HTTP缓存头
- 启用Gzip压缩

### 2. 安全考虑
- 禁止执行上传的脚本文件
- 限制允许的文件类型
- 设置合理的文件大小限制

### 3. 监控建议
- 监控上传目录磁盘使用
- 设置文件清理策略
- 定期备份上传文件

## 备份和恢复

### 备份上传文件
```bash
# 创建备份
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz frontend/public/uploads/

# 自动备份脚本
echo "0 2 * * * tar -czf /backup/uploads-\$(date +\%Y\%m\%d).tar.gz frontend/public/uploads/" | crontab -
```

### 恢复上传文件
```bash
# 恢复备份
tar -xzf uploads-backup-20241201.tar.gz

# 重新设置权限
./scripts/setup-uploads-permissions.sh --repair
```

## 总结

通过正确配置nginx的volume挂载和权限设置，可以有效解决上传文件的访问问题。关键点包括：

1. **正确的volume挂载**: 确保nginx和WordPress容器都能访问同一个上传目录
2. **合适的权限设置**: 755目录权限，644文件权限，正确的用户组
3. **nginx配置优化**: 优先使用静态文件服务，降级到WordPress代理
4. **自动化脚本**: 使用提供的脚本自动处理权限和部署
5. **持续监控**: 定期检查权限和功能正常性

按照本指南操作，可以确保文件上传功能在生产环境中稳定运行。 