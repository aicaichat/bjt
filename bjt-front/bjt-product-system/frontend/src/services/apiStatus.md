# API Status 记录

> 本文件用于记录前端 API 服务层与接口文档的对齐情况、存在的问题及改进建议。
> 最后更新: 2024-03-21

## 目录
1. [已实现的API](#1-已实现的api)
2. [未实现/缺失的API](#2-未实现缺失的api)
3. [路径/参数/结构不一致问题](#3-路径参数结构不一致问题)
4. [业务服务分散问题](#4-业务服务分散问题)
5. [类型定义和返回结构不统一](#5-类型定义和返回结构不统一)
6. [改进建议](#6-改进建议)
7. [页面API分析](#7-页面api分析)

---

## 1. 已实现的API

### 1.1 产品线相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| getProductLines | /product-lines | api.ts | ✅ 已实现 | 缺少lang/region参数 |
| getProductLine | /product-lines/{id} | api.ts | ✅ 已实现 | 缺少lang/region参数 |

### 1.2 设备相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| getMachines | /machines | machinesService.ts | ✅ 已实现 | 路径前缀不一致 |
| getMachine | /machines/{id} | machinesService.ts | ✅ 已实现 | 路径前缀不一致 |
| getMachineAccessories | /machines/{id}/accessories | machinesService.ts | ✅ 已实现 | 路径前缀不一致 |
| getAccessories | /accessories | machinesService.ts | ✅ 已实现 | 路径前缀不一致 |

### 1.3 产品相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| getProducts | /products | api.ts | ✅ 已实现 | 未区分产品类型 |
| getProduct | /products/{id} | api.ts | ✅ 已实现 | 未区分产品类型 |

### 1.4 购物车相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| getCart | /cart | api.ts, cartApiService.ts | ✅ 已实现 | 路径不一致 |
| addToCart | /cart/add | api.ts, cartApiService.ts | ✅ 已实现 | 路径不一致 |
| updateCartItem | /cart/items/{id} | api.ts, cartApiService.ts | ✅ 已实现 | 路径不一致 |
| removeFromCart | /cart/items/{id} | api.ts, cartApiService.ts | ✅ 已实现 | 路径不一致 |
| clearCart | /cart | api.ts, cartApiService.ts | ✅ 已实现 | 路径不一致 |
| getCartSummary | /cart/summary | api.ts, cartApiService.ts | ✅ 已实现 | 路径不一致 |

### 1.5 订单相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| getOrders | /orders | api.ts | ✅ 已实现 | 缺少筛选参数 |
| getOrderById | /orders/{id} | api.ts | ✅ 已实现 | 缺少筛选参数 |
| createOrder | /orders | api.ts | ✅ 已实现 | 缺少筛选参数 |
| cancelOrder | /orders/{id}/cancel | api.ts | ✅ 已实现 | 缺少筛选参数 |
| exportPO | /orders/{id}/po | api.ts | ✅ 已实现 | 路径不一致 |

### 1.6 认证相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| login | /auth/login | api.ts | ✅ 已实现 | 路径一致 |
| logout | /auth/logout | api.ts | ✅ 已实现 | 路径一致 |
| getCurrentUser | /auth/me | api.ts | ✅ 已实现 | 路径一致 |
| refreshToken | /auth/refresh | api.ts | ✅ 已实现 | 路径不一致 |

### 1.7 耗材相关
| API方法 | 路径 | 定义位置 | 状态 | 问题 |
|---------|------|----------|------|------|
| getConsumables | /consumables | consumablesService.ts | ✅ 已实现 | 未统一到主API服务 |

---

## 2. 未实现/缺失的API

### 2.1 配件相关
| API方法 | 路径 | 状态 | 优先级 |
|---------|------|------|--------|
| getAccessoryDetail | /accessories/{id} | ❌ 未实现 | 高 |
| getAccessoryChildren | /accessories/{id}/children | ❌ 未实现 | 中 |

### 2.2 备件相关
| API方法 | 路径 | 状态 | 优先级 |
|---------|------|------|--------|
| getSpareParts | /spare-parts | ❌ 未实现 | 高 |
| getSparePartDetail | /spare-parts/{id} | ❌ 未实现 | 高 |

### 2.3 数据字典相关
| API方法 | 路径 | 状态 | 优先级 |
|---------|------|------|--------|
| getRegions | /regions | ❌ 未实现 | 中 |
| getPriceLevels | /price-levels | ❌ 未实现 | 中 |
| getMachineCategories | /machine-categories | ❌ 未实现 | 中 |
| getConsumableCategories | /consumable-categories | ❌ 未实现 | 中 |

### 2.4 实时价格与库存相关
| API方法 | 路径 | 状态 | 优先级 |
|---------|------|------|--------|
| getPrices | /prices | ❌ 未实现 | 高 |
| getInventory | /inventory | ❌ 未实现 | 高 |
| getProductAvailability | /products/availability | ❌ 未实现 | 高 |

### 2.5 日志与监控相关
| API方法 | 路径 | 状态 | 优先级 |
|---------|------|------|--------|
| getLogs | /logs | ❌ 未实现 | 低 |
| getMonitorData | /monitor | ❌ 未实现 | 低 |

---

## 3. 路径/参数/结构不一致问题

### 3.1 路径不一致
| API方法 | 文档路径 | 实现路径 | 建议修改 |
|---------|----------|----------|----------|
| addToCart | /cart/add | /cart/items | 统一为文档路径 |
| exportPO | /orders/{id}/po | /orders/{id}/export | 统一为文档路径 |
| refreshToken | /auth/refresh | /auth/refresh-token | 统一为文档路径 |
| machines相关API | /machines/* | /wp-json/bjt/v1/machines/* | 统一路径前缀 |

### 3.2 参数不一致
| API方法 | 文档参数 | 实现参数 | 建议修改 |
|---------|----------|----------|----------|
| 分页参数 | page, page_size | per_page | 统一为文档参数 |
| 语言参数 | lang | 未实现 | 补充实现 |
| 区域参数 | region | 未实现 | 补充实现 |
| getMachines | category | 未在文档中定义 | 补充文档说明 |

### 3.3 返回结构不一致
| API方法 | 文档结构 | 实现结构 | 建议修改 |
|---------|----------|----------|----------|
| getProducts | 包含分页信息 | 直接返回数组 | 统一为文档结构 |
| getCart | 包含summary | 仅返回items | 统一为文档结构 |
| getMachines | 包含完整状态信息 | 简化状态信息 | 统一为文档结构 |

---

## 4. 业务服务分散问题

### 4.1 当前服务文件
- api.ts: 主要API服务
- cartApiService.ts: 购物车相关API
- consumablesService.ts: 耗材相关API
- machinesService.ts: 设备相关API

### 4.2 存在的问题
1. 服务分散，维护困难
2. 类型定义重复
3. 错误处理不统一
4. 拦截器配置重复
5. Mock数据管理分散

### 4.3 建议改进
1. 统一到api.ts或通过index.ts统一出口
2. 统一类型定义
3. 统一错误处理
4. 统一拦截器配置
5. 集中管理Mock数据

---

## 5. 类型定义和返回结构不统一

### 5.1 类型定义问题
1. 部分接口缺少TypeScript类型定义
2. 类型定义分散在不同文件
3. 类型定义与接口文档不一致
4. machines页面使用any类型

### 5.2 返回结构问题
1. 部分接口返回结构不统一
2. 错误处理方式不一致
3. 分页信息格式不统一
4. 状态码使用不统一

### 5.3 建议改进
1. 统一类型定义到types目录
2. 统一返回结构
3. 统一错误处理
4. 统一分页格式
5. 规范化状态码使用

---

## 6. 改进建议

### 6.1 短期改进（1-2周）
1. 补全高优先级缺失API
2. 统一API路径
3. 统一参数命名
4. 统一返回结构
5. 完善machines页面类型定义

### 6.2 中期改进（1个月）
1. 统一服务层架构
2. 完善类型定义
3. 统一错误处理
4. 补充单元测试
5. 优化Mock数据管理

### 6.3 长期改进（3个月）
1. 实现所有缺失API
2. 完善文档
3. 性能优化
4. 监控告警
5. 缓存策略优化

---

## 7. 页面API分析

### 7.1 Machines页面
#### 使用的API：
1. `getMachines`: 获取设备列表
   - 路径: `/wp-json/bjt/v1/machines`
   - 参数: region, lang, page, page_size, category
   - 问题: 路径前缀不一致，参数未完全对齐

2. `getMachine`: 获取设备详情
   - 路径: `/wp-json/bjt/v1/machines/{machineId}`
   - 参数: region, lang
   - 问题: 路径前缀不一致

3. `getMachineAccessories`: 获取设备配件
   - 路径: `/wp-json/bjt/v1/machines/{machineId}/accessories`
   - 参数: level, region, lang
   - 问题: 路径前缀不一致

4. `getAccessories`: 获取配件及关联配件
   - 路径: `/wp-json/bjt/v1/accessories`
   - 参数: parent_id, machine_id, level, region, lang
   - 问题: 路径前缀不一致

5. `addToCart`: 添加到购物车
   - 路径: `/wp-json/bjt/v1/cart/add`
   - 参数: product_id, product_type, quantity, voltage, properties
   - 问题: 路径不一致

#### 存在问题：
1. API路径前缀不统一
2. 类型定义不完整（大量any使用）
3. 错误处理简单化
4. Mock数据管理分散
5. 缺少数据缓存机制

#### 建议改进：
1. 统一API路径前缀
2. 完善类型定义
3. 增强错误处理
4. 集中管理Mock数据
5. 实现数据缓存

---

> 注：本文件会随开发进度持续更新，请定期同步最新状态。 