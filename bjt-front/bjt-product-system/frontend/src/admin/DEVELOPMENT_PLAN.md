# BJT产品管理系统后台管理界面 - 开发完善计划

## 1. 项目目标与规范

### 1.1 核心目标
- **严格按mockup 1:1复现**：每个页面的布局、交互和功能必须与设计稿完全一致
- **API完整对接**：使用`/wp-json/bjt/v1/`路径下的14个API模块
- **数据表全覆盖**：对接15个数据表，确保所有字段都能管理
- **多语言支持**：实现中英文界面和内容的完整切换
- **响应式设计**：桌面优先，移动端适配

### 1.2 技术规范
- **前端技术栈**：React 18 + TypeScript + Ant Design + Tailwind CSS
- **架构模式**：独立模块集成方式，共享前端基础设施
- **API规范**：RESTful API，标准化响应格式`ApiResponse<T>`
- **代码标准**：TypeScript严格模式，组件化开发

## 2. 当前进展评估

### 2.1 ✅ 已完成基础设施 (95%)

**API层实现：**
```typescript
✅ httpAdminService.ts (143行) - HTTP服务层
✅ adminConfig.ts (54行) - 配置和端点管理
✅ adminService.ts (232行) - 业务逻辑层
✅ 14个API端点完整配置
✅ 标准化错误处理和认证
```

**基础组件：**
```typescript
✅ AdminTable.tsx (83行) - 管理表格
✅ AdminPageHeader.tsx (62行) - 页面标题
✅ ImportExportButtons.tsx (79行) - 导入导出按钮
✅ 基础布局组件
```

### 2.2 🔶 部分完成功能 (30%)

**主机管理页面：**
```typescript
✅ MachinesPage.tsx (762行) - 双表格布局基本完成
  ✅ 主机型号管理表格
  ✅ 料号管理表格
  ✅ 基础CRUD操作
  ❌ 多语言输入支持
  ❌ 文件上传功能
  ❌ CRM数据集成

🔶 MachineEditPage.tsx (252行) - 部分实现
  🔶 基础表单结构
  ❌ 双语输入字段
  ❌ 媒体上传功能
```

**其他页面状态：**
```
pages/
├── machines/ ✅ 基本完成
├── product-lines/ 🔶 目录存在，实现度未知
├── parts/ 🔶 目录存在，实现度未知
├── relations/ 🔶 目录存在，实现度未知
├── accessories/ 🔶 目录存在，实现度未知
├── consumables/ 🔶 目录存在，实现度未知
├── spare-parts/ 🔶 目录存在，实现度未知
├── users/ 🔶 目录存在，实现度未知
└── settings/ 🔶 目录存在，实现度未知
```

### 2.3 ❌ 关键缺失组件 (0%)

**核心组件：**
```typescript
❌ MultilingualInput.tsx - 多语言输入组件
❌ FileUploader.tsx - 文件上传组件
❌ CRMDataFetcher.tsx - CRM数据集成组件
❌ BatchOperationPanel.tsx - 批量操作面板
❌ RelationTreeView.tsx - 5级关联关系树
❌ SpecificationManager.tsx - 规格尺寸管理
```

## 3. 开发实施计划

### 3.1 阶段一：核心组件开发 (3天)

#### 3.1.1 Day 1: 多语言输入组件
**目标：** 实现完整的多语言输入支持

**具体任务：**
```typescript
// 创建 MultilingualInput.tsx
interface MultilingualInputProps {
  value: { zh: string; en: string };
  onChange: (value: { zh: string; en: string }) => void;
  placeholder?: { zh: string; en: string };
  required?: boolean;
  type?: 'input' | 'textarea' | 'richtext';
}

// 创建 MultilingualForm.tsx - 包含语言切换选项卡
interface MultilingualFormProps {
  children: React.ReactNode;
  currentLang: 'zh' | 'en';
  onLangChange: (lang: 'zh' | 'en') => void;
}
```

**验收标准：**
- 支持文本输入、多行文本和富文本编辑
- 选项卡切换流畅，数据不丢失
- 表单验证支持多语言
- 与Ant Design主题一致

