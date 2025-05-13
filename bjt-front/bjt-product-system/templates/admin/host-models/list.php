<?php
/**
 * 主机型号管理列表页面
 * 
 * @package BJT_Product_Admin
 */

// 如果直接访问此文件，则退出
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="bjt-host-models">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title">主机管理</h1>
  </div>
  
  <!-- 主机型号表格区域 -->
  <div class="bjt-card bjt-host-models-table-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">主机型号</h2>
      <div class="bjt-card-actions">
        <button class="bjt-btn bjt-btn-secondary bjt-import-btn" id="import-host-models">
          <i class="bjt-icon bjt-icon-import"></i> 导入
        </button>
        <button class="bjt-btn bjt-btn-secondary bjt-export-btn" id="export-host-models">
          <i class="bjt-icon bjt-icon-export"></i> 导出
        </button>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=add')); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 新增型号
        </a>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-host-models-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>型号</th>
            <th>型号名称</th>
            <th>产品线</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 表格内容将通过JavaScript动态生成 -->
        </tbody>
      </table>
    </div>
    <div class="bjt-card-footer">
      <div class="bjt-pagination" id="host-models-pagination">
        <!-- 分页控件将通过JavaScript动态生成 -->
      </div>
    </div>
  </div>
  
  <!-- 料号表格区域 -->
  <div class="bjt-card bjt-parts-table-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">料号列表</h2>
      <div class="bjt-card-filter">
        <div class="bjt-filter-field">
          <label for="filter-model">主机型号</label>
          <select id="filter-model" class="bjt-select">
            <option value="">全部</option>
            <!-- 型号选项将通过JavaScript动态生成 -->
          </select>
        </div>
        <div class="bjt-filter-field">
          <label for="filter-part-number">料号</label>
          <input type="text" id="filter-part-number" class="bjt-input" placeholder="输入料号">
        </div>
        <button class="bjt-btn bjt-btn-secondary" id="reset-filters">
          重置
        </button>
      </div>
      <div class="bjt-card-actions">
        <button class="bjt-btn bjt-btn-secondary bjt-import-btn" id="import-parts">
          <i class="bjt-icon bjt-icon-import"></i> 导入
        </button>
        <button class="bjt-btn bjt-btn-secondary bjt-export-btn" id="export-parts">
          <i class="bjt-icon bjt-icon-export"></i> 导出
        </button>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=add-part')); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 新增料号
        </a>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-parts-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>型号</th>
            <th>料号</th>
            <th>产品线</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 表格内容将通过JavaScript动态生成 -->
        </tbody>
      </table>
    </div>
    <div class="bjt-card-footer">
      <div class="bjt-pagination" id="parts-pagination">
        <!-- 分页控件将通过JavaScript动态生成 -->
      </div>
    </div>
  </div>
  
  <!-- 导入/导出对话框模板 -->
  <div class="bjt-dialog" id="import-dialog" style="display: none;">
    <!-- 对话框内容 -->
  </div>
</div> 
 