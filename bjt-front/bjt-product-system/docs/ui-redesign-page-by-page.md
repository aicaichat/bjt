# BJT产品管理系统 UI 重构 - 按页面维度工作清单

以下是按照页面维度组织的UI重构任务清单，每个页面的具体工作内容和实现要点。

## 0. 全局重构策略与目标

**核心目标：** 将 `bjt-product-admin` 插件的所有管理页面（包括仪表盘、主机管理、配件管理、页面编辑等）统一使用 Mockup 设计稿的样式和布局，完全替换掉这些页面上 WordPress 的默认后台外观和导航。确保插件提供一致的、现代化的用户体验。

**关键执行策略：**

1. **全局 Mockup 样式加载:**
   * 在 `class-bjt-admin.php` 的 `enqueue_admin_assets` 方法中，确保为所有 `bjt-` 前缀的插件页面加载 `bjt-mockup-style.css`作为主要样式表。
   * 移除对旧的 `bjt-admin.css` 的加载，以避免样式冲突。
   * 为所有插件页面的 `<body>` 标签添加 `bjt-mockup-active` CSS 类，以便通过 CSS 精确控制 Mockup 样式的应用范围并隐藏标准 WordPress 元素。

2. **全局 Mockup 布局模板:**
   * 创建 `templates/admin/layout/mockup-page-wrapper.php` 作为所有插件页面的统一外层包裹器。此包裹器负责输出 Mockup 的主容器 HTML 结构（例如，`<div class="container">...</div>`）。
   * 创建 `templates/admin/layout/sidebar.php`，包含 Mockup 侧边栏的 HTML 结构，动态生成菜单项。
   * `mockup-page-wrapper.php` 将包含 `sidebar.php`，并为具体页面内容提供一个主内容区域（例如，`<div class="main-content">...</div>`）。

3. **重构页面渲染方法:**
   * 在 `class-bjt-admin.php` 中，创建辅助方法 `render_mockup_page($content_template_path)`。
   * 修改所有现有的 `render_*` 方法（如 `render_dashboard`, `render_host_models` 等），使其调用 `render_mockup_page` 方法。
   * `render_mockup_page` 接收具体内容模板的路径，并将其嵌入到 `mockup-page-wrapper.php` 布局中。

4. **重构各页面内容模板:**
   * 修改所有现有的页面内容模板文件（例如 `dashboard/index.php`, `host-models/list.php` 等）。
   * 从这些模板中移除所有与全局布局相关的 HTML，只保留主内容区域的内容。
   * 确保这些内容模板只包含其在 Mockup 设计中对应 `<div class="main-content">` 区域内的 HTML 结构和逻辑。

## 0.5. 数据库与API对应关系

为确保UI重构后的页面能够正确连接数据库并使用API，每个页面部分将包含以下内容：

1. **数据表关联**：页面使用的数据库表及其字段
2. **API接口**：页面需要使用的API接口
3. **编辑字段**：表单页面涉及的可编辑字段和验证规则

所有页面应遵循以下数据处理规则：

1. 使用预处理语句进行数据库操作，避免SQL注入
2. 实现适当的输入验证和清理
3. 使用WordPress提供的数据库操作函数：`$wpdb->get_results()`, `$wpdb->insert()`, `$wpdb->update()`等
4. 针对大型数据集，实现分页和懒加载机制
5. 使用事务处理确保数据完整性
6. 实现数据缓存机制提高性能

## 0. 共用布局组件

### 0.1 主布局模板 (mockup-page-wrapper.php)
**参考 Mockup：** 适用于所有页面的通用布局结构 (1.html - 13.html)
- [x] 移动到`templates/admin/layout/`目录
- [x] 实现整体页面结构
- [x] 确保正确引入侧边栏组件
- [x] 添加主内容区域样式与结构
- [x] 引入必要的CSS和JS文件
- [x] 确保输出缓冲正确处理

### 0.2 侧边栏组件 (sidebar.php)
**参考 Mockup：** 所有页面左侧导航 (1.html)
- [x] 移动到`templates/admin/layout/`目录
- [x] 实现与mockup一致的侧边菜单
- [x] 添加页面编辑菜单（产品线1-4）
- [x] 添加产品线菜单（气垫机、纸机、胶带机、气柱袋）
- [x] 为每个产品线添加子菜单（主机管理、配件管理、耗材管理、备件管理）
- [x] 添加用户管理和系统设置入口
- [x] 实现菜单折叠/展开功能
- [x] 添加菜单图标
- [x] 实现当前页高亮显示

## 1. 系统首页/仪表盘

### 1.1 仪表盘页面 (dashboard/index.php)
**参考 Mockup：** 系统首页 (1.html)

**数据表关联：**
- 统计数据：涉及多个表的聚合查询
  - `wp_bjt_host_models`: 获取主机型号数量
  - `wp_bjt_accessory_models`: 获取配件型号数量
  - `wp_bjt_consumables`: 获取耗材数量
  - `wp_bjt_spare_parts`: 获取备件数量

**API接口：**
- `GET /wp-json/bjt/v1/dashboard/statistics`: 获取各类产品统计数据
- `GET /wp-json/bjt/v1/dashboard/recent-activities`: 获取最近活动记录

**主要功能：**
- [ ] 创建`templates/admin/dashboard/`目录
- [ ] 移动`dashboard.php`到`dashboard/index.php`
- [ ] 设置页面标题
- [ ] 实现统计卡片区域
  - [ ] 主机型号数量统计
  - [ ] 配件数量统计
  - [ ] 耗材数量统计
  - [ ] 备件数量统计
