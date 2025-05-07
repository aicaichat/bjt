/**
 * OrderList page translations
 * Contains translations for the order list page in both Chinese and English
 */

export const orderListTranslations = {
  // Page title and general elements
  'orderList.title': {
    'zh-CN': '我的订单',
    'en-US': 'My Orders'
  },
  'orderList.loading': {
    'zh-CN': '加载订单中...',
    'en-US': 'Loading orders...'
  },
  'orderList.noOrdersFound': {
    'zh-CN': '未找到订单',
    'en-US': 'No Orders Found'
  },
  'orderList.tryAdjustFilters': {
    'zh-CN': '尝试调整筛选条件或清除搜索',
    'en-US': 'Try adjusting your filters or clear search'
  },
  'orderList.orderCreatedSuccess': {
    'zh-CN': '订单创建成功',
    'en-US': 'Order created successfully'
  },
  'orderList.parseError': {
    'zh-CN': '解析本地存储订单数据时出错:',
    'en-US': 'Error parsing order data from local storage:'
  },
  'orderList.fetchError': {
    'zh-CN': '获取订单数据时出错:',
    'en-US': 'Error fetching order data:'
  },
  'orderList.fetchErrorMessage': {
    'zh-CN': '无法加载订单，请稍后再试',
    'en-US': 'Could not load orders, please try again later'
  },
  
  // Tab filters
  'orderList.tabs.all': {
    'zh-CN': '全部',
    'en-US': 'All'
  },
  'orderList.tabs.pending': {
    'zh-CN': '待付款',
    'en-US': 'Pending'
  },
  'orderList.tabs.paid': {
    'zh-CN': '已付款',
    'en-US': 'Paid'
  },
  'orderList.tabs.shipped': {
    'zh-CN': '已发货',
    'en-US': 'Shipped'
  },
  'orderList.tabs.completed': {
    'zh-CN': '已完成',
    'en-US': 'Completed'
  },
  'orderList.tabs.cancelled': {
    'zh-CN': '已取消',
    'en-US': 'Cancelled'
  },
  
  // Order status
  'orderList.status.pending': {
    'zh-CN': '待付款',
    'en-US': 'Pending Payment'
  },
  'orderList.status.paid': {
    'zh-CN': '已付款',
    'en-US': 'Paid'
  },
  'orderList.status.shipped': {
    'zh-CN': '已发货',
    'en-US': 'Shipped'
  },
  'orderList.status.completed': {
    'zh-CN': '已完成',
    'en-US': 'Completed'
  },
  'orderList.status.cancelled': {
    'zh-CN': '已取消',
    'en-US': 'Cancelled'
  },
  
  // Search and filters
  'orderList.search': {
    'zh-CN': '搜索',
    'en-US': 'Search'
  },
  'orderList.searchPlaceholder': {
    'zh-CN': '订单号或商品名称',
    'en-US': 'Order number or product name'
  },
  'orderList.dateRange': {
    'zh-CN': '日期范围',
    'en-US': 'Date Range'
  },
  'orderList.to': {
    'zh-CN': '至',
    'en-US': 'to'
  },
  
  // Order card labels
  'orderList.orderNumber': {
    'zh-CN': '订单号',
    'en-US': 'Order Number'
  },
  'orderList.orderDate': {
    'zh-CN': '下单日期',
    'en-US': 'Order Date'
  },
  'orderList.totalAmount': {
    'zh-CN': '订单金额',
    'en-US': 'Total Amount'
  },
  'orderList.paymentMethod': {
    'zh-CN': '支付方式',
    'en-US': 'Payment Method'
  },
  'orderList.shippingInfo': {
    'zh-CN': '收货信息',
    'en-US': 'Shipping Information'
  },
  'orderList.viewItems': {
    'zh-CN': '查看商品',
    'en-US': 'View Items'
  },
  
  // Payment methods
  'orderList.paymentMethod.bankTransfer': {
    'zh-CN': '银行转账',
    'en-US': 'Bank Transfer'
  },
  'orderList.paymentMethod.alipay': {
    'zh-CN': '支付宝',
    'en-US': 'Alipay'
  },
  'orderList.paymentMethod.wechat': {
    'zh-CN': '微信支付',
    'en-US': 'WeChat Pay'
  },
  'orderList.paymentMethod.creditCard': {
    'zh-CN': '信用卡',
    'en-US': 'Credit Card'
  },
  'orderList.paymentMethod.pending': {
    'zh-CN': '待选择',
    'en-US': 'To be selected'
  },
  
  // Button actions
  'orderList.cancelOrder': {
    'zh-CN': '取消订单',
    'en-US': 'Cancel Order'
  },
  'orderList.goToPay': {
    'zh-CN': '去支付',
    'en-US': 'Proceed to Payment'
  },
  'orderList.exportPO': {
    'zh-CN': '导出PO单',
    'en-US': 'Export PO'
  },
  'orderList.viewDetails': {
    'zh-CN': '查看详情',
    'en-US': 'View Details'
  },
  
  // Notifications and confirmations
  'orderList.confirmCancel': {
    'zh-CN': '确定要取消订单 {orderId} 吗？',
    'en-US': 'Are you sure you want to cancel order {orderId}?'
  },
  'orderList.cancelSuccess': {
    'zh-CN': '订单 {orderId} 已成功取消',
    'en-US': 'Order {orderId} has been cancelled successfully'
  },
  'orderList.exportingPO': {
    'zh-CN': '正在导出订单 {orderId} 的PO单...',
    'en-US': 'Exporting PO for order {orderId}...'
  }
}; 