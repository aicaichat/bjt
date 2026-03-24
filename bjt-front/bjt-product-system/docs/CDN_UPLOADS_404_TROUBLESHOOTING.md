# CDN上传文件404问题排查指南

## 📋 问题描述

访问上传文件时返回 404 错误，例如：
```
https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg
Status Code: 404 Not Found
```

## 🔍 可能原因

### 1. 阿里云CDN配置问题 ⚠️ **最可能的原因**

#### 问题表现
- 直接访问服务器IP可以访问文件，但通过CDN域名访问返回404
- HTTP响应头中包含CDN相关标识（如 `X-Cache`, `Via`, `Server: AliYun`）

#### 检查步骤

1. **检查CDN回源配置**
   - 登录阿里云CDN控制台
   - 进入域名配置 → 回源配置
   - 检查回源Host配置：
     - 应该设置为：`eorder.lockedair.com` 或源站IP
   - 检查回源协议：
     - 应该设置为：`HTTP` 或 `跟随协议`
   - 检查回源路径：
     - 确保 `/uploads/` 路径正确回源

2. **检查CDN缓存规则**
   - 进入缓存配置
   - 检查 `/uploads/` 路径的缓存规则：
     - 缓存时间：建议设置为 1-7 天
     - 缓存HTTP状态码：确保包含 `200`
     - **重要**：确保 `404` 状态码的缓存时间设置为 `0` 或很短

3. **检查CDN缓存内容**
   - 如果之前文件不存在，CDN可能缓存了404响应
   - 解决方案：
     - 进入CDN控制台 → 刷新预热
     - 选择"URL刷新"
     - 输入需要刷新的URL：
       ```
       https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg
       ```
     - 或使用目录刷新：
       ```
       https://eorder.lockedair.com/uploads/product_lines/
       ```

### 2. 文件存储位置不匹配

#### 问题表现
- 文件存在于本地，但容器内无法访问
- Nginx配置的路径和实际文件位置不一致

#### 检查步骤

1. **检查文件实际位置**
   ```bash
   # 使用诊断脚本
   ./scripts/diagnose-uploads-404.sh -c
   
   # 或手动检查
   ls -la frontend/public/uploads/product_lines/
   ls -la frontend/dist/uploads/product_lines/
   ```

2. **检查Docker挂载配置**
   ```bash
   # 查看docker-compose配置
   cat docker/prod/docker-compose.prod.yml | grep -A 5 "uploads"
   
   # 检查容器内文件
   docker compose -f docker/prod/docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/uploads/product_lines/
   ```

3. **检查Nginx配置**
   ```bash
   # 查看Nginx配置
   cat nginx/conf.d/production.conf | grep -A 10 "location /uploads/"
   
   # 测试Nginx配置
   docker compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -t
   ```

### 3. URL编码问题

#### 问题表现
- 文件名包含空格，URL编码为 `%20`
- 实际文件名可能使用下划线 `_` 或其他字符

#### 解决方案

1. **检查实际文件名**
   ```bash
   # 列出product_lines目录下的文件
   ls -la frontend/public/uploads/product_lines/
   ```

2. **统一文件名格式**
   - 建议使用下划线 `_` 替代空格
   - 或确保URL正确编码

3. **更新数据库中的image_url**
   ```sql
   -- 检查当前存储的URL
   SELECT id, title_zh, image_url FROM wp_bjt_product_lines WHERE id = 3;
   
   -- 更新为正确的URL（如果需要）
   UPDATE wp_bjt_product_lines 
   SET image_url = '/uploads/product_lines/Water_Activated_Tape_Dispenser.jpg'
   WHERE id = 3;
   ```

### 4. 文件权限问题

#### 检查步骤

```bash
# 检查文件权限
ls -la frontend/public/uploads/product_lines/

# 检查Nginx用户权限
docker compose -f docker/prod/docker-compose.prod.yml exec nginx id

# 测试文件可读性
docker compose -f docker/prod/docker-compose.prod.yml exec nginx cat /usr/share/nginx/html/uploads/product_lines/Water\ Activated\ Tape\ Dispenser.jpg > /dev/null
```

## 🛠️ 诊断工具

### 使用诊断脚本

