# 🌐 添加新域名完整指南

## 📋 概述

本指南将帮助您为BJT产品管理系统添加新域名 `https://eorder.lockedair.com/`。

## ✅ 已完成的配置

### 1. Nginx配置更新
- ✅ 已在 `nginx/conf.d/production.conf` 中添加新域名
- ✅ HTTP和HTTPS配置都已包含新域名
- ✅ 所有现有功能保持不变

### 2. 权限设置脚本
- ✅ 已创建 `setup-domain-permissions.sh` 脚本
- ✅ 脚本包含SSL证书、配置文件和上传目录权限设置
- ✅ 已添加执行权限

### 3. 环境变量配置示例
- ✅ 已创建 `env.production.eorder.example` 配置模板
- ✅ 包含新域名的完整配置

## 🚀 部署步骤

### 第1步：运行权限设置脚本

```bash
# 在项目根目录运行
./setup-domain-permissions.sh
```

这个脚本会：
- 设置SSL证书目录权限
- 配置nginx配置文件权限
- 创建并设置上传目录权限
- 验证nginx配置
- 显示SSL证书配置指导

### 第2步：配置DNS解析

在域名管理面板中添加DNS记录：

```
记录类型: A
主机记录: eorder
记录值: [您的服务器IP地址]
```

验证DNS解析：
```bash
nslookup eorder.lockedair.com
```

### 第3步：配置SSL证书

#### 选项A：使用Let's Encrypt（推荐）

```bash
# 1. 安装certbot（如果尚未安装）
sudo apt update
sudo apt install certbot -y

# 2. 申请SSL证书
sudo certbot certonly --standalone -d eorder.lockedair.com

# 3. 复制证书到项目目录
sudo cp /etc/letsencrypt/live/eorder.lockedair.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/eorder.lockedair.com/privkey.pem nginx/ssl/private.key
sudo chown $USER:$USER nginx/ssl/*
```

#### 选项B：使用现有通配符证书

如果您有 `*.lockedair.com` 的通配符证书：

```bash
cp /path/to/your/cert.pem nginx/ssl/cert.pem
cp /path/to/your/private.key nginx/ssl/private.key
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/private.key
```

#### 选项C：生成自签名证书（仅测试）

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/private.key \
    -out nginx/ssl/cert.pem \
    -subj "/C=CN/ST=State/L=City/O=Company/CN=eorder.lockedair.com"
```

### 第4步：配置环境变量

```bash
# 使用新域名的配置模板
cp env.production.eorder.example .env.production

# 或者更新现有的 .env.production 文件
# 确保 DOMAIN_NAME、WP_HOME、WP_SITEURL 设置为新域名
```

### 第5步：部署系统

```bash
# 方法1：使用改进版部署脚本（推荐）
./deploy-production-improved.sh

# 方法2：使用标准部署脚本
./deploy-production.sh
```

### 第6步：验证部署

```bash
# 检查服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 测试新域名访问
curl -I https://eorder.lockedair.com

# 检查API接口
curl https://eorder.lockedair.com/wp-json/bjt/v1/
```

## 🔍 访问地址

部署完成后，可以通过以下地址访问：

- **前端应用**: https://eorder.lockedair.com
- **WordPress管理后台**: https://eorder.lockedair.com/wp-admin
- **API接口**: https://eorder.lockedair.com/wp-json/bjt/v1

## 🛠️ 故障排除

### 1. 域名无法访问

```bash
# 检查DNS解析
nslookup eorder.lockedair.com

# 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# 检查服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps
```

### 2. SSL证书错误

```bash
# 检查证书文件
ls -la nginx/ssl/

# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"

# 检查证书域名
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "DNS:"
```

### 3. 配置验证

```bash
# 验证nginx配置
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -t

# 查看nginx日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx

# 查看WordPress日志
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress
```

## 📊 多域名支持

系统现在支持以下域名：

1. **bjt.nh.cool** - 原有域名
2. **bjt.deepneed.com.cn** - 原有域名  
3. **eorder.lockedair.com** - 新添加域名

所有域名共享相同的：
- 数据库
- WordPress配置
- 前端应用
- API接口

## 🔐 安全注意事项

1. **SSL证书管理**
   - 定期更新SSL证书
   - 使用强加密算法
   - 监控证书到期时间

2. **域名访问控制**
   - 所有HTTP请求自动重定向到HTTPS
   - 启用HSTS安全头
   - 配置CSP内容安全策略

3. **定期维护**
   - 监控所有域名的可访问性
   - 定期备份SSL证书
   - 更新安全配置

## 📞 技术支持

如果遇到问题：

1. **运行健康检查**
   ```bash
   ./scripts/health-monitor.sh --report
   ```

2. **查看详细日志**
   ```bash
   docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=100
   ```

3. **参考故障排除指南**
   - [生产环境故障排除指南](PRODUCTION_TROUBLESHOOTING_GUIDE.md)
   - [部署检查清单](DEPLOYMENT_CHECKLIST.md)

---

**✅ 配置完成状态**
- [x] Nginx配置已更新
- [x] 权限设置脚本已创建
- [x] 环境变量模板已准备
- [x] 部署指南已完成

**🎯 下一步**：按照上述步骤完成SSL证书配置和部署。 