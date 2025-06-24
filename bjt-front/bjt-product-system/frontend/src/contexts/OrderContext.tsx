import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  UnifiedOrderData, 
  OrderListItem, 
  OrderFilters,
  PageTransferData 
} from '../types/orderTypes';
import OrderDataConverter from '../utils/orderDataConverter';
import orderService from '../services/orderService';
import { OrderNumberManager } from '../utils/orderNumberUtils';

// 状态类型定义
interface OrderState {
  // 当前订单数据
  currentOrder: UnifiedOrderData | null;
  
  // 订单列表
  orderList: OrderListItem[];
  orderListLoading: boolean;
  orderListError: string | null;
  orderListFilters: OrderFilters;
  orderListPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  
  // 页面间数据传递
  pageTransferData: PageTransferData | null;
  
  // 操作状态
  isSubmitting: boolean;
  lastError: string | null;
  lastSuccess: string | null;
}

// 动作类型
type OrderAction =
  | { type: 'SET_CURRENT_ORDER'; payload: UnifiedOrderData }
  | { type: 'CLEAR_CURRENT_ORDER' }
  | { type: 'SET_ORDER_LIST_LOADING'; payload: boolean }
  | { type: 'SET_ORDER_LIST'; payload: { items: OrderListItem[]; total: number; totalPages: number } }
  | { type: 'SET_ORDER_LIST_ERROR'; payload: string }
  | { type: 'SET_ORDER_LIST_FILTERS'; payload: OrderFilters }
  | { type: 'SET_PAGE_TRANSFER_DATA'; payload: PageTransferData }
  | { type: 'CLEAR_PAGE_TRANSFER_DATA' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUCCESS'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: string } };

// 初始状态
const initialState: OrderState = {
  currentOrder: null,
  orderList: [],
  orderListLoading: false,
  orderListError: null,
  orderListFilters: {
    page: 1,
    pageSize: 20
  },
  orderListPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  },
  pageTransferData: null,
  isSubmitting: false,
  lastError: null,
  lastSuccess: null
};

// Reducer
function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_CURRENT_ORDER':
      return {
        ...state,
        currentOrder: action.payload,
        lastError: null
      };
      
    case 'CLEAR_CURRENT_ORDER':
      return {
        ...state,
        currentOrder: null
      };
      
    case 'SET_ORDER_LIST_LOADING':
      return {
        ...state,
        orderListLoading: action.payload
      };
      
    case 'SET_ORDER_LIST':
      return {
        ...state,
        orderList: action.payload.items,
        orderListPagination: {
          currentPage: state.orderListFilters.page || 1,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.total
        },
        orderListLoading: false,
        orderListError: null
      };
      
    case 'SET_ORDER_LIST_ERROR':
      return {
        ...state,
        orderListError: action.payload,
        orderListLoading: false
      };
      
    case 'SET_ORDER_LIST_FILTERS':
      return {
        ...state,
        orderListFilters: { ...state.orderListFilters, ...action.payload }
      };
      
    case 'SET_PAGE_TRANSFER_DATA':
      return {
        ...state,
        pageTransferData: action.payload
      };
      
    case 'CLEAR_PAGE_TRANSFER_DATA':
      return {
        ...state,
        pageTransferData: null
      };
      
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        lastError: action.payload,
        isSubmitting: false
      };
      
    case 'SET_SUCCESS':
      return {
        ...state,
        lastSuccess: action.payload,
        lastError: null,
        isSubmitting: false
      };
      
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        lastError: null,
        lastSuccess: null
      };
      
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orderList: state.orderList.map(order =>
          order.orderId === action.payload.orderId
            ? { ...order, status: action.payload.status as any }
            : order
        ),
        currentOrder: state.currentOrder?.orderId === action.payload.orderId
          ? { ...state.currentOrder, status: action.payload.status as any }
          : state.currentOrder
      };
      
    default:
      return state;
  }
}

// Context类型
interface OrderContextType {
  state: OrderState;
  
  // 订单操作
  setCurrentOrder: (order: UnifiedOrderData) => void;
  clearCurrentOrder: () => void;
  submitOrder: (orderData: any) => Promise<UnifiedOrderData>;
  
  // 订单列表操作
  loadOrderList: (filters?: OrderFilters) => Promise<void>;
  setOrderListFilters: (filters: OrderFilters) => void;
  refreshOrderList: () => Promise<void>;
  
  // 页面间数据传递
  setPageTransferData: (data: PageTransferData) => void;
  getPageTransferData: () => PageTransferData | null;
  clearPageTransferData: () => void;
  
  // 工具方法
  getOrderById: (orderId: string) => Promise<UnifiedOrderData | null>;
  updateOrderStatus: (orderId: string, status: string) => void;
  clearMessages: () => void;
}

