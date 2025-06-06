# BJT Product System - 生产环境部署检查清单

## 🔧 部署前准备

### 1. 环境配置
- [ ] 复制 `env.production.example` 为 `.env.production`
- [ ] 设置正确的域名 `DOMAIN_NAME`
- [ ] 设置强密码 `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`
- [ ] 生成WordPress安全密钥（从 https://api.wordpress.org/secret-key/1.1/salt/）
- [ ] 设置JWT密钥 `JWT_AUTH_SECRET_KEY`
- [ ] 配置正确的 `WP_HOME` 和 `WP_SITEURL`

### 2. SSL证书
- [ ] 上传SSL证书到 `nginx/ssl/cert.pem`
- [ ] 上传私钥到 `nginx/ssl/private.key`
- [ ] 验证证书权限：`chmod 644 nginx/ssl/cert.pem`
- [ ] 验证私钥权限：`chmod 600 nginx/ssl/private.key`

### 3. 服务器准备
- [ ] 安装Docker和Docker Compose
- [ ] 确保80和443端口开放
- [ ] 配置防火墙规则
- [ ] 设置域名DNS解析

### 4. 数据备份
- [ ] 备份现有数据（如果有）
- [ ] 确认备份恢复方案

## 🚀 部署执行

### 1. 部署命令
```bash
# 给脚本执行权限
chmod +x deploy-production.sh

# 执行部署
./deploy-production.sh
```

### 2. 部署验证
- [ ] 前端页面可以访问 `https://yourdomain.com`
- [ ] API可以访问 `https://yourdomain.com/wp-json/bjt/v1`
- [ ] WordPress后台可以访问 `https://yourdomain.com/wp-admin`
- [ ] SSL证书正常工作
- [ ] 数据库连接正常

### 3. 功能测试
- [ ] 用户登录功能
- [ ] 产品数据显示
- [ ] 搜索功能
- [ ] 订单功能
- [ ] 文件上传功能

## 🔍 常见问题

### 1. 前端构建失败
- 检查Node.js版本（需要18+）
- 检查npm依赖安装
- 检查环境变量设置

### 2. SSL证书问题
- 确认证书格式正确
- 检查证书有效期
- 验证域名匹配

### 3. 数据库连接失败
- 检查数据库密码
- 确认容器间网络连接
- 查看数据库日志

### 4. API无法访问
- 检查WordPress配置
- 确认插件已激活
- 查看nginx代理配置

## 📱 监控和维护

### 1. 日志查看
```bash
# 查看所有服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql
```

### 2. 性能监控
- [ ] 设置服务器监控
- [ ] 配置SSL证书到期提醒
- [ ] 设置数据库备份定时任务

### 3. 安全维护
- [ ] 定期更新依赖
- [ ] 监控安全漏洞
- [ ] 定期更改密码
- [ ] 审查访问日志

## 🔄 回滚方案

如果部署失败：
```bash
# 停止新部署
docker-compose -f docker/prod/docker-compose.prod.yml down

# 恢复备份数据库
mysql -u root -p < backup_file.sql

# 重新部署之前版本
git checkout previous_version
./deploy-production.sh
```

## 📝 部署检查清单

- [ ] 系统要求满足（Docker, Docker Compose）
- [ ] 环境变量配置完成（.env.production）
- [ ] SSL证书准备就绪（nginx/ssl/目录）
- [ ] 域名DNS解析正确指向服务器
- [ ] 防火墙开放80和443端口
- [ ] 部署脚本执行成功
- [ ] 服务健康检查通过
- [ ] WordPress管理后台可访问
- [ ] 前端应用正常加载
- [ ] API接口响应正常 
- [ ] 查看故障排除指南（[生产环境故障排除指南](PRODUCTION_TROUBLESHOOTING_GUIDE.md)） 