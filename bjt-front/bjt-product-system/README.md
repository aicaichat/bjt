# BJT产品管理系统

一个基于WordPress + React的现代化产品管理系统，支持设备、配件、耗材和备件的全生命周期管理。

## 🚀 核心特性

### ✨ 数据库自动初始化
系统现在支持在Docker部署时自动初始化数据库，包括：
- ✅ **自动创建数据库结构** - 无需手动执行SQL脚本
- ✅ **自动导入设备和耗材数据** - 从Excel转换的数据自动导入
- ✅ **智能检测避免重复初始化** - 保护现有数据不被覆盖
- ✅ **完整的错误处理和日志记录** - 详细的初始化过程追踪
- ✅ **一键部署体验** - 从零到完整系统只需一个命令

详细信息请查看：[数据库自动初始化文档](DATABASE_AUTO_INIT.md)

### 🎯 多种部署方案
- **域名部署** - 完整的HTTPS生产环境
- **IP地址部署** - 无需域名的快速部署
- **本地开发部署** - 开发测试环境
- **一键部署脚本** - 自动化部署流程
- **零停机部署** - 生产环境无中断更新
- **热部署功能** - 前端快速更新，无需重启服务

### 🛡️ 生产环境保障
- **部署前检查** - 自动验证系统要求和配置
- **健康监控** - 24/7自动监控和告警
- **故障自愈** - 自动重启失败的容器
- **完整备份** - 数据库和配置文件自动备份
- **紧急恢复** - 多级应急响应流程
- **详细日志** - 完整的操作和错误日志

## 📋 功能特性

### 产品管理
- 🏭 **产品线管理**：支持多产品线分类管理
- 🔧 **设备管理**：主机设备的完整信息管理
- 🔌 **配件管理**：设备配件的规格和兼容性管理
- 🧪 **耗材管理**：消耗品的库存和使用管理
- ⚙️ **备件管理**：备用零件的详细信息管理

### 系统功能
- 👥 **用户管理**：多角色权限控制
- 🛒 **购物车系统**：支持批量采购和订单管理
- 📊 **数据分析**：产品使用情况统计分析
- 🔍 **高级搜索**：多维度产品搜索和筛选
- 📱 **响应式设计**：支持桌面和移动设备
- 🔄 **Excel数据导入**：支持Excel文件批量导入产品数据
- 📁 **文件上传系统**：支持图片、PDF等文件上传与管理，包含权限控制和自动路径处理

## 🏗️ 技术架构

### 前端技术栈
- **React 18** - 现代化UI框架
- **Vite** - 快速构建工具
- **TypeScript** - 类型安全
- **Tailwind CSS** - 现代化样式框架
- **React Router** - 单页应用路由
- **Axios** - HTTP客户端

### 后端技术栈
- **WordPress** - 内容管理系统
- **PHP 8.0+** - 服务端语言
- **MySQL 8.0** - 数据库
- **REST API** - API接口
- **JWT认证** - 安全认证

### 部署技术栈
- **Docker** - 容器化部署
- **Docker Compose** - 多容器编排
- **Nginx** - 反向代理和负载均衡
- **SSL/HTTPS** - 安全传输

## 🚀 快速开始

### 🎯 方法一：一键部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url> bjt-product-system
cd bjt-product-system

# 2. 配置环境变量
cp env.production.example .env.production
# 编辑 .env.production 设置域名、数据库密码等

# 3. 一键部署（包含数据库自动初始化）
chmod +x deploy-with-db-init.sh
./deploy-with-db-init.sh
```

### 🌐 方法二：域名部署（生产环境）

```bash
# 1. 配置域名DNS解析
# 将域名A记录指向服务器IP

# 2. 配置环境变量
cp env.production.example .env.production
# 设置DOMAIN_NAME为你的域名

# 3. 申请SSL证书（可选）
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh your-domain.com

# 4. 部署前检查（推荐）
chmod +x scripts/pre-deploy-check.sh
./scripts/pre-deploy-check.sh

# 5. 执行部署
chmod +x deploy-production.sh
./deploy-production.sh
```

### 🖥️ 方法三：IP地址部署（无域名）

```bash
# 1. 配置IP环境
cp env.production.ip.example .env.production.ip
# 脚本会自动检测服务器IP

# 2. IP地址部署
chmod +x deploy-ip.sh
./deploy-ip.sh
```

### 🧪 方法四：本地测试部署

```bash
# 本地测试环境
docker-compose -f docker/prod/docker-compose.local.yml up -d

