# 字段标准化报告

生成时间: 2025-06-09T03:51:55.440Z

## 机器页面

### 商品列表 (9 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 型号 | Model | 型号 | Model | 未分类 |  | ⚠️ contains |
| 电压 | Voltage | 电压 | Voltage | 未分类 | V | ✅ exact |
| 图片 | Packaging Image | 包装图片 | Packaging Image | 未分类 |  | ⚠️ contains |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 名称 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 未标准化 |  | ❌ unmatched |
| 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 未标准化 |  | ❌ unmatched |
| 一托数量 | Packs per Pallet | 一托数量 | Packs per Pallet | 未分类 |  | ⚠️ contains |

### 购物车 (9 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 型号 | Model | 型号 | Model | 未分类 |  | ⚠️ contains |
| 电压 | Voltage | 电压 | Voltage | 未分类 | V | ✅ exact |
| 图片 | Packaging Image | 包装图片 | Packaging Image | 未分类 |  | ⚠️ contains |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 名称 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 未标准化 |  | ❌ unmatched |
| 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 未标准化 |  | ❌ unmatched |
| 一托数量 | Packs per Pallet | 一托数量 | Packs per Pallet | 未分类 |  | ⚠️ contains |

### tooltip (8 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 单件净重kg | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 打托高度cm | 打托高度cm | 打托高度cm | 打托高度cm | 未标准化 |  | ❌ unmatched |
| 打托高度inch | 打托高度inch | 打托高度inch | 打托高度inch | 未标准化 |  | ❌ unmatched |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | 整托毛重kg | 未标准化 |  | ❌ unmatched |
| 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | 未标准化 |  | ❌ unmatched |

### PO页 (6 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 型号 | Model | 型号 | Model | 未分类 |  | ⚠️ contains |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 名称 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 品牌 | Brand | 品牌 | Brand | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 未分类 |  | ✅ exact |

## 耗材页面

### 商品列表 (13 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 适用机型 | Applicable Machine | 适用机型 | Applicable Machine | 未分类 |  | ✅ exact |
| 名称(英文)新增需求 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 形状 | 形状 | 形状 | 形状 | 未标准化 |  | ❌ unmatched |
| 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 未标准化 |  | ❌ unmatched |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 型号（公制） | Model | 型号 | Model | 未分类 |  | ✅ clean_exact |
| 型号(英制) | Model | 型号 | Model | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 未分类 |  | ✅ exact |
| 泡径cm | Bubble Dia. | 泡径 | Bubble Dia. | 未分类 | mm | ⚠️ contains |
| 泡径inch | Bubble Dia. | 泡径 | Bubble Dia. | 未分类 | mm | ⚠️ contains |
| productId | productid | productId | productId | 未标准化 |  | ❌ unmatched |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |

### 购物车 (12 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 适用机型 | Applicable Machine | 适用机型 | Applicable Machine | 未分类 |  | ✅ exact |
| 名称(英文)新增需求 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 未标准化 |  | ❌ unmatched |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 型号（公制） | Model | 型号 | Model | 未分类 |  | ✅ clean_exact |
| 型号(英制) | Model | 型号 | Model | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 未分类 |  | ✅ exact |
| 泡径cm | Bubble Dia. | 泡径 | Bubble Dia. | 未分类 | mm | ⚠️ contains |
| 泡径inch | Bubble Dia. | 泡径 | Bubble Dia. | 未分类 | mm | ⚠️ contains |
| productId | productid | productId | productId | 未标准化 |  | ❌ unmatched |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |

