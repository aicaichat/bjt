# BJT产品管理系统

## 项目结构
```
bjt-product-system/
├── frontend/          # 前端用户应用
│   ├── src/          # 源代码
│   │   ├── pages/    # 页面组件
│   │   │   ├── Home/              # 首页/产品导航
│   │   │   ├── Auth/              # 登录相关
│   │   │   │   ├── Login/         # 登录页面
│   │   │   │   └── ForgotPassword/# 忘记密码
│   │   │   ├── Products/          # 产品相关
│   │   │   │   ├── Selection/     # 产品及配件选择
│   │   │   │   ├── Consumables/   # 耗材选择
│   │   │   │   ├── SpareParts/    # 备件选择
│   │   │   ├── Cart/              # 购物车相关
│   │   │   │   ├── CartList/      # 购物车列表
│   │   │   │   ├── Confirmation/  # 确认订单
│   │   │   │   ├── PO/            # 生成PO
│   │   │   │   └── Payment/       # 支付页面
│   │   │   ├── Orders/            # 订单相关
│   │   │   │   ├── List/          # 订单列表
│   │   │   │   ├── Detail/        # 订单详情
│   │   │   │   ├── Logistics/     # 物流跟踪
│   │   │   │   └── Invoice/       # 发票管理
│   │   │   ├── Account/           # 账户相关
│   │   │   │   ├── Profile/       # 个人信息
│   │   │   │   └── Password/      # 密码修改
│   │   │   ├── Support/           # 支持相关
│   │   │   │   ├── Help/          # 帮助中心
│   │   │   │   ├── Feedback/      # 问题反馈
│   │   │   │   └── Maintenance/   # 维修工单
│   │   │   └── Documents/         # 文档下载
│   │   ├── components/ # 通用组件
│   │   ├── services/  # API服务
│   │   ├── config/    # 全局配置
│   │   ├── utils/     # 工具函数
│   │   └── types/     # 类型定义
│   ├── public/        # 静态资源
│   └── docs/          # 前端文档
├── plugins/           # WordPress插件
│   └── bjt-product-admin/  # 产品管理插件
│       ├── includes/       # 核心功能
│       │   ├── admin/     # 管理后台逻辑
│       │   │   ├── class-bjt-product-line-management.php  # 产品线管理
│       │   │   ├── class-bjt-machine-management.php       # 主机管理
│       │   │   ├── class-bjt-accessory-management.php     # 配件管理
│       │   │   ├── class-bjt-consumable-management.php    # 耗材管理
│       │   │   └── class-bjt-spare-part-management.php    # 备件管理
│       │   ├── api/       # REST API接口
│       │   └── functions.php
│       ├── templates/     # 后台页面模板
│       │   └── admin/     # 对应mockup的后台页面
│       │       ├── index.php                # 1.html 系统首页
│       │       ├── product-lines/           # 产品线管理
│       │       │   ├── edit.php            # 产品线编辑页面
│       │       │   └── list.php            # 产品线列表页面
│       │       ├── machines/               # 主机管理
│       │       │   ├── list.php            # 2.html 主机列表
│       │       │   ├── edit.php            # 3.html 主机编辑
│       │       │   ├── part-edit.php       # 4.html 料号编辑
│       │       │   ├── relation.php        # 5.html 关联关系
│       │       │   └── relation-add.php    # 6.html 关联关系新增
│       │       ├── accessories/            # 配件管理
│       │       │   ├── list.php            # 7.html 配件列表
│       │       │   ├── add.php             # 8.html 配件新增
│       │       │   └── part-add.php        # 9.html 配件料号新增
│       │       ├── consumables/            # 耗材管理
│       │       │   ├── list.php            # 10.html 耗材列表
│       │       │   └── add.php             # 11.html 耗材新增
│       │       └── spare-parts/            # 备件管理
│       │           ├── list.php            # 12.html 备件列表
│       │           └── add.php             # 13.html 备件新增
│       └── assets/        # JS、CSS等资源文件
├── wordpress/         # WordPress核心文件
├── docker/           # Docker配置
│   ├── dev/         # 开发环境配置
│   └── prod/        # 生产环境配置
├── nginx/           # Nginx配置
├── docs/            # 项目文档
└── scripts/         # 维护脚本
```

## 系统架构

### 前端用户应用（React + TypeScript）
- **技术栈**：React 18 + TypeScript + Vite + Ant Design
- **主要功能**：
  - 首页与产品导航
    - 多语言切换
    - 产品分类展示
    - 文档下载入口
    - 售后服务入口
  - 产品选购系统
    - 产品及配件多级选择（最多5级）
    - 耗材选择与筛选
    - 备件管理
    - 价格展示（多角色）
    - 库存查询（销售角色）
  - 购物流程
    - 购物车管理
    - 订单确认
    - PO单生成
    - 在线支付
  - 订单管理
    - 订单列表与详情
    - 物流跟踪
    - 发票管理
  - 用户功能
    - 账户管理
    - 问题反馈
    - 维修工单
    - 帮助中心
  - 系统特性
    - 响应式设计
    - 多语言支持
    - 多角色权限
    - 实时库存

### WordPress管理后台
- **技术栈**：WordPress + PHP
- **主要功能**：
  - 产品线管理
  - 主机管理
  - 配件管理
  - 耗材管理
  - 价格管理

## 前后端映射关系

### 1. 首页/产品导航
- **前端页面**: `src/pages/Home`
- **后台页面**: 
  - `templates/admin/product-line-page/edit.php` (产品线页面编辑)
- **API接口**: 
  - `GET /wp-json/bjt/v1/product-lines` - 获取所有产品线信息
  - `GET /wp-json/bjt/v1/product-lines/{id}` - 获取单个产品线详情
- **数据表**: 
  - `wp_bjt_product_lines` - 产品线基础信息

### 2. 产品线相关页面

#### 2.1 气垫机产品线
- **前端页面**: 
  - `src/pages/Products/AirCushion/Selection` - 主机和配件选择
  - `src/pages/Products/AirCushion/Consumables` - 耗材选择
  - `src/pages/Products/AirCushion/SpareParts` - 备件选择
- **后台页面**:
  - `templates/admin/product-lines/air-cushion/machines/` - 主机管理
  - `templates/admin/product-lines/air-cushion/accessories/` - 配件管理
  - `templates/admin/product-lines/air-cushion/consumables/` - 耗材管理
  - `templates/admin/product-lines/air-cushion/spare-parts/` - 备件管理
- **API接口**:
  - `GET /wp-json/bjt/v1/air-cushion/machines` - 主机列表
  - `GET /wp-json/bjt/v1/air-cushion/machines/{id}/parts` - 主机配件关系
  - `GET /wp-json/bjt/v1/air-cushion/consumables` - 耗材列表
  - `GET /wp-json/bjt/v1/air-cushion/spare-parts` - 备件列表