- [ ] 实现快速导航区域
  - [ ] 链接到各主要管理页面
- [ ] 实现最近活动列表
  - [ ] 显示最近的添加/编辑/删除操作记录
- [ ] 应用正确的CSS样式
- [ ] 确保输出缓冲正确使用

## 2. 产品线管理页面

### 2.1 产品线列表页 (product-lines/list.php)
**参考 Mockup：** 产品线管理界面（类似主机管理 2.html）

**数据表关联：**
- `wp_bjt_product_lines`: 产品线主表
  - 主要字段: `id`, `title_cn`, `title_en`, `status`, `menu_order`, `updated_at`

**API接口：**
- `GET /wp-json/bjt/v1/product-lines`: 获取产品线列表（支持分页、排序和过滤）
- `DELETE /wp-json/bjt/v1/product-lines/{id}`: 删除产品线

**主要功能：**
- [ ] 创建`templates/admin/product-lines/`目录
- [ ] 重构产品线列表页
- [ ] 设置页面标题
- [ ] 添加"新增产品线"按钮
- [ ] 实现产品线列表表格
  - [ ] 编号列
  - [ ] 中文标题列
  - [ ] 英文标题列
  - [ ] 排序列
  - [ ] 更新时间列
  - [ ] 状态列
  - [ ] 操作列（编辑、删除）
- [ ] 实现分页功能
- [ ] 确保输出缓冲正确使用

### 2.2 产品线编辑页面 (product-lines/edit.php)
**参考 Mockup：** 产品线编辑页面 (1.html 中的产品线编辑部分)

**数据表关联：**
- `wp_bjt_product_lines`: 产品线主表
  - 编辑字段: `title_cn`, `title_en`, `description_cn`, `description_en`, `subitem1_cn`, `subitem1_en`, `subitem2_cn`, `subitem2_en`, `image_url`, `status`, `menu_order`

**API接口：**
- `GET /wp-json/bjt/v1/product-lines/{id}`: 获取产品线详情
- `PUT /wp-json/bjt/v1/product-lines/{id}`: 更新产品线信息
- `POST /wp-json/bjt/v1/upload/image`: 上传产品线图片

**字段验证规则：**
- `title_cn`, `title_en`: 必填，长度不超过255个字符
- `description_cn`, `description_en`: 可选，文本字段
- `subitem1_cn`, `subitem1_en`, `subitem2_cn`, `subitem2_en`: 可选，长度不超过255个字符
- `image_url`: 可选，有效的URL
- `status`: 必填，枚举值：'publish', 'draft'
- `menu_order`: 必填，整数

**主要功能：**
- [ ] 重构产品线编辑页面
- [ ] 设置页面标题
- [ ] 实现多语言表单
  - [ ] 语言切换选项卡（中/英）
  - [ ] 标题字段（中/英）
  - [ ] 说明字段（中/英）
  - [ ] 子项1-耗材字段（中/英）
  - [ ] 子项2-备件字段（中/英）
- [ ] 实现图片上传区域
  - [ ] 预览功能
  - [ ] 上传按钮
  - [ ] 移除按钮
- [ ] 添加状态下拉选择
- [ ] 添加排序输入
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 2.3 产品线添加页面 (product-lines/add.php)
**参考 Mockup：** 产品线编辑页面 (与 edit.php 相同，使用 1.html 中的产品线编辑部分)

**数据表关联：**
- `wp_bjt_product_lines`: 产品线主表
  - 与编辑页面相同的字段

**API接口：**
- `POST /wp-json/bjt/v1/product-lines`: 创建新产品线
- `POST /wp-json/bjt/v1/upload/image`: 上传产品线图片

**字段验证规则：**
- 与编辑页面相同

**主要功能：**
- [ ] 创建产品线添加页面（复用编辑页模板）
- [ ] 设置页面标题为"添加产品线"
- [ ] 确保表单字段为空
- [ ] 确保输出缓冲正确使用

## 3. 主机管理页面

### 3.1 主机型号列表 (host-models/list.php)
**参考 Mockup：** 主机管理页面 (2.html)

**数据表关联：**
- `wp_bjt_host_models`: 主机型号表
  - 主要字段: `id`, `product_line`, `model`, `title_cn`, `title_en`, `status`
- `wp_bjt_parts`: 主机料号表
  - 主要字段: `id`, `product_line`, `model`, `part_number`, `name_cn`, `name_en`

**API接口：**
- `GET /wp-json/bjt/v1/host-models`: 获取主机型号列表
- `DELETE /wp-json/bjt/v1/host-models/{id}`: 删除主机型号
- `GET /wp-json/bjt/v1/parts`: 获取料号列表（支持按主机型号筛选）
- `DELETE /wp-json/bjt/v1/parts/{id}`: 删除料号

**主要功能：**
- [ ] 创建`templates/admin/host-models/`目录
- [ ] 重构主机型号列表页
- [ ] 设置页面标题
- [ ] 实现两个表格区域
- [ ] 主机型号表
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 操作列（编辑、删除、上架）
  - [ ] 添加"新增型号"按钮
- [ ] 料号表
  - [ ] 添加筛选区域（主机、料号筛选）
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
  - [ ] 操作列（编辑、关联、删除）
  - [ ] 添加"新增料号"按钮
- [ ] 实现分页功能
- [ ] 确保输出缓冲正确使用

