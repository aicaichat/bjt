# 仪表盘页面开发指南

## 1. 页面基本信息

- **页面名称**: 系统首页/仪表盘
- **页面路径**: templates/admin/dashboard/index.php
- **对应 Mockup**: 系统首页 (1.html)
- **优先级**: P0 (核心功能，必须实现)
- **注意**: 仪表盘是单一页面，没有子页面，但包含多个功能组件（统计卡片、快速导航、最近活动）

## 2. 数据关系

### 2.1 数据表关联
- **统计数据**: 涉及多个表的聚合查询
  - `wp_bjt_host_models`: 获取主机型号数量
  - `wp_bjt_accessory_models`: 获取配件型号数量
  - `wp_bjt_consumables`: 获取耗材数量
  - `wp_bjt_spare_parts`: 获取备件数量
- **最近活动**: 
  - `wp_bjt_activity_log`: 记录用户活动的表
    - 主要字段: `id`, `user_id`, `action_type`, `object_type`, `object_id`, `details`, `created_at`

### 2.2 API 接口
- `GET /wp-json/bjt/v1/dashboard/statistics`: 获取各类产品统计数据
- `GET /wp-json/bjt/v1/dashboard/recent-activities`: 获取最近活动记录
- `GET /wp-json/bjt/v1/dashboard/quick-links`: 获取快速链接配置

### 2.3 字段验证规则
- 仪表盘页面主要是数据展示，不涉及表单提交，因此无字段验证规则

## 3. 页面结构

### 3.1 必须实现的组件
以下组件必须完整实现，与 Mockup 设计保持一致:

- [ ] **页面标题区域**: 显示"系统首页"标题
- [ ] **统计卡片区域**: 
  - [ ] 主机型号数量卡片
  - [ ] 配件数量卡片
  - [ ] 耗材数量卡片
  - [ ] 备件数量卡片
- [ ] **快速导航区域**:
  - [ ] 主机管理入口
  - [ ] 配件管理入口
  - [ ] 耗材管理入口
  - [ ] 备件管理入口
  - [ ] 用户管理入口
  - [ ] 系统设置入口
- [ ] **最近活动列表**:
  - [ ] 活动类型图标列
  - [ ] 活动描述列
  - [ ] 操作用户列
  - [ ] 操作时间列

### 3.2 页面布局要求
```
+------------------------------------------+
|                页头区域                   |
+--------+-------------------------------+
|        |                              |
|        |      统计卡片区域             |
|        |                              |
|侧边栏   +------------------------------+
|        |                              |
|        |      快速导航区域             |
|        |                              |
|        +------------------------------+
|        |                              |
|        |      最近活动列表             |
|        |                              |
+--------+-------------------------------+
```

## 4. 实现标准