# 或者测试数据库初始化功能
chmod +x test-db-init.sh
./test-db-init.sh
```

## 🛠️ 生产环境管理脚本

### 核心部署脚本
- **`deploy-production.sh`** - 完整生产环境部署（248行）
- **`rebuilddb_production_v2.sh`** - 数据库重建脚本（137行）
- **`deploy-frontend-zero-downtime.sh`** - 零停机前端部署（290行）

### 运维管理脚本
- **`scripts/pre-deploy-check.sh`** - 部署前环境检查（233行）
- **`scripts/health-monitor.sh`** - 生产环境健康监控（392行）
- **`scripts/backup.sh`** - 数据库备份脚本
- **`scripts/setup-ssl.sh`** - SSL证书配置脚本

### 开发环境脚本
- **`scripts/deploy-spec-pdf-feature-dev.sh`** - 开发环境功能部署（494行）

### 🔧 开发环境故障排除工具
- **`fix-dev-mysql-safe.sh`** - 开发环境MySQL启动问题安全修复脚本（406行）
- **`DEV_MYSQL_FIX_GUIDE.md`** - 开发环境MySQL修复详细指南

**MySQL启动问题修复：**
```bash
# 诊断MySQL问题（安全，不执行修复）
./fix-dev-mysql-safe.sh --diagnose

# 执行完整修复流程
./fix-dev-mysql-safe.sh --fix

# 查看修复状态
./fix-dev-mysql-safe.sh --status

