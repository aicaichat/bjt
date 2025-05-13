# BJT Product Management System API

This WordPress plugin provides a custom REST API for the BJT Product Management System, allowing interaction with product data, user authentication, shopping cart functionality, and order management.

## Installation

1. Upload the `bjt-product-api` folder to the `/wp-content/plugins/` directory of your WordPress installation.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. The API will be available at `/wp-json/bjt/v1/`.

## API Documentation

### Base URL

All API endpoints are available at:

```
/wp-json/bjt/v1
```

### Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
  "data": { ... },
  "message": "Success/Error message",
  "code": 1001 // Error code, only present in error responses
}
```

### Authentication

The API uses JWT token-based authentication.

#### Login

Authenticate and get a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "username": "your_username",
    "password": "your_password"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_string",
      "expires_in": 86400,
      "user": {
        "id": 123,
        "username": "username",
        "email": "email@example.com",
        "name": "Name",
        "role": "SALES",
        "region": "CN",
        "vipLevel": 2,
        "type": "vip"
      }
    }
  }
  ```

#### Get Current User Info

Get the authenticated user's details.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": 123,
      "username": "username",
      "email": "email@example.com",
      "name": "Name",
      "role": "SALES",
      "region": "CN",
      "vipLevel": 2,
      "type": "vip",
      "permissions": ["view_prices", "view_inventory", "add_to_cart"]
    }
  }
  ```

#### Refresh Token

Refresh an existing JWT token.

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Authentication**: Required (even with expired token)
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "token": "new_jwt_token_string",
      "expires_in": 86400
    }
  }
  ```

#### Logout

Invalidate the current JWT token.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Authentication**: Required
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "已成功退出"
  }
  ```

### Machines

#### Get Machine List

Get a list of machines with optional filtering.

- **URL**: `/machines`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `region` (optional): Region code, default is the user's region
  - `lang` (optional): Language, default is `zh`
  - `page` (optional): Page number, default is 1
  - `page_size` (optional): Items per page, default is 10
  - `category` (optional): Machine category
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "MEY-001",
          "model": "MEY",
          "name": "气垫机 Pro - MEY系列",
          "subtitle": "高效气泡缓冲包装解决方案",
          "description": "产品描述...",
          "image_url": "/images/shop/MEY.jpg",
          "specs": {
            "电压": "220V/110V",
            "功率": "250W",
            "尺寸": "560 x 350 x 334 mm",
            "重量": "13.5 kg"
          },
          "inventory": [
            {"region": "CN", "amount": 245},
            {"region": "EU", "amount": 78},
            {"region": "NA", "amount": 120},
            {"region": "AU", "amount": 46}
          ],
          "prices": {
            "base": 12800,
            "tier1": 12000,
            "tier2": 11500,
            "vip": 11000
          }
        }
      ],
      "total": 6,
      "page": 1,
      "page_size": 10,
      "total_pages": 1
    }
  }
  ```

#### Get Machine Details

Get details for a specific machine.

- **URL**: `/machines/{machine_id}`
- **Method**: `GET`
- **Authentication**: Required
- **Path Parameters**:
  - `machine_id`: Machine ID
