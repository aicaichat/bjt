# BJT Core Entities 部署指南

本文档提供了部署 BJT Core Entities 插件的详细指南，包括所需的依赖、安装步骤和配置过程。

## 1. 系统要求

- WordPress 5.0 或更高版本
- PHP 7.4 或更高版本
- MySQL 5.6 或更高版本
- Docker 和 Docker Compose (用于开发环境)

## 2. 依赖项

### 2.1 PHP 依赖

- Firebase JWT 库 (v6.0+)

## 3. 安装步骤

### 3.1 准备插件目录结构

确保插件目录结构如下:

```
plugins/bjt-core-entities/
├── controllers/
│   ├── class-order-controller.php
│   ├── class-auth-controller.php
│   └── ... (其他控制器文件)
├── includes/
│   ├── class-auth.php
│   └── ... (其他核心类文件)
├── models/
├── docs/
├── tests/
├── vendor/
├── bjt-product-api.php (主插件文件)
├── composer.json
└── composer.lock
```

### 3.2 安装 Composer 依赖

在插件目录中运行:

```bash
cd plugins/bjt-core-entities
composer install
```

如果 `composer.json` 文件不存在或不完整，创建或更新它:

```json
{
    "require": {
        "firebase/php-jwt": "^6.0"
    }
}
```

### 3.3 数据库配置

插件使用以下自定义数据库表:

- `wp_bjt_orders` - 存储订单信息
- `wp_bjt_order_items` - 存储订单项目
- `wp_bjt_cart_items` - 存储购物车项目
- `wp_bjt_prices` - 存储产品价格
- `wp_bjt_inventory` - 存储产品库存

初始化表结构的 SQL 脚本应包含在插件的激活钩子中。

### 3.4 Docker 环境设置 (开发用)

使用提供的 docker-compose 配置文件启动开发环境:

```bash
docker-compose -f docker/dev/docker-compose.nginx.yml up -d
```

## 4. 配置

### 4.1 JWT 认证配置

设置 JWT 密钥:

```bash
# 在 WordPress 容器内运行
docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress wp option update jwt_auth_secret_key "bjt-secret-key-2023" --allow-root
```

或者通过 WordPress 管理界面设置:

1. 进入 WordPress 管理后台
2. 导航到 "设置"
3. 添加 `jwt_auth_secret_key` 选项，值设为你的密钥

### 4.2 API 端点配置

插件会自动注册以下 API 端点:

- 认证: `/wp-json/bjt/v1/auth/*`
- 用户: `/wp-json/bjt/v1/user/*`
- 订单: `/wp-json/bjt/v1/orders/*`
- 产品线: `/wp-json/bjt/v1/product-lines/*`
- 设备: `/wp-json/bjt/v1/machines/*`
- 配件: `/wp-json/bjt/v1/accessories/*`
- 耗材: `/wp-json/bjt/v1/consumables/*`
- 备件: `/wp-json/bjt/v1/spare-parts/*`
- 购物车: `/wp-json/bjt/v1/cart/*`
- 数据字典: `/wp-json/bjt/v1/dictionaries/*`

## 5. 测试部署

### 5.1 验证 API 可访问性

使用提供的测试脚本验证 API 是否正常工作:

```bash
bash test-api-comprehensive.sh
```

该脚本将测试所有 API 端点并输出结果。

### 5.2 检查 JWT 认证

测试 JWT 认证是否正常工作:

```bash
curl -X POST http://localhost:8080/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## 6. 故障排除

### 6.1 JWT 认证问题

如果出现 JWT 验证错误，请检查:

- JWT 密钥是否正确设置
- Firebase JWT 库版本是否为 v6.0 或更高
- 确保 `class-auth.php` 文件中的 `validate_token` 方法使用了正确的 JWT 解码格式:

```php
$key = $this->get_secret_key();
$payload = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
```

### 6.2 数据库错误

如果遇到数据库错误:

- 检查数据库表是否已正确创建
- 验证表前缀是否与 WordPress 配置一致
- 检查数据库用户权限

### 6.3 API 响应问题

如果 API 返回格式不一致:

- 确保所有控制器都使用 `format_response` 方法来格式化响应
- 检查控制器中的 `get_items`, `get_item`, `create_item` 等方法是否返回标准格式的响应

## 7. 更新插件

更新插件时的步骤:

1. 备份当前插件文件和数据库
2. 替换更新的文件
3. 运行 composer 更新依赖
   ```bash
   composer update
   ```
4. 重启 WordPress 服务
   ```bash
   docker-compose -f docker/dev/docker-compose.nginx.yml restart wordpress
   ```
5. 运行测试脚本验证功能

## 8. 参考资料

- [API 接口文档](docs/api/API接口文档.md)
- [测试结果](TEST_RESULTS.md)
- [待办项](TODO.md) 