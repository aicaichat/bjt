# 前端页面字段使用情况对比报告

生成时间: 2025-06-09T04:34:51.936Z

## 📋 总体概览

| 页面 | CSV字段数 | 前端字段数 | 匹配字段数 | 覆盖率 | 状态 |
|------|-----------|------------|------------|---------|------|
| 机器页面 | 20 | 195 | 10 | 50.0% | ⚠️ 一般 |
| 耗材页面 | 47 | 243 | 16 | 34.0% | ❌ 需要改进 |
| 备件页面 | 14 | 132 | 7 | 50.0% | ⚠️ 一般 |
| 配件页面 | 21 | 19 | 1 | 4.8% | ❌ 需要改进 |

**总计**: CSV字段 102 个，前端字段 589 个，匹配 34 个

## 📄 机器页面 详细分析

### ✅ 已匹配字段

| 前端字段 | CSV字段 | 标准Key | 匹配类型 | 匹配分数 |
|----------|---------|---------|----------|----------|
| brand | 品牌 | Brand | 🎯 english | 0.90 |
| item | 名称 | Item | 🎯 english | 0.90 |
| model | 型号 | Model | 🎯 english | 0.90 |
| net_weight_kg | 单件净重kg | Net Weight(kg) | 🎯 english | 0.90 |
| package_size_cm | 包装尺寸cm | Package Size(cm) | 🎯 english | 0.90 |
| spec | Spec. | Spec. | ✅ contains | 0.80 |
| voltage | 电压 | Voltage | 🎯 english | 0.90 |
| 包装尺寸 | 包装尺寸cm | Package Size(cm) | ✅ contains | 0.80 |
| 型号 | 型号 | Model | 🎯 exact | 1.00 |
| 托盘尺寸 | 托盘尺寸cm | 托盘尺寸cm | ✅ contains | 0.80 |

### ❌ CSV中定义但前端未使用的字段

| CSV字段 | 标准Key | 中文名 | 英文名 | 显示场景 |
|---------|---------|--------|--------|----------|
| 图片 | Packaging Image | 包装图片 | Packaging Image | 商品列表, 购物车 |
| 料号 | Part No. | 料号 | Part No. | 商品列表, 购物车, PO页 |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 商品列表, 购物车 |
| 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 商品列表, 购物车 |
| 一托数量 | Packs per Pallet | 一托数量 | Packs per Pallet | 商品列表, 购物车 |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | tooltip |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | tooltip |
| 打托高度cm | 打托高度cm | 打托高度cm | 打托高度cm | tooltip |
| 打托高度inch | 打托高度inch | 打托高度inch | 打托高度inch | tooltip |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | 整托毛重kg | tooltip |
| 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | tooltip |
| Spec.(英制) | Spec. | 规格描述 | Spec. | PO页 |

### ⚠️ 前端使用但CSV未定义的字段

