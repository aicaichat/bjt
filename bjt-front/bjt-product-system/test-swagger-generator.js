/**
 * BJT产品管理系统 Swagger文档生成器
 * 
 * 这个脚本基于API接口文档自动生成Swagger OpenAPI文档
 * 可以将生成的JSON导入Swagger UI或Postman进行查看和测试
 */

const fs = require('fs');
const path = require('path');

// API基础信息
const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'BJT产品管理系统 API',
    description: '包含认证、设备选型、配件、耗材、备件、购物车和订单等功能的API',
    version: 'v1.0.0',
    contact: {
      name: 'BJT开发团队',
      email: 'dev@bjt.example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8080/wp-json/bjt/v1',
      description: '本地开发环境'
    },
    {
      url: 'https://api.bjt.example.com/wp-json/bjt/v1',
      description: '生产环境'
    }
  ],
  tags: [
    { name: '认证', description: '用户登录、令牌管理和用户信息' },
    { name: '设备选型', description: '获取设备列表、详情和配件' },
    { name: '配件', description: '配件信息和兼容性' },
    { name: '耗材', description: '耗材信息、价格和库存' },
    { name: '产品线', description: '产品线信息和关联产品' },
    { name: '备件', description: '备件信息和兼容性' },
    { name: '购物车', description: '购物车管理' },
    { name: '订单', description: '订单创建和管理' },
    { name: '数据字典', description: '系统配置和枚举值' },
    { name: '价格与库存', description: '实时价格和库存查询' }
  ],
  paths: {},
  components: {
    schemas: {
      // 标准响应模型
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: '操作成功' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: '错误描述' },
          code: { type: 'integer', example: 1001 }
        }
      },
      // 用户模型
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 123 },
          username: { type: 'string', example: 'user123' },
          email: { type: 'string', example: 'user@example.com' },
          name: { type: 'string', example: '张三' },
          role: { type: 'string', example: 'SALES' },
          region: { type: 'string', example: 'CN' },
          vipLevel: { type: 'integer', example: 2 },
          type: { type: 'string', example: 'vip' },
          permissions: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['view_prices', 'view_inventory', 'add_to_cart']
          }
        }
      },
      // 设备模型
      Machine: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'MEY-001' },
          model: { type: 'string', example: 'MEY' },
          name: { type: 'string', example: '气垫机 Pro - MEY系列' },
          subtitle: { type: 'string', example: '高效气泡缓冲包装解决方案' },
          description: { type: 'string', example: '产品描述...' },
          image_url: { type: 'string', example: '/images/shop/MEY.jpg' },
          specs: { 
            type: 'object',
            additionalProperties: { type: 'string' },
            example: {
              '电压': '220V/110V',
              '功率': '250W',
              '尺寸': '560 x 350 x 334 mm',
              '重量': '13.5 kg'
            }
          },
          inventory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                region: { type: 'string', example: 'CN' },
                amount: { type: 'integer', example: 245 }
              }
            }
          },
          prices: {
            type: 'object',
            properties: {
              base: { type: 'number', example: 12800 },
              tier1: { type: 'number', example: 12000 },
              tier2: { type: 'number', example: 11500 },
              vip: { type: 'number', example: 11000 }
            }
          }
        }
      },
      // 配件模型
      Accessory: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'FS-001' },
          model: { type: 'string', example: 'Floor Stand' },
          title: { type: 'string', example: '地面支架组件' },
          level: { type: 'integer', example: 1 },
          image_url: { type: 'string', example: '/images/shop/FS-001.jpg' },
          parts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'BJT-FS-V2-2024' },
                part_number: { type: 'string', example: 'BJT-FS-V2-2024' },
                title: { type: 'string', example: '标准地面支架' },
                specs: { type: 'object' },
                spec: { type: 'string', example: '90×70×120cm, 7.8kg' },
                spec_imperial: { type: 'string', example: '35.4×27.6×47.2inch, 17.2lbs' },
                prices: { type: 'object' },
                inventory: { type: 'array' }
              }
            }
          }
        }
      },
      // 耗材模型
      Consumable: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'CONS-001' },
          product_line_id: { type: 'string', example: 'LINE-001' },
          product_id: { type: 'string', example: 'BJT-CONS-001' },
          model: { type: 'string', example: 'LP-V1' },
          brand: { type: 'string', example: 'BJT' },
          part_number: { type: 'string', example: 'BJT-CONS-001-2024' },
          specifications: { type: 'object' },
          compatibility: { type: 'object' },
          pricing: { type: 'array' },
          inventory: { type: 'object' }
        }
      },
      // 产品线模型
      ProductLine: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'LINE-001' },
          code: { type: 'string', example: 'LP' },
          name_cn: { type: 'string', example: '气垫机产品线' },
          name_en: { type: 'string', example: 'Air Cushion Machine Line' },
          description_cn: { type: 'string', example: '气垫机产品线描述' },
          description_en: { type: 'string', example: 'Air Cushion Machine Line Description' },
          status: { type: 'string', example: 'active' }
        }
      },
      // 备件模型
      SparePart: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'SP-001' },
          name: { type: 'string', example: '打印头' },
          model: { type: 'string', example: 'TH-300P' },
          description: { type: 'string', example: '热敏打印头' },
          image_url: { type: 'string', example: '/images/parts/TH-300P.jpg' },
          price: { type: 'number', example: 2200 }
        }
      },
      // 购物车模型
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'CART-001' },
          user_id: { type: 'integer', example: 123 },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                item_type: { type: 'string', example: 'machine' },
                item_id: { type: 'string', example: 'MEY-001' },
                quantity: { type: 'integer', example: 1 },
                price: { type: 'number', example: 12800 }
              }
            }
          },
          total_price: { type: 'number', example: 12800 }
        }
      },
      // 订单模型
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ORD-001' },
          user_id: { type: 'integer', example: 123 },
          status: { type: 'string', example: 'pending' },
          items: { type: 'array' },
          shipping_address: { type: 'object' },
          total_price: { type: 'number', example: 12800 },
          created_at: { type: 'string', example: '2024-04-25T10:30:15Z' }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// 添加认证相关API端点
