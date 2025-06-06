# BJT产品管理系统 - 生产环境安全部署检查清单

## 📋 部署前准备

### 1. ✅ 环境配置确认
- [ ] 服务器系统要求：Ubuntu 18.04+ 或 CentOS 7+
- [ ] Docker版本：20.0+
- [ ] Docker Compose版本：2.0+
- [ ] 可用内存：至少4GB
- [ ] 可用磁盘空间：至少20GB
- [ ] 网络端口：80, 443开放

### 2. ✅ 域名和SSL准备
- [ ] 域名DNS已正确解析到服务器IP
- [ ] SSL证书已准备（Let's Encrypt或其他）
- [ ] SSL证书文件复制到 `nginx/ssl/` 目录
  - `nginx/ssl/cert.pem` (证书文件)
  - `nginx/ssl/private.key` (私钥文件)

### 3. ✅ 配置文件准备
- [ ] 复制环境配置：`cp env.production.example .env.production`
- [ ] 编辑 `.env.production` 设置以下关键参数：
  - `DOMAIN_NAME` - 你的域名
  - `MYSQL_ROOT_PASSWORD` - 数据库root密码（强密码）
  - `MYSQL_PASSWORD` - WordPress数据库密码
  - `JWT_AUTH_SECRET_KEY` - JWT认证密钥
  - `WP_HOME` 和 `WP_SITEURL` - 网站URL

### 4. ✅ 数据备份（如适用）
- [ ] 备份现有数据库
- [ ] 备份上传文件
- [ ] 备份配置文件

## 🚀 部署执行步骤

### 步骤1：安全检查
```bash
# 检查脚本权限
ls -la deploy-production-safe.sh

# 查看帮助
./deploy-production-safe.sh --help
```

### 步骤2：选择部署方式

#### 方式A：全新部署（推荐 - 数据可以重建）
```bash
# 完全重建数据库，包含最新的spec_pdf字段
./deploy-production-safe.sh --rebuild-db
```

#### 方式B：迁移部署（现有数据保留）
```bash
# 保留现有数据，仅执行数据库迁移
./deploy-production-safe.sh
```

#### 方式C：分步部署
```bash
# 1. 仅备份现有数据
./deploy-production-safe.sh --backup-only

# 2. 仅执行数据库迁移
./deploy-production-safe.sh --migrate-only

# 3. 完整部署
./deploy-production-safe.sh --force
```

### 步骤3：部署过程监控
部署过程中会自动执行以下步骤：
1. ✅ 环境变量检查
2. ✅ 当前部署备份
3. ✅ 前端应用构建
4. ✅ Docker镜像更新
5. ✅ 服务部署
6. ✅ 数据库迁移/重建
7. ✅ 健康检查
8. ✅ 清理和报告生成

## 🔍 部署后验证

### 1. ✅ 服务状态检查
```bash
# 查看所有容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f
```

### 2. ✅ 网络访问测试
- [ ] 前端应用：`https://your-domain.com`
- [ ] WordPress后台：`https://your-domain.com/wp-admin`
- [ ] API接口：`https://your-domain.com/wp-json/bjt/v1`
- [ ] SSL证书验证通过（浏览器无警告）

### 3. ✅ 数据库验证
```bash
# 验证spec_pdf字段是否添加成功
./deploy-production-safe.sh --verify
```

### 4. ✅ 功能测试检查项

#### 基础功能
- [ ] 用户登录/注销
- [ ] 产品数据正常显示
- [ ] 搜索和筛选功能
- [ ] 响应式设计在移动设备正常

#### 新增功能（规格PDF）
- [ ] 主机型号管理页面包含规格PDF上传
- [ ] 配件型号管理页面包含规格PDF上传
- [ ] 备件型号管理页面包含规格PDF上传
- [ ] PDF文件上传功能正常
- [ ] PDF文件链接可正常访问

#### API接口测试
```bash
# 测试主机型号API（应包含spec_pdf字段）
curl -k "https://your-domain.com/wp-json/bjt/v1/host-models"

# 测试配件型号API
curl -k "https://your-domain.com/wp-json/bjt/v1/accessory-models"

# 测试备件型号API
curl -k "https://your-domain.com/wp-json/bjt/v1/spare-part-models"
```

## 🔧 故障排除

### 常见问题及解决方案

#### 问题1：SSL证书错误
```bash
# 检查证书文件
ls -la nginx/ssl/

# 重新生成自签名证书（测试用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/private.key \
  -out nginx/ssl/cert.pem \
  -subj "/CN=your-domain.com"
```

#### 问题2：数据库连接失败
```bash
# 查看MySQL日志
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# 重启MySQL服务
docker-compose -f docker/prod/docker-compose.prod.yml restart mysql
```

#### 问题3：前端构建失败
```bash
# 查看构建日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx

# 手动重建前端
cd frontend
npm ci
VITE_API_URL="https://your-domain.com/wp-json/bjt/v1" npm run build
```

#### 问题4：API无法访问
```bash
# 检查WordPress容器
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress

# 重启WordPress服务
docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress
```

## 📊 性能监控

### 系统资源监控
```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
df -h
```

### 应用性能检查
```bash
# 检查响应时间
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com"

# 查看Nginx访问日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx | tail -100
```

## 🔒 安全配置

### 1. ✅ 防火墙设置
```bash
# Ubuntu/Debian
ufw allow 80
ufw allow 443
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 2. ✅ 定期维护任务
- [ ] 设置自动数据库备份
- [ ] 配置SSL证书自动续期
- [ ] 设置系统更新计划
- [ ] 配置日志轮转

## 📝 部署后配置

### 1. WordPress初始设置
1. 访问 `https://your-domain.com/wp-admin`
2. 激活必需的插件：
   - BJT Core Entities
   - BJT Product Admin
   - JWT Authentication for WP-API
3. 配置WordPress基本设置

### 2. 用户账户设置
- [ ] 创建管理员账户
- [ ] 设置用户权限
- [ ] 配置API访问权限

### 3. 系统优化
- [ ] 配置缓存策略
- [ ] 优化数据库连接
- [ ] 设置文件上传限制

## 🆘 应急处理

### 回滚计划
如果部署失败，可以快速回滚：

```bash
# 1. 停止新部署
docker-compose -f docker/prod/docker-compose.prod.yml down

# 2. 恢复备份数据库（如果有）
# 查看备份目录
ls -la backups/

# 恢复最新备份
docker-compose -f docker/prod/docker-compose.prod.yml up -d mysql
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p[password] [database] < backups/[latest]/database.sql

# 3. 重启服务
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

### 紧急联系
- 开发团队联系方式
- 服务器提供商支持
- 域名注册商支持

---

## ✅ 最终检查清单

部署完成后，请确认以下所有项目：

- [ ] 所有容器正常运行
- [ ] HTTPS访问正常
- [ ] 数据库包含spec_pdf字段
- [ ] 前端应用加载正常
- [ ] API接口响应正常
- [ ] 文件上传功能可用
- [ ] 备份文件已保存
- [ ] 监控和日志配置完成
- [ ] 安全设置已应用
- [ ] 性能测试通过

**部署完成时间**: ___________  
**负责人**: ___________  
**域名**: ___________  
**备份位置**: ___________  

---

*🎉 恭喜！BJT产品管理系统已成功部署到生产环境！* 