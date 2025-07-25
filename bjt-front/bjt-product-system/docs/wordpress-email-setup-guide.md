# WordPress邮件设置完整指南

## 概述

本指南详细介绍如何在BJT产品管理系统中配置WordPress邮件功能，包括SMTP设置、邮件模板、测试验证等。

## 1. 邮件系统架构

### 1.1 系统组件
- **WordPress核心邮件系统**：基于PHPMailer库
- **BJT邮件服务类**：自定义邮件服务封装
- **SMTP配置**：支持多种邮件服务商
- **邮件模板系统**：HTML邮件模板管理

### 1.2 文件结构
```
plugins/bjt-core-entities/
├── includes/
│   └── class-email-service.php        # 邮件服务类
├── controllers/
│   └── class-settings-controller.php  # 设置控制器
└── templates/
    └── email/                          # 邮件模板目录
        ├── user-registration.html
        ├── password-reset.html
        └── rma-notification.html
```

## 2. SMTP配置

### 2.1 支持的邮件服务商

#### Gmail配置
```php
'smtp_host' => 'smtp.gmail.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls',
'smtp_username' => 'your-email@gmail.com',
'smtp_password' => 'your-app-password', // 使用应用专用密码
```

#### Outlook/Hotmail配置
```php
'smtp_host' => 'smtp-mail.outlook.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls',
'smtp_username' => 'your-email@outlook.com',
'smtp_password' => 'your-password',
```

#### QQ邮箱配置
```php
'smtp_host' => 'smtp.qq.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls',
'smtp_username' => 'your-email@qq.com',
'smtp_password' => 'your-authorization-code', // 使用授权码
```

#### 163邮箱配置
```php
'smtp_host' => 'smtp.163.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls',
'smtp_username' => 'your-email@163.com',
'smtp_password' => 'your-authorization-code', // 使用授权码
```

#### 企业邮箱配置
```php
'smtp_host' => 'smtp.exmail.qq.com',      // 腾讯企业邮箱
'smtp_port' => 587,
'smtp_encryption' => 'tls',
'smtp_username' => 'your-email@company.com',
'smtp_password' => 'your-password',
```

### 2.2 端口和加密方式

| 端口 | 加密方式 | 说明 |
|------|----------|------|
| 25   | none     | 标准SMTP端口（不推荐） |
| 587  | tls      | STARTTLS加密（推荐） |
| 465  | ssl      | SSL加密 |

## 3. 前端配置界面

### 3.1 访问设置页面
1. 登录管理后台
2. 导航到"系统设置"
3. 点击"邮件设置"标签

### 3.2 配置项说明

#### 基础配置
- **SMTP服务器**：邮件服务商的SMTP地址
- **端口**：SMTP端口号（通常为587）
- **加密方式**：选择TLS或SSL
- **用户名**：完整的邮箱地址
- **密码**：邮箱密码或授权码

#### 发件人设置
- **发件人邮箱**：系统发送邮件时显示的发件人地址
- **发件人名称**：显示的发件人名称（如"BJT系统"）

### 3.3 测试邮件功能
1. 完成SMTP配置
2. 点击"测试邮件设置"按钮
3. 系统会发送测试邮件到管理员邮箱
4. 检查邮件是否正常接收

## 4. 后端API接口

### 4.1 获取邮件设置
```http
GET /wp-json/bjt/v1/settings
```

### 4.2 更新邮件设置
```http
PUT /wp-json/bjt/v1/settings
Content-Type: application/json

{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_encryption": "tls",
  "smtp_username": "your-email@gmail.com",
  "smtp_password": "your-app-password",
  "mail_from_address": "noreply@bjt.com",
  "mail_from_name": "BJT系统"
}
```

### 4.3 测试邮件设置
```http
POST /wp-json/bjt/v1/settings/test-email
Content-Type: application/json

{
  "test_email": "admin@company.com"
}
```

## 5. 邮件模板系统

### 5.1 模板类型
- **用户注册通知**：新用户注册时发送
- **密码重置**：用户请求密码重置时发送
- **RMA通知**：退货申请状态变更时发送
- **订单通知**：订单状态变更时发送

### 5.2 模板变量
邮件模板支持以下变量：
- `{username}`：用户名
- `{email}`：用户邮箱
- `{order_number}`：订单号
- `{rma_number}`：RMA编号
- `{company_name}`：公司名称
- `{site_url}`：网站地址

