#!/bin/bash

# Production Database Rebuild Script
# 生产环境数据库重建脚本

# 生产环境配置
DB_HOST="prod_mysql_1"
DB_USER="root"
DB_PASSWORD="bjtpassword123"
DB_NAME="bjt"
WORDPRESS_CONTAINER="prod_wordpress_1"

echo "=== BJT Production Database Rebuild Script ==="
echo "WARNING: This will completely rebuild the production database!"
echo "Database: $DB_NAME"
echo "MySQL Container: $DB_HOST"
echo "WordPress Container: $WORDPRESS_CONTAINER"
echo ""

# 确认操作
read -p "Are you sure you want to proceed? This will DELETE ALL existing data! (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

# 备份现有数据库（可选但推荐）
echo "Creating backup of existing database..."
docker exec -i $DB_HOST mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > "bjt_product_backup_$(date +%Y%m%d_%H%M%S).sql"
if [ $? -eq 0 ]; then
    echo "Backup created successfully."
else
    echo "Warning: Backup failed, but continuing..."
fi

echo "Dropping and recreating database '$DB_NAME'..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || exit 1

# 重启WordPress容器以确保连接
echo "Restarting WordPress container..."
docker restart $WORDPRESS_CONTAINER || exit 1

echo "Waiting for WordPress container to be ready..."
sleep 30

# 检查WordPress容器状态
echo "Checking WordPress container status..."
docker ps | grep $WORDPRESS_CONTAINER

echo "Explicitly dropping existing BJT tables from '$DB_NAME'..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 -e "
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS wp_bjt_product_lines;
DROP TABLE IF EXISTS wp_bjt_host_models;
DROP TABLE IF EXISTS wp_bjt_accessory_models;
DROP TABLE IF EXISTS wp_bjt_spare_part_models;
DROP TABLE IF EXISTS wp_bjt_parts;
DROP TABLE IF EXISTS wp_bjt_accessories;
DROP TABLE IF EXISTS wp_bjt_consumables;
DROP TABLE IF EXISTS wp_bjt_spare_parts;
DROP TABLE IF EXISTS wp_bjt_relations;
DROP TABLE IF EXISTS wp_bjt_prices;
DROP TABLE IF EXISTS wp_bjt_inventory;
DROP TABLE IF EXISTS wp_bjt_shapes;
DROP TABLE IF EXISTS wp_bjt_materials;
DROP TABLE IF EXISTS wp_bjt_specifications;
DROP TABLE IF EXISTS wp_bjt_consumable_compatibility;
DROP TABLE IF EXISTS wp_bjt_users;
DROP TABLE IF EXISTS wp_bjt_orders;
DROP TABLE IF EXISTS wp_bjt_logs;
DROP TABLE IF EXISTS wp_bjt_order_items;
DROP TABLE IF EXISTS wp_bjt_cart_items;
SET FOREIGN_KEY_CHECKS = 1;
" || exit 1

# 初始化BJT插件的数据库结构
echo "Initializing BJT plugin database structure into '$DB_NAME'..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < docker/dev/mysql/init.sql || exit 1

