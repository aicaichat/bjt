# 产品线4首页显示测试文档

## 测试目标

验证产品线4（气柱袋产品线）在前端首页 `http://localhost:5173/` 上的正确显示和功能。

## 实现的功能

### 1. **特殊链接处理**
- 产品线4使用自定义的 `subitem1_link` 字段
- 支持外部链接（HTTPS）和内部链接
- 外部链接在新窗口打开，带有特殊图标 ↗

### 2. **视觉差异化**
- 产品线4使用绿色主题色（#52c41a）
- 外部链接有特殊的样式和悬停效果
- 产品线4的标题栏使用绿色渐变背景

### 3. **响应式设计**
- 在各种屏幕尺寸下都能正确显示
- 移动端友好的链接大小和间距

## 测试步骤

### 手动测试
1. 访问首页：`http://localhost:5173/`
2. 查找"气柱袋产品线"或"Air Column Bag Product Line"部分
3. 验证以下内容：
   - ✅ 产品线4正确显示在列表中
   - ✅ 标题栏使用绿色渐变背景
   - ✅ 只有一个子项链接："气柱袋产品"/"Air Column Bag Products"
   - ✅ 链接显示外部图标 ↗
   - ✅ 点击链接在新窗口打开

### API测试
```bash
# 验证产品线4的数据
curl -s "http://localhost:8080/wp-json/bjt/v1/product-lines/4" | python3 -m json.tool

# 验证所有产品线列表
curl -s "http://localhost:8080/wp-json/bjt/v1/product-lines" | python3 -m json.tool
```

### 前端代码验证
检查以下文件的更改：

#### `frontend/src/pages/Home/index.tsx`
- ✅ `createProductLinks()` 函数包含产品线4的特殊处理
- ✅ 外部链接使用 `<a>` 标签而不是 `<Link>`
- ✅ 添加了 `data-product-line` 属性

#### `frontend/src/pages/Home/Home.css`
- ✅ 添加了 `.external-link` 样式
- ✅ 添加了产品线4的特殊主题色
- ✅ 添加了外部图标的动画效果

## 预期结果

### 产品线1-3（传统显示）
```
气垫系列
├── 缓冲气垫机 → /machines?category=1
├── 缓冲气垫膜 → /consumables?category=1  
└── 缓冲气垫外设配件 → /spare-parts?category=1
```

### 产品线4（特殊显示）
```
气柱袋产品线 [绿色主题]
└── 气柱袋产品 ↗ → https://example.com/edit/air-column-bags [新窗口]
```

## 技术实现细节

### 链接判断逻辑
```javascript
// 产品线4特殊处理
if (line.id === 4) {
  return [{
    text: getSubitem1(line),
    path: line.subitem1_link,
    isExternal: line.subitem1_link.startsWith('http')
  }];
}
```

### 渲染逻辑
```jsx
{linkData.isExternal ? (
  <a href={linkData.path} target="_blank" rel="noopener noreferrer">
    {linkData.text} <span className="external-icon">↗</span>
  </a>
) : (
  <Link to={linkData.path}>{linkData.text}</Link>
)}
```

## 故障排除

### 常见问题
1. **产品线4不显示**
   - 检查数据库中是否有ID为4的产品线
   - 验证API返回的数据格式

2. **链接不工作**
   - 检查 `subitem1_link` 字段是否有值
   - 验证链接格式是否正确

3. **样式不正确**
   - 检查CSS文件是否正确加载
   - 验证 `data-product-line="4"` 属性是否正确设置

### 调试命令
```bash
# 检查产品线4数据
curl -s "http://localhost:8080/wp-json/bjt/v1/product-lines/4"

# 重启前端服务
./scripts/docker-dev.sh restart-frontend

# 查看前端日志
./scripts/docker-dev.sh logs-frontend
```

## 验证清单

- [ ] 产品线4在首页正确显示
- [ ] 使用绿色主题色
- [ ] 只有一个子项链接
- [ ] 外部链接图标显示
- [ ] 点击链接在新窗口打开
- [ ] 移动端显示正常
- [ ] 其他产品线不受影响 