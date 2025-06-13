# 🔒 使用现有SSL证书部署指南

> **适用场景**: 您已经有有效的SSL证书，希望直接使用而不是重新申请

## 🚀 快速开始

### 1. 准备证书文件

确保您有以下文件：
- **证书文件** (如: `cert.pem`, `domain.crt`)
- **私钥文件** (如: `private.key`, `domain.key`)  
- **证书链文件** (可选，如: `chain.pem`, `ca-bundle.crt`)

### 2. 使用配置脚本

```bash
# 基本用法（证书+私钥）
./scripts/use-existing-ssl-cert.sh your-domain.com /path/to/cert.pem /path/to/private.key

# 完整用法（证书+私钥+证书链）
./scripts/use-existing-ssl-cert.sh your-domain.com /path/to/cert.pem /path/to/private.key /path/to/chain.pem
```

### 3. 执行部署

```bash
# 安全部署
./deploy-production-safe.sh
```

## 📋 详细步骤

### Step 1: 检查证书文件

```bash
# 查看证书信息
openssl x509 -in your-cert.pem -noout -text

# 检查证书有效期
openssl x509 -in your-cert.pem -noout -dates

# 验证私钥
openssl rsa -in your-private.key -check
```

### Step 2: 运行配置脚本

```bash
# 示例：配置bjt.example.com的证书
./scripts/use-existing-ssl-cert.sh bjt.example.com ./ssl/cert.pem ./ssl/private.key

# 脚本会自动：
# ✅ 验证证书格式和有效性
# ✅ 检查证书和私钥是否匹配
# ✅ 备份现有证书（如果有）
# ✅ 复制证书到正确位置
# ✅ 设置正确的文件权限
# ✅ 更新环境变量配置
```

### Step 3: 验证配置

```bash
# 检查证书文件
ls -la nginx/ssl/
# 应该看到：
# cert.pem (644权限)
# private.key (600权限)

# 检查环境变量
cat .env.production | grep DOMAIN_NAME
```

### Step 4: 执行部署

```bash
# 推荐的部署流程
./scripts/pre-deploy-check.sh        # 部署前检查
./deploy-production-safe.sh          # 安全部署
./scripts/verify-upload-permissions.sh --check  # 验证上传权限
```

## 🎯 常见证书来源配置

### Let's Encrypt证书

```bash
# 如果您的证书来自Let's Encrypt
./scripts/use-existing-ssl-cert.sh your-domain.com \
  /etc/letsencrypt/live/your-domain.com/fullchain.pem \
  /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 阿里云SSL证书

```bash
# 阿里云下载的证书通常包含：
# - domain.pem (证书文件)
# - domain.key (私钥文件)

./scripts/use-existing-ssl-cert.sh your-domain.com \
  ./ssl/domain.pem \
  ./ssl/domain.key
```

### 腾讯云SSL证书

```bash
# 腾讯云证书文件：
# - domain.crt (证书文件)
# - domain.key (私钥文件)
# - domain.ca-bundle (证书链)

./scripts/use-existing-ssl-cert.sh your-domain.com \
  ./ssl/domain.crt \
  ./ssl/domain.key \
  ./ssl/domain.ca-bundle
```

### Cloudflare Origin证书

```bash
# Cloudflare Origin证书：
./scripts/use-existing-ssl-cert.sh your-domain.com \
  ./ssl/cloudflare-origin.pem \
  ./ssl/cloudflare-origin.key
```

## 🔧 故障排除

### 证书格式问题

```bash
# 如果证书是其他格式，转换为PEM格式：

# DER转PEM
openssl x509 -inform der -in certificate.der -out certificate.pem

# P12转PEM
openssl pkcs12 -in certificate.p12 -out certificate.pem -nodes

# CRT转PEM
cp certificate.crt certificate.pem
```

### 私钥密码保护

```bash
# 如果私钥有密码保护，移除密码：
openssl rsa -in encrypted-private.key -out private.key
```

### 证书链问题

```bash
# 如果证书验证失败，可能需要完整的证书链
# 将证书和中间证书合并：
cat your-cert.pem intermediate.pem > fullchain.pem
```

### 域名不匹配

```bash
# 检查证书支持的域名：
openssl x509 -in cert.pem -noout -text | grep -A1 "Subject Alternative Name"

# 确保证书包含您要部署的域名
```

## ⚠️ 重要注意事项

### 证书要求
- ✅ 证书必须是PEM格式
- ✅ 私钥不能有密码保护
- ✅ 证书必须包含完整的证书链
- ✅ 证书必须在有效期内
- ✅ 证书域名必须匹配部署域名

### 安全建议
- 🔒 私钥文件权限设置为600
- 🔒 证书文件权限设置为644
- 🔒 定期检查证书到期时间
- 🔒 备份原有证书文件

### 文件位置
```
nginx/ssl/
├── cert.pem          # 证书文件（包含证书链）
├── private.key       # 私钥文件
└── backup-YYYYMMDD_HHMMSS/  # 备份目录（如果有旧证书）
```

## 📞 获取帮助

```bash
# 查看脚本帮助
./scripts/use-existing-ssl-cert.sh --help

# 验证当前SSL配置
openssl x509 -in nginx/ssl/cert.pem -noout -text

# 测试SSL连接
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 🎉 部署完成后

部署成功后，您可以：

1. **访问网站**: https://your-domain.com
2. **检查SSL状态**: 浏览器地址栏应显示锁图标
3. **验证证书**: 点击锁图标查看证书详情
4. **监控到期**: 设置证书到期提醒

---

**💡 提示**: 如果您的证书即将到期，建议提前续期并重新运行配置脚本。 