### 5.3 自定义模板
```php
// 在functions.php中添加自定义模板
add_filter('bjt_email_template_user_registration', function($template, $user_data) {
    return '
    <html>
    <body>
        <h2>欢迎注册{company_name}</h2>
        <p>亲爱的 {username}，</p>
        <p>感谢您注册我们的系统！</p>
        <p>您的邮箱：{email}</p>
    </body>
    </html>';
}, 10, 2);
```

## 6. 常见问题解决

### 6.1 邮件发送失败

#### 问题：SMTP连接失败
**解决方案：**
1. 检查SMTP服务器地址和端口
2. 确认网络连接正常
3. 检查防火墙设置

#### 问题：认证失败
**解决方案：**
1. 确认用户名和密码正确
2. 对于Gmail，使用应用专用密码
3. 对于QQ/163邮箱，使用授权码而非登录密码

#### 问题：邮件被拒绝
**解决方案：**
1. 检查发件人邮箱设置
2. 确认邮件内容不包含敏感词
3. 设置合适的邮件头信息

### 6.2 调试模式

#### 启用调试
在`wp-config.php`中添加：
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

#### 查看日志
邮件发送错误会记录在：
```
/wp-content/debug.log
```

### 6.3 性能优化

#### 异步发送
```php
// 使用WordPress的wp_schedule_single_event实现异步发送
wp_schedule_single_event(time(), 'bjt_send_email', array($email_data));
```

#### 批量发送
```php
// 批量发送邮件时使用队列
class BJT_Email_Queue {
    public function add_to_queue($email_data) {
        // 添加到队列
    }
    
    public function process_queue() {
        // 处理队列中的邮件
    }
}
```

## 7. 安全考虑

### 7.1 密码保护
- 使用应用专用密码而非主密码
- 定期更换SMTP密码
- 不在代码中硬编码密码

### 7.2 防止垃圾邮件
- 设置发送频率限制
- 验证收件人邮箱地址
- 使用邮件签名和SPF记录

### 7.3 数据加密
- 使用TLS/SSL加密传输
- 敏感信息加密存储
- 定期更新加密证书

## 8. 监控和维护

### 8.1 邮件发送统计
```php
// 记录邮件发送统计
class BJT_Email_Stats {
    public function log_email_sent($to, $subject, $status) {
        global $wpdb;
        $wpdb->insert(
            $wpdb->prefix . 'bjt_email_logs',
            array(
                'to_email' => $to,
                'subject' => $subject,
                'status' => $status,
                'sent_at' => current_time('mysql')
            )
        );
    }
}
```

### 8.2 错误监控
- 监控邮件发送失败率
- 设置异常报警
- 定期检查邮件日志

### 8.3 定期测试
- 每日自动测试邮件功能
- 监控邮件服务器状态
- 验证邮件模板正确性

## 9. 部署检查清单

### 9.1 配置检查
- [ ] SMTP服务器配置正确
- [ ] 端口和加密方式匹配
- [ ] 用户名和密码有效
- [ ] 发件人信息设置完整

### 9.2 功能测试
- [ ] 测试邮件发送成功
- [ ] 用户注册邮件正常
- [ ] 密码重置邮件正常
- [ ] RMA通知邮件正常

### 9.3 性能测试
- [ ] 邮件发送速度合理
- [ ] 并发发送稳定
- [ ] 内存使用正常

## 10. 故障排除工具

### 10.1 邮件测试脚本
```php
// 创建测试脚本 test-email.php
<?php
require_once('wp-load.php');

$email_service = new BJT_Email_Service();
$result = $email_service->test_email_settings('test@example.com');

if ($result) {
    echo "邮件发送成功！\n";
} else {
    echo "邮件发送失败！\n";
    echo "错误信息：" . $email_service->get_last_error() . "\n";
}
?>
```

### 10.2 SMTP连接测试
```bash
# 使用telnet测试SMTP连接
telnet smtp.gmail.com 587

# 或使用openssl测试TLS连接
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

### 10.3 日志分析
```bash
# 查看邮件相关日志
tail -f /var/log/mail.log

# 查看WordPress调试日志
tail -f wp-content/debug.log | grep -i mail
```

## 总结

通过本指南，您应该能够：
1. 正确配置WordPress SMTP邮件功能
2. 设置和测试各种邮件服务商
3. 使用邮件模板系统
4. 解决常见的邮件发送问题
5. 监控和维护邮件系统

如有问题，请参考WordPress官方文档或联系技术支持。 