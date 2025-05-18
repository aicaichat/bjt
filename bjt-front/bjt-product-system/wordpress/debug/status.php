<?php require_once("/var/www/html/wp-load.php"); if(is_user_logged_in()) { echo "登录状态：已登录"; } else { echo "登录状态：未登录"; } echo "<br>管理地址：" . admin_url(); ?>
