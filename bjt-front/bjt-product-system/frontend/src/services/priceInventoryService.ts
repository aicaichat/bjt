import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { APIResponse } from '../types/common';

export interface ProductPriceRequest {
  product_id: string;
  product_type: 'machine' | 'spare-part' | 'consumable' | 'accessory';
  quantity?: number;
}

export interface ProductInventoryRequest {
  product_id: string;
  product_type: 'machine' | 'spare-part' | 'consumable' | 'accessory';
}

export interface ProductAvailabilityRequest {
  product_requests: ProductPriceRequest[];
  region?: string;
}

export interface PriceData {
  base_price: number;
  tier1_price: number;
  tier2_price: number;
  vip_price: number;
  currency: string;
  currency_code: string;
  discount_applied: boolean;
  sale_ends_at?: string;
}

export interface InventoryRegionData {
  region: string;
  amount: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface InventoryData {
  regions: InventoryRegionData[];
  estimated_restock_date: string | null;
}

export interface ProductAvailabilityData {
  product_id: string;
  type: string;
  price: PriceData;
  inventory: {
    amount: number;
    status: string;
    availability: string;
    can_fulfill_quantity: boolean;
  };
}

export interface PriceResponse {
  timestamp: string;
  prices: Array<{
    product_id: string;
    type: string;
    base_price: number;
    tier1_price: number;
    tier2_price: number;
    vip_price: number;
    currency: string;
    currency_code: string;
    discount_applied: boolean;
    sale_ends_at: string | null;
  }>;
}

export interface InventoryResponse {
  timestamp: string;
  inventory: Array<{
    product_id: string;
    type: string;
    regions: InventoryRegionData[];
    estimated_restock_date: string | null;
  }>;
}

export interface ProductAvailabilityResponse {
  timestamp: string;
  products: ProductAvailabilityData[];
}

// Socket events
export interface PriceChangedEvent {
  event: 'price_changed';
  timestamp: string;
  product: {
    product_id: string;
    type: string;
    previous_price: Partial<PriceData>;
    new_price: Partial<PriceData>;
    currency_code: string;
  };
}

export interface InventoryChangedEvent {
  event: 'inventory_changed';
  timestamp: string;
  product: {
    product_id: string;
    type: string;
    region: string;
    previous_amount: number;
    new_amount: number;
    status: string;
  };
}

export type WebSocketEvent = PriceChangedEvent | InventoryChangedEvent;

class PriceInventoryService {
  private baseUrl = API_BASE_URL;
  private priceSocket: WebSocket | null = null;
  private inventorySocket: WebSocket | null = null;
  private priceListeners: ((event: PriceChangedEvent) => void)[] = [];
  private inventoryListeners: ((event: InventoryChangedEvent) => void)[] = [];