- `accessories.allLevelsComplete`
- `accessories.allLevelsCompleteDesc`
- `accessories.compatible`
- `accessories.level`
- `accessories.level1`
- `accessories.level2`
- `accessories.level3`
- `accessories.level4`
- `accessories.level5`
- `accessories.nextLevelLoaded`
- `accessories.nextLevelLoadedDesc`
- `accessories.noNextLevel`
- `accessories.noNextLevelDesc`
- `accessories.subCompatible`
- `accessories.title`
- `accessory.description`
- `accessory.details`
- `accessory.level`
- `accessory.loading`
- `accessory.noItems`
- `accessory.path`
- `accessory.selectFor`
- `accessory.selectMachine`
- `accessory.specifications`
- `accessory.title`
- `accessoryId`
- `accessoryName`
- `actions.close`
- `actions.selectAccessory`
- `actions.selectMachine`
- `baseUrl`
- `buttons.moreInfo`
- `categories.accessory`
- `categories.machine`
- `category`
- `children`
- `common.all`
- `common.loading`
- `common.reset`
- `created_at`
- `currentLanguage`
- `currentLevel`
- `currentPage`
- `description`
- `description_en`
- `description_zh`
- `details`
- `errors.addToCartFailed`
- `errors.authExpired`
- `errors.invalidRequest`
- `errors.invalidSelection`
- `errors.missingPartNumber`
- `errors.processingFailed`
- `errors.requiredAccessories`
- `errors.selectAllRequired`
- `errors.selectParentFirst`
- `errors.systemError`
- `errors.unknownError`
- `explosion_diagram_pdf`
- `field`
- `filterRegion`
- `filterType`
- `filters.allModels`
- `filters.allVoltages`
- `filters.model`
- `filters.region`
- `filters.search`
- `filters.searchPlaceholder`
- `filters.selectRegion`
- `filters.selectType`
- `filters.selectVoltage`
- `filters.type`
- `filters.voltage`
- `frequency`
- `gross_weight_kg`
- `gross_weight_lbs`
- `handleVoltageChange`
- `id`
- `image1_url`
- `image2_url`
- `image_url`
- `invIndex`
- `inventory`
- `inventory.abundant`
- `inventory.adequate`
- `inventory.lowStock`
- `inventory.outOfStock`
- `inventory.status`
- `is_required`
- `level`
- `levelColor`
- `loading`
- `loading.accessories`
- `machinePartNumber`
- `messages.addedToCart`
- `mockStock`
- `modelOptions`
- `model_explosion_diagram_pdf`
- `model_image1_url`
- `model_image2_url`
- `model_type`
- `name_en`
- `name_zh`
- `net_weight_lbs`
- `nextLevel`
- `noItems`
- `onFilterRegionChange`
- `onFilterTypeChange`
- `onRegionChange`
- `onReset`
- `onTypeChange`
- `onVoltageChange`
- `package_size_inch`
- `packaging.size`
- `packaging.title`
- `packaging.weight`
- `pageSize`
- `pallet.height`
- `pallet.quantity`
- `pallet.size`
- `pallet.title`
- `pallet_gross_weight_kg`
- `pallet_gross_weight_lbs`
- `pallet_height_cm`
- `pallet_height_inch`
- `pallet_size_cm`
- `pallet_size_inch`
- `parentLevel`
- `parent_id`
- `part_number`
- `parts`
- `path`
- `path.machine`
- `pathItems`
- `pcs_per_box`
- `pcs_per_pallet`
- `price`
- `prices`
- `pricing.from`
- `pricing.pieces`
- `product_line_id`
- `regionKey`
- `regionName`
- `regions.asia`
- `regions.china`
- `regions.europe`
- `regions.usa`
- `selectFor`
- `selectMachine`
- `selectedAccessoryName`
- `selectedVoltage`
- `spec_imperial`
- `spec_pdf`
- `specifications`
- `specs.packageSize`
- `specs.palletSize`
- `specs.pcsPerBox`
- `specs.pcsPerPallet`
- `status`
- `stockStatus.low`
- `stockStatus.outOfStock`
- `stockStatus.sufficient`
- `tableHeaders.frequency`
- `tableHeaders.model`
- `tableHeaders.packSize`
- `tableHeaders.palletSize`
- `tableHeaders.pcsPerBox`
- `tableHeaders.pcsPerPallet`
- `tableHeaders.price`
- `tableHeaders.stock`
- `tableHeaders.voltage`
- `targetLevel`
- `title`
- `title_en`
- `title_zh`
- `token`
- `tooltip.accessoryDetailInfo`
- `tooltip.hoverInfo`
- `true`
- `types.automatic`
- `types.manual`
- `types.semiAutomatic`
- `unit`
- `updated_at`
- `viewMode`

### 💡 改进建议

- 🎯 **提高字段覆盖率**: 当前覆盖率较低，建议检查前端是否完整实现了CSV中定义的字段显示
- 📝 **补充前端实现**: 有 12 个CSV定义的字段未在前端使用，需要确认是否需要实现
- 📋 **完善CSV定义**: 有 185 个前端使用的字段未在CSV中定义，建议添加到标准化字段中