#### 3.1.2 Day 2: 文件上传组件
**目标：** 实现完整的文件上传功能

**具体任务：**
```typescript
// 创建 FileUploader.tsx
interface FileUploaderProps {
  type: 'image' | 'pdf' | 'document';
  multiple?: boolean;
  maxSize?: number; // MB
  accept?: string;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  preview?: boolean;
}

// 创建 MediaGallery.tsx - 媒体库管理
interface MediaGalleryProps {
  type: 'image' | 'pdf' | 'document';
  onSelect: (url: string) => void;
  multiple?: boolean;
}
```

**验收标准：**
- 支持拖拽上传
- 实时预览功能
- 进度条显示
- 文件类型和大小验证
- 与WordPress媒体库集成

#### 3.1.3 Day 3: CRM数据集成组件
**目标：** 实现CRM数据自动填充功能

**具体任务：**
```typescript
// 创建 CRMDataFetcher.tsx
interface CRMDataFetcherProps {
  partNumber: string;
  onDataFetched: (data: CRMPartData) => void;
  onError: (error: string) => void;
  fields: string[]; // 需要获取的字段列表
}

// 创建 AutoFillPartForm.tsx - 料号自动填充表单
interface AutoFillPartFormProps {
  form: FormInstance;
  partNumberField: string;
  autoFillFields: string[];
}
```

**验收标准：**
- 输入料号后自动调用CRM API
- 成功获取数据后自动填充表单
- 错误处理和用户提示
- 支持手动修改自动填充的数据

### 3.2 阶段二：页面实现 (8天)

#### 3.2.1 Day 4-5: 产品线管理页面
**目标：** 实现完整的产品线编辑功能 (对应mockup 1.html)

**具体任务：**
```typescript
// 完善 ProductLinesPage.tsx - 严格对应wp_bjt_product_lines表和API
interface ProductLineFormData {
  id?: number;
  code: string;                    // 产品线代码 - 必填
  title_zh: string;               // 中文标题 - 必填
  title_en: string;               // 英文标题 - 必填
  description_zh: string;         // 中文描述
  description_en: string;         // 英文描述
  subitem1_zh: string;           // 子项1中文 (耗材)
  subitem1_en: string;           // 子项1英文
  subitem2_zh: string;           // 子项2中文 (备件)
  subitem2_en: string;           // 子项2英文
  subitem3_zh?: string;          // 子项3中文 (可选)
  subitem3_en?: string;          // 子项3英文 (可选)
  image_url: string;             // 图片URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// API对接 - 完整CRUD操作
- GET /wp-json/bjt/v1/product-lines
- POST /wp-json/bjt/v1/product-lines
- PUT /wp-json/bjt/v1/product-lines/{id}
- DELETE /wp-json/bjt/v1/product-lines/{id}
```

**验收标准：**
- 包含wp_bjt_product_lines表所有字段
- 双语切换选项卡完整实现
- 图片上传功能正常
- 产品线代码唯一性验证
- 与mockup 1.html 视觉完全一致

#### 3.2.2 Day 6: 主机型号和料号管理页面增强
**目标：** 完善主机型号和主机料号管理 (对应mockup 2.html, 3.html, 4.html)