swaggerDoc.paths['/auth/login'] = {
  post: {
    tags: ['认证'],
    summary: '用户登录',
    description: '用户登录并获取JWT令牌',
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string', example: '用户名' },
              password: { type: 'string', example: '密码' }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: '登录成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'jwt_token_string' },
                    expires_in: { type: 'integer', example: 86400 },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      },
      '401': {
        description: '登录失败',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  }
};

swaggerDoc.paths['/user/me'] = {
  get: {
    tags: ['认证'],
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息',
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      },
      '401': {
        description: '未授权',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  }
};

swaggerDoc.paths['/auth/refresh'] = {
  post: {
    tags: ['认证'],
    summary: '刷新令牌',
    description: '刷新JWT令牌以延长会话时间',
    responses: {
      '200': {
        description: '刷新成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'new_jwt_token_string' },
                    expires_in: { type: 'integer', example: 86400 }
                  }
                }
              }
            }
          }
        }
      },
      '401': {
        description: '无效的刷新令牌',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  }
};

swaggerDoc.paths['/auth/logout'] = {
  post: {
    tags: ['认证'],
    summary: '退出登录',
    description: '使当前令牌失效，完成退出登录',
    responses: {
      '200': {
        description: '退出成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: '已成功退出' }
              }
            }
          }
        }
      }
    }
  }
};

// 添加设备相关API端点
swaggerDoc.paths['/machines'] = {
  get: {
    tags: ['设备选型'],
    summary: '获取设备列表',
    description: '获取所有可用设备的列表，支持分页',
    parameters: [
      {
        name: 'region',
        in: 'query',
        description: '区域代码',
        schema: { type: 'string', enum: ['CN', 'EU', 'NA', 'AU'] }
      },
      {
        name: 'lang',
        in: 'query',
        description: '语言',
        schema: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      },
      {
        name: 'page',
        in: 'query',
        description: '页码',
        schema: { type: 'integer', default: 1 }
      },
      {
        name: 'page_size',
        in: 'query',
        description: '每页数量',
        schema: { type: 'integer', default: 10 }
      },
      {
        name: 'category',
        in: 'query',
        description: '设备类别',
        schema: { type: 'string' }
      }
    ],
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Machine' }
                    },
                    total: { type: 'integer', example: 6 },
                    page: { type: 'integer', example: 1 },
                    page_size: { type: 'integer', example: 10 },
                    total_pages: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

swaggerDoc.paths['/machines/{machine_id}'] = {
  get: {
    tags: ['设备选型'],
    summary: '获取设备详情',
    description: '获取单个设备的详细信息',
    parameters: [
      {
        name: 'machine_id',
        in: 'path',
        required: true,
        description: '设备ID',
        schema: { type: 'string' }
      },
      {
        name: 'region',
        in: 'query',
        description: '区域代码',
        schema: { type: 'string', enum: ['CN', 'EU', 'NA', 'AU'] }
      },
      {
        name: 'lang',
        in: 'query',
        description: '语言',
        schema: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      }
    ],
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: { $ref: '#/components/schemas/Machine' }
              }
            }
          }
        }
      },
      '404': {
        description: '设备不存在',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  }
};

