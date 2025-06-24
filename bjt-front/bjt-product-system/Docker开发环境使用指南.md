# BJT产品系统 - Docker开发环境使用指南

## 🚀 快速开始

### 前端服务快速重启
```bash
# 方法1: 使用根目录的快速脚本
./restart-frontend.sh

# 方法2: 使用完整的管理脚本
./scripts/docker-dev.sh restart-frontend
```

### 完整开发环境管理
```bash
# 启动所有服务
./scripts/docker-dev.sh start

# 停止所有服务
./scripts/docker-dev.sh stop

# 重启所有服务
./scripts/docker-dev.sh restart

# 查看服务状态
./scripts/docker-dev.sh status

# 查看前端日志
./scripts/docker-dev.sh logs-frontend

# 查看后端日志
./scripts/docker-dev.sh logs-backend
```

## 📋 服务说明

### 服务端口
- **前端开发服务器**: http://localhost:5173
- **WordPress后端**: http://localhost:8080
- **Nginx代理**: http://localhost:80
- **MySQL数据库**: localhost:3306

### 容器名称
- `dev-frontend-1`: 前端开发服务器
- `dev-wordpress-1`: WordPress后端
- `dev-mysql-1`: MySQL数据库
- `dev-nginx-1`: Nginx反向代理

## 🔧 常用操作

### 1. 重启前端服务（推荐）
```bash
./restart-frontend.sh
```
**优势**: 
- ✅ 只重启前端容器，不影响后端服务
- ✅ 不会杀死MySQL进程
- ✅ 保持后端API连接正常

### 2. 查看数据库数据
```bash
./scripts/docker-dev.sh check-db
```

### 3. 进入容器调试
```bash
# 进入前端容器
./scripts/docker-dev.sh shell frontend

# 进入后端容器
./scripts/docker-dev.sh shell wordpress

# 进入数据库容器
./scripts/docker-dev.sh shell mysql
```

### 4. 查看实时日志
```bash
# 前端日志
./scripts/docker-dev.sh logs-frontend

# 后端日志
./scripts/docker-dev.sh logs-backend

# 所有服务日志
./scripts/docker-dev.sh logs
```

## 🐛 调试指南

### 前端开发调试
1. 重启前端服务：`./restart-frontend.sh`
2. 查看前端日志：`./scripts/docker-dev.sh logs-frontend`
3. 进入前端容器：`./scripts/docker-dev.sh shell frontend`

### 后端API调试
1. 查看后端日志：`./scripts/docker-dev.sh logs-backend`
2. 检查数据库：`./scripts/docker-dev.sh check-db`
3. 进入WordPress容器：`./scripts/docker-dev.sh shell wordpress`

### 数据库调试
```bash
# 查看订单数据
cd docker/dev
docker-compose -f docker-compose.nginx.yml exec mysql mysql -u wordpress -pwordpress bjt_product -e "SELECT id, order_number, shipping_address FROM wp_bjt_orders LIMIT 5;"

# 查看所有表
docker-compose -f docker-compose.nginx.yml exec mysql mysql -u wordpress -pwordpress bjt_product -e "SHOW TABLES;"
```

## 💡 最佳实践

### 开发流程
1. **启动环境**: `./scripts/docker-dev.sh start`
2. **开发前端**: 修改代码后使用 `./restart-frontend.sh` 重启
3. **调试问题**: 使用 `logs-frontend` 查看日志
4. **测试API**: 后端服务保持运行，数据持久化

### 性能优化
- 使用 `restart-frontend` 而不是重启整个环境
- 定期清理容器：`./scripts/docker-dev.sh clean`
- 必要时重新构建：`./scripts/docker-dev.sh rebuild`

## 🔍 故障排除

### 端口占用问题
```bash
# 检查端口占用
lsof -ti:5173 | xargs kill -9

# 或者直接重启前端容器
./restart-frontend.sh
```

### Docker服务异常
```bash
# 重启Docker Desktop
# 然后重新启动服务
./scripts/docker-dev.sh start
```

### 数据库连接问题
```bash
# 检查数据库状态
./scripts/docker-dev.sh check-db

# 重启后端服务
./scripts/docker-dev.sh restart-backend
```

## 📚 脚本命令参考

### docker-dev.sh 完整命令列表
```bash
./scripts/docker-dev.sh [命令] [服务名]

命令:
  start              启动所有服务
  stop               停止所有服务  
  restart            重启所有服务
  restart-frontend   只重启前端服务
  restart-backend    只重启后端服务
  status             查看服务状态
  logs               查看所有服务日志
  logs-frontend      查看前端服务日志
  logs-backend       查看后端服务日志
  shell              进入容器shell
  clean              清理停止的容器
  rebuild            重新构建并启动服务
  check-db           检查数据库连接
  help               显示帮助信息
```

---

## 🎯 运输信息调试专用

如果需要调试运输信息传递问题，可以：

1. **查看数据库中的运输信息**:
```bash
./scripts/docker-dev.sh check-db
```

2. **查看前端日志中的调试信息**:
```bash
./scripts/docker-dev.sh logs-frontend
```

3. **重启前端服务测试修复效果**:
```bash
./restart-frontend.sh
```

4. **访问测试页面**:
- http://localhost:5173/test-shipping-api-fix.html 