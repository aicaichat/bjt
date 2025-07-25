// BJT Logistics Tracking System Types

export interface LogisticsProvider {
  id: number;
  provider_code: string;
  provider_name: string;
  provider_name_cn?: string;
  provider_name_en?: string;
  country: string;
  api_endpoint?: string;
  tracking_url_template?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  supported_services: string[];
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: number;
  tracking_id: number;
  tracking_number: string;
  event_time: string;
  event_code?: string;
  event_status: string;
  event_description: string;
  event_description_cn?: string;
  event_description_en?: string;
  location_country?: string;
  location_city?: string;
  location_address?: string;
  location_code?: string;
  event_type: 'pickup' | 'transit' | 'delivery' | 'exception' | 'return' | 'customs' | 'info';
  is_milestone: boolean;
  operator_name?: string;
  next_location?: string;
  created_at: string;
}

export interface ShipmentItem {
  id: number;
  tracking_id: number;
  order_item_id: number;
  part_number: string;
  product_name: string;
  quantity_shipped: number;
  quantity_delivered: number;
  unit_value: number;
  currency: string;
  hs_code?: string;
  description?: string;
  weight_kg?: number;
  dimensions_cm?: string;
  created_at: string;
}

export interface LogisticsTracking {
  id: number;
  tracking_number: string;
  order_id: number;
  order_number: string;
  provider_id: number;
  provider_code: string;
  provider_name?: string;
  provider_name_cn?: string;
  shipping_method?: string;
  service_type?: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled';
  origin_country?: string;
  origin_city?: string;
  origin_address?: string;
  destination_country?: string;
  destination_city?: string;
  destination_address?: string;
  recipient_name?: string;
  recipient_phone?: string;
  weight_kg?: number;
  dimensions_cm?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  last_update_time?: string;
  tracking_url?: string;
  cost_amount?: number;
  cost_currency?: string;
  notes?: string;
  events?: TrackingEvent[];
  items?: ShipmentItem[];
  created_at: string;
  updated_at: string;
}

export interface TrackingListResponse {
  success: boolean;
  data: {
    items: LogisticsTracking[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface TrackingDetailResponse {
  success: boolean;
  data: LogisticsTracking;
}

export interface LogisticsStats {
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  provider_distribution: Array<{
    provider_name: string;
    count: number;
  }>;
  delivery_performance: {
    total_shipments: number;
    delivered_count: number;
    avg_delivery_days: number;
  };
  date_range: {
    from: string;
    to: string;
  };
}

export interface LogisticsStatsResponse {
  success: boolean;
  data: LogisticsStats;
}

export interface CreateTrackingRequest {
  order_id: number;
  tracking_number: string;
  provider_code: string;
  shipping_method?: string;
  estimated_delivery_date?: string;
}

export interface UpdateTrackingStatusRequest {
  status: string;
  event_description?: string;
  location?: string;
}

export interface TrackingFilter {
  search?: string;
  status?: string;
  provider?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface LogisticsSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'text';
  category: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LogisticsSettingsResponse {
  success: boolean;
  data: LogisticsSetting[];
}

// Order integration types
export interface OrderWithTracking {
  id: number;
  order_number: string;
  status: string;
  tracking_number?: string;
  logistics_provider_id?: number;
  shipping_method?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  logistics_status?: string;
  logistics_notes?: string;
  tracking_info?: LogisticsTracking;
}

// Status display helpers
export const TRACKING_STATUS_COLORS = {
  pending: '#faad14',
  picked_up: '#1890ff',
  in_transit: '#52c41a',
  out_for_delivery: '#722ed1',
  delivered: '#52c41a',
  exception: '#f5222d',
  returned: '#fa8c16',
  cancelled: '#8c8c8c',
} as const;

export const TRACKING_STATUS_LABELS = {
  pending: 'Pending Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  exception: 'Exception',
  returned: 'Returned',
  cancelled: 'Cancelled',
} as const;

export const TRACKING_STATUS_LABELS_CN = {
  pending: '等待揽收',
  picked_up: '已揽收',
  in_transit: '运输中',
  out_for_delivery: '派送中',
  delivered: '已签收',
  exception: '异常',
  returned: '已退回',
  cancelled: '已取消',
} as const;

export const EVENT_TYPE_ICONS = {
  pickup: 'truck',
  transit: 'swap',
  delivery: 'home',
  exception: 'warning',
  return: 'rollback',
  customs: 'safety-certificate',
  info: 'info-circle',
} as const;

export type TrackingStatus = keyof typeof TRACKING_STATUS_LABELS;
export type EventType = keyof typeof EVENT_TYPE_ICONS; 