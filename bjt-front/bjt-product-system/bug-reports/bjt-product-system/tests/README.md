# BJT Product System API 测试工具

本目录包含了一系列用于测试BJT Product System API的工具和示例。这些测试工具可以帮助开发人员了解API的使用方法，并验证API的功能是否正常。

## 测试工具列表

1. **api-test.php** - PHP命令行测试脚本，测试所有主要API端点
2. **api-client.php** - PHP API客户端示例，演示如何在PHP应用中集成API
3. **api-js-client.js** - JavaScript API客户端，用于在前端应用中调用API
4. **api-test.html** - HTML测试页面，用于测试JavaScript API客户端

## 使用方法

### PHP命令行测试

```bash
# 复制文件到WordPress根目录
cp api-test.php /path/to/wordpress/

# 切换到WordPress根目录
cd /path/to/wordpress/

# 执行测试脚本
php api-test.php
```

### PHP API客户端

```php
// 引入客户端类
require_once 'api-client.php';

// 创建客户端实例
$api_client = new BJT_API_Client('http://your-site.com/wp-json/bjt/v1');

// 获取产品线列表
$product_lines = $api_client->get_product_lines();
print_r($product_lines);
```

### JavaScript测试页面

1. 将`api-js-client.js`和`api-test.html`上传到您的服务器
2. 在浏览器中打开`api-test.html`
3. 页面会显示产品线列表，并允许您添加、编辑和删除产品线

或者，您可以直接使用JavaScript客户端在您自己的前端应用中：

```javascript
// 创建客户端实例
const apiClient = new BJTApiClient('http://your-site.com/wp-json/bjt/v1');

// 获取产品线列表
apiClient.getProductLines()
  .then(productLines => {
    console.log(productLines);
  })
  .catch(error => {
    console.error('获取产品线失败:', error);
  });
```

## 注意事项

1. 使用这些测试工具前，请确保BJT Product System插件已正确安装和激活
2. 在测试脚本中修改API基础URL以匹配您的WordPress站点地址
3. 如果您的API需要认证，请在脚本中修改认证信息
4. 测试脚本中的某些操作会修改数据库内容，请在非生产环境中使用

## API认证

BJT Product System API使用WordPress的标准REST API认证方法。如果您的站点安装了JWT认证插件，可以使用以下方式获取认证令牌：

```php
// PHP
$api_client->authenticate('username', 'password');
```

```javascript
// JavaScript
apiClient.authenticate('username', 'password')
  .then(token => {
    console.log('认证成功:', token);
  })
  .catch(error => {
    console.error('认证失败:', error);
  });
```

## 自定义和扩展

这些测试工具可以根据您的需要进行自定义和扩展：

1. 添加新的API端点测试
2. 修改客户端类添加更多方法
3. 优化错误处理和日志记录
4. 添加更多的测试页面功能

## 贡献

如果您发现这些测试工具有任何问题，或者想要提供改进建议，请联系插件开发团队。 