<?php
/**
 * BJT Ajax handler class.
 *
 * @package BJT_Product_Admin
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * BJT_Ajax Class.
 */
class BJT_Ajax {

	/**
	 * Hook in ajax handlers.
	 */
	public static function init() {
		self::add_ajax_events();
	}

	/**
	 * Add Ajax events.
	 */
	public static function add_ajax_events() {
		// WordPress Ajax events.
		$ajax_events = array(
			'save_host'              => true,
			'delete_host'            => true,
			'import_hosts'           => true,
			'save_part'              => true,
			'delete_part'            => true,
			'import_parts'           => true,
			'save_relationship'      => true,
			'delete_relationship'    => true,
			'submit_product_inquiry' => false, // False means it works for non-logged in users too
		);

		foreach ( $ajax_events as $ajax_event => $nopriv ) {
			add_action( 'wp_ajax_bjt_' . $ajax_event, array( __CLASS__, $ajax_event ) );

			if ( $nopriv ) {
				add_action( 'wp_ajax_nopriv_bjt_' . $ajax_event, array( __CLASS__, $ajax_event ) );
			}
		}
	}

	/**
	 * Save host AJAX handler.
	 */
	public static function save_host() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Delete host AJAX handler.
	 */
	public static function delete_host() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Import hosts AJAX handler.
	 */
	public static function import_hosts() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Save part AJAX handler.
	 */
	public static function save_part() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Delete part AJAX handler.
	 */
	public static function delete_part() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Import parts AJAX handler.
	 */
	public static function import_parts() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Save relationship AJAX handler.
	 */
	public static function save_relationship() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Delete relationship AJAX handler.
	 */
	public static function delete_relationship() {
		// Security checks and implementation...
		// ... existing code ...
	}

