# 产品线管理页面开发指南

## 1. 页面基本信息

- **页面名称**: 产品线列表
- **页面路径**: templates/admin/product-lines/list.php
- **对应 Mockup**: 产品线管理界面 (1.html)
- **优先级**: P0 (核心功能，必须实现)

## 2. 数据关系

### 2.1 数据表关联
- **主表**: `wp_bjt_product_lines` (产品线主表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `title_cn`: varchar(255) - 中文标题
    - `title_en`: varchar(255) - 英文标题
    - `description_cn`: text - 中文描述
    - `description_en`: text - 英文描述
    - `subitem1_cn`: varchar(255) - 子项1中文
    - `subitem1_en`: varchar(255) - 子项1英文
    - `subitem2_cn`: varchar(255) - 子项2中文
    - `subitem2_en`: varchar(255) - 子项2英文
    - `subitem3_cn`: varchar(255) - 子项3中文
    - `subitem3_en`: varchar(255) - 子项3英文
    - `image_url`: varchar(255) - 图片URL
    - `status`: varchar(20) - 状态，默认值'publish'
    - `menu_order`: int(11) - 排序顺序，默认值0
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

### 2.2 API 接口
// ... existing code ... 
 