**具体任务：**
```typescript
// 主机型号 - 严格对应wp_bjt_host_models表
interface HostModelFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 主机型号编码 - 必填，同产品线下唯一
  title_zh: string;              // 中文名称 - 必填
  title_en: string;              // 英文名称 - 必填
  description_zh: string;        // 中文描述
  description_en: string;        // 英文描述
  type: string;                  // 主机类型
  image1_url: string;            // 主图URL
  image2_url: string;            // 副图URL
  explosion_diagram_pdf: string; // 爆炸图PDF文件URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 主机料号 - 严格对应wp_bjt_parts表 - 包含完整物流参数
interface HostPartFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 型号 - 必填
  voltage: string;               // 电压
  image_url: string;             // 图片URL
  part_number: string;           // 料号 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  brand: string;                 // 品牌
  
  // 规格参数
  spec: string;                  // 规格参数(公制)
  spec_imperial: string;         // 规格参数(英制)
  
  // 包装信息
  package_size_cm: string;       // 包装尺寸(cm)
  package_size_inch: string;     // 包装尺寸(inch)
  net_weight_kg: number;         // 单件净重(kg)
  net_weight_lbs: number;        // 单件净重(lbs)
  gross_weight_kg: number;       // 包装毛重(kg)
  gross_weight_lbs: number;      // 包装毛重(lbs)
  pcs_per_box: number;          // 单箱数量
  
  // 托盘信息
  pallet_size_cm: string;       // 托盘尺寸(cm)
  pallet_size_inch: string;     // 托盘尺寸(inch)
  pcs_per_pallet: number;       // 一托数量
  pallet_height_cm: number;     // 打托高度(cm)
  pallet_height_inch: number;   // 打托高度(inch)
  pallet_gross_weight_kg: number; // 整托毛重(kg)
  pallet_gross_weight_lbs: number; // 整托毛重(lbs)
  
  status: 'publish' | 'draft' | 'trash'; // 状态
  unit: 'pcs' | 'roll' | 'box'; // 单位
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// API对接
- GET /wp-json/bjt/v1/machines (主机型号)
- GET /wp-json/bjt/v1/parts (主机料号)
- CRM集成: GET /wp-json/bjt/v1/crm/part-data
```

**验收标准：**
- 包含wp_bjt_host_models表所有字段
- 包含wp_bjt_parts表所有字段(完整物流参数)
- CRM数据自动填充功能
- 公英制单位支持和自动转换
- 双表格关联筛选
- 表单验证完整

#### 3.2.3 Day 7: 关联关系管理页面
**目标：** 实现5级配件关联管理 (对应mockup 5.html, 6.html)

**具体任务：**
```typescript
// 关联关系 - 严格对应wp_bjt_relations表 - 更新字段
interface RelationFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  host_part_number: number;       // 主机料号-0级 - 必填 (新增字段)
  part_number: string;           // 自身料号 - 必填
  parent_part_number?: string;   // 父项料号
  child_part_number?: string;    // 子项料号
  child_type: 'accessory' | 'spare_part'; // 子项类型：配件/备件
  level: number;                 // 层级(1-5)，备件固定为1
  quantity: number;              // 子项在父项中的数量
  required_parts?: string;       // 依赖关联料号 (多个用逗号分隔)
  required_quantity?: string;    // 依赖关联料号对应的数量 (多个用逗号分隔)
  sort_order: number;           // 同级排序
  status: 'publish' | 'draft' | 'trash'; // 状态
  created_at?: string;          // 只读
  updated_at?: string;          // 只读
}

// 关系树节点结构
interface RelationNode {
  id: string;
  host_part_number: number;      // 主机料号-0级 (新增)
  part_number: string;
  model: string;
  level: number; // 1-5
  parent_part_number?: string;
  children: RelationNode[];
  quantity: number;
  required_parts?: string;
  required_quantity?: string;
  child_type: 'accessory' | 'spare_part';
}

// API对接
- GET /wp-json/bjt/v1/relations
- GET /wp-json/bjt/v1/relations/hierarchy
- POST /wp-json/bjt/v1/relations
- PUT /wp-json/bjt/v1/relations/{id}
- DELETE /wp-json/bjt/v1/relations/{id}
```

**验收标准：**
- 包含wp_bjt_relations表所有字段(包括新增的host_part_number)
- 最多5级递进显示
- 每级显示归属关系
- 支持配件和备件两种子项类型
- 实时新增删除配件关系
- 依赖关联料号管理
- 主机料号-0级关联管理 (新增功能)
- 与mockup 5.html, 6.html 一致

#### 3.2.4 Day 8: 配件管理页面
**目标：** 实现双表格配件管理 (对应mockup 7.html)

