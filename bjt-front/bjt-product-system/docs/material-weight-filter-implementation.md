# 材料筛选功能实现 - 重量/厚度切换

## 功能概述

当用户在耗材页面选择不同材料时，筛选标签会自动切换：
- **非纸质材料**（HDPE, LDPE, Nylon等）：显示 "Thickness" 筛选
- **纸质材料**（PAPER, PAPER+PE等）：显示 "Weight" 筛选

## 实现细节

### 1. 材料判断函数

在 `frontend/src/pages/Consumables/index.tsx` 中添加了 `isPaperMaterial` 函数：

```typescript
// 判断是否为纸质材料
const isPaperMaterial = (materialId: string): boolean => {
  return materialId === 'PAPER' || materialId === 'paper_pe' || materialId.toLowerCase().includes('paper');
};
```

### 2. 筛选标签动态切换

修改了筛选区域的标签逻辑：

```typescript
<label className="block text-sm font-medium mb-2 text-label">
  {isPaperMaterial(selectedMaterial) ? t('filter.weight', 'Weight') : t('filter.thickness', 'Thickness')}:
</label>
```

### 3. 筛选选项动态切换

根据材料类型显示不同的选项：

```typescript
<Select 
  value={isPaperMaterial(selectedMaterial) ? selectedWeight : selectedThickness}
  onChange={isPaperMaterial(selectedMaterial) ? 
    (value: string) => setSelectedWeight(value) : 
    (value: string) => setSelectedThickness(value)
  }
  style={{ width: '100%' }}
>
  {(isPaperMaterial(selectedMaterial) ? weights : thicknesses).map(item => (
    <Option key={item.id} value={item.id}>{item.name}</Option>
  ))}
</Select>
```

### 4. 数据结构更新

#### 材料数据 (`frontend/src/services/mocks/data/consumableFilterOptions.data.json`)

添加了 PAPER 材料：

```json
{
  "id": "PAPER",
  "name": "Paper"
}
```

#### 重量选项

添加了重量筛选选项：

```json
"weights": [
  {
    "id": "all",
    "name": "ALL"
  },
  {
    "id": "50gsm",
    "name": "50 gsm"
  },
  {
    "id": "75gsm",
    "name": "75 gsm"
  },
  {
    "id": "100gsm",
    "name": "100 gsm"
  }
]
```

## SQL数据对应关系

根据 `docker/dev/mysql/_耗材.sql` 中的数据：

### 材料表 (`wp_bjt_materials`)
- `PAPER` - 纸塑膜

### 规格表 (`wp_bjt_specifications`)
- `weight` 类型规格：`(1, 'weight', 50.0, 'gsm', 30.0, 'oz', 'publish', 80)`

## 测试

创建了测试页面 `frontend/public/test-material-weight-filter.html` 来验证功能：

1. 访问 `http://localhost:5173/test-material-weight-filter.html`
2. 点击不同材料按钮
3. 观察筛选标签和选项的变化

### 预期行为

- 选择 HDPE/LDPE/Nylon：显示 "Thickness" 和厚度选项
- 选择 PAPER/PAPER+PE：显示 "Weight" 和重量选项

## 用户体验

1. **直观性**：用户选择纸质材料时自动看到重量选项，符合行业惯例
2. **一致性**：与SQL数据结构保持一致
3. **灵活性**：支持多种纸质材料类型的判断

## 技术要点

1. **类型安全**：使用TypeScript确保类型安全
2. **响应式**：筛选器根据材料选择实时更新
3. **国际化**：支持多语言标签切换
4. **数据驱动**：基于实际SQL数据结构设计

## 后续扩展

1. 可以根据需要添加更多重量选项
2. 支持其他特殊材料的自定义筛选类型
3. 添加单位切换功能（公制/英制） 