## 📄 耗材页面 详细分析

### ✅ 已匹配字段

| 前端字段 | CSV字段 | 标准Key | 匹配类型 | 匹配分数 |
|----------|---------|---------|----------|----------|
| brand | 品牌 | Brand | 🎯 english | 0.90 |
| id | productId | productid | ✅ contains | 0.80 |
| item | 名称(英文)新增需求 | Item | 🎯 english | 0.90 |
| material | 材质 | Material | 🎯 english | 0.90 |
| model | 型号（公制） | Model | 🎯 english | 0.90 |
| net_weight_kg | 单件净重kg | Net Weight(kg) | 🎯 english | 0.90 |
| spec | Spec. | Spec. | ✅ contains | 0.80 |
| ui.noProductId | productId | productid | ✅ contains | 0.80 |
| ui.productId | productId | productid | ✅ contains | 0.80 |
| 包装方式 | 包装方式 | 包装方式 | 🎯 exact | 1.00 |
| 厚度 | 厚度/克重um/gsm | 厚度/克重um/gsm | ✅ contains | 0.80 |
| 品牌 | 品牌 | Brand | 🎯 exact | 1.00 |
| 型号 | 型号（公制） | Model | ✅ contains | 0.80 |
| 总长 | 总长m | 总长m | ✅ contains | 0.80 |
| 料号 | 料号 | Part No. | 🎯 exact | 1.00 |
| 材质 | 材质 | Material | 🎯 exact | 1.00 |

### ❌ CSV中定义但前端未使用的字段

| CSV字段 | 标准Key | 中文名 | 英文名 | 显示场景 |
|---------|---------|--------|--------|----------|
| 适用机型 | Applicable Machine | 适用机型 | Applicable Machine | 商品列表, 购物车 |
| 形状 | 形状 | 形状 | 形状 | 商品列表 |
| 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 产品图片袋型实物 | 商品列表, 购物车 |
| 型号(英制) | Model | 型号 | Model | 商品列表, 购物车, PO页 |
| Spec.(英制) | Spec. | 规格描述 | Spec. | 商品列表, 购物车, PO页 |
| 泡径cm | Bubble Dia. | 泡径 | Bubble Dia. | 商品列表, 购物车 |
| 泡径inch | Bubble Dia. | 泡径 | Bubble Dia. | 商品列表, 购物车 |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 商品列表, 购物车 |
| 厚度/克重mil/# | 厚度/克重mil/# | 厚度/克重mil/# | 厚度/克重mil/# | tooltip |
| 膜宽cm | 膜宽cm | 膜宽cm | 膜宽cm | tooltip |
| 膜宽inch | 膜宽inch | 膜宽inch | 膜宽inch | tooltip |
| 袋长cm | 袋长cm | 袋长cm | 袋长cm | tooltip |
| 袋长inch | 袋长inch | 袋长inch | 袋长inch | tooltip |
| 总长ft | 总长ft | 总长ft | 总长ft | tooltip |
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | tooltip |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | tooltip |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | tooltip |
| 包装实物图片 | 包装实物图片 | 包装实物图片 | 包装实物图片 | tooltip |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | tooltip |
| 一托卷数A | 一托卷数a | 一托卷数A | 一托卷数A | tooltip |
| 整托毛重Akg | 整托毛重akg | 整托毛重Akg | 整托毛重Akg | tooltip |
| 整托毛重Albs | 整托毛重albs | 整托毛重Albs | 整托毛重Albs | tooltip |
| 打托高度Acm | 打托高度acm | 打托高度Acm | 打托高度Acm | tooltip |
| 打托高度Ainch | 打托高度ainch | 打托高度Ainch | 打托高度Ainch | tooltip |
| 一托卷数B | 一托卷数b | 一托卷数B | 一托卷数B | tooltip |
| 整盘毛重kg | 整盘毛重kg | 整盘毛重kg | 整盘毛重kg | tooltip |
| 整盘毛重Blbs | 整盘毛重blbs | 整盘毛重Blbs | 整盘毛重Blbs | tooltip |
| 打托高度cm | 打托高度cm | 打托高度cm | 打托高度cm | tooltip |
| 打托高度Binch | 打托高度binch | 打托高度Binch | 打托高度Binch | tooltip |
| 一托卷数C | 一托卷数c | 一托卷数C | 一托卷数C | tooltip |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | 整托毛重kg | tooltip |
| 整托毛重Clbs | 整托毛重clbs | 整托毛重Clbs | 整托毛重Clbs | tooltip |
| 打托高度Ccm | 打托高度ccm | 打托高度Ccm | 打托高度Ccm | tooltip |
| 打托高度Cinch | 打托高度cinch | 打托高度Cinch | 打托高度Cinch | tooltip |
| 纸筒内径cm | 纸筒内径cm | 纸筒内径cm | 纸筒内径cm | tooltip |
| 纸筒内径inch | 纸筒内径inch | 纸筒内径inch | 纸筒内径inch | tooltip |