**具体任务：**
```typescript
// 配件型号 - 严格对应wp_bjt_accessory_models表
interface AccessoryModelFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 配件型号编码 - 必填，同产品线下唯一
  title_zh: string;              // 中文名称 - 必填
  title_en: string;              // 英文名称 - 必填
  description_zh: string;        // 中文描述
  description_en: string;        // 英文描述
  type: string;                  // 配件类型
  image1_url: string;            // 主图URL
  image2_url: string;            // 副图URL
  explosion_diagram_pdf: string; // 爆炸图PDF文件URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 配件料号 - 严格对应wp_bjt_accessories表 - 包含完整物流参数
interface AccessoryFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 型号
  brand: string;                 // 品牌
  part_number: string;           // 料号 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  spec: string;                  // 规格参数(公制)
  spec_imperial: string;         // 规格参数(英制)
  voltage: string;               // 电压
  frequency: string;             // 频率
  
  // 包装信息
  package_size_cm: string;       // 包装尺寸(cm)
  package_size_inch: string;     // 包装尺寸(inch)
  net_weight_kg: number;         // 单件净重(kg)
  net_weight_lbs: number;        // 单件净重(lbs)
  gross_weight_kg: number;       // 包装毛重(kg)
  gross_weight_lbs: number;      // 包装毛重(lbs)
  pcs_per_box: number;          // 单箱数量
  
  // 托盘信息
  pallet_size_cm: string;       // 托盘尺寸(cm)
  pallet_size_inch: string;     // 托盘尺寸(inch)
  pcs_per_pallet: number;       // 一托数量
  pallet_height_cm: number;     // 打托高度(cm)
  pallet_height_inch: number;   // 打托高度(inch)
  pallet_gross_weight_kg: number; // 整托毛重(kg)
  pallet_gross_weight_lbs: number; // 整托毛重(lbs)
  
  image_url: string;             // 图片URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  unit: 'pcs' | 'roll' | 'box'; // 单位
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// API对接
- GET /wp-json/bjt/v1/accessory-models
- GET /wp-json/bjt/v1/accessories
- POST/PUT/DELETE for both endpoints
```

**验收标准：**
- 包含wp_bjt_accessory_models表所有字段
- 包含wp_bjt_accessories表所有字段(完整物流参数)
- 双表格布局
- 型号和料号筛选联动
- 导入/导出功能
- 与mockup 7.html 布局一致

#### 3.2.5 Day 9-10: 耗材管理页面
**目标：** 实现四表格耗材管理 (对应mockup 10.html, 11.html)

