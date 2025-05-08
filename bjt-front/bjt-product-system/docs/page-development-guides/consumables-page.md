# 耗材管理页面开发指南

## 1. 页面基本信息

- **页面名称**: 耗材管理
- **页面路径**: templates/admin/consumables/list.php
- **对应 Mockup**: 耗材管理页面 (10.html)
- **优先级**: P1 (重要功能，应当实现)
- **相关子页面**:
  - **新增/编辑耗材页面**: `consumables/edit.php` (对应 Mockup: 11.html)
    - 功能: 创建或编辑耗材信息，包含基础信息、规格参数和适用主机选择
  - **新增/编辑形状页面**: `consumables/shape-edit.php` (基于10.html的形状表部分)
    - 功能: 管理耗材形状数据，包含代码、名称和图片上传
  - **新增/编辑材料页面**: `consumables/material-edit.php` (基于10.html的材料表部分)
    - 功能: 管理耗材材料数据，包含代码、名称和基材选择

## 2. 数据关系

### 2.1 数据表关联
- **主表**: `wp_bjt_consumables` (耗材主表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `model`: varchar(100) - 型号
    - `model_imperial`: varchar(100) - 型号(英制)
    - `part_number`: varchar(100) - 料号
    - `spec`: varchar(255) - 规格参数(公制)
    - `spec_imperial`: varchar(255) - 规格参数(英制)
    - `brand`: varchar(100) - 品牌
    - `app_model`: varchar(255) - 适用机型
    - `bag_type`: varchar(100) - 袋型
    - `material`: varchar(100) - 材质
    - `thickness_met`: decimal(10,2) - 厚度/克重(um/gsm)
    - `thickness_imp`: decimal(10,2) - 厚度/克重(mil/#)
    - `width_met`: decimal(10,2) - 膜宽(cm)
    - `width_imp`: decimal(10,2) - 膜宽(inch)
    - `length_met`: decimal(10,2) - 袋长(cm)
    - `length_imp`: decimal(10,2) - 袋长(inch)
    - `bubble_diameter_met`: decimal(10,2) - 泡径(cm)
    - `bubble_diameter_imp`: decimal(10,2) - 泡径(inch)
    - `total_length_met`: decimal(10,2) - 总长(m)
    - `total_length_imp`: decimal(10,2) - 总长(ft)
    - `package_type`: varchar(100) - 包装方式
    - `package_size_cm`: varchar(100) - 包装尺寸(cm)
    - `package_size_inch`: varchar(100) - 包装尺寸(inch)
    - `net_weight_kg`: decimal(10,2) - 单件净重(kg)
    - `net_weight_lbs`: decimal(10,2) - 单件净重(lbs)
    - `gross_weight_kg`: decimal(10,2) - 包装毛重(kg)
    - `gross_weight_lbs`: decimal(10,2) - 包装毛重(lbs)
    - `pcs_per_box`: int(11) - 单箱数量
    - `image_url`: varchar(255) - 产品图片(袋型实物)
    - `package_image_url`: varchar(255) - 包装实物图片
    - `pallet_size_cm`: varchar(100) - 托盘尺寸(cm)
    - `pallet_size_inch`: varchar(100) - 托盘尺寸(inch)
    - `pcs_per_pallet_a`: int(11) - 一托卷数A
    - `pallet_gross_weight_a_kg`: decimal(10,2) - 整托毛重A(kg)
    - `pallet_gross_weight_a_lbs`: decimal(10,2) - 整托毛重A(lbs)
    - `pallet_height_a_cm`: decimal(10,2) - 打托高度A(cm)
    - `pallet_height_a_inch`: decimal(10,2) - 打托高度A(inch)
    - `pcs_per_pallet_b`: int(11) - 一托卷数B
    - `pallet_gross_weight_b_kg`: decimal(10,2) - 整托毛重B(kg)
    - `pallet_gross_weight_b_lbs`: decimal(10,2) - 整托毛重B(lbs)
    - `pallet_height_b_cm`: decimal(10,2) - 打托高度B(cm)
    - `pallet_height_b_inch`: decimal(10,2) - 打托高度B(inch)
    - `pcs_per_pallet_c`: int(11) - 一托卷数C
    - `pallet_gross_weight_c_kg`: decimal(10,2) - 整托毛重C(kg)
    - `pallet_gross_weight_c_lbs`: decimal(10,2) - 整托毛重C(lbs)
    - `pallet_height_c_cm`: decimal(10,2) - 打托高度C(cm)
    - `pallet_height_c_inch`: decimal(10,2) - 打托高度C(inch)
    - `tube_inner_diameter_cm`: decimal(10,2) - 纸筒内径(cm)
    - `tube_inner_diameter_inch`: decimal(10,2) - 纸筒内径(inch)
    - `status`: varchar(20) - 状态，默认值'publish'
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **形状表**: `wp_bjt_shapes` (耗材形状表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `code`: varchar(50) - 形状缩写代码
    - `name_cn`: varchar(100) - 中文名称
    - `name_en`: varchar(100) - 英文名称
    - `image_url`: varchar(255) - 形状图片URL
    - `status`: varchar(20) - 状态，默认值'publish'
    - `menu_order`: int(11) - 排序顺序
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **材料表**: `wp_bjt_materials` (耗材材料表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `code`: varchar(50) - 材料缩写代码
    - `name_cn`: varchar(100) - 中文名称
    - `name_en`: varchar(100) - 英文名称
    - `base_material`: varchar(100) - 基材
    - `status`: varchar(20) - 状态，默认值'publish'
    - `menu_order`: int(11) - 排序顺序
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **规格表**: `wp_bjt_specifications` (规格尺寸表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `spec_type`: ENUM('thickness', 'weight', 'width', 'length') - 规格类型
    - `metric_value`: decimal(10,2) - 公制数值
    - `metric_unit`: varchar(20) - 公制单位
    - `imperial_value`: decimal(10,2) - 英制数值
    - `imperial_unit`: varchar(20) - 英制单位
    - `status`: varchar(20) - 状态，默认值'publish'
    - `menu_order`: int(11) - 排序顺序
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **适配表**: `wp_bjt_consumable_compatibility` (耗材主机适配表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `consumable_part_number`: varchar(100) - 耗材料号
    - `host_model`: varchar(100) - 适用主机型号
    - `status`: varchar(20) - 状态，默认值'publish'
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

### 2.2 API 接口
- `GET /wp-json/bjt/v1/consumables`: 获取耗材列表
- `DELETE /wp-json/bjt/v1/consumables/{id}`: 删除耗材
- `GET /wp-json/bjt/v1/shapes`: 获取形状列表
- `DELETE /wp-json/bjt/v1/shapes/{id}`: 删除形状
- `GET /wp-json/bjt/v1/materials`: 获取材料列表
- `DELETE /wp-json/bjt/v1/materials/{id}`: 删除材料
- `GET /wp-json/bjt/v1/specifications`: 获取规格列表
- `DELETE /wp-json/bjt/v1/specifications/{id}`: 删除规格

### 2.3 字段验证规则
- `product_line`: 必填，有效的产品线标识
- `model`: 必填，唯一值，长度不超过100个字符
- `part_number`: 必填，唯一值，长度不超过100个字符
- `spec`, `spec_imperial`: 可选，长度不超过255个字符
- 形状代码: 必填，唯一值，长度不超过50个字符
- 材料代码: 必填，唯一值，长度不超过50个字符
- 规格值: 必填，数值型，需要同时包含公制和英制单位

## 3. 页面结构

### 3.1 必须实现的组件
以下组件必须完整实现，与 Mockup 设计保持一致:

- [ ] **页面标题区域**: 显示"耗材管理"标题
- [ ] **料号表区域**:
  - [ ] 筛选功能（规格、料号）
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
  - [ ] 操作列（编辑、删除）
  - [ ] "新增耗材"按钮
- [ ] **形状表区域**:
  - [ ] 编号列
  - [ ] 缩写列
  - [ ] 名称列
  - [ ] 图片列
  - [ ] 操作列（编辑、删除）
  - [ ] "新增形状"按钮
- [ ] **材料表区域**:
  - [ ] 编号列
  - [ ] 缩写列
  - [ ] 名称列
  - [ ] 基材列
  - [ ] 操作列（编辑、删除）
  - [ ] "新增材料"按钮
- [ ] **规格尺寸表区域**:
  - [ ] 编号列
  - [ ] 公制数值列
  - [ ] 英制数值列
  - [ ] 操作列（编辑、删除）

### 3.2 页面布局要求
```
+------------------------------------------+
|                页头区域                   |
+--------+--------------------------------+
|        |                               |
|        |     料号表区域                 |
|        |                               |
|侧边栏   +-------------------------------+
|        |                               |
|        |     形状表区域                 |
|        |                               |
|        +-------------------------------+
|        |                               |
|        |     材料表区域                 |
|        |                               |
|        +-------------------------------+
|        |                               |
|        |     规格尺寸表区域             |
|        |                               |
+--------+--------------------------------+
```

## 4. 实现标准

### 4.1 HTML结构规范
- 使用语义化HTML5标签
- 遵循BEM命名规范
- 确保表单元素的可访问性
- 使用适当的ARIA属性
- 确保表格结构的语义正确性

### 4.2 CSS样式规范
- 使用BEM命名约定
- 实现响应式布局
- 使用CSS变量定义主题颜色
- 确保表格在各种屏幕尺寸下的可用性
- 实现合适的加载状态样式

### 4.3 JavaScript交互规范
- 使用事件委托处理表格操作
- 实现异步数据加载
- 实现数据筛选功能
- 实现删除确认功能
- 实现表单验证

### 4.4 PHP处理规范
- 确保所有用户输入得到适当验证和清理
- 实现适当的错误处理
- 使用事务确保数据完整性
- 实现合适的缓存机制
- 确保安全的文件上传处理

## 5. 验收标准

### 5.1 功能验收标准
- [ ] 料号表能够正确显示和管理耗材数据
- [ ] 形状表能够正确显示和管理形状数据
- [ ] 材料表能够正确显示和管理材料数据
- [ ] 规格表能够正确显示和管理规格数据
- [ ] 所有增删改查功能正常工作
- [ ] 筛选功能正确工作
- [ ] 图片上传功能正常工作

### 5.2 视觉一致性标准
- [ ] 页面布局与Mockup设计完全一致
- [ ] 表格样式统一且美观
- [ ] 按钮和图标的样式统一
- [ ] 响应式布局正确实现
- [ ] 加载状态和错误提示样式合适

### 5.3 代码质量标准
- [ ] 代码结构清晰，功能模块化
- [ ] 代码注释完整
- [ ] 遵循编码规范
- [ ] 实现适当的错误处理
- [ ] 确保代码的可维护性

### 5.4 性能标准
- [ ] 页面加载时间控制在合理范围
- [ ] 数据加载采用分页机制
- [ ] 图片资源优化
- [ ] 实现适当的缓存策略
- [ ] 确保大数据量下的性能表现

## 6. 开发流程

### 6.1 开发前准备
1. 确认数据库表结构
2. 准备测试数据
3. 确认API接口实现
4. 审查设计稿细节

### 6.2 开发步骤
1. 实现基础页面结构
2. 实现料号表功能
3. 实现形状表功能
4. 实现材料表功能
5. 实现规格表功能
6. 实现筛选功能
7. 完善错误处理
8. 优化性能

### 6.3 测试要点
1. 功能完整性测试
2. 数据验证测试
3. 性能测试
4. 兼容性测试
5. 用户体验测试

## 7. 常见问题与最佳实践

### 7.1 避免常见问题
- 数据一致性问题
- 性能瓶颈
- 用户体验问题
- 安全隐患

### 7.2 最佳实践建议
- 实现合理的缓存策略
- 采用适当的数据结构
- 确保代码可维护性
- 实现完善的错误处理
- 注重用户体验设计 