swaggerDoc.paths['/machines/{machine_id}/accessories'] = {
  get: {
    tags: ['设备选型'],
    summary: '获取设备配件',
    description: '获取特定设备的适配配件列表',
    parameters: [
      {
        name: 'machine_id',
        in: 'path',
        required: true,
        description: '设备ID',
        schema: { type: 'string' }
      },
      {
        name: 'level',
        in: 'query',
        description: '配件层级',
        schema: { type: 'integer', default: 1 }
      },
      {
        name: 'region',
        in: 'query',
        description: '区域代码',
        schema: { type: 'string', enum: ['CN', 'EU', 'NA', 'AU'] }
      },
      {
        name: 'lang',
        in: 'query',
        description: '语言',
        schema: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      }
    ],
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Accessory' }
                    },
                    total: { type: 'integer', example: 2 }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// 添加配件相关API端点
swaggerDoc.paths['/accessories/{accessory_id}'] = {
  get: {
    tags: ['配件'],
    summary: '获取配件详情',
    description: '获取单个配件的详细信息',
    parameters: [
      {
        name: 'accessory_id',
        in: 'path',
        required: true,
        description: '配件ID',
        schema: { type: 'string' }
      },
      {
        name: 'region',
        in: 'query',
        description: '区域代码',
        schema: { type: 'string', enum: ['CN', 'EU', 'NA', 'AU'] }
      },
      {
        name: 'lang',
        in: 'query',
        description: '语言',
        schema: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      }
    ],
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: { $ref: '#/components/schemas/Accessory' }
              }
            }
          }
        }
      },
      '404': {
        description: '配件不存在',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  }
};

// 添加产品线相关API端点
swaggerDoc.paths['/product-lines'] = {
  get: {
    tags: ['产品线'],
    summary: '获取产品线列表',
    description: '获取所有可用的产品线列表',
    parameters: [
      {
        name: 'page',
        in: 'query',
        description: '页码',
        schema: { type: 'integer', default: 1 }
      },
      {
        name: 'page_size',
        in: 'query',
        description: '每页数量',
        schema: { type: 'integer', default: 10 }
      },
      {
        name: 'lang',
        in: 'query',
        description: '语言',
        schema: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      }
    ],
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProductLine' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// 添加耗材相关API端点
swaggerDoc.paths['/product-lines/{productLineId}/consumables'] = {
  get: {
    tags: ['耗材'],
    summary: '获取产品线耗材列表',
    description: '获取特定产品线下的所有耗材列表',
    parameters: [
      {
        name: 'productLineId',
        in: 'path',
        required: true,
        description: '产品线ID',
        schema: { type: 'string' }
      },
      {
        name: 'region',
        in: 'query',
        description: '区域代码',
        schema: { type: 'string', enum: ['CN', 'EU', 'NA', 'AU'] }
      },
      {
        name: 'lang',
        in: 'query',
        description: '语言',
        schema: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      },
      {
        name: 'page',
        in: 'query',
        description: '页码',
        schema: { type: 'integer', default: 1 }
      },
      {
        name: 'page_size',
        in: 'query',
        description: '每页数量',
        schema: { type: 'integer', default: 10 }
      }
    ],
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Consumable' }
                    },
                    total: { type: 'integer', example: 10 },
                    page: { type: 'integer', example: 1 },
                    page_size: { type: 'integer', example: 10 },
                    total_pages: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

swaggerDoc.paths['/consumables/prices/batch'] = {
  post: {
    tags: ['耗材'],
    summary: '批量获取耗材价格',
    description: '批量获取多个耗材的价格信息',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['consumableIds'],
            properties: {
              consumableIds: { 
                type: 'array', 
                items: { type: 'string' },
                example: ['CONS-001', 'CONS-002']
              },
              region: { type: 'string', enum: ['CN', 'EU', 'NA', 'AU'], example: 'CN' },
              quantity: { type: 'integer', example: 5 }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    prices: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          consumable_id: { type: 'string', example: 'CONS-001' },
                          price: { type: 'number', example: 100 },
                          original_price: { type: 'number', example: 120 },
                          currency: { type: 'string', example: '¥' },
                          currency_code: { type: 'string', example: 'CNY' },
                          quantity: { type: 'integer', example: 5 },
                          tier: { type: 'string', example: '1-10' },
                          discount_applied: { type: 'boolean', example: true },
                          discount_rate: { type: 'number', example: 0.9 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// 生成Swagger JSON文件
const outputPath = path.join(__dirname, 'swagger-api-docs.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerDoc, null, 2));
console.log(`Swagger文档已生成: ${outputPath}`);

// 生成简易的HTML查看器
const htmlViewerPath = path.join(__dirname, 'api-docs-viewer.html');
const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>BJT产品管理系统 API文档</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.1/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.1/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "./swagger-api-docs.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 1
      });
    };
  </script>
</body>
</html>
`;
fs.writeFileSync(htmlViewerPath, htmlContent);
console.log(`API文档HTML查看器已生成: ${htmlViewerPath}`);

// 提供使用说明
console.log(`
使用说明:
1. 通过Node.js运行此脚本: node test-swagger-generator.js
2. 生成两个文件:
   - swagger-api-docs.json: OpenAPI规范的API文档
   - api-docs-viewer.html: 可以直接在浏览器中查看的API文档
3. 用浏览器打开api-docs-viewer.html查看API文档
4. 或者将swagger-api-docs.json导入Postman或其他API工具进行测试
`); 