### tooltip (34 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 材质 | Material | 材质 | Material | 未分类 |  | ✅ exact |
| 厚度/克重um/gsm | 厚度/克重um/gsm | 厚度/克重um/gsm | 厚度/克重um/gsm | 未标准化 |  | ❌ unmatched |
| 厚度/克重mil/# | 厚度/克重mil/# | 厚度/克重mil/# | 厚度/克重mil/# | 未标准化 |  | ❌ unmatched |
| 膜宽cm | 膜宽cm | 膜宽cm | 膜宽cm | 未标准化 |  | ❌ unmatched |
| 膜宽inch | 膜宽inch | 膜宽inch | 膜宽inch | 未标准化 |  | ❌ unmatched |
| 袋长cm | 袋长cm | 袋长cm | 袋长cm | 未标准化 |  | ❌ unmatched |
| 袋长inch | 袋长inch | 袋长inch | 袋长inch | 未标准化 |  | ❌ unmatched |
| 名称(英文)新增需求 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 总长m | 总长m | 总长m | 总长m | 未标准化 |  | ❌ unmatched |
| 总长ft | 总长ft | 总长ft | 总长ft | 未标准化 |  | ❌ unmatched |
| 包装方式 | 包装方式 | 包装方式 | 包装方式 | 未标准化 |  | ❌ unmatched |
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 单件净重kg | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 包装实物图片 | 包装实物图片 | 包装实物图片 | 包装实物图片 | 未标准化 |  | ❌ unmatched |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 未标准化 |  | ❌ unmatched |
| 一托卷数A | 一托卷数a | 一托卷数A | 一托卷数A | 未标准化 |  | ❌ unmatched |
| 整托毛重Akg | 整托毛重akg | 整托毛重Akg | 整托毛重Akg | 未标准化 |  | ❌ unmatched |
| 整托毛重Albs | 整托毛重albs | 整托毛重Albs | 整托毛重Albs | 未标准化 |  | ❌ unmatched |
| 打托高度Acm | 打托高度acm | 打托高度Acm | 打托高度Acm | 未标准化 |  | ❌ unmatched |
| 打托高度Ainch | 打托高度ainch | 打托高度Ainch | 打托高度Ainch | 未标准化 |  | ❌ unmatched |
| 一托卷数B | 一托卷数b | 一托卷数B | 一托卷数B | 未标准化 |  | ❌ unmatched |
| 整盘毛重kg | 整盘毛重kg | 整盘毛重kg | 整盘毛重kg | 未标准化 |  | ❌ unmatched |
| 整盘毛重Blbs | 整盘毛重blbs | 整盘毛重Blbs | 整盘毛重Blbs | 未标准化 |  | ❌ unmatched |
| 打托高度cm | 打托高度cm | 打托高度cm | 打托高度cm | 未标准化 |  | ❌ unmatched |
| 打托高度Binch | 打托高度binch | 打托高度Binch | 打托高度Binch | 未标准化 |  | ❌ unmatched |
| 一托卷数C | 一托卷数c | 一托卷数C | 一托卷数C | 未标准化 |  | ❌ unmatched |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | 整托毛重kg | 未标准化 |  | ❌ unmatched |
| 整托毛重Clbs | 整托毛重clbs | 整托毛重Clbs | 整托毛重Clbs | 未标准化 |  | ❌ unmatched |
| 打托高度Ccm | 打托高度ccm | 打托高度Ccm | 打托高度Ccm | 未标准化 |  | ❌ unmatched |
| 打托高度Cinch | 打托高度cinch | 打托高度Cinch | 打托高度Cinch | 未标准化 |  | ❌ unmatched |
| 纸筒内径cm | 纸筒内径cm | 纸筒内径cm | 纸筒内径cm | 未标准化 |  | ❌ unmatched |
| 纸筒内径inch | 纸筒内径inch | 纸筒内径inch | 纸筒内径inch | 未标准化 |  | ❌ unmatched |

### PO页 (8 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 名称(英文)新增需求 | Item | 名称 | Item | 未分类 |  | ⚠️ contains |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 型号（公制） | Model | 型号 | Model | 未分类 |  | ✅ clean_exact |
| 型号(英制) | Model | 型号 | Model | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 未分类 |  | ✅ exact |
| 品牌 | Brand | 品牌 | Brand | 未分类 |  | ✅ exact |
| productId | productid | productId | productId | 未标准化 |  | ❌ unmatched |

## 备件页面