#### 2.2 纸机产品线
- **前端页面**: 
  - `src/pages/Products/Paper/Selection` - 主机和配件选择
  - `src/pages/Products/Paper/Consumables` - 耗材选择
  - `src/pages/Products/Paper/SpareParts` - 备件选择
- **后台页面**:
  - `templates/admin/product-lines/paper/machines/` - 主机管理
  - `templates/admin/product-lines/paper/accessories/` - 配件管理
  - `templates/admin/product-lines/paper/consumables/` - 耗材管理
  - `templates/admin/product-lines/paper/spare-parts/` - 备件管理
- **API接口**:
  - `GET /wp-json/bjt/v1/paper/machines` - 主机列表
  - `GET /wp-json/bjt/v1/paper/machines/{id}/parts` - 主机配件关系
  - `GET /wp-json/bjt/v1/paper/consumables` - 耗材列表
  - `GET /wp-json/bjt/v1/paper/spare-parts` - 备件列表

#### 2.3 胶带机产品线
- **前端页面**: 
  - `src/pages/Products/Tape/Selection` - 主机和配件选择
  - `src/pages/Products/Tape/Consumables` - 耗材选择
  - `src/pages/Products/Tape/SpareParts` - 备件选择
- **后台页面**:
  - `templates/admin/product-lines/tape/machines/` - 主机管理
  - `templates/admin/product-lines/tape/accessories/` - 配件管理
  - `templates/admin/product-lines/tape/consumables/` - 耗材管理
  - `templates/admin/product-lines/tape/spare-parts/` - 备件管理
- **API接口**:
  - `GET /wp-json/bjt/v1/tape/machines` - 主机列表
  - `GET /wp-json/bjt/v1/tape/machines/{id}/parts` - 主机配件关系
  - `GET /wp-json/bjt/v1/tape/consumables` - 耗材列表
  - `GET /wp-json/bjt/v1/tape/spare-parts` - 备件列表

#### 2.4 气柱袋产品线
- **前端页面**: 
  - `src/pages/Products/AirColumn/Selection` - 主机和配件选择
  - `src/pages/Products/AirColumn/Consumables` - 耗材选择
  - `src/pages/Products/AirColumn/SpareParts` - 备件选择
- **后台页面**:
  - `templates/admin/product-lines/air-column/machines/` - 主机管理
  - `templates/admin/product-lines/air-column/accessories/` - 配件管理
  - `templates/admin/product-lines/air-column/consumables/` - 耗材管理
  - `templates/admin/product-lines/air-column/spare-parts/` - 备件管理
- **API接口**:
  - `GET /wp-json/bjt/v1/air-column/machines` - 主机列表
  - `GET /wp-json/bjt/v1/air-column/machines/{id}/parts` - 主机配件关系
  - `GET /wp-json/bjt/v1/air-column/consumables` - 耗材列表
  - `GET /wp-json/bjt/v1/air-column/spare-parts` - 备件列表

### 3. 通用API接口

#### 3.1 产品数据接口
- **价格查询**:
  - `GET /wp-json/bjt/v1/{product-line}/prices/batch` - 批量获取价格
  - `GET /wp-json/bjt/v1/{product-line}/prices/{id}` - 获取单个产品价格
- **库存查询**:
  - `GET /wp-json/bjt/v1/{product-line}/inventory/batch` - 批量获取库存
  - `GET /wp-json/bjt/v1/{product-line}/inventory/{id}` - 获取单个产品库存

#### 3.2 CRM系统集成接口
- **料号查询**:
  - `GET /wp-json/bjt/v1/crm/part-number/{pn}` - 获取料号信息
- **产品信息同步**:
  - `POST /wp-json/bjt/v1/crm/sync` - 同步CRM系统数据

#### 3.3 文件处理接口
- **图片上传**:
  - `POST /wp-json/bjt/v1/media/upload` - 上传产品图片
- **文档下载**:
  - `GET /wp-json/bjt/v1/documents/{type}/{id}` - 下载产品相关文档

#### 3.4 必选备件接口
- **主机必选备件**:
  - `GET /wp-json/bjt/v1/{product-line}/machines/{id}/required-parts` - 获取主机必选备件
  - `POST /wp-json/bjt/v1/{product-line}/machines/{id}/required-parts` - 添加主机必选备件
  - `PUT /wp-json/bjt/v1/{product-line}/machines/{id}/required-parts/{part_id}` - 更新主机必选备件
  - `DELETE /wp-json/bjt/v1/{product-line}/machines/{id}/required-parts/{part_id}` - 删除主机必选备件

- **配件必选备件**:
  - `GET /wp-json/bjt/v1/{product-line}/accessories/{id}/required-parts` - 获取配件必选备件
  - `POST /wp-json/bjt/v1/{product-line}/accessories/{id}/required-parts` - 添加配件必选备件
  - `PUT /wp-json/bjt/v1/{product-line}/accessories/{id}/required-parts/{part_id}` - 更新配件必选备件
  - `DELETE /wp-json/bjt/v1/{product-line}/accessories/{id}/required-parts/{part_id}` - 删除配件必选备件

- **备件必选备件**:
  - `GET /wp-json/bjt/v1/{product-line}/spare-parts/{id}/required-parts` - 获取备件必选备件
  - `POST /wp-json/bjt/v1/{product-line}/spare-parts/{id}/required-parts` - 添加备件必选备件
  - `PUT /wp-json/bjt/v1/{product-line}/spare-parts/{id}/required-parts/{part_id}` - 更新备件必选备件
  - `DELETE /wp-json/bjt/v1/{product-line}/spare-parts/{id}/required-parts/{part_id}` - 删除备件必选备件

### 4. 数据表与页面映射关系

#### 4.1 产品线表
##### 4.1.1 气垫机产品线表
- **表名**: `wp_bjt_air_cushion_lines`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `title_cn` - 中文标题 (varchar(255), NOT NULL)
  - `title_en` - 英文标题 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `subitem1_cn` - 子项1中文 (varchar(255))
  - `subitem1_en` - 子项1英文 (varchar(255))
  - `subitem2_cn` - 子项2中文 (varchar(255))
  - `subitem2_en` - 子项2英文 (varchar(255))
  - `subitem3_cn` - 子项3中文 (varchar(255))
  - `subitem3_en` - 子项3英文 (varchar(255))
  - `image_url` - 图片URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 菜单顺序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.1.2 纸机产品线表
