# BJT Product System - Git问题修复指南

## 🚨 远程机器Git Pull问题解决方案

当您在远程机器上无法执行 `git pull` 时，请按以下步骤操作：

## 📋 问题诊断清单

### 常见问题：
- ✅ 网络连接问题
- ✅ SSH密钥认证失败
- ✅ Git配置问题
- ✅ 工作目录有未提交更改
- ✅ uploads文件冲突
- ✅ 权限问题

## 🛠️ 解决方案

### 方案1: 快速修复（推荐）

```bash
# 在项目根目录执行
./scripts/quick-git-pull.sh
```

**特点：**
- 🚀 快速简单
- 💾 自动备份uploads文件
- 🔄 自动恢复用户文件
- ✅ 适合大多数情况

### 方案2: 完整诊断修复

```bash
# 在项目根目录执行
./scripts/remote-git-fix.sh
```

**特点：**
- 🔍 全面诊断网络、SSH、Git配置
- 🔧 自动修复常见问题
- 📊 详细的状态报告
- 🛡️ 安全的冲突处理

### 方案3: 手动修复

如果脚本无法解决问题，请按以下步骤手动操作：

#### 步骤1: 检查网络连接
```bash
ping -c 3 github.com
nslookup github.com
```

#### 步骤2: 检查Git配置
```bash
git remote -v
git status
git branch -v
```

#### 步骤3: 切换到HTTPS（如果使用SSH有问题）
```bash
git remote set-url origin https://github.com/aicaichat/bjt.git
```

#### 步骤4: 备份uploads文件
```bash
cp -r frontend/public/uploads uploads_backup_$(date +%Y%m%d_%H%M%S)
```

#### 步骤5: 重置Git状态
```bash
git reset --hard HEAD
git clean -fd -e "frontend/public/uploads/*" -e "uploads_backup_*"
```

#### 步骤6: 执行Git Pull
```bash
git pull
```

#### 步骤7: 恢复uploads文件
```bash
cp -r uploads_backup_*/* frontend/public/uploads/
```

## 🔧 特殊情况处理

### 情况1: 权限问题
```bash
# 检查文件权限
ls -la frontend/public/uploads/
# 修复权限
chmod -R 755 frontend/public/uploads/
```

### 情况2: 磁盘空间不足
```bash
# 检查磁盘空间
df -h
# 清理Docker镜像
docker system prune -f
```

### 情况3: Git凭据问题
```bash
# 清除Git凭据缓存
git config --global --unset credential.helper
# 重新配置
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'
```

### 情况4: DNS问题
```bash
# 使用IP地址（临时解决）
echo "140.82.113.3 github.com" >> /etc/hosts
```

## 📞 技术支持

如果以上方法都无法解决问题，请提供以下信息：

1. **错误信息：** 完整的Git错误输出
2. **系统信息：** `uname -a` 和 `git --version`
3. **网络状态：** `ping github.com` 结果
4. **Git状态：** `git status` 和 `git remote -v` 输出

## 🎯 预防措施

为避免将来出现类似问题：

1. **定期更新：** 每周至少执行一次 `git pull`
2. **备份重要文件：** 使用 `./scripts/sync-uploads.sh` 管理uploads
3. **监控磁盘空间：** 确保有足够的存储空间
4. **网络稳定性：** 使用稳定的网络连接

## 📚 相关脚本

- `scripts/sync-uploads.sh` - uploads文件同步管理
- `scripts/quick-git-pull.sh` - 快速Git Pull
- `scripts/remote-git-fix.sh` - 完整诊断修复
- `deploy-production.sh` - 生产环境部署

---

💡 **提示：** 建议先使用快速修复脚本，如果仍有问题再使用完整诊断脚本。 