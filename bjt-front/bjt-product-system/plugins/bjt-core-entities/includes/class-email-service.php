<?php
/**
 * BJT Email Service Class
 * 
 * 处理系统邮件发送功能
 */

class BJT_Email_Service {
    
    private $settings;
    
    public function __construct() {
        $this->settings = get_option('bjt_settings', []);
        
        // 配置WordPress邮件
        add_action('phpmailer_init', [$this, 'configure_phpmailer']);
        add_filter('wp_mail_from', [$this, 'set_from_email']);
        add_filter('wp_mail_from_name', [$this, 'set_from_name']);
        add_filter('wp_mail_content_type', [$this, 'set_content_type']);
    }
    
    /**
     * 配置PHPMailer使用SMTP
     */
    public function configure_phpmailer($phpmailer) {
        // 只有在配置了SMTP设置时才启用
        if (empty($this->settings['smtp_host'])) {
            return;
        }
        
        $phpmailer->isSMTP();
        $phpmailer->Host = $this->settings['smtp_host'];
        $phpmailer->Port = $this->settings['smtp_port'] ?? 587;
        $phpmailer->SMTPAuth = true;
        $phpmailer->Username = $this->settings['smtp_username'];
        $phpmailer->Password = $this->settings['smtp_password'];
        
        // 设置加密方式
        $encryption = $this->settings['smtp_encryption'] ?? 'tls';
        if ($encryption === 'ssl') {
            $phpmailer->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($encryption === 'tls') {
            $phpmailer->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        }
        
        // 调试模式（开发环境）
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $phpmailer->SMTPDebug = 2;
            $phpmailer->Debugoutput = 'error_log';
        }
    }
    
    /**
     * 设置发件人邮箱
     */
    public function set_from_email($original_email_address) {
        return $this->settings['mail_from_address'] ?? $original_email_address;
    }
    
    /**
     * 设置发件人名称
     */
    public function set_from_name($original_email_from) {
        return $this->settings['mail_from_name'] ?? $original_email_from;
    }
    
    /**
     * 设置邮件内容类型为HTML
     */
    public function set_content_type() {
        return 'text/html';
    }
    
    /**
     * 发送邮件
     */
    public function send_email($to, $subject, $message, $headers = [], $attachments = []) {
        // 确保收件人是数组格式
        if (!is_array($to)) {
            $to = [$to];
        }
        
        // 默认HTML邮件头
        if (empty($headers)) {
            $headers = ['Content-Type: text/html; charset=UTF-8'];
        }
        
        $success = wp_mail($to, $subject, $message, $headers, $attachments);
        
        if (!$success) {
            error_log('BJT Email Service: 邮件发送失败 - ' . $subject);
        }
        
        return $success;
    }
    
    /**
     * 测试邮件设置
     */
    public function test_email_settings($test_email = null) {
        if (!$test_email) {
            $test_email = $this->settings['mail_from_address'] ?? get_option('admin_email');
        }
        
        $subject = 'BJT系统邮件测试';
        $message = $this->get_test_email_template();
        
        return $this->send_email($test_email, $subject, $message);
    }
    
    /**
     * 获取测试邮件模板
     */
    private function get_test_email_template() {
        return '
        <html>
        <body>
            <h2>BJT系统邮件测试</h2>
            <p>这是一封测试邮件，用于验证SMTP邮件配置是否正常。</p>
            <p><strong>发送时间：</strong>' . date('Y-m-d H:i:s') . '</p>
            <p><strong>系统信息：</strong></p>
            <ul>
                <li>PHP版本：' . phpversion() . '</li>
                <li>WordPress版本：' . get_bloginfo('version') . '</li>
                <li>SMTP主机：' . ($this->settings['smtp_host'] ?? '未配置') . '</li>
                <li>SMTP端口：' . ($this->settings['smtp_port'] ?? '未配置') . '</li>
            </ul>
            <p>如果您收到这封邮件，说明邮件配置成功！</p>
        </body>
        </html>';
    }
    
    /**
     * 发送用户注册通知邮件
     */
    public function send_user_registration_email($user_data) {
        $subject = 'BJT系统 - 用户注册通知';
        $message = $this->get_user_registration_template($user_data);
        
        // 发送给管理员
        $admin_email = get_option('admin_email');
        $this->send_email($admin_email, $subject, $message);
        
        // 发送确认邮件给用户
        $user_subject = 'BJT系统 - 注册确认';
        $user_message = $this->get_user_welcome_template($user_data);
        $this->send_email($user_data['email'], $user_subject, $user_message);
    }
    
