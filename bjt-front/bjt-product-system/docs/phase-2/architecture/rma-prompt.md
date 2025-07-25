# BJT退货/RMA工作流 · AI代码生成提示词

> 基于 **BJT 产品管理系统** 现有架构，生成完整的退货/RMA工作流实现。本提示词已针对项目的实际技术栈和数据结构进行优化。

---

【Prompt 开始】

你是一名全栈工程师，需要为 **BJT 产品管理系统** 实现完整的"退货/RMA工作流"功能。请基于项目现有架构生成**可直接运行的前后端源码**。

## 项目技术栈

**前端架构**：
- React 18 + TypeScript + Vite
- UI框架：Ant Design 5.x (已配置暗色模式)
- 路由：react-router-dom v6
- 状态管理：Context API (AuthContext, OrderContext)
- 国际化：react-i18next
- 样式：CSS Modules + Tailwind CSS

**后端架构**：
- WordPress + 自研插件系统
- 现有插件：`bjt-core-entities`
- API命名空间：`bjt/v1`
- 数据库表前缀：`wp_bjt_`
- 权限系统：基于BJT用户角色 (admin, sales, customer, dealer)

## 现有数据结构

**订单表结构**：
```sql
wp_bjt_orders:
- id, order_number, user_id, status, total_amount, currency
- shipping_address (JSON), billing_address (JSON)
- payment_method, transaction_id, created_at, updated_at

wp_bjt_order_items:
- order_item_id, order_id, product_type, product_id, part_number
- product_name, quantity, unit_price, line_total
- model, model_imperial, spec, spec_imperial
```

**用户表结构**：
```sql
wp_bjt_users:
- id, username, email, role, status, country, preferred_unit
- customer_code, company_logo, created_at, updated_at
```

## 功能需求

### 1. 业务流程
1. **用户发起退货**：在"我的订单"页面点击"申请退货"
2. **填写退货表单**：选择退货商品、填写原因、上传附件
3. **系统创建RMA工单**：生成唯一RMA编号，状态为`pending`
4. **邮件通知**：根据订单仓库信息通知对应售后人员
5. **管理员处理**：在后台查看、留言、更新状态
6. **状态同步**：用户实时查看处理进度

### 2. 状态流转
```
pending → processing → approved/rejected → completed/cancelled
```

### 3. 权限控制
- **Customer**: 只能查看和操作自己的RMA工单
- **Admin/Sales**: 可以查看和处理所有RMA工单
- **系统设置**: 在现有Settings页面配置邮件模板和售后负责人

## 后端实现要求

### 1. 数据库设计
```sql
-- RMA主表
CREATE TABLE wp_bjt_rma (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rma_number VARCHAR(50) UNIQUE NOT NULL,
  order_id BIGINT NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  user_id BIGINT NOT NULL,
  status ENUM('pending','processing','approved','rejected','completed','cancelled') DEFAULT 'pending',
  reason_category VARCHAR(50) NOT NULL,
  reason_detail TEXT,
  total_refund_amount DECIMAL(10,2) DEFAULT 0,
  warehouse VARCHAR(50),
  priority ENUM('low','normal','high','urgent') DEFAULT 'normal',
  assigned_to BIGINT NULL,
  attachments JSON,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- RMA商品项目表
CREATE TABLE wp_bjt_rma_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rma_id BIGINT NOT NULL,
  order_item_id BIGINT NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity_ordered INT NOT NULL,
  quantity_to_return INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  return_reason VARCHAR(255),
  condition_received ENUM('new','used','damaged','defective') NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rma_id (rma_id),
  INDEX idx_order_item_id (order_item_id)
);

-- RMA留言/日志表
CREATE TABLE wp_bjt_rma_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rma_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  comment_type ENUM('comment','status_change','system_log') DEFAULT 'comment',
  content TEXT NOT NULL,
  attachments JSON,
  is_internal BOOLEAN DEFAULT FALSE,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rma_id (rma_id),
  INDEX idx_created_at (created_at)
);
```

### 2. API接口设计
继承现有的 `BJT_API_Controller` 基类，遵循项目API规范：

```php
// 路径：plugins/bjt-core-entities/controllers/class-rma-controller.php
class BJT_RMA_Controller extends BJT_API_Controller {
    public $resource_name = 'rma';
    
    // API端点
    // GET    /wp-json/bjt/v1/rma                 - 获取RMA列表（用户只能看自己的）
    // POST   /wp-json/bjt/v1/rma                 - 创建RMA申请
    // GET    /wp-json/bjt/v1/rma/{id}            - 获取单个RMA详情
    // PUT    /wp-json/bjt/v1/rma/{id}            - 更新RMA状态（管理员）
    // POST   /wp-json/bjt/v1/rma/{id}/comments   - 添加留言
    // GET    /wp-json/bjt/v1/rma/{id}/comments   - 获取留言列表
    // POST   /wp-json/bjt/v1/rma/{id}/attachments - 上传附件
}
```

### 3. 邮件通知系统
利用现有的 `wp_mail` 功能和Settings配置：

```php
// 邮件模板配置（在Settings页面中添加）
rma_settings: {
    email_templates: {
        rma_created: "您的退货申请 {rma_number} 已提交...",
        rma_approved: "您的退货申请 {rma_number} 已批准...",
        rma_rejected: "您的退货申请 {rma_number} 已拒绝..."
    },
    warehouse_contacts: {
        "warehouse_cn": "support-cn@company.com",
        "warehouse_us": "support-us@company.com"
    }
}
```

## 前端实现要求