### 3.2 主机型号编辑页面 (host-models/edit.php)
**参考 Mockup：** 主机新增/编辑页面 (3.html)

**数据表关联：**
- `wp_bjt_host_models`: 主机型号表
  - 编辑字段: `product_line`, `model`, `title_cn`, `title_en`, `description_cn`, `description_en`, `type`, `image1_url`, `image2_url`, `explosion_diagram_pdf`, `status`, `menu_order`

**API接口：**
- `GET /wp-json/bjt/v1/host-models/{id}`: 获取主机型号详情
- `PUT /wp-json/bjt/v1/host-models/{id}`: 更新主机型号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `POST /wp-json/bjt/v1/upload/pdf`: 上传PDF文件

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `model`: 必填，唯一值，长度不超过100个字符
- `title_cn`, `title_en`: 必填，长度不超过255个字符
- `description_cn`, `description_en`: 可选，文本字段
- `type`: 可选，字符串
- `image1_url`, `image2_url`, `explosion_diagram_pdf`: 可选，有效的URL
- `status`: 必填，枚举值：'publish', 'draft'
- `menu_order`: 必填，整数

**主要功能：**
- [ ] 重构主机型号编辑页面
- [ ] 设置页面标题
- [ ] 型号输入字段
- [ ] 多语言说明
  - [ ] 语言切换选项卡（中/英）
  - [ ] 中文说明文本区
  - [ ] 英文说明文本区
- [ ] 图片上传区域
  - [ ] 预览功能
  - [ ] 上传按钮
  - [ ] 移除按钮
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 3.3 主机型号添加页面 (host-models/add.php)
**参考 Mockup：** 主机新增/编辑页面 (3.html)

**数据表关联：**
- `wp_bjt_host_models`: 主机型号表
  - 与编辑页面相同的字段

**API接口：**
- `POST /wp-json/bjt/v1/host-models`: 创建新主机型号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `POST /wp-json/bjt/v1/upload/pdf`: 上传PDF文件

**字段验证规则：**
- 与编辑页面相同

**主要功能：**
- [ ] 创建主机型号添加页面（复用编辑页模板）
- [ ] 设置页面标题为"添加主机型号"
- [ ] 确保表单字段为空
- [ ] 确保输出缓冲正确使用

### 3.4 料号编辑页面 (host-models/part-edit.php)
**参考 Mockup：** 料号新增/编辑页面 (4.html)

**数据表关联：**
- `wp_bjt_parts`: 主机料号表
  - 编辑字段: `product_line`, `model`, `voltage`, `part_number`, `name_cn`, `name_en`, `brand`, `spec`, `spec_imperial`, `image_url`, 以及其他物流参数字段

**API接口：**
- `GET /wp-json/bjt/v1/parts/{id}`: 获取料号详情
- `PUT /wp-json/bjt/v1/parts/{id}`: 更新料号信息
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `GET /wp-json/bjt/v1/crm/product-data`: 获取CRM中的产品数据（用于自动填充）

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `model`: 必填，存在于主机型号表中
- `part_number`: 必填，唯一值，长度不超过100个字符
- `name_cn`, `name_en`: 必填，长度不超过255个字符
- `voltage`: 可选，长度不超过50个字符
- `brand`: 可选，长度不超过100个字符
- `spec`, `spec_imperial`: 可选，长度不超过255个字符
- `image_url`: 可选，有效的URL

**主要功能：**
- [ ] 重构料号编辑页面
- [ ] 设置页面标题
- [ ] PN输入字段（唯一性）
- [ ] 添加CRM数据获取功能
  - [ ] 型号自动填充
  - [ ] Voltage自动填充
  - [ ] 名称自动填充
  - [ ] OPT1自动填充
- [ ] 图片上传区域
  - [ ] 预览功能
  - [ ] 上传按钮
  - [ ] 移除按钮
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 3.5 料号添加页面 (host-models/part-add.php)
**参考 Mockup：** 料号新增/编辑页面 (4.html)

**数据表关联：**
- `wp_bjt_parts`: 主机料号表
  - 与编辑页面相同的字段

**API接口：**
- `POST /wp-json/bjt/v1/parts`: 创建新料号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `GET /wp-json/bjt/v1/crm/product-data`: 获取CRM中的产品数据（用于自动填充）

**字段验证规则：**
- 与编辑页面相同

**主要功能：**
- [ ] 创建料号添加页面（复用编辑页模板）
- [ ] 设置页面标题为"添加料号"
- [ ] 确保表单字段为空
- [ ] 确保输出缓冲正确使用

## 4. 关联关系管理

### 4.1 关联关系列表页 (relations/list.php)
**参考 Mockup：** 关联关系管理页面 (5.html)

**数据表关联：**
- `wp_bjt_relations`: 关联关系表
  - 主要字段: `id`, `product_line`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`
- `wp_bjt_parts`: 主机料号表（用于获取主机信息）
- `wp_bjt_accessories`: 配件料号表（用于获取配件信息）

**API接口：**
- `GET /wp-json/bjt/v1/relations`: 获取关联关系列表
- `DELETE /wp-json/bjt/v1/relations/{id}`: 删除关联关系
- `GET /wp-json/bjt/v1/relations/hierarchy`: 获取多级配件层次结构

**主要功能：**
- [ ] 创建`templates/admin/relations/`目录
- [ ] 重构关联关系列表页
- [ ] 设置页面标题
- [ ] 当前机型和料号显示区域
- [ ] 添加重置功能
- [ ] 一级配件区域
  - [ ] 添加"新增一级配件"按钮
  - [ ] 单选按钮列
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
  - [ ] 操作列（删除）
  - [ ] "显示下一级配件"功能
- [ ] 二至五级配件区域
  - [ ] 标题显示归属关系
  - [ ] 表格与一级配件结构相同
  - [ ] 递进式层级展示
- [ ] 确保输出缓冲正确使用

### 4.2 关联关系添加页面 (relations/add.php)
**参考 Mockup：** 关联关系新增页面 (6.html)

**数据表关联：**
- `wp_bjt_relations`: 关联关系表
  - 编辑字段: `product_line`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`