# 如果修复失败，一键回滚
./fix-dev-mysql-safe.sh --rollback
```

**安全保障机制：**
- ✅ **生产环境保护** - 每次操作前验证生产环境配置完整性
- ✅ **环境隔离** - 只修改开发环境配置，绝不影响生产环境
- ✅ **自动备份** - 操作前自动创建完整备份
- ✅ **中断恢复** - 支持中断后从断点继续执行
- ✅ **一键回滚** - 如果出现问题可立即回滚到修复前状态

### 推荐使用流程

**首次部署：**
```bash
./scripts/pre-deploy-check.sh  # 部署前检查
./deploy-production.sh         # 执行部署
./scripts/health-monitor.sh    # 设置监控
```

**日常维护：**
```bash
./deploy-frontend-zero-downtime.sh  # 前端零停机更新
./scripts/health-monitor.sh --report  # 生成健康报告
```

**故障处理：**
```bash
./rebuilddb_production_v2.sh    # 数据库重建（如需要）
# 参考：生产环境故障排除指南
```

### 📊 脚本使用场景总结

| 脚本名称 | 用途 | 使用场景 | 关键特性 |
|---------|------|----------|----------|
| `deploy-production.sh` | 完整生产部署 | 首次部署、大版本更新 | 248行，含环境检查、备份、健康检查 |
| `deploy-frontend-zero-downtime.sh` | 零停机前端更新 | 前端代码更新 | 290行，volume挂载，秒级切换 |
| `rebuilddb_production_v2.sh` | 数据库重建 | 数据损坏、结构更新 | 137行，保留WordPress核心 |
| `scripts/pre-deploy-check.sh` | 部署前检查 | 任何部署前 | 233行，全面环境验证 |
| `scripts/health-monitor.sh` | 健康监控 | 7x24小时监控 | 392行，自动修复、多渠道告警 |
| `scripts/deploy-spec-pdf-feature-dev.sh` | 开发环境部署 | 本地开发测试 | 494行，开发环境专用 |
| `fix-dev-mysql-safe.sh` | 开发环境MySQL修复 | MySQL启动问题 | 406行，安全修复、中断恢复、自动回滚 |
| `validate-data.sh` | 数据质量验证 | 数据导入前验证 | 全面检查、格式验证、安全检测 |

### 🎯 快速决策指南

**我应该用哪个脚本？**

- 🆕 **第一次部署** → `pre-deploy-check.sh` + `deploy-production.sh`
- 🔄 **前端更新** → `deploy-frontend-zero-downtime.sh`
- 🗄️ **数据库问题** → `rebuilddb_production_v2.sh`
- 🏥 **日常监控** → `health-monitor.sh` (定时任务)
- 🐛 **故障排查** → `health-monitor.sh --report` + 故障排除指南
- 🧪 **本地开发** → `deploy-spec-pdf-feature-dev.sh`
- 🔧 **开发环境MySQL问题** → `fix-dev-mysql-safe.sh`
- 📝 **数据导入前验证** → `validate-data.sh`

## 📁 项目结构

```
bjt-product-system/
├── frontend/                    # React前端应用
│   ├── src/
│   │   ├── components/         # 可复用组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API服务
│   │   ├── hooks/             # 自定义Hooks
│   │   └── types/             # TypeScript类型定义
│   └── public/                # 静态资源
├── backend/                    # WordPress后端
├── plugins/                    # WordPress插件
│   ├── bjt-core-entities/     # 核心实体插件
│   ├── bjt-product-admin/     # 产品管理插件
│   └── bjt-cors/              # CORS支持插件
├── docker/                     # Docker配置
│   ├── nginx/                 # Nginx配置和Dockerfile
│   ├── mysql/                 # MySQL配置和初始化脚本
│   ├── wordpress/             # WordPress配置
│   └── prod/                  # 生产环境Docker Compose配置
├── generated_sql_imports/      # 自动生成的SQL数据
├── scripts/                    # 部署和维护脚本
├── nginx/                      # Nginx配置文件
│   ├── conf.d/                # 各种环境的Nginx配置
│   └── ssl/                   # SSL证书目录
├── docs/                      # 项目文档
├── fix-dev-mysql-safe.sh      # 开发环境MySQL安全修复脚本
├── DEV_MYSQL_FIX_GUIDE.md     # 开发环境MySQL修复指南
├── validate-data.sh           # 数据质量验证工具
├── DATA_INPUT_GUIDELINES.md   # 数据输入规范指南
├── 数据录入操作手册.md         # 操作人员数据录入指南
├── 数据录入快速参考卡.md       # 打印版快速参考卡
├── logs/                      # 修复脚本日志目录
└── backups/                   # 修复脚本备份目录
```

## 🔧 部署选项详解

### 1. 🌐 域名部署（生产环境推荐）
**特性：**
- ✅ 支持HTTPS/SSL加密
- ✅ 自动SSL证书申请（Let's Encrypt）
- ✅ 完整的安全配置
- ✅ 生产级性能优化

**使用场景：** 正式生产环境，有域名的情况

**配置文件：** `docker/prod/docker-compose.prod.yml`

**详细指南：** [域名部署指南](DOMAIN_DEPLOYMENT_GUIDE.md)

### 2. 🖥️ IP地址部署（快速部署）
**特性：**
- ✅ 无需域名，直接使用IP访问
- ✅ HTTP协议，快速部署
- ✅ 自动检测服务器IP地址
- ✅ 适合内网或测试环境

**使用场景：** 内网部署、测试环境、没有域名的情况

**配置文件：** `docker/prod/docker-compose.ip.yml`

**详细指南：** [IP部署指南](NO_DOMAIN_DEPLOYMENT.md)

### 3. 🏠 本地开发部署
**特性：**
- ✅ 开发测试环境
- ✅ 端口8080访问
- ✅ 调试模式开启
- ✅ 热重载支持

**使用场景：** 本地开发、功能测试

**配置文件：** `docker/prod/docker-compose.local.yml`

## 🗄️ 数据库管理

### 🤖 自动初始化（推荐）
```bash
# 使用包含数据库自动初始化的部署脚本
./deploy-with-db-init.sh

# 或者使用标准部署脚本（已集成自动初始化）
./deploy.sh
./deploy-ip.sh
```

**自动初始化功能：**
- 首次部署自动创建数据库结构
- 自动导入Excel转换的产品数据
- 智能检测避免重复初始化
- 完整的错误处理和日志记录

### 🛠️ 手动管理
```bash
# 查看数据库状态
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 重建数据库（开发环境）
./rebuilddb.sh

# 备份数据库
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql-backup /backup.sh

# 查看数据库初始化日志
docker-compose -f docker/prod/docker-compose.prod.yml logs db-init
```

## 📊 数据导入

### 📝 数据输入规范（重要！）

为确保系统稳定性和数据质量，请严格遵循数据输入规范：

#### ⚠️ 严禁使用的字符
```
SQL危险字符: ' " ; -- /* */
HTML/XSS风险: < > script javascript
系统保留字符: \ ` | & 
控制字符: \n \r \t \0
```

