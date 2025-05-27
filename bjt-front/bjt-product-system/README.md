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

# 4. 部署
./deploy.sh
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
└── docs/                      # 项目文档
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

### 查看服务状态
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

### 性能监控
```bash
# 查看资源使用
docker stats

# 查看数据库性能
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql \
  mysql -u root -p -e "SHOW PROCESSLIST; SHOW STATUS LIKE 'Threads%';"

# 查看Nginx访问日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx | grep "GET\|POST"
```

### 服务管理
```bash
# 重启服务
docker-compose -f docker/prod/docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker/prod/docker-compose.prod.yml down

# 更新服务
docker-compose -f docker/prod/docker-compose.prod.yml pull
docker-compose -f docker/prod/docker-compose.prod.yml up -d
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

### 部署相关
- [🗄️ 数据库自动初始化](DATABASE_AUTO_INIT.md)
- [🌐 域名部署指南](DOMAIN_DEPLOYMENT_GUIDE.md)
- [⚡ 快速部署指南](DOMAIN_QUICK_DEPLOY.md)
- [🖥️ IP地址部署](NO_DOMAIN_DEPLOYMENT.md)
- [📋 完整部署文档](README_DOMAIN_DEPLOYMENT.md)

### 技术文档
- [🔌 API接口文档](API_INTERFACE_DOCUMENTATION_UPDATE.md)
- [🏗️ 部署架构](DEPLOYMENT_ARCHITECTURE.md)
- [🔄 API通信流程](API_COMMUNICATION_FLOW.md)
- [📊 SQL Excel转换器](SQL_EXCEL_CONVERTER_README.md)

### 故障排除
- [🔧 Docker构建修复](DOCKER_BUILD_FIXES.md)
- [🛠️ 故障排除指南](TROUBLESHOOTING.md)

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

1. **查看相关文档** - 检查对应的文档说明
2. **检查服务日志** - 使用Docker Compose查看日志
3. **验证配置文件** - 确认环境变量和配置正确
4. **查看故障排除指南** - 参考常见问题解决方案
5. **提交Issue** - 在GitHub上提交详细的问题报告

### 常用调试命令
```bash
# 检查服务状态
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 查看错误日志
docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=50

# 进入容器调试
docker-compose -f docker/prod/docker-compose.prod.yml exec wordpress bash
docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p
```

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

> 💡 **提示**: 如果你是第一次部署，推荐使用 `./deploy-with-db-init.sh` 脚本，它会自动处理所有初始化工作。