### 商品列表 (9 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 适配机型 | 适配机型 | 适配机型 | 适配机型 | 未标准化 |  | ❌ unmatched |
| 是否易损 | Consumable Status | 易损 | Consumable Status | 未分类 |  | ✅ exact |
| 产品图片 | 产品图片 | 产品图片 | 产品图片 | 未标准化 |  | ❌ unmatched |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 名称(英文) | Item | 名称 | Item | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| 适配序列号 | Applicable SN. | 适配序列号 | Applicable SN. | 未分类 |  | ✅ exact |
| Unit | unit | Unit | Unit | 未标准化 |  | ❌ unmatched |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |

### 购物车 (12 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 适配机型 | 适配机型 | 适配机型 | 适配机型 | 未标准化 |  | ❌ unmatched |
| 产品图片 | 产品图片 | 产品图片 | 产品图片 | 未标准化 |  | ❌ unmatched |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 名称(英文) | Item | 名称 | Item | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| 适配序列号 | Applicable SN. | 适配序列号 | Applicable SN. | 未分类 |  | ✅ exact |
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| Unit | unit | Unit | Unit | 未标准化 |  | ❌ unmatched |
| 单件净重kg | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |

### tooltip (4 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 单件净重kg | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |

### PO页 (5 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 名称(英文) | Item | 名称 | Item | 未分类 |  | ✅ exact |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 未分类 |  | ✅ exact |
| Unit | unit | Unit | Unit | 未标准化 |  | ❌ unmatched |

## 配件页面

### 商品列表 (10 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 产品图片 | 产品图片 | 产品图片 | 产品图片 | 未标准化 |  | ❌ unmatched |
| 型号 | Model | 型号 | Model | 未分类 |  | ⚠️ contains |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 产品名称 | 产品名称 | 产品名称 | 产品名称 | 未标准化 |  | ❌ unmatched |
| 电压V | Voltage | 电压 | Voltage | 未分类 | V | ⚠️ contains |
| 频率Hz | Frequency | 频率 | Frequency | 未分类 | Hz | ⚠️ contains |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 未标准化 |  | ❌ unmatched |
| 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 未标准化 |  | ❌ unmatched |
| 一托数量 | Packs per Pallet | 一托数量 | Packs per Pallet | 未分类 |  | ⚠️ contains |

### 购物车 (7 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 产品图片 | 产品图片 | 产品图片 | 产品图片 | 未标准化 |  | ❌ unmatched |
| 型号 | Model | 型号 | Model | 未分类 |  | ⚠️ contains |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 产品名称 | 产品名称 | 产品名称 | 产品名称 | 未标准化 |  | ❌ unmatched |
| 电压V | Voltage | 电压 | Voltage | 未分类 | V | ⚠️ contains |
| 频率Hz | Frequency | 频率 | Frequency | 未分类 | Hz | ⚠️ contains |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 未分类 |  | ✅ exact |

### tooltip (8 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 未分类 | cm | ⚠️ contains |
| 单件净重kg | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 未分类 | kg | ⚠️ contains |
| 打托高度cm | 打托高度cm | 打托高度cm | 打托高度cm | 未标准化 |  | ❌ unmatched |
| 打托高度inch | 打托高度inch | 打托高度inch | 打托高度inch | 未标准化 |  | ❌ unmatched |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | 整托毛重kg | 未标准化 |  | ❌ unmatched |
| 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | 未标准化 |  | ❌ unmatched |

### PO页 (6 个字段)

| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |
|---------|--------|--------|--------|------|------|----------|
| 型号 | Model | 型号 | Model | 未分类 |  | ⚠️ contains |
| 品牌 | Brand | 品牌 | Brand | 未分类 |  | ✅ exact |
| 料号 | Part No. | 料号 | Part No. | 未分类 |  | ✅ exact |
| 产品名称 | 产品名称 | 产品名称 | 产品名称 | 未标准化 |  | ❌ unmatched |
| Spec. | Spec. | 规格描述 | Spec. | 未分类 |  | ⚠️ contains |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 未分类 |  | ✅ exact |

## 📊 统计信息

- 总字段数: 160
- 已匹配字段: 100 (62.5%)
- 完美匹配: 46 (28.7%)
- 未匹配字段: 60 (37.5%)