#### ✅ 推荐格式
```bash
# 产品名称/型号
✅ "HP LaserJet Pro M404n"
❌ " HP LaserJet Pro M404n " (首尾空格)
❌ "HP@LaserJet#Pro" (特殊符号)

# 价格
✅ "2599.99"
❌ "￥2,599.99" (货币符号和千位分隔符)

# 电话
✅ "010-12345678" 或 "13812345678"
❌ "+86 138-1234-5678" (特殊符号)

# 邮箱
✅ "user@example.com"
❌ "用户@example.com" (中文字符)
```

#### 📏 字段长度限制
- 产品名称：1-100字符
- 产品型号：1-50字符
- 规格描述：1-500字符
- 价格：1-10字符（纯数字）

### 🔍 数据验证工具

在导入数据前，使用验证工具检查数据质量：

```bash
# 验证CSV文件
./validate-data.sh products.csv 3        # 第3列是价格
./validate-data.sh products.csv 3 5      # 第3列价格，第5列电话
./validate-data.sh products.csv 3 5 6    # 第3列价格，第5列电话，第6列邮箱
./validate-data.sh products.csv 3 5 6 7  # 第3列价格，第5列电话，第6列邮箱，第7列URL

# 自动清理数据问题
./clean-data.sh products.csv
```

**验证功能：**
- ✅ 检查危险字符和安全风险
- ✅ 验证价格、电话、邮箱格式
- ✅ 检查字段长度和编码问题
- ✅ 统计数据质量并提供修复建议

### Excel数据转换
系统支持从Excel文件自动转换为SQL数据：

```bash
# 转换Excel为SQL
python sql_to_excel_converter.py

# 生成的SQL文件会保存在 generated_sql_imports/ 目录
# 部署时会自动导入这些数据
```

### 支持的数据类型
- **设备信息**：主机、型号、规格、图片
- **耗材信息**：类型、兼容性、库存、价格
- **配件信息**：规格、价格、库存、适配性
- **备件信息**：零件号、适用设备、库存

### 数据文件结构
```
generated_sql_imports/
├── _设备.sql          # 设备数据
├── _耗材.sql          # 耗材数据
└── init.sql           # 数据库结构（位于docker/dev/mysql/）
```

## 🔍 监控和维护

### 🏥 健康监控（推荐）
```bash
# 一键健康检查
./scripts/health-monitor.sh

# 生成详细报告
./scripts/health-monitor.sh --report

# 静默模式（适合cron定时任务）
./scripts/health-monitor.sh --quiet

# 邮件告警模式
./scripts/health-monitor.sh --email alerts@company.com

# Telegram告警模式  
./scripts/health-monitor.sh --telegram "your-bot-token:chat-id"
```

**监控功能：**
- ✅ 网站可访问性检查
- ✅ API接口状态检查
- ✅ 容器运行状态监控
- ✅ 系统资源使用监控
- ✅ SSL证书到期检查
- ✅ 自动故障恢复
- ✅ 多渠道告警通知

### 🔧 部署前检查
```bash
# 部署前系统检查
./scripts/pre-deploy-check.sh

# 仅检查不修复
./scripts/pre-deploy-check.sh --check-only

# 详细输出模式
./scripts/pre-deploy-check.sh --verbose
```

**检查项目：**
- ✅ 系统要求验证（Docker、内存、磁盘）
- ✅ 环境变量配置验证
- ✅ SSL证书检查
- ✅ 端口可用性检查
- ✅ Docker Compose配置验证
- ✅ 前端依赖检查
- ✅ 后端插件验证

### 📊 服务状态查看
```bash
# 查看所有容器状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress
docker-compose -f docker/prod/docker-compose.prod.yml logs db-init
```

### 📈 性能监控
```bash
# 查看资源使用
docker stats

# 查看数据库性能
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql \
  mysql -u root -p -e "SHOW PROCESSLIST; SHOW STATUS LIKE 'Threads%';"

# 查看Nginx访问日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx | grep "GET\|POST"
```

### 🔄 服务管理
```bash
# 重启服务
docker-compose -f docker/prod/docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker/prod/docker-compose.prod.yml down

# 更新服务
docker-compose -f docker/prod/docker-compose.prod.yml pull
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 零停机前端更新
./deploy-frontend-zero-downtime.sh
```

## 🔐 安全配置

### 生产环境安全
- **强密码策略** - 数据库和WordPress管理员密码
- **JWT认证机制** - API接口安全认证
- **HTTPS强制加密** - 所有通信加密传输
- **定期安全更新** - 及时更新系统组件
- **防火墙配置** - 只开放必要端口（80, 443）