**具体任务：**
```typescript
// 耗材 - 严格对应wp_bjt_consumables表 - 包含完整字段
interface ConsumableFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 型号 - 必填
  model_imperial: string;         // 型号(英制)
  part_number: string;           // 料号 - 必填，同产品线下唯一
  spec: string;                  // 规格参数(公制)
  spec_imperial: string;         // 规格参数(英制)
  brand: string;                 // 品牌
  app_model: string;             // 适用机型
  bag_type: string;              // 袋型 (对应shapes表的code)
  material: string;              // 材质 (对应materials表的code)
  
  // 厚度/克重
  thickness_met: number;         // 厚度/克重(um/gsm)
  thickness_imp: number;         // 厚度/克重(mil/#)
  
  // 尺寸参数
  width_met: number;             // 膜宽(cm)
  width_imp: number;             // 膜宽(inch)
  length_met: number;            // 袋长(cm)
  length_imp: number;            // 袋长(inch)
  bubble_diameter_met: number;   // 泡径(cm)
  bubble_diameter_imp: number;   // 泡径(inch)
  total_length_met: number;      // 总长(m)
  total_length_imp: number;      // 总长(ft)
  
  // 包装信息
  package_type: string;          // 包装方式
  package_size_cm: string;       // 包装尺寸(cm)
  package_size_inch: string;     // 包装尺寸(inch)
  net_weight_kg: number;         // 单件净重(kg)
  net_weight_lbs: number;        // 单件净重(lbs)
  gross_weight_kg: number;       // 包装毛重(kg)
  gross_weight_lbs: number;      // 包装毛重(lbs)
  pcs_per_box: number;          // 单箱数量
  
  image_url: string;             // 产品图片(袋型实物)
  package_image_url: string;     // 包装实物图片
  
  // 托盘信息A
  pallet_size_cm: string;        // 托盘尺寸(cm)
  pallet_size_inch: string;      // 托盘尺寸(inch)
  pcs_per_pallet_a: number;     // 一托卷数A
  pallet_gross_weight_a_kg: number; // 整托毛重A(kg)
  pallet_gross_weight_a_lbs: number; // 整托毛重A(lbs)
  pallet_height_a_cm: number;   // 打托高度A(cm)
  pallet_height_a_inch: number; // 打托高度A(inch)
  
  // 托盘信息B
  pcs_per_pallet_b: number;     // 一托卷数B
  pallet_gross_weight_b_kg: number; // 整托毛重B(kg)
  pallet_gross_weight_b_lbs: number; // 整托毛重B(lbs)
  pallet_height_b_cm: number;   // 打托高度B(cm)
  pallet_height_b_inch: number; // 打托高度B(inch)
  
  // 托盘信息C
  pcs_per_pallet_c: number;     // 一托卷数C
  pallet_gross_weight_c_kg: number; // 整托毛重C(kg)
  pallet_gross_weight_c_lbs: number; // 整托毛重C(lbs)
  pallet_height_c_cm: number;   // 打托高度C(cm)
  pallet_height_c_inch: number; // 打托高度C(inch)
  
  // 纸筒信息
  tube_inner_diameter_cm: number; // 纸筒内径(cm)
  tube_inner_diameter_inch: number; // 纸筒内径(inch)
  
  status: 'publish' | 'draft' | 'trash'; // 状态
  unit: 'pcs' | 'roll' | 'box'; // 单位
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 形状 - 严格对应wp_bjt_shapes表
interface ShapeFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  code: string;                  // 形状缩写代码 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  image_url: string;             // 形状图片URL
  image_url2: string;            // 形状图片示意url
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 材料 - 严格对应wp_bjt_materials表
interface MaterialFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  code: string;                  // 材料缩写代码 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  base_material: string;         // 基材
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 规格尺寸 - 严格对应wp_bjt_specifications表
interface SpecificationFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  spec_type: 'thickness' | 'weight' | 'width' | 'length'; // 规格类型 - 必填
  metric_value: number;          // 公制数值 - 必填
  metric_unit: string;           // 公制单位 - 必填
  imperial_value: number;        // 英制数值 - 必填
  imperial_unit: string;         // 英制单位 - 必填
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// API对接
- GET /wp-json/bjt/v1/consumables
- GET /wp-json/bjt/v1/shapes
- GET /wp-json/bjt/v1/materials
- GET /wp-json/bjt/v1/dictionaries/shapes
- GET /wp-json/bjt/v1/dictionaries/materials
- POST/PUT/DELETE for all endpoints
```

**验收标准：**
- 包含wp_bjt_consumables表所有字段(46个字段)
- 包含wp_bjt_shapes表所有字段
- 包含wp_bjt_materials表所有字段
- 包含wp_bjt_specifications表所有字段
- 四表格结构完整实现
- 料号表筛选功能(规格、料号)
- 形状、材料、规格管理
- 适用主机多选功能
- 公英制度量单位支持
- 袋型和材质关联

#### 3.2.6 Day 11: 备件管理页面
**目标：** 实现备件管理功能 (对应mockup 12.html, 13.html)