- **表名**: `wp_bjt_paper_lines`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `title_cn` - 中文标题 (varchar(255), NOT NULL)
  - `title_en` - 英文标题 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `subitem1_cn` - 子项1中文 (varchar(255))
  - `subitem1_en` - 子项1英文 (varchar(255))
  - `subitem2_cn` - 子项2中文 (varchar(255))
  - `subitem2_en` - 子项2英文 (varchar(255))
  - `subitem3_cn` - 子项3中文 (varchar(255))
  - `subitem3_en` - 子项3英文 (varchar(255))
  - `image_url` - 图片URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 菜单顺序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.1.3 胶带机产品线表
- **表名**: `wp_bjt_tape_lines`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `title_cn` - 中文标题 (varchar(255), NOT NULL)
  - `title_en` - 英文标题 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `subitem1_cn` - 子项1中文 (varchar(255))
  - `subitem1_en` - 子项1英文 (varchar(255))
  - `subitem2_cn` - 子项2中文 (varchar(255))
  - `subitem2_en` - 子项2英文 (varchar(255))
  - `subitem3_cn` - 子项3中文 (varchar(255))
  - `subitem3_en` - 子项3英文 (varchar(255))
  - `image_url` - 图片URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 菜单顺序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.1.4 气柱袋产品线表
- **表名**: `wp_bjt_air_column_lines`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `title_cn` - 中文标题 (varchar(255), NOT NULL)
  - `title_en` - 英文标题 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `subitem1_cn` - 子项1中文 (varchar(255))
  - `subitem1_en` - 子项1英文 (varchar(255))
  - `subitem2_cn` - 子项2中文 (varchar(255))
  - `subitem2_en` - 子项2英文 (varchar(255))
  - `subitem3_cn` - 子项3中文 (varchar(255))
  - `subitem3_en` - 子项3英文 (varchar(255))
  - `image_url` - 图片URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 菜单顺序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### 4.2 气垫机产品线
