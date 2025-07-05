# BJT前端部署问题修复指南

## 🚨 问题概述

**症状：**
- ✅ 本地开发环境功能正常
- ❌ 线上环境功能不生效：
  - 购物车添加/删除功能无效
  - 耗材页面英制筛选结果为空

## 🔍 问题分析

### 1. 构建部署问题
- **发现：** 线上部署的构建文件不是最新版本
- **证据：** 本地构建时间 `Jul 5 09:38`，之前部署版本 `Jul 3 10:58`
- **影响：** 代码更新未生效

### 2. 数据字段问题
- **发现：** 英制筛选依赖的数据字段可能缺失
- **涉及字段：** `thickness_imp`, `width_imp`, `length_imp`
- **影响：** 英制单位筛选返回空结果

### 3. 缓存问题
- **类型：** 浏览器缓存、CDN缓存、Nginx静态文件缓存
- **影响：** 新代码无法立即生效

## 🛠️ 解决方案

### 步骤1: 立即修复构建和部署

```bash
# 在frontend目录执行
chmod +x deploy-fix.sh
./deploy-fix.sh
```

### 步骤2: 检查线上部署

1. **上传新构建文件到服务器**
   ```bash
   # 将生成的zip文件上传到服务器
   scp bjt-frontend-*.zip user@server:/path/to/deployment/
   
   # 在服务器上解压
   cd /path/to/nginx/html/bjt/
   unzip -o bjt-frontend-*.zip
   ```

2. **清理服务器缓存**
   ```bash
   # Nginx缓存清理
   sudo nginx -s reload
   
   # 或者清理具体缓存目录
   sudo rm -rf /var/cache/nginx/*
   ```

### 步骤3: 数据库修复（英制筛选问题）

#### 检查英制字段数据
```sql
-- 检查耗材表中英制字段的数据完整性
SELECT 
    COUNT(*) as total_records,
    COUNT(thickness_imp) as has_thickness_imp,
    COUNT(width_imp) as has_width_imp,
    COUNT(length_imp) as has_length_imp,
    COUNT(*) - COUNT(thickness_imp) as missing_thickness_imp
FROM wp_bjt_consumables 
WHERE status = 'publish';

-- 查看具体缺失数据的记录
SELECT id, part_number, thickness_met, thickness_imp, width_met, width_imp
FROM wp_bjt_consumables 
WHERE status = 'publish' 
AND (thickness_imp IS NULL OR width_imp IS NULL)
LIMIT 10;
```

#### 修复英制字段数据
```sql
-- 根据公制数据计算英制数据（如果缺失）
UPDATE wp_bjt_consumables 
SET 
    thickness_imp = CASE 
        WHEN thickness_met IS NOT NULL AND thickness_imp IS NULL 
        THEN ROUND(thickness_met * 0.0393701, 3)  -- μm 转 mil
        ELSE thickness_imp 
    END,
    width_imp = CASE 
        WHEN width_met IS NOT NULL AND width_imp IS NULL 
        THEN ROUND(width_met * 0.393701, 2)       -- cm 转 inch
        ELSE width_imp 
    END,
    length_imp = CASE 
        WHEN length_met IS NOT NULL AND length_imp IS NULL 
        THEN ROUND(length_met * 0.393701, 2)      -- cm 转 inch
        ELSE length_imp 
    END
WHERE status = 'publish';
```

### 步骤4: 前端代码兼容性修复

#### 购物车功能增强
确保购物车服务正确配置：

```typescript
// 确认 frontend/src/services/cartApiService.ts 配置
const API_BASE_URL = import.meta.env.VITE_API_URL || '/wp-json/bjt/v1';

// 检查API调用是否使用正确的端点
export const addToCart = async (item: CartItem) => {
  const response = await fetch(`${API_BASE_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
  return response.json();
};
```

#### 英制筛选容错处理
在 `frontend/src/pages/Consumables/index.tsx` 中添加容错：

```typescript
// 在筛选逻辑中添加容错处理
const itemThickness = extractNumber(item[`thickness${fieldSuffix}` as keyof typeof item] as any);
if (itemThickness === undefined || itemThickness === null || itemThickness === 0) {
  // 如果英制数据缺失，尝试转换公制数据
  const metricThickness = extractNumber(item.thickness_met);
  if (metricThickness && fieldSuffix === '_imp') {
    itemThickness = metricThickness * 0.0393701; // μm to mil conversion
  }
}
```

### 步骤5: 缓存清理和验证

#### 1. 服务器端缓存清理
```bash
# Nginx缓存
sudo nginx -s reload

# CDN缓存清理（如果使用阿里云CDN）
# 需要在阿里云控制台手动清理或使用API

# 应用程序缓存
sudo systemctl restart nginx
```

#### 2. 浏览器端验证
1. 打开浏览器开发者工具
2. 切换到Network标签
3. 勾选"Disable cache"
4. 刷新页面 (Ctrl+Shift+R)
5. 检查加载的JS/CSS文件时间戳

#### 3. 功能测试清单
- [ ] 购物车添加功能
- [ ] 购物车删除功能
- [ ] 购物车数量修改
- [ ] 耗材页面公制筛选
- [ ] 耗材页面英制筛选
- [ ] 单位制切换功能

## ⚡ 快速验证方法

### 1. 验证构建是否成功部署
在浏览器开发者工具Console中执行：
```javascript
// 检查当前加载的版本
console.log('App Version:', window.__APP_VERSION__);
console.log('Build Time:', document.lastModified);

// 检查API配置
console.log('API Base URL:', window.location.origin + '/wp-json/bjt/v1');
```

### 2. 验证购物车功能
```javascript
// 在控制台测试购物车API
fetch('/wp-json/bjt/v1/cart', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

### 3. 验证英制数据
```javascript
// 测试英制数据API
fetch('/wp-json/bjt/v1/consumables?limit=5')
  .then(r => r.json())
  .then(data => {
    console.log('Sample data:', data.data.items[0]);
    console.log('Has imperial fields:', {
      thickness_imp: !!data.data.items[0].thickness_imp,
      width_imp: !!data.data.items[0].width_imp,
      length_imp: !!data.data.items[0].length_imp
    });
  });
```

## 📋 部署检查清单

### 部署前检查
- [ ] 代码已提交到git
- [ ] 本地功能测试通过
- [ ] 构建无错误
- [ ] 环境变量配置正确

### 部署后检查
- [ ] 新文件已上传到服务器
- [ ] 文件权限正确
- [ ] Nginx配置正确
- [ ] 缓存已清理
- [ ] 核心功能测试通过

### 回滚准备
- [ ] 备份当前线上版本
- [ ] 准备回滚脚本
- [ ] 记录部署时间和版本号

## 🚨 紧急回滚方案

如果新版本有问题，可以快速回滚：

```bash
# 恢复之前的备份
cd /path/to/nginx/html/bjt/
cp -r backup/bjt-frontend-backup-$(date -d yesterday +%Y%m%d)/* .
sudo nginx -s reload
```

## 📞 联系支持

如果问题持续存在：
1. 收集错误日志
2. 记录重现步骤
3. 提供环境信息
4. 联系技术支持团队 