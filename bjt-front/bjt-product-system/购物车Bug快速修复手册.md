# 购物车Bug快速修复手册

## 🚀 快速导航

| Bug ID | 问题 | 状态 | 快速修复 |
|--------|------|------|----------|
| A01 | 可选国家缺失 | ❌ | `./scripts/fix-cart-bugs.sh -f A01` |
| A02 | 纽约订单无显示 | ❌ | 需手动修复订单保存逻辑 |
| B01 | PO字段名称错误 | ❌ | `./scripts/fix-cart-bugs.sh -f B01` |
| B02 | Excel数据错乱 | ✅ | 已修复 |
| B03 | 名称错误 | ✅ | 已修复 |
| B04 | 字段与前台不符 | ✅ | 已修复 |
| B05 | 中英文混乱 | ✅ | 已修复 |
| C01 | lbs单位问题 | ✅ | 已修复 |
| C02-09 | 字段名称错误 | ✅ | 已修复 |
| D01 | ProductID缺失 | ❌ | 需手动修复数据传递 |
| D02 | 缺少spec机型 | ❌ | 需手动添加字段显示 |
| D03 | 缺少气泡信息 | ❌ | 需数据补充 |
| D04 | 充气膜字段缺失 | ❌ | 需专用字段处理 |
| D05 | 数据一致性 | ✅ | 已修复 |
| E01-15 | 备件流程问题 | ❌ | 二期统一处理 |

## ⚡ 一键操作

### 检查所有Bug状态
```bash
./scripts/test-cart-fixes.sh
```

### 修复所有可自动修复的Bug
```bash
./scripts/fix-cart-bugs.sh -a
```

### 查看详细修复指南
```bash
cat 购物车Bug修复完整指南.md
```

## 🔥 高优先级Bug快速修复

### A01: 可选国家缺失
```bash
# 自动创建国家数据
./scripts/fix-cart-bugs.sh -f A01

# 手动集成到订单页面
# 在 frontend/src/pages/Order/index.tsx 添加:
# import { COUNTRIES } from '../../data/countries';
# <Select options={COUNTRIES} />
```

### A02: 纽约订单无显示
```typescript
// 修复 frontend/src/api/services/order.service.ts
// 确保订单保存到localStorage
if (shouldUseMockData()) {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.unshift(newOrder);
  localStorage.setItem('orders', JSON.stringify(orders));
}
```

### D01: ProductID数据缺失
```typescript
// 修复 frontend/src/pages/Order/index.tsx
const processedOrderItems = orderItems.map(item => ({
  ...item,
  id: item.id || item.product_id || item.sku || `temp_${Date.now()}`,
  code: item.part_number || item.sku || item.code,
}));
```

## 📊 修复进度一览

**总体状态**: 7/15 已修复 (47%)

**分类状态**:
- A类 (订单流程): 0/2 (0%)
- B类 (PO页面): 4/5 (80%)  
- C类 (字段显示): 2/2 (100%)
- D类 (数据完整性): 1/5 (20%)
- E类 (备件流程): 0/1 (0%)

## 🛠️ 工具使用

### 脚本命令
```bash
# 列出所有bug
./scripts/fix-cart-bugs.sh -l

# 检查特定bug状态  
./scripts/fix-cart-bugs.sh -c A01

# 修复特定bug
./scripts/fix-cart-bugs.sh -f A01

# 生成修复报告
./scripts/fix-cart-bugs.sh -r

# 查看帮助
./scripts/fix-cart-bugs.sh -h
```

### 测试验证
```bash
# 全面检测
./scripts/test-cart-fixes.sh

# 功能测试
npm start  # 启动开发服务器
# 手动测试购物车->订单->PO流程
```

## 💡 修复提示

### 通用修复模式
1. **字段显示问题** → 使用 CartFieldUnifier
2. **翻译缺失** → 添加到 i18n 文件
3. **数据传递** → 检查 Order→PO 数据流
4. **Excel导出** → 使用 CartExcelNormalizer

### 常见修复位置
- 订单页面: `frontend/src/pages/Order/index.tsx`
- PO页面: `frontend/src/pages/PO/index.tsx`  
- 翻译文件: `frontend/src/i18n/locales/zh/po.json`
- 字段统一器: `frontend/src/utils/CartFieldUnifier.ts`

---

**最后更新**: 2025-06-20  
**下次检查**: 修复A01、A02、D01后重新评估 