import { ASSETS } from '../config/appConfig';

/**
 * Order mock data for testing and development
 * This centralizes all mock data related to orders
 */

// Define types
export interface OrderItemMock {
  id: string;
  model: string;
  type: 'machine' | 'accessory' | 'consumable' | 'spare';
  image: string;
  sku: string;
  name: string;
  properties: Record<string, string>;
  detailInfo: {
    title: string;
    sections: Array<{
      title?: string;
      properties: Array<{
        label: string;
        value: string;
      }>;
    }>;
  };
  price: number;
  quantity: number;
}

export interface ShippingInfoMock {
  contactName: string;
  phone: string;
  email: string;
  company: string;
  country: string;
  address: string;
  notes: string;
}

// Mock order items data
export const mockOrderItems: OrderItemMock[] = [
  {
    id: '1',
    model: 'LA-E5P',
    type: 'machine',
    image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ELA-E5P%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
    sku: 'BJT-LA-E5P-2023',
    name: '全自动高速包装机',
    properties: {
      '料号': 'BJT-LA-E5P-2023',
      '产品名称': '全自动高速包装机',
      '托盘尺寸': '120 × 80 × 80 cm',
      '一托数量': '1台'
    },
    detailInfo: {
      title: 'LA-E5P 详细信息',
      sections: [{
        properties: [
          { label: '包装尺寸', value: '120 × 80 × 80 cm' },
          { label: '包装毛重', value: '130 kg' },
          { label: '打托后总高度', value: '90 cm' }
        ]
      }]
    },
    price: 7500,
    quantity: 2
  },
  {
    id: '2',
    model: 'EC2007 控制板',
    type: 'accessory',
    image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3EEC2007%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
    sku: 'BJT-EC2007-2023',
    name: '高级控制面板',
    properties: {
      '型号': 'EC2007',
      '料号': 'BJT-EC2007-2023',
      '产品名称': '高级控制面板',
      '电压': '220V/110V',
      '频率': '50Hz/60Hz',
      '托盘尺寸': '80 × 60 × 20 cm',
      '一托数量': '100个'
    },
    detailInfo: {
      title: 'EC2007 控制板详细信息',
      sections: [{
        properties: [
          { label: '包装尺寸', value: '20 × 15 × 5 cm' },
          { label: '包装毛重', value: '0.3 kg' },
          { label: '打托后总高度', value: '60 cm' }
        ]
      }]
    },
    price: 2400,
    quantity: 1
  },
  {
    id: '3',
    model: '填充气泡膜-SS',
    type: 'consumable',
    image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ESS%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E',
    sku: 'BJT-SS-2023',
    name: '填充气泡膜',
    properties: {
      '适配机型': 'ALL',
      '料号': 'BJT-SS-2023',
      '规格': '300mm×200m',
      '材质': 'HDPE'
    },
    detailInfo: {
      title: '填充气泡膜-SS 详细信息',
      sections: [
        {
          properties: [
            { label: '包装材质', value: 'HDPE高密度聚乙烯' }
          ]
        },
        {
          title: '公制规格',
          properties: [
            { label: '厚度', value: '0.05mm' },
            { label: '克重', value: '45g/m²' },
            { label: '膜宽', value: '300mm' },
            { label: '袋长', value: '200m' }
          ]
        },
        {
          title: '英制规格',
          properties: [
            { label: '厚度', value: '2 mil' },
            { label: '克重', value: '1.3 oz/yd²' },
            { label: '膜宽', value: '11.8 inch' },
            { label: '袋长', value: '656 ft' }
          ]
        }
      ]
    },
    price: 2800,
    quantity: 1
  }
];

// Default shipping info
export const defaultShippingInfo: ShippingInfoMock = {
  contactName: 'Eric',
  phone: '+86 13057101000',
  email: 'eric@bingjiatech.com',
  company: 'Hangzhou Bingjia Tech. Co., Ltd.',
  country: 'CN',
  address: '1818-2, Wenyixi Road, Hangzhou, Zhejiang Province, China',
  notes: ''
};

/**
 * 模拟购物车项
 * Mock cart items with i18n support
 */
export const mockCartItems = [
  {
    id: 'cart-item-1',
    nameKey: 'products.machine.lpv1.name', // i18n key for name 
    name: {
      'zh-CN': 'LP-V1 包装机',
      'en-US': 'LP-V1 Packaging Machine',
    },
    price: 2500,
    quantity: 2,
    specs: {
      model: 'LP-V1',
      partNumber: 'BJT-LP-V1-2023',
      voltage: '220V',
    },
    type: 'machine',
    image: `${ASSETS.BASE_URL}/images/products/machines/lp-v1.png`
  },
  {
    id: 'cart-item-2',
    nameKey: 'products.consumable.bubblefilm.name', // i18n key for name
    name: {
      'zh-CN': '气垫膜 标准型',
      'en-US': 'Bubble Film Standard Type',
    },
    price: 120,
    quantity: 5,
    specs: {
      model: 'Standard',
      partNumber: 'BJT-BM-STD-300',
      size: '300mm x 100m',
    },
    type: 'consumable',
    image: `${ASSETS.BASE_URL}/images/products/consumables/bubblefilm-std.png`
  }
];

/**
 * 模拟用户默认收货信息
 * Mock user's default shipping info with i18n support
 */
export const i18nShippingInfo = {
  name: 'John Doe',
  address: '123 Main St',
  city: {
    'zh-CN': '上海',
    'en-US': 'Shanghai',
  },
  state: {
    'zh-CN': '上海',
    'en-US': 'Shanghai',
  },
  postalCode: '200000',
  country: {
    'zh-CN': '中国',
    'en-US': 'China',
  },
  phone: '+86 123 4567 8901',
  email: 'john.doe@example.com'
};

/**
 * 模拟订单ID生成器
 * Mock order ID generator
 */
export const generateMockOrderId = (): string => {
  return `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

/**
 * 订单相关的错误消息
 * Error messages for order-related operations
 */
export const orderErrorMessages = {
  FETCH_CART_ITEMS_ERROR: {
    'zh-CN': '获取购物车商品失败',
    'en-US': 'Error fetching cart items',
  },
  SUBMIT_ORDER_ERROR: {
    'zh-CN': '提交订单失败',
    'en-US': 'Error submitting order',
  },
  SHIPPING_INFO_ERROR: {
    'zh-CN': '获取收货信息失败',
    'en-US': 'Error fetching shipping information',
  }
}; 