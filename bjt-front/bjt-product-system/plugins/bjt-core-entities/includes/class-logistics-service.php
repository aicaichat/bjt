<?php
/**
 * BJT Logistics Service Class
 * 
 * Handles logistics tracking business logic including:
 * - External API integrations
 * - Tracking data processing
 * - Notification management
 * - Status synchronization
 */

class BJT_Logistics_Service {
    
    private $tracking_table;
    private $providers_table;
    private $events_table;
    private $settings_table;
    private $orders_table;
    
    public function __construct() {
        global $wpdb;
        $this->tracking_table = $wpdb->prefix . 'bjt_logistics_tracking';
        $this->providers_table = $wpdb->prefix . 'bjt_logistics_providers';
        $this->events_table = $wpdb->prefix . 'bjt_tracking_events';
        $this->settings_table = $wpdb->prefix . 'bjt_logistics_settings';
        $this->orders_table = $wpdb->prefix . 'bjt_orders';
    }
    
    /**
     * Auto-update tracking information from external APIs
     */
    public function auto_update_tracking() {
        global $wpdb;
        
        // Get tracking records that need updates
        $tracking_records = $wpdb->get_results("
            SELECT t.*, p.api_endpoint, p.api_key, p.provider_code
            FROM {$this->tracking_table} t
            LEFT JOIN {$this->providers_table} p ON t.provider_id = p.id
            WHERE t.status NOT IN ('delivered', 'cancelled', 'returned')
            AND t.last_update_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)
            AND p.api_endpoint IS NOT NULL
            ORDER BY t.last_update_time ASC
            LIMIT 50
        ");
        
        $updated_count = 0;
        $error_count = 0;
        
        foreach ($tracking_records as $record) {
            try {
                $tracking_data = $this->fetch_tracking_data($record);
                if ($tracking_data) {
                    $this->update_tracking_from_api($record, $tracking_data);
                    $updated_count++;
                }
            } catch (Exception $e) {
                error_log("Logistics API Error for {$record->tracking_number}: " . $e->getMessage());
                $error_count++;
            }
            
            // Rate limiting - sleep between requests
            usleep(200000); // 200ms delay
        }
        
        return array(
            'updated' => $updated_count,
            'errors' => $error_count,
            'processed' => count($tracking_records)
        );
    }
    
    /**
     * Fetch tracking data from external API
     */
    private function fetch_tracking_data($tracking_record) {
        $provider_code = $tracking_record->provider_code;
        $tracking_number = $tracking_record->tracking_number;
        
        switch ($provider_code) {
            case 'SF_EXPRESS':
                return $this->fetch_sf_express_data($tracking_number, $tracking_record->api_key);
            case 'FEDEX':
                return $this->fetch_fedex_data($tracking_number, $tracking_record->api_key);
            case 'DHL':
                return $this->fetch_dhl_data($tracking_number, $tracking_record->api_key);
            case 'UPS':
                return $this->fetch_ups_data($tracking_number, $tracking_record->api_key);
            default:
                return $this->fetch_generic_tracking_data($tracking_record);
        }
    }
    
