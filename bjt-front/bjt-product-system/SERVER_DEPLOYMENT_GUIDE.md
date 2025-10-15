# BJT 生产环境部署指南

## ✅ 问题已解决

### 修复内容总结

1. ✅ **修复了 REST API `register_rest_route` 警告**
   - 所有路由参数改为 array-of-arrays 格式（WordPress 6.1+ 要求）
   - 不再有 `X-WP-DoingItWrong` 警告

2. ✅ **添加了自动修复配置功能**
   - `auto-fix-config.php` 自动修复损坏的 WordPress 配置
   - 自动恢复 `active_plugins`、`permalink_structure`、`siteurl`、`home`

3. ✅ **修复了环境变量加载问题**
   - 创建了正确的启动脚本，确保 `.env.production` 被加载
   - 数据库连接问题已解决

## 🚀 服务器部署步骤

### 方式一：使用管理脚本（推荐）

```bash
# 进入项目目录
cd /var/bjt/www/bjt/bjt-front/bjt-product-system

# 拉取最新代码
git fetch origin phase-2
git reset --hard origin/phase-2

# 启动服务（自动使用 .env.production）
bash scripts/start-production.sh

# 重启服务
bash scripts/restart-production.sh

# 停止服务
bash scripts/stop-production.sh
```

### 方式二：手动命令

```bash
cd /var/bjt/www/bjt/bjt-front/bjt-product-system

# ⚠️ 重要：必须加上 --env-file 参数！
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up -d
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production restart
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production down
```

## 🔍 验证部署成功

```bash
# 1. 检查容器状态
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps

# 2. 验证 API 端点
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic

# 3. 检查是否有警告（应该没有 X-WP-DoingItWrong）
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic | grep "X-WP"

# 4. 查看日志
docker logs prod_wordpress_1 --tail=50
```

**成功标志：**
- ✅ API 返回 `HTTP/1.1 200 OK`
- ✅ 没有 `X-WP-DoingItWrong` 警告
- ✅ 没有 `404 Not Found` 错误

## ⚠️ 常见问题

### 1. 数据库连接失败（500 错误）

**原因：** 环境变量未加载

**解决：** 确保使用 `--env-file .env.production` 参数或使用管理脚本

```bash
# 错误方式（会导致数据库连接失败）
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 正确方式
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up -d
# 或使用脚本
bash scripts/start-production.sh
```

### 2. API 返回 404

**原因：** 
- 插件未激活
- 重写规则未刷新

**解决：**
```bash
# 手动修复 active_plugins（如果自动修复失败）
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec mysql mysql -u root -pbjtpassword123 bjt -e "
UPDATE wp_options 
SET option_value = 'a:3:{i:0;s:39:\"bjt-core-entities/bjt-product-api.php\";i:1;s:20:\"bjt-cors/bjt-cors.php\";i:2;s:18:\"rest-api/plugin.php\";}' 
WHERE option_name = 'active_plugins';
"

# 刷新重写规则
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec wordpress wp rewrite flush --allow-root
```

### 3. wp-cli 损坏（exec format error）

**解决：**
```bash
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec wordpress bash -c "
    rm -f /usr/local/bin/wp
    curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    chmod +x wp-cli.phar
    mv wp-cli.phar /usr/local/bin/wp
"
```

## 📋 自动修复功能

系统已内置自动修复功能（`auto-fix-config.php`），会在以下时机自动修复配置：

- ✅ 每次页面加载 (`plugins_loaded`)
- ✅ 访问后台 (`admin_init`)
- ✅ API 请求 (`rest_api_init`)
- ✅ 每小时定时检查 (`wp-cron`)

**自动修复内容：**
- `active_plugins` 损坏 → 自动恢复为正确数组
- `permalink_structure` 为空 → 自动设置为 `/%postname%/`
- `siteurl` / `home` 不正确 → 自动修正为 `https://eorder.lockedair.com`

## 🔧 监控脚本

系统提供了两个监控脚本（可选）：

```bash
# 1. 手动激活插件脚本
bash scripts/keep-plugins-active.sh

# 2. 监控和自动修复脚本
bash scripts/monitor-plugins.sh

# 3. 设置 cron 定时监控（每 5 分钟）
bash scripts/setup-plugin-monitoring.sh
```

## 📝 更新日志

### 2025-10-15
- ✅ 修复了所有 `register_rest_route` 的参数格式
- ✅ 添加了 `auto-fix-config.php` 自动修复功能
- ✅ 创建了生产环境管理脚本
- ✅ 修复了环境变量加载问题
- ✅ 消除了 `X-WP-DoingItWrong` 警告

## 🎯 下次部署清单

1. [ ] 进入项目目录：`cd /var/bjt/www/bjt/bjt-front/bjt-product-system`
2. [ ] 拉取最新代码：`git pull origin phase-2`
3. [ ] 使用管理脚本启动：`bash scripts/start-production.sh`
4. [ ] 验证 API：`curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic`
5. [ ] 检查日志：`docker logs prod_wordpress_1 --tail=50`

---

**注意：** 所有 docker-compose 命令都必须加上 `--env-file .env.production` 参数，或直接使用 `scripts/` 目录下的管理脚本。