### 1. 目录结构
```
frontend/src/
├── pages/
│   ├── OrderList/
│   │   └── index.tsx              # 在现有订单列表添加"申请退货"按钮
│   └── RMA/
│       ├── MyReturns/
│       │   └── index.tsx          # 我的退货列表
│       ├── CreateReturn/
│       │   └── index.tsx          # 创建退货申请
│       └── ReturnDetail/
│           └── index.tsx          # 退货详情页
├── admin/pages/
│   └── rma/
│       ├── RmaListPage.tsx        # 管理员RMA列表
│       └── RmaDetailPage.tsx      # 管理员RMA详情
├── components/
│   └── RMA/
│       ├── RmaStatusBadge.tsx     # 状态徽章组件
│       ├── RmaTimeline.tsx        # 时间线组件
│       ├── CommentBox.tsx         # 留言组件
│       └── AttachmentUpload.tsx   # 附件上传组件
├── services/
│   └── rma.service.ts             # RMA API服务
└── types/
    └── rma.types.ts               # RMA类型定义
```

### 2. 集成现有系统
- **路由集成**：添加到现有的路由配置中
- **导航集成**：在用户中心添加"我的退货"菜单
- **管理后台集成**：在管理员侧边栏添加"RMA管理"
- **权限集成**：使用现有的 `ProtectedRoute` 组件
- **国际化集成**：添加RMA相关的翻译键

### 3. UI/UX设计要求
- **设计一致性**：遵循现有的Ant Design设计规范
- **响应式设计**：支持移动端和桌面端
- **暗色模式**：适配现有的主题切换功能
- **状态反馈**：使用现有的message和notification组件
- **加载状态**：使用统一的loading组件

### 4. 核心组件实现

**RMA创建表单**：
- 基于现有订单数据预填充商品信息
- 支持多选商品和部分退货
- 退货原因分类选择 + 详细描述
- 附件上传（图片、PDF、视频）
- 表单验证和提交

**RMA详情页面**：
- 订单信息展示（复用现有OrderCard组件）
- 退货商品列表（复用现有ProductCard组件）
- 状态时间线
- 留言交流区
- 附件查看和下载

**管理员RMA管理**：
- RMA列表（支持筛选、搜索、分页）
- 批量操作（批量审批、分配处理人）
- 状态更新和留言
- 数据导出功能

### 5. 数据流设计
```typescript
// RMA数据类型
interface RMARequest {
  id: number;
  rma_number: string;
  order_id: number;
  order_number: string;
  status: RMAStatus;
  reason_category: string;
  reason_detail: string;
  items: RMAItem[];
  comments: RMAComment[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

interface RMAItem {
  id: number;
  order_item_id: number;
  part_number: string;
  product_name: string;
  quantity_ordered: number;
  quantity_to_return: number;
  unit_price: number;
  refund_amount: number;
  return_reason: string;
}
```

## 系统集成要求

### 1. 与现有功能集成
- **订单系统**：从订单详情直接发起退货
- **用户系统**：基于现有用户权限控制
- **邮件系统**：复用现有邮件配置和模板
- **文件上传**：集成现有的附件上传功能
- **设置系统**：在现有Settings页面添加RMA配置

### 2. 管理员导航集成
在现有的 `AdminSidebar.tsx` 中添加：
```typescript
{
  key: 'rma-management',
  label: '售后管理',
  icon: '🔄',
  children: [
    { key: 'rma-list', label: 'RMA工单', path: '/admin/rma' },
    { key: 'rma-settings', label: 'RMA设置', path: '/admin/settings?tab=rma' },
  ],
}
```

### 3. 用户中心集成
在用户导航中添加"我的退货"入口，支持：
- 退货申请历史
- 实时状态查看
- 在线沟通
- 文档下载

## 测试要求

### 1. 单元测试
- API接口测试（PHPUnit）
- 前端组件测试（Jest + React Testing Library）
- 权限验证测试
- 邮件发送测试

### 2. 集成测试
- 完整退货流程测试
- 多角色权限测试
- 邮件通知测试
- 附件上传下载测试

### 3. E2E测试
- 用户申请退货 → 管理员处理 → 用户查看结果
- 多设备响应式测试
- 暗色模式切换测试

## 输出要求

请按以下格式输出完整源码：

```
=== 后端实现 (WordPress插件) ===
plugins/bjt-core-entities/controllers/class-rma-controller.php
plugins/bjt-core-entities/includes/class-rma-email.php
plugins/bjt-core-entities/database/rma-schema.sql

=== 前端实现 (React组件) ===
frontend/src/pages/RMA/MyReturns/index.tsx
frontend/src/pages/RMA/CreateReturn/index.tsx
frontend/src/pages/RMA/ReturnDetail/index.tsx
frontend/src/admin/pages/rma/RmaListPage.tsx
frontend/src/admin/pages/rma/RmaDetailPage.tsx
frontend/src/components/RMA/[各组件文件]
frontend/src/services/rma.service.ts
frontend/src/types/rma.types.ts

=== 配置更新 ===
frontend/src/admin/routes.tsx (添加RMA路由)
frontend/src/admin/components/layout/AdminSidebar.tsx (添加导航)
frontend/src/admin/pages/settings/SettingsPage.tsx (添加RMA设置)
```

所有代码应该：
1. **可直接运行**：无需额外配置即可集成到现有项目
2. **遵循规范**：使用项目现有的代码风格和架构模式
3. **完整实现**：包含所有必要的错误处理和边界情况
4. **文档完整**：包含必要的注释和使用说明

【Prompt 结束】

---

> 💡 **使用建议**：
> 1. 可分阶段实现：先后端API → 前端组件 → 系统集成
> 2. 建议先实现核心流程，再添加高级功能（如批量操作、数据分析等）
> 3. 充分利用现有组件和服务，避免重复开发 