```bash
# 诊断特定文件
./scripts/diagnose-uploads-404.sh -u "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"

# 检查文件路径
./scripts/diagnose-uploads-404.sh -c

# 完整诊断
./scripts/diagnose-uploads-404.sh -u "..." -f
```

### 手动诊断步骤

1. **检查文件是否存在**
   ```bash
   # 本地检查
   find . -name "*Water*Activated*Tape*Dispenser*" -type f
   
   # 容器内检查
   docker compose -f docker/prod/docker-compose.prod.yml exec nginx find /usr/share/nginx/html/uploads -name "*Water*" -type f
   ```

2. **测试直接访问（绕过CDN）**
   ```bash
   # 获取服务器IP（从.env.production）
   grep SERVER_IP .env.production
   
   # 直接访问服务器
   curl -I http://<SERVER_IP>/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg
   ```

3. **检查HTTP响应头**
   ```bash
   curl -I "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"
   
   # 查看CDN相关头
   curl -I "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg" | grep -iE "(x-cache|cdn|via|server)"
   ```

## 🔧 修复方案

### 方案1: 修复CDN配置（推荐）

1. **登录阿里云CDN控制台**
   - 进入域名管理 → 选择 `eorder.lockedair.com`

2. **配置回源规则**
   - 回源Host: `eorder.lockedair.com`
   - 回源协议: `HTTP`
   - 回源路径: 保持默认（不修改）

3. **配置缓存规则**
   - 路径: `/uploads/`
   - 缓存时间: `7天` 或 `1天`
   - 缓存HTTP状态码: `200`
   - **重要**: 404状态码缓存时间设置为 `0` 或 `1分钟`

4. **刷新CDN缓存**
   - URL刷新: 刷新特定文件URL
   - 目录刷新: 刷新 `/uploads/product_lines/` 目录

### 方案2: 同步文件到正确位置

```bash
# 确保文件在正确位置
mkdir -p frontend/dist/uploads/product_lines
cp frontend/public/uploads/product_lines/* frontend/dist/uploads/product_lines/ 2>/dev/null || true

# 重新部署
./deploy-production.sh
```

### 方案3: 修复文件名

```bash
# 重命名文件（使用下划线替代空格）
cd frontend/public/uploads/product_lines/
mv "Water Activated Tape Dispenser.jpg" "Water_Activated_Tape_Dispenser.jpg"

# 更新数据库
# （通过管理后台或SQL更新image_url字段）
```

### 方案4: 检查并修复Nginx配置

```bash
# 检查当前配置
cat nginx/conf.d/production.conf | grep -A 15 "location /uploads/"

# 确保配置正确：
# location /uploads/ {
#     alias /usr/share/nginx/html/uploads/;
#     try_files $uri @wordpress_uploads;
#     ...
# }

# 重新加载Nginx
docker compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload
```

## 📊 验证修复

### 1. 检查文件可访问性

```bash
# 通过CDN访问
curl -I "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"

# 应该返回: HTTP/1.1 200 OK
```

### 2. 检查HTTP响应头

```bash
curl -I "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg" | head -20

# 应该看到:
# - Content-Type: image/jpeg
# - Cache-Control: public, max-age=86400
# - 不应该看到: 404 Not Found
```

### 3. 检查CDN缓存状态

```bash
# 多次请求，检查CDN缓存
for i in {1..3}; do
    echo "请求 $i:"
    curl -I "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg" | grep -iE "(x-cache|age|cache-control)"
    sleep 1
done
```

## 🚨 常见错误

### 错误1: CDN缓存了404响应

**症状**: 文件已存在，但CDN仍然返回404

**解决**: 
1. 在CDN控制台刷新该URL缓存
2. 配置CDN不缓存404响应

### 错误2: 回源Host配置错误

**症状**: CDN回源时使用了错误的Host头

**解决**: 在CDN控制台设置回源Host为正确的域名

### 错误3: 文件路径大小写不匹配

**症状**: Linux系统区分大小写，但URL使用的大小写不匹配

**解决**: 确保URL中的路径大小写与实际文件路径完全一致

## 📞 获取帮助

如果问题仍未解决：

1. 运行完整诊断: `./scripts/diagnose-uploads-404.sh -u "<URL>" -f`
2. 收集日志: `./scripts/view-production-logs.sh -e -a`
3. 检查Nginx错误日志: `./scripts/view-production-logs.sh -e nginx`

---

**最后更新**: 2024-01-13