### ⚠️ 前端使用但CSV未定义的字段

- `apiUrl`
- `app_model`
- `baseUrl`
- `bubbleDiameter`
- `bubble_diameter_met`
- `button.cart`
- `cart.added`
- `cartButtonRef`
- `closeDetailModal`
- `code`
- `common.no`
- `common.toBeFilled`
- `common.yes`
- `currentDimensionImage`
- `currentPage`
- `debugInfo`
- `detailModalVisible`
- `disabled`
- `error`
- `error.productNotFound`
- `error.retry`
- `error.title`
- `filter.all`
- `filter.length`
- `filter.material`
- `filter.model`
- `filter.shape`
- `filter.thickness`
- `filter.width`
- `filterType`
- `handleImageError`
- `handleLengthChange`
- `handleModelChange`
- `handleRemoveFilter`
- `handleResetFilters`
- `handleSmartResetFilters`
- `handleWidthChange`
- `idx`
- `image_url`
- `inventory`
- `itemLength`
- `itemThickness`
- `itemWeight`
- `itemWidth`
- `lengthCm`
- `lengthInch`
- `length_met`
- `loading.description`
- `name_zh`
- `onChange`
- `onClearAll`
- `page`
- `part_number`
- `pcsPerBox`
- `placeholder`
- `prev`
- `pricing`
- `product.code`
- `product.id`
- `product.model`
- `product.name`
- `product.part_number`
- `region`
- `rollLength`
- `rollLengthFt`
- `rollLengthM`
- `selectedLength`
- `selectedMaterial`
- `selectedModel`
- `selectedShape`
- `selectedThickness`
- `selectedWeight`
- `selectedWidth`
- `shape`
- `specs`
- `specs.brand`
- `specs.bubble_diameter_inch`
- `specs.bubble_diameter_met`
- `specs.length`
- `specs.length_imperial`
- `specs.material`
- `specs.model`
- `specs.model_imperial`
- `specs.net_weight_kg`
- `specs.net_weight_lbs`
- `specs.package_gross_weight_kg`
- `specs.package_gross_weight_lbs`
- `specs.package_image_url`
- `specs.package_size_cm`
- `specs.package_size_inch`
- `specs.package_type`
- `specs.pallet_gross_weight_a_kg`
- `specs.pallet_gross_weight_a_lbs`
- `specs.pallet_gross_weight_b_kg`
- `specs.pallet_gross_weight_b_lbs`
- `specs.pallet_gross_weight_c_kg`
- `specs.pallet_gross_weight_c_lbs`
- `specs.pallet_height_a_cm`
- `specs.pallet_height_a_inch`
- `specs.pallet_height_b_cm`
- `specs.pallet_height_b_inch`
- `specs.pallet_height_c_cm`
- `specs.pallet_height_c_inch`
- `specs.pallet_size_cm`
- `specs.part_number`
- `specs.pcs_per_box`
- `specs.pcs_per_pallet_a`
- `specs.pcs_per_pallet_b`
- `specs.pcs_per_pallet_c`
- `specs.rollLength`
- `specs.rollLength_imperial`
- `specs.shape`
- `specs.spec`
- `specs.spec_imperial`
- `specs.thickness`
- `specs.tube_inner_diameter_cm`
- `specs.tube_inner_diameter_inch`
- `specs.width`
- `specs.width_imperial`
- `stockBg`
- `stockColor`
- `targetLength`
- `targetThickness`
- `targetWeight`
- `targetWidth`
- `thickness`
- `thickness_met`
- `title`
- `toggleCartModal`
- `token`
- `tooltip.apiError`
- `tooltip.basicSpecs`
- `tooltip.brand`
- `tooltip.cartonPack`
- `tooltip.cleanedUrl`
- `tooltip.clickToExpand`
- `tooltip.configA`
- `tooltip.configB`
- `tooltip.configC`
- `tooltip.debugInfo`
- `tooltip.detailInfo`
- `tooltip.hoverInfo`
- `tooltip.imageUrl`
- `tooltip.model`
- `tooltip.noPackageImage`
- `tooltip.originalUrl`
- `tooltip.packageImage`
- `tooltip.packageImageDebug`
- `tooltip.packageInfo`
- `tooltip.packagingMethod`
- `tooltip.palletInfo`
- `tooltip.palletRolls`
- `tooltip.palletSize`
- `tooltip.partNumber`
- `tooltip.pcs`
- `tooltip.pcsPerBox`
- `tooltip.productInfo`
- `tooltip.safeGetResult`
- `tooltip.showImage`
- `tooltip.spec`
- `totalItems`
- `totalPages`
- `totalStock`
- `true`
- `ui.activeFilters`
- `ui.addToCart`
- `ui.addToCartFailed`
- `ui.addedToCart`
- `ui.allMaterials`
- `ui.authExpired`
- `ui.buyNow`
- `ui.clearAll`
- `ui.close`
- `ui.compatibleModel`
- `ui.dataLoadFailed`
- `ui.detailInfo`
- `ui.deviceModelTooltip`
- `ui.dimensionGuide`
- `ui.dimensionGuideAlt`
- `ui.invalidRequest`
- `ui.loadingDetails`
- `ui.loadingProductData`
- `ui.lowStockWarning`
- `ui.lowWarning`
- `ui.materialAndSpecs`
- `ui.materialType`
- `ui.minimumOrder`
- `ui.moreSteps`
- `ui.nextPage`
- `ui.noMatchingProducts`
- `ui.noProductsFound`
- `ui.outIcon`
- `ui.pageInfo`
- `ui.partNumberMissing`
- `ui.previousPage`
- `ui.priceInquiry`
- `ui.priceSteps`
- `ui.productDetail`
- `ui.productShapeTooltip`
- `ui.productSpecs`
- `ui.reload`
- `ui.resetFilterConditions`
- `ui.resetFilters`
- `ui.selectDeviceModel`
- `ui.selectDeviceModelPlaceholder`
- `ui.selectLength`
- `ui.selectProductShape`
- `ui.selectThickness`
- `ui.selectWeight`
- `ui.selectWidth`
- `ui.smartFilter`
- `ui.smartFilterDescription`
- `ui.startingPrice`
- `ui.stockStatus`
- `ui.sufficient`
- `ui.thickness`
- `ui.totalProducts`
- `ui.totalStock`
- `ui.viewDetailedSpecs`
- `ui.weight`
- `unit`
- `userRegion`
- `warning.selectQuantity`
- `widthCm`
- `widthInch`
- `width_met`
- `规格`