    /**
     * SF Express API integration
     */
    private function fetch_sf_express_data($tracking_number, $api_key) {
        if (!$api_key) {
            return null;
        }
        
        $url = 'https://sfapi.sf-express.com/std/query';
        $timestamp = time();
        
        $data = array(
            'partnerID' => substr($api_key, 0, 10),
            'requestID' => uniqid(),
            'serviceCode' => 'EXP_RECE_SEARCH_ROUTES',
            'timestamp' => $timestamp,
            'msgData' => json_encode(array(
                'trackingNumber' => array($tracking_number),
                'trackingType' => '1'
            ))
        );
        
        // Generate signature (simplified - implement proper SF Express signature)
        $signature = md5(implode('', $data) . $api_key);
        $data['msgDigest'] = $signature;
        
        $response = wp_remote_post($url, array(
            'body' => $data,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/x-www-form-urlencoded'
            )
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('SF Express API request failed: ' . $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data || !isset($data['apiResultData'])) {
            throw new Exception('Invalid SF Express API response');
        }
        
        return $this->normalize_sf_express_data($data['apiResultData']);
    }
    
    /**
     * FedEx API integration
     */
    private function fetch_fedex_data($tracking_number, $api_key) {
        if (!$api_key) {
            return null;
        }
        
        $url = 'https://apis.fedex.com/track/v1/trackingnumbers';
        
        $data = array(
            'trackingInfo' => array(
                array(
                    'trackingNumberInfo' => array(
                        'trackingNumber' => $tracking_number
                    )
                )
            ),
            'includeDetailedScans' => true
        );
        
        $response = wp_remote_post($url, array(
            'body' => json_encode($data),
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-locale' => 'en_US',
                'Authorization' => 'Bearer ' . $api_key
            )
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('FedEx API request failed: ' . $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data || !isset($data['output'])) {
            throw new Exception('Invalid FedEx API response');
        }
        
        return $this->normalize_fedex_data($data['output']);
    }
    
    /**
     * DHL API integration
     */
    private function fetch_dhl_data($tracking_number, $api_key) {
        if (!$api_key) {
            return null;
        }
        
        $url = "https://api-eu.dhl.com/track/shipments?trackingNumber={$tracking_number}";
        
        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'headers' => array(
                'DHL-API-Key' => $api_key,
                'Accept' => 'application/json'
            )
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('DHL API request failed: ' . $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data || !isset($data['shipments'])) {
            throw new Exception('Invalid DHL API response');
        }
        
        return $this->normalize_dhl_data($data['shipments'][0]);
    }
    
    /**
     * UPS API integration
     */
    private function fetch_ups_data($tracking_number, $api_key) {
        if (!$api_key) {
            return null;
        }
        
        $url = "https://onlinetools.ups.com/api/track/v1/details/{$tracking_number}";
        
        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'headers' => array(
                'AccessLicenseNumber' => $api_key,
                'Accept' => 'application/json'
            )
        ));
        
        if (is_wp_error($response)) {
            throw new Exception('UPS API request failed: ' . $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data || !isset($data['trackResponse'])) {
            throw new Exception('Invalid UPS API response');
        }
        
        return $this->normalize_ups_data($data['trackResponse']);
    }
    
    /**
     * Generic tracking data fetcher (for providers without API)
     */
    private function fetch_generic_tracking_data($tracking_record) {
        // For providers without API, return null or implement web scraping
        return null;
    }
    
    /**
     * Normalize SF Express data to standard format
     */
    private function normalize_sf_express_data($api_data) {
        $routes = json_decode($api_data, true);
        if (!$routes || !isset($routes['routes'])) {
            return null;
        }
        
        $events = array();
        foreach ($routes['routes'] as $route) {
            $events[] = array(
                'event_time' => $route['acceptTime'],
                'event_description' => $route['remark'],
                'event_description_cn' => $route['remark'],
                'location_city' => $route['acceptAddress'],
                'event_type' => $this->map_sf_status_to_event_type($route['opCode']),
                'event_status' => $this->map_sf_status($route['opCode']),
            );
        }
        
        return array(
            'status' => $this->map_sf_status($routes['routes'][0]['opCode']),
            'events' => $events,
            'last_update' => $routes['routes'][0]['acceptTime']
        );
    }
    
    /**
     * Normalize FedEx data to standard format
     */
    private function normalize_fedex_data($api_data) {
        $tracking_info = $api_data['completeTrackResults'][0]['trackResults'][0];
        
        $events = array();
        if (isset($tracking_info['scanEvents'])) {
            foreach ($tracking_info['scanEvents'] as $event) {
                $events[] = array(
                    'event_time' => $event['date'],
                    'event_description' => $event['eventDescription'],
                    'location_city' => $event['scanLocation']['city'] ?? '',
                    'event_type' => $this->map_fedex_status_to_event_type($event['eventType']),
                    'event_status' => $this->map_fedex_status($event['eventType']),
                );
            }
        }
        
        return array(
            'status' => $this->map_fedex_status($tracking_info['latestStatusDetail']['code']),
            'events' => $events,
            'estimated_delivery' => $tracking_info['estimatedDeliveryTimeWindow']['window']['begins'] ?? null
        );
    }
    
    /**
     * Normalize DHL data to standard format
     */
    private function normalize_dhl_data($api_data) {
        $events = array();
        if (isset($api_data['events'])) {
            foreach ($api_data['events'] as $event) {
                $events[] = array(
                    'event_time' => $event['timestamp'],
                    'event_description' => $event['description'],
                    'location_city' => $event['location']['address']['addressLocality'] ?? '',
                    'event_type' => $this->map_dhl_status_to_event_type($event['statusCode']),
                    'event_status' => $this->map_dhl_status($event['statusCode']),
                );
            }
        }
        
        return array(
            'status' => $this->map_dhl_status($api_data['status']['statusCode']),
            'events' => $events,
            'estimated_delivery' => $api_data['estimatedTimeOfDelivery'] ?? null
        );
    }
    
    /**
     * Normalize UPS data to standard format
     */
    private function normalize_ups_data($api_data) {
        $package = $api_data['shipment'][0]['package'][0];
        
        $events = array();
        if (isset($package['activity'])) {
            foreach ($package['activity'] as $activity) {
                $events[] = array(
                    'event_time' => $activity['date'] . ' ' . $activity['time'],
                    'event_description' => $activity['status']['description'],
                    'location_city' => $activity['location']['address']['city'] ?? '',
                    'event_type' => $this->map_ups_status_to_event_type($activity['status']['code']),
                    'event_status' => $this->map_ups_status($activity['status']['code']),
                );
            }
        }
        
        return array(
            'status' => $this->map_ups_status($package['currentStatus']['code']),
            'events' => $events,
            'estimated_delivery' => $package['deliveryDate'][0]['date'] ?? null
        );
    }
    
    /**
     * Update tracking record from API data
     */
    private function update_tracking_from_api($tracking_record, $api_data) {
        global $wpdb;
        
        try {
            $wpdb->query('START TRANSACTION');
            
            // Update tracking record
            $update_data = array(
                'status' => $api_data['status'],
                'last_update_time' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            );
            
            if (isset($api_data['estimated_delivery'])) {
                $update_data['estimated_delivery_date'] = $api_data['estimated_delivery'];
            }
            
            if ($api_data['status'] === 'delivered') {
                $update_data['actual_delivery_date'] = current_time('mysql');
            }
            
            $wpdb->update($this->tracking_table, $update_data, array('id' => $tracking_record->id));
            
            // Update order status
            $order_status = $this->map_tracking_status_to_order_status($api_data['status']);
            $wpdb->update(
                $this->orders_table,
                array(
                    'logistics_status' => $api_data['status'],
                    'status' => $order_status,
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $tracking_record->order_id)
            );
            
            // Add new events
            if (isset($api_data['events'])) {
                foreach ($api_data['events'] as $event) {
                    // Check if event already exists
                    $existing_event = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM {$this->events_table} 
                         WHERE tracking_id = %d AND event_time = %s AND event_description = %s",
                        $tracking_record->id,
                        $event['event_time'],
                        $event['event_description']
                    ));
                    
                    if (!$existing_event) {
                        $event_data = array_merge($event, array(
                            'tracking_id' => $tracking_record->id,
                            'tracking_number' => $tracking_record->tracking_number,
                            'created_at' => current_time('mysql'),
                        ));
                        
                        $wpdb->insert($this->events_table, $event_data);
                    }
                }
            }
            
            $wpdb->query('COMMIT');
            
            // Send notifications if status changed
            if ($tracking_record->status !== $api_data['status']) {
                $this->send_tracking_notification($tracking_record, $api_data['status']);
            }
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            throw $e;
        }
    }
    
    /**
     * Send tracking notification
     */
    private function send_tracking_notification($tracking_record, $new_status) {
        $email_enabled = $this->get_setting('notification_email_enabled', true);
        if (!$email_enabled) {
            return;
        }
        
        global $wpdb;
        
        // Get order and user info
        $order = $wpdb->get_row($wpdb->prepare(
            "SELECT o.*, u.email, u.username 
             FROM {$this->orders_table} o
             LEFT JOIN {$wpdb->prefix}bjt_users u ON o.user_id = u.id
             WHERE o.id = %d",
            $tracking_record->order_id
        ));
        
        if (!$order || !$order->email) {
            return;
        }
        
        $subject = sprintf(
            '[BJT] Tracking Update: %s - %s',
            $tracking_record->tracking_number,
            $this->get_status_display_name($new_status)
        );
        
        $message = $this->build_tracking_notification_email($tracking_record, $order, $new_status);
        
        wp_mail($order->email, $subject, $message, array('Content-Type: text/html; charset=UTF-8'));
    }
    
    /**
     * Build tracking notification email
     */
    private function build_tracking_notification_email($tracking_record, $order, $new_status) {
        $tracking_url = str_replace('{tracking_number}', $tracking_record->tracking_number, $tracking_record->tracking_url);
        
        $message = "
        <html>
        <body>
            <h2>Tracking Update for Order #{$order->order_number}</h2>
            <p>Dear {$order->username},</p>
            <p>Your shipment status has been updated:</p>
            <ul>
                <li><strong>Tracking Number:</strong> {$tracking_record->tracking_number}</li>
                <li><strong>Status:</strong> {$this->get_status_display_name($new_status)}</li>
                <li><strong>Provider:</strong> {$tracking_record->provider_code}</li>
                <li><strong>Last Update:</strong> " . current_time('Y-m-d H:i:s') . "</li>
            </ul>
            <p><a href='{$tracking_url}' target='_blank'>Track your shipment</a></p>
            <p>Thank you for your business!</p>
        </body>
        </html>
        ";
        
        return $message;
    }
    
    /**
     * Get logistics setting
     */
    private function get_setting($key, $default = null) {
        global $wpdb;
        
        $value = $wpdb->get_var($wpdb->prepare(
            "SELECT setting_value FROM {$this->settings_table} WHERE setting_key = %s AND is_active = 1",
            $key
        ));
        
        if ($value === null) {
            return $default;
        }
        
        return $value === 'true' ? true : ($value === 'false' ? false : $value);
    }
    
    /**
     * Status mapping helpers
     */
    private function map_sf_status($sf_code) {
        $status_map = array(
            '01' => 'picked_up',
            '02' => 'in_transit',
            '03' => 'delivered',
            '04' => 'exception',
        );
        return $status_map[$sf_code] ?? 'in_transit';
    }
    
    private function map_fedex_status($fedex_code) {
        $status_map = array(
            'PU' => 'picked_up',
            'IT' => 'in_transit',
            'OD' => 'out_for_delivery',
            'DL' => 'delivered',
            'EX' => 'exception',
        );
        return $status_map[$fedex_code] ?? 'in_transit';
    }
    
    private function map_dhl_status($dhl_code) {
        $status_map = array(
            'transit' => 'in_transit',
            'delivered' => 'delivered',
            'exception' => 'exception',
        );
        return $status_map[$dhl_code] ?? 'in_transit';
    }
    
    private function map_ups_status($ups_code) {
        $status_map = array(
            'M' => 'picked_up',
            'I' => 'in_transit',
            'D' => 'delivered',
            'X' => 'exception',
        );
        return $status_map[$ups_code] ?? 'in_transit';
    }
    
    private function map_tracking_status_to_order_status($tracking_status) {
        $status_map = array(
            'pending' => 'processing',
            'picked_up' => 'shipped',
            'in_transit' => 'shipped',
            'out_for_delivery' => 'shipped',
            'delivered' => 'completed',
            'exception' => 'processing',
            'returned' => 'processing',
            'cancelled' => 'cancelled',
        );
        return $status_map[$tracking_status] ?? 'processing';
    }
    
    private function get_status_display_name($status) {
        $names = array(
            'pending' => 'Pending Pickup',
            'picked_up' => 'Picked Up',
            'in_transit' => 'In Transit',
            'out_for_delivery' => 'Out for Delivery',
            'delivered' => 'Delivered',
            'exception' => 'Exception',
            'returned' => 'Returned',
            'cancelled' => 'Cancelled',
        );
        return $names[$status] ?? 'Unknown';
    }
    
    private function map_sf_status_to_event_type($sf_code) {
        $type_map = array(
            '01' => 'pickup',
            '02' => 'transit',
            '03' => 'delivery',
            '04' => 'exception',
        );
        return $type_map[$sf_code] ?? 'info';
    }
    
    private function map_fedex_status_to_event_type($fedex_code) {
        $type_map = array(
            'PU' => 'pickup',
            'IT' => 'transit',
            'OD' => 'delivery',
            'DL' => 'delivery',
            'EX' => 'exception',
        );
        return $type_map[$fedex_code] ?? 'info';
    }
    
    private function map_dhl_status_to_event_type($dhl_code) {
        $type_map = array(
            'transit' => 'transit',
            'delivered' => 'delivery',
            'exception' => 'exception',
        );
        return $type_map[$dhl_code] ?? 'info';
    }
    
    private function map_ups_status_to_event_type($ups_code) {
        $type_map = array(
            'M' => 'pickup',
            'I' => 'transit',
            'D' => 'delivery',
            'X' => 'exception',
        );
        return $type_map[$ups_code] ?? 'info';
    }
} 