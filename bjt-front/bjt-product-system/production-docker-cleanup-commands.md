# 生产环境Docker空间快速清理命令

## 🚀 **方法1: 使用清理脚本** (推荐)

### 1. 上传脚本到生产服务器
```bash
# 将 cleanup-production-docker.sh 上传到生产服务器
scp cleanup-production-docker.sh user@production-server:/tmp/
```

### 2. 在生产服务器上执行
```bash
# SSH到生产服务器
ssh user@production-server

# 执行清理脚本
chmod +x /tmp/cleanup-production-docker.sh
sudo /tmp/cleanup-production-docker.sh
```

## ⚡ **方法2: 直接命令行清理**

如果无法上传脚本，可以在生产服务器上直接执行以下命令：

### 1. 检查当前空间使用
```bash
# 检查磁盘空间
df -h

# 检查Docker空间使用
sudo docker system df
```

### 2. 逐步清理（安全方式）
```bash
# 停止BJT相关容器（如果有）
sudo docker stop $(sudo docker ps -q --filter "name=bjt") 2>/dev/null || echo "没有BJT容器运行"

# 删除停止的容器
sudo docker container prune -f

# 删除未使用的镜像
sudo docker image prune -a -f

# 删除未使用的网络
sudo docker network prune -f

# 删除未使用的卷
sudo docker volume prune -f

# 清理构建缓存（这是占用最多空间的）
sudo docker builder prune -a -f
```

### 3. 一键清理（快速方式）
```bash
# ⚠️ 注意：这会删除所有未使用的Docker数据
sudo docker system prune -a --volumes -f
```

## 🔍 **清理后验证**

```bash
# 检查清理效果
sudo docker system df

# 检查磁盘空间
df -h

# 验证Docker服务正常
sudo docker info
```

## 📊 **预期清理效果**

根据您之前的状态：
- **Build Cache**: 35.78GB → 预计释放 6.8GB+
- **Images**: 5.95GB → 预计释放 3.6GB+
- **Volumes**: 864MB → 预计释放 307MB+

**总计可释放**: 约 **10GB+** 空间

## ⚠️ **注意事项**

1. **重要服务保护**: 清理前确认没有重要的容器在运行
2. **数据备份**: 如果有重要的Docker卷数据，请先备份
3. **权限要求**: 需要sudo权限执行Docker命令
4. **网络影响**: 清理可能会暂时影响Docker网络连接

## 🎯 **清理完成后**

空间清理完成后，您就可以：
1. 重新构建Docker镜像
2. 或者使用手动部署包: `bjt-production-manual-deploy-20250702_072633.tar.gz`

## 📞 **紧急联系**

如果清理过程中遇到问题：
1. 停止清理操作: `Ctrl+C`
2. 检查系统状态: `sudo systemctl status docker`
3. 重启Docker服务: `sudo systemctl restart docker` 