### 💡 改进建议

- 🎯 **提高字段覆盖率**: 当前覆盖率较低，建议检查前端是否完整实现了CSV中定义的字段显示
- 📝 **补充前端实现**: 有 36 个CSV定义的字段未在前端使用，需要确认是否需要实现
- 📋 **完善CSV定义**: 有 227 个前端使用的字段未在CSV中定义，建议添加到标准化字段中

## 📄 备件页面 详细分析

### ✅ 已匹配字段

| 前端字段 | CSV字段 | 标准Key | 匹配类型 | 匹配分数 |
|----------|---------|---------|----------|----------|
| net_weight_kg | 单件净重kg | Net Weight(kg) | 🎯 english | 0.90 |
| package_size_cm | 包装尺寸cm | Package Size(cm) | 🎯 english | 0.90 |
| spec | Spec. | Spec. | ✅ contains | 0.80 |
| unit | Unit | unit | 🎯 exact | 1.00 |
| 料号 | 料号 | Part No. | 🎯 exact | 1.00 |
| 易损 | 是否易损 | Consumable Status | ✅ contains | 0.80 |
| 适配机型 | 适配机型 | 适配机型 | 🎯 exact | 1.00 |

### ❌ CSV中定义但前端未使用的字段

| CSV字段 | 标准Key | 中文名 | 英文名 | 显示场景 |
|---------|---------|--------|--------|----------|
| 产品图片 | 产品图片 | 产品图片 | 产品图片 | 商品列表, 购物车 |
| 名称(英文) | Item | 名称 | Item | 商品列表, 购物车, PO页 |
| 适配序列号 | Applicable SN. | 适配序列号 | Applicable SN. | 商品列表, 购物车 |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 商品列表, 购物车 |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | 购物车, tooltip |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | 购物车, tooltip |
| Spec.(英制) | Spec. | 规格描述 | Spec. | PO页 |