- `wp_bjt_accessories`: 配件料号表（用于选择配件）

**API接口：**
- `POST /wp-json/bjt/v1/relations`: 创建新关联关系
- `GET /wp-json/bjt/v1/accessories`: 获取配件列表（支持筛选）

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `parent_part_number`: 必填，存在的料号
- `child_part_number`: 必填，存在的料号
- `child_type`: 必填，枚举值：'accessory', 'spare_part'
- `level`: 必填，整数（1-5）
- `quantity`: 必填，整数，默认1

**主要功能：**
- [ ] 重构关联关系添加页面
- [ ] 设置页面标题
- [ ] 添加筛选功能
  - [ ] 型号筛选
  - [ ] 料号筛选
  - [ ] 重置按钮
- [ ] 配件选择表格
  - [ ] 单选按钮列
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
- [ ] 添加确定和取消按钮
- [ ] 确保输出缓冲正确使用

## 5. 配件管理页面

### 5.1 配件列表页 (accessories/list.php)
**参考 Mockup：** 配件管理页面 (7.html)

**数据表关联：**
- `wp_bjt_accessory_models`: 配件型号表
  - 主要字段: `id`, `product_line`, `model`, `title_cn`, `title_en`, `status`
- `wp_bjt_accessories`: 配件料号表
  - 主要字段: `id`, `product_line`, `model`, `part_number`, `name_cn`, `name_en`

**API接口：**
- `GET /wp-json/bjt/v1/accessory-models`: 获取配件型号列表
- `DELETE /wp-json/bjt/v1/accessory-models/{id}`: 删除配件型号
- `GET /wp-json/bjt/v1/accessories`: 获取配件料号列表
- `DELETE /wp-json/bjt/v1/accessories/{id}`: 删除配件料号

**主要功能：**
- [ ] 创建`templates/admin/accessories/`目录
- [ ] 重构配件列表页
- [ ] 设置页面标题
- [ ] 实现两个表格区域
- [ ] 配件型号表
  - [ ] 编号列
  - [ ] 型号名称列
  - [ ] 操作列（编辑、删除）
  - [ ] 添加"新增型号"按钮
- [ ] 料号表
  - [ ] 添加筛选区域（型号、料号筛选）
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
  - [ ] 操作列（编辑、删除）
  - [ ] 添加"新增料号"按钮
- [ ] 实现分页功能
- [ ] 确保输出缓冲正确使用

### 5.2 配件型号编辑页面 (accessories/edit.php)
**参考 Mockup：** 配件新增页面 (8.html)

**数据表关联：**
- `wp_bjt_accessory_models`: 配件型号表
  - 编辑字段: `product_line`, `model`, `title_cn`, `title_en`, `description_cn`, `description_en`, `type`, `image1_url`, `image2_url`, `status`, `menu_order`

**API接口：**
- `GET /wp-json/bjt/v1/accessory-models/{id}`: 获取配件型号详情
- `PUT /wp-json/bjt/v1/accessory-models/{id}`: 更新配件型号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `model`: 必填，唯一值，长度不超过100个字符
- `title_cn`, `title_en`: 必填，长度不超过255个字符
- `description_cn`, `description_en`: 可选，文本字段
- `type`: 可选，字符串
- `image1_url`, `image2_url`: 可选，有效的URL
- `status`: 必填，枚举值：'publish', 'draft'
- `menu_order`: 必填，整数

**主要功能：**
- [ ] 重构配件型号编辑页面
- [ ] 设置页面标题
- [ ] 型号输入字段（唯一性）
- [ ] 多语言描述
  - [ ] 语言切换选项卡（中/英）
  - [ ] 中文描述文本区
  - [ ] 英文描述文本区
- [ ] 图片上传区域
  - [ ] 预览功能
  - [ ] 上传按钮
  - [ ] 移除按钮
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 5.3 配件型号添加页面 (accessories/add.php)
**参考 Mockup：** 配件新增页面 (8.html)

**数据表关联：**
- `wp_bjt_accessory_models`: 配件型号表
  - 与编辑页面相同的字段

**API接口：**
- `POST /wp-json/bjt/v1/accessory-models`: 创建新配件型号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片

**字段验证规则：**
- 与编辑页面相同

**主要功能：**
- [ ] 创建配件型号添加页面（复用编辑页模板）
- [ ] 设置页面标题为"添加配件型号"
- [ ] 确保表单字段为空
- [ ] 确保输出缓冲正确使用

### 5.4 配件料号编辑页面 (accessories/part-edit.php)
**参考 Mockup：** 配件物料新增页面 (9.html)

**数据表关联：**
- `wp_bjt_accessories`: 配件料号表
  - 编辑字段: `product_line`, `model`, `part_number`, `name_cn`, `name_en`, `brand`, `spec`, `spec_imperial`, `voltage`, `frequency`, `image_url`, 以及其他物流参数字段

