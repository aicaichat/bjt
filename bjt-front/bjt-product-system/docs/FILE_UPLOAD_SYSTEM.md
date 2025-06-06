# BJT文件上传系统文档

本文档详细说明了BJT产品管理系统中的文件上传功能实现、问题排查和解决方案。

## 📋 系统概述

BJT系统提供了完整的文件上传解决方案，支持图片、PDF和其他文档文件的上传与管理。

### 🎯 核心功能

- **多文件类型支持**：图片(JPG/PNG/GIF/WebP)、PDF、文档(DOC/DOCX/TXT)
- **安全权限控制**：基于BJT用户角色系统的权限验证
- **智能路径管理**：自动目录创建和文件组织
- **文件重命名**：防止冲突的时间戳+随机字符串命名
- **大小限制**：图片5MB、其他文件10MB
- **预览功能**：图片预览和PDF在线查看

## 🏗️ 系统架构

### 前端组件

1. **FileUrlInput.tsx** - 通用文件上传组件
2. **PdfUploader.tsx** - PDF专用上传组件

### 后端API端点

1. **`/wp-json/bjt/v1/upload/image`** - 图片上传专用端点
2. **`/wp-json/bjt/v1/upload/file`** - 通用文件上传端点  
3. **`/wp-json/bjt/v1/upload/specification`** - PDF规格书上传端点(需host_id)
4. **`/wp-json/bjt/v1/upload/nonce`** - 获取认证token

### 目录结构

```
frontend/public/uploads/
├── machines/
│   ├── images/          # 设备图片
│   └── pdfs/           # 设备PDF文档
├── specifications/     # 规格说明书(按host_id分类)
└── [other-categories]/ # 其他文件分类
```

## 🔧 API端点详解

### 1. 图片上传端点

**端点**: `POST /wp-json/bjt/v1/upload/image`

**参数**:
- `file` (File): 图片文件
- `upload_dir` (string, 可选): 上传目录，默认 `uploads/machines/images`

**支持格式**: JPG, PNG, GIF, WebP
**大小限制**: 5MB

**响应示例**:
```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "url": "/frontend/public/uploads/machines/images/1703123456_abc123.jpg",
    "filename": "1703123456_abc123.jpg",
    "file_size": 1048576,
    "file_type": "image"
  }
}
```

### 2. 通用文件上传端点

**端点**: `POST /wp-json/bjt/v1/upload/file`

**参数**:
- `file` (File): 文件
- `upload_dir` (string, 可选): 上传目录，默认 `uploads`

**支持格式**: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT
**大小限制**: 10MB

### 3. PDF规格书上传端点

**端点**: `POST /wp-json/bjt/v1/upload/specification`

**参数**:
- `pdf_file` (File): PDF文件
- `host_id` (integer): 主机ID (必须 > 0)
- `upload_dir` (string, 可选): 上传目录

**特殊功能**: 会自动更新主机表中的规格书字段

## 🔒 权限系统

### 认证方式

1. **BJT Token认证** - 优先使用BJT系统token
2. **WordPress Nonce** - 备用认证方式
3. **自动登录重试** - 401错误时自动重新认证

### 权限检查

支持的角色：
- `admin` - 管理员，完全权限
- `manager` - 管理者，上传权限
- `editor` - 编辑者，上传权限

支持的权限：
- `upload_files` - 文件上传权限
- `manage_files` - 文件管理权限

### 代码示例

```php
// 后端权限检查
$allowed_upload_roles = ['admin', 'manager', 'editor'];
$has_upload_permission = in_array($user->role, $allowed_upload_roles);

// 检查特定权限
if (isset($user->permissions) && is_array($user->permissions)) {
    $has_upload_permission = $has_upload_permission || 
                           in_array('upload_files', $user->permissions);
}
```

## 🛠️ 前端组件使用

### FileUrlInput组件

```typescript
<FileUrlInput
  value={imageUrl}
  onChange={setImageUrl}
  fileType="image"                    // 'image' | 'pdf' | 'document'
  maxSize={5}                        // MB
  accept=".jpg,.png,.gif,.webp"      // 可选，覆盖默认
  uploadPath="/uploads/machines/"    // 上传路径
  preview={true}                     // 启用预览
  placeholder="上传图片或输入URL"
/>
```

### PdfUploader组件

```typescript
<PdfUploader
  value={pdfUrl}
  onChange={setPdfUrl}
  hostId={machineId}                 // 关联的主机ID
  placeholder="点击上传PDF规格书"
/>
```

## 🐛 常见问题排查

### 1. 400 Bad Request错误

**症状**: 上传时返回400错误
**原因**: 通常是参数验证失败

**排查步骤**:
1. 检查文件大小是否超限
2. 检查文件格式是否支持  
3. 检查必需参数是否传递正确
4. 查看后端错误日志

**修复示例**:
```javascript
// 错误的做法：对PDF使用需要host_id的端点但传递0
formData.append('host_id', '0'); // 会导致验证失败

// 正确的做法：对通用PDF上传使用通用端点
uploadEndpoint = '/wp-json/bjt/v1/upload/file';
```

### 2. 401/403权限错误

**症状**: 返回401未认证或403权限不足

**解决方案**:
1. 检查用户登录状态
2. 确认用户角色有上传权限
3. 检查token是否有效
4. 查看认证逻辑

### 3. 目录权限错误

**症状**: 500错误，提示目录不可写

