# 前端注册 & 审核 UI · AI 代码生成提示词

> 复制本提示词到 ChatGPT / Copilot / CodeWhisperer，可一次性生成**BJT Front-end Registration & Audit** 组件源码（React + TypeScript），满足二期 FR-01 要求。

---

【Prompt 开始】

你是一名资深 React + TypeScript 工程师，需要在现有 **BJT 产品管理系统前端（Vite + React 18 + TS 5）** 中新增"用户注册 & 审核"模块。请生成**完整可运行的前端代码**（组件、hook、服务、路由、i18n 词条、单元测试）并符合以下要求：

1. 架构与依赖
   • 使用 React 18、功能组件、Hooks；UI 框架采用 Ant Design 5（如果未安装请包含依赖）  
   • 国际化：沿用 `react-i18next`，新增中文 / 英文词条  
   • 表单验证：`react-hook-form` + `yup` schema

2. 路由
   • `/register` —— 公开注册页  
   • `/register/success` —— 提交成功（待审核）页  
   • `/admin/registrations` —— 管理员审核列表（仅角色 = admin 时可访问）

3. 注册功能
   • 表单字段：姓、名、邮箱、密码、确认密码、国家（Select + 搜索）、地区（可选，联动国家）、单位制（Radio 公制/英制）、验证码(reCAPTCHA v3)  
   • 校验规则：必填、邮箱格式、密码≥8 位且含数字+字母、密码一致性  
   • 提交后调用 `POST /wp-json/bjt/v1/phase2/auth/register`，成功跳 `/register/success`  
   • 错误提示友好，支持 i18n

4. 注册状态轮询（选配）
   • 成功页展示"正在审核…"并每 60s 调 `GET /wp-json/bjt/v1/phase2/registration-status?id=XXX`  
   • 状态 approved -> 自动跳登录页；rejected -> 显示原因

5. 管理员审核 UI
   • 列表：使用 Ant Design Table 分页加载 `GET /wp-json/bjt/v1/phase2/admin/registrations?status=pending&page=1`  
   • 操作列：Approve / Reject  
   • 点击 "查看/Approve" 弹出 Drawer 表单，可编辑：角色、多仓库选择(多选下拉)、单位制、公英制、客户代码  
   • Approve = `PUT /.../approve`，Reject = `PUT /.../reject` (带拒绝原因)  
   • 提交后 Table 自动刷新，成功/失败 message 提示

6. 权限控制
   • 使用现有 AuthContext；若 `user.role !== 'admin'` 访问 `/admin/registrations` 则重定向 `/`  
   • 前端拦截 token 过期 401 -> 登出

7. 服务层
   • 在 `src/services/registration.service.ts` 提供：`register()`, `getStatus()`, `listPending()`, `approve()`, `reject()`  
   • 统一通过现有 `apiService` (`GET/POST/PUT`)  
   • 类型定义放 `src/types/registration.d.ts`

8. UI/UX
   • 支持深色模式  
   • 表单 & 按钮禁用态，加载中旋转 Icon  
   • 所有字符串走 i18n key，如 `registration.submit`  
   • 响应式布局：≥768px 栅格，<768px 单列

9. 样式 & 兼容性约束
   • **禁止**在组件中直接写颜色 / 字体 / 间距，统一从 `@styles/variables.less` 或 tailwind config 读取。  
   • 组件 className 前缀 `bjt-registration-`，并启用 CSS Module，确保局部作用域。  
   • 优先复用项目已有 `Button`、`Form`、`Drawer` 等封装组件；若使用 Ant Design 组件需包裹一层适配组件，以复用全局样式。  
   • 新代码放 `src/modules/registration/`，Context 只在模块内部使用，不注入全局。  
   • 路由动态注入，不改动现有基础路由表；i18n key 前缀 `registration.*`、`audit.*` 统一命名。  
   • 在 CI 中新增 E2E 回归脚本，确保旧购物车 / 结算流程无异常。

10. 单元测试
   • 使用 `@testing-library/react` + Jest  
   • 覆盖：表单校验、成功跳转、管理页面 approve/reject action

11. 输出格式
   • 按 **目录树 + 每个文件全文** 输出，例如：
   ```
   src/
     modules/
       registration/
         pages/
           Register/
             index.tsx
             Success.tsx
           Admin/
             Registrations.tsx
         services/
           registration.service.ts
         types/
           registration.d.ts
     i18n/
       locales/
         zh.json
         en.json
   tests/
     RegistrationForm.test.tsx
   ```
   • 代码应可直接放入现有前端项目并通过 `npm run dev` 启动

【Prompt 结束】

---

> 可按项目实际调整 UI 框架或测试框架；如需精简，可先生成注册页，再生成后台页面。 