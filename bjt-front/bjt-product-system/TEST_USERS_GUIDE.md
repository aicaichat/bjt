# BJT产品管理系统 - 测试用户指南

## 测试账户概览

系统中现在包含 **10个测试账户**，所有账户的密码都是 `password123`。

## 🔐 登录信息

### 原有测试账户 (5个)

| 用户名 | 邮箱 | 角色 | 客户代码 | 国家 | 地区 | 单位制 | 用途说明 |
|--------|------|------|----------|------|------|--------|----------|
| `admin` | admin@bjt.com | admin | ADM001 | China | CN | metric | 系统管理员 |
| `sales_user` | sales@bjt.com | sales | SAL001 | China | CN | metric | 销售人员 |
| `partner_user` | partner@bjt.com | partner | PAR001 | United States | US | imperial | 合作伙伴 |
| `customer_user` | customer@bjt.com | customer | CUS001 | Germany | EU | metric | 普通客户 |
| `test_imperial` | test.imperial@bjt.com | customer | TEST001 | United Kingdom | EU | imperial | 英制单位测试 |

### 新增测试账户 (5个)

| 用户名 | 邮箱 | 角色 | 客户代码 | 国家 | 地区 | 单位制 | 用途说明 |
|--------|------|------|----------|------|------|--------|----------|
| `sales_manager` | sales.manager@bjt.com | sales | SAL002 | Japan | APAC | metric | 销售经理 |
| `tech_support` | tech.support@bjt.com | customer | TEC001 | South Korea | APAC | metric | 技术支持 |
| `agent_user` | agent@bjt.com | partner | AGT001 | Australia | APAC | metric | 代理商 |
| `regional_customer` | regional.customer@bjt.com | customer | CUS002 | France | EU | metric | 区域客户 |
| `enterprise_client` | enterprise@bjt.com | customer | ENT001 | Canada | NA | imperial | 企业客户 |

## 🌍 地区分布

- **CN (中国)**: 2个账户
- **EU (欧洲)**: 3个账户  
- **US (美国)**: 1个账户
- **APAC (亚太)**: 3个账户
- **NA (北美)**: 1个账户

## 👥 角色分布

- **admin (管理员)**: 1个账户
- **sales (销售)**: 2个账户
- **partner (合作伙伴)**: 2个账户
- **customer (客户)**: 5个账户

## 📏 单位制分布

- **metric (公制)**: 7个账户
- **imperial (英制)**: 3个账户

## 🔧 使用方法

### 1. 通过API登录测试
```bash
# 测试管理员登录
curl -X POST "https://bjt.nh.cool/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 测试销售经理登录
curl -X POST "https://bjt.nh.cool/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"sales_manager","password":"password123"}'

# 测试企业客户登录
curl -X POST "https://bjt.nh.cool/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"enterprise_client","password":"password123"}'
```

### 2. 前端界面登录测试
访问系统前端登录页面，使用任意测试账户登录：
- 用户名：上表中的任意用户名
- 密码：`password123`

### 3. 权限测试
不同角色的权限测试：

#### 管理员 (admin)
- ✅ 完全系统访问权限
- ✅ 用户管理
- ✅ 系统配置
- ✅ 所有产品数据管理

#### 销售 (sales, sales_manager)
- ✅ 产品数据查看
- ✅ 客户管理
- ✅ 订单管理
- ❌ 系统配置修改

#### 合作伙伴 (partner_user, agent_user)
- ✅ 产品目录访问
- ✅ 价格查看
- ✅ 订单创建
- ❌ 敏感信息访问

#### 客户 (customer_user, tech_support, regional_customer, enterprise_client)
- ✅ 产品浏览
- ✅ 规格查看
- ✅ 订单创建
- ❌ 价格管理

## 🧪 测试场景

### 1. 多地区测试
- 使用不同地区的账户测试本地化功能
- 验证单位制转换 (公制 vs 英制)
- 测试时区和语言设置

### 2. 角色权限测试
- 测试不同角色的功能访问权限
- 验证API接口的权限控制
- 确认敏感操作的权限限制

### 3. 业务流程测试
- 模拟完整的销售流程
- 测试客户下单到交付的流程
- 验证多用户协作场景

### 4. 数据隔离测试
- 确认不同客户之间的数据隔离
- 测试合作伙伴数据访问范围
- 验证企业级客户的特殊权限

## 🔄 数据重建

如需重建测试用户数据，可使用以下方法：

### 生产环境
```bash
# 使用生产数据库重建脚本
./rebuilddb_production_v2.sh
```

### 开发环境
```bash
# 重启开发环境数据库容器
docker-compose -f docker/dev/docker-compose.nginx.yml restart mysql

# 或使用开发环境重建脚本
./rebuilddb.sh
```

## 📊 测试数据统计

执行数据重建后，可以通过以下SQL查询验证用户数据：

```sql
-- 查看所有测试用户
SELECT 
    id,
    username,
    email,
    role,
    country,
    region,
    preferred_unit,
    status,
    created_at
FROM wp_bjt_users 
ORDER BY role, id;

-- 按角色统计用户数量
SELECT 
    role,
    COUNT(*) as user_count
FROM wp_bjt_users 
GROUP BY role;

-- 按地区统计用户数量
SELECT 
    region,
    COUNT(*) as user_count
FROM wp_bjt_users 
GROUP BY region;
```

## 🚨 安全注意事项

1. **生产环境安全**：这些测试账户仅用于开发和测试环境，请勿在生产环境中使用弱密码
2. **定期更新密码**：在正式部署前，建议修改所有测试账户的密码
3. **权限审核**：定期审核测试账户的权限设置，确保符合安全要求
4. **数据清理**：生产环境部署时，可以删除不需要的测试账户

## 📝 维护记录

- **2024-12-07**: 新增5个测试账户，涵盖更多业务场景和地区
- **原始版本**: 包含5个基础测试账户

如有问题或需要添加新的测试场景，请联系开发团队。 