**解决方案**:
```bash
# 检查目录权限
ls -la frontend/public/uploads/

# 设置正确权限  
chmod 755 frontend/public/uploads/
chown www-data:www-data frontend/public/uploads/
```

### 4. 文件不显示问题

**症状**: 上传成功但前端无法显示

**原因分析**:
1. API返回`image1_url`但前端期望`image_url`
2. 相对路径与绝对路径转换问题
3. 静态文件服务配置问题
4. **URL路径包含多余前缀**：返回`/frontend/public/uploads/...`而不是`/uploads/...`

**解决方案**:
```javascript
// 1. 字段映射处理
const transformedData = {
  ...machineData,
  image_url: machineData.image1_url || machineData.image_url,
  image2_url: machineData.image2_url,
  image3_url: machineData.image3_url,
  spec_pdf: machineData.spec_pdf
};

// 2. URL路径处理
const getFullImageUrl = (relativePath: string) => {
  if (!relativePath) return '';
  
  if (relativePath.startsWith('http')) {
    return relativePath; // 已经是完整URL
  }
  
  return relativePath.startsWith('/') 
    ? `${window.location.origin}${relativePath}`
    : `${window.location.origin}/${relativePath}`;
};

// 3. 移除多余的路径前缀（如果后端修复前的临时方案）
const cleanUploadUrl = (url: string) => {
  return url.replace('/frontend/public/', '/');
};
```

**后端修复**:
```php
// 在prepare_generic_upload_directory方法中：
// 旧代码（会产生错误路径）：
$base_url = '/' . $upload_dir; // 会返回 /frontend/public/uploads/...

// 新代码（正确路径）：
$relative_path = str_replace('frontend/public/', '', $upload_dir);
$base_url = '/' . ltrim($relative_path, '/'); // 返回 /uploads/...
```

## 📝 最佳实践

### 1. 错误处理

```javascript
const handleUploadError = (error) => {
  if (error.message.includes('404')) {
    message.error('上传服务未找到，请检查服务器配置');
  } else if (error.message.includes('403') || error.message.includes('401')) {
    message.error('权限不足，请检查登录状态');
  } else if (error.message.includes('413')) {
    message.error('文件过大，请选择较小的文件');
  } else {
    message.error(error.message || '文件上传失败，请重试');
  }
};
```

### 2. 文件验证

```javascript
const beforeUpload = (file) => {
  // 大小检查
  const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
  if (!isLtMaxSize) {
    message.error(`文件大小不能超过 ${maxSize}MB!`);
    return false;
  }

  // 类型检查
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = acceptTypes.split(',').map(ext => 
    ext.replace('.', '').toLowerCase()
  );
  
  if (fileExtension && !allowedExtensions.includes(fileExtension)) {
    message.error(`不支持的文件类型！请上传 ${acceptTypes} 格式的文件`);
    return false;
  }

  return true;
};
```

### 3. 进度显示

```javascript
const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
  // 模拟进度更新
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    onProgress?.({ percent: Math.min(progress, 90) });
  }, 200);

  try {
    // 执行上传...
    clearInterval(interval);
    onProgress?.({ percent: 100 });
    // 处理成功...
  } catch (error) {
    clearInterval(interval);
    onError?.(error);
  }
};
```

### 4. 安全建议

1. **文件类型验证** - 前后端双重验证
2. **文件大小限制** - 防止大文件攻击
3. **文件名清理** - 避免路径遍历攻击
4. **权限控制** - 严格的用户权限检查
5. **病毒扫描** - 生产环境考虑集成杀毒软件

## 🚀 升级指南

### 从模拟上传到真实上传

如果你的系统之前使用模拟上传，按以下步骤升级：

1. **更新组件引用**:
```javascript
// 旧版本 - 模拟上传
<FileUrlInput fileType="pdf" />

// 新版本 - 真实上传  
<FileUrlInput fileType="pdf" uploadPath="/uploads/machines/pdfs/" />
```

2. **确保目录存在**:
```bash
mkdir -p frontend/public/uploads/machines/images
mkdir -p frontend/public/uploads/machines/pdfs
chmod 755 frontend/public/uploads/machines/
```

3. **更新数据库字段映射**:
```javascript
// 确保API字段与前端期望一致
const fieldMapping = {
  'image1_url': 'image_url',
  'image2_url': 'image2_url', 
  'image3_url': 'image3_url',
  'spec_pdf': 'spec_pdf'
};
```

## 📊 监控和日志

### 后端日志

```php
error_log('[BJT Upload Controller] Starting upload for file: ' . $file['name']);
error_log('[BJT Upload Controller] Upload successful: ' . $full_path);
```

### 前端调试

```javascript
console.log('FileUrlInput: Starting real upload for file:', file);
console.log('FileUrlInput: Upload successful, file URL:', fileUrl);
```

### 性能监控

建议监控的指标：
- 上传成功率
- 平均上传时间
- 文件大小分布
- 错误类型统计

---

**更新记录**:
- 2024-01-XX: 初始版本
- 2024-01-XX: 修复PDF上传400错误问题
- 2024-01-XX: 添加字段映射和显示修复
- 2024-01-XX: 修复URL路径包含多余frontend/public前缀问题

**相关文档**:
- [API文档](API-DOCUMENTATION.md)
- [权限系统文档](AUTH_SYSTEM.md)
- [故障排查指南](TROUBLESHOOTING.md) 