### ⚠️ 前端使用但CSV未定义的字段

- `actions.addToCart`
- `app_model`
- `app_sn`
- `baseUrl`
- `beforeCount`
- `cart.addedToCart`
- `cart.cancel`
- `cart.cartCleared`
- `cart.checkout`
- `cart.clear`
- `cart.confirmClear`
- `cart.confirmClearMessage`
- `cart.confirmClearTitle`
- `cart.empty`
- `cart.sku`
- `cart.title`
- `cart.total`
- `category`
- `cn`
- `code`
- `currentLanguage`
- `currentProductType`
- `currentToken`
- `defaultValues.contactService`
- `defaultValues.contactServiceSpecs`
- `defaultValues.defaultPartName`
- `defaultValues.universal`
- `defaultValues.unknown`
- `defaultValues.unknownError`
- `details.title`
- `duration`
- `error`
- `error.addToCartFailed`
- `error.apiConnectionFailed`
- `error.authenticationFailed`
- `error.failedRequiredParts`
- `error.loadFilterOptionsFailed`
- `error.loadingData`
- `error.loadingDataGeneral`
- `error.noResults`
- `error.parameterError`
- `error.partNumberMissing`
- `error.partialRequiredParts`
- `error.requiredPartsInfo`
- `error.requiredPartsProcessing`
- `error.retry`
- `error.tryAgain`
- `errorMessage`
- `fields.compatibleSerialNumber`
- `fields.pcsPerBox`
- `fields.productId`
- `fields.specifications`
- `filters.allModels`
- `filters.allProductTypes`
- `filters.allTypes`
- `filters.consumable`
- `filters.nonConsumable`
- `filters.reset`
- `filters.title`
- `firstModel`
- `handleConfirmClearCart`
- `handleImageError`
- `handleTooltipMouseEnter`
- `handleTooltipMouseLeave`
- `id`
- `idOrPartNumber`
- `image`
- `image_url`
- `inventory.highStock`
- `inventory.inStock`
- `inventory.lowStock`
- `inventory.noInfo`
- `inventory.outOfStock`
- `inventory.regions`
- `isMatch`
- `is_consumable`
- `loading.text`
- `maxRetries`
- `model`
- `moreInfo.specsDetail`
- `na`
- `name_en`
- `name_zh`
- `net_weight_lbs`
- `package_size_inch`
- `page`
- `pagination.next`
- `pagination.previous`
- `partNumber`
- `part_number`
- `pcs_per_box`
- `price`
- `priceTiers`
- `prices`
- `pricing.tiers`
- `productTypes.accessory`
- `productTypes.machine`
- `product_type`
- `properties`
- `quantity`
- `rangeText`
- `region`
- `required_parts`
- `required_quantity`
- `roles.admin`
- `roles.customer`
- `roles.guest`
- `roles.partner`
- `roles.sales`
- `selectedIsConsumable`
- `selectedModel`
- `selectedSparePartForTooltip`
- `showTooltip`
- `spec_imperial`
- `specs.compatibleModels`
- `specs.pcsPerBox`
- `specs.spec`
- `success.addedToCart`
- `success.addedToCartWithRequired`
- `success.requiredPartsAdded`
- `tierIndex`
- `token`
- `tooltipPos`
- `true`
- `userRole`

