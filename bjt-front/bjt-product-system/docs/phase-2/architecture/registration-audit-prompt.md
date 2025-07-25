# 前端注册 & 审核管理页面 · AI 代码生成提示词

> 将下方 Prompt 复制到 ChatGPT / Copilot / CodeWhisperer，可一次性生成 **BJT Registration Front-end** 源码，实现二期 FR-01 "自助注册 + 管理员审核" 的前端功能。
>
> ⚠️ 后端 REST 接口已就绪（使用现有 `BJT_User_Controller` 和 `wp_bjt_users` 表），本任务仅生成 **React + Ant Design** 前端代码。

---

【Prompt 开始】

你是一名资深 React / TypeScript 前端工程师，需要为 BJT 选型商城实现 **注册申请页面** 与 **管理员审核页面**，请生成**完整可运行的前端源码**，满足以下要求：

## 1. 技术栈
   • React 18 + Vite + TypeScript 4.x  
   • UI 组件库：Ant Design 5.x（保留暗色模式适配）  
   • 路由：react-router-dom v6（已在项目中配置）  
   • 状态与权限：沿用现有 `AuthContext`、JWT 登录机制  

## 2. 路由与文件结构
   ```
   frontend/src/
     pages/
       Register/
         index.tsx            # 用户注册表单
         Register.module.css  # 局部样式
     admin/pages/
       RegistrationsPage.tsx  # 待审核列表 + 审核对话框（若已存在请覆盖实现）
     services/
       registrationService.ts # 封装注册与审核 API 调用
   ```

## 3. 注册页面 `/register`
   • 表单字段：姓名(first_name, last_name)、邮箱(email)、密码(password、确认)、角色(role Select: customer|dealer|sales)、国家(country 下拉)、单位制(preferred_unit, Switch)  
   • 若选择 `customer`，后端会立即自动创建账号并返回 `active` 状态；`dealer` 与 `sales` 需管理员审核（状态为 `pending`）  
   • 表单校验：邮箱格式、密码≥8 位且含数字+字母+符号、确认密码一致  
   • 调用 `POST /wp-json/bjt/v1/auth/register`，成功后显示相应消息并 3 秒后跳转 `/login`  
   • 已登录用户访问 `/register` 时自动重定向主页  

## 4. 注册 API Service (`registrationService.ts`)
   ```ts
   interface RegisterPayload {
     first_name: string;
     last_name: string;
     email: string;
     password: string;
     role: 'customer' | 'dealer' | 'sales';
     country: string;
     preferred_unit: 'metric' | 'imperial';
   }
   
   // 注册接口
   export const register = (data: RegisterPayload) => apiService.post('/auth/register', data);
   
   // 获取待审核用户列表（管理员使用）
   export const getPendingUsers = (params?: { page?: number; per_page?: number }) => 
     apiService.get('/users', { params: { ...params, status: 'pending' } });
   
   // 审核用户（管理员使用）
   export const approveUser = (id: number, updateData: any) => 
     apiService.put(`/users/${id}`, { ...updateData, status: 'active' });
   
   export const rejectUser = (id: number, reason: string) => 
     apiService.put(`/users/${id}`, { status: 'rejected', rejection_reason: reason });
   ```

## 5. 管理员审核页面 `/admin/registrations`
   • 仅管理员角色可访问（使用现有 `ProtectedRoute` + role 检查）  
   • AntD Table 列：ID、用户名、邮箱、角色、国家、提交时间、状态  
   • 顶部筛选：状态、角色、国家  
   • 行内操作：Approve / Reject / View  
   • Approve 点击后弹出 Modal，可编辑角色、单位制、客户代码、备注；确认后调用用户更新接口  
   • Reject 需填写原因；调用用户更新接口设置状态为 `rejected`  
   • 操作成功后 Table reload；使用 AntD message 提示  

## 6. 后端接口说明
   **注册接口**：`POST /wp-json/bjt/v1/auth/register`
   - 请求体：RegisterPayload
   - 返回：{ success: true, data: user, message: string }
   - customer角色自动激活，dealer/sales需要审核
   
   **用户管理接口**：`GET /wp-json/bjt/v1/users`
   - 查询参数：page, per_page, status, role, country
   - 返回：{ success: true, data: { items: [], total: number, page: number } }
   
   **用户更新接口**：`PUT /wp-json/bjt/v1/users/{id}`
   - 请求体：{ status: 'active'|'rejected', ...其他字段 }
   - 返回：{ success: true, data: user, message: string }

## 7. 国际化
   • 暂时使用硬编码中文文案（后续可扩展 i18n）
   • 注册页面与审核对话框使用中文界面  

## 8. 代码质量
   • 使用 React Hooks 与函数组件  
   • 充分拆分小组件（如 `RegistrationForm` / `ApproveModal`）  
   • 类型定义清晰，接口调用封装  
   • 错误处理完善，用户体验友好  

## 9. 特殊处理
   • 注册成功后根据用户状态显示不同消息：
     - `active`：'注册成功！您现在可以登录。'
     - `pending`：'注册申请已提交！请等待管理员审核。'
   • 管理员审核页面只显示 `pending` 状态的用户
   • 审核通过后用户状态变为 `active`，审核拒绝后状态变为 `rejected`

## 10. 输出格式
   请按照以下形式输出：
   ```
   frontend/src/pages/Register/index.tsx
   ```tsx
   // ... 文件完整内容 ...
   ```
   
   frontend/src/services/registrationService.ts
   ```ts
   // ... 文件完整内容 ...
   ```
   
   frontend/src/admin/pages/RegistrationsPage.tsx
   ```tsx
   // ... 文件完整内容 ...
   ```
   
   ... 依次列出所有新增/修改文件全文 ...
   ```

【Prompt 结束】

---

> 粘贴后可直接生成前端代码并覆盖/创建对应文件。若需分步，可按页面或组件拆分生成。 