	/**
	 * Product inquiry submission AJAX handler.
	 */
	public static function submit_product_inquiry() {
		$response = array(
			'success' => false,
			'message' => __( 'An error occurred while processing your request.', 'bjt-product-admin' ),
		);

		// Nonce verification
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'bjt_product_inquiry_nonce' ) ) {
			$response['message'] = __( 'Security verification failed.', 'bjt-product-admin' );
			wp_send_json( $response );
		}

		// Validate required fields
		$required_fields = array(
			'name'    => __( 'Name is required.', 'bjt-product-admin' ),
			'email'   => __( 'Email is required.', 'bjt-product-admin' ),
			'message' => __( 'Message is required.', 'bjt-product-admin' ),
		);

		foreach ( $required_fields as $field => $error ) {
			if ( empty( $_POST[ $field ] ) ) {
				$response['message'] = $error;
				wp_send_json( $response );
			}
		}

		// Validate email format
		if ( ! is_email( sanitize_email( wp_unslash( $_POST['email'] ) ) ) ) {
			$response['message'] = __( 'Please enter a valid email address.', 'bjt-product-admin' );
			wp_send_json( $response );
		}

		// Get and sanitize form data
		$name          = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
		$company       = isset( $_POST['company'] ) ? sanitize_text_field( wp_unslash( $_POST['company'] ) ) : '';
		$email         = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
		$phone         = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
		$message       = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';
		$product_id    = isset( $_POST['product_id'] ) ? intval( $_POST['product_id'] ) : 0;
		$product_title = isset( $_POST['product_title'] ) ? sanitize_text_field( wp_unslash( $_POST['product_title'] ) ) : '';

		// Create inquiry data array
		$inquiry_data = array(
			'name'          => $name,
			'company'       => $company,
			'email'         => $email,
			'phone'         => $phone,
			'message'       => $message,
			'product_id'    => $product_id,
			'product_title' => $product_title,
			'date'          => current_time( 'mysql' ),
			'ip'            => self::get_client_ip(),
			'status'        => 'new',
		);

		// Save inquiry to database
		$saved = self::save_inquiry_to_db( $inquiry_data );

		if ( ! $saved ) {
			$response['message'] = __( 'Failed to save your inquiry. Please try again.', 'bjt-product-admin' );
			wp_send_json( $response );
		}

		// Send notification email to admin
		$email_sent = self::send_inquiry_notification( $inquiry_data );

		// Prepare successful response
		$response['success'] = true;
		$response['message'] = __( 'Your inquiry has been submitted successfully. We will contact you soon.', 'bjt-product-admin' );

		wp_send_json( $response );
	}

	/**
	 * Save inquiry to database.
	 *
	 * @param array $data Inquiry data.
	 * @return int|bool The inquiry ID on success, false on failure.
	 */
	private static function save_inquiry_to_db( $data ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'bjt_product_inquiries';

		// Check if table exists, if not create it
		if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table_name}'" ) !== $table_name ) {
			self::create_inquiries_table();
		}

		$result = $wpdb->insert(
			$table_name,
			$data,
			array(
				'%s', // name
				'%s', // company
				'%s', // email
				'%s', // phone
				'%s', // message
				'%d', // product_id
				'%s', // product_title
				'%s', // date
				'%s', // ip
				'%s', // status
			)
		);

		if ( false === $result ) {
			return false;
		}

		return $wpdb->insert_id;
	}

	/**
	 * Create the inquiries table if it doesn't exist.
	 */
	private static function create_inquiries_table() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'bjt_product_inquiries';

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE $table_name (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			name varchar(100) NOT NULL,
			company varchar(100) DEFAULT '',
			email varchar(100) NOT NULL,
			phone varchar(50) DEFAULT '',
			message text NOT NULL,
			product_id bigint(20) DEFAULT 0,
			product_title varchar(255) DEFAULT '',
			date datetime NOT NULL,
			ip varchar(45) DEFAULT '',
			status varchar(20) DEFAULT 'new',
			PRIMARY KEY  (id)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Send inquiry notification email to admin.
	 *
	 * @param array $data Inquiry data.
	 * @return bool Whether the email was sent successfully.
	 */
	private static function send_inquiry_notification( $data ) {
		$admin_email = get_option( 'admin_email' );
		$site_name   = get_option( 'blogname' );

		$subject = sprintf(
			/* translators: %s: site name */
			__( '[%s] New Product Inquiry', 'bjt-product-admin' ),
			$site_name
		);

		$message  = sprintf( __( 'You have received a new product inquiry from %s.', 'bjt-product-admin' ), $data['name'] ) . "\r\n\r\n";
		$message .= __( 'Inquiry Details:', 'bjt-product-admin' ) . "\r\n";
		$message .= '------------------------' . "\r\n";
		$message .= __( 'Name', 'bjt-product-admin' ) . ': ' . $data['name'] . "\r\n";

		if ( ! empty( $data['company'] ) ) {
			$message .= __( 'Company', 'bjt-product-admin' ) . ': ' . $data['company'] . "\r\n";
		}

		$message .= __( 'Email', 'bjt-product-admin' ) . ': ' . $data['email'] . "\r\n";

		if ( ! empty( $data['phone'] ) ) {
			$message .= __( 'Phone', 'bjt-product-admin' ) . ': ' . $data['phone'] . "\r\n";
		}

		$message .= __( 'Product', 'bjt-product-admin' ) . ': ' . $data['product_title'] . " (ID: {$data['product_id']})\r\n";
		$message .= __( 'Message', 'bjt-product-admin' ) . ': ' . "\r\n" . $data['message'] . "\r\n\r\n";
		$message .= __( 'This inquiry was submitted on', 'bjt-product-admin' ) . ' ' . $data['date'] . "\r\n";
		$message .= __( 'IP Address', 'bjt-product-admin' ) . ': ' . $data['ip'] . "\r\n\r\n";
		$message .= '------------------------' . "\r\n";
		$message .= sprintf(
			/* translators: %s: site name */
			__( 'This email was sent from your website "%s".', 'bjt-product-admin' ),
			$site_name
		) . "\r\n";

		$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

		// Set the reply-to address to the customer's email
		$headers[] = 'Reply-To: ' . $data['name'] . ' <' . $data['email'] . '>';

		return wp_mail( $admin_email, $subject, $message, $headers );
	}

	/**
	 * Get client IP address.
	 *
	 * @return string
	 */
	private static function get_client_ip() {
		$ip = '';

		if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) );
		} elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			// Check if multiple IPs, get the first one
			$ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
			$ip  = trim( $ips[0] );
		} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		}

		return $ip;
	}
}

// Initialize AJAX handlers.
BJT_Ajax::init(); 