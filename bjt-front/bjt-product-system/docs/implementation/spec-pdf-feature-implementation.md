# 规格PDF功能完整实施文档

## 📋 项目概述

在主机型号表、配件型号表和备件型号表中增加规格PDF字段，支持从admin后台上传PDF文件。

## 🗃️ 数据库变更

### 1. 表结构修改

```sql
-- 主机型号表添加规格PDF字段
ALTER TABLE `wp_bjt_host_models` 
ADD COLUMN `spec_pdf` varchar(255) COMMENT '规格PDF文件URL' AFTER `explosion_diagram_pdf`;

-- 配件型号表添加规格PDF字段  
ALTER TABLE `wp_bjt_accessory_models` 
ADD COLUMN `spec_pdf` varchar(255) COMMENT '规格PDF文件URL' AFTER `explosion_diagram_pdf`;

-- 备件型号表添加规格PDF字段
ALTER TABLE `wp_bjt_spare_part_models` 
ADD COLUMN `spec_pdf` varchar(255) COMMENT '规格PDF文件URL' AFTER `explosion_diagram_pdf`;
```

### 2. 数据迁移脚本

文件位置：`database/migrations/add_spec_pdf_to_models.sql`

## 🔧 前端变更

### 1. TypeScript类型定义更新

文件：`frontend/src/admin/types/admin-models.types.ts`

```typescript
export interface AdminHostModel {
  // ... 现有字段 ...
  spec_pdf?: string; // 规格PDF文件URL
  // ... 其他字段 ...
}

export interface AdminAccessoryModel {
  // ... 现有字段 ...
  spec_pdf?: string; // 规格PDF文件URL
  // ... 其他字段 ...
}

export interface AdminSparePartModel {
  // ... 现有字段 ...
  spec_pdf?: string; // 规格PDF文件URL
  // ... 其他字段 ...
}
```

### 2. PDF上传组件

文件：`frontend/src/admin/components/PdfUploader.tsx`

- 支持PDF文件上传
- 文件类型验证（只允许PDF）
- 文件大小限制（10MB）
- 上传进度显示
- 文件预览和删除功能

### 3. 主机型号页面更新

文件：`frontend/src/admin/pages/machines/MachinesPage.tsx`

- 在表单中添加规格PDF上传字段
- 更新导出列配置
- 表单数据处理包含spec_pdf字段

## 🔌 后端API变更

### 1. 主机型号控制器

文件：`plugins/bjt-core-entities/controllers/class-machine-controller.php`

- 添加spec_pdf到API Schema
- 格式化响应包含spec_pdf字段
- 请求映射支持spec_pdf字段

### 2. 配件型号控制器

文件：`plugins/bjt-core-entities/controllers/class-accessory-model-controller.php`

- fillable_fields包含spec_pdf
- 响应格式化包含spec_pdf字段

### 3. 备件型号控制器

文件：`plugins/bjt-core-entities/controllers/class-spare-part-model-controller.php`

- fillable_fields包含spec_pdf
- 响应格式化包含spec_pdf字段

## 📦 部署流程

### 1. 自动部署脚本

文件：`scripts/deploy-spec-pdf-feature.sh`

```bash
# 执行部署
chmod +x scripts/deploy-spec-pdf-feature.sh
./scripts/deploy-spec-pdf-feature.sh
```

### 2. 手动部署步骤

1. **执行数据库迁移**
   ```bash
   docker-compose exec mysql mysql -u wordpress -pwordpress bjt_product < database/migrations/add_spec_pdf_to_models.sql
   ```

2. **重启服务**
   ```bash
   docker-compose restart frontend backend
   ```

3. **验证部署**
   - 检查数据库表结构
   - 测试前端功能
   - 验证API响应

## 🧪 功能测试

### 1. 主机型号管理测试

- [ ] 创建主机型号时上传规格PDF
- [ ] 编辑主机型号时更新规格PDF
- [ ] 查看PDF文件链接
- [ ] 删除PDF文件
- [ ] 导出功能包含spec_pdf字段

### 2. 配件型号管理测试

- [ ] 创建配件型号时上传规格PDF
- [ ] 编辑配件型号时更新规格PDF
- [ ] API响应包含spec_pdf字段

### 3. 备件型号管理测试

- [ ] 创建备件型号时上传规格PDF
- [ ] 编辑备件型号时更新规格PDF
- [ ] API响应包含spec_pdf字段

## 🔍 API接口变更

### 1. 主机型号接口

**GET** `/wp-json/bjt/v1/host-models`
**GET** `/wp-json/bjt/v1/host-models/{id}`
**POST** `/wp-json/bjt/v1/host-models`
**PUT** `/wp-json/bjt/v1/host-models/{id}`

响应示例：
```json
{
  "id": 1,
  "product_line_id": 1,
  "code": "BM-001",
  "title_zh": "示例主机",
  "title_en": "Sample Host",
  "explosion_diagram_pdf": "/uploads/explosion.pdf",
  "spec_pdf": "/uploads/spec.pdf",
  "status": "publish"
}
```

### 2. 配件型号接口

**GET** `/wp-json/bjt/v1/accessory-models`
**POST** `/wp-json/bjt/v1/accessory-models`
**PUT** `/wp-json/bjt/v1/accessory-models/{id}`

### 3. 备件型号接口

**GET** `/wp-json/bjt/v1/spare-part-models`
**POST** `/wp-json/bjt/v1/spare-part-models`
**PUT** `/wp-json/bjt/v1/spare-part-models/{id}`

## 📁 文件上传配置

### 1. WordPress媒体设置

- 确保PDF文件类型允许上传
- 配置合适的文件大小限制
- 设置上传目录权限

### 2. 服务器配置

```php
// wp-config.php 或相关配置
define('ALLOW_UNFILTERED_UPLOADS', true);
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');
```

## 🔒 安全考虑

1. **文件类型验证**
   - 前端验证文件扩展名
   - 后端验证MIME类型
   - 文件内容验证

2. **访问权限控制**
   - 上传功能需要管理员权限
   - 文件访问权限控制

3. **文件存储安全**
   - 避免执行上传的文件
   - 定期清理无用文件

## 🐛 故障排除

### 1. 上传失败

- 检查文件权限
- 验证文件大小限制
- 查看服务器错误日志

### 2. 数据库错误

- 验证字段是否正确添加
- 检查数据库连接
- 确认表结构一致性

### 3. 前端显示问题

- 清除浏览器缓存
- 检查TypeScript编译错误
- 验证组件导入路径

## 📝 维护说明

### 1. 定期任务

- 清理无用的PDF文件
- 监控存储空间使用
- 备份重要文档

### 2. 性能优化

- 考虑CDN存储大文件
- 实施文件压缩
- 缓存策略优化

## 🔄 后续扩展

### 1. 可能的功能增强

- 批量上传功能
- 文件版本管理
- 多语言PDF支持
- 文件预览功能

### 2. 技术优化

- 异步上传处理
- 云存储集成
- 缩略图生成
- 全文搜索支持

---

**实施完成日期**: 2024-01-XX  
**负责开发者**: 开发团队  
**文档版本**: v1.0 