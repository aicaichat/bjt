# BJT API 代理修复指南

## 问题描述

前端页面出现大量404错误，API请求被发送到 `http://localhost:5173/wp-json/bjt/v1/...` 而不是后端服务器。

## 根本原因

1. **环境变量配置错误**：使用了绝对URL而不是相对路径
2. **Vite代理未正确工作**：代理配置存在问题
3. **认证流程异常**：虽然能获取token，但API调用失败

## 解决方案

### 1. 修复环境配置

**修改 `frontend/.env`：**
```bash
# ❌ 错误配置（绝对URL）
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1

# ✅ 正确配置（相对路径）
VITE_API_URL=/wp-json/bjt/v1
VITE_API_BASE_URL=/wp-json/bjt/v1
```

### 2. 确认Vite代理配置

**检查 `frontend/vite.config.ts`：**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/wp-json': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### 3. 快速修复命令

```bash
# 运行自动修复脚本
./scripts/quick-fix-api-proxy.sh

# 重启前端服务
cd frontend && npm run dev
```

## 验证步骤

### 1. 检查代理日志
启动前端服务后，应该在控制台看到：
```
📤 Proxying: GET /wp-json/bjt/v1/product-lines → http://localhost:8080
📥 Response: 200 /wp-json/bjt/v1/product-lines
```

### 2. 检查浏览器网络面板
- API请求应该显示为 `http://localhost:5173/wp-json/bjt/v1/...`
- 状态码应该是200而不是404
- 响应应该包含有效的JSON数据

### 3. 检查后端服务
```bash
# 测试后端API直接访问
curl http://localhost:8080/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

## 常见问题排查

### 问题1：代理仍然不工作
**解决方案：**
1. 确保WordPress后端在端口8080运行
2. 检查防火墙设置
3. 重启前端开发服务器

### 问题2：认证错误
**解决方案：**
1. 检查用户credentials
2. 确认数据库中用户状态为active
3. 验证用户角色权限

### 问题3：CORS错误
**解决方案：**
1. 确保WordPress CORS插件配置正确
2. 检查代理配置中的changeOrigin选项

## 权限问题修复

### 关联管理页面403错误
```php
// 确保用户有正确的角色
$allowed_roles = ['admin', 'sales', 'partner', 'customer'];
```

### 备件管理页面403错误
```php
// 检查BJT_Auth_Controller是否正确加载
if (!class_exists('BJT_Auth_Controller')) {
    require_once dirname(__FILE__) . '/class-auth-controller.php';
}
```

## Antd警告修复

### Spin组件警告
```tsx
// ❌ 错误使用
<Spin tip="加载中..." />

// ✅ 正确使用
<Spin tip="加载中..." spinning={true}>
  <div>内容</div>
</Spin>

// 或者全屏模式
<Spin tip="加载中..." size="large" />
```

## 完整修复流程

1. **运行修复脚本**
   ```bash
   ./scripts/quick-fix-api-proxy.sh
   ```

2. **重启服务**
   ```bash
   # 前端
   cd frontend && npm run dev
   
   # 后端（如果需要）
   docker-compose restart
   ```

3. **验证修复**
   - 打开浏览器开发者工具
   - 访问前端页面
   - 检查网络请求是否正常

4. **测试功能**
   - 测试关联管理页面
   - 测试备件管理页面
   - 确认无403错误

## 预防措施

1. **环境配置管理**
   - 使用相对路径而不是绝对URL
   - 为不同环境创建不同的配置文件

2. **代理配置标准化**
   - 确保所有API路径都通过代理
   - 添加详细的代理日志

3. **错误监控**
   - 添加API错误统一处理
   - 实现错误重试机制

## 技术支持

如果问题仍然存在，请：
1. 检查浏览器控制台错误
2. 查看Vite代理日志
3. 确认后端服务状态
4. 联系技术团队获取支持 