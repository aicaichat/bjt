# 🚀 BJT产品系统 - 生产环境部署检查清单

## 📋 部署前必检项目

### 1. **环境配置** ✅
- [ ] 复制 `env.production.example` 为 `.env.production`
- [ ] 填写正确的域名 `DOMAIN_NAME`
- [ ] 配置数据库密码（强密码）
- [ ] 生成WordPress安全密钥
- [ ] 配置JWT密钥
- [ ] 检查SSL证书路径

### 2. **前端构建** ✅
- [ ] 确认前端构建输出目录为 `dist/`
- [ ] 检查 `npm run build:skip-check` 命令正常
- [ ] 验证生产环境API URL配置
- [ ] 确认静态资源路径正确

### 3. **Docker配置修复** ✅
- [x] 修复前端构建路径 (`build/` → `dist/`)
- [x] 优化uploads目录挂载（避免权限冲突）
- [x] 移除测试用户数据
- [x] 增加资源限制配置
- [x] 优化MySQL内存配置（256M → 512M）
- [x] 添加生产级MySQL配置文件

### 4. **安全检查** ⚠️
- [ ] SSL证书有效性检查
- [ ] 数据库密码强度验证
- [ ] WordPress安全密钥唯一性
- [ ] 防火墙规则配置
- [ ] 敏感文件权限检查

### 5. **性能优化** ✅
- [x] MySQL配置优化
- [x] Nginx缓存策略
- [x] Gzip压缩启用
- [x] 静态文件缓存
- [x] 容器资源限制

## 🔧 关键配置变更

### MySQL配置优化
```yaml
# 内存从256M提升到512M
command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=512M

# 添加生产级配置文件
volumes:
  - ../../docker/mysql/conf.d:/etc/mysql/conf.d:ro
```

### 前端构建路径修复
```yaml
# 修复构建输出路径
- ../../frontend/dist:/usr/share/nginx/html:ro
```

### uploads目录优化
```yaml
# 统一使用Docker volume
volumes:
  - uploads_data:/usr/share/nginx/html/uploads:rw
  - uploads_data:/var/www/html/wp-content/uploads
```

### 资源限制配置
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

## 🚨 部署风险点

### 高风险
1. **数据库迁移**: 新增字段可能影响现有数据
2. **uploads目录**: 文件路径变更可能导致文件丢失
3. **SSL证书**: 证书过期或配置错误导致服务不可用

### 中风险
1. **内存配置**: MySQL内存增加可能导致OOM
2. **缓存策略**: 新的缓存配置可能影响性能
3. **环境变量**: 配置错误导致服务启动失败

## 📊 部署后验证

### 功能验证
- [ ] 前端页面正常访问
- [ ] API接口响应正常
- [ ] 用户登录功能
- [ ] 文件上传功能
- [ ] 数据库连接正常

### 性能验证
- [ ] 页面加载速度 < 3秒
- [ ] API响应时间 < 500ms
- [ ] 数据库查询性能
- [ ] 静态文件缓存效果

### 安全验证
- [ ] HTTPS强制重定向
- [ ] 安全头部设置
- [ ] 敏感文件访问限制
- [ ] 数据库访问权限

## 🔄 回滚方案

### 快速回滚
```bash
# 回滚到上一个版本
docker-compose -f docker/prod/docker-compose.prod.yml down
docker-compose -f docker/prod/docker-compose.prod.yml up -d --force-recreate
```

### 数据恢复
```bash
# 恢复数据库备份
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < backup/latest.sql
```

## 📞 应急联系

- **技术负责人**: [填写联系方式]
- **运维团队**: [填写联系方式]
- **业务负责人**: [填写联系方式]

## 📝 部署记录

- **部署时间**: ___________
- **部署版本**: ___________
- **部署人员**: ___________
- **验证结果**: ___________
- **备注**: ___________ 