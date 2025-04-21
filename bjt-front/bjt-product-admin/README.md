# BJT Product Management System

A WordPress plugin for managing product lines, products, features, and specifications with multi-language support.

## Features

- Product Line Management
- Product Management
- Feature Management with Images
- Technical Specifications
- Multi-language Support (English/Chinese)
- Media Library Integration
- Drag-and-Drop Sorting
- Responsive Admin Interface

## Installation

1. Download the plugin zip file
2. Go to WordPress admin panel > Plugins > Add New
3. Click "Upload Plugin" and select the downloaded zip file
4. Click "Install Now" and then "Activate"

## Usage

### Product Lines

1. Go to WordPress admin panel > BJT Products > Product Lines
2. Click "Add New" to create a product line
3. Fill in the product line details:
   - Title (English/Chinese)
   - Description (English/Chinese)
   - Status
   - Sort Order

### Products

1. Go to WordPress admin panel > BJT Products > Products
2. Click "Add New" to create a product
3. Fill in the product details:
   - Title (English/Chinese)
   - Product Code
   - Product Line
   - Status
   - Sort Order
   - Features
   - Specifications

### Features

1. When editing a product, use the "Product Features" meta box
2. Click "Add Feature" to add a new feature
3. Fill in the feature details:
   - Title (English/Chinese)
   - Description (English/Chinese)
   - Image (optional)
4. Drag and drop to reorder features

### Specifications

1. When editing a product, use the "Product Specifications" meta box
2. Click "Add Specification" to add a new specification
3. Fill in the specification details:
   - Name (English/Chinese)
   - Value (English/Chinese)
4. Drag and drop to reorder specifications

### Media Management

1. Go to WordPress admin panel > BJT Products > Media Library
2. Upload and manage product images
3. Images can be used in product features and product details

## Requirements

- WordPress 5.0 or higher
- PHP 7.2 or higher
- MySQL 5.6 or higher

## Development

### File Structure

```
bjt-product-admin/
├── assets/
│   ├── css/
│   │   └── admin-styles.css
│   └── js/
│       └── product-admin.js
├── includes/
│   └── admin/
│       ├── admin-menu.php
│       ├── dashboard.php
│       └── product-management.php
├── languages/
├── bjt-product-admin.php
└── README.md
```

### Adding New Features

1. Create new files in the appropriate directories
2. Include new files in the main plugin file
3. Add necessary hooks and functions
4. Update the admin interface as needed

### Customization

The plugin can be customized by:

1. Modifying CSS in `admin-styles.css`
2. Adding JavaScript functionality in `product-admin.js`
3. Extending PHP functions in the plugin files
4. Using WordPress filters and actions

## Support

For support, please contact the development team or create an issue in the repository.

## License

This plugin is proprietary software. All rights reserved.

## Changelog

### 1.0.0
- Initial release
- Basic product management functionality
- Multi-language support
- Media management
- Feature and specification management 

<rules>
1. 参数顺序规则：
   - 必选参数必须放在可选参数之前
   - 可选参数应该放在参数列表的最后
   - 示例：`function get_child_accessories($model, $level, $parent_part_number = null)`

2. 空值处理规则：
   - 所有可能为 null 的值必须在使用前进行安全检查
   - 使用 `bjt_is_null_or_empty()` 函数检查空值
   - 对于字符串操作，使用安全包装函数：
     - `bjt_safe_strpos()` 替代 `strpos`
     - `bjt_safe_str_replace()` 替代 `str_replace`
     - `bjt_safe_sanitize_text_field()` 替代 `sanitize_text_field`
     - `bjt_safe_wp_kses_post()` 替代 `wp_kses_post`
     - `bjt_safe_wp_unslash()` 替代 `wp_unslash`
     - `bjt_safe_wp_parse_args()` 替代 `wp_parse_args`

3. 类型检查规则：
   - 对函数参数进行类型检查
   - 确保参数类型符合预期
   - 对于数字类型，确保是有效的数字
   - 对于字符串类型，确保是有效的字符串

4. 返回值处理规则：
   - 当输入无效时返回安全的默认值
   - 字符串操作返回空字符串而不是 null
   - 数组操作返回空数组而不是 null
   - 数字操作返回 0 而不是 null

5. 错误处理规则：
   - 使用 WordPress 的错误处理机制
   - 返回 `WP_Error` 对象而不是抛出异常
   - 提供清晰的错误消息

6. 数据库操作规则：
   - 使用 `$wpdb->prepare()` 进行 SQL 查询
   - 对用户输入进行适当的转义
   - 使用事务处理多个相关操作

7. 安全函数实现规则：
   - 所有安全函数必须检查输入类型
   - 所有安全函数必须处理 null 值
   - 所有安全函数必须返回安全的默认值
   - 所有安全函数必须进行参数验证
</rules>