    /**
     * 用户注册通知模板
     */
    private function get_user_registration_template($user_data) {
        return '
        <html>
        <body>
            <h2>新用户注册通知</h2>
            <p>有新用户注册了BJT系统：</p>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr><td><strong>用户名</strong></td><td>' . $user_data['username'] . '</td></tr>
                <tr><td><strong>邮箱</strong></td><td>' . $user_data['email'] . '</td></tr>
                <tr><td><strong>角色</strong></td><td>' . $user_data['role'] . '</td></tr>
                <tr><td><strong>国家</strong></td><td>' . $user_data['country'] . '</td></tr>
                <tr><td><strong>注册时间</strong></td><td>' . date('Y-m-d H:i:s') . '</td></tr>
            </table>
            <p>请登录后台进行审核。</p>
        </body>
        </html>';
    }
    
    /**
     * 用户欢迎邮件模板
     */
    private function get_user_welcome_template($user_data) {
        return '
        <html>
        <body>
            <h2>欢迎注册BJT系统</h2>
            <p>亲爱的 ' . $user_data['username'] . '，</p>
            <p>感谢您注册BJT产品管理系统！</p>
            <p><strong>您的账户信息：</strong></p>
            <ul>
                <li>用户名：' . $user_data['username'] . '</li>
                <li>邮箱：' . $user_data['email'] . '</li>
                <li>角色：' . $user_data['role'] . '</li>
            </ul>
            <p>我们将在1-2个工作日内审核您的账户，审核通过后您将收到激活通知。</p>
            <p>如有任何问题，请联系我们的客服团队。</p>
            <p>祝好！<br>BJT团队</p>
        </body>
        </html>';
    }
    
    /**
     * 发送密码重置邮件
     */
    public function send_password_reset_email($user_data, $reset_link) {
        $subject = 'BJT系统 - 密码重置';
        $message = $this->get_password_reset_template($user_data, $reset_link);
        
        return $this->send_email($user_data['email'], $subject, $message);
    }
    
    /**
     * 密码重置邮件模板
     */
    private function get_password_reset_template($user_data, $reset_link) {
        return '
        <html>
        <body>
            <h2>密码重置请求</h2>
            <p>亲爱的 ' . $user_data['username'] . '，</p>
            <p>我们收到了您的密码重置请求。</p>
            <p>请点击下面的链接重置您的密码：</p>
            <p><a href="' . $reset_link . '" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">重置密码</a></p>
            <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
            <p>' . $reset_link . '</p>
            <p><strong>注意：</strong>此链接将在24小时后过期。</p>
            <p>如果您没有请求密码重置，请忽略此邮件。</p>
            <p>祝好！<br>BJT团队</p>
        </body>
        </html>';
    }
    
    /**
     * 发送RMA通知邮件
     */
    public function send_rma_notification($rma_data, $type = 'created') {
        $templates = [
            'created' => '您的退货申请已提交',
            'approved' => '您的退货申请已批准',
            'rejected' => '您的退货申请已拒绝',
            'completed' => '您的退货申请已完成'
        ];
        
        $subject = 'BJT系统 - ' . $templates[$type];
        $message = $this->get_rma_notification_template($rma_data, $type);
        
        return $this->send_email($rma_data['user_email'], $subject, $message);
    }
    
    /**
     * RMA通知邮件模板
     */
    private function get_rma_notification_template($rma_data, $type) {
        $status_messages = [
            'created' => '您的退货申请已成功提交，我们将在1-2个工作日内处理。',
            'approved' => '您的退货申请已批准，请按照以下说明进行退货。',
            'rejected' => '很抱歉，您的退货申请被拒绝。',
            'completed' => '您的退货申请已完成处理。'
        ];
        
        return '
        <html>
        <body>
            <h2>退货申请通知</h2>
            <p>RMA编号：' . $rma_data['rma_number'] . '</p>
            <p>订单编号：' . $rma_data['order_number'] . '</p>
            <p><strong>状态更新：</strong>' . $status_messages[$type] . '</p>
            <p>您可以登录系统查看详细信息和处理进度。</p>
            <p>如有任何问题，请联系我们的客服团队。</p>
            <p>祝好！<br>BJT团队</p>
        </body>
        </html>';
    }
}

// 初始化邮件服务
new BJT_Email_Service(); 