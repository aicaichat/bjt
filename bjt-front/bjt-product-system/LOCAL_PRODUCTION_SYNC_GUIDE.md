# BJT产品系统 - 本地生产环境同步指南

## 概述

本指南介绍如何将线上生产环境的配置同步到本地开发环境，确保本地和线上环境完全一致，从而能够在本地重现和调试线上问题。

## 核心理念

**"Use Production Config Locally"** - 在本地使用生产环境配置

- ✅ 功能开关与生产环境一致
- ✅ 数据库结构与生产环境一致  
- ✅ API行为与生产环境一致
- ✅ 线上问题可在本地重现
- ✅ 修复验证更可靠

## 快速开始

### 1. 一键启动本地生产环境

```bash
# 使用线上配置启动本地环境
./start-local-production-env.sh
```

这个命令会：
- 自动从 `.env.production` 加载生产环境配置
- 同步功能开关到本地前端配置
- 启动Docker后端服务 (MySQL + WordPress)
- 启动前端开发服务器 (支持热重载)
- 验证所有服务正常运行

### 2. 检查环境一致性

```bash
# 对比本地和生产环境配置
./scripts/compare-environments.sh
```

这个工具会显示：
- 功能开关对比表
- API配置差异
- 数据库配置状态
- 环境一致性评估
- 同步建议

## 详细功能

### 配置同步工具

#### 完整同步 (推荐)
```bash
# 完整的生产配置同步
./scripts/sync-production-config.sh
```

功能：
- 创建本地生产环境Docker配置
- 同步所有环境变量
- 创建管理脚本
- 完整的环境验证

#### 快速同步
```bash
# 快速启动，适合日常使用
./start-local-production-env.sh
```

功能：
- 快速加载生产配置
- 启动必要服务
- 基本环境验证

### 环境对比工具

#### 完整对比
```bash
./scripts/compare-environments.sh
```

#### 分项对比
```bash
./scripts/compare-environments.sh --features    # 只对比功能开关
./scripts/compare-environments.sh --api        # 只对比API配置
./scripts/compare-environments.sh --database   # 只对比数据库配置
./scripts/compare-environments.sh --status     # 显示运行状态
```

## 配置文件结构

### 生产环境配置
```
.env.production                 # 生产环境主配置
├── 数据库配置
├── WordPress配置  
├── 安全密钥
└── 功能开关
```

### 本地同步配置
```
.env.local-production          # 本地生产环境配置
frontend/.env.local            # 前端生产配置
docker/dev/docker-compose.local-production.yml  # 本地生产Docker配置
```

## 关键功能开关

以下功能开关直接影响系统行为，必须与生产环境保持一致：

| 功能开关 | 说明 | 影响范围 |
|---------|------|---------|
| `VITE_ENABLE_SMART_UNITS` | 智能单位系统 | 产品显示、购物车 |
| `VITE_ENABLE_CART_ENHANCEMENT` | 购物车增强功能 | 购物车行为 |
| `VITE_ENABLE_STANDARD_FIELDS` | 标准字段显示 | 产品信息展示 |
| `VITE_ENABLE_MULTILANG` | 多语言支持 | 界面语言 |
| `VITE_USE_STANDARDIZED_FIELDS` | 标准化字段 | 数据格式 |
| `VITE_ENABLE_SMART_UNIT_SYSTEM` | 智能单位系统 | 数量计算 |
| `VITE_USE_MOCK_CART` | 模拟购物车 | 数据来源 |

## 使用场景

### 场景1: 线上Bug调试

```bash
# 1. 同步生产配置
./start-local-production-env.sh

# 2. 验证配置一致性
./scripts/compare-environments.sh

# 3. 在本地重现问题
# 访问 http://localhost:5173

# 4. 修复问题并验证
# 代码修改会自动热重载

# 5. 停止环境
./stop-local-production-env.sh
```

### 场景2: 新功能测试

```bash
# 1. 启动本地生产环境
./start-local-production-env.sh

# 2. 修改功能开关 (在 .env.production 中)
# VITE_ENABLE_NEW_FEATURE=true

# 3. 重新同步配置
./start-local-production-env.sh

# 4. 测试新功能
# 访问 http://localhost:5173

# 5. 验证与生产环境一致性
./scripts/compare-environments.sh
```

