# 远程服务器耗材筛选功能修复指南

## 🌐 适用场景

这个脚本专门为远程服务器环境设计，能够：
- 自动检测API端点（支持多种网络配置）
- 检查和启动Docker服务
- 适配不同的部署环境
- 提供完整的备份和回滚机制

## 📋 使用步骤

### 1. 上传脚本到远程服务器

```bash
# 将整个项目上传到远程服务器
scp -r bjt-product-system/ root@your-server:/path/to/
```

### 2. 在远程服务器上执行

```bash
# 进入项目目录
cd /path/to/bjt-product-system

# 运行远程修复脚本
./scripts/consumables-filter-fix-automation-remote.sh
```

## 🔍 脚本功能详解

### 自动API端点检测
脚本会自动测试以下端点：
- `http://localhost:8080/wp-json/bjt/v1/consumables`
- `http://127.0.0.1:8080/wp-json/bjt/v1/consumables`
- `http://[服务器IP]:8080/wp-json/bjt/v1/consumables`
- `http://[Docker容器IP]/wp-json/bjt/v1/consumables`

### Docker服务检查
- 检查WordPress容器状态
- 自动启动未运行的容器
- 监控容器健康状态

### 环境检查
- 操作系统信息
- 网络连接状态
- 磁盘空间检查
- 必需文件验证

## 🛡️ 安全特性

### 完整备份
- 自动备份关键文件
- 记录修复前API状态
- 保存系统信息快照

### 分步确认
- 每个修复步骤都需要人工确认
- 可以选择性跳过某些步骤
- 提供详细的操作日志

### 快速回滚
```bash
# 如果修复出现问题，可以快速回滚
cp /tmp/consumables_remote_fix_[时间戳]/class-consumable-controller.php plugins/bjt-core-entities/controllers/
docker restart dev-wordpress-1
```

## 📊 执行示例

```bash
root@server:~/bjt-product-system# ./scripts/consumables-filter-fix-automation-remote.sh

🌐 耗材筛选功能远程服务器修复脚本
========================================
ℹ️  🔍 环境检查...
ℹ️  操作系统: Linux server 5.4.0-74-generic #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
✅ 网络连接正常
✅ 磁盘空间充足 (45%)
✅ 环境检查通过

ℹ️  🐳 检查Docker服务状态...
ℹ️  WordPress容器健康状态: healthy

ℹ️  🔍 自动检测API端点...
ℹ️  测试端点: http://localhost:8080/wp-json/bjt/v1/consumables
❌ 端点不可用 (HTTP 000): http://localhost:8080/wp-json/bjt/v1/consumables
ℹ️  测试端点: http://172.18.0.3/wp-json/bjt/v1/consumables
✅ 找到可用的API端点: http://172.18.0.3/wp-json/bjt/v1/consumables

ℹ️  📦 创建备份: /tmp/consumables_remote_fix_20250616_084521
✅ 备份完成: /tmp/consumables_remote_fix_20250616_084521

ℹ️  🔧 开始执行修复...
```

## ⚠️ 注意事项

### 生产环境使用
1. **维护窗口**: 建议在低峰时段执行
2. **通知用户**: 提前通知可能的服务中断
3. **监控准备**: 确保有人员监控执行过程

### 网络要求
- 服务器需要能访问外网（用于检测公网IP）
- Docker容器网络正常
- 端口8080可访问

### 依赖检查
- Docker和docker-compose已安装
- jq命令可用（用于JSON解析）
- curl命令可用（用于API测试）

## 🔧 故障排除

### 常见问题

#### 1. API端点检测失败
```bash
# 手动检查Docker容器状态
docker ps -a
docker logs dev-wordpress-1

# 手动启动服务
docker-compose -f docker/dev/docker-compose.nginx.yml up -d
```

#### 2. 权限问题
```bash
# 确保脚本有执行权限
chmod +x scripts/consumables-filter-fix-automation-remote.sh

# 确保子脚本有执行权限
chmod +x scripts/fix-consumables-mapping.sh
chmod +x scripts/fix-consumables-filter-options.sh
```

#### 3. 网络连接问题
```bash
# 检查容器网络
docker network ls
docker inspect dev-wordpress-1

# 检查端口占用
netstat -tlnp | grep 8080
```

## 📞 技术支持

如果遇到问题，请提供以下信息：
1. 脚本执行日志
2. 备份目录路径
3. 系统信息文件内容
4. Docker容器状态

备份目录位置：`/tmp/consumables_remote_fix_[时间戳]/` 