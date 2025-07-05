# 生产环境图片文件保护指南

## 🚨 重要提醒：部署时保护用户上传的图片

### 问题背景
在生产环境部署时，用户上传的图片文件可能会被前端构建过程覆盖或删除，导致**数据丢失**。

### 🔍 风险识别

#### 高风险操作：
- ❌ 前端构建过程可能清理 `public/uploads` 目录
- ❌ Docker容器重建可能丢失挂载外的文件
- ❌ 代码更新可能覆盖静态文件目录

#### 受保护的文件类型：
- 🖼️ 用户上传的产品图片 (`.jpg`, `.png`, `.gif`, `.webp`)
- 📄 PDF文档和规格书
- 🏭 机器设备图片
- 📊 技术文档和手册

### ✅ 已实施的保护措施

#### 1. 自动备份机制
```bash
# 部署前自动备份所有uploads目录
backup_current_deployment() {
    # 备份前端uploads目录
    cp -r frontend/public/uploads $backup_dir/frontend_uploads
    
    # 备份WordPress uploads目录  
    cp -r wordpress_uploads $backup_dir/wordpress_uploads
    
    # 备份Docker挂载的uploads目录
    # ...
}
```

#### 2. 构建时保护机制
```bash
# 前端构建前临时保护uploads目录
build_frontend() {
    # 构建前备份
    temp_backup="/tmp/frontend_uploads_temp_$(date +%s)"
    cp -r public/uploads $temp_backup
    
    # 执行构建
    npm run build:skip-check
    
    # 构建后恢复
    cp -r $temp_backup/* dist/uploads/
    cp -r $temp_backup/* public/uploads/
}
```

#### 3. 权限安全设置
```bash
# 安全设置权限，不影响现有文件
setup_upload_permissions() {
    # 只创建目录结构，不覆盖文件
    # 设置合适的文件权限 (644) 和目录权限 (755)
    # 特别保护图片文件格式
}
```

### 📋 保护的目录结构

```
frontend/
├── public/uploads/           # 源文件目录（开发时）
│   ├── machines/
│   │   ├── images/          # 机器设备图片
│   │   └── pdfs/            # 规格书和手册
│   ├── host/                # 主机产品图片
│   ├── accessory/           # 配件图片
│   ├── spare_parts/         # 备件图片
│   ├── consumables/         # 耗材图片
│   └── documents/           # 技术文档
└── dist/uploads/            # 构建输出目录（生产时）
    └── (同上结构)
```

### 🛡️ 使用修复后的部署脚本

#### 标准部署（推荐）：
```bash
# 自动保护用户文件
./deploy-production.sh
```

#### 增强版部署：
```bash
# 包含更多保护特性
./deploy-production-enhanced.sh
```

### 📊 部署过程中的保护步骤

1. **部署前备份** ✅
   - 自动备份所有uploads目录
   - 创建备份清单文件
   - 提供恢复方法

2. **构建时保护** ✅
   - 临时备份uploads目录
   - 构建后自动恢复文件
   - 同时保护源文件和构建输出

3. **权限设置** ✅
   - 安全设置目录权限
   - 保护现有图片文件
   - 验证权限设置结果

4. **验证检查** ✅
   - 统计保护的文件数量
   - 验证图片文件完整性
   - 生成保护报告

### 🆘 应急恢复方法

如果图片文件意外丢失，可以从备份恢复：

```bash
# 1. 找到最新的备份目录
ls -la backups/

# 2. 查看备份清单
cat backups/20240105_143022/backup_manifest.txt

# 3. 恢复前端图片
cp -r backups/20240105_143022/frontend_uploads/* frontend/public/uploads/

# 4. 恢复构建输出图片
cp -r backups/20240105_143022/frontend_uploads/* frontend/dist/uploads/

# 5. 重启服务
docker compose restart
```

### 💡 最佳实践建议

#### 部署前检查：
```bash
# 检查现有图片文件数量
find frontend/public/uploads -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" \) | wc -l

# 检查文件权限
ls -la frontend/public/uploads/
```

#### 部署后验证：
```bash
# 验证图片文件是否保留
./scripts/deploy-api-verification.sh

# 检查web访问
curl -I "https://eorder.lockedair.com/uploads/machines/images/sample.jpg"
```

#### 定期备份：
- 📅 每周自动备份uploads目录
- 🔄 保留最近30天的备份文件
- ☁️ 考虑云存储备份重要图片

### 🎯 验证保护是否生效

部署完成后，检查以下几点：

1. **文件数量一致**
   ```bash
   # 部署前记录文件数量
   find frontend/public/uploads -type f | wc -l
   
   # 部署后验证数量相同
   find frontend/dist/uploads -type f | wc -l
   ```

2. **图片可访问**
   ```bash
   # 测试图片URL访问
   curl -I "https://eorder.lockedair.com/uploads/test-image.jpg"
   ```

3. **备份完整性**
   ```bash
   # 查看备份报告
   cat backups/latest/backup_manifest.txt
   ```

### 🔧 故障排查

#### 如果图片显示异常：
1. 检查文件路径是否正确
2. 验证文件权限设置
3. 确认web服务器配置
4. 检查CDN缓存设置

#### 如果图片丢失：
1. 立即停止相关服务
2. 从最新备份恢复
3. 验证恢复结果
4. 重启服务并测试

---

**⚠️ 重要提醒**: 在任何生产环境部署前，务必验证保护机制是否正常工作！ 