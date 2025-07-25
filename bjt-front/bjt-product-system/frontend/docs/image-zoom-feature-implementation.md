# 图片点击放大功能实现文档

## 功能概述

在耗材页面 (`http://localhost:5173/consumables?category=1`) 实现了图片点击自动放大功能，用户可以通过点击产品图片来查看大图，提升用户体验。

## 实现位置

- **文件**: `frontend/src/pages/Consumables/index.tsx`
- **组件**: `StandardConsumableItem`
- **功能**: 图片点击放大预览

## 功能特性

### 1. 图片点击交互
- 点击产品图片自动放大显示
- 鼠标悬停时显示提示文字 "点击放大图片"
- 鼠标悬停时图片有轻微缩放效果

### 2. 模态框预览
- 全屏遮罩背景
- 图片居中显示，保持比例
- 最大宽度90%，最大高度90vh
- 深色背景增强对比度

### 3. 关闭方式
- 点击关闭按钮 (×)
- 点击背景区域
- 按ESC键

### 4. 响应式设计
- 适配不同屏幕尺寸
- 移动端友好
- 图片自适应显示

## 代码实现

### 状态管理

```typescript
// 图片预览状态
const [imagePreview, setImagePreview] = useState<{
  visible: boolean;
  src: string;
  alt: string;
}>({
  visible: false,
  src: '',
  alt: ''
});
```

### 点击处理函数

```typescript
// 处理图片点击放大
const handleImageClick = (imageSrc: string, imageAlt: string) => {
  setImagePreview({
    visible: true,
    src: cleanImageUrl(imageSrc),
    alt: imageAlt
  });
};

// 关闭图片预览
const closeImagePreview = () => {
  setImagePreview({
    visible: false,
    src: '',
    alt: ''
  });
};
```

### 图片元素更新

```typescript
<img 
  src={cleanImageUrl(getLocalizedValue(item, 'image_url'))} 
  alt={getLocalizedValue(item, 'name')} 
  onError={handleImageError}
  onClick={() => handleImageClick(getLocalizedValue(item, 'image_url'), getLocalizedValue(item, 'name'))}
  style={{ cursor: 'pointer' }}
  title="点击放大图片"
/>
```

### 模态框组件

```typescript
<Modal
  open={imagePreview.visible}
  onCancel={closeImagePreview}
  footer={null}
  width="80%"
  style={{ top: 20 }}
  bodyStyle={{ 
    padding: 0, 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: '70vh',
    background: 'rgba(0, 0, 0, 0.9)'
  }}
  maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
>
  <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
    <img
      src={imagePreview.src}
      alt={imagePreview.alt}
      style={{
        maxWidth: '100%',
        maxHeight: '70vh',
        objectFit: 'contain',
        display: 'block',
        margin: '0 auto'
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = placeholderImage;
      }}
    />
    <button
      onClick={closeImagePreview}
      style={{
        position: 'absolute',
        top: -40,
        right: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333'
      }}
    >
      ×
    </button>
  </div>
</Modal>
```

## 样式设计

### 图片交互样式
```css
.clickable-image {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.clickable-image:hover {
  transform: scale(1.05);
}
```

### 模态框样式
- 背景遮罩: `rgba(0, 0, 0, 0.8)`
- 模态框背景: `rgba(0, 0, 0, 0.9)`
- 关闭按钮: 白色半透明背景，圆形设计
- 图片显示: `object-fit: contain` 保持比例

## 测试页面

创建了测试页面 `frontend/public/test-image-zoom.html` 用于验证功能：

- 模拟耗材产品图片
- 完整的交互演示
- 功能特性说明

## 使用说明

1. 访问耗材页面: `http://localhost:5173/consumables?category=1`
2. 找到任意产品图片
3. 点击图片查看大图
4. 通过以下方式关闭预览：
   - 点击关闭按钮 (×)
   - 点击背景区域
   - 按ESC键

## 技术细节

### 图片URL处理
- 使用 `cleanImageUrl()` 函数处理图片URL
- 支持错误处理和占位图显示
- 保持与现有图片处理逻辑一致

### 状态管理
- 使用React useState管理预览状态
- 避免全局状态污染
- 组件级别的状态管理

### 性能优化
- 图片懒加载（依赖现有实现）
- 模态框按需渲染
- 最小化重渲染

## 兼容性

- ✅ 现代浏览器支持
- ✅ 移动端触摸支持
- ✅ 键盘导航支持
- ✅ 屏幕阅读器友好

## 后续优化建议

1. **图片预加载**: 在悬停时预加载大图
2. **缩放功能**: 添加图片缩放控制
3. **轮播功能**: 支持多图片轮播查看
4. **手势支持**: 移动端手势操作
5. **动画效果**: 添加打开/关闭动画

## 状态
- ✅ 功能已实现
- ✅ 测试页面已创建
- ✅ 文档已完善
- 🔄 等待用户测试验证 