**API接口：**
- `GET /wp-json/bjt/v1/accessories/{id}`: 获取配件料号详情
- `PUT /wp-json/bjt/v1/accessories/{id}`: 更新配件料号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `GET /wp-json/bjt/v1/crm/accessory-data`: 获取CRM中的配件数据（用于自动填充）

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `model`: 必填，存在于配件型号表中
- `part_number`: 必填，唯一值，长度不超过100个字符
- `name_cn`, `name_en`: 必填，长度不超过255个字符
- `brand`: 可选，长度不超过100个字符
- `spec`, `spec_imperial`: 可选，长度不超过255个字符
- `voltage`, `frequency`: 可选，长度不超过50个字符
- `image_url`: 可选，有效的URL

**主要功能：**
- [ ] 重构配件料号编辑页面
- [ ] 设置页面标题
- [ ] 料号输入字段（唯一性）
- [ ] 添加CRM数据获取功能
  - [ ] 型号自动填充
  - [ ] 电压自动填充
  - [ ] 属性1自动填充
  - [ ] 属性2自动填充
- [ ] 多语言支持
  - [ ] 语言切换选项卡（中/英）
  - [ ] 相关字段支持中英文输入
- [ ] 图片上传区域
  - [ ] 预览功能
  - [ ] 上传按钮
  - [ ] 移除按钮
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 5.5 配件料号添加页面 (accessories/part-add.php)
**参考 Mockup：** 配件物料新增页面 (9.html)

**数据表关联：**
- `wp_bjt_accessories`: 配件料号表
  - 与编辑页面相同的字段

**API接口：**
- `POST /wp-json/bjt/v1/accessories`: 创建新配件料号
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `GET /wp-json/bjt/v1/crm/accessory-data`: 获取CRM中的配件数据（用于自动填充）

**字段验证规则：**
- 与编辑页面相同

**主要功能：**
- [ ] 创建配件料号添加页面（复用编辑页模板）
- [ ] 设置页面标题为"添加配件料号"
- [ ] 确保表单字段为空
- [ ] 确保输出缓冲正确使用

## 6. 耗材管理页面

### 6.1 耗材列表页 (consumables/list.php)
**参考 Mockup：** 耗材管理页面 (10.html)

**数据表关联：**
- `wp_bjt_consumables`: 耗材主表
  - 主要字段: `id`, `product_line`, `model`, `part_number`, `spec`, `spec_imperial`
- `wp_bjt_shapes`: 耗材形状表
  - 主要字段: `id`, `code`, `name_cn`, `name_en`, `image_url`
- `wp_bjt_materials`: 耗材材料表
  - 主要字段: `id`, `code`, `name_cn`, `name_en`, `base_material`
- `wp_bjt_specifications`: 规格尺寸表
  - 主要字段: `id`, `spec_type`, `metric_value`, `metric_unit`, `imperial_value`, `imperial_unit`

**API接口：**
- `GET /wp-json/bjt/v1/consumables`: 获取耗材列表
- `DELETE /wp-json/bjt/v1/consumables/{id}`: 删除耗材
- `GET /wp-json/bjt/v1/shapes`: 获取形状列表
- `DELETE /wp-json/bjt/v1/shapes/{id}`: 删除形状
- `GET /wp-json/bjt/v1/materials`: 获取材料列表
- `DELETE /wp-json/bjt/v1/materials/{id}`: 删除材料
- `GET /wp-json/bjt/v1/specifications`: 获取规格列表
- `DELETE /wp-json/bjt/v1/specifications/{id}`: 删除规格

**主要功能：**
- [ ] 创建`templates/admin/consumables/`目录
- [ ] 重构耗材列表页
- [ ] 设置页面标题
- [ ] 料号表
  - [ ] 添加筛选功能（规格、料号）
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
  - [ ] 操作列（编辑、删除）
  - [ ] 添加"新增耗材"按钮
- [ ] 形状表
  - [ ] 编号列
  - [ ] 缩写列
  - [ ] 名称列
  - [ ] 图片列
  - [ ] 操作列（编辑、删除）
  - [ ] 添加"新增形状"按钮
- [ ] 材料表
  - [ ] 编号列
  - [ ] 缩写列
  - [ ] 名称列
  - [ ] 基材列
  - [ ] 操作列（编辑、删除）
  - [ ] 添加"新增材料"按钮
- [ ] 规格尺寸表（厚度、克重、宽度、长度）
  - [ ] 编号列
  - [ ] 公制数值列
  - [ ] 英制数值列
  - [ ] 操作列（编辑、删除）
- [ ] 确保输出缓冲正确使用

### 6.2 耗材添加/编辑页面 (consumables/edit.php)
**参考 Mockup：** 耗材新增页面 (11.html)

**数据表关联：**
- `wp_bjt_consumables`: 耗材主表
  - 编辑字段: `product_line`, `model`, `model_imperial`, `part_number`, `spec`, `spec_imperial`, `brand`, `app_model`, `bag_type`, `material`, `thickness_met`, `thickness_imp`, `width_met`, `width_imp`, `length_met`, `length_imp`, 以及其他参数字段
- `wp_bjt_consumable_compatibility`: 耗材主机适配表
  - 编辑字段: `product_line`, `consumable_part_number`, `host_model`