**具体任务：**
```typescript
// 备件型号 - 严格对应wp_bjt_spare_part_models表
interface SparePartModelFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 备件型号编码 - 必填，同产品线下唯一
  title_zh: string;              // 中文名称 - 必填
  title_en: string;              // 英文名称 - 必填
  description_zh: string;        // 中文描述
  description_en: string;        // 英文描述
  type: string;                  // 备件类型
  image1_url: string;            // 主图URL
  image2_url: string;            // 副图URL
  explosion_diagram_pdf: string; // 爆炸图PDF文件URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 备件 - 严格对应wp_bjt_spare_parts表
interface SparePartFormData {
  id?: number;
  product_line_id: number;        // 产品线ID - 必填
  app_model: string;             // 适配机型
  model: string;                 // 配件型号
  is_consumable: boolean;        // 是否易损 - radio选项
  image_url: string;             // 产品图片
  part_number: string;           // 料号 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  spec: string;                  // 规格参数(公制)
  spec_imperial: string;         // 规格参数(英制)
  app_sn: string;                // 适配序列号
  
  // 包装信息
  package_size_cm: string;       // 包装尺寸(cm)
  package_size_inch: string;     // 包装尺寸(inch)
  net_weight_kg: number;         // 单件净重(kg)
  net_weight_lbs: number;        // 单件净重(lbs)
  gross_weight_kg: number;       // 包装毛重(kg)
  gross_weight_lbs: number;      // 包装毛重(lbs)
  pcs_per_box: number;          // 单箱数量
  
  required_parts: string;        // 必选备件料号，多个用逗号分隔
  required_quantity: string;     // 必选备件数量，多个用逗号分隔，与必选备件料号一一对应
  status: 'publish' | 'draft' | 'trash'; // 状态
  unit: 'pcs' | 'roll' | 'box'; // 单位
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// API对接
- GET /wp-json/bjt/v1/spare-part-models
- GET /wp-json/bjt/v1/spare-parts
- POST /wp-json/bjt/v1/spare-parts
- PUT /wp-json/bjt/v1/spare-parts/{id}
- DELETE /wp-json/bjt/v1/spare-parts/{id}
- CRM集成: GET /wp-json/bjt/v1/crm/part-data
```

**验收标准：**
- 包含wp_bjt_spare_part_models表所有字段
- 包含wp_bjt_spare_parts表所有字段
- 是否常用radio选项(is_consumable)
- 适用主机多选(app_model)
- 适用序列号输入(app_sn)
- 必选备件管理(required_parts, required_quantity)
- CRM数据集成

### 3.3 阶段三：系统功能完善 (3天)

#### 3.3.1 Day 12: 用户管理页面
**目标：** 实现用户管理功能

**具体任务：**
```typescript
// 用户 - 严格对应wp_bjt_users表 - 更新字段
interface UserFormData {
  id?: number;
  username: string;              // 用户名 - 必填，唯一
  email: string;                 // 邮箱 - 必填，唯一
  password?: string;             // 密码 - 创建时必填，编辑时可选
  customer_code: string;         // 客户代码 - 必填 (新增字段)
  role: string;                  // 角色
  country: string;               // 国家 - 必填 (新增字段)
  region: string;                // 区域 - 必填 (新增字段)
  company_logo: string;          // 公司Logo - 必填 (新增字段)
  status: string;                // 状态
  preferred_unit: 'metric' | 'imperial'; // 公英制偏好
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
}

// 功能要求
- 筛选：账户类型(role)、状态(status)、国家(country)、区域(region)、公英制偏好
- 批量操作：编辑、禁用/启用
- 分页和排序
- 客户代码管理 (新增功能)
- 公司Logo上传管理 (新增功能)

// API对接
- GET /wp-json/bjt/v1/users
- POST /wp-json/bjt/v1/users
- PUT /wp-json/bjt/v1/users/{id}
- DELETE /wp-json/bjt/v1/users/{id}
```

#### 3.3.2 Day 13: 系统设置页面
**目标：** 实现系统配置管理

**具体任务：**
```typescript
// 系统设置 - 对应API接口
interface SystemSettings {
  // 1. 基础信息
  company_name: string;          // 公司名称
  contact_info: string;          // 联系方式
  logo_url: string;              // Logo上传
  
  // 2. 系统设置
  default_language: 'zh' | 'en'; // 默认语言
  theme: string;                 // 主题
  
  // 3. 邮件设置
  smtp_host: string;             // SMTP服务器
  smtp_port: number;             // SMTP端口
  smtp_username: string;         // SMTP用户名
  smtp_password: string;         // SMTP密码
  
  // 4. API设置
  payment_api: string;           // 支付接口
  logistics_api: string;         // 物流API接口
  inventory_api: string;         // 价格库存接口
}

// API对接
- GET /wp-json/bjt/v1/settings
- PUT /wp-json/bjt/v1/settings
```

