# 主机型号对比图片功能实现文档

## 功能概述

在主机型号选择区域上方添加了一张主机型号对比图片，用户可以通过点击图片中的不同区域来选择对应的主机型号，提升用户体验和选择效率。

## 实现位置

- **文件**: `frontend/src/pages/Machines/ProductLine1Page.tsx`
- **位置**: Filter Section 上方，面包屑导航下方
- **XPath**: `//*[@id="root"]/div[1]/div[1]/div/main/div/div/div[3]/div[1]/h1` 上方

## 功能特性

### 1. 图片显示
- 显示主机型号对比图片 (`/static/machine-model-compare.png`)
- 图片加载失败时显示默认SVG占位图
- 响应式设计，适配不同屏幕尺寸

### 2. 交互功能
- 点击图片中的不同区域选择对应主机型号
- 鼠标悬停时显示视觉反馈
- 选中状态高亮显示（蓝色边框和背景）
- 选中指示器（✓图标）

### 3. 动态区域生成
- 根据实际主机数据动态生成点击区域
- 最多显示3个主机型号
- 自动计算区域位置和大小

### 4. 状态同步
- 图片选择与下方主机选择区同步
- 选择成功后显示成功提示
- 只在未选择主机时显示对比图片

## 代码实现

### 核心函数

```typescript
// 处理图片点击选择主机型号
const handleImageModelSelection = (partNumber: string) => {
  const targetMachine = filteredMachines.find(machine => 
    machine.part_number === partNumber || 
    machine.model === partNumber ||
    getMachineName(machine).includes(partNumber)
  );
  
  if (targetMachine) {
    handleMachineSelection(targetMachine.id.toString());
    success(`已选择主机型号: ${getMachineName(targetMachine)}`);
  } else {
    warning(`未找到型号 ${partNumber} 对应的主机`);
  }
};
```

### 图片区域组件

```typescript
{/* 主机型号对比图片区域 */}
{!selectedMachine && (
  <div style={{
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto 24px auto',
    position: 'relative',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    background: '#fff',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    padding: '16px'
  }}>
    {/* 图片和交互区域 */}
  </div>
)}
```

### 动态点击区域

```typescript
{filteredMachines.slice(0, 3).map((machine, index) => {
  const partNumber = machine.part_number || machine.model || getMachineName(machine);
  const isSelected = selectedMachine === machine.id.toString();
  
  return (
    <div
      key={`model-area-${machine.id}`}
      style={{
        position: 'absolute',
        left: `${20 + index * 180}px`,
        top: '20px',
        width: '160px',
        height: '200px',
        cursor: 'pointer',
        border: isSelected ? '3px solid #3b82f6' : '2px solid transparent',
        borderRadius: '8px',
        boxShadow: isSelected ? '0 0 0 4px #dbeafe' : 'none',
        transition: 'all 0.2s ease',
        zIndex: 2,
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      }}
      title={`点击选择 ${getMachineName(machine)}`}
      onClick={() => handleImageModelSelection(partNumber)}
      onMouseOver={/* 悬停效果 */}
      onMouseOut={/* 悬停效果 */}
    >
      {/* 型号名称和选中指示器 */}
    </div>
  );
})}
```

## 样式设计

### 容器样式
- 白色背景，圆角边框
- 阴影效果增强层次感
- 响应式宽度设计

### 交互样式
- 悬停时蓝色边框和半透明背景
- 选中时蓝色边框、阴影和背景
- 平滑过渡动画

### 文字样式
- 型号名称白色背景确保可读性
- 选中状态蓝色文字
- 文字阴影增强对比度

## 测试页面

创建了测试页面 `frontend/public/test-model-compare-image.html` 用于验证功能：

- 模拟图片和点击区域
- 交互效果演示
- 状态显示和按钮控制

## 使用说明

1. 访问产品线1页面 (`/machines/product-line-1`)
2. 在主机选择区域上方查看对比图片
3. 点击图片中的不同区域选择主机型号
4. 选择成功后图片会隐藏，显示配件选择界面

## 注意事项

1. 需要准备主机型号对比图片 (`/static/machine-model-compare.png`)
2. 图片尺寸建议为 600x300 像素
3. 确保图片中的主机型号与数据中的型号匹配
4. 点击区域位置需要根据实际图片调整

## 后续优化

1. 支持更多主机型号显示
2. 添加图片缩放功能
3. 支持触摸设备手势操作
4. 添加图片预加载功能 