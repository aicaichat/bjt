# 前后端代码映射关系文档

## 一、整体架构

### 1.1 技术栈对应
| 前端 | 后端 |
|------|------|
| React 18 + TypeScript | WordPress (PHP 8.0+) |
| Ant Design 组件库 | WordPress REST API |
| React Router | WordPress 路由系统 |
| React Context/Redux | WordPress 数据管理 |

### 1.2 目录结构对应
```
前端 (frontend/src/)                后端 (plugins/bjt-product-admin/)
├── pages/                         ├── includes/
│   ├── ProductLines/             │   ├── admin/
│   ├── Hosts/                    │   │   ├── class-bjt-product-line-management.php
│   ├── Accessories/              │   │   ├── class-bjt-host-management.php
│   ├── Consumables/             │   │   ├── class-bjt-accessory-management.php
│   └── SpareParts/              │   │   └── class-bjt-spare-part-management.php
├── components/                    ├── api/
│   ├── common/                   │   ├── class-bjt-product-lines-controller.php
│   └── business/                 │   ├── class-bjt-hosts-controller.php
├── services/                     │   ├── class-bjt-accessories-controller.php
│   ├── api/                     │   ├── class-bjt-consumables-controller.php
│   └── utils/                   │   └── class-bjt-spare-parts-controller.php
└── types/                        └── templates/
```

## 二、API 接口映射

### 2.1 产品线管理
| 前端服务 | 后端 API | 说明 |
|----------|----------|------|
| getProductLines | GET /bjt/v1/product-lines | 获取产品线列表 |
| createProductLine | POST /bjt/v1/product-lines | 创建产品线 |
| updateProductLine | PUT /bjt/v1/product-lines/{id} | 更新产品线 |
| deleteProductLine | DELETE /bjt/v1/product-lines/{id} | 删除产品线 |

### 2.2 主机管理
| 前端服务 | 后端 API | 说明 |
|----------|----------|------|
| getHosts | GET /bjt/v1/hosts | 获取主机列表 |
| createHost | POST /bjt/v1/hosts | 创建主机 |
| updateHost | PUT /bjt/v1/hosts/{id} | 更新主机 |
| deleteHost | DELETE /bjt/v1/hosts/{id} | 删除主机 |
| getHostParts | GET /bjt/v1/hosts/{id}/parts | 获取主机配件 |

### 2.3 配件管理
| 前端服务 | 后端 API | 说明 |
|----------|----------|------|
| getAccessories | GET /bjt/v1/accessories | 获取配件列表 |
| createAccessory | POST /bjt/v1/accessories | 创建配件 |
| updateAccessory | PUT /bjt/v1/accessories/{id} | 更新配件 |
| deleteAccessory | DELETE /bjt/v1/accessories/{id} | 删除配件 |
| getCompatibleHosts | GET /bjt/v1/accessories/{id}/hosts | 获取兼容主机 |

### 2.4 耗材管理
| 前端服务 | 后端 API | 说明 |
|----------|----------|------|
| getConsumables | GET /bjt/v1/consumables | 获取耗材列表 |
| createConsumable | POST /bjt/v1/consumables | 创建耗材 |
| updateConsumable | PUT /bjt/v1/consumables/{id} | 更新耗材 |
| deleteConsumable | DELETE /bjt/v1/consumables/{id} | 删除耗材 |
| getReplacementCycle | GET /bjt/v1/consumables/{id}/replacement-cycle | 获取更换周期 |

### 2.5 备件管理
| 前端服务 | 后端 API | 说明 |
|----------|----------|------|
| getSpareParts | GET /bjt/v1/spare-parts | 获取备件列表 |
| createSparePart | POST /bjt/v1/spare-parts | 创建备件 |
| updateSparePart | PUT /bjt/v1/spare-parts/{id} | 更新备件 |
| deleteSparePart | DELETE /bjt/v1/spare-parts/{id} | 删除备件 |
| getMaintenanceSchedule | GET /bjt/v1/spare-parts/{id}/maintenance-schedule | 获取维护计划 |

## 三、组件与模板对应

### 3.1 页面组件对应
| 前端组件 | 后端模板 | 说明 |
|----------|----------|------|
| ProductLineList | admin/product-lines/list.php | 产品线列表页 |
| ProductLineForm | admin/product-lines/form.php | 产品线表单页 |
| HostList | admin/hosts/list.php | 主机列表页 |
| HostForm | admin/hosts/form.php | 主机表单页 |
| AccessoryList | admin/accessories/list.php | 配件列表页 |
| AccessoryForm | admin/accessories/form.php | 配件表单页 |

### 3.2 公共组件对应
| 前端组件 | 后端功能 | 说明 |
|----------|----------|------|
| ImageUploader | wp_handle_upload | 图片上传组件 |
| LanguageSwitch | wp_get_available_translations | 语言切换组件 |
| SearchFilter | WP_Query | 搜索过滤组件 |
| Pagination | WP_Query pagination | 分页组件 |

## 四、数据流转关系

### 4.1 状态管理
```typescript
// 前端状态管理 (React Context)
interface ProductLineState {
    items: ProductLine[];
    loading: boolean;
    error: string | null;
}

// 对应后端数据结构
interface WP_REST_Response {
    data: {
        items: Array<{
            id: number;
            code: string;
            name_zh: string;
            name_en: string;
            // ...
        }>;
        total: number;
        page: number;
        per_page: number;
    };
}
```

### 4.2 数据验证
```typescript
// 前端验证
interface ProductLineValidation {
    code: [required, pattern(/^[A-Za-z0-9-]+$/)];
    name_zh: [required, maxLength(100)];
    name_en: [required, maxLength(100)];
}

// 后端验证
class BJT_Product_Line_Management {
    private function validate_data($data) {
        // 对应的后端验证逻辑
    }
}
```

## 五、开发注意事项

### 5.1 API 调用规范
1. 所有 API 请求都应该使用统一的请求客户端
2. 处理所有可能的错误情况
3. 实现请求重试机制
4. 添加适当的加载状态指示

### 5.2 组件开发规范
1. 保持组件的单一职责
2. 实现合适的错误边界
3. 优化组件性能
4. 保持代码风格一致

### 5.3 数据处理规范
1. 统一的数据转换层
2. 统一的错误处理机制
3. 合理的缓存策略
4. 数据验证的一致性

### 5.4 安全性考虑
1. 所有用户输入都需要验证
2. API 调用需要适当的权限检查
3. 敏感数据的处理
4. CSRF 防护

## 六、待优化项目

### 6.1 前端优化
- [ ] 实现完整的类型定义
- [ ] 添加单元测试
- [ ] 优化组件性能
- [ ] 完善错误处理

### 6.2 后端优化
- [ ] 完善 API 文档
- [ ] 优化数据库查询
- [ ] 添加缓存机制
- [ ] 完善日志记录

### 6.3 接口优化
- [ ] 实现 API 版本控制
- [ ] 优化错误响应格式
- [ ] 添加请求限流
- [ ] 优化数据格式

## 更新记录
| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2024-03-22 | 创建文档 | - | 