### 💡 改进建议

- 🎯 **提高字段覆盖率**: 当前覆盖率较低，建议检查前端是否完整实现了CSV中定义的字段显示
- 📝 **补充前端实现**: 有 7 个CSV定义的字段未在前端使用，需要确认是否需要实现
- 📋 **完善CSV定义**: 有 125 个前端使用的字段未在CSV中定义，建议添加到标准化字段中

## 📄 配件页面 详细分析

### ✅ 已匹配字段

| 前端字段 | CSV字段 | 标准Key | 匹配类型 | 匹配分数 |
|----------|---------|---------|----------|----------|
| model | 型号 | Model | 🎯 english | 0.90 |

### ❌ CSV中定义但前端未使用的字段

| CSV字段 | 标准Key | 中文名 | 英文名 | 显示场景 |
|---------|---------|--------|--------|----------|
| 产品图片 | 产品图片 | 产品图片 | 产品图片 | 商品列表, 购物车 |
| 料号 | Part No. | 料号 | Part No. | 商品列表, 购物车, PO页 |
| 产品名称 | 产品名称 | 产品名称 | 产品名称 | 商品列表, 购物车, PO页 |
| 电压V | Voltage | 电压 | Voltage | 商品列表, 购物车 |
| 频率Hz | Frequency | 频率 | Frequency | 商品列表, 购物车 |
| 单箱数量 | Qty per Carton | 单箱数量 | Qty per Carton | 商品列表, 购物车 |
| 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 托盘尺寸cm | 商品列表 |
| 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 托盘尺寸inch | 商品列表 |
| 一托数量 | Packs per Pallet | 一托数量 | Packs per Pallet | 商品列表 |
| 包装尺寸cm | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | tooltip |
| 包装尺寸inch | Package Size(cm) | 包装尺寸(cm) | Package Size(cm) | tooltip |
| 单件净重kg | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | tooltip |
| 单件净重lbs | Net Weight(kg) | 单件净重(kg) | Net Weight(kg) | tooltip |
| 打托高度cm | 打托高度cm | 打托高度cm | 打托高度cm | tooltip |
| 打托高度inch | 打托高度inch | 打托高度inch | 打托高度inch | tooltip |
| 整托毛重kg | 整托毛重kg | 整托毛重kg | 整托毛重kg | tooltip |
| 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | 整托毛重lbs | tooltip |
| 品牌 | Brand | 品牌 | Brand | PO页 |
| Spec. | Spec. | 规格描述 | Spec. | PO页 |
| Spec.(英制) | Spec. | 规格描述 | Spec. | PO页 |

### ⚠️ 前端使用但CSV未定义的字段

- `action`
- `code`
- `columns`
- `filteredAccessories`
- `handleModelChange`
- `handleSearch`
- `handleTypeChange`
- `image`
- `image_url`
- `inventory`
- `loading`
- `name_en`
- `required_parts`
- `searchText`
- `selectedModel`
- `selectedType`
- `total`
- `url`

### 💡 改进建议

- 🎯 **提高字段覆盖率**: 当前覆盖率较低，建议检查前端是否完整实现了CSV中定义的字段显示
- 📝 **补充前端实现**: 有 20 个CSV定义的字段未在前端使用，需要确认是否需要实现
- 📋 **完善CSV定义**: 有 18 个前端使用的字段未在CSV中定义，建议添加到标准化字段中
