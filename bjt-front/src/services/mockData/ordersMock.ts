// 订单模拟数据
export interface MockOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderNumber: string;
  orderDate: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  currency: string;
  items: MockOrderItem[];
  shipping: MockOrderShipping;
  billing: MockOrderBilling;
  payment: MockOrderPayment;
}

export interface MockOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'machine' | 'accessory' | 'consumable' | 'spare';
}

export interface MockOrderShipping {
  name: string;
  company: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  method: string;
  tracking?: string;
}

export interface MockOrderBilling {
  name: string;
  company: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
}

export interface MockOrderPayment {
  method: string;
  status: 'pending' | 'approved' | 'declined';
  transactionId?: string;
  date?: string;
}

export const mockOrders: MockOrder[] = [
  {
    id: 'ord-001',
    userId: 'usr-002',
    userName: '普通用户',
    userEmail: 'user@bjt-packaging.com',
    orderNumber: 'BJT-20240401-001',
    orderDate: '2024-04-01T10:30:00Z',
    status: 'completed',
    totalAmount: 12845,
    currency: 'CNY',
    items: [
      {
        id: 'item-001',
        productId: 'LP-V1',
        productName: '气垫机 V1型',
        productSku: 'BJT-LP-V1-2024',
        quantity: 1,
        unitPrice: 12800,
        totalPrice: 12800,
        type: 'machine'
      },
      {
        id: 'item-002',
        productId: 'ACC-FS-01',
        productName: '地面支架组件',
        productSku: 'BJT-FS-V2-2024',
        quantity: 1,
        unitPrice: 45,
        totalPrice: 45,
        type: 'accessory'
      }
    ],
    shipping: {
      name: '张三',
      company: '北京某某科技有限公司',
      address1: '北京市海淀区中关村南大街5号',
      city: '北京市',
      state: '北京',
      postcode: '100081',
      country: '中国',
      phone: '13812345678',
      method: '顺丰速运'
    },
    billing: {
      name: '李四',
      company: '北京某某科技有限公司',
      address1: '北京市海淀区中关村南大街5号',
      city: '北京市',
      state: '北京',
      postcode: '100081',
      country: '中国',
      phone: '13987654321',
      email: 'finance@example.com'
    },
    payment: {
      method: 'bank_transfer',
      status: 'approved',
      transactionId: 'tx-12345-abc',
      date: '2024-04-01T10:35:00Z'
    }
  },
  {
    id: 'ord-002',
    userId: 'usr-005',
    userName: 'European User',
    userEmail: 'eu-customer@bjt-packaging.com',
    orderNumber: 'BJT-20240402-001',
    orderDate: '2024-04-02T14:15:00Z',
    status: 'processing',
    totalAmount: 9245,
    currency: 'EUR',
    items: [
      {
        id: 'item-003',
        productId: 'LP-F1',
        productName: '气垫机 F1型',
        productSku: 'BJT-LP-F1-2024',
        quantity: 1,
        unitPrice: 9200,
        totalPrice: 9200,
        type: 'machine'
      },
      {
        id: 'item-004',
        productId: 'ACC-TS-01',
        productName: '桌面支架组件',
        productSku: 'BJT-TS-V1-2024',
        quantity: 1,
        unitPrice: 45,
        totalPrice: 45,
        type: 'accessory'
      }
    ],
    shipping: {
      name: 'Hans Mueller',
      company: 'German Packaging GmbH',
      address1: 'Hauptstrasse 123',
      city: 'Berlin',
      state: 'Berlin',
      postcode: '10115',
      country: 'Germany',
      phone: '+49 30 1234567',
      method: 'DHL Express',
      tracking: 'DHL-12345678'
    },
    billing: {
      name: 'Hans Mueller',
      company: 'German Packaging GmbH',
      address1: 'Hauptstrasse 123',
      city: 'Berlin',
      state: 'Berlin',
      postcode: '10115',
      country: 'Germany',
      phone: '+49 30 1234567',
      email: 'hans.mueller@example.de'
    },
    payment: {
      method: 'credit_card',
      status: 'approved',
      transactionId: 'cc-98765-xyz',
      date: '2024-04-02T14:20:00Z'
    }
  },
  {
    id: 'ord-003',
    userId: 'usr-006',
    userName: 'US Customer',
    userEmail: 'northamerica-customer@bjt-packaging.com',
    orderNumber: 'BJT-20240403-001',
    orderDate: '2024-04-03T09:45:00Z',
    status: 'pending',
    totalAmount: 5635,
    currency: 'USD',
    items: [
      {
        id: 'item-005',
        productId: 'TBY-003',
        productName: '水胶带机 - TBY系列',
        productSku: 'BJT-TBY-M1-2024',
        quantity: 1,
        unitPrice: 5600,
        totalPrice: 5600,
        type: 'machine'
      },
      {
        id: 'item-006',
        productId: 'ACC-TS-01',
        productName: '桌面支架组件',
        productSku: 'BJT-TS-V1-2024',
        quantity: 1,
        unitPrice: 35,
        totalPrice: 35,
        type: 'accessory'
      }
    ],
    shipping: {
      name: 'John Smith',
      company: 'US Packaging Solutions Inc.',
      address1: '123 Main St',
      address2: 'Suite 400',
      city: 'New York',
      state: 'NY',
      postcode: '10001',
      country: 'United States',
      phone: '+1 212 555 1234',
      method: 'UPS Express'
    },
    billing: {
      name: 'John Smith',
      company: 'US Packaging Solutions Inc.',
      address1: '123 Main St',
      address2: 'Suite 400',
      city: 'New York',
      state: 'NY',
      postcode: '10001',
      country: 'United States',
      phone: '+1 212 555 1234',
      email: 'john.smith@example.com'
    },
    payment: {
      method: 'purchase_order',
      status: 'pending',
      transactionId: 'po-234567'
    }
  }
]; 