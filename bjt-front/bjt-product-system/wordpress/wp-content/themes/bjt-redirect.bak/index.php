<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 *
 * @package BJT_Frontend_Redirect
 */

// 如果直接访问此文件，重定向到React前端
if (!defined('ABSPATH')) {
    header("Location: http://localhost:5173");
    exit;
}

// 这应该不会被执行，因为functions.php中的钩子会先执行重定向
get_header();
?>

<div style="text-align: center; margin: 100px auto; max-width: 600px; font-family: Arial, sans-serif;">
    <h1>正在重定向到BJT产品管理系统...</h1>
    <p>如果您没有被自动重定向，请<a href="http://localhost:5173">点击此处</a>访问产品管理系统。</p>
    <script>
        window.location.href = "http://localhost:5173";
    </script>
</div>

<?php
get_footer(); 