#### 3.3.3 Day 14: 批量操作功能
**目标：** 实现导入导出和批量操作

**具体任务：**
```typescript
// 创建 BatchOperationPanel.tsx
interface BatchOperationProps {
  selectedItems: any[];
  operations: BatchOperation[];
  onOperation: (operation: string, items: any[]) => void;
}

// 创建 DataImportExport.tsx
interface ImportExportProps {
  entityType: string;
  templateUrl: string;
  onImport: (file: File) => Promise<void>;
  onExport: (filters: any) => Promise<void>;
}

// 功能包括：
- CSV/Excel导入导出
- 批量删除/启用/禁用
- 进度显示
- 错误处理
```

### 3.4 阶段四：测试与优化 (3天)

#### 3.4.1 Day 15: 功能测试
**基于test-back.md测试用例执行完整测试：**

**样式检查测试：**
```typescript
// TC-STYLE-001 to TC-STYLE-012
- 布局一致性检查
- 颜色方案一致性
- 字体样式一致性
- 组件样式一致性
- 响应式布局检查
```

**功能测试：**
```typescript
// 每个页面的CRUD操作测试
- TC-PL-001: 产品线CRUD完整性测试
- TC-HM-001: 主机管理两表关联测试
- TC-RL-001: 关联关系多级层次测试
- TC-AC-001: 配件型号与料号关联测试
- TC-CS-001: 耗材多表联动测试
- TC-SP-001: 备件CRUD功能测试
- TC-UM-001: 用户CRUD功能测试
- TC-SET-001: 设置保存与读取测试
```

#### 3.4.2 Day 16: 集成测试
**API集成测试：**
```typescript
// 测试所有API端点
const apiEndpoints = [
  '/wp-json/bjt/v1/product-lines',
  '/wp-json/bjt/v1/machines',
  '/wp-json/bjt/v1/parts',
  '/wp-json/bjt/v1/spare-part-models',
  '/wp-json/bjt/v1/spare-parts',
  '/wp-json/bjt/v1/relations',
  '/wp-json/bjt/v1/accessory-models',
  '/wp-json/bjt/v1/accessories',
  '/wp-json/bjt/v1/consumables',
  '/wp-json/bjt/v1/shapes',
  '/wp-json/bjt/v1/materials',
  '/wp-json/bjt/v1/dictionaries/shapes',
  '/wp-json/bjt/v1/dictionaries/materials',
  '/wp-json/bjt/v1/users',
  '/wp-json/bjt/v1/settings'
];

// 测试内容：
- CRUD操作完整性
- 分页和筛选功能
- 错误处理
- 认证和权限
```

#### 3.4.3 Day 17: 性能优化和最终验收
**性能优化：**
```typescript
// 代码分割和懒加载
const LazyProductLinesPage = lazy(() => import('./pages/product-lines/ProductLinesPage'));
const LazyMachinesPage = lazy(() => import('./pages/machines/MachinesPage'));

// 缓存策略
- API响应缓存
- 图片懒加载
- 虚拟滚动（大数据表格）

// 构建优化
- Tree shaking
- 代码压缩
- 资源优化
```

**最终验收：**
- [ ] 与mockup设计1:1对比检查
- [ ] 所有API端点测试通过
- [ ] 所有数据表字段都能管理
- [ ] 多语言功能完整
- [ ] 响应式设计正常
- [ ] 性能指标达标

## 4. 具体实施提示词

### 4.1 组件开发提示词模板

```typescript
/**
 * 创建{组件名称}组件
 * 
 * 要求：
 * 1. 使用TypeScript严格模式
 * 2. 遵循Ant Design设计规范
 * 3. 支持响应式布局
 * 4. 包含完整的错误处理
 * 5. 添加Loading状态
 * 
 * 接口要求：
 * - 组件Props类型定义
 * - 事件回调类型定义
 * - 数据结构类型定义
 * 
 * 功能要求：
 * - {具体功能描述}
 * - {验证规则}
 * - {交互逻辑}
 */
```

### 4.2 页面开发提示词模板