# 创建WordPress核心表（最小化版本）
echo "Creating minimal WordPress core tables..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 -e "
CREATE TABLE IF NOT EXISTS wp_options (
  option_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  option_name varchar(191) NOT NULL DEFAULT '',
  option_value longtext NOT NULL,
  autoload varchar(20) NOT NULL DEFAULT 'yes',
  PRIMARY KEY (option_id),
  UNIQUE KEY option_name (option_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wp_users (
  ID bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  user_login varchar(60) NOT NULL DEFAULT '',
  user_pass varchar(255) NOT NULL DEFAULT '',
  user_nicename varchar(50) NOT NULL DEFAULT '',
  user_email varchar(100) NOT NULL DEFAULT '',
  user_url varchar(100) NOT NULL DEFAULT '',
  user_registered datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  user_activation_key varchar(255) NOT NULL DEFAULT '',
  user_status int(11) NOT NULL DEFAULT '0',
  display_name varchar(250) NOT NULL DEFAULT '',
  PRIMARY KEY (ID),
  KEY user_login_key (user_login),
  KEY user_nicename (user_nicename),
  KEY user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wp_posts (
  ID bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  post_author bigint(20) unsigned NOT NULL DEFAULT '0',
  post_date datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_date_gmt datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_content longtext NOT NULL,
  post_title text NOT NULL,
  post_excerpt text NOT NULL,
  post_status varchar(20) NOT NULL DEFAULT 'publish',
  comment_status varchar(20) NOT NULL DEFAULT 'open',
  ping_status varchar(20) NOT NULL DEFAULT 'open',
  post_password varchar(255) NOT NULL DEFAULT '',
  post_name varchar(200) NOT NULL DEFAULT '',
  to_ping text NOT NULL,
  pinged text NOT NULL,
  post_modified datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_modified_gmt datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_content_filtered longtext NOT NULL,
  post_parent bigint(20) unsigned NOT NULL DEFAULT '0',
  guid varchar(255) NOT NULL DEFAULT '',
  menu_order int(11) NOT NULL DEFAULT '0',
  post_type varchar(20) NOT NULL DEFAULT 'post',
  post_mime_type varchar(100) NOT NULL DEFAULT '',
  comment_count bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (ID),
  KEY post_name (post_name(191)),
  KEY type_status_date (post_type,post_status,post_date,ID),
  KEY post_parent (post_parent),
  KEY post_author (post_author)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
" || exit 1

# 插入基本的WordPress配置选项
echo "Inserting basic WordPress options..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 -e "
INSERT IGNORE INTO wp_options (option_name, option_value, autoload) VALUES
('siteurl', 'https://bjt.nh.cool', 'yes'),
('home', 'https://bjt.nh.cool', 'yes'),
('blogname', 'BJT Product System', 'yes'),
('blogdescription', 'BJT Product Management System', 'yes'),
('users_can_register', '0', 'yes'),
('admin_email', 'admin@bjt.com', 'yes'),
('start_of_week', '1', 'yes'),
('use_balanceTags', '0', 'yes'),
('use_smilies', '1', 'yes'),
('require_name_email', '1', 'yes'),
('comments_notify', '1', 'yes'),
('posts_per_rss', '10', 'yes'),
('rss_use_excerpt', '0', 'yes'),
('mailserver_url', 'mail.example.com', 'yes'),
('mailserver_login', 'login@example.com', 'yes'),
('mailserver_pass', 'password', 'yes'),
('mailserver_port', '110', 'yes'),
('default_category', '1', 'yes'),
('default_comment_status', 'open', 'yes'),
('default_ping_status', 'open', 'yes'),
('default_pingback_flag', '1', 'yes'),
('posts_per_page', '10', 'yes'),
('date_format', 'F j, Y', 'yes'),
('time_format', 'g:i a', 'yes'),
('links_updated_date_format', 'F j, Y g:i a', 'yes'),
('comment_moderation', '0', 'yes'),
('moderation_notify', '1', 'yes'),
('permalink_structure', '/%year%/%monthnum%/%day%/%postname%/', 'yes'),
('rewrite_rules', '', 'yes'),
('hack_file', '0', 'yes'),
('blog_charset', 'UTF-8', 'yes'),
('moderation_keys', '', 'no'),
('active_plugins', 'a:0:{}', 'yes'),
('category_base', '', 'yes'),
('ping_sites', 'http://rpc.pingomatic.com/', 'yes'),
('comment_max_links', '2', 'yes'),
('gmt_offset', '0', 'yes'),
('default_email_category', '1', 'yes'),
('recently_edited', '', 'no'),
('template', 'twentytwentythree', 'yes'),
('stylesheet', 'twentytwentythree', 'yes'),
('comment_whitelist', '1', 'yes'),
('blacklist_keys', '', 'no'),
('comment_registration', '0', 'yes'),
('html_type', 'text/html', 'yes'),
('use_trackback', '0', 'yes'),
('default_role', 'subscriber', 'yes'),
('db_version', '53496', 'yes'),
('uploads_use_yearmonth_folders', '1', 'yes'),
('upload_path', '', 'yes'),
('blog_public', '1', 'yes'),
('default_link_category', '2', 'yes'),
('show_on_front', 'posts', 'yes'),
('tag_base', '', 'yes'),
('show_avatars', '1', 'yes'),
('avatar_rating', 'G', 'yes'),
('upload_url_path', '', 'yes'),
('thumbnail_size_w', '150', 'yes'),
('thumbnail_size_h', '150', 'yes'),
('thumbnail_crop', '1', 'yes'),
('medium_size_w', '300', 'yes'),
('medium_size_h', '300', 'yes'),
('avatar_default', 'mystery', 'yes'),
('large_size_w', '1024', 'yes'),
('large_size_h', '1024', 'yes'),
('image_default_link_type', 'none', 'yes'),
('image_default_size', '', 'yes'),
('image_default_align', '', 'yes'),
('close_comments_for_old_posts', '0', 'yes'),
('close_comments_days_old', '14', 'yes'),
('thread_comments', '1', 'yes'),
('thread_comments_depth', '5', 'yes'),
('page_comments', '0', 'yes'),
('comments_per_page', '50', 'yes'),
('default_comments_page', 'newest', 'yes'),
('comment_order', 'asc', 'yes'),
('sticky_posts', 'a:0:{}', 'yes'),
('widget_categories', 'a:0:{}', 'yes'),
('widget_text', 'a:0:{}', 'yes'),
('widget_rss', 'a:0:{}', 'yes'),
('uninstall_plugins', 'a:0:{}', 'no'),
('timezone_string', '', 'yes'),
('page_for_posts', '0', 'yes'),
('page_on_front', '0', 'yes'),
('default_post_format', '0', 'yes'),
('link_manager_enabled', '0', 'yes'),
('finished_splitting_shared_terms', '1', 'yes'),
('site_icon', '0', 'yes'),
('medium_large_size_w', '768', 'yes'),
('medium_large_size_h', '0', 'yes'),
('wp_page_for_privacy_policy', '3', 'yes'),
('show_comments_cookies_opt_in', '1', 'yes'),
('admin_email_lifespan', '1640995200', 'yes'),
('disallowed_keys', '', 'no'),
('comment_previously_approved', '1', 'yes'),
('auto_plugin_theme_update_emails', 'a:0:{}', 'no'),
('auto_update_core_dev', 'enabled', 'yes'),
('auto_update_core_minor', 'enabled', 'yes'),
('auto_update_core_major', 'enabled', 'yes'),
('wp_force_deactivated_plugins', 'a:0:{}', 'yes'),
('initial_db_version', '53496', 'yes'),
('bjt_jwt_secret', 'bjt-product-api-secret-key-2024', 'yes'),
('bjt_jwt_cors_enable', '1', 'yes');
" || exit 1

# 导入生成的SQL文件数据
echo "Importing data from 设备 Excel..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < generated_sql_imports/_设备.sql || exit 1

echo "Importing data from 耗材 Excel..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < generated_sql_imports/_耗材.sql || exit 1

# 导入测试用户数据
echo "Importing test users data..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < docker/dev/mysql/test_users.sql || exit 1

# 验证表结构
echo "Verifying BJT plugin database structure..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES LIKE 'wp_bjt_%';" || exit 1

echo "Verifying key BJT tables structure..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; DESC wp_bjt_relations; DESC wp_bjt_product_lines; DESC wp_bjt_parts;" || exit 1

# 验证用户数据
echo "Verifying test users data..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT id, username, email, role, status FROM wp_bjt_users;" || exit 1

# 设置数据库连接字符集
echo "Setting database connection charset..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "
SET GLOBAL character_set_client = utf8mb4;
SET GLOBAL character_set_connection = utf8mb4;
SET GLOBAL character_set_results = utf8mb4;
FLUSH PRIVILEGES;
" || echo "Warning: Could not set global charset variables (may require higher privileges)"

echo ""
echo "=== Production Database Rebuild Complete! ==="
echo "Database: $DB_NAME"
echo "All data has been imported with proper UTF-8 encoding."
echo "Test users have been created with correct password hashes."
echo ""
echo "You can now test the login with:"
echo "curl -X POST https://bjt.nh.cool/wp-json/bjt/v1/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"username\":\"admin\",\"password\":\"password123\"}'"
echo ""
echo "Please verify the WordPress site is running correctly at your domain." 