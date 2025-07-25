# 产品线4图片上传测试指南

## 测试步骤

### 1. 准备测试环境
1. 确保Docker服务正在运行
2. 访问产品线4编辑页面：`http://localhost:5173/admin/product-lines/edit/4`
3. 打开浏览器开发者工具（F12），查看控制台日志

### 2. 测试预览功能
1. 页面加载后，应该能看到当前的图片预览
2. 点击预览按钮（眼睛图标）应该能看到图片大图
3. 确认预览功能正常工作

### 3. 测试图片上传
1. 点击"上传"按钮
2. 选择一个图片文件（JPG, PNG, GIF, WebP格式）
3. 查看控制台日志，应该看到以下信息：
   ```
   FileUrlInput: FormData contents:
     - file: File对象
     - file.name: 文件名
     - file.size: 文件大小
     - file.type: 文件类型
     - upload_dir: uploads/product-lines/images
   FileUrlInput: FormData[file]: File对象
   FileUrlInput: FormData[upload_dir]: uploads/product-lines/images
   FileUrlInput: Uploading to endpoint: /wp-json/bjt/v1/upload/image
   ```

### 4. 检查认证
如果看到认证相关的日志：
```
FileUrlInput: Using admin token
```
或者
```
FileUrlInput: No admin token found, attempting admin login...
FileUrlInput: Admin token obtained and saved
```

### 5. 预期结果
- **成功情况**: 控制台显示 `FileUrlInput: Upload result: {success: true, ...}`
- **失败情况**: 控制台显示详细的错误信息

### 6. 验证数据库
上传成功后，检查数据库中产品线4的图片URL是否已更新：
```sql
SELECT id, title_zh, image_url FROM wp_bjt_product_lines WHERE id = 4;
```

## 常见问题排查

### 问题1: 返回400错误 "请选择要上传的图片文件"
**可能原因**: 
- 文件没有正确传递到后端
- FormData构建有问题

**检查方法**:
1. 查看控制台中FormData的内容
2. 确认文件对象不为空
3. 检查网络请求中是否包含文件数据

### 问题2: 认证失败（401/403错误）
**可能原因**:
- 没有有效的admin token
- Token过期

**解决方法**:
1. 检查localStorage中是否有admin_token
2. 如果没有，组件会自动尝试登录
3. 确认admin用户存在且密码正确

### 问题3: 文件类型错误
**可能原因**:
- 上传了不支持的文件格式
- 文件损坏

**解决方法**:
1. 确认文件是JPG, PNG, GIF, WebP格式
2. 文件大小不超过5MB
3. 尝试其他图片文件

### 问题4: 预览功能不工作
**可能原因**:
- 图片URL为空
- 图片文件不存在

**解决方法**:
1. 检查数据库中image_url字段
2. 确认图片文件存在于服务器上
3. 检查图片URL路径是否正确

## 调试工具

### 1. 浏览器控制台
查看详细的上传日志和错误信息

### 2. 网络面板
检查HTTP请求和响应：
- 请求URL: `/wp-json/bjt/v1/upload/image`
- 请求方法: POST
- 请求头: Authorization: Bearer [token]
- 请求体: FormData with file and upload_dir

### 3. 数据库查询
```sql
-- 检查产品线4的图片URL
SELECT id, title_zh, image_url FROM wp_bjt_product_lines WHERE id = 4;

-- 检查admin用户
SELECT id, username, role, status FROM wp_bjt_users WHERE username = 'admin';
```

### 4. 后端日志
如果需要查看后端日志：
```bash
cd docker/dev
docker-compose -f docker-compose.nginx.yml logs wordpress
```

## 成功标准

- [ ] 页面加载时显示图片预览
- [ ] 预览按钮功能正常
- [ ] 图片上传不返回400错误
- [ ] 上传成功后显示新图片
- [ ] 数据库中image_url字段已更新
- [ ] 与其他产品线的上传功能行为一致

---

**测试时间**: 2025-01-13  
**版本**: v1.0.0  
**状态**: 待测试 