### 4.1 HTML结构规范
```html
<!-- 仪表盘页面整体结构 -->
<div class="bjt-dashboard">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title">系统首页</h1>
  </div>
  
  <!-- 统计卡片区域 -->
  <div class="bjt-statistics-cards">
    <div class="bjt-row">
      <!-- 主机型号数量卡片 -->
      <div class="bjt-card bjt-stat-card bjt-stat-card--host">
        <div class="bjt-stat-card__icon">
          <i class="bjt-icon bjt-icon-host"></i>
        </div>
        <div class="bjt-stat-card__content">
          <h3 class="bjt-stat-card__title">主机型号</h3>
          <div class="bjt-stat-card__value" id="host-models-count">
            <!-- 数据将通过JavaScript动态填充 -->
            <div class="bjt-skeleton-loader"></div>
          </div>
        </div>
      </div>
      
      <!-- 配件数量卡片 -->
      <div class="bjt-card bjt-stat-card bjt-stat-card--accessory">
        <div class="bjt-stat-card__icon">
          <i class="bjt-icon bjt-icon-accessory"></i>
        </div>
        <div class="bjt-stat-card__content">
          <h3 class="bjt-stat-card__title">配件数量</h3>
          <div class="bjt-stat-card__value" id="accessories-count">
            <div class="bjt-skeleton-loader"></div>
          </div>
        </div>
      </div>
      
      <!-- 耗材数量卡片 -->
      <div class="bjt-card bjt-stat-card bjt-stat-card--consumable">
        <div class="bjt-stat-card__icon">
          <i class="bjt-icon bjt-icon-consumable"></i>
        </div>
        <div class="bjt-stat-card__content">
          <h3 class="bjt-stat-card__title">耗材数量</h3>
          <div class="bjt-stat-card__value" id="consumables-count">
            <div class="bjt-skeleton-loader"></div>
          </div>
        </div>
      </div>
      
      <!-- 备件数量卡片 -->
      <div class="bjt-card bjt-stat-card bjt-stat-card--spare">
        <div class="bjt-stat-card__icon">
          <i class="bjt-icon bjt-icon-spare"></i>
        </div>
        <div class="bjt-stat-card__content">
          <h3 class="bjt-stat-card__title">备件数量</h3>
          <div class="bjt-stat-card__value" id="spare-parts-count">
            <div class="bjt-skeleton-loader"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 快速导航区域 -->
  <div class="bjt-card bjt-quick-links">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">快速导航</h2>
    </div>
    <div class="bjt-card-body">
      <div class="bjt-quick-links__grid">
        <!-- 主机管理入口 -->
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models')); ?>" class="bjt-quick-link bjt-quick-link--host">
          <div class="bjt-quick-link__icon">
            <i class="bjt-icon bjt-icon-host"></i>
          </div>
          <div class="bjt-quick-link__label">主机管理</div>
        </a>
        
        <!-- 配件管理入口 -->
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-accessories')); ?>" class="bjt-quick-link bjt-quick-link--accessory">
          <div class="bjt-quick-link__icon">
            <i class="bjt-icon bjt-icon-accessory"></i>
          </div>
          <div class="bjt-quick-link__label">配件管理</div>
        </a>
        
        <!-- 耗材管理入口 -->
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-consumables')); ?>" class="bjt-quick-link bjt-quick-link--consumable">
          <div class="bjt-quick-link__icon">
            <i class="bjt-icon bjt-icon-consumable"></i>
          </div>
          <div class="bjt-quick-link__label">耗材管理</div>
        </a>
        
        <!-- 备件管理入口 -->
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-spare-parts')); ?>" class="bjt-quick-link bjt-quick-link--spare">
          <div class="bjt-quick-link__icon">
            <i class="bjt-icon bjt-icon-spare"></i>
          </div>
          <div class="bjt-quick-link__label">备件管理</div>
        </a>
        
        <!-- 用户管理入口 -->
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-users')); ?>" class="bjt-quick-link bjt-quick-link--user">
          <div class="bjt-quick-link__icon">
            <i class="bjt-icon bjt-icon-user"></i>
          </div>
          <div class="bjt-quick-link__label">用户管理</div>
        </a>
        
        <!-- 系统设置入口 -->
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-settings')); ?>" class="bjt-quick-link bjt-quick-link--settings">
          <div class="bjt-quick-link__icon">
            <i class="bjt-icon bjt-icon-settings"></i>
          </div>
          <div class="bjt-quick-link__label">系统设置</div>
        </a>
      </div>
    </div>
  </div>
  
  <!-- 最近活动列表 -->
  <div class="bjt-card bjt-recent-activities">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">最近活动</h2>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-activities-table">
        <thead>
          <tr>
            <th class="bjt-activity-icon-column"></th>
            <th>活动描述</th>
            <th>操作用户</th>
            <th>操作时间</th>
          </tr>
        </thead>
        <tbody id="recent-activities-list">
          <!-- 活动数据将通过JavaScript动态生成 -->
          <tr class="bjt-skeleton-row">
            <td colspan="4">
              <div class="bjt-skeleton-loader"></div>
            </td>
          </tr>
          <tr class="bjt-skeleton-row">
            <td colspan="4">
              <div class="bjt-skeleton-loader"></div>
            </td>
          </tr>
          <tr class="bjt-skeleton-row">
            <td colspan="4">
              <div class="bjt-skeleton-loader"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### 4.2 CSS样式规范
- 使用BEM命名约定，如`.bjt-dashboard__statistics`
- 页面特有样式应当在现有的全局样式基础上进行扩展
- 关键样式变量:
  ```css
  /* 仪表盘页面关键样式变量 */
  :root {
    --card-spacing: 24px;
    --stat-card-height: 120px;
    --stat-color-host: #2196f3;
    --stat-color-accessory: #ff9800;
    --stat-color-consumable: #4caf50;
    --stat-color-spare: #9c27b0;
    --quick-link-size: 100px;
  }
  
  /* 仪表盘页面特定样式 */
  .bjt-statistics-cards {
    margin-bottom: var(--card-spacing);
  }
  
  .bjt-row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -12px;
  }
  
  .bjt-stat-card {
    flex: 1;
    min-width: 250px;
    margin: 12px;
    display: flex;
    align-items: center;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    height: var(--stat-card-height);
    overflow: hidden;
    position: relative;
  }
  
  .bjt-stat-card__icon {
    width: 60px;
    height: 60px;
    border-radius: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .bjt-stat-card__value {
    font-size: 36px;
    font-weight: 700;
    margin-top: 5px;
  }
  
  .bjt-stat-card--host {
    border-left: 4px solid var(--stat-color-host);
  }
  
  .bjt-stat-card--accessory {
    border-left: 4px solid var(--stat-color-accessory);
  }
  
  .bjt-stat-card--consumable {
    border-left: 4px solid var(--stat-color-consumable);
  }
  
  .bjt-stat-card--spare {
    border-left: 4px solid var(--stat-color-spare);
  }
  
  .bjt-quick-links {
    margin-bottom: var(--card-spacing);
  }
  
  .bjt-quick-links__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--quick-link-size), 1fr));
    gap: 20px;
    padding: 10px 0;
  }
  
  .bjt-quick-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: var(--quick-link-size);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.3s ease;
    color: var(--text-primary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color);
  }
  
  .bjt-quick-link:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .bjt-quick-link__icon {
    font-size: 32px;
    margin-bottom: 10px;
  }
  
  .bjt-quick-link__label {
    font-size: 14px;
    font-weight: 500;
  }
  
  .bjt-activity-icon-column {
    width: 40px;
  }
  
  .bjt-activity-icon {
    width: 30px;
    height: 30px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
  }
  
  .bjt-activity-icon--add {
    background-color: #4caf50;
  }
  
  .bjt-activity-icon--edit {
    background-color: #2196f3;
  }
  
  .bjt-activity-icon--delete {
    background-color: #f44336;
  }
  
  .bjt-activity-icon--login {
    background-color: #9c27b0;
  }
  
  .bjt-skeleton-loader {
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
  }
  
  .bjt-skeleton-row td {
    padding: 12px 16px;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  @media (max-width: 768px) {
    .bjt-stat-card {
      min-width: 100%;
    }
    
    .bjt-quick-links__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  ```

### 4.3 JavaScript交互规范
```javascript
// 初始化仪表盘页面
function initDashboard() {
  // 获取并显示统计数据
  loadStatistics();
  
  // 获取并显示最近活动
  loadRecentActivities();
}

// 加载统计数据
function loadStatistics() {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/dashboard/statistics',
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(data) {
      // 更新统计卡片数值
      jQuery('#host-models-count').html(data.host_models_count || 0);
      jQuery('#accessories-count').html(data.accessories_count || 0);
      jQuery('#consumables-count').html(data.consumables_count || 0);
      jQuery('#spare-parts-count').html(data.spare_parts_count || 0);
      
      // 添加动画效果
      animateCounters();
    },
    error: function(error) {
      console.error('加载统计数据失败', error);
      // 显示错误信息
      jQuery('#host-models-count').html('<span class="bjt-error">加载失败</span>');
      jQuery('#accessories-count').html('<span class="bjt-error">加载失败</span>');
      jQuery('#consumables-count').html('<span class="bjt-error">加载失败</span>');
      jQuery('#spare-parts-count').html('<span class="bjt-error">加载失败</span>');
    }
  });
}