  // 创建axios实例
  private api = axios.create({
    baseURL: this.baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  constructor() {
    // 设置请求拦截器
    this.api.interceptors.request.use(
      config => {
        // 在发送请求前添加token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取产品实时价格
   */
  async getProductPrices(productIds: string[], productType: string, region?: string, quantity?: number): Promise<APIResponse<PriceResponse>> {
    try {
      const params = new URLSearchParams();
      params.append('product_ids', productIds.join(','));
      params.append('product_type', productType);
      if (region) params.append('region', region);
      if (quantity) params.append('quantity', quantity.toString());

      const response = await this.api.get(`/prices?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product prices:', error);
      throw error;
    }
  }

  /**
   * 获取产品实时库存
   */
  async getProductInventory(productIds: string[], productType: string, region?: string): Promise<APIResponse<InventoryResponse>> {
    try {
      const params = new URLSearchParams();
      params.append('product_ids', productIds.join(','));
      params.append('product_type', productType);
      if (region) params.append('region', region);

      const response = await this.api.get(`/inventory?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product inventory:', error);
      throw error;
    }
  }

  /**
   * 批量获取产品价格和库存
   */
  async getProductAvailability(request: ProductAvailabilityRequest): Promise<APIResponse<ProductAvailabilityResponse>> {
    try {
      const response = await this.api.post(`/products/availability`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product availability:', error);
      throw error;
    }
  }

  /**
   * 连接到价格WebSocket
   */
  connectToPriceSocket(token: string): void {
    if (this.priceSocket) {
      this.disconnectPriceSocket();
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.baseUrl}/ws/prices?token=${token}`;
    this.priceSocket = new WebSocket(wsUrl);

    this.priceSocket.onopen = () => {
      console.log('Price WebSocket connection established');
    };

    this.priceSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketEvent;
        if (data.event === 'price_changed') {
          this.priceListeners.forEach(listener => listener(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    };

    this.priceSocket.onerror = (error) => {
      console.error('Price WebSocket error:', error);
    };

    this.priceSocket.onclose = () => {
      console.log('Price WebSocket connection closed');
    };
  }

  /**
   * 连接到库存WebSocket
   */
  connectToInventorySocket(token: string): void {
    if (this.inventorySocket) {
      this.disconnectInventorySocket();
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.baseUrl}/ws/inventory?token=${token}`;
    this.inventorySocket = new WebSocket(wsUrl);

    this.inventorySocket.onopen = () => {
      console.log('Inventory WebSocket connection established');
    };

    this.inventorySocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketEvent;
        if (data.event === 'inventory_changed') {
          this.inventoryListeners.forEach(listener => listener(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    };

    this.inventorySocket.onerror = (error) => {
      console.error('Inventory WebSocket error:', error);
    };

    this.inventorySocket.onclose = () => {
      console.log('Inventory WebSocket connection closed');
    };
  }

  /**
   * 订阅价格变更
   */
  subscribeToPriceChanges(productIds: string[], productTypes: string[]): void {
    if (!this.priceSocket || this.priceSocket.readyState !== WebSocket.OPEN) {
      console.error('Price WebSocket not connected');
      return;
    }

    const message = {
      action: 'subscribe',
      product_ids: productIds,
      product_types: productTypes
    };

    this.priceSocket.send(JSON.stringify(message));
  }

  /**
   * 订阅库存变更
   */
  subscribeToInventoryChanges(productIds: string[], productTypes: string[], regions: string[]): void {
    if (!this.inventorySocket || this.inventorySocket.readyState !== WebSocket.OPEN) {
      console.error('Inventory WebSocket not connected');
      return;
    }

    const message = {
      action: 'subscribe',
      product_ids: productIds,
      product_types: productTypes,
      regions: regions
    };

    this.inventorySocket.send(JSON.stringify(message));
  }

  /**
   * 添加价格变更监听器
   */
  addPriceChangeListener(listener: (event: PriceChangedEvent) => void): void {
    this.priceListeners.push(listener);
  }

  /**
   * 添加库存变更监听器
   */
  addInventoryChangeListener(listener: (event: InventoryChangedEvent) => void): void {
    this.inventoryListeners.push(listener);
  }

  /**
   * 移除价格变更监听器
   */
  removePriceChangeListener(listener: (event: PriceChangedEvent) => void): void {
    this.priceListeners = this.priceListeners.filter(l => l !== listener);
  }

  /**
   * 移除库存变更监听器
   */
  removeInventoryChangeListener(listener: (event: InventoryChangedEvent) => void): void {
    this.inventoryListeners = this.inventoryListeners.filter(l => l !== listener);
  }

  /**
   * 断开价格WebSocket连接
   */
  disconnectPriceSocket(): void {
    if (this.priceSocket) {
      this.priceSocket.close();
      this.priceSocket = null;
    }
  }

  /**
   * 断开库存WebSocket连接
   */
  disconnectInventorySocket(): void {
    if (this.inventorySocket) {
      this.inventorySocket.close();
      this.inventorySocket = null;
    }
  }

  /**
   * 断开所有WebSocket连接
   */
  disconnectAll(): void {
    this.disconnectPriceSocket();
    this.disconnectInventorySocket();
  }
}

export const priceInventoryService = new PriceInventoryService();
export default priceInventoryService; 