**API接口：**
- `GET /wp-json/bjt/v1/consumables/{id}`: 获取耗材详情
- `PUT /wp-json/bjt/v1/consumables/{id}`: 更新耗材信息
- `POST /wp-json/bjt/v1/consumables`: 创建新耗材
- `GET /wp-json/bjt/v1/shapes`: 获取形状列表（用于选择）
- `GET /wp-json/bjt/v1/materials`: 获取材料列表（用于选择）
- `GET /wp-json/bjt/v1/specifications`: 获取规格列表（用于选择）
- `GET /wp-json/bjt/v1/host-models`: 获取主机型号列表（用于选择适用主机）
- `POST /wp-json/bjt/v1/upload/image`: 上传图片

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `model`, `model_imperial`: 必填，长度不超过100个字符
- `part_number`: 必填，唯一值，长度不超过100个字符
- `spec`, `spec_imperial`: 可选，长度不超过255个字符
- `brand`: 可选，长度不超过100个字符
- `app_model`: 可选，长度不超过255个字符
- `bag_type`, `material`: 可选，长度不超过100个字符
- 尺寸相关字段(`thickness_met`, `width_met`等): 可选，数值型

**主要功能：**
- [ ] 重构耗材添加/编辑页面
- [ ] 设置页面标题
- [ ] 料号表筛选区域
- [ ] 型号选择下拉菜单
- [ ] 形状选择下拉菜单
- [ ] 材质选择下拉菜单
- [ ] 类型选择下拉菜单
- [ ] 规格输入区域
  - [ ] 公制厚度
  - [ ] 公制宽度
  - [ ] 公制长度
  - [ ] 英制厚度
  - [ ] 英制宽度
  - [ ] 英制长度
- [ ] 适用主机选择（复选框）
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 6.3 形状添加/编辑页面 (consumables/shape-edit.php)
**参考 Mockup：** 基于耗材管理中的形状表 (10.html)

**数据表关联：**
- `wp_bjt_shapes`: 耗材形状表
  - 编辑字段: `product_line`, `code`, `name_cn`, `name_en`, `image_url`, `status`, `menu_order`

**API接口：**
- `GET /wp-json/bjt/v1/shapes/{id}`: 获取形状详情
- `PUT /wp-json/bjt/v1/shapes/{id}`: 更新形状信息
- `POST /wp-json/bjt/v1/shapes`: 创建新形状
- `POST /wp-json/bjt/v1/upload/image`: 上传图片

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `code`: 必填，唯一值，长度不超过50个字符
- `name_cn`, `name_en`: 必填，长度不超过100个字符
- `image_url`: 可选，有效的URL
- `status`: 必填，枚举值：'publish', 'draft'
- `menu_order`: 可选，整数

**主要功能：**
- [ ] 创建形状添加/编辑页面
- [ ] 设置页面标题
- [ ] 缩写输入字段
- [ ] 名称输入字段
- [ ] 图片上传区域
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

### 6.4 材料添加/编辑页面 (consumables/material-edit.php)
**参考 Mockup：** 基于耗材管理中的材料表 (10.html)

**数据表关联：**
- `wp_bjt_materials`: 耗材材料表
  - 编辑字段: `product_line`, `code`, `name_cn`, `name_en`, `base_material`, `status`, `menu_order`

**API接口：**
- `GET /wp-json/bjt/v1/materials/{id}`: 获取材料详情
- `PUT /wp-json/bjt/v1/materials/{id}`: 更新材料信息
- `POST /wp-json/bjt/v1/materials`: 创建新材料

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `code`: 必填，唯一值，长度不超过50个字符
- `name_cn`, `name_en`: 必填，长度不超过100个字符
- `base_material`: 可选，长度不超过100个字符
- `status`: 必填，枚举值：'publish', 'draft'
- `menu_order`: 可选，整数

**主要功能：**
- [ ] 创建材料添加/编辑页面
- [ ] 设置页面标题
- [ ] 缩写输入字段
- [ ] 名称输入字段
- [ ] 基材选择
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

## 7. 备件管理页面

### 7.1 备件列表页 (spare-parts/list.php)
**参考 Mockup：** 备件管理页面 (12.html)

**数据表关联：**
- `wp_bjt_spare_parts`: 备件表
  - 主要字段: `id`, `product_line`, `part_number`, `name_cn`, `name_en`, `app_model`, `is_consumable`

**API接口：**
- `GET /wp-json/bjt/v1/spare-parts`: 获取备件列表
- `DELETE /wp-json/bjt/v1/spare-parts/{id}`: 删除备件

**主要功能：**
- [ ] 创建`templates/admin/spare-parts/`目录
- [ ] 重构备件列表页
- [ ] 设置页面标题
- [ ] 添加筛选功能
  - [ ] 型号筛选
  - [ ] 料号筛选
  - [ ] 重置按钮
- [ ] 料号表
  - [ ] 编号列
  - [ ] 型号列
  - [ ] 料号列
  - [ ] 操作列（编辑、删除）
  - [ ] 添加"新增备件"按钮
- [ ] 实现分页功能
- [ ] 确保输出缓冲正确使用

### 7.2 备件添加/编辑页面 (spare-parts/edit.php)
**参考 Mockup：** 备件新增页面 (13.html)

**数据表关联：**
- `wp_bjt_spare_parts`: 备件表
  - 编辑字段: `product_line`, `app_model`, `is_consumable`, `image_url`, `part_number`, `name_cn`, `name_en`, `spec`, `spec_imperial`, `app_sn`, 以及其他参数字段