// 加载最近活动
function loadRecentActivities() {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/dashboard/recent-activities',
    method: 'GET',
    data: {
      limit: 10 // 最多显示10条记录
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(data) {
      // 清空骨架屏
      jQuery('#recent-activities-list').empty();
      
      // 如果没有活动记录
      if (data.length === 0) {
        jQuery('#recent-activities-list').html(
          '<tr><td colspan="4" class="bjt-table-no-data">暂无活动记录</td></tr>'
        );
        return;
      }
      
      // 添加活动记录
      data.forEach(function(activity) {
        const activityIcon = getActivityIcon(activity.action_type);
        const row = `
          <tr>
            <td class="bjt-activity-icon-column">
              ${activityIcon}
            </td>
            <td>${activity.description}</td>
            <td>${activity.user_name || '系统'}</td>
            <td>${formatDate(activity.created_at)}</td>
          </tr>
        `;
        jQuery('#recent-activities-list').append(row);
      });
    },
    error: function(error) {
      console.error('加载最近活动失败', error);
      // 显示错误信息
      jQuery('#recent-activities-list').html(
        '<tr><td colspan="4" class="bjt-table-error">加载活动记录失败</td></tr>'
      );
    }
  });
}

// 获取活动图标
function getActivityIcon(actionType) {
  let iconClass = '';
  switch (actionType) {
    case 'add':
      iconClass = 'bjt-activity-icon--add';
      return '<div class="bjt-activity-icon ' + iconClass + '"><i class="bjt-icon bjt-icon-plus"></i></div>';
    case 'edit':
      iconClass = 'bjt-activity-icon--edit';
      return '<div class="bjt-activity-icon ' + iconClass + '"><i class="bjt-icon bjt-icon-edit"></i></div>';
    case 'delete':
      iconClass = 'bjt-activity-icon--delete';
      return '<div class="bjt-activity-icon ' + iconClass + '"><i class="bjt-icon bjt-icon-trash"></i></div>';
    case 'login':
      iconClass = 'bjt-activity-icon--login';
      return '<div class="bjt-activity-icon ' + iconClass + '"><i class="bjt-icon bjt-icon-login"></i></div>';
    default:
      iconClass = 'bjt-activity-icon--default';
      return '<div class="bjt-activity-icon ' + iconClass + '"><i class="bjt-icon bjt-icon-activity"></i></div>';
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 数字动画效果
function animateCounters() {
  jQuery('.bjt-stat-card__value').each(function() {
    const $this = jQuery(this);
    const value = parseInt($this.text(), 10);
    
    if (!isNaN(value)) {
      $this.prop('Counter', 0).animate({
        Counter: value
      }, {
        duration: 1000,
        easing: 'swing',
        step: function(now) {
          $this.text(Math.ceil(now));
        }
      });
    }
  });
}

// 在页面加载完成后初始化
jQuery(document).ready(function() {
  initDashboard();
});
```

### 4.4 PHP处理规范
```php
/**
 * 渲染仪表盘页面
 */
function render_dashboard() {
    // 确保用户有权限访问此页面
    if (!current_user_can('manage_options')) {
        wp_die(__('您没有足够的权限访问此页面。', 'bjt-product-admin'));
    }
    
    // 设置页面标题
    $page_title = __('系统首页', 'bjt-product-admin');
    
    // 开始输出缓冲
    ob_start();
    
    // 获取当前语言
    $current_lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'cn';
    ?>
    <div class="bjt-dashboard">
        <!-- 页面内容，按照HTML结构规范实现 -->
    </div>
    <?php
    
    // 获取输出缓冲内容并清空缓冲
    $output = ob_get_clean();
    
    // 使用主布局模板包装输出
    include_once BJT_PLUGIN_DIR . 'templates/admin/layout/mockup-page-wrapper.php';
}

/**
 * 获取统计数据的接口回调
 */
function bjt_api_get_dashboard_statistics() {
    // 检查权限
    if (!current_user_can('manage_options')) {
        return new WP_Error('forbidden', '您没有访问此数据的权限', array('status' => 403));
    }
    
    global $wpdb;
    
    // 获取主机型号数量
    $host_models_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_host_models");
    
    // 获取配件数量
    $accessories_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_accessory_models");
    
    // 获取耗材数量
    $consumables_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_consumables");
    
    // 获取备件数量
    $spare_parts_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_spare_parts");
    
    // 返回结果
    return array(
        'host_models_count' => (int) $host_models_count,
        'accessories_count' => (int) $accessories_count,
        'consumables_count' => (int) $consumables_count,
        'spare_parts_count' => (int) $spare_parts_count
    );
}

/**
 * 获取最近活动的接口回调
 */
function bjt_api_get_recent_activities($request) {
    // 检查权限
    if (!current_user_can('manage_options')) {
        return new WP_Error('forbidden', '您没有访问此数据的权限', array('status' => 403));
    }
    
    // 获取请求参数
    $limit = isset($request['limit']) ? intval($request['limit']) : 10;
    
    global $wpdb;
    
    // 获取最近活动记录
    $activities = $wpdb->get_results($wpdb->prepare(
        "SELECT a.*, u.user_login as user_name
         FROM {$wpdb->prefix}bjt_activity_log a
         LEFT JOIN {$wpdb->users} u ON a.user_id = u.ID
         ORDER BY a.created_at DESC
         LIMIT %d",
        $limit
    ));
    
    // 格式化活动描述
    foreach ($activities as &$activity) {
        $activity->description = bjt_format_activity_description($activity);
    }
    
    return $activities;
}

/**
 * 格式化活动描述
 */
function bjt_format_activity_description($activity) {
    $object_type_labels = array(
        'host_model' => '主机型号',
        'accessory' => '配件',
        'consumable' => '耗材',
        'spare_part' => '备件',
        'user' => '用户',
        'product_line' => '产品线'
    );
    
    $action_type_labels = array(
        'add' => '新增',
        'edit' => '编辑',
        'delete' => '删除',
        'login' => '登录'
    );
    
    $object_type = isset($object_type_labels[$activity->object_type]) ? $object_type_labels[$activity->object_type] : $activity->object_type;
    $action_type = isset($action_type_labels[$activity->action_type]) ? $action_type_labels[$activity->action_type] : $activity->action_type;
    
    // 根据活动类型生成描述
    if ($activity->action_type === 'login') {
        return '用户登录系统';
    }
    
    $details = json_decode($activity->details, true);
    $object_name = isset($details['name']) ? $details['name'] : ($details['title'] ?? '');
    
    if (!empty($object_name)) {
        return sprintf('%s了%s "%s"', $action_type, $object_type, $object_name);
    } else {
        return sprintf('%s了一个%s', $action_type, $object_type);
    }
}
```

## 5. 验收标准

### 5.1 功能验收标准
- [ ] 统计卡片能够正确显示各类产品的数量
- [ ] 快速导航区域的所有链接能够正确跳转到对应页面
- [ ] 最近活动列表能够正确显示系统中的最近操作记录
- [ ] 所有数据通过API异步加载，避免页面阻塞
- [ ] 数据加载过程中显示加载状态（骨架屏）
- [ ] 数据加载失败时显示友好的错误提示

### 5.2 视觉一致性标准
- [ ] 页面布局与Mockup设计完全一致
- [ ] 统计卡片的样式与设计稿一致
- [ ] 快速导航区域的样式与设计稿一致
- [ ] 最近活动列表的样式与设计稿一致
- [ ] 图标使用与设计稿一致
- [ ] 响应式布局正确实现，在不同屏幕尺寸下显示正常

### 5.3 代码质量标准
- [ ] 代码结构清晰，功能模块化
- [ ] PHP代码遵循WordPress编码标准
- [ ] JavaScript代码组织良好，避免全局变量污染
- [ ] 使用适当的安全措施（如数据转义、nonce验证等）
- [ ] 代码包含适当的注释，解释复杂逻辑

### 5.4 性能标准
- [ ] 页面加载时间在可接受范围内（首次内容绘制 < 1.5秒）
- [ ] 统计数据异步加载，避免页面阻塞
- [ ] 活动列表数据异步加载，避免页面阻塞
- [ ] 使用骨架屏提高感知性能
- [ ] 优化图像和图标资源，减少加载时间

## 6. 开发流程

### 6.1 开发前准备
1. 仔细研究Mockup设计，理解仪表盘页面的布局和交互关系
2. 确认所有API端点已实现，包括统计数据和最近活动数据接口
3. 准备测试数据，以便验证功能
4. 确保活动日志记录功能已实现，以便显示最近活动

### 6.2 开发步骤
1. **创建基本页面结构**
   - 实现页面标题区域
   - 实现统计卡片区域布局
   - 实现快速导航区域布局
   - 实现最近活动列表区域布局
   - 确保整体布局符合设计稿
   
2. **统计卡片实现**
   - 创建四个统计卡片的HTML结构
   - 实现卡片样式和布局
   - 添加骨架屏加载效果
   - 实现数据加载和显示逻辑
   
3. **快速导航实现**
   - 创建导航入口的HTML结构
   - 实现图标和标签样式
   - 添加悬停效果
   - 确保链接正确指向各管理页面
   
4. **最近活动列表实现**
   - 创建表格的HTML结构
   - 实现活动图标和样式
   - 添加骨架屏加载效果
   - 实现数据加载和展示功能
   
5. **完善和优化**
   - 优化样式，确保与设计稿视觉一致
   - 实现响应式布局
   - 添加数字动画效果
   - 优化加载状态和错误处理
   - 确保国际化支持

### 6.3 开发过程检查点
- [ ] 页面基本结构与设计稿一致
- [ ] 统计卡片能够正确加载和显示数据
- [ ] 快速导航入口链接正确
- [ ] 最近活动列表能够正确加载和显示数据
- [ ] 加载状态和错误处理正常工作
- [ ] 样式与设计稿视觉一致
- [ ] 响应式布局在不同屏幕尺寸下正常工作

## 7. 常见问题与最佳实践

### 7.1 避免常见问题
- **数据加载问题**:
  - 避免在页面加载时一次性请求多个大型数据集
  - 避免没有加载状态指示器，导致用户感觉页面卡顿
  - 避免忽略错误处理，在API请求失败时给用户明确的反馈
  
- **布局问题**:
  - 避免在小屏幕设备上布局混乱
  - 避免统计卡片在不同数据长度下出现内容溢出
  - 避免最近活动列表在数据较多时超出可视区域

- **性能问题**:
  - 避免一次性加载过多的活动记录
  - 避免在客户端进行复杂的数据处理
  - 避免使用大量的DOM操作

### 7.2 最佳实践建议
- **数据加载最佳实践**:
  - 使用骨架屏提供更好的加载体验
  - 并行请求多个独立的数据源，提高加载效率
  - 实现数据缓存机制，避免频繁重复请求
  
- **用户体验最佳实践**:
  - 为统计数字添加递增动画效果，增强视觉吸引力
  - 为快速导航入口添加悬停效果，提高交互反馈
  - 确保活动列表在无数据时显示友好的空状态提示
  - 使用适当的图标增强视觉传达效果
  
- **布局最佳实践**:
  - 使用CSS Grid和Flexbox实现灵活的响应式布局
  - 为卡片设置最小宽度，确保在小屏幕设备上不会过度挤压
  - 使用适当的间距和对齐，确保视觉层次清晰
  
- **多语言最佳实践**:
  - 确保所有用户可见文本都使用WordPress国际化函数包装
  - 为数字格式化考虑不同地区的数字表示方式
  - 为日期时间格式化考虑不同地区的日期表示方式 