### 场景3: 配置验证

```bash
# 检查当前环境状态
./scripts/compare-environments.sh --status

# 对比功能开关
./scripts/compare-environments.sh --features

# 获取同步建议
./scripts/compare-environments.sh
```

## 环境管理

### 启动环境
```bash
./start-local-production-env.sh          # 一键启动
./start-local-production.sh              # 只启动Docker服务
```

### 停止环境
```bash
./stop-local-production-env.sh           # 一键停止
./stop-local-production.sh               # 只停止Docker服务
```

### 查看日志
```bash
# 前端日志
tail -f logs/frontend-production.log

# 后端日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs -f wordpress

# 数据库日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs -f mysql
```

### 重启服务
```bash
# 重启前端 (保持后端运行)
./stop-local-production-env.sh
./start-local-production-env.sh

# 重启后端
docker-compose -f docker/dev/docker-compose.nginx.yml restart wordpress

# 重启数据库
docker-compose -f docker/dev/docker-compose.nginx.yml restart mysql
```

## 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
lsof -ti:5173
lsof -ti:8080

# 停止占用进程
./stop-local-production-env.sh
```

#### 2. Docker服务启动失败
```bash
# 查看Docker日志
docker-compose -f docker/dev/docker-compose.nginx.yml logs

# 重新构建镜像
docker-compose -f docker/dev/docker-compose.nginx.yml build --no-cache
```

#### 3. API连接失败
```bash
# 检查后端服务
curl http://localhost:8080/wp-json/bjt/v1

# 检查前端代理配置
cat frontend/.env.local
```

#### 4. 配置不一致
```bash
# 对比配置差异
./scripts/compare-environments.sh

# 重新同步配置
./start-local-production-env.sh
```

### 日志文件位置
```
logs/
├── frontend-production.log    # 前端开发服务器日志
├── frontend-production.pid    # 前端进程ID
└── ...
```

### 配置文件检查
```bash
# 检查生产配置
cat .env.production

# 检查本地配置
cat frontend/.env.local

# 检查Docker配置
cat docker/dev/docker-compose.local-production.yml
```

## 最佳实践

### 1. 定期同步
- 每次开始开发前运行 `./start-local-production-env.sh`
- 生产环境配置变更后立即同步

### 2. 配置验证
- 使用 `./scripts/compare-environments.sh` 定期检查一致性
- 关注关键功能开关的差异

### 3. 问题重现
- 确保本地环境与生产环境配置完全一致
- 使用相同的数据库结构和数据
- 验证API行为一致性

### 4. 修复验证
- 在本地修复问题后，确保配置仍然一致
- 在类生产环境中充分测试
- 部署前再次验证配置

## 技术架构

### 网络架构
```
本地生产环境架构:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端开发服务器   │    │   Docker后端服务   │    │   MySQL数据库    │
│   localhost:5173 │───▶│   localhost:8080  │───▶│   localhost:3306│
│   (Node.js)     │    │   (WordPress)    │    │   (MySQL 8.0)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
  生产配置+调试模式          生产配置+生产镜像          生产配置+生产数据
```

### 配置优先级
```
前端配置优先级:
1. frontend/.env.local (最高优先级)
2. frontend/env.production
3. frontend/env.development
4. Vite默认配置

后端配置优先级:
1. .env.local-production (最高优先级)
2. .env.production
3. Docker Compose环境变量
4. 容器默认配置
```

## 总结

通过使用本地生产环境同步功能，您可以：

✅ **确保环境一致性** - 本地和线上配置完全一致  
✅ **提高问题重现率** - 线上问题可在本地重现  
✅ **提升修复效率** - 快速调试和验证修复  
✅ **降低部署风险** - 在类生产环境中充分测试  
✅ **简化开发流程** - 一键启动和管理环境  

开始使用：
```bash
./start-local-production-env.sh
```

检查一致性：
```bash
./scripts/compare-environments.sh
```

现在您的本地环境与线上完全一致，可以有效地重现和修复生产环境问题！ 