**API接口：**
- `GET /wp-json/bjt/v1/spare-parts/{id}`: 获取备件详情
- `PUT /wp-json/bjt/v1/spare-parts/{id}`: 更新备件信息
- `POST /wp-json/bjt/v1/spare-parts`: 创建新备件
- `GET /wp-json/bjt/v1/host-models`: 获取主机型号列表（用于选择适用主机）
- `POST /wp-json/bjt/v1/upload/image`: 上传图片
- `GET /wp-json/bjt/v1/crm/spare-part-data`: 获取CRM中的备件数据（用于自动填充）

**字段验证规则：**
- `product_line`: 必填，有效的产品线标识
- `part_number`: 必填，唯一值，长度不超过100个字符
- `name_cn`, `name_en`: 必填，长度不超过255个字符
- `app_model`: 可选，长度不超过255个字符
- `is_consumable`: 可选，布尔值
- `spec`, `spec_imperial`: 可选，长度不超过255个字符
- `app_sn`: 可选，长度不超过255个字符
- `image_url`: 可选，有效的URL

**主要功能：**
- [ ] 重构备件添加/编辑页面
- [ ] 设置页面标题
- [ ] 料号输入字段（唯一性）
- [ ] 添加CRM数据获取功能
  - [ ] 型号自动填充
  - [ ] 属性1自动填充
  - [ ] 属性2自动填充
- [ ] 常用选项（单选按钮）
- [ ] 适用主机选择
- [ ] 适用序列号输入
- [ ] 多语言支持
  - [ ] 语言切换选项卡（中/英）
  - [ ] 相关字段支持中英文输入
- [ ] 图片上传区域
  - [ ] 预览功能
  - [ ] 上传按钮
  - [ ] 移除按钮
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

## 8. 用户管理页面

### 8.1 用户列表页 (users/list.php)
**参考 Mockup：** 与其他列表页保持一致的样式，没有专用 mockup

**数据表关联：**
- `wp_users`: WordPress用户表
  - 主要字段: `ID`, `user_login`, `user_email`, `user_status`, `user_registered`
- `wp_usermeta`: WordPress用户元数据表
  - 主要字段: `user_id`, `meta_key`, `meta_value`
  - 自定义元数据: `bjt_user_type`, `bjt_region`, `bjt_customer_code`, `bjt_warehouse`, `bjt_unit_preference`

**API接口：**
- `GET /wp-json/bjt/v1/users`: 获取用户列表
- `PUT /wp-json/bjt/v1/users/{id}/status`: 更新用户状态（启用/禁用）

**主要功能：**
- [ ] 创建`templates/admin/users/`目录
- [ ] 创建用户列表页
- [ ] 设置页面标题
- [ ] 添加搜索和筛选功能
  - [ ] 账户类型筛选
  - [ ] 国家/地区筛选
- [ ] 用户表格
  - [ ] 用户ID列
  - [ ] 用户名列
  - [ ] 邮箱列
  - [ ] 账户类型列（C端、经销商、公司销售、管理员）
  - [ ] 国家/地区列
  - [ ] 公英制偏好列
  - [ ] 客户代码列
  - [ ] 关联仓库列
  - [ ] 账号状态列
  - [ ] 创建日期列
  - [ ] 操作列（编辑、禁用/启用）
  - [ ] 添加"新增用户"按钮
- [ ] 实现分页功能
- [ ] 确保输出缓冲正确使用

### 8.2 用户添加/编辑页面 (users/edit.php)
**参考 Mockup：** 参照其他编辑页的风格，没有专用 mockup

**数据表关联：**
- `wp_users`: WordPress用户表
  - 编辑字段: `user_login`, `user_email`, `user_pass`, `user_status`
- `wp_usermeta`: WordPress用户元数据表
  - 编辑字段: `bjt_user_type`, `bjt_region`, `bjt_customer_code`, `bjt_warehouse`, `bjt_unit_preference`

**API接口：**
- `GET /wp-json/bjt/v1/users/{id}`: 获取用户详情
- `PUT /wp-json/bjt/v1/users/{id}`: 更新用户信息
- `POST /wp-json/bjt/v1/users`: 创建新用户
- `GET /wp-json/bjt/v1/regions`: 获取地区列表
- `GET /wp-json/bjt/v1/warehouses`: 获取仓库列表

**字段验证规则：**
- `user_login`: 必填，唯一值，长度不超过60个字符
- `user_email`: 必填，唯一值，有效的电子邮件格式
- `user_pass`: 新增时必填，长度不少于8个字符
- `bjt_user_type`: 必填，枚举值：'customer', 'dealer', 'sales', 'admin'
- `bjt_region`: 必填，有效的区域代码
- `bjt_unit_preference`: 必填，枚举值：'metric', 'imperial'
- `bjt_customer_code`: 可选，长度不超过50个字符
- `bjt_warehouse`: 可选，多选，有效的仓库代码列表

**主要功能：**
- [ ] 创建用户添加/编辑页面
- [ ] 设置页面标题
- [ ] 用户名输入字段
- [ ] 邮箱输入字段
- [ ] 账户类型下拉选择
- [ ] 国家/地区选择
- [ ] 公英制选择
- [ ] 客户代码输入
- [ ] 关联仓库复选框
- [ ] 账号状态切换
- [ ] 添加提交和取消按钮
- [ ] 确保编辑模式下预填数据
- [ ] 确保输出缓冲正确使用

## 9. 系统设置页面

### 9.1 系统设置页面 (settings/index.php)
**参考 Mockup：** 参照表单页的风格，没有专用 mockup