- **Query Parameters**:
  - `region` (optional): Region code, default is the user's region
  - `lang` (optional): Language, default is `zh`
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "MEY-001",
      "model": "MEY",
      "name": "气垫机 Pro - MEY系列",
      "subtitle": "高效气泡缓冲包装解决方案",
      "description": "详细描述信息...",
      "image_url": "/images/shop/MEY.jpg",
      "images": [
        "/images/shop/MEY_1.jpg",
        "/images/shop/MEY_2.jpg"
      ],
      "specs": {
        "电压": "220V/110V",
        "功率": "250W",
        "尺寸": "560 x 350 x 334 mm",
        "重量": "13.5 kg"
      },
      "inventory": [
        {"region": "CN", "amount": 245},
        {"region": "EU", "amount": 78},
        {"region": "NA", "amount": 120},
        {"region": "AU", "amount": 46}
      ],
      "prices": {
        "base": 12800,
        "tier1": 12000,
        "tier2": 11500,
        "vip": 11000
      },
      "features": [
        "高效率气垫制造",
        "自动换卷功能",
        "智能压力控制"
      ],
      "documents": [
        {
          "name": "产品说明书",
          "url": "/docs/MEY_manual.pdf",
          "type": "pdf"
        },
        {
          "name": "规格参数表",
          "url": "/docs/MEY_specs.pdf",
          "type": "pdf"
        }
      ],
      "videos": [
        {
          "title": "产品演示视频",
          "url": "https://www.youtube.com/watch?v=abcdefg",
          "thumbnail": "/images/shop/MEY_video_thumb.jpg"
        }
      ]
    }
  }
  ```

#### Get Machine Accessories

Get a list of accessories for a specific machine.

- **URL**: `/machines/{machine_id}/accessories`
- **Method**: `GET`
- **Authentication**: Required
- **Path Parameters**:
  - `machine_id`: Machine ID
- **Query Parameters**:
  - `level` (optional): Accessory level, default is 1
  - `region` (optional): Region code, default is the user's region
  - `lang` (optional): Language, default is `zh`
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "FS-001",
          "model": "Floor Stand",
          "title": "地面支架组件",
          "level": 1,
          "image_url": "/images/shop/FS-001.jpg",
          "parts": [
            {
              "id": "BJT-FS-V2-2024",
              "part_number": "BJT-FS-V2-2024",
              "title": "标准地面支架",
              "specs": {
                "电压": "N/A",
                "频率": "N/A",
                "托盘尺寸": "90×70×120cm",
                "一托数量": "16件"
              },
              "spec": "90×70×120cm, 7.8kg",
              "spec_imperial": "35.4×27.6×47.2inch, 17.2lbs",
              "prices": {
                "base": 85,
                "tier1": 75,
                "tier2": 65,
                "vip": 55
              },
              "inventory": [
                {"region": "CN", "amount": 156},
                {"region": "EU", "amount": 16},
                {"region": "NA", "amount": 24},
                {"region": "AU", "amount": 12}
              ]
            }
          ]
        }
      ],
      "total": 2
    }
  }
  ```

### Accessories

#### Get Accessory Details

Get details for a specific accessory.

- **URL**: `/accessories/{accessory_id}`
- **Method**: `GET`
- **Authentication**: Required
- **Path Parameters**:
  - `accessory_id`: Accessory ID
- **Query Parameters**:
  - `region` (optional): Region code, default is the user's region
  - `lang` (optional): Language, default is `zh`
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "FS-001",
      "model": "Floor Stand",
      "title": "地面支架组件",
      "level": 1,
      "image_url": "/images/shop/FS-001.jpg",
      "description": "稳固耐用的地面支架，适用于MEY系列气垫机。",
      "parts": [
        {
          "id": "BJT-FS-V2-2024",
          "part_number": "BJT-FS-V2-2024",
          "title": "标准地面支架",
          "specs": {
            "电压": "N/A",
            "频率": "N/A",
            "托盘尺寸": "90×70×120cm",
            "一托数量": "16件"
          },
          "spec": "90×70×120cm, 7.8kg",
          "spec_imperial": "35.4×27.6×47.2inch, 17.2lbs",
          "prices": {
            "base": 85,
            "tier1": 75,
            "tier2": 65,
            "vip": 55
          },
          "inventory": [
            {"region": "CN", "amount": 156},
            {"region": "EU", "amount": 16},
            {"region": "NA", "amount": 24},
            {"region": "AU", "amount": 12}
          ]
        }
      ],
      "compatible_machines": [
        {
          "id": "MEY-001",
          "name": "气垫机 Pro - MEY系列"
        }
      ]
    }
  }
  ```

### Additional Endpoint Groups

For more detailed information about additional endpoints, refer to:

- **Consumables Endpoints**: `/product-lines/{product_line_id}/consumables`
- **Product Line Endpoints**: `/product-lines`
- **Cart Endpoints**: `/cart`, `/cart/add`, `/cart/update`, `/cart/clear`
- **Order Endpoints**: `/orders`

## Error Codes

| Code  | Description                |
|-------|----------------------------|
| 1001  | 用户名或密码错误             |
| 1002  | 未授权访问                   |
| 2001  | 找不到指定的设备              |
| 3001  | 找不到指定的配件              |

## Development

### Database Schema

The plugin creates the following custom tables in the WordPress database:

- `{prefix}_bjt_machines`: Stores machine data
- `{prefix}_bjt_accessories`: Stores accessory data
- `{prefix}_bjt_parts`: Stores part data
- `{prefix}_bjt_machine_accessories`: Maps machines to accessories
- `{prefix}_bjt_inventory`: Stores inventory data
- `{prefix}_bjt_pricing`: Stores pricing data
- `{prefix}_bjt_cart_items`: Stores shopping cart items
- `{prefix}_bjt_orders`: Stores order data
- `{prefix}_bjt_order_items`: Stores order item data

### Extending the API

To add new endpoints, modify the `register_rest_routes` method in the main plugin class and add corresponding handler methods.

## Support

For technical support or feature requests, please contact the plugin developer.

## License

This plugin is licensed under the GPL v2 or later. 