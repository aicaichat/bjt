# 环境变量配置示例

## 🔧 开发环境配置 (.env.development)
```env
# 启用智能单位制系统
REACT_APP_ENABLE_SMART_UNITS=true

# 启用购物车字段增强
REACT_APP_ENABLE_CART_ENHANCEMENT=true

# 启用调试模式
REACT_APP_DEBUG=true
```

## 🧪 测试环境配置 (.env.staging)
```env
# 启用智能单位制系统进行测试
REACT_APP_ENABLE_SMART_UNITS=true

# 购物车增强功能暂时关闭
REACT_APP_ENABLE_CART_ENHANCEMENT=false

# 关闭调试模式
REACT_APP_DEBUG=false
```

## 🚀 生产环境配置 (.env.production)
```env
# 智能单位制系统暂时关闭，等待验证
REACT_APP_ENABLE_SMART_UNITS=false

# 购物车增强功能暂时关闭
REACT_APP_ENABLE_CART_ENHANCEMENT=false

# 关闭调试模式
REACT_APP_DEBUG=false
```

## 📋 配置说明

### REACT_APP_ENABLE_SMART_UNITS
控制智能单位制系统的开启/关闭
- `true`: 启用基于用户偏好的智能单位制切换
- `false`: 回退到原有的单位制显示逻辑

### REACT_APP_ENABLE_CART_ENHANCEMENT  
控制购物车字段增强功能的开启/关闭
- `true`: 启用增强的字段显示和标签系统
- `false`: 使用原有的字段显示逻辑

### REACT_APP_DEBUG
控制调试信息的输出
- `true`: 在控制台输出详细的调试信息
- `false`: 不输出调试信息

## 🚨 安全提醒

1. **不要提交 .env 文件到版本控制系统**
2. **确保生产环境使用正确的配置值**
3. **在部署前验证所有环境变量设置**

## 🔄 配置更新流程

1. 修改对应环境的 .env 文件
2. 重新构建应用：`npm run build`
3. 重新部署应用
4. 验证功能是否按预期工作 