// 创建Context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider组件
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  
  // 设置当前订单
  const setCurrentOrder = useCallback((order: UnifiedOrderData) => {
    console.log('🔧 [OrderContext] 设置当前订单:', order);
    dispatch({ type: 'SET_CURRENT_ORDER', payload: order });
  }, []);
  
  // 清除当前订单
  const clearCurrentOrder = useCallback(() => {
    console.log('🔧 [OrderContext] 清除当前订单');
    dispatch({ type: 'CLEAR_CURRENT_ORDER' });
  }, []);
  
  // 提交订单
  const submitOrder = useCallback(async (orderData: any): Promise<UnifiedOrderData> => {
    console.log('🔧 [OrderContext] 开始提交订单:', orderData);
    
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'CLEAR_MESSAGES' });
    
    try {
      console.log('🔧 [OrderContext] 调用真实API提交订单');
      
      // 调用订单服务
      const result = await orderService.submitOrder(orderData);
      console.log('🔧 [OrderContext] API响应:', result);
      
      // 使用OrderNumberManager处理API响应
      const orderInfo = OrderNumberManager.extractFromApiResponse(result);
      
      // 创建统一订单数据
      const unifiedOrder: UnifiedOrderData = {
        id: orderInfo.orderId,
        orderId: orderInfo.orderId,
        orderNumber: orderInfo.orderNumber,
        status: 'pending_payment' as any,
        createdAt: new Date().toISOString(),
        customerInfo: orderData.customerInfo || {
          companyName: '',
          contactName: '',
          address: '',
          phone: '',
          email: ''
        },
        items: orderData.items || [],
        summary: orderData.summary || {
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          currency: 'CNY'
        }
      };
      
      // 设置为当前订单
      dispatch({ type: 'SET_CURRENT_ORDER', payload: unifiedOrder });
      dispatch({ type: 'SET_SUCCESS', payload: '订单提交成功' });
      
      console.log('✅ [OrderContext] 订单提交成功:', unifiedOrder);
      return unifiedOrder;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '订单提交失败';
      console.error('❌ [OrderContext] 订单提交失败:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, []);
  
  // 加载订单列表
  const loadOrderList = useCallback(async (filters?: OrderFilters) => {
    console.log('🔧 [OrderContext] 加载订单列表:', filters);
    
    if (filters) {
      dispatch({ type: 'SET_ORDER_LIST_FILTERS', payload: filters });
    }
    
    dispatch({ type: 'SET_ORDER_LIST_LOADING', payload: true });
    
    try {
      const currentFilters = filters || state.orderListFilters;
      const result = await orderService.getOrders(currentFilters);
      
      // 转换为订单列表项
      const orderListItems = result.data.items.map((item: any) => 
        OrderDataConverter.toOrderListItem(item)
      );
      
      dispatch({ 
        type: 'SET_ORDER_LIST', 
        payload: {
          items: orderListItems,
          total: result.data.totalItems,
          totalPages: result.data.totalPages
        }
      });
      
      console.log('✅ [OrderContext] 订单列表加载成功:', orderListItems);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载订单列表失败';
      console.error('❌ [OrderContext] 加载订单列表失败:', error);
      dispatch({ type: 'SET_ORDER_LIST_ERROR', payload: errorMessage });
    }
  }, [state.orderListFilters]);
  
  // 设置订单列表筛选条件
  const setOrderListFilters = useCallback((filters: OrderFilters) => {
    console.log('🔧 [OrderContext] 设置筛选条件:', filters);
    dispatch({ type: 'SET_ORDER_LIST_FILTERS', payload: filters });
  }, []);
  
  // 刷新订单列表
  const refreshOrderList = useCallback(async () => {
    console.log('🔧 [OrderContext] 刷新订单列表');
    await loadOrderList(state.orderListFilters);
  }, [loadOrderList, state.orderListFilters]);
  
  // 设置页面传递数据
  const setPageTransferData = useCallback((data: PageTransferData) => {
    console.log('🔧 [OrderContext] 设置页面传递数据:', data);
    dispatch({ type: 'SET_PAGE_TRANSFER_DATA', payload: data });
  }, []);
  
  // 获取页面传递数据
  const getPageTransferData = useCallback((): PageTransferData | null => {
    return state.pageTransferData;
  }, [state.pageTransferData]);
  
  // 清除页面传递数据
  const clearPageTransferData = useCallback(() => {
    console.log('🔧 [OrderContext] 清除页面传递数据');
    dispatch({ type: 'CLEAR_PAGE_TRANSFER_DATA' });
  }, []);
  
  // 根据ID获取订单
  const getOrderById = useCallback(async (orderId: string): Promise<UnifiedOrderData | null> => {
    console.log('🔧 [OrderContext] 根据ID获取订单:', orderId);
    
    // 首先检查当前订单
    if (state.currentOrder?.orderId === orderId) {
      return state.currentOrder;
    }
    
    // 检查订单列表
    const listItem = state.orderList.find(item => item.orderId === orderId);
    if (listItem) {
      // 从列表项转换为完整订单数据（这里可能需要调用API获取详细信息）
      console.log('📋 [OrderContext] 从列表中找到订单，需要获取详细信息');
      // TODO: 调用API获取完整订单详情
    }
    
    // 如果都没找到，返回null
    console.warn('⚠️ [OrderContext] 未找到指定订单:', orderId);
    return null;
  }, [state.currentOrder, state.orderList]);
  
  // 更新订单状态
  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    console.log('🔧 [OrderContext] 更新订单状态:', { orderId, status });
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  }, []);
  
  // 清除消息
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);
  
  // 自动清除页面传递数据（5分钟后）
  useEffect(() => {
    if (state.pageTransferData) {
      const timer = setTimeout(() => {
        console.log('🔧 [OrderContext] 自动清除过期的页面传递数据');
        clearPageTransferData();
      }, 5 * 60 * 1000); // 5分钟
      
      return () => clearTimeout(timer);
    }
  }, [state.pageTransferData, clearPageTransferData]);
  
  const contextValue: OrderContextType = {
    state,
    setCurrentOrder,
    clearCurrentOrder,
    submitOrder,
    loadOrderList,
    setOrderListFilters,
    refreshOrderList,
    setPageTransferData,
    getPageTransferData,
    clearPageTransferData,
    getOrderById,
    updateOrderStatus,
    clearMessages
  };
  
  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

// Hook
export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext; 