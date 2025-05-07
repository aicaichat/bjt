<?php
if (!defined('ABSPATH')) {
    exit;
}

$air_cushion = BJT_Air_Cushion_Management::get_instance();
?>

<div class="wrap">
    <h1 class="wp-heading-inline">必选备件管理</h1>
    <hr class="wp-header-end">

    <div class="nav-tab-wrapper">
        <a href="#spare-part-required" class="nav-tab nav-tab-active">备件必选备件</a>
        <a href="#host-accessory-required" class="nav-tab">主机配件必选备件</a>
    </div>

    <!-- 备件必选备件管理 -->
    <div id="spare-part-required" class="tab-content">
        <h2>备件必选备件管理</h2>
        <div class="tablenav top">
            <div class="alignleft actions">
                <select id="parent-spare-part">
                    <option value="">选择备件</option>
                    <?php
                    $spare_parts = $air_cushion->get_all_spare_parts();
                    foreach ($spare_parts as $part) {
                        echo '<option value="' . esc_attr($part->part_number) . '">' . 
                             esc_html($part->part_number . ' - ' . $part->name_cn) . '</option>';
                    }
                    ?>
                </select>
                <select id="required-spare-part">
                    <option value="">选择必选备件</option>
                </select>
                <input type="number" id="required-quantity" min="1" value="1" placeholder="数量">
                <button type="button" class="button" id="add-spare-part-required">添加必选备件</button>
            </div>
        </div>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>父备件</th>
                    <th>必选备件</th>
                    <th>数量</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="spare-part-required-list">
                <!-- 通过AJAX动态加载 -->
            </tbody>
        </table>
    </div>

    <!-- 主机配件必选备件管理 -->
    <div id="host-accessory-required" class="tab-content" style="display: none;">
        <h2>主机配件必选备件管理</h2>
        <div class="tablenav top">
            <div class="alignleft actions">
                <select id="host-model">
                    <option value="">选择主机型号</option>
                    <?php
                    $host_models = $air_cushion->get_all_host_models();
                    foreach ($host_models as $model) {
                        echo '<option value="' . esc_attr($model->model) . '">' . 
                             esc_html($model->model . ' - ' . $model->title_cn) . '</option>';
                    }
                    ?>
                </select>
                <select id="accessory-part">
                    <option value="">选择配件</option>
                </select>
                <select id="required-part">
                    <option value="">选择必选备件</option>
                </select>
                <input type="number" id="required-part-quantity" min="1" value="1" placeholder="数量">
                <button type="button" class="button" id="add-host-accessory-required">添加必选备件</button>
            </div>
        </div>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>主机型号</th>
                    <th>配件</th>
                    <th>必选备件</th>
                    <th>数量</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="host-accessory-required-list">
                <!-- 通过AJAX动态加载 -->
            </tbody>
        </table>
    </div>
</div>

<style>
.tab-content {
    margin-top: 20px;
}
.nav-tab-wrapper {
    margin-bottom: 20px;
}
.alignleft.actions {
    display: flex;
    gap: 10px;
    align-items: center;
}
.alignleft.actions select,
.alignleft.actions input {
    min-width: 200px;
}
</style>

<script>
jQuery(document).ready(function($) {
    // 切换标签页
    $('.nav-tab').on('click', function(e) {
        e.preventDefault();
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        $('.tab-content').hide();
        $($(this).attr('href')).show();
    });

    // 加载备件必选备件列表
    function loadSparePartRequired() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_get_spare_part_required',
                nonce: '<?php echo wp_create_nonce('bjt_get_spare_part_required'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    let html = '';
                    response.data.forEach(function(item) {
                        html += `
                            <tr>
                                <td>${item.parent_part_number} - ${item.parent_name}</td>
                                <td>${item.required_part_number} - ${item.required_name}</td>
                                <td>${item.quantity}</td>
                                <td>
                                    <button type="button" class="button delete-required" 
                                            data-parent="${item.parent_part_number}"
                                            data-required="${item.required_part_number}">
                                        删除
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                    $('#spare-part-required-list').html(html);
                }
            }
        });
    }

    // 加载主机配件必选备件列表
    function loadHostAccessoryRequired() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_get_host_accessory_required',
                nonce: '<?php echo wp_create_nonce('bjt_get_host_accessory_required'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    let html = '';
                    response.data.forEach(function(item) {
                        html += `
                            <tr>
                                <td>${item.model} - ${item.model_name}</td>
                                <td>${item.accessory_part_number} - ${item.accessory_name}</td>
                                <td>${item.required_part_number} - ${item.required_name}</td>
                                <td>${item.quantity}</td>
                                <td>
                                    <button type="button" class="button delete-required" 
                                            data-model="${item.model}"
                                            data-accessory="${item.accessory_part_number}"
                                            data-required="${item.required_part_number}">
                                        删除
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                    $('#host-accessory-required-list').html(html);
                }
            }
        });
    }

    // 选择备件时加载可选必选备件
    $('#parent-spare-part').on('change', function() {
        let parentPart = $(this).val();
        if (parentPart) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_get_available_required_parts',
                    parent_part: parentPart,
                    nonce: '<?php echo wp_create_nonce('bjt_get_available_required_parts'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        let options = '<option value="">选择必选备件</option>';
                        response.data.forEach(function(part) {
                            options += `<option value="${part.part_number}">${part.part_number} - ${part.name_cn}</option>`;
                        });
                        $('#required-spare-part').html(options);
                    }
                }
            });
        }
    });

    // 选择主机型号时加载配件
    $('#host-model').on('change', function() {
        let model = $(this).val();
        if (model) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_get_model_accessories',
                    model: model,
                    nonce: '<?php echo wp_create_nonce('bjt_get_model_accessories'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        let options = '<option value="">选择配件</option>';
                        response.data.forEach(function(accessory) {
                            options += `<option value="${accessory.part_number}">${accessory.part_number} - ${accessory.name_cn}</option>`;
                        });
                        $('#accessory-part').html(options);
                    }
                }
            });
        }
    });

    // 选择配件时加载可选必选备件
    $('#accessory-part').on('change', function() {
        let model = $('#host-model').val();
        let accessory = $(this).val();
        if (model && accessory) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_get_available_required_parts',
                    model: model,
                    accessory: accessory,
                    nonce: '<?php echo wp_create_nonce('bjt_get_available_required_parts'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        let options = '<option value="">选择必选备件</option>';
                        response.data.forEach(function(part) {
                            options += `<option value="${part.part_number}">${part.part_number} - ${part.name_cn}</option>`;
                        });
                        $('#required-part').html(options);
                    }
                }
            });
        }
    });

    // 添加备件必选备件
    $('#add-spare-part-required').on('click', function() {
        let parentPart = $('#parent-spare-part').val();
        let requiredPart = $('#required-spare-part').val();
        let quantity = $('#required-quantity').val();

        if (!parentPart || !requiredPart || !quantity) {
            alert('请填写完整信息');
            return;
        }

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_add_spare_part_required',
                parent_part: parentPart,
                required_part: requiredPart,
                quantity: quantity,
                nonce: '<?php echo wp_create_nonce('bjt_add_spare_part_required'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    loadSparePartRequired();
                    $('#required-spare-part').val('');
                    $('#required-quantity').val('1');
                } else {
                    alert(response.data.message);
                }
            }
        });
    });

    // 添加主机配件必选备件
    $('#add-host-accessory-required').on('click', function() {
        let model = $('#host-model').val();
        let accessory = $('#accessory-part').val();
        let requiredPart = $('#required-part').val();
        let quantity = $('#required-part-quantity').val();

        if (!model || !accessory || !requiredPart || !quantity) {
            alert('请填写完整信息');
            return;
        }

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_add_host_accessory_required',
                model: model,
                accessory: accessory,
                required_part: requiredPart,
                quantity: quantity,
                nonce: '<?php echo wp_create_nonce('bjt_add_host_accessory_required'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    loadHostAccessoryRequired();
                    $('#required-part').val('');
                    $('#required-part-quantity').val('1');
                } else {
                    alert(response.data.message);
                }
            }
        });
    });

    // 删除必选备件关系
    $(document).on('click', '.delete-required', function() {
        if (!confirm('确定要删除这个必选备件关系吗？')) {
            return;
        }

        let $button = $(this);
        let isSparePartRequired = $button.data('parent') !== undefined;

        if (isSparePartRequired) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_delete_spare_part_required',
                    parent_part: $button.data('parent'),
                    required_part: $button.data('required'),
                    nonce: '<?php echo wp_create_nonce('bjt_delete_spare_part_required'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        loadSparePartRequired();
                    } else {
                        alert(response.data.message);
                    }
                }
            });
        } else {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_delete_host_accessory_required',
                    model: $button.data('model'),
                    accessory: $button.data('accessory'),
                    required_part: $button.data('required'),
                    nonce: '<?php echo wp_create_nonce('bjt_delete_host_accessory_required'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        loadHostAccessoryRequired();
                    } else {
                        alert(response.data.message);
                    }
                }
            });
        }
    });

    // 初始加载数据
    loadSparePartRequired();
    loadHostAccessoryRequired();
});
</script> 