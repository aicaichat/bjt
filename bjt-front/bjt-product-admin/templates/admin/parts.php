<?php
if (!defined('ABSPATH')) {
    exit;
}

// Get current action
$action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';

// Load appropriate template
switch ($action) {
    case 'new':
    case 'edit':
        require_once BJT_PRODUCT_ADMIN_PATH . 'templates/admin/parts/form.php';
        break;
    
    default:
        require_once BJT_PRODUCT_ADMIN_PATH . 'templates/admin/parts/list.php';
        break;
} 