**数据表关联：**
- `wp_options`: WordPress选项表
  - 编辑字段: 多个自定义选项，如`bjt_company_name`, `bjt_contact_info`, `bjt_logo_url`, `bjt_default_language`, `bjt_payment_gateways`, `bjt_shipping_api_keys`等

**API接口：**
- `GET /wp-json/bjt/v1/settings`: 获取系统设置
- `PUT /wp-json/bjt/v1/settings`: 更新系统设置
- `POST /wp-json/bjt/v1/upload/logo`: 上传公司logo

**字段验证规则：**
- `bjt_company_name`: 必填，长度不超过255个字符
- `bjt_contact_info`: 可选，文本字段
- `bjt_logo_url`: 可选，有效的URL
- `bjt_default_language`: 必填，有效的语言代码
- `bjt_payment_gateways`: 可选，JSON格式的支付接口配置
- `bjt_shipping_api_keys`: 可选，JSON格式的物流API配置

**主要功能：**
- [ ] 创建`templates/admin/settings/`目录
- [ ] 创建系统设置页面
- [ ] 设置页面标题
- [ ] 基础信息设置区域
  - [ ] 公司名称输入
  - [ ] 联系方式输入
  - [ ] Logo上传功能
- [ ] 系统设置区域
  - [ ] 语言设置选项
  - [ ] 支付接口设置
  - [ ] 物流API接口设置
- [ ] 添加保存设置按钮
- [ ] 实现设置验证功能
- [ ] 确保输出缓冲正确使用

## 10. 售后管理页面

### 10.1 售后申请列表页 (after-sales/list.php)
**参考 Mockup：** 参照其他列表页的风格，没有专用 mockup

**数据表关联：**
- 需要创建新表 `wp_bjt_after_sales_requests`
  - 主要字段: `id`, `customer_id`, `product_line`, `product_type`, `product_id`, `request_date`, `issue_description`, `status`

**API接口：**
- `GET /wp-json/bjt/v1/after-sales`: 获取售后申请列表
- `PUT /wp-json/bjt/v1/after-sales/{id}/status`: 更新申请状态

**主要功能：**
- [ ] 创建`templates/admin/after-sales/`目录
- [ ] 创建售后申请列表页
- [ ] 设置页面标题
- [ ] 售后申请表格
  - [ ] 申请编号列
  - [ ] 客户名称列
  - [ ] 申请日期列
  - [ ] 产品信息列
  - [ ] 问题描述列
  - [ ] 状态列
  - [ ] 操作列（查看、处理、关闭）
- [ ] 实现分页功能
- [ ] 确保输出缓冲正确使用

### 10.2 售后申请详情页面 (after-sales/detail.php)
**参考 Mockup：** 参照其他详情页的风格，没有专用 mockup

**数据表关联：**
- `wp_bjt_after_sales_requests`: 售后申请主表
- `wp_bjt_after_sales_attachments`: 售后申请附件表（需要创建）
- `wp_bjt_after_sales_feedback`: 售后反馈记录表（需要创建）

**API接口：**
- `GET /wp-json/bjt/v1/after-sales/{id}`: 获取售后申请详情
- `PUT /wp-json/bjt/v1/after-sales/{id}`: 更新售后申请信息
- `POST /wp-json/bjt/v1/after-sales/{id}/feedback`: 添加反馈记录
- `PUT /wp-json/bjt/v1/after-sales/{id}/approve-return`: 审批退货
- `PUT /wp-json/bjt/v1/after-sales/{id}/close`: 关闭申请

**主要功能：**
- [ ] 创建售后申请详情页面
- [ ] 设置页面标题
- [ ] 客户信息卡片
- [ ] 问题描述区域
- [ ] 附件预览区域
- [ ] 客服反馈记录列表
- [ ] 添加退货审批功能
- [ ] 添加处理状态更新功能
- [ ] 添加关闭申请功能
- [ ] 确保输出缓冲正确使用

## 11. 数据导出页面

### 11.1 数据导出页面 (export/index.php)
**参考 Mockup：** 参照表单页的风格，没有专用 mockup

**数据表关联：**
- 功能性页面，不直接编辑数据库表，但会查询多个表进行导出
- 可能涉及的表: `wp_bjt_product_lines`, `wp_bjt_host_models`, `wp_bjt_parts`, `wp_bjt_accessories`, `wp_bjt_consumables`, `wp_bjt_spare_parts`, `wp_users`等

**API接口：**
- `POST /wp-json/bjt/v1/exports/orders`: 导出订单数据
- `POST /wp-json/bjt/v1/exports/inventory`: 导出库存数据
- `POST /wp-json/bjt/v1/exports/users`: 导出用户数据
- `POST /wp-json/bjt/v1/exports/products`: 导出产品数据
- `GET /wp-json/bjt/v1/exports/{job_id}/status`: 获取导出任务状态
- `GET /wp-json/bjt/v1/exports/{job_id}/download`: 下载导出文件

**主要功能：**
- [ ] 创建`templates/admin/export/`目录
- [ ] 创建数据导出页面
- [ ] 设置页面标题
- [ ] 导出数据类型选择
  - [ ] 订单数据
  - [ ] 库存数据
  - [ ] 用户数据
  - [ ] 产品数据
- [ ] 导出范围设置
  - [ ] 日期范围选择
  - [ ] 产品线选择
  - [ ] 仓库选择
- [ ] 导出格式选择（Excel、CSV）
- [ ] 添加导出按钮
- [ ] 实现导出进度实时反馈
- [ ] 确保输出缓冲正确使用 