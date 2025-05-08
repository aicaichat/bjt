<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取所有主机
global $wpdb;
$hosts = $wpdb->get_results("SELECT id, model FROM {$wpdb->prefix}bjt_hosts ORDER BY model ASC");
?>

<div class="wrap">
    <h1 class="wp-heading-inline">新增料号</h1>
    <hr class="wp-header-end">

    <form method="post" action="" id="part-number-form">
        <?php wp_nonce_field('bjt_save_part_number', 'bjt_part_number_nonce'); ?>
        <input type="hidden" name="part_number_id" value="0">
        
        <div class="bjt-form-section">
            <h2>基本信息</h2>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="host_id">所属主机</label></th>
                    <td>
                        <select name="host_id" id="host_id" required>
                            <option value="">请选择主机</option>
                            <?php foreach ($hosts as $host): ?>
                                <option value="<?php echo esc_attr($host->id); ?>">
                                    <?php echo esc_html($host->model); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="part_number">料号</label></th>
                    <td>
                        <input type="text" name="part_number" id="part_number" class="regular-text" 
                               value="" required>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="name_cn">中文名称</label></th>
                    <td>
                        <input type="text" name="name_cn" id="name_cn" class="regular-text" 
                               value="" required>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="name_en">英文名称</label></th>
                    <td>
                        <input type="text" name="name_en" id="name_en" class="regular-text" 
                               value="" required>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="voltage">电压</label></th>
                    <td>
                        <input type="text" name="voltage" id="voltage" class="regular-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="specification">规格</label></th>
                    <td>
                        <textarea name="specification" id="specification" class="large-text" rows="5"></textarea>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="status">状态</label></th>
                    <td>
                        <select name="status" id="status">
                            <option value="1" selected>启用</option>
                            <option value="0">禁用</option>
                        </select>
                    </td>
                </tr>
            </table>
        </div>

        <div class="bjt-form-section">
            <h2>包装信息</h2>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="package_length">包装长度(cm)</label></th>
                    <td>
                        <input type="number" name="package_length" id="package_length" class="small-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="package_width">包装宽度(cm)</label></th>
                    <td>
                        <input type="number" name="package_width" id="package_width" class="small-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="package_height">包装高度(cm)</label></th>
                    <td>
                        <input type="number" name="package_height" id="package_height" class="small-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="package_weight">包装重量(kg)</label></th>
                    <td>
                        <input type="number" name="package_weight" id="package_weight" class="small-text" 
                               value="">
                    </td>
                </tr>
            </table>
        </div>

        <div class="bjt-form-section">
            <h2>托盘信息</h2>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="pallet_length">托盘长度(cm)</label></th>
                    <td>
                        <input type="number" name="pallet_length" id="pallet_length" class="small-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pallet_width">托盘宽度(cm)</label></th>
                    <td>
                        <input type="number" name="pallet_width" id="pallet_width" class="small-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pallet_height">托盘高度(cm)</label></th>
                    <td>
                        <input type="number" name="pallet_height" id="pallet_height" class="small-text" 
                               value="">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pallet_weight">托盘重量(kg)</label></th>
                    <td>
                        <input type="number" name="pallet_weight" id="pallet_weight" class="small-text" 
                               value="">
                    </td>
                </tr>
            </table>
        </div>

        <p class="submit">
            <input type="submit" name="submit" id="submit" class="button button-primary" value="保存">
            <a href="<?php echo admin_url('admin.php?page=bjt-product-admin-part-numbers'); ?>" class="button">取消</a>
        </p>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    $('#part-number-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = $(this).serialize();
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_save_part_number',
                nonce: $('#bjt_part_number_nonce').val(),
                form_data: formData
            },
            beforeSend: function() {
                $('#submit').prop('disabled', true).val('保存中...');
            },
            success: function(response) {
                if (response.success) {
                    window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-admin-part-numbers'); ?>';
                } else {
                    alert(response.data.message || '保存失败');
                }
            },
            error: function() {
                alert('保存失败，请重试');
            },
            complete: function() {
                $('#submit').prop('disabled', false).val('保存');
            }
        });
    });
});
</script>