<?php
namespace BJT\Reg;

use WP_Error;

class Review_Service {
    public static function approve(int $row_id, array $data): bool {
        global $wpdb;
        $table = $wpdb->prefix . 'bjt_user_registration';
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id=%d", $row_id));
        if (! $row) {
            return false;
        }
        if ($row->status !== 'pending') {
            return false;
        }
        $json = json_decode($row->json_data, true);
        $email = $json['email'] ?? '';
        if (!is_email($email)) {
            return false;
        }
        // Create WP user
        $username = sanitize_user(explode('@', $email)[0]);
        if (username_exists($username)) {
            $username .= '_' . time();
        }
        $userdata = [
            'user_login' => $username,
            'user_pass'  => wp_generate_password(12, true),
            'user_email' => $email,
            'first_name' => $json['first_name'] ?? '',
            'last_name'  => $json['last_name'] ?? '',
            'role'       => $data['role'] ?? 'customer',
        ];
        $user_id = wp_insert_user($userdata);
        if (is_wp_error($user_id)) {
            return false;
        }
        // Save metas
        if (!empty($data['warehouse'])) {
            update_user_meta($user_id, 'bjt_warehouse', $data['warehouse']);
        }
        if (!empty($data['unit'])) {
            update_user_meta($user_id, 'bjt_unit', $data['unit']);
        }
        if (!empty($data['customer_code'])) {
            update_user_meta($user_id, 'bjt_customer_code', $data['customer_code']);
        }

        // Update registration row
        $wpdb->update($table, [
            'wp_user_id' => $user_id,
            'status' => 'approved',
            'reviewer_id' => get_current_user_id(),
            'reviewed_at' => current_time('mysql', true),
        ], ['id' => $row_id]);

        // Send welcome email
        $subject = sprintf(__('Your BJT account has been approved', 'bjt-registration'));
        $message = sprintf(__('Hello %s, your account has been approved. You can now login: %s', 'bjt-registration'), $json['first_name'] ?? '', wp_login_url());
        wp_mail($email, $subject, $message);

        return true;
    }

    public static function reject(int $row_id, string $reason): bool {
        global $wpdb;
        $table = $wpdb->prefix . 'bjt_user_registration';
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id=%d", $row_id));
        if (! $row) {
            return false;
        }
        if ($row->status !== 'pending') {
            return false;
        }
        $json = json_decode($row->json_data, true);
        $email = $json['email'] ?? '';
        $wpdb->update($table, [
            'status' => 'rejected',
            'reviewer_id' => get_current_user_id(),
            'reviewed_at' => current_time('mysql', true),
        ], ['id' => $row_id]);

        if (is_email($email)) {
            $subject = sprintf(__('Your BJT account was rejected', 'bjt-registration'));
            $message = sprintf(__('Hello, your registration was rejected. Reason: %s', 'bjt-registration'), $reason);
            wp_mail($email, $subject, $message);
        }
        return true;
    }
} 