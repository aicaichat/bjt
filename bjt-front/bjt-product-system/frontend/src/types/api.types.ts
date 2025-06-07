// BJT产品管理系统API类型定义

// ===== 通用类型 =====
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PricingData {
  base_price: number;
  discount_rate: number;
  currency: string;
  region?: string;
  user_type?: string;
}

export interface InventoryData {
  region: string;
  warehouse: string;
  quantity: number;
  reserved: number;
  available: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// ===== 用户认证相关 =====
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_in: number;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SALES' | 'CUSTOMER' | 'PARTNER';
  region: string;
  vipLevel?: number;
  type?: string;
  permissions?: string[];
}

// ===== 产品线相关 =====
export interface ProductLine {
  id: number;
  code: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  subitem1_zh?: string;
  subitem1_en?: string;
  subitem2_zh?: string;
  subitem2_en?: string;
  subitem3_zh?: string;
  subitem3_en?: string;
  image_url: string;
  status: 'publish' | 'draft' | 'trash';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ===== 主机相关 =====
export interface MachineProduct {
  id: number;
  code: string;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  product_line_id: number;
  type: string;
  image_url: string;
  image2_url?: string;
  explosion_diagram_pdf?: string;
  status: 'publish' | 'draft' | 'trash';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MachineListData {
  items: MachineProduct[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface MachineQueryParams {
  product_line_id?: number;
  page?: number;
  per_page?: number;
  region?: string;
  lang?: string;
  voltage?: string;
  type?: string;
  search?: string;
}

// ===== 配件相关 =====
export interface Accessory {
  id: number;
  product_line_id: number;
  model: string;
  brand: string;
  part_number: string;
  name: string;
  spec: string;
  spec_imperial: string;
  voltage?: string;
  frequency?: string;
  image_url: string;
  status: 'publish' | 'draft' | 'trash';
  unit: string;
  created_at: string;
  updated_at: string;
  pricing?: PricingData[];
  inventory?: InventoryData[];
  model_info?: {
    title: string;
    description: string;
    type: string;
    image1_url?: string;
    image2_url?: string;
    diagram_pdf?: string;
  };
}

export interface AccessoryListData {
  items: Accessory[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AccessoryQueryParams {
  product_line_id?: number;
  page?: number;
  per_page?: number;
  lang?: string;
  region?: string;
  model?: string;
  type?: string;
}

export interface AccessoryLevel {
  level: number;
  parentId: string;
  accessories: Accessory[];
}

// ===== 耗材相关 =====
export interface Consumable {
  id: number;
  product_line_id: number;
  code: string;
  name: string;
  brand: string;
  specs: {
    material: string;
    shape: string;
    thickness: {
      metric: string;
      imperial: string;
    };
    width: {
      metric: string;
      imperial: string;
    };
    length: {
      metric: string;
      imperial: string;
    };
    compatibility: string[];
  };
  package_type: string;
  image_url: string;
  status: 'publish' | 'draft' | 'trash';
}

export interface ConsumableListData {
  items: Consumable[];
  total: number;
  total_pages: number;
  current_page: number;
}

export interface ConsumableQueryParams {
  product_line_id?: number;
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  model?: string;
  shape?: string;
  material?: string;
  thickness?: number;
  width?: number;
  length?: number;
}

// ===== 备件相关 =====
export interface SparePart {
  id: number;
  product_line_id: number;
  part_number: string;
  name: string;
  app_model: string;
  is_consumable: number; // 1=易损，2=非易损，3=隐藏
  image_url: string;
  spec: string;
  spec_imperial: string;
  app_sn: string;
  status: 'publish' | 'draft' | 'trash';
  created_at: string;
  updated_at: string;
}

export interface SparePartListData {
  items: SparePart[];
  total: number;
  total_pages: number;
  current_page: number;
}

export interface SparePartQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  product_line_id?: number;
  app_model?: string;
  is_consumable?: number | null;
}

// ===== 购物车相关 =====
export interface CartItem {
  item_id: number;
  product_type: 'machine' | 'accessory' | 'consumable' | 'spare_part';
  product_id: number;
  part_number: string;
  quantity: number;
  name: string;
  image_url: string;
  unit_price: number;
  currency: string;
  line_total: number;
  inventory_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  added_at: string;
}

export interface CartData {
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  cart_total: number;
  currency: string;
}

export interface AddToCartRequest {
  product_type: string;
  part_number: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ===== 订单相关 =====
export interface OrderItem {
  order_item_id: number;
  product_type: string;
  product_id: number;
  part_number: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Address {
  name: string;
  phone: string;
  email?: string;
  address: string;
  postal_code?: string;
  country?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  cart_region: string;
  cart_lang: string;
  notes?: string;
}

export interface OrderQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  user_id?: number;
  order?: 'asc' | 'desc';
  orderby?: string;
}

// ===== 数据字典相关 =====
export interface DictionaryItem {
  code: string;
  name: string;
  id: number;
  product_line_id: number;
  image_url?: string;
  image_url2?: string;
  sort_order: number;
}

export interface DictionaryResponse {
  success: boolean;
  data: {
    type: string;
    items: DictionaryItem[];
  };
}

// ===== 价格和库存相关 =====
export interface BatchPricingRequest {
  items: Array<{
    item_type: string;
    item_id: string;
    quantity: number;
  }>;
  region: string;
}

export interface BatchPricingResponse {
  region: string;
  quantity: number;
  items: Array<{
    id: number;
    part_number: string;
    model: string;
    found: boolean;
    price: number | null;
    currency: string | null;
    discount_rate: number | null;
    final_price: number | null;
  }>;
}

export interface BatchInventoryRequest {
  items: Array<{
    item_type: string;
    item_id: string;
  }>;
  region?: string;
  warehouse?: string;
}

export interface BatchInventoryResponse {
  items: Array<{
    id: number;
    part_number: string;
    model: string;
    found: boolean;
    total_quantity: number;
    total_available: number;
    inventory: InventoryData[];
  }>;
}

// ===== 统一产品接口 =====
export interface UnifiedProduct {
  id: string;
  type: 'machine' | 'accessory' | 'consumable' | 'spare_part';
  partNumber: string;
  name_zh: string;
  name_en: string;
  image_url: string;
  specifications: Record<string, any>;
  pricing: PricingData[];
  inventory: InventoryData[];
  compatibility: string[];
}

// ===== 筛选器相关 =====
export interface ProductFilters {
  voltage?: string;
  type?: string;
  model?: string;
  material?: string;
  shape?: string;
  thickness?: number;
  width?: number;
  length?: number;
  is_consumable?: number | null; // 1=易损，2=非易损，3=隐藏，null=全部
  search?: string;
}

// ===== 错误处理相关 =====
export interface ApiError {
  success: false;
  message: string;
  code: number;
  status?: number;
}

// ===== 支付相关 =====
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'paypal' | 'credit_card' | 'bank_transfer' | 'gateway';
  region: string;
  icon_url?: string;
  enabled: boolean;
}

export interface PaymentRequest {
  order_id: number;
  payment_method: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  payment_url?: string;
  status: 'pending' | 'completed' | 'failed';
} 