# BJT产品管理系统前端

基于React+TypeScript的BJT产品管理系统前端实现，按照mockup进行1:1复刻。

## 项目工具说明

本项目包含几个辅助脚本，用于规范开发流程和版本管理：

### 1. 开发服务器启动脚本

```bash
./start-dev.sh
```

功能：
- 启动前显示项目状态摘要
- 提醒开发者当前问题和优先工作项
- 要求开发者确认执行命令前检查清单
- 启动Vite开发服务器(5174端口)

### 2. 项目迭代管理脚本

```bash
./iterate.sh "迭代任务描述"
```

功能：
- 创建Git功能分支
- 显示项目状态摘要
- 启动开发服务器进行迭代
- 开发完成后引导更新状态文件
- 提交代码更改并记录迭代日志
- 可选择合并回主分支

示例：
```bash
./iterate.sh "迁移购物车页面到正确位置"
```

### 3. 状态快速更新脚本

```bash
./update-status.sh "操作描述"
```

功能：
- 快速更新PROJECT-STATUS.md的执行日志
- 记录操作描述、状态和备注
- 不涉及代码提交

示例：
```bash
./update-status.sh "更新项目文档"
```

## 项目状态管理

项目使用以下文件管理状态和规则：

- **PROJECT-STATUS.md** - 项目状态、页面对应关系和问题记录
- **PROJECT-RULES.md** - 项目开发规则和指南

开发者应该在每次工作前查阅这些文件，了解项目当前状态和优先任务。

## 页面对应关系

每个页面对应一个mockup HTML模板，以下是关键对应关系：

| 页面名称 | 对应Mockup | 路由路径 |
|---------|------------|---------|
| 首页/产品导航 | mockup/1-index.html | / 或 /home |
| 登录页面 | mockup/2-login.html | /login |
| 设备选型页面 | mockup/3-machines.html | /machines |
| 耗材选择页面 | mockup/4-option.html | /products/consumables |
| 备件选择页面 | mockup/5-spare.html | /products/spare-parts |
| 购物车页面 | mockup/6-shopcart.html | /cart |
| 订单确认页面 | mockup/7-order.html | /checkout 或 /order |
| 采购单(PO)页面 | mockup/8-po.html | /po |
| 订单列表页面 | mockup/9-orderlist.html | /orders |

## 开发规则摘要

1. **1:1复刻原则** - 每个页面必须与mockup保持完全一致
2. **正确命名原则** - 组件名称、目录和路由必须反映页面的实际功能
3. **单页单任务原则** - 每次只修改一个页面，完成后立即提交
4. **明确对应原则** - 每个React组件必须明确对应一个mockup模板

完整规则请参考 [PROJECT-RULES.md](./PROJECT-RULES.md)。

## 如何使用

1. 安装依赖：
```bash
npm install
```

2. 运行开发服务器：
```bash
./start-dev.sh
```

3. 进行迭代开发：
```bash
./iterate.sh "迭代任务描述"
```

4. 构建生产版本：
```bash
npm run build
```
