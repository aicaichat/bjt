# BJT产品管理系统

## 项目结构
```
bjt-product-system/
├── plugins/           # WordPress插件
│   └── bjt-product-admin/  # 产品管理插件
│       ├── includes/       # 核心功能
│       │   ├── admin/     # 管理后台逻辑
│       │   ├── api/       # REST API接口
│       │   └── functions.php
│       ├── templates/     # 后台页面模板
│       │   └── admin/     # 对应mockup的后台页面
│       │       ├── product-lines/  # 产品线管理
│       │       ├── machines/       # 主机管理
│       │       ├── accessories/    # 配件管理
│       │       └── consumables/    # 耗材管理
│       └── assets/        # JS、CSS等资源文件
├── wordpress/         # WordPress核心文件
├── docker/           # Docker配置
│   ├── dev/         # 开发环境配置
│   └── prod/        # 生产环境配置
├── nginx/           # Nginx配置
├── docs/            # 项目文档
└── scripts/         # 维护脚本
```

## 开发环境设置

### 前置要求
- Docker & Docker Compose
- PHP 8.0+
- WordPress 6.0+
- MySQL 8.0+

### 开发环境配置

#### 1. 环境变量配置
开发环境使用 `.env.development` 文件配置环境变量：
```ini
# WordPress配置
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress
WORDPRESS_DEBUG=1

# MySQL配置
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress
```

#### 2. 启动开发环境
```bash
# 1. 克隆项目
git clone <repository_url>
cd bjt-product-system

# 2. 启动开发环境
docker-compose -f docker/dev/docker-compose.dev.yml up -d

# 3. 访问WordPress后台
http://localhost:8080/wp-admin
```

#### 3. 开发环境服务
- WordPress后台：http://localhost:8080/wp-admin
- REST API：http://localhost:8080/wp-json/bjt/v1/
- MySQL数据库：localhost:3306

### 开发工作流

#### 1. WordPress插件开发
- 插件开发在 `plugins/bjt-product-admin` 目录
- 页面模板在 `templates/admin` 目录
- 使用WordPress钩子和过滤器
- 遵循WordPress编码规范

#### 2. 后台页面开发
- 基于mockup实现对应的PHP模板
- 使用WordPress内置的样式和组件
- 通过AJAX实现无刷新交互
- 支持文件上传和媒体管理

#### 3. API开发
- 实现REST API接口
- 使用WordPress权限系统
- 支持多语言
- 数据验证和安全处理

#### 4. 数据库操作
- 使用WordPress的 `$wpdb`
- 事务处理
- 数据迁移
- 性能优化

## 部署说明

### 生产环境部署
```bash
# 1. 配置环境变量
cp .env.example .env.production
# 编辑.env.production文件

# 2. 启动生产环境
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

### 插件打包
```bash
# 打包插件
./scripts/package-plugin.sh
```

## 开发规范

### WordPress插件开发规范
1. 使用WordPress钩子系统
2. 遵循WordPress编码标准
3. 使用prepare语句处理SQL
4. 权限检查和数据验证
5. 支持国际化

### 后台页面开发规范
1. 使用WordPress内置函数和API
2. 统一的错误处理
3. 表单验证和安全处理
4. 响应式设计
5. 用户体验优化

### 安全规范
1. 输入数据验证
2. SQL注入防护
3. XSS防护
4. CSRF防护
5. 文件上传安全

## 文档
- [API文档](docs/API-DOCUMENTATION.md)
- [数据库设计](docs/DATABASE-DESIGN.md)
- [任务清单](docs/TASK-LIST.md)

## 注意事项
1. 所有代码必须放在对应目录中
2. 遵循WordPress插件开发规范
3. 使用prepare语句处理SQL
4. 注意安全性和性能
5. 保持代码整洁和可维护性

## 技术栈
- 前端：React 18 + TypeScript + Vite + Ant Design
- 后端：WordPress (PHP 8.0+)
- 数据库：MySQL 8.0
- 容器化：Docker + Docker Compose
- 服务器：Nginx 1.20+

## 维护命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down
```

⚠️ 注意：请勿在 `bjt-front/bjt-front/`、`bjt-front/backend/`、`bjt-front/frontend/` 目录下开发或存放代码。所有代码请放在 `bjt-front/bjt-product-system/` 下的对应子目录！ 