# BJT开发环境MySQL启动问题修复指南

## 🎯 问题描述

- **现象**: 本地开发环境启动失败，MySQL启动卡住
- **根因**: 昨天或更早的版本可以启动，最近的生产环境适配导致开发环境配置冲突
- **目标**: 安全修复开发环境，确保不影响生产环境

## 🛡️ 安全保障机制

### 1. 多重安全检查
- ✅ **生产环境配置完整性验证** - 每次操作前验证生产环境配置
- ✅ **环境隔离保护** - 只修改 `docker/dev/` 下的文件
- ✅ **自动备份机制** - 操作前自动创建完整备份
- ✅ **回滚机制** - 一键回滚到修复前状态

### 2. 状态管理系统
- ✅ **中断恢复** - 支持中断后从断点继续执行
- ✅ **状态追踪** - 详细记录每个步骤的执行状态
- ✅ **日志记录** - 完整的操作日志和错误信息
- ✅ **进度查看** - 随时查看修复进度

## 🚀 使用方法

### 第一步：检查脚本权限
```bash
chmod +x fix-dev-mysql-safe.sh
```

### 第二步：先进行诊断（推荐）
```bash
# 仅诊断问题，不执行修复
./fix-dev-mysql-safe.sh --diagnose
```

**诊断步骤**：
1. 验证生产环境配置完整性
2. 创建安全备份
3. 检查Docker服务状态
4. 检查端口占用情况
5. 尝试启动MySQL并获取详细日志
6. 分析常见问题模式

### 第三步：执行修复（如果需要）
```bash
# 执行完整的诊断和修复流程
./fix-dev-mysql-safe.sh --fix
```

**修复流程**：
1. 重复诊断步骤
2. 清理Docker缓存和数据卷
3. 修复配置文件问题
4. 测试MySQL启动
5. 验证修复结果

### 第四步：查看状态（可选）
```bash
# 查看当前修复进度
./fix-dev-mysql-safe.sh --status
```

## 🔧 高级选项

### 回滚操作
```bash
# 如果修复失败，一键回滚
./fix-dev-mysql-safe.sh --rollback
```

### 清理临时文件
```bash
# 清理所有临时文件和状态
./fix-dev-mysql-safe.sh --cleanup
```

### 获取帮助
```bash
# 显示详细帮助信息
./fix-dev-mysql-safe.sh --help
```

## 📊 输出示例

### 成功的诊断输出
```bash
[步骤] 验证生产环境配置完整性...
[成功] ✅ docker/prod/docker-compose.prod.yml 配置完整
[成功] ✅ docker/prod/docker-compose.hot-deploy.yml 配置完整
[成功] ✅ 生产环境配置完整性验证通过

[步骤] 创建安全备份...
[成功] ✅ 备份已创建: /path/to/backups/fix-dev-mysql-20241205_143022

[步骤] 诊断MySQL启动问题...
[步骤] 检查Docker服务状态...
[成功] Docker服务正常
[步骤] 检查MySQL端口占用...
[成功] 端口3306可用
...
```

### 错误处理示例
```bash
[错误] ❌ docker/prod/docker-compose.prod.yml 配置有问题！
[错误] 🚨 检测到生产环境配置异常，停止操作以保护生产环境
```

## 📁 生成的文件结构

```
bjt-product-system/
├── fix-dev-mysql-safe.sh          # 修复脚本
├── logs/                           # 日志目录
│   ├── fix-dev-mysql.state        # 状态文件
│   └── fix-dev-mysql-YYYYMMDD_HHMMSS.log  # 详细日志
└── backups/                        # 备份目录
    └── fix-dev-mysql-YYYYMMDD_HHMMSS/
        ├── docker-dev-original/    # 原始配置备份
        ├── env-development-original # 环境变量备份
        ├── git-status.txt          # Git状态记录
        └── docker-containers.txt   # Docker状态记录
```

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 生产环境配置验证失败
**现象**: 脚本在验证生产环境配置时报错
**解决**: 
- 检查 `docker/prod/` 下的配置文件语法
- 确保Docker Compose版本兼容
- 运行 `docker-compose -f docker/prod/docker-compose.prod.yml config` 查看具体错误

#### 2. MySQL端口被占用
**现象**: 端口3306被其他进程占用
**解决**:
```bash
# 查看占用进程
lsof -i :3306
# 停止占用进程
sudo kill -9 <PID>
```

#### 3. Docker服务未运行
**现象**: Docker服务状态检查失败
**解决**:
```bash
# 启动Docker服务
sudo systemctl start docker  # Linux
# 或者启动Docker Desktop # macOS/Windows
```

#### 4. 权限问题
**现象**: 权限相关错误
**解决**:
```bash
# 检查Docker用户组
sudo usermod -aG docker $USER
# 重新登录或重启终端
```

## 📋 检查点清单

### 执行前检查
- [ ] 确认在BJT项目根目录
- [ ] 确认 `fix-dev-mysql-safe.sh` 有执行权限
- [ ] 确认Docker服务正在运行
- [ ] 确认有足够的磁盘空间（至少1GB）

### 执行中监控
- [ ] 生产环境配置验证通过
- [ ] 备份创建成功
- [ ] 诊断日志生成正常
- [ ] 没有错误中断

### 执行后验证
- [ ] MySQL启动成功
- [ ] 开发环境可以正常访问
- [ ] 生产环境配置未受影响
- [ ] 日志文件已生成

## 🆘 紧急处理流程

### 如果修复过程中出现问题
1. **不要恐慌** - 所有操作都有备份
2. **查看日志** - 检查生成的日志文件
3. **执行回滚** - 运行 `./fix-dev-mysql-safe.sh --rollback`
4. **联系支持** - 提供日志文件和错误信息

### 如果脚本被意外中断
1. 运行 `./fix-dev-mysql-safe.sh --status` 查看进度
2. 根据状态决定是否继续或回滚
3. 如果需要重新开始，先运行 `--cleanup` 清理状态

## 🎯 最佳实践

### 建议的执行步骤
```bash
# 1. 先诊断问题
./fix-dev-mysql-safe.sh --diagnose

# 2. 查看诊断结果
cat logs/fix-dev-mysql-*.log

# 3. 如果诊断发现问题，执行修复
./fix-dev-mysql-safe.sh --fix

# 4. 验证修复结果
docker-compose -f docker/dev/docker-compose.nginx.yml up -d
```

### 预防措施
- 定期备份开发环境配置
- 使用Git跟踪配置文件变更
- 建立开发/生产环境配置审查流程
- 设置配置文件变更通知机制

## 📞 支持信息

### 日志文件位置
- **详细日志**: `logs/fix-dev-mysql-YYYYMMDD_HHMMSS.log`
- **状态文件**: `logs/fix-dev-mysql.state`
- **备份目录**: `backups/fix-dev-mysql-YYYYMMDD_HHMMSS/`

### 提交问题时请包含
1. 脚本执行的完整日志
2. `docker-compose -f docker/dev/docker-compose.nginx.yml logs mysql` 的输出
3. 系统信息：`docker --version` 和 `docker-compose --version`
4. 操作系统版本信息

---

**重要提醒**: 此脚本经过精心设计，包含多重安全机制，但仍建议在执行前创建项目的Git备份。 