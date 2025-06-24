# PO页面显示修复效果测试指南

## 🎯 修复目标

解决PO页面显示产品信息为 `unknown-1750653477963` 的问题，确保显示正确的产品名称、规格和订单信息。

## 🔧 修复内容

### 1. OrderList → PO 数据传递修复
- ✅ 修复产品名称字段映射：`item_name` → `name`
- ✅ 修复产品类型字段映射：`item_type` → `type`
- ✅ 增强字段回退逻辑：`item_name || name || part_number`

### 2. PO页面产品显示逻辑修复
- ✅ 增加unknown格式检测和处理
- ✅ 优化产品名称显示优先级
- ✅ 添加详细的调试日志

### 3. Excel导出数据处理修复
- ✅ 修复产品名称清理逻辑
- ✅ 统一订单号格式转换（ORD → PO）
- ✅ 优化描述字段处理

### 4. CartExcelNormalizer清理逻辑修复
- ✅ 智能处理unknown格式产品名
- ✅ 增强备用字段使用逻辑

## 🧪 测试步骤

### 步骤1：验证数据库数据
```bash
# 确认数据库中的数据是正确的
docker exec dev-wordpress-1 php -r "
require_once '/var/www/html/wp-config.php';
global \$wpdb;
\$order = \$wpdb->get_row(\"SELECT * FROM wp_bjt_orders WHERE order_number = 'ORD-20250623-4F94F7'\");
\$items = \$wpdb->get_results(\$wpdb->prepare(\"SELECT * FROM wp_bjt_order_items WHERE order_id = %d\", \$order->id));
echo \"订单: {\$order->order_number}, 商品数量: \" . count(\$items) . \"\n\";
foreach (\$items as \$item) {
    echo \"- {\$item->item_name} ({\$item->item_id}) x{\$item->quantity}\n\";
}
"
```

### 步骤2：测试OrderList页面
1. 访问 `http://localhost:5173/orders`
2. 找到订单 `ORD-20250623-4F94F7`
3. 点击"返回PO页面"按钮
4. 检查控制台日志：
   ```
   🔧 [OrderList] 准备传递的poData: {...}
   🔧 [OrderList] 商品数量: 6
   ```

### 步骤3：测试PO页面显示
1. 在PO页面检查产品表格
2. 验证产品名称不再显示为 `unknown-1750653477963`
3. 检查控制台日志：
   ```
   🔧 [PO Display] 产品1显示名称: 面板排线
   🔧 [PO Display] 产品2显示名称: LA E5S test
   ```

### 步骤4：测试Excel导出
1. 在PO页面点击"导出Excel"
2. 检查导出的Excel文件
3. 验证：
   - 订单号格式：`PO-20250623-4F94F7`（ORD转PO）
   - 产品名称：显示正确的产品名称
   - 产品数量：6个不同产品
   - 总金额：¥800.00

## 📊 预期结果

### 修复前 ❌
- 产品名称：`unknown-1750653477963`（6个相同）
- 订单号：`PO-20250623-4766`（不匹配）
- 总金额：¥600.00（错误）

### 修复后 ✅
- 产品名称：正确的产品名称（6个不同）
  - 面板排线
  - LA E5S test
  - ET1005 多风机输送系统
  - ET1003 气垫输送系统
  - ET1004 气垫输送系统
  - Not Found
- 订单号：`PO-20250623-4F94F7`（匹配数据库）
- 总金额：¥800.00（正确）

## 🔍 故障排除

### 如果产品名称仍显示unknown格式
1. 检查浏览器控制台的调试日志
2. 确认OrderList传递的数据格式
3. 验证PO页面的数据接收逻辑

### 如果Excel导出仍有问题
1. 检查excelExporter的数据转换逻辑
2. 验证订单号格式转换
3. 确认产品字段映射

## 📝 验证清单

- [ ] 数据库数据完整性确认
- [ ] OrderList → PO 数据传递正确
- [ ] PO页面产品名称显示正确
- [ ] PO页面订单号格式正确
- [ ] Excel导出产品信息正确
- [ ] Excel导出订单号格式正确
- [ ] 总金额计算正确
- [ ] 无控制台错误

## 🎉 成功标准

当所有以下条件都满足时，修复成功：

1. ✅ PO页面显示6个不同的产品名称
2. ✅ 订单号显示为 `PO-20250623-4F94F7`
3. ✅ 总金额显示为 ¥800.00
4. ✅ Excel导出内容与PO页面一致
5. ✅ 无JavaScript错误或警告 