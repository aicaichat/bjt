# 购物车Bug修复指南

## 📋 目录

- [A. 订单流程问题](#a-订单流程问题)
- [B. PO页面核心问题](#b-po页面核心问题)  
- [C. 字段显示问题](#c-字段显示问题)
- [D. 数据完整性问题](#d-数据完整性问题)
- [E. 备件流程问题](#e-备件流程问题)
- [F. 修复验证方法](#f-修复验证方法)

---

## A. 订单流程问题

### A01. 可选国家缺失
**Bug ID**: BUG-A01  
**问题描述**: 订单页面国家选择器缺少选项  
**修复状态**: ❌ 未修复  

**定位方法**:
```bash
# 1. 查找订单页面国家选择器
grep -r "country\|Country" frontend/src/pages/Order/
grep -r "国家\|地区" frontend/src/pages/Order/

# 2. 检查国家数据源
find frontend/src -name "*country*" -o -name "*Country*"
```

**修复提示词**:
```typescript
// 在 frontend/src/pages/Order/index.tsx 中
// 1. 添加完整的国家列表数据
const COUNTRIES = [
  { code: 'US', name: 'United States', name_zh: '美国' },
  { code: 'CN', name: 'China', name_zh: '中国' },
  { code: 'CA', name: 'Canada', name_zh: '加拿大' },
  // 添加更多国家...
];

// 2. 在收货信息表单中添加国家选择器
<Select
  placeholder={t('order.shipping.countryPlaceholder')}
  value={shippingInfo.country}
  onChange={(value) => setShippingInfo(prev => ({...prev, country: value}))}
  options={COUNTRIES.map(country => ({
    value: country.code,
    label: currentLanguage === 'zh' ? country.name_zh : country.name
  }))}
/>
```

### A02. 创建的纽约订单无显示
**Bug ID**: BUG-A02  
**问题描述**: 提交的纽约订单在订单列表中不显示  
**修复状态**: ❌ 未修复  

**定位方法**:
```bash
# 1. 检查订单提交逻辑
grep -r "createOrder\|submitOrder" frontend/src/pages/Order/
grep -r "New York\|纽约" frontend/src/

# 2. 检查订单列表加载
grep -r "getOrders\|loadOrders" frontend/src/pages/OrderList/
```

**修复提示词**:
```typescript
// 检查 frontend/src/api/services/order.service.ts
// 1. 确保订单提交成功保存
export const submitOrder = async (orderData: CreateOrderRequest) => {
  try {
    // 添加调试日志
    console.log('📝 提交订单数据:', orderData);
    
    const response = await apiClient.post('/orders', orderData);
    
    // 确保保存到本地存储（如果使用mock）
    if (shouldUseMockData()) {
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.unshift(response.data);
      localStorage.setItem('orders', JSON.stringify(existingOrders));
    }
    
    return response;
  } catch (error) {
    console.error('❌ 订单提交失败:', error);
    throw error;
  }
};
```

---

## B. PO页面核心问题

### B01. PO页面字段名称错误、productid字段缺失
**Bug ID**: BUG-B01  
**问题描述**: PO页面显示的字段名称不正确，productid字段缺失  
**修复状态**: ✅ 部分修复（字段映射已实现）  

**定位方法**:
```bash
# 1. 检查PO页面字段显示
grep -r "productid\|Product ID" frontend/src/pages/PO/
grep -r "partNumber\|Part.*No" frontend/src/pages/PO/

# 2. 检查字段映射配置
cat frontend/src/utils/CartFieldUnifier.ts | grep -A 10 "productId\|product_id"
```

**修复提示词**:
```typescript
// 在 frontend/src/pages/PO/index.tsx 的表格列定义中
// 1. 确保显示正确的产品ID
<th>{t('table.columns.productId', 'Product ID')}</th>

// 2. 在数据行中正确显示
<td style={{textAlign: 'center', fontFamily: 'monospace'}}>
  {p.id || p.code || p.sku || '-'}
</td>

// 3. 在翻译文件中添加缺失的字段标签
// frontend/src/i18n/locales/zh/po.json
"table": {
  "columns": {
    "productId": "产品ID",
    "partNumber": "零件号",
    // ...其他字段
  }
}
```

### B02. 所有的po excel 数据错乱  
**Bug ID**: BUG-B02  
**问题描述**: 导出的Excel文件数据排列错乱  
**修复状态**: ✅ 已修复（CartExcelNormalizer已实现）  

**验证方法**:
```bash
# 检查Excel标准化处理器
grep -A 20 "CartExcelNormalizer" frontend/src/utils/CartFieldUnifier.ts
grep -A 10 "normalizeExcelData" frontend/src/pages/PO/index.tsx
```

---

## C. 字段显示问题

### C01. po字段显示中英文混乱
**Bug ID**: BUG-C01  
**问题描述**: PO页面字段标签中英文混乱显示  
**修复状态**: ✅ 已修复（CartFieldUnifier已实现）  

**验证方法**:
```typescript
// 检查 frontend/src/pages/PO/index.tsx 中的语言处理
const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
const getProductName = (product: POProduct) => {
  return CartFieldUnifier.getProductName(product, currentLanguage);
};
```

### C02. 净重字段在气泡里，lbs单位改成lb
**Bug ID**: BUG-C02  
**问题描述**: 净重字段单位显示为lbs应改为lb  
**修复状态**: ✅ 已修复  

**验证方法**:
```bash
# 检查单位映射
grep -A 5 "net_weight_lbs.*lb" frontend/src/components/Cart/EnhancedCartSidebar.tsx
```

### C03-C09. 字段名称错误（多处）
**Bug ID**: BUG-C03~C09  
**问题描述**: 多个字段名称显示错误  
**修复状态**: ✅ 已修复（字段映射系统已实现）  

**修复提示词**:
```typescript
// 使用统一的字段映射系统
import { CartFieldUnifier } from '../../utils/CartFieldUnifier';

// 获取标准化的字段标签
const getFieldLabel = (fieldKey: string, language: string) => {
  return CartFieldUnifier.getFieldLabel(fieldKey, language);
};

// 在组件中使用
<span>{getFieldLabel('net_weight_kg', currentLanguage)}</span>
```

---

## D. 数据完整性问题

### D01. 所有的productid数据缺失
**Bug ID**: BUG-D01  
**问题描述**: 产品ID数据在PO中缺失  
**修复状态**: ✅ 已修复  

**修复提示词**:
```typescript
// 在订单数据处理中确保ID传递
const processedOrderItems = orderItems.map(item => ({
  ...item,
  id: item.id || item.product_id || item.sku,
  code: item.part_number || item.sku || item.code,
}));
```

### D02. 缺少spec.、适用机型
**Bug ID**: BUG-D02  
**问题描述**: PO中缺少规格说明和适用机型信息  
**修复状态**: ⚠️ 需完善  

**修复提示词**:
```typescript
// 在PO页面添加规格和适用机型显示
<td style={{fontSize: '13px', lineHeight: '1.4'}}>
  {(() => {
    const specs = [];
    
    // 添加规格信息
    if (product.specs) specs.push(product.specs);
    
    // 添加适用机型
    if (product.applicable_machine) {
      specs.push(`适用机型: ${product.applicable_machine}`);
    }
    
    return specs.join(' | ') || '-';
  })()}
</td>
```

---

## E. 备件流程问题

### E01-E15. 备件相关字段问题
**Bug ID**: BUG-E01~E15  
**问题描述**: 备件购物流程中的各种字段显示和数据问题  
**修复状态**: ⚠️ 部分修复（需二期统一）  

**修复提示词**:
```typescript
// 为备件产品添加专门的字段映射
const SPARE_PARTS_FIELD_MAPPING = {
  'part_number': { zh: '零件号', en: 'Part Number' },
  'compatible_models': { zh: '兼容机型', en: 'Compatible Models' },
  'material': { zh: '材质', en: 'Material' },
  'warranty_period': { zh: '保修期', en: 'Warranty Period' },
  // ...更多备件专用字段
};

// 在备件页面使用专门的映射
const getSparePartFieldLabel = (fieldKey: string, language: string) => {
  const mapping = SPARE_PARTS_FIELD_MAPPING[fieldKey];
  return mapping ? mapping[language] : fieldKey;
};
```

---

## F. 修复验证方法

### 1. 代码验证
```bash
# 检查修复完成度
./scripts/check-cart-fixes.sh

# 运行测试
npm test -- --testPathPattern=cart
npm test -- --testPathPattern=po
```

### 2. 功能验证
```bash
# 启动开发环境
npm start

# 测试购物车流程
# 1. 添加商品到购物车
# 2. 进入订单确认页面
# 3. 填写收货信息
# 4. 生成PO订单
# 5. 导出Excel验证
```

### 3. 修复状态更新
```bash
# 更新CSV状态
# 修复完成后，将对应行的"是否已完成"改为"✅"
```

---

## 📊 修复进度总结

| 类别 | 总数 | 已修复 | 部分修复 | 未修复 |
|------|------|--------|----------|--------|
| 订单流程 | 2 | 0 | 0 | 2 |
| PO页面核心 | 5 | 3 | 1 | 1 |
| 字段显示 | 8 | 6 | 1 | 1 |
| 数据完整性 | 5 | 2 | 2 | 1 |
| 备件流程 | 15 | 0 | 5 | 10 |
| **总计** | **35** | **11** | **9** | **15** |

**修复率**: 31% 已完成，26% 部分完成，43% 待修复 