### 数据备份
- **自动数据库备份** - 定时备份数据库
- **配置文件备份** - 重要配置文件备份
- **灾难恢复计划** - 完整的恢复流程

## 📚 完整文档

### 🚨 生产环境运维（重要）
- [🚨 **生产环境故障排除指南**](PRODUCTION_TROUBLESHOOTING_GUIDE.md) - **1018行完整故障排除文档**
- [📋 部署检查清单](DEPLOYMENT_CHECKLIST.md) - 生产环境部署验证
- [🏥 健康监控脚本](scripts/health-monitor.sh) - 392行自动监控
- [🔧 部署前检查脚本](scripts/pre-deploy-check.sh) - 233行环境验证

### 部署相关
- [🗄️ 数据库自动初始化](DATABASE_AUTO_INIT.md)
- [🌐 域名部署指南](DOMAIN_DEPLOYMENT_GUIDE.md)
- [⚡ 快速部署指南](DOMAIN_QUICK_DEPLOY.md)
- [🖥️ IP地址部署](NO_DOMAIN_DEPLOYMENT.md)
- [📋 完整部署文档](README_DOMAIN_DEPLOYMENT.md)
- [🏗️ 部署架构详解](DEPLOYMENT_ARCHITECTURE.md) - 455行架构文档

### 技术文档
- [🔌 API接口文档](API_INTERFACE_DOCUMENTATION_UPDATE.md)
- [🔄 API通信流程](API_COMMUNICATION_FLOW.md)
- [📊 SQL Excel转换器](SQL_EXCEL_CONVERTER_README.md)
- [📁 文件上传系统](docs/FILE_UPLOAD_SYSTEM.md)
- [📄 PDF上传功能](PDF_UPLOAD_IMPLEMENTATION.md) - 152行功能实现文档
- [📝 **数据输入规范指南**](DATA_INPUT_GUIDELINES.md) - **完整的数据质量规范**

### 📋 操作人员文档
- [👥 **数据录入操作手册**](数据录入操作手册.md) - **给非技术人员的简明操作指南**
- [📋 **数据录入快速参考卡**](数据录入快速参考卡.md) - **可打印的桌面参考卡片**

### 开发调试
- [🔧 Docker构建修复](DOCKER_BUILD_FIXES.md)
- [🛠️ 基础故障排除指南](TROUBLESHOOTING.md)
- [🧪 开发环境部署](scripts/deploy-spec-pdf-feature-dev.sh) - 494行开发脚本
- [🔧 **开发环境MySQL修复指南**](DEV_MYSQL_FIX_GUIDE.md) - **完整的MySQL问题解决方案**

## 🎯 访问地址

部署完成后，可通过以下地址访问：

### 域名部署
- **前端应用**: https://your-domain.com
- **WordPress管理后台**: https://your-domain.com/wp-admin
- **API接口**: https://your-domain.com/wp-json/bjt/v1

### IP地址部署
- **前端应用**: http://your-server-ip
- **WordPress管理后台**: http://your-server-ip/wp-admin
- **API接口**: http://your-server-ip/wp-json/bjt/v1

### 本地部署
- **前端应用**: http://localhost:8080
- **WordPress管理后台**: http://localhost:8080/wp-admin
- **API接口**: http://localhost:8080/wp-json/bjt/v1

### 本地开发环境（使用nginx配置）
- **前端应用**: http://localhost （nginx代理）
- **前端开发服务器**: http://localhost:5173 （Vite开发服务器）
- **WordPress后端**: http://localhost:8080
- **WordPress管理后台**: http://localhost:8080/wp-admin
- **API接口**: http://localhost:8080/wp-json/bjt/v1
- **MySQL数据库**: localhost:3306

## 🛠️ 开发指南

### 本地开发环境
```bash
# 启动开发环境
docker-compose -f docker/dev/docker-compose.nginx.yml up -d

# 前端开发
cd frontend
npm install
npm run dev

# 后端开发
# WordPress插件开发在 plugins/ 目录
```

### 开发环境常见问题

#### MySQL启动问题
如果开发环境MySQL启动失败，使用安全修复工具：

```bash
# 快速诊断问题
./fix-dev-mysql-safe.sh --diagnose

# 自动修复（如果诊断发现问题）
./fix-dev-mysql-safe.sh --fix
```

**常见MySQL问题：**
- 端口3306被占用
- Docker容器冲突
- 数据卷权限问题
- 配置文件错误

详细指南请参考：[开发环境MySQL修复指南](DEV_MYSQL_FIX_GUIDE.md)

