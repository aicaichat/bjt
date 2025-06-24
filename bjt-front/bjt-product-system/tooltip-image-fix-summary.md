# 耗材页面Tooltip图片显示修复

## 问题描述
耗材页面的tooltip原本显示的是袋装实物图片（`image_url`），但用户要求tooltip展示包装图片，与商品列表里的图片区别开来。

## 修复内容

### 1. 修改tooltip头部图片显示逻辑
**文件**: `frontend/src/pages/Consumables/index.tsx` (第520行)

**修改前**:
```tsx
<img src={cleanImageUrl(item.image_url)} />
```

**修改后**:
```tsx
<img src={cleanImageUrl(safeGet('package_image_url', item.image_url))} />
```

**说明**: 
- 优先使用 `package_image_url` 字段显示包装图片
- 如果包装图片不存在，回退到原来的 `image_url`
- 使用 `safeGet` 函数确保安全的字段获取

### 2. 在包装信息部分添加专门的包装图片展示区域
**文件**: `frontend/src/pages/Consumables/index.tsx` (第814行之后)

**新增内容**:
```tsx
{/* 包装图片展示区域 */}
{(() => {
  const packageImageUrl = safeGet('package_image_url', '');
  if (packageImageUrl !== 'N/A' && packageImageUrl !== '') {
    return (
      <div className="package-image-section">
        <div className="package-image-container">
          <img 
            src={cleanImageUrl(packageImageUrl)} 
            alt={String(t('tooltip.packageImage') || '包装图片')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.startsWith('data:')) {
                target.src = placeholderImage;
              }
            }}
          />
          <div className="image-label">{String(t('tooltip.packageImage') || '包装图片')}</div>
        </div>
      </div>
    );
  }
  return null;
})()}
```

### 3. 添加包装图片展示的CSS样式
**文件**: `frontend/src/pages/Consumables/consumables.scss` (文件末尾)

**新增样式**:
```scss
// === 包装图片展示区域样式 ===
.package-image-section {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(249, 250, 251, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.6);
}

.package-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  img {
    width: 120px;
    height: 90px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid rgba(59, 130, 246, 0.1);
    background: white;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
  
  .image-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    text-align: center;
    background: rgba(255, 255, 255, 0.8);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid rgba(229, 231, 235, 0.5);
  }
}

// 响应式设计
@media (max-width: 640px) {
  .package-image-container {
    img {
      width: 100px;
      height: 75px;
    }
  }
}
```

## 功能特点

### 1. 智能回退机制
- 优先显示包装图片 (`package_image_url`)
- 如果包装图片不存在，自动回退到实物图片 (`image_url`)
- 如果都不存在，显示占位图片

### 2. 双重展示
- **Tooltip头部**: 显示包装图片（小图）
- **包装信息区**: 显示独立的包装图片展示区域（较大）

### 3. 响应式设计
- 支持移动端适配
- 图片尺寸根据屏幕大小调整

### 4. 交互体验
- 鼠标悬停时图片会放大
- 加载失败时自动显示占位图

### 5. 国际化支持
- 中文: "包装实物图片"
- 英文: "Package Image" 

## 数据字段映射
系统已配置 `package_image_url` 字段的映射关系：
```typescript
'package_image_url': ['package_image_url', 'packaging_image', 'specs.package_image_url']
```

## 预期效果
1. **商品列表**: 继续显示实物图片 (`image_url`)
2. **Tooltip**: 显示包装图片 (`package_image_url`)
3. **区别明显**: 两种图片类型有明确的视觉区分
4. **用户体验**: 提供更准确的包装信息展示 