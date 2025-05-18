<?php
/**
 * BJT表格组件
 * 
 * 用于创建和管理数据表格
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Table_Component {
    /**
     * 表格ID
     *
     * @var string
     */
    private $id;
    
    /**
     * 表格参数
     *
     * @var array
     */
    private $args;
    
    /**
     * 表格列定义
     *
     * @var array
     */
    private $columns = array();
    
    /**
     * 表格数据
     *
     * @var array
     */
    private $data = array();
    
    /**
     * 表格操作
     *
     * @var array
     */
    private $actions = array();
    
    /**
     * 批量操作
     *
     * @var array
     */
    private $bulk_actions = array();
    
    /**
     * 构造函数
     *
     * @param string $id 表格ID
     * @param array $args 表格参数
     */
    public function __construct($id, $args = array()) {
        $this->id = $id;
        
        // 默认参数
        $defaults = array(
            'title' => '',
            'description' => '',
            'per_page' => 20,
            'ajax' => true,
            'searchable' => true,
            'sortable' => true,
            'filterable' => false,
            'filters' => array(),
            'exportable' => false,
            'importable' => false,
            'bulk_actions' => true,
            'classes' => array('bjt-table', 'wp-list-table', 'widefat', 'fixed', 'striped'),
            'no_items_text' => __('没有找到项目', 'bjt-product-admin'),
            'primary_column' => '',
            'data_source' => '', // API端点或回调函数
            'default_sort_column' => 'id',
            'default_sort_order' => 'desc'
        );
        
        $this->args = wp_parse_args($args, $defaults);
    }
    
    /**
     * 添加列
     *
     * @param string $key 列键名
     * @param string $label 列标签
     * @param array $args 列参数
     * @return BJT_Table_Component 当前实例
     */
    public function add_column($key, $label, $args = array()) {
        // 默认参数
        $defaults = array(
            'sortable' => true,
            'searchable' => true,
            'filterable' => false,
            'filter_options' => array(),
            'type' => 'text', // text, number, date, boolean, image, actions
            'width' => '',
            'render_callback' => null
        );
        
        $args = wp_parse_args($args, $defaults);
        $args['label'] = $label;
        
        $this->columns[$key] = $args;
        
        return $this;
    }
    
    /**
     * 批量添加列
     *
     * @param array $columns 列数组
     * @return BJT_Table_Component 当前实例
     */
    public function add_columns($columns) {
        foreach ($columns as $key => $column) {
            if (is_array($column)) {
                $label = isset($column['label']) ? $column['label'] : $key;
                unset($column['label']);
                $this->add_column($key, $label, $column);
            } else {
                $this->add_column($key, $column);
            }
        }
        
        return $this;
    }
    
    /**
     * 添加操作
     *
     * @param string $key 操作键名
     * @param string $label 操作标签
     * @param string $url 操作URL
     * @param array $args 操作参数
     * @return BJT_Table_Component 当前实例
     */
    public function add_action($key, $label, $url = '', $args = array()) {
        // 默认参数
        $defaults = array(
            'icon' => '',
            'class' => '',
            'confirm' => false,
            'confirm_message' => __('确定要执行此操作吗？', 'bjt-product-admin'),
            'ajax' => false,
            'target' => '_self',
            'visible_callback' => null
        );
        
        $args = wp_parse_args($args, $defaults);
        $args['label'] = $label;
        $args['url'] = $url;
        
        $this->actions[$key] = $args;
        
        return $this;
    }
    
    /**
     * 添加批量操作
     *
     * @param string $key 操作键名
     * @param string $label 操作标签
     * @param array $args 操作参数
     * @return BJT_Table_Component 当前实例
     */
    public function add_bulk_action($key, $label, $args = array()) {
        // 默认参数
        $defaults = array(
            'confirm' => true,
            'confirm_message' => __('确定要对所选项执行此操作吗？', 'bjt-product-admin'),
            'ajax' => true,
            'callback' => ''
        );
        
        $args = wp_parse_args($args, $defaults);
        $args['label'] = $label;
        
        $this->bulk_actions[$key] = $args;
        
        return $this;
    }
    
    /**
     * 设置数据
     *
     * @param array $data 表格数据
     * @return BJT_Table_Component 当前实例
     */
    public function set_data($data) {
        $this->data = $data;
        return $this;
    }
    
    /**
     * 获取表格数据
     *
     * @return array 表格数据
     */
    public function get_data() {
        return $this->data;
    }
    
    /**
     * 渲染表格
     *
     * @return string 表格HTML
     */
    public function render() {
        // 确保有列定义
        if (empty($this->columns)) {
            return '<div class="notice notice-error"><p>' . __('表格组件错误：没有定义列', 'bjt-product-admin') . '</p></div>';
        }
        
        // 开始输出缓冲
        ob_start();
        
        // 表格容器
        echo '<div class="bjt-table-container" id="' . esc_attr($this->id) . '-container">';
        
        // 表格标题和描述
        if (!empty($this->args['title'])) {
            echo '<h2>' . esc_html($this->args['title']) . '</h2>';
        }
        
        if (!empty($this->args['description'])) {
            echo '<p class="description">' . esc_html($this->args['description']) . '</p>';
        }
        
        // 表格顶部操作
        $this->render_table_top();
        
        // 主表格
        echo '<table class="' . esc_attr(implode(' ', $this->args['classes'])) . '" id="' . esc_attr($this->id) . '">';
        
        // 表头
        echo '<thead>';
        echo '<tr>';
        
        // 复选框列
        if ($this->args['bulk_actions'] && !empty($this->bulk_actions)) {
            echo '<th class="check-column"><input type="checkbox" id="' . esc_attr($this->id) . '-select-all" /></th>';
        }
        
        // 列头
        foreach ($this->columns as $key => $column) {
            $classes = array();
            if (!empty($column['type'])) {
                $classes[] = 'column-' . $column['type'];
            }
            
            if (!empty($column['width'])) {
                $style = 'width: ' . esc_attr($column['width']) . ';';
            } else {
                $style = '';
            }
            
            if ($column['sortable'] && $this->args['sortable']) {
                $classes[] = 'sortable';
                $sort_dir = ($key == $this->args['default_sort_column']) ? $this->args['default_sort_order'] : 'asc';
                $classes[] = $sort_dir;
            }
            
            echo '<th class="' . esc_attr(implode(' ', $classes)) . '"';
            if (!empty($style)) {
                echo ' style="' . $style . '"';
            }
            
            // 添加排序属性
            if ($column['sortable'] && $this->args['sortable']) {
                echo ' data-sort="' . esc_attr($key) . '"';
            }
            
            echo '>' . esc_html($column['label']) . '</th>';
        }
        
        // 操作列
        if (!empty($this->actions)) {
            echo '<th class="column-actions">' . __('操作', 'bjt-product-admin') . '</th>';
        }
        
        echo '</tr>';
        echo '</thead>';
        
        // 表格正文
        echo '<tbody>';
        
        // 加载数据
        if (!$this->args['ajax'] && !empty($this->data)) {
            $this->render_rows();
        } else {
            echo '<tr class="bjt-table-loading"><td colspan="' . esc_attr(count($this->columns) + (!empty($this->actions) ? 1 : 0) + ($this->args['bulk_actions'] ? 1 : 0)) . '">';
            echo '<div class="bjt-loading">' . __('加载数据...', 'bjt-product-admin') . '</div>';
            echo '</td></tr>';
        }
        
        echo '</tbody>';
        
        // 表尾
        echo '<tfoot>';
        echo '<tr>';
        
        // 复选框列
        if ($this->args['bulk_actions'] && !empty($this->bulk_actions)) {
            echo '<th class="check-column"><input type="checkbox" id="' . esc_attr($this->id) . '-select-all-bottom" /></th>';
        }
        
        // 列头
        foreach ($this->columns as $key => $column) {
            $classes = array();
            if (!empty($column['type'])) {
                $classes[] = 'column-' . $column['type'];
            }
            
            if ($column['sortable'] && $this->args['sortable']) {
                $classes[] = 'sortable';
                $sort_dir = ($key == $this->args['default_sort_column']) ? $this->args['default_sort_order'] : 'asc';
                $classes[] = $sort_dir;
            }
            
            echo '<th class="' . esc_attr(implode(' ', $classes)) . '"';
            
            // 添加排序属性
            if ($column['sortable'] && $this->args['sortable']) {
                echo ' data-sort="' . esc_attr($key) . '"';
            }
            
            echo '>' . esc_html($column['label']) . '</th>';
        }
        
        // 操作列
        if (!empty($this->actions)) {
            echo '<th class="column-actions">' . __('操作', 'bjt-product-admin') . '</th>';
        }
        
        echo '</tr>';
        echo '</tfoot>';
        
        echo '</table>';
        
        // 分页
        $this->render_pagination();
        
        // 关闭表格容器
        echo '</div>';
        
        // 添加表格数据属性
        $this->add_table_data_attributes();
        
        // 结束输出缓冲并返回
        return ob_get_clean();
    }
    
    /**
     * 渲染表格顶部操作
     */
    private function render_table_top() {
        echo '<div class="tablenav top">';
        
        // 批量操作
        if ($this->args['bulk_actions'] && !empty($this->bulk_actions)) {
            echo '<div class="alignleft actions bulkactions">';
            echo '<label for="' . esc_attr($this->id) . '-bulk-action-selector-top" class="screen-reader-text">' . __('选择批量操作', 'bjt-product-admin') . '</label>';
            echo '<select id="' . esc_attr($this->id) . '-bulk-action-selector-top">';
            echo '<option value="-1">' . __('批量操作', 'bjt-product-admin') . '</option>';
            
            foreach ($this->bulk_actions as $key => $action) {
                echo '<option value="' . esc_attr($key) . '">' . esc_html($action['label']) . '</option>';
            }
            
            echo '</select>';
            echo '<input type="button" id="' . esc_attr($this->id) . '-doaction" class="button action" value="' . __('应用', 'bjt-product-admin') . '">';
            echo '</div>';
        }
        
        // 搜索框
        if ($this->args['searchable']) {
            echo '<div class="alignright search-box">';
            echo '<label class="screen-reader-text" for="' . esc_attr($this->id) . '-search-input">' . __('搜索', 'bjt-product-admin') . ':</label>';
            echo '<input type="search" id="' . esc_attr($this->id) . '-search-input" placeholder="' . esc_attr__('搜索...', 'bjt-product-admin') . '">';
            echo '<input type="button" id="' . esc_attr($this->id) . '-search-submit" class="button" value="' . esc_attr__('搜索', 'bjt-product-admin') . '">';
            echo '</div>';
        }
        
        // 导入导出按钮
        if ($this->args['exportable'] || $this->args['importable']) {
            echo '<div class="alignleft actions">';
            
            if ($this->args['exportable']) {
                echo '<input type="button" id="' . esc_attr($this->id) . '-export" class="button" value="' . esc_attr__('导出', 'bjt-product-admin') . '">';
            }
            
            if ($this->args['importable']) {
                echo '<input type="button" id="' . esc_attr($this->id) . '-import" class="button" value="' . esc_attr__('导入', 'bjt-product-admin') . '">';
            }
            
            echo '</div>';
        }
        
        // 筛选器
        if ($this->args['filterable'] && !empty($this->args['filters'])) {
            echo '<div class="alignleft actions">';
            
            foreach ($this->args['filters'] as $filter) {
                if (empty($filter['options'])) {
                    continue;
                }
                
                echo '<label for="' . esc_attr($this->id . '-filter-' . $filter['key']) . '" class="screen-reader-text">' . esc_html($filter['label']) . '</label>';
                echo '<select id="' . esc_attr($this->id . '-filter-' . $filter['key']) . '" class="bjt-table-filter" data-filter="' . esc_attr($filter['key']) . '">';
                echo '<option value="">' . esc_html($filter['label']) . '</option>';
                
                foreach ($filter['options'] as $value => $label) {
                    echo '<option value="' . esc_attr($value) . '">' . esc_html($label) . '</option>';
                }
                
                echo '</select>';
            }
            
            echo '<input type="button" id="' . esc_attr($this->id) . '-filter-submit" class="button" value="' . esc_attr__('筛选', 'bjt-product-admin') . '">';
            echo '<input type="button" id="' . esc_attr($this->id) . '-filter-reset" class="button" value="' . esc_attr__('重置', 'bjt-product-admin') . '">';
            
            echo '</div>';
        }
        
        echo '<br class="clear">';
        echo '</div>';
    }
    
    /**
     * 渲染表格行
     */
    private function render_rows() {
        if (empty($this->data)) {
            echo '<tr><td colspan="' . esc_attr(count($this->columns) + (!empty($this->actions) ? 1 : 0) + ($this->args['bulk_actions'] ? 1 : 0)) . '">';
            echo esc_html($this->args['no_items_text']);
            echo '</td></tr>';
            return;
        }
        
        foreach ($this->data as $item) {
            $this->render_row($item);
        }
    }
    
    /**
     * 渲染单行
     *
     * @param array $item 行数据
     */
    private function render_row($item) {
        $row_id = isset($item['id']) ? $item['id'] : '';
        $classes = array();
        
        // 添加状态类
        if (isset($item['status'])) {
            $classes[] = 'status-' . sanitize_html_class($item['status']);
        }
        
        echo '<tr id="' . esc_attr($this->id . '-row-' . $row_id) . '" class="' . esc_attr(implode(' ', $classes)) . '" data-id="' . esc_attr($row_id) . '">';
        
        // 复选框
        if ($this->args['bulk_actions'] && !empty($this->bulk_actions)) {
            echo '<td class="check-column">';
            echo '<input type="checkbox" name="' . esc_attr($this->id . '-item[]') . '" value="' . esc_attr($row_id) . '" />';
            echo '</td>';
        }
        
        // 列数据
        foreach ($this->columns as $key => $column) {
            echo '<td class="column-' . esc_attr($key) . '">';
            
            $value = isset($item[$key]) ? $item[$key] : '';
            
            // 使用自定义渲染回调
            if (!empty($column['render_callback']) && is_callable($column['render_callback'])) {
                echo call_user_func($column['render_callback'], $value, $item, $key);
            } else {
                // 根据列类型渲染
                switch ($column['type']) {
                    case 'boolean':
                        echo $value ? '<span class="dashicons dashicons-yes"></span>' : '<span class="dashicons dashicons-no"></span>';
                        break;
                        
                    case 'image':
                        if (!empty($value)) {
                            echo '<img src="' . esc_url($value) . '" alt="" width="50" height="50" />';
                        }
                        break;
                        
                    case 'date':
                        if (!empty($value)) {
                            echo esc_html(date_i18n(get_option('date_format'), strtotime($value)));
                        }
                        break;
                        
                    default:
                        echo esc_html($value);
                        break;
                }
            }
            
            echo '</td>';
        }
        
        // 操作
        if (!empty($this->actions)) {
            echo '<td class="column-actions">';
            
            foreach ($this->actions as $key => $action) {
                // 检查可见回调
                if (!empty($action['visible_callback']) && is_callable($action['visible_callback'])) {
                    if (!call_user_func($action['visible_callback'], $item)) {
                        continue;
                    }
                }
                
                // 准备URL
                $url = $action['url'];
                if (!empty($url)) {
                    // 替换URL中的占位符
                    foreach ($item as $item_key => $item_value) {
                        $url = str_replace('{' . $item_key . '}', $item_value, $url);
                    }
                }
                
                $classes = array('button', 'bjt-action');
                if (!empty($action['class'])) {
                    $classes[] = $action['class'];
                }
                
                echo '<a href="' . esc_url($url) . '" class="' . esc_attr(implode(' ', $classes)) . '"';
                
                if ($action['ajax']) {
                    echo ' data-action="' . esc_attr($key) . '"';
                    echo ' data-id="' . esc_attr($row_id) . '"';
                }
                
                if ($action['confirm']) {
                    echo ' data-confirm="' . esc_attr($action['confirm_message']) . '"';
                }
                
                if ($action['target'] !== '_self') {
                    echo ' target="' . esc_attr($action['target']) . '"';
                }
                
                echo '>';
                
                if (!empty($action['icon'])) {
                    echo '<span class="dashicons dashicons-' . esc_attr($action['icon']) . '"></span> ';
                }
                
                echo esc_html($action['label']) . '</a> ';
            }
            
            echo '</td>';
        }
        
        echo '</tr>';
    }
    
    /**
     * 渲染分页
     */
    private function render_pagination() {
        // 只在AJAX模式下渲染分页控件
        if (!$this->args['ajax']) {
            return;
        }
        
        echo '<div class="tablenav bottom">';
        echo '<div class="tablenav-pages">';
        echo '<span class="displaying-num"></span>';
        echo '<span class="pagination-links">';
        echo '<a class="first-page button" href="#"><span class="screen-reader-text">' . __('首页', 'bjt-product-admin') . '</span><span aria-hidden="true">&laquo;</span></a>';
        echo '<a class="prev-page button" href="#"><span class="screen-reader-text">' . __('上一页', 'bjt-product-admin') . '</span><span aria-hidden="true">&lsaquo;</span></a>';
        echo '<span class="paging-input">';
        echo '<label for="' . esc_attr($this->id) . '-current-page" class="screen-reader-text">' . __('当前页', 'bjt-product-admin') . '</label>';
        echo '<input class="current-page" id="' . esc_attr($this->id) . '-current-page" type="text" value="1" size="1">';
        echo ' / <span class="total-pages">0</span>';
        echo '</span>';
        echo '<a class="next-page button" href="#"><span class="screen-reader-text">' . __('下一页', 'bjt-product-admin') . '</span><span aria-hidden="true">&rsaquo;</span></a>';
        echo '<a class="last-page button" href="#"><span class="screen-reader-text">' . __('末页', 'bjt-product-admin') . '</span><span aria-hidden="true">&raquo;</span></a>';
        echo '</span>';
        echo '</div>';
        echo '<br class="clear">';
        echo '</div>';
    }
    
    /**
     * 添加表格数据属性
     */
    private function add_table_data_attributes() {
        $data = array(
            'id' => $this->id,
            'ajax' => $this->args['ajax'],
            'per_page' => $this->args['per_page'],
            'searchable' => $this->args['searchable'],
            'sortable' => $this->args['sortable'],
            'filterable' => $this->args['filterable'],
            'exportable' => $this->args['exportable'],
            'importable' => $this->args['importable'],
            'bulk_actions' => $this->args['bulk_actions'],
            'data_source' => $this->args['data_source'],
            'default_sort_column' => $this->args['default_sort_column'],
            'default_sort_order' => $this->args['default_sort_order']
        );
        
        // 编码数据属性
        $json_data = wp_json_encode($data);
        
        // 添加数据属性脚本
        echo '<script type="text/javascript">
            document.addEventListener("DOMContentLoaded", function() {
                const tableContainer = document.getElementById("' . esc_js($this->id) . '-container");
                if (tableContainer) {
                    tableContainer.dataset.config = \'' . esc_js($json_data) . '\';
                }
            });
        </script>';
    }
    
    /**
     * 获取AJAX数据处理URL
     *
     * @return string AJAX URL
     */
    public function get_ajax_url() {
        return admin_url('admin-ajax.php?action=bjt_load_table&table_id=' . urlencode($this->id));
    }
    
    /**
     * 静态方法：渲染单元格值
     *
     * @param mixed $value 原始值
     * @param string $type 单元格类型
     * @param array $args 附加参数
     * @return string 格式化的单元格内容
     */
    public static function render_cell_value($value, $type, $args = array()) {
        switch ($type) {
            case 'boolean':
                return $value ? '<span class="dashicons dashicons-yes"></span>' : '<span class="dashicons dashicons-no"></span>';
                
            case 'image':
                if (!empty($value)) {
                    return '<img src="' . esc_url($value) . '" alt="" width="' . (isset($args['width']) ? intval($args['width']) : 50) . '" height="' . (isset($args['height']) ? intval($args['height']) : 50) . '" />';
                }
                return '';
                
            case 'date':
                if (!empty($value)) {
                    $format = isset($args['format']) ? $args['format'] : get_option('date_format');
                    return date_i18n($format, strtotime($value));
                }
                return '';
                
            case 'number':
                if (isset($args['decimal'])) {
                    return number_format_i18n($value, $args['decimal']);
                }
                return number_format_i18n($value);
                
            case 'price':
                $currency = isset($args['currency']) ? $args['currency'] : '¥';
                $decimal = isset($args['decimal']) ? $args['decimal'] : 2;
                return $currency . number_format_i18n($value, $decimal);
                
            case 'status':
                $statuses = isset($args['statuses']) ? $args['statuses'] : array(
                    'active' => __('激活', 'bjt-product-admin'),
                    'inactive' => __('未激活', 'bjt-product-admin'),
                    'pending' => __('待处理', 'bjt-product-admin'),
                    'deleted' => __('已删除', 'bjt-product-admin')
                );
                
                $status_class = sanitize_html_class($value);
                $status_text = isset($statuses[$value]) ? $statuses[$value] : $value;
                
                return '<span class="bjt-status status-' . esc_attr($status_class) . '">' . esc_html($status_text) . '</span>';
                
            case 'text':
            default:
                if (isset($args['max_length']) && strlen($value) > $args['max_length']) {
                    return esc_html(substr($value, 0, $args['max_length'])) . '...';
                }
                return esc_html($value);
        }
    }
} 