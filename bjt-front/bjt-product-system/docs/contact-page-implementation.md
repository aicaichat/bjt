# Contact Us 页面实现文档

## 概述

基于 [lockedair.com联系页面](https://www.lockedair.com/contact/) 的设计，实现了一个完整的Contact Us页面，包含联系信息展示和留言表单功能。

## 功能特性

### ✅ 已实现功能

1. **响应式设计**
   - 桌面端和移动端适配
   - 两栏布局（联系信息 + 留言表单）
   - 现代化UI设计

2. **联系信息展示**
   - 基本联系方式（邮箱、电话）
   - 社交媒体图标
   - 全球办事处信息（澳大利亚、美国、德国、日本）

3. **留言表单**
   - 必填字段：姓名、邮箱、留言内容
   - 可选字段：电话、公司
   - 表单验证（邮箱格式、必填字段）
   - 提交状态反馈

4. **多语言支持**
   - 中英文翻译
   - 动态语言切换
   - 完整的翻译文件

5. **后端API支持**
   - Contact表单提交API
   - 联系信息获取API
   - 数据验证和安全处理

## 文件结构

```
frontend/src/pages/Contact/
├── ContactPage.tsx          # 主组件
├── ContactPage.css          # 样式文件

frontend/src/services/
├── contact.service.ts       # Contact服务

frontend/src/i18n/locales/
├── zh/contact.json          # 中文翻译
├── en/contact.json          # 英文翻译

plugins/bjt-core-entities/controllers/
├── class-contact-controller.php  # 后端API控制器
```

## 技术实现

### 前端组件 (ContactPage.tsx)

```typescript
// 主要功能
- 响应式两栏布局
- 表单验证和提交
- 多语言支持
- 错误处理和用户反馈
```

### 样式设计 (ContactPage.css)

```css
// 特色设计
- 渐变背景
- 卡片式布局
- 悬停效果
- 响应式断点
```

### 后端API (class-contact-controller.php)

```php
// API端点
POST /wp-json/bjt/v1/contact/submit  // 提交表单
GET  /wp-json/bjt/v1/contact/info    // 获取联系信息
```

### 翻译文件

```json
// contact.json 结构
{
  "contact": {
    "title": "联系我们",
    "form": { /* 表单字段翻译 */ },
    "offices": { /* 办事处信息 */ }
  }
}
```

## API 详细说明

### 1. 提交联系表单

**端点**: `POST /wp-json/bjt/v1/contact/submit`

**请求参数**:
```json
{
  "name": "string (必填)",
  "email": "string (必填)",
  "phone": "string (可选)",
  "company": "string (可选)",
  "content": "string (必填)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "Your message has been sent successfully!"
}
```

### 2. 获取联系信息

**端点**: `GET /wp-json/bjt/v1/contact/info`

**响应**:
```json
{
  "email": "info@lockedair.com",
  "phone": "+86(0)571 8616 9196",
  "offices": {
    "australia": { /* 澳大利亚办事处 */ },
    "usa": { /* 美国办事处 */ },
    "germany": { /* 德国办事处 */ },
    "japan": { /* 日本办事处 */ }
  }
}
```

## 路由配置

Contact页面已添加到主路由配置中：

```typescript
// App.tsx
<Route 
  path="/contact" 
  element={
    <MainLayout>
      <ContactPage />
    </MainLayout>
  } 
/>
```

## 导航集成

Contact页面已集成到主导航菜单中：

```typescript
// Header.tsx
{ label: 'nav.contactUs', path: '/contact', requiresAuth: false }
```

## 数据库设计

Contact表单提交会记录到数据库表 `wp_bjt_contact_submissions`：

```sql
CREATE TABLE wp_bjt_contact_submissions (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  company varchar(255),
  content text NOT NULL,
  ip_address varchar(45),
  submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

## 安全特性

1. **输入验证**
   - 前端表单验证
   - 后端数据清理和验证
   - 邮箱格式验证

2. **数据安全**
   - SQL注入防护
   - XSS防护
   - IP地址记录

3. **权限控制**
   - 公开访问（无需认证）
   - 速率限制（可扩展）

## 邮件功能

Contact表单提交会发送邮件通知：

- **收件人**: 管理员邮箱
- **内容**: 包含用户信息和留言
- **格式**: 纯文本邮件
- **回复地址**: 用户邮箱

## 测试验证

### ✅ 已测试功能

1. **页面访问**: `http://localhost:5173/contact`
2. **API端点**: 
   - Contact信息获取 ✅
   - 表单提交验证 ✅
3. **响应式设计**: 桌面端和移动端 ✅
4. **多语言切换**: 中英文 ✅

### 📝 测试用例

```bash
# 1. 测试页面访问
curl -s "http://localhost:5173/contact"

# 2. 测试联系信息API
curl -s "http://localhost:8080/wp-json/bjt/v1/contact/info"

# 3. 测试表单提交API
curl -X POST "http://localhost:8080/wp-json/bjt/v1/contact/submit" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","content":"Test message"}'
```

## 部署说明

1. **前端部署**
   - 确保翻译文件已注册到i18n配置
   - 检查路由配置正确

2. **后端部署**
   - 确保Contact控制器已包含在插件中
   - 重启WordPress以加载新控制器
   - 配置邮件服务器（可选）

## 扩展功能建议

1. **验证码**
   - 添加reCAPTCHA防止垃圾邮件
   - 图形验证码

2. **文件上传**
   - 支持附件上传
   - 文件类型和大小限制

3. **自动回复**
   - 发送确认邮件给用户
   - 自定义邮件模板

4. **管理后台**
   - Contact表单管理界面
   - 统计和分析功能

## 参考资料

- [原始设计参考](https://www.lockedair.com/contact/)
- [Ant Design组件文档](https://ant.design/)
- [React i18next文档](https://react.i18next.com/)
- [WordPress REST API文档](https://developer.wordpress.org/rest-api/)

---

**实现日期**: 2024年1月
**版本**: 1.0.0
**状态**: ✅ 完成 