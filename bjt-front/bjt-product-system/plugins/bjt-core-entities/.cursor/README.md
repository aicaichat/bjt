# BJT产品管理系统REST API插件

基于WordPress的产品管理系统API，提供产品线、机器、配件、耗材、备件、购物车和订单等相关功能的API接口。

## 特性

- 标准化的REST API响应格式
- JWT认证
- 多语言支持（中文/英文）
- 多区域支持（中国/欧洲/北美/澳洲）
- 模块化的代码结构
- 自动数据库表创建
- 详细的API文档
- CORS支持

## 安装

1. 将`bjt-core-entities`目录上传到WordPress的`wp-content/plugins/`目录下
2. 在WordPress管理后台激活插件
3. 插件会自动创建必要的数据库表
4. API端点将在`/wp-json/bjt/v1/`路径下可用

## API端点

### 认证相关

- `POST /bjt/v1/auth/login`: 用户登录
- `POST /bjt/v1/auth/refresh`: 刷新令牌
- `POST /bjt/v1/auth/logout`: 退出登录
- `GET /bjt/v1/user/me`: 获取当前用户信息

### 产品线相关

- `GET /bjt/v1/product-lines`: 获取产品线列表
- `POST /bjt/v1/product-lines`: 创建产品线
- `GET /bjt/v1/product-lines/{id}`: 获取单个产品线详情
- `PUT /bjt/v1/product-lines/{id}`: 更新产品线
- `DELETE /bjt/v1/product-lines/{id}`: 删除产品线

### 机器（设备）相关

- `GET /bjt/v1/machines`: 获取机器列表
- `POST /bjt/v1/machines`: 创建机器
- `GET /bjt/v1/machines/{id}`: 获取单个机器详情
- `PUT /bjt/v1/machines/{id}`: 更新机器
- `DELETE /bjt/v1/machines/{id}`: 删除机器
- `GET /bjt/v1/machines/{id}/accessories`: 获取机器配件

### 配件相关

- `GET /bjt/v1/accessories`: 获取配件列表
- `POST /bjt/v1/accessories`: 创建配件
- `GET /bjt/v1/accessories/{id}`: 获取单个配件详情
- `PUT /bjt/v1/accessories/{id}`: 更新配件
- `DELETE /bjt/v1/accessories/{id}`: 删除配件
- `GET /bjt/v1/accessories/{id}/children`: 获取配件子配件
- `GET /bjt/v1/accessories/{id}/required`: 获取配件必选备件

### 耗材相关

- `GET /bjt/v1/consumables`: 获取耗材列表
- `POST /bjt/v1/consumables/prices/batch`: 批量获取耗材价格
- `POST /bjt/v1/consumables/inventory/batch`: 批量获取耗材库存

### 备件相关

- `GET /bjt/v1/spare-parts`: 获取备件列表
- `GET /bjt/v1/spare-parts/{id}`: 获取单个备件详情
- `GET /bjt/v1/spare-parts/{id}/compatibility`: 检查备件兼容性

### 购物车相关

- `GET /bjt/v1/cart`: 获取购物车
- `POST /bjt/v1/cart/items`: 添加商品到购物车
- `PUT /bjt/v1/cart/items/{id}`: 更新购物车商品
- `DELETE /bjt/v1/cart/items/{id}`: 从购物车移除商品
- `POST /bjt/v1/cart/clear`: 清空购物车

### 订单相关

- `GET /bjt/v1/orders`: 获取订单列表
- `POST /bjt/v1/orders`: 创建订单
- `GET /bjt/v1/orders/{id}`: 获取单个订单详情
- `PUT /bjt/v1/orders/{id}/status`: 更新订单状态

## 常见参数

所有列表API都支持以下参数：

- `page`: 页码，从1开始
- `page_size`: 每页记录数，默认为10

大多数API都支持以下参数：

- `lang`: 语言，可选值为`zh`（中文，默认）和`en`（英文）
- `region`: 区域，可选值为`CN`（中国，默认）、`EU`（欧洲）、`NA`（北美）和`AU`（澳洲）

## 响应格式

所有API响应都使用统一的JSON格式：

```json
{
  "success": true|false,
  "data": { ... },
  "message": "成功/错误信息（可选）",
  "code": 200 // 错误码（仅出错时返回）
}
```

## 分页响应格式

支持分页的API使用以下格式：

```json
{
  "success": true,
  "data": {
    "items": [ ... 数据项数组 ... ],
    "total": 100,    // 总记录数
    "page": 1,       // 当前页码
    "page_size": 10, // 每页记录数
    "total_pages": 10 // 总页数
  }
}
```

## 认证

除了部分公开API，大多数API都需要认证。认证使用JWT令牌，在请求头中添加：

```
Authorization: Bearer {token}
```

## 开发者说明

### 添加新控制器

1. 在`controllers`目录下创建新的控制器类文件，命名为`class-{resource}-controller.php`
2. 继承`BJT_API_Controller`基类
3. 实现`register_routes`方法注册路由
4. 在`bjt-product-api.php`的`$controllers`数组中添加新控制器

### 数据库结构

插件使用以下数据表：

- `wp_bjt_product_lines`: 产品线
- `wp_bjt_machines`: 机器（设备）
- `wp_bjt_accessories`: 配件
- `wp_bjt_consumables`: 耗材
- `wp_bjt_spare_parts`: 备件
- `wp_bjt_carts`: 购物车
- `wp_bjt_cart_items`: 购物车商品
- `wp_bjt_orders`: 订单
- `wp_bjt_order_items`: 订单商品

## 问题排查

如果API不能正常工作，请检查：

1. 插件是否已激活
2. 数据库表是否已创建
3. WordPress Permalink设置是否已配置（建议使用"文章名称"选项）
4. WordPress REST API是否正常工作（可以通过访问`/wp-json/`检查）
5. 服务器是否支持CORS（如果从其他域名访问API）

## 许可证

本插件只供BJT公司内部使用，未经授权不得外传或商用。 