##### 4.2.1 主机型号表
- **表名**: `wp_bjt_air_cushion_host_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 主机型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 主机类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.2.2 配件型号表
- **表名**: `wp_bjt_air_cushion_accessory_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 配件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 配件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.2.3 备件型号表
- **表名**: `wp_bjt_air_cushion_spare_part_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 备件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 备件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### 4.3 纸机产品线
##### 4.3.1 主机型号表
- **表名**: `wp_bjt_paper_host_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 主机型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 主机类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.3.2 配件型号表
- **表名**: `wp_bjt_paper_accessory_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 配件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 配件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.3.3 备件型号表
- **表名**: `wp_bjt_paper_spare_part_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 备件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 备件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### 4.4 胶带机产品线
##### 4.4.1 主机型号表
- **表名**: `wp_bjt_tape_host_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 主机型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 主机类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.4.2 配件型号表
- **表名**: `wp_bjt_tape_accessory_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 配件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 配件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.4.3 备件型号表
- **表名**: `wp_bjt_tape_spare_part_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 备件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 备件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### 4.5 气柱袋产品线
##### 4.5.1 主机型号表
- **表名**: `wp_bjt_air_column_host_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 主机型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 主机类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.5.2 配件型号表
- **表名**: `wp_bjt_air_column_accessory_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 配件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 配件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

##### 4.5.3 备件型号表
- **表名**: `wp_bjt_air_column_spare_part_models`
- **字段**:
  - `id` - 主键ID (bigint(20), PRIMARY KEY, AUTO_INCREMENT)
  - `model` - 备件型号编码 (varchar(100), NOT NULL, UNIQUE)
  - `title_cn` - 中文名称 (varchar(255), NOT NULL)
  - `title_en` - 英文名称 (varchar(255), NOT NULL)
  - `description_cn` - 中文描述 (text)
  - `description_en` - 英文描述 (text)
  - `type` - 备件类型 (text)
  - `image1_url` - 主图URL (varchar(255))
  - `image2_url` - 副图URL (varchar(255))
  - `explosion_diagram_pdf` - 爆炸图PDF文件URL (varchar(255))
  - `status` - 状态 (varchar(20), DEFAULT 'publish')
  - `menu_order` - 排序 (int(11), DEFAULT 0)
  - `created_at` - 创建时间 (datetime, DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` - 更新时间 (datetime, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### 4.6 通用功能表
##### 4.6.1 价格表
- **表名**: `wp_bjt_prices`
- **字段**:
  - `id` - 主键ID
  - `target_type` - 目标类型(host/accessory/consumable)
  - `target_id` - 目标ID
  - `region` - 区域代码
  - `currency` - 货币代码
  - `base_price` - 基础价格
  - `min_quantity` - 最小数量
  - `max_quantity` - 最大数量
  - `discount_rate` - 折扣率
  - `status` - 状态
  - `created_at` - 创建时间
  - `updated_at` - 更新时间

##### 4.6.2 库存表
- **表名**: `wp_bjt_inventory`
- **字段**:
  - `id` - 主键ID
  - `target_type` - 目标类型
  - `target_id` - 目标ID
  - `region` - 区域代码
  - `warehouse` - 仓库代码
  - `quantity` - 库存数量
  - `reserved` - 预留数量
  - `status` - 状态
  - `created_at` - 创建时间
  - `updated_at` - 更新时间

##### 4.6.3 必选备件表
- **表名**: `wp_bjt_required_accessories`
- **字段**:
  - `id` - 主键ID
  - `accessory_id` - 配件ID
  - `required_accessory_id` - 必选备件ID
  - `quantity` - 必选数量
  - `description` - 说明
  - `status` - 状态
  - `created_at` - 创建时间
  - `updated_at` - 更新时间

##### 4.6.4 媒体资源表
- **表名**: `wp_bjt_media`
- **字段**:
  - `id` - 主键ID
  - `product_line` - 产品线
  - `target_type` - 目标类型
  - `target_id` - 目标ID
  - `type` - 类型(image/document)
  - `url` - 资源URL
  - `title` - 标题
  - `description` - 描述
  - `created_at` - 创建时间
  - `updated_at` - 更新时间

#### 4.5 料号表 (parts)
存储气垫机料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| image_url | varchar(255) | 图片URL | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.6 配件料号表 (accessories)
存储配件料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| voltage | varchar(50) | 电压 | |
| frequency | varchar(50) | 频率 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.7 耗材料号表 (consumables)
存储气垫机耗材信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| product_line_id | varchar(100) | 产品线ID | NOT NULL, FOREIGN KEY |
| product_id | varchar(100) | 产品ID | NOT NULL, UNIQUE |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| unit | varchar(50) | 单位 | NOT NULL |
| package_size | varchar(100) | 包装尺寸 | |
| package_weight | decimal(10,2) | 包装重量 | |
| pallet_size | varchar(100) | 托盘尺寸 | |
| pcs_per_pallet_1 | int(11) | 每托盘数量1 | |
| pallet_height_1 | decimal(10,2) | 托盘高度1 | |
| pcs_per_pallet_2 | int(11) | 每托盘数量2 | |
| pallet_height_2 | decimal(10,2) | 托盘高度2 | |
| pcs_per_pallet_3 | int(11) | 每托盘数量3 | |
| pallet_height_3 | decimal(10,2) | 托盘高度3 | |
| app_model | varchar(255) | 适用型号，多个型号用逗号分隔 | |
| pak_shape | varchar(100) | 包装形状 | |
| material | varchar(100) | 材料 | |
| thickness_met | decimal(10,2) | 厚度(公制) | |
| thickness_imp | decimal(10,2) | 厚度(英制) | |
| gram_met | decimal(10,2) | 克重(公制) | |
| gram_imp | decimal(10,2) | 克重(英制) | |
| pcs_width_met | decimal(10,2) | 宽度(公制) | |
| pcs_width_imp | decimal(10,2) | 宽度(英制) | |
| pcs_length_met | decimal(10,2) | 长度(公制) | |
| pcs_length_imp | decimal(10,2) | 长度(英制) | |
| total_length_met | decimal(10,2) | 总长度(公制) | |
| total_length_imp | decimal(10,2) | 总长度(英制) | |
| inner_diameter | decimal(10,2) | 内径 | |
| roll_diameter | decimal(10,2) | 卷径 | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.8 备件料号表 (spare_parts)
存储气垫机备件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| app_model | varchar(255) | 适配机型 | |
| is_consumable | tinyint(1) | 是否易损 | DEFAULT 0 |
| image_url | varchar(255) | 产品图片 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| app_sn | varchar(255) | 适配序列号 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| required_parts | text | 强关联物料 | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.5 气垫机主机料号表 (air_cushion_parts)
存储气垫机主机料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| image_url | varchar(255) | 图片URL | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.6 纸机主机料号表 (paper_parts)
存储纸机主机料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| image_url | varchar(255) | 图片URL | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.7 胶带机主机料号表 (tape_parts)
存储胶带机主机料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| image_url | varchar(255) | 图片URL | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.8 气柱袋主机料号表 (air_column_parts)
存储气柱袋主机料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| image_url | varchar(255) | 图片URL | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.6 气垫机配件料号表 (air_cushion_accessories)
存储气垫机配件料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| voltage | varchar(50) | 电压 | |
| frequency | varchar(50) | 频率 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.7 纸机配件料号表 (paper_accessories)
存储纸机配件料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| voltage | varchar(50) | 电压 | |
| frequency | varchar(50) | 频率 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.8 胶带机配件料号表 (tape_accessories)
存储胶带机配件料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| voltage | varchar(50) | 电压 | |
| frequency | varchar(50) | 频率 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.9 气柱袋配件料号表 (air_column_accessories)
存储气柱袋配件料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| voltage | varchar(50) | 电压 | |
| frequency | varchar(50) | 频率 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet | int(11) | 一托数量 | |
| pallet_height_cm | decimal(10,2) | 打托高度(cm) | |
| pallet_height_inch | decimal(10,2) | 打托高度(inch) | |
| pallet_gross_weight_kg | decimal(10,2) | 整托毛重(kg) | |
| pallet_gross_weight_lbs | decimal(10,2) | 整托毛重(lbs) | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.10 耗材料号表 (consumables)
存储气垫机耗材信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| model_imperial | varchar(100) | 型号(英制) | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| brand | varchar(100) | 品牌 | |
| app_model | varchar(255) | 适用机型 | |
| bag_type | varchar(100) | 袋型 | |
| material | varchar(100) | 材质 | |
| thickness_met | decimal(10,2) | 厚度/克重(um/gsm) | |
| thickness_imp | decimal(10,2) | 厚度/克重(mil/#) | |
| width_met | decimal(10,2) | 膜宽(cm) | |
| width_imp | decimal(10,2) | 膜宽(inch) | |
| length_met | decimal(10,2) | 袋长(cm) | |
| length_imp | decimal(10,2) | 袋长(inch) | |
| bubble_diameter_met | decimal(10,2) | 泡径(cm) | |
| bubble_diameter_imp | decimal(10,2) | 泡径(inch) | |
| total_length_met | decimal(10,2) | 总长(m) | |
| total_length_imp | decimal(10,2) | 总长(ft) | |
| package_type | varchar(100) | 包装方式 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| image_url | varchar(255) | 产品图片(袋型实物) | |
| package_image_url | varchar(255) | 包装实物图片 | |
| pallet_size_cm | varchar(100) | 托盘尺寸(cm) | |
| pallet_size_inch | varchar(100) | 托盘尺寸(inch) | |
| pcs_per_pallet_a | int(11) | 一托卷数A | |
| pallet_gross_weight_a_kg | decimal(10,2) | 整托毛重A(kg) | |
| pallet_gross_weight_a_lbs | decimal(10,2) | 整托毛重A(lbs) | |
| pallet_height_a_cm | decimal(10,2) | 打托高度A(cm) | |
| pallet_height_a_inch | decimal(10,2) | 打托高度A(inch) | |
| pcs_per_pallet_b | int(11) | 一托卷数B | |
| pallet_gross_weight_b_kg | decimal(10,2) | 整托毛重B(kg) | |
| pallet_gross_weight_b_lbs | decimal(10,2) | 整托毛重B(lbs) | |
| pallet_height_b_cm | decimal(10,2) | 打托高度B(cm) | |
| pallet_height_b_inch | decimal(10,2) | 打托高度B(inch) | |
| pcs_per_pallet_c | int(11) | 一托卷数C | |
| pallet_gross_weight_c_kg | decimal(10,2) | 整托毛重C(kg) | |
| pallet_gross_weight_c_lbs | decimal(10,2) | 整托毛重C(lbs) | |
| pallet_height_c_cm | decimal(10,2) | 打托高度C(cm) | |
| pallet_height_c_inch | decimal(10,2) | 打托高度C(inch) | |
| tube_inner_diameter_cm | decimal(10,2) | 纸筒内径(cm) | |
| tube_inner_diameter_inch | decimal(10,2) | 纸筒内径(inch) | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.8 气垫机备件料号表 (air_cushion_spare_parts)
存储气垫机备件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| app_model | varchar(255) | 适配机型 | |
| is_consumable | tinyint(1) | 是否易损 | DEFAULT 0 |
| image_url | varchar(255) | 产品图片 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| app_sn | varchar(255) | 适配序列号 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| required_parts | text | 强关联物料 | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.9 纸机备件料号表 (paper_spare_parts)
存储纸机备件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| app_model | varchar(255) | 适配机型 | |
| is_consumable | tinyint(1) | 是否易损 | DEFAULT 0 |
| image_url | varchar(255) | 产品图片 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| app_sn | varchar(255) | 适配序列号 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| required_parts | text | 强关联物料 | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.10 胶带机备件料号表 (tape_spare_parts)
存储胶带机备件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| app_model | varchar(255) | 适配机型 | |
| is_consumable | tinyint(1) | 是否易损 | DEFAULT 0 |
| image_url | varchar(255) | 产品图片 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| app_sn | varchar(255) | 适配序列号 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| required_parts | text | 强关联物料 | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4.11 气柱袋备件料号表 (air_column_spare_parts)
存储气柱袋备件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| app_model | varchar(255) | 适配机型 | |
| is_consumable | tinyint(1) | 是否易损 | DEFAULT 0 |
| image_url | varchar(255) | 产品图片 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| spec | varchar(255) | 规格参数(公制) | |
| spec_imperial | varchar(255) | 规格参数(英制) | |
| app_sn | varchar(255) | 适配序列号 | |
| package_size_cm | varchar(100) | 包装尺寸(cm) | |
| package_size_inch | varchar(100) | 包装尺寸(inch) | |
| net_weight_kg | decimal(10,2) | 单件净重(kg) | |
| net_weight_lbs | decimal(10,2) | 单件净重(lbs) | |
| gross_weight_kg | decimal(10,2) | 包装毛重(kg) | |
| gross_weight_lbs | decimal(10,2) | 包装毛重(lbs) | |
| pcs_per_box | int(11) | 单箱数量 | |
| required_parts | text | 强关联物料 | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

## 开发环境设置

### 前置要求
- Docker & Docker Compose
- PHP 8.0+
- WordPress 6.0+
- MySQL 8.0+
- Node.js 16+
- pnpm 8.0+

### 开发环境配置

#### 1. 环境变量配置
开发环境使用 `.env.development` 文件配置环境变量：
```ini
# WordPress配置
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress
WORDPRESS_DEBUG=1

# MySQL配置
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress

# 前端配置
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1
VITE_USE_MOCK=false
```

#### 2. 启动开发环境
```bash
# 1. 克隆项目
git clone <repository_url>
cd bjt-product-system

# 2. 启动后端服务
docker-compose -f docker/dev/docker-compose.dev.yml up -d

# 3. 启动前端开发服务
cd frontend
pnpm install
pnpm dev

# 4. 访问服务
前端应用：http://localhost:5173
WordPress后台：http://localhost:8080/wp-admin
REST API：http://localhost:8080/wp-json/bjt/v1/
```

#### 3. 开发环境服务
- WordPress后台：http://localhost:8080/wp-admin
- REST API：http://localhost:8080/wp-json/bjt/v1/
- MySQL数据库：localhost:3306

### 开发工作流

#### 1. WordPress插件开发
- 插件开发在 `plugins/bjt-product-admin` 目录
- 页面模板在 `templates/admin` 目录
- 使用WordPress钩子和过滤器
- 遵循WordPress编码规范

#### 2. 后台页面开发
- 基于mockup实现对应的PHP模板
- 使用WordPress内置的样式和组件
- 通过AJAX实现无刷新交互
- 支持文件上传和媒体管理

#### 3. API开发
- 实现REST API接口
- 使用WordPress权限系统
- 支持多语言
- 数据验证和安全处理

#### 4. 数据库操作
- 使用WordPress的 `$wpdb`
- 事务处理
- 数据迁移
- 性能优化

## 部署说明

### 服务器规格要求

#### 1. 开发环境
- **硬件要求**：
  - CPU: 4核8线程
  - 内存: 16GB RAM
  - 存储: 256GB SSD
  - 网络: 100Mbps

#### 2. 测试环境
- **硬件要求**：
  - CPU: 8核16线程
  - 内存: 32GB RAM
  - 存储: 512GB SSD
  - 网络: 1Gbps

#### 3. 生产环境
- **硬件要求**：
  - CPU: 16核32线程
  - 内存: 64GB RAM
  - 存储: 
    - 系统盘: 512GB SSD
    - 数据盘: 2TB SSD (RAID 1)
    - 备份盘: 4TB HDD (RAID 5)
  - 网络: 10Gbps

#### 4. 软件要求
- **操作系统**：
  - CentOS 8 
- **Web服务器**：
  - Nginx 1.20+ 
  - Apache 2.4+ (可选)
- **数据库**：
  - MySQL 8.0+
  - Redis 6.0+ (缓存)
- **PHP环境**：
  - PHP 8.0+
  - PHP-FPM
  - 必要扩展：
    - mysql
    - redis
    - gd
    - curl
    - xml
    - mbstring
    - zip
- **Node环境**：
  - Node.js 16+
  - pnpm 8.0+

#### 5. 容器化要求
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **容器资源分配**：
  - WordPress容器：
    - CPU: 4核
    - 内存: 8GB
    - 存储: 20GB
  - MySQL容器：
    - CPU: 4核
    - 内存: 16GB
    - 存储: 100GB
  - Redis容器：
    - CPU: 2核
    - 内存: 4GB
    - 存储: 10GB
  - 前端容器：
    - CPU: 2核
    - 内存: 4GB
    - 存储: 10GB

#### 6. 网络要求
- **带宽**：
  - 内网：10Gbps
  - 外网：100Mbps以上
- **域名**：
  - 需要配置主域名和子域名
  - SSL证书（推荐使用通配符证书）
- **防火墙**：
  - 开放必要端口：80, 443, 3306, 6379
  - 配置安全组规则

#### 7. 监控要求
- **系统监控**：
  - CPU使用率
  - 内存使用率
  - 磁盘使用率
  - 网络流量
- **应用监控**：
  - PHP-FPM状态
  - Nginx/Apache状态
  - MySQL性能
  - Redis状态
- **日志收集**：
  - 系统日志
  - 应用日志
  - 访问日志
  - 错误日志

#### 8. 备份要求
- **数据备份**：
  - 数据库每日全量备份
  - 数据库每小时增量备份
  - 文件系统每周全量备份
- **备份存储**：
  - 本地存储
  - 远程存储（异地备份）
  - 云存储备份

### 阿里云ECS配置建议

#### 1. 生产环境主服务器
```
规格：ecs.g7.2xlarge
- CPU: 8核
- 内存: 32GB
- 系统盘: ESSD云盘 100GB
- 数据盘: ESSD云盘 500GB
- 带宽: 5Mbps
- 区域: 根据用户分布选择
```

#### 2. 数据库服务器
```
规格：ecs.r7.xlarge
- CPU: 4核
- 内存: 32GB
- 系统盘: ESSD云盘 100GB
- 数据盘: ESSD云盘 1TB
- 带宽: 5Mbps
- 区域: 与主服务器同区域
```

#### 3. 缓存服务器
```
规格：ecs.g6.large
- CPU: 2核
- 内存: 8GB
- 系统盘: ESSD云盘 40GB
- 带宽: 5Mbps
- 区域: 与主服务器同区域
```

#### 4. 测试环境
```
规格：ecs.g6.xlarge
- CPU: 4核
- 内存: 16GB
- 系统盘: ESSD云盘 100GB
- 数据盘: ESSD云盘 200GB
- 带宽: 5Mbps
```

#### 5. 开发环境
```
规格：ecs.g6.large
- CPU: 2核
- 内存: 8GB
- 系统盘: ESSD云盘 100GB
- 带宽: 5Mbps
```

#### 6. 其他配置建议

##### 6.1 网络配置
- 使用阿里云VPC网络
- 配置安全组规则
- 使用SLB负载均衡（如果需要）

##### 6.2 存储方案
- 使用ESSD云盘提供高性能存储
- 配置自动快照
- 使用OSS存储静态资源

##### 6.3 监控方案
- 使用阿里云监控
- 配置云监控告警
- 使用日志服务收集日志

##### 6.4 备份方案
- 使用阿里云备份服务
- 配置跨区域备份
- 使用OSS存储备份数据

##### 6.5 安全方案
- 使用阿里云WAF
- 配置DDoS防护
- 使用SSL证书

#### 7. 性能预估
- 静态内容：~5,000 QPS
- 动态API：~1,000 QPS
- 数据库查询：~500 QPS

#### 8. 扩展方案
如需更高性能，可通过以下方式扩展：
1. 增加服务器配置
2. 使用负载均衡
3. 配置读写分离
4. 使用CDN加速
5. 优化应用架构

### 生产环境部署
```bash
# 1. 配置环境变量
cp .env.example .env.production
# 编辑.env.production文件

# 2. 启动生产环境
docker-compose -f docker/prod/docker-compose.prod.yml up -d
```

### 性能优化建议
1. **服务器优化**：
   - 开启 PHP OPcache
   - 配置 MySQL 缓存
   - 使用 Redis 缓存
   - 配置 Nginx FastCGI 缓存

2. **应用优化**：
   - 启用页面缓存
   - 启用对象缓存
   - 配置 CDN
   - 图片优化和压缩

3. **数据库优化**：
   - 配置合适的缓冲池大小
   - 优化查询缓存
   - 定期维护索引
   - 配置主从复制

4. **安全配置**：
   - 配置 WAF
   - 启用 DDoS 防护
   - 定期安全扫描
   - 漏洞监控

## 开发规范

### WordPress插件开发规范
1. 使用WordPress钩子系统
2. 遵循WordPress编码标准
3. 使用prepare语句处理SQL
4. 权限检查和数据验证
5. 支持国际化

### 后台页面开发规范
1. 使用WordPress内置函数和API
2. 统一的错误处理
3. 表单验证和安全处理
4. 响应式设计
5. 用户体验优化

### 安全规范
1. 输入数据验证
2. SQL注入防护
3. XSS防护
4. CSRF防护
5. 文件上传安全

### 前端开发规范
1. 使用TypeScript进行开发
2. 遵循React最佳实践
3. 使用统一的状态管理
4. 实现响应式设计
5. 支持国际化

## 文档
- [API文档](docs/API-DOCUMENTATION.md)
- [数据库设计](docs/DATABASE-DESIGN.md)
- [任务清单](docs/TASK-LIST.md)

## 注意事项
1. 所有代码必须放在对应目录中
2. 前端代码必须经过TypeScript编译
3. API调用需要处理错误情况
4. 注意性能优化
5. 保持代码整洁和可维护性

## 技术栈
- 前端：React 18 + TypeScript + Vite + Ant Design
- 后端：WordPress (PHP 8.0+)
- 数据库：MySQL 8.0
- 容器化：Docker + Docker Compose
- 服务器：Nginx 1.20+

## 维护命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down
```

⚠️ 注意：请勿在 `bjt-front/bjt-front/`、`bjt-front/backend/`、`bjt-front/frontend/` 目录下开发或存放代码。所有代码请放在 `bjt-front/bjt-product-system/` 下的对应子目录！ 

## 前端功能模块

### 1. 首页/产品导航
- 顶部导航：公司logo、产品分类、文档下载、售后服务
- 语言切换功能
- 登录入口（无注册功能）
- 四个产品分类卡片展示
- 每个卡片包含：产品线图片、名称、描述、链接（主机选择、配件选择、配料、备件）
- 响应式设计：移动端导航转为汉堡菜单，卡片单列布局

### 2. 产品线主机和配件选择
- 顶部导航和面包屑
- 产品筛选属性
- 列表展示：
  - 产品图片、料号、名称、规格参数
  - 阶梯价格（根据账号类型）
  - 库存（销售账号可见）
  - 更多信息浮层（包装尺寸、毛重等）
  - 产品规格说明（PDF下载）
- 多级配件选择（最多5级）
- 浮动购物车预览
- 移动端适配：筛选区转为抽屉式菜单
- 必选备件功能：
  - 选择主机时自动添加必选备件
  - 选择配件时自动添加必选备件
  - 显示必选备件信息和数量
  - 支持修改必选备件数量
  - 必选备件价格自动计入总价
- 前端组件：
  - `src/components/RequiredParts/MachineRequiredParts.tsx`
  - `src/components/RequiredParts/AccessoryRequiredParts.tsx`
  - `src/components/RequiredParts/SparePartRequiredParts.tsx`
- 状态管理：
  - 必选备件列表状态
  - 数量修改状态
  - 价格计算状态

### 3. 耗材选择
- 筛选选项：Model、Unit、Shape（示例图）、Material
- Material相关筛选：
  - Paper类型：weight、width、Length
  - 其他类型：Thickness替代weight
- 列表展示：
  - 编号、产品图片、规格、属性
  - 适配型号、库存、阶梯价格
  - 更多信息（包装材质、公制/英制信息）
- 浮动购物车预览

### 4. 备件选择
- Model选项筛选
- Consumable/non-consumable筛选
- 列表展示：
  - 产品图片、料号、名称
  - 适配序列号
  - 包装尺寸、包装毛重
  - 阶梯价格（根据账号类型）
  - 库存（销售账号可见）
- 浮动购物车预览
- 必选备件功能：
  - 选择备件时自动添加关联的必选备件
  - 显示必选备件信息和数量
  - 支持修改必选备件数量
  - 必选备件价格自动计入总价

### 5. 购物流程
- 购物车管理
- 订单确认
- PO单生成
- 支付处理
- 订单跟踪
- 发票管理

### 6. 系统特性
- 多语言支持（默认英文）
- 多角色权限管理
- 响应式设计
- 实时库存和价格显示
- 用户认证和授权

## 后台管理页面结构

### 1. 系统首页 (index.php)
- **布局结构**：
  - 顶部导航：logo、产品分类、文档下载、售后服务、语言切换
  - 左侧树形导航：
    - 页面编辑
      - 产品线1编辑
      - 产品线2编辑
      - 产品线3编辑
      - 产品线4编辑
    - 产品线管理
      - 气垫机
        - 主机管理
        - 配件管理
        - 耗材管理
        - 备件管理
      - 纸机
        - 主机管理
        - 配件管理
        - 耗材管理
        - 备件管理
      - 胶带机
        - 主机管理
        - 配件管理
        - 耗材管理
        - 备件管理
      - 气柱袋
        - 主机管理
        - 配件管理
        - 耗材管理
        - 备件管理
  - 右侧内容区

### 2. 产品线页面编辑
- **编辑功能**：
  - 标题（中/英）
  - 说明（中/英）
  - 子项1-耗材（中/英）
  - 子项2-备件（中/英）
  - 图片上传功能

### 3. 产品线管理模块
每个产品线（气垫机/纸机/胶带机/气柱袋）都包含以下管理功能：

#### 3.1 主机管理
- **主机列表页面**：
  - 主机型号表（编号、型号、操作）
  - 料号表（筛选功能、编号、型号、料号、操作）
- **主机编辑页面**：
  - 型号信息
  - 中英文说明
  - 图片上传
- **料号编辑页面**：
  - PN输入（唯一性验证）
  - CRM系统集成（自动获取信息）
- **必选备件管理页面**：
  - 显示当前主机的必选备件列表
  - 添加/编辑/删除必选备件
  - 设置必选备件数量
  - 添加备件说明
  - 启用/禁用必选备件关系

#### 3.2 配件管理
- **配件列表页面**：
  - 配件型号表（编号、型号名称、操作）
  - 料号表（筛选功能、编号、型号、料号、操作）
- **配件新增/编辑页面**：
  - 型号信息（唯一性验证）
  - 中英文描述
  - 图片上传
- **必选备件管理页面**：
  - 显示当前配件的必选备件列表
  - 添加/编辑/删除必选备件
  - 设置必选备件数量
  - 添加备件说明
  - 启用/禁用必选备件关系

#### 3.3 耗材管理
- **耗材列表页面**：
  - 料号表（筛选功能）
  - 形状表
  - 材料表
  - 规格尺寸表（厚度、克重、宽度、长度）
- **耗材新增/编辑页面**：
  - 基本信息
  - 规格信息（公制/英制）
  - 适用主机选择

#### 3.4 备件管理
- **备件列表页面**：
  - 筛选功能
  - 料号表（编号、型号、料号、操作）
- **备件新增/编辑页面**：
  - 料号信息（CRM集成）
  - 适用主机选择
  - 序列号管理
  - 多语言支持
- **必选备件管理页面**：
  - 显示当前备件的必选备件列表
  - 添加/编辑/删除必选备件
  - 设置必选备件数量
  - 添加备件说明
  - 启用/禁用必选备件关系

### 目录结构调整
```
plugins/bjt-product-admin/
├── includes/
│   ├── admin/
│   │   ├── class-bjt-product-line-page.php      # 产品线页面编辑
│   │   └── product-lines/                       # 产品线管理
│   │       ├── air-cushion/                     # 气垫机
│   │       │   ├── class-bjt-machine.php        # 主机管理
│   │       │   ├── class-bjt-accessory.php      # 配件管理
│   │       │   ├── class-bjt-consumable.php     # 耗材管理
│   │       │   └── class-bjt-spare-part.php     # 备件管理
│   │       ├── paper/                           # 纸机
│   │       ├── tape/                            # 胶带机
│   │       └── air-column/                      # 气柱袋
│   ├── api/
│   └── functions.php
└── templates/
    └── admin/
        ├── index.php                            # 系统首页
        ├── product-line-page/                   # 产品线页面编辑
        └── product-lines/                       # 产品线管理
            ├── air-cushion/                     # 气垫机
            │   ├── machines/                    # 主机管理模板
            │   ├── accessories/                 # 配件管理模板
            │   ├── consumables/                 # 耗材管理模板
            │   └── spare-parts/                 # 备件管理模板
            ├── paper/                           # 纸机
            ├── tape/                            # 胶带机
            └── air-column/                      # 气柱袋
```

### 4. 数据库表结构

#### 4.1 产品线表 (wp_bjt_product_lines)
- 存储所有产品线的基本信息
- 字段包括：标题（中/英）、描述（中/英）、子项（中/英）、图片等
- 支持多语言和排序功能

#### 4.2 主机型号表 (wp_bjt_host_models)
- 存储所有产品线的主机型号信息
- 字段包括：产品线标识、型号编码、名称（中/英）、描述（中/英）、类型等
- 支持图片和文档管理

#### 4.3 配件型号表 (wp_bjt_accessory_models)
- 存储所有产品线的配件型号信息
- 字段包括：产品线标识、型号编码、名称（中/英）、描述（中/英）、类型等
- 支持图片和文档管理

#### 4.4 主机料号表 (wp_bjt_parts)
- 存储所有产品线的主机料号信息
- 字段包括：产品线标识、型号、电压、料号、规格参数（公制/英制）等
- 支持包装和托盘信息管理

#### 4.5 配件料号表 (wp_bjt_accessories)
- 存储所有产品线的配件料号信息
- 字段包括：产品线标识、型号、料号、规格参数（公制/英制）等
- 支持包装和托盘信息管理

#### 4.6 耗材表 (wp_bjt_consumables)
- 存储所有产品线的耗材信息
- 字段包括：产品线标识、型号、料号、规格参数（公制/英制）等
- 支持多种打托方式（A/B/C）

#### 4.7 备件料号表 (wp_bjt_spare_parts)
- 存储所有产品线的备件信息
- 字段包括：产品线标识、适配机型、料号、规格参数（公制/英制）等
- 支持必选备件关联

#### 4.8 关联关系表 (wp_bjt_relations)
- 存储产品之间的层级关系
- 字段包括：产品线标识、父项料号、子项料号、层级、数量等
- 支持主机-配件-备件的多级关系

#### 4.9 耗材基础数据表
- **形状表** (wp_bjt_shapes)：存储耗材形状信息
- **材料表** (wp_bjt_materials)：存储耗材材料信息
- **规格尺寸表** (wp_bjt_specifications)：存储标准规格尺寸
- **耗材主机适配表** (wp_bjt_consumable_compatibility)：存储耗材与主机的兼容关系

#### 4.10 通用功能表
- **价格表** (wp_bjt_prices)：存储所有产品的价格信息
- **库存表** (wp_bjt_inventory)：存储所有产品的库存信息

### 5. 数据关系

#### 5.1 主要关系
1. 所有表都包含 product_line 字段，用于区分不同产品线的数据
2. 价格和库存通过统一的表进行管理，使用 target_type 和 target_id 关联具体产品
3. 关联关系表统一维护产品之间的层级关系，包括：
   - 主机与配件的关系
   - 配件与子配件的关系
   - 配件与备件的关系
   - 主机配件组合与其必选备件的关系
4. 备件表中的必选备件字段（required_parts和required_quantity）用于指定选择该备件时需要默认增加的其他备件
5. 耗材管理通过基础数据表（形状、材料、规格尺寸）来维护耗材的标准化数据
6. 耗材主机适配表维护耗材与主机型号之间的兼容关系

#### 5.2 产品线类型
产品线标识（product_line）包括：
- air_cushion: 气垫机
- paper_machine: 纸机
- tape_machine: 胶带机
- air_column: 气柱袋

## 系统映射关系

### 1. 产品线管理

#### 1.1 产品线列表/编辑
- **前端页面**: `src/pages/Home/ProductLines`
- **后台页面**: `templates/admin/product-lines/edit.php`
- **API接口**: 
  - `GET /wp-json/bjt/v1/product-lines` - 获取产品线列表
  - `GET /wp-json/bjt/v1/product-lines/{id}` - 获取单个产品线
  - `POST /wp-json/bjt/v1/product-lines` - 创建产品线
  - `PUT /wp-json/bjt/v1/product-lines/{id}` - 更新产品线
- **数据表**: 
  - `wp_bjt_product_lines` - 产品线基础信息

### 2. 主机管理

#### 2.1 主机型号管理
- **前端页面**: `src/pages/Products/Selection/Machines`
- **后台页面**: `templates/admin/machines/list.php`, `edit.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/host-models` - 获取主机型号列表
  - `GET /wp-json/bjt/v1/host-models/{id}` - 获取单个主机型号
  - `POST /wp-json/bjt/v1/host-models` - 创建主机型号
  - `PUT /wp-json/bjt/v1/host-models/{id}` - 更新主机型号
- **数据表**:
  - `wp_bjt_host_models` - 主机型号信息
  - `wp_bjt_parts` - 主机料号信息

#### 2.2 主机料号管理
- **前端页面**: `src/pages/Products/Selection/Parts`
- **后台页面**: `templates/admin/machines/part-edit.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/parts` - 获取料号列表
  - `GET /wp-json/bjt/v1/parts/{id}` - 获取单个料号
  - `POST /wp-json/bjt/v1/parts` - 创建料号
  - `PUT /wp-json/bjt/v1/parts/{id}` - 更新料号
- **数据表**:
  - `wp_bjt_parts` - 主机料号信息
  - `wp_bjt_prices` - 价格信息
  - `wp_bjt_inventory` - 库存信息

### 3. 配件管理

#### 3.1 配件型号管理
- **前端页面**: `src/pages/Products/Selection/Accessories`
- **后台页面**: `templates/admin/accessories/list.php`, `edit.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/accessory-models` - 获取配件型号列表
  - `GET /wp-json/bjt/v1/accessory-models/{id}` - 获取单个配件型号
  - `POST /wp-json/bjt/v1/accessory-models` - 创建配件型号
  - `PUT /wp-json/bjt/v1/accessory-models/{id}` - 更新配件型号
- **数据表**:
  - `wp_bjt_accessory_models` - 配件型号信息
  - `wp_bjt_accessories` - 配件料号信息

#### 3.2 配件关联关系
- **前端页面**: `src/pages/Products/Selection/Relations`
- **后台页面**: `templates/admin/accessories/relations.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/relations` - 获取关联关系列表
  - `POST /wp-json/bjt/v1/relations` - 创建关联关系
  - `PUT /wp-json/bjt/v1/relations/{id}` - 更新关联关系
  - `DELETE /wp-json/bjt/v1/relations/{id}` - 删除关联关系
- **数据表**:
  - `wp_bjt_relations` - 产品关联关系

### 4. 耗材管理

#### 4.1 耗材基础数据
- **前端页面**: `src/pages/Products/Consumables/Settings`
- **后台页面**: `templates/admin/consumables/settings.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/shapes` - 获取形状列表
  - `GET /wp-json/bjt/v1/materials` - 获取材料列表
  - `GET /wp-json/bjt/v1/specifications` - 获取规格列表
- **数据表**:
  - `wp_bjt_shapes` - 形状信息
  - `wp_bjt_materials` - 材料信息
  - `wp_bjt_specifications` - 规格信息

#### 4.2 耗材管理
- **前端页面**: `src/pages/Products/Consumables/List`
- **后台页面**: `templates/admin/consumables/list.php`, `edit.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/consumables` - 获取耗材列表
  - `GET /wp-json/bjt/v1/consumables/{id}` - 获取单个耗材
  - `POST /wp-json/bjt/v1/consumables` - 创建耗材
  - `PUT /wp-json/bjt/v1/consumables/{id}` - 更新耗材
- **数据表**:
  - `wp_bjt_consumables` - 耗材信息
  - `wp_bjt_consumable_compatibility` - 耗材适配关系

### 5. 备件管理

#### 5.1 备件管理
- **前端页面**: `src/pages/Products/SpareParts/List`
- **后台页面**: `templates/admin/spare-parts/list.php`, `edit.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/spare-parts` - 获取备件列表
  - `GET /wp-json/bjt/v1/spare-parts/{id}` - 获取单个备件
  - `POST /wp-json/bjt/v1/spare-parts` - 创建备件
  - `PUT /wp-json/bjt/v1/spare-parts/{id}` - 更新备件
- **数据表**:
  - `wp_bjt_spare_parts` - 备件信息

#### 5.2 必选备件关系
- **前端页面**: `src/pages/Products/SpareParts/Required`
- **后台页面**: `templates/admin/spare-parts/required.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/required-parts` - 获取必选备件关系
  - `POST /wp-json/bjt/v1/required-parts` - 创建必选备件关系
  - `PUT /wp-json/bjt/v1/required-parts/{id}` - 更新必选备件关系
  - `DELETE /wp-json/bjt/v1/required-parts/{id}` - 删除必选备件关系
- **数据表**:
  - `wp_bjt_relations` - 关联关系表（包含必选备件信息）

### 6. 通用功能

#### 6.1 价格管理
- **前端页面**: `src/components/PriceDisplay`
- **后台页面**: `templates/admin/prices/manage.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/prices/batch` - 批量获取价格
  - `POST /wp-json/bjt/v1/prices/batch` - 批量更新价格
- **数据表**:
  - `wp_bjt_prices` - 价格信息

#### 6.2 库存管理
- **前端页面**: `src/components/InventoryDisplay`
- **后台页面**: `templates/admin/inventory/manage.php`
- **API接口**:
  - `GET /wp-json/bjt/v1/inventory/batch` - 批量获取库存
  - `POST /wp-json/bjt/v1/inventory/batch` - 批量更新库存
- **数据表**: