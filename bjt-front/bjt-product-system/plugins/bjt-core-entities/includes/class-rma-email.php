<?php
/**
 * RMA Email Service
 * 
 * Handles email notifications for RMA requests
 */

class BJT_RMA_Email {
    
    /**
     * Send RMA notification email
     */
    public static function send_notification($rma_id, $event_type) {
        global $wpdb;
        
        // 获取RMA信息
        $rma = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bjt_rma WHERE id = %d",
            $rma_id
        ));
        
        if (!$rma) {
            return false;
        }
        
        // 获取用户信息
        $user = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bjt_users WHERE id = %d",
            $rma->user_id
        ));
        
        if (!$user) {
            return false;
        }
        
        switch ($event_type) {
            case 'created':
                return self::send_rma_created_notification($rma, $user);
            case 'status_changed':
                return self::send_status_changed_notification($rma, $user);
            case 'new_comment':
                return self::send_new_comment_notification($rma, $user);
            default:
                return false;
        }
    }
    
    /**
     * Send RMA created notification
     */
    private static function send_rma_created_notification($rma, $user) {
        // 发送给用户的确认邮件
        $user_subject = "您的退货申请已提交 - {$rma->rma_number}";
        $user_message = self::get_rma_created_user_template($rma, $user);
        
        $user_sent = wp_mail($user->email, $user_subject, $user_message, self::get_email_headers());
        
        // 发送给管理员的通知邮件
        $admin_emails = self::get_admin_emails($rma->warehouse);
        if (!empty($admin_emails)) {
            $admin_subject = "新的退货申请 - {$rma->rma_number}";
            $admin_message = self::get_rma_created_admin_template($rma, $user);
            
            foreach ($admin_emails as $admin_email) {
                wp_mail($admin_email, $admin_subject, $admin_message, self::get_email_headers());
            }
        }
        
        return $user_sent;
    }
    
    /**
     * Send status changed notification
     */
    private static function send_status_changed_notification($rma, $user) {
        $subject = "退货申请状态更新 - {$rma->rma_number}";
        $message = self::get_status_changed_template($rma, $user);
        
        return wp_mail($user->email, $subject, $message, self::get_email_headers());
    }
    
    /**
     * Send new comment notification
     */
    private static function send_new_comment_notification($rma, $user) {
        $subject = "退货申请有新回复 - {$rma->rma_number}";
        $message = self::get_new_comment_template($rma, $user);
        
        return wp_mail($user->email, $subject, $message, self::get_email_headers());
    }
    
    /**
     * Get email headers
     */
    private static function get_email_headers() {
        $headers = array();
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'From: BJT System <noreply@bjt-system.com>';
        
        return $headers;
    }
    
    /**
     * Get admin emails based on warehouse
     */
    private static function get_admin_emails($warehouse) {
        // 从设置中获取仓库对应的管理员邮箱
        $settings = get_option('bjt_rma_settings', array());
        $warehouse_contacts = isset($settings['warehouse_contacts']) ? $settings['warehouse_contacts'] : array();
        
        if (isset($warehouse_contacts[$warehouse])) {
            return is_array($warehouse_contacts[$warehouse]) ? $warehouse_contacts[$warehouse] : array($warehouse_contacts[$warehouse]);
        }
        
        // 默认管理员邮箱
        return array(get_option('admin_email'));
    }
    
    /**
     * Email templates
     */
    
    private static function get_rma_created_user_template($rma, $user) {
        $template = '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">退货申请确认</h2>
                
                <p>尊敬的 {customer_name}，</p>
                
                <p>您的退货申请已成功提交，我们将尽快处理。</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">申请详情</h3>
                    <p><strong>RMA编号：</strong>{rma_number}</p>
                    <p><strong>订单号：</strong>{order_number}</p>
                    <p><strong>申请时间：</strong>{created_at}</p>
                    <p><strong>退货原因：</strong>{reason_category}</p>
                    <p><strong>当前状态：</strong>{status_text}</p>
                </div>
                
                <p>您可以随时登录系统查看处理进度：</p>
                <p><a href="{rma_url}" style="background: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">查看退货申请</a></p>
                
                <p>如有疑问，请联系我们的客服团队。</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    此邮件由BJT产品管理系统自动发送，请勿直接回复。
                </p>
            </div>
        </body>
        </html>';
        
        return self::replace_template_vars($template, $rma, $user);
    }
    
    private static function get_rma_created_admin_template($rma, $user) {
        $template = '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d63384;">新的退货申请</h2>
                
                <p>收到一个新的退货申请，请及时处理。</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #d63384; margin: 20px 0;">
                    <h3 style="margin-top: 0;">申请信息</h3>
                    <p><strong>RMA编号：</strong>{rma_number}</p>
                    <p><strong>客户：</strong>{customer_name} ({customer_email})</p>
                    <p><strong>订单号：</strong>{order_number}</p>
                    <p><strong>申请时间：</strong>{created_at}</p>
                    <p><strong>退货原因：</strong>{reason_category}</p>
                    <p><strong>详细说明：</strong>{reason_detail}</p>
                </div>
                
                <p><a href="{admin_rma_url}" style="background: #d63384; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">处理申请</a></p>
            </div>
        </body>
        </html>';
        
        return self::replace_template_vars($template, $rma, $user);
    }
    
    private static function get_status_changed_template($rma, $user) {
        $template = '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #198754;">退货申请状态更新</h2>
                
                <p>尊敬的 {customer_name}，</p>
                
                <p>您的退货申请状态已更新。</p>
                
                <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">申请详情</h3>
                    <p><strong>RMA编号：</strong>{rma_number}</p>
                    <p><strong>订单号：</strong>{order_number}</p>
                    <p><strong>当前状态：</strong><span style="color: #198754; font-weight: bold;">{status_text}</span></p>
                    <p><strong>更新时间：</strong>{updated_at}</p>
                </div>
                
                <p><a href="{rma_url}" style="background: #198754; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">查看详情</a></p>
            </div>
        </body>
        </html>';
        
        return self::replace_template_vars($template, $rma, $user);
    }
    
    private static function get_new_comment_template($rma, $user) {
        $template = '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0d6efd;">退货申请有新回复</h2>
                
                <p>尊敬的 {customer_name}，</p>
                
                <p>您的退货申请有新的回复，请及时查看。</p>
                
                <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">申请详情</h3>
                    <p><strong>RMA编号：</strong>{rma_number}</p>
                    <p><strong>订单号：</strong>{order_number}</p>
                    <p><strong>当前状态：</strong>{status_text}</p>
                </div>
                
                <p><a href="{rma_url}" style="background: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">查看回复</a></p>
            </div>
        </body>
        </html>';
        
        return self::replace_template_vars($template, $rma, $user);
    }
    
    /**
     * Replace template variables
     */
    private static function replace_template_vars($template, $rma, $user) {
        $status_map = array(
            'pending' => '待处理',
            'processing' => '处理中',
            'approved' => '已批准',
            'rejected' => '已拒绝',
            'completed' => '已完成',
            'cancelled' => '已取消'
        );
        
        $base_url = home_url();
        
        $replacements = array(
            '{customer_name}' => $user->username,
            '{customer_email}' => $user->email,
            '{rma_number}' => $rma->rma_number,
            '{order_number}' => $rma->order_number,
            '{reason_category}' => $rma->reason_category,
            '{reason_detail}' => $rma->reason_detail ?: '无',
            '{status_text}' => isset($status_map[$rma->status]) ? $status_map[$rma->status] : $rma->status,
            '{created_at}' => date('Y-m-d H:i:s', strtotime($rma->created_at)),
            '{updated_at}' => date('Y-m-d H:i:s', strtotime($rma->updated_at)),
            '{rma_url}' => "{$base_url}/my-returns/{$rma->id}",
            '{admin_rma_url}' => "{$base_url}/admin/rma/{$rma->id}",
        );
        
        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
} 