```typescript
/**
 * 实现{页面名称}页面
 * 
 * 对应mockup: {mockup文件名}
 * 对应数据表: {数据表名称}
 * 对应API: {API端点}
 * 
 * 必须包含的功能：
 * 1. {功能列表}
 * 2. {数据表所有字段}
 * 3. {特殊要求}
 * 
 * UI要求：
 * - 严格按照mockup布局
 * - 支持多语言切换
 * - 响应式适配
 * 
 * 数据要求：
 * - 完整的CRUD操作
 * - 表单验证
 * - 错误处理
 * - Loading状态
 */
```

### 4.3 API集成提示词模板

```typescript
/**
 * 创建{实体名称}服务类
 * 
 * 基础接口: BaseAdminService<{EntityType}>
 * API端点: {API_ENDPOINT}
 * 
 * 必须实现的方法：
 * - get{EntityName}s(params): 分页查询
 * - get{EntityName}(id): 单个查询
 * - create{EntityName}(data): 创建
 * - update{EntityName}(id, data): 更新
 * - delete{EntityName}(id): 删除
 * 
 * 特殊方法（如有）：
 * - {特殊业务方法}
 * 
 * 类型定义：
 * - 完整的实体接口定义
 * - 查询参数接口
 * - 响应数据接口
 */
```

## 5. 字段对应检查清单

### 5.1 数据表字段完整性检查
- [ ] wp_bjt_product_lines: 14个字段全部包含
- [ ] wp_bjt_host_models: 13个字段全部包含
- [ ] wp_bjt_parts: 25个字段全部包含(完整物流参数)
- [ ] wp_bjt_accessory_models: 13个字段全部包含
- [ ] wp_bjt_accessories: 25个字段全部包含(完整物流参数)
- [ ] wp_bjt_consumables: 46个字段全部包含(完整尺寸和托盘参数)
- [ ] wp_bjt_spare_part_models: 13个字段全部包含
- [ ] wp_bjt_spare_parts: 19个字段全部包含
- [ ] wp_bjt_relations: 13个字段全部包含(包括host_part_number)
- [ ] wp_bjt_shapes: 9个字段全部包含
- [ ] wp_bjt_materials: 8个字段全部包含
- [ ] wp_bjt_specifications: 9个字段全部包含
- [ ] wp_bjt_users: 12个字段全部包含(包括customer_code, country, region, company_logo)

### 5.2 API端点对应检查
- [ ] 所有CRUD操作端点正确对应
- [ ] 查询参数与API文档一致
- [ ] 响应数据结构与API文档一致
- [ ] 特殊端点(CRM集成等)正确实现

### 5.3 业务逻辑对应检查
- [ ] 唯一性约束正确实现
- [ ] 外键关联正确处理
- [ ] 公英制单位转换正确
- [ ] 多语言字段正确处理

## 6. 质量保证检查清单

### 6.1 代码质量检查
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 组件单元测试覆盖率>80%
- [ ] API集成测试通过
- [ ] 性能测试达标

### 6.2 功能完整性检查
- [ ] 所有mockup页面1:1实现
- [ ] 所有API端点正确对接
- [ ] 所有数据表字段可管理
- [ ] 多语言功能完整
- [ ] 文件上传功能正常

### 6.3 用户体验检查
- [ ] 响应式布局正常
- [ ] 加载状态友好
- [ ] 错误提示清晰
- [ ] 操作流程顺畅
- [ ] 性能表现良好

## 7. 风险控制

### 7.1 技术风险
- **API变更风险**：定期与后端同步API规范
- **性能风险**：大数据量时的渲染性能
- **兼容性风险**：不同浏览器的兼容性

### 7.2 进度风险
- **需求变更**：严格按mockup执行，避免范围蔓延
- **技术难点**：5级关联关系树的复杂性
- **集成风险**：API接口的稳定性

### 7.3 缓解措施
- 每日代码提交和进度同步
- 关键功能优先实现
- 预留2天缓冲时间
- 建立回滚机制

总计：**17天**完成全部开发任务，确保按时交付高质量的后台管理系统。 