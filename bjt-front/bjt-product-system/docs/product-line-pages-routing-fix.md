# 产品线专用页面路由修复

## 问题描述
用户报告之前开发的产品线主机选购页面和耗材选购页面看不到了，怀疑不在同一个分支上。

## 问题分析
经过检查发现：
1. **文件确实存在**：产品线专用页面文件都存在于正确的位置
2. **路由配置缺失**：这些页面没有被正确配置到路由系统中
3. **首页链接问题**：首页只是通过query参数传递产品线ID，而不是跳转到专用页面

## 现有文件清单

### 主机选购页面
- ✅ `frontend/src/pages/Machines/ProductLine1Page.tsx` (175KB, 3699行)
- ✅ `frontend/src/pages/Machines/ProductLine2Page.tsx` (186KB, 3900行)  
- ✅ `frontend/src/pages/Machines/ProductLine3Page.tsx` (177KB, 3741行)

### 耗材选购页面
- ❌ `frontend/src/pages/Consumables/ProductLine1ConsumablesPage.tsx` (不存在)
- ✅ `frontend/src/pages/Consumables/ProductLine2ConsumablesPage.tsx` (21KB, 589行)
- ✅ `frontend/src/pages/Consumables/ProductLine3ConsumablesPage.tsx` (28KB, 755行)

## 修复方案

### 1. 添加导入语句
在 `frontend/src/App.tsx` 中添加：
```typescript
// 导入产品线专用页面
import ProductLine1Page from './pages/Machines/ProductLine1Page';
import ProductLine2Page from './pages/Machines/ProductLine2Page';
import ProductLine3Page from './pages/Machines/ProductLine3Page';
import ProductLine2ConsumablesPage from './pages/Consumables/ProductLine2ConsumablesPage';
import ProductLine3ConsumablesPage from './pages/Consumables/ProductLine3ConsumablesPage';
```

### 2. 添加路由配置
```typescript
{/* 产品线专用主机选购页面 */}
<Route path="/machines/product-line-1" element={<ProtectedRoute><MainLayout><ProductLine1Page /></MainLayout></ProtectedRoute>} />
<Route path="/machines/product-line-2" element={<ProtectedRoute><MainLayout><ProductLine2Page /></MainLayout></ProtectedRoute>} />
<Route path="/machines/product-line-3" element={<ProtectedRoute><MainLayout><ProductLine3Page /></MainLayout></ProtectedRoute>} />

{/* 产品线专用耗材选购页面 */}
<Route path="/consumables/product-line-2" element={<ProtectedRoute><MainLayout><ProductLine2ConsumablesPage /></MainLayout></ProtectedRoute>} />
<Route path="/consumables/product-line-3" element={<ProtectedRoute><MainLayout><ProductLine3ConsumablesPage /></MainLayout></ProtectedRoute>} />
```

### 3. 修改首页链接
在 `frontend/src/pages/Home/index.tsx` 中修改链接生成逻辑：
```typescript
// 修改前：通过query参数
path: `${ROUTES.MACHINES}?category=${line.id}`

// 修改后：直接跳转到专用页面
path: `/machines/product-line-${line.id}`
```

## 访问路径

修复后，各产品线页面的访问路径为：

### 主机选购页面
- 产品线1（气垫机）: `/machines/product-line-1`
- 产品线2（气泡机）: `/machines/product-line-2`
- 产品线3（胶带机）: `/machines/product-line-3`

### 耗材选购页面
- 产品线1（气垫机）: `/consumables?category=1` (使用通用页面)
- 产品线2（气泡机）: `/consumables/product-line-2`
- 产品线3（胶带机）: `/consumables/product-line-3`

## 注意事项

1. **产品线1耗材页面**：产品线1没有专用的耗材页面，继续使用通用耗材页面
2. **产品线4特殊处理**：产品线4有特殊的单链接配置，保持现有逻辑
3. **认证保护**：所有页面都需要登录后才能访问
4. **备件页面**：目前所有产品线的备件都使用通用页面

## 测试验证

1. 启动开发服务器：`cd frontend && npm run dev`
2. 访问首页：`http://localhost:5173`
3. 点击各产品线的子项链接，验证是否跳转到正确的专用页面
4. 检查页面内容是否正确显示对应产品线的数据

## 状态
- ✅ 路由配置已添加
- ✅ 首页链接已修复
- ✅ 导入语句已添加
- 🔄 等待测试验证 