### 代码贡献
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交代码 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 开发工具
- **前端热重载** - Vite开发服务器
- **API测试** - 内置API测试脚本
- **数据库管理** - phpMyAdmin或命令行工具
- **日志查看** - Docker Compose日志

## 📞 技术支持

如果遇到问题，请按以下顺序排查：

1. **查看健康监控** - 首先运行 `./scripts/health-monitor.sh --report` 获取系统状态
2. **查看故障排除指南** - 参考 [生产环境故障排除指南](PRODUCTION_TROUBLESHOOTING_GUIDE.md)（**1018行完整解决方案**）
3. **检查服务日志** - 使用Docker Compose查看具体错误日志
4. **验证环境配置** - 运行 `./scripts/pre-deploy-check.sh` 检查配置
5. **查看部署检查清单** - 参考 [部署检查清单](DEPLOYMENT_CHECKLIST.md) 验证部署步骤
6. **提交Issue** - 在GitHub上提交详细的问题报告（附上健康监控报告）

### 🆘 紧急故障处理

**系统完全无法访问：**
```bash
# 1. 快速诊断
./scripts/health-monitor.sh --emergency

# 2. 查看所有服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 3. 重启所有服务
docker-compose -f docker/prod/docker-compose.prod.yml restart

# 4. 如仍无法恢复，查看详细日志
docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=100
```

**数据库相关问题：**
```bash
# 重建数据库（保留WordPress核心）
./rebuilddb_production_v2.sh
```

### 常用调试命令
```bash
# 检查服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看错误日志
docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=50

# 进入容器调试
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress bash
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p

# 系统健康检查
./scripts/health-monitor.sh

# 部署前环境检查  
./scripts/pre-deploy-check.sh

# 开发环境MySQL问题修复
./fix-dev-mysql-safe.sh --diagnose  # 诊断问题
./fix-dev-mysql-safe.sh --fix       # 执行修复
```

### 📄 故障报告模板

当提交问题时，请包含以下信息：

1. **系统环境**：操作系统、Docker版本
2. **健康监控报告**：`./scripts/health-monitor.sh --report` 的输出
3. **错误日志**：相关的Docker容器日志
4. **复现步骤**：详细的操作步骤
5. **期望结果**：预期应该发生什么
6. **实际结果**：实际发生了什么

## 📈 性能优化

### 生产环境优化
- **Nginx缓存配置** - 静态文件缓存
- **MySQL性能调优** - 缓冲池和连接优化
- **PHP-FPM优化** - 进程管理优化
- **前端资源压缩** - Gzip压缩和资源合并

### 监控指标
- **响应时间** - API接口响应时间
- **资源使用** - CPU、内存、磁盘使用率
- **数据库性能** - 查询时间和连接数
- **错误率** - 应用错误和HTTP错误

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**BJT产品管理系统** - 让产品管理更简单、更高效！ 🚀

## 🎯 重要提示与快速指引

### 🆕 首次部署
```bash
# 推荐的首次部署流程
./scripts/pre-deploy-check.sh           # 部署前检查
./deploy-production.sh                  # 执行部署
./scripts/health-monitor.sh --report    # 验证部署结果
```

### 🚨 遇到问题时
1. **立即诊断** → `./scripts/health-monitor.sh --report`
2. **查看指南** → [生产环境故障排除指南](PRODUCTION_TROUBLESHOOTING_GUIDE.md) (1018行完整解决方案)
3. **紧急恢复** → `./scripts/health-monitor.sh --emergency`

### 📚 关键文档
- 🚨 [生产环境故障排除指南](PRODUCTION_TROUBLESHOOTING_GUIDE.md) - **最重要的参考文档**
- 📋 [部署检查清单](DEPLOYMENT_CHECKLIST.md) - 部署验证
- 🏗️ [部署架构详解](DEPLOYMENT_ARCHITECTURE.md) - 技术架构

### 🛠️ 常用命令
```bash
# 健康检查
./scripts/health-monitor.sh

# 零停机更新前端
./deploy-frontend-zero-downtime.sh

# 数据库重建
./rebuilddb_production_v2.sh
```

> 💡 **新用户提示**: 如果你是第一次部署，推荐使用 `./scripts/pre-deploy-check.sh` + `./deploy-production.sh` 的组合，它们会自动处理所有初始化工作。

> 🚨 **运维提示**: 建议设置 `./scripts/health-monitor.sh` 为定时任务，实现24/7自动监控。