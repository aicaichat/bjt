import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Products.css';
import { productApi, cartApi, Product, CartItem } from '../../services/api';
import { mockProductApi, mockCartApi } from '../../services/mockApi';
import { safeToLocaleString } from '../../utils/priceUtils';

// 临时占位图片路径
const placeholderImage = 'https://via.placeholder.com/100x100?text=Product';

// 使用环境变量或配置决定是否使用模拟API
const USE_MOCK_API = true; // 设置为true强制使用模拟API进行开发

// 根据配置选择使用真实API还是模拟API
const apiService = {
  product: USE_MOCK_API ? mockProductApi : productApi,
  cart: USE_MOCK_API ? mockCartApi : cartApi
};

// 更新CartItem类型，添加规格信息
interface CartItemSpec {
  model?: string;
  partNumber?: string;
  productName?: string;
  voltage?: string;
  frequency?: string;
  palletSize?: string;
  palletQty?: string;
}

// 修改购物车项类型
interface EnhancedCartItem extends CartItem {
  specs: CartItemSpec;
  type: 'machine' | 'accessory';
  image?: string;
}

// 模拟数据
const mockProducts = [
  {
    id: 'LP-V1',
    name: '气垫机 LP-V1',
    image: 'https://via.placeholder.com/250x180?text=LP-V1',
    description: '全自动气垫制造机，适用于电商包装、物流中转等场景',
    features: [
      '产能：120m³/小时',
      '气垫规格：200 × 100mm',
      '功率：1.5kW',
      '尺寸：980 × 450 × 520mm'
    ],
    price: 21800,
    partnerPrice: 19800,
    stock: {
      status: 'in-stock',
      text: '现货',
      days: 0
    }
  },
  {
    id: 'LP-F1',
    name: '气垫机 LP-F1 Plus',
    image: 'https://via.placeholder.com/250x180?text=LP-F1',
    description: '高性能气垫机，双系统设计，适用于大型物流中心',
    features: [
      '产能：180m³/小时',
      '气垫规格：250 × 150mm',
      '功率：2.2kW',
      '尺寸：1100 × 520 × 650mm'
    ],
    price: 32500,
    partnerPrice: 29800,
    stock: {
      status: 'low-stock',
      text: '低库存',
      days: 3
    }
  },
  {
    id: 'MEX-10-20',
    name: '包装机 MEX-10-20',
    image: 'https://via.placeholder.com/250x180?text=MEX-10-20',
    description: '多功能包装机，支持气垫、填充纸和泡沫包装材料',
    features: [
      '产能：90包/小时',
      '包装尺寸：最大400 × 300mm',
      '功率：3.0kW',
      '尺寸：1250 × 750 × 1100mm'
    ],
    price: 45000,
    partnerPrice: 42000,
    stock: {
      status: 'pre-order',
      text: '预订',
      days: 15
    }
  },
  {
    id: 'MEX-15-30',
    name: '包装机 MEX-15-30',
    image: 'https://via.placeholder.com/250x180?text=MEX-15-30',
    description: '高端自动化包装生产线，适用于大型电商仓储中心',
    features: [
      '产能：150包/小时',
      '包装尺寸：最大600 × 400mm',
      '功率：4.5kW',
      '尺寸：1800 × 900 × 1400mm'
    ],
    price: 68000,
    partnerPrice: 63500,
    stock: {
      status: 'out-stock',
      text: '缺货',
      days: 30
    }
  }
];

// 筛选选项
const filterOptions = {
  type: ['全部类型', '气垫机', '包装机', '封箱机', '缠绕机'],
  capacity: ['全部产能', '小型 (<100m³/h)', '中型 (100-150m³/h)', '大型 (>150m³/h)'],
  price: ['全部价格', '2万以下', '2-5万', '5-10万', '10万以上']
};

const Products: React.FC = () => {
  // 状态定义
  const [products, setProducts] = useState<typeof mockProducts>([]);
  const [selectedType, setSelectedType] = useState<string>('全部类型');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('全部产能');
  const [selectedPrice, setSelectedPrice] = useState<string>('全部价格');
  const [selectedSort, setSelectedSort] = useState<string>('默认排序');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('customer');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVoltage, setSelectedVoltage] = useState<string>('220');
  const [cartItems, setCartItems] = useState<EnhancedCartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 加载产品数据
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiService.product.getProducts();
        
        // Use mockProducts for now to avoid type mismatches
        setProducts(mockProducts);
        
        // 初始化数量状态和选中第一个产品
        const quantitiesInit: {[key: string]: number} = {};
        mockProducts.forEach(product => {
          quantitiesInit[product.id] = 1;
        });
        setQuantities(quantitiesInit);
        
        if (mockProducts.length > 0) {
          setSelectedProduct(mockProducts[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('无法加载产品数据，请稍后再试');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 加载购物车数据
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartData = await apiService.cart.getCart();
        // Transform cart data to match EnhancedCartItem
        const enhancedItems: EnhancedCartItem[] = cartData.map(item => ({
          ...item,
          specs: item.specs || {} as CartItemSpec,
          type: (item.type as 'machine' | 'accessory') || 'machine',
          image: item.image || placeholderImage
        }));
        setCartItems(enhancedItems);
      } catch (err) {
        console.error('Error fetching cart:', err);
        // 如果API不可用，使用空购物车
        setCartItems([]);
      }
    };

    fetchCart();
  }, []);

  useEffect(() => {
    // Update total pages when products or itemsPerPage changes
    setTotalPages(Math.ceil(products.length / itemsPerPage));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [products, itemsPerPage, selectedType, selectedCapacity, selectedPrice]);

  // 更新数量
  const handleQuantityChange = (productId: string, value: string) => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 1) return;
    
    setQuantities(prev => ({
      ...prev,
      [productId]: newValue
    }));
  };

  // 添加产品到购物车，包含规格信息
  const addToCart = async (productId: string, basePrice: number) => {
    try {
      const quantity = quantities[productId] || 1;
      
      // Find the product to add
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Call the mockApi addToCart method with the correct parameters
      await apiService.cart.addToCart(
        productId, 
        quantity, 
        selectedVoltage, 
        {
          productName: product.name,
          // Other specs can be added as needed
        }, 
        'machine'
      );
      
      // Reload the cart after adding
      const cartData = await apiService.cart.getCart();
      
      // Transform to EnhancedCartItem[]
      const enhancedItems = cartData.map((item: CartItem) => ({
        ...item,
        specs: item.specs || {} as CartItemSpec,
        type: (item.type as 'machine' | 'accessory') || 'machine',
        image: item.image || placeholderImage
      }));
      
      setCartItems(enhancedItems);
      
      // Show notification
      alert(`已添加 ${quantity} 件 ${product.name} 到购物车`);
      
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('添加到购物车失败，请稍后再试');
    }
  };

  // 从购物车移除物品
  const removeFromCart = async (itemId: string) => {
    try {
      await apiService.cart.removeFromCart(itemId);
      
      // 更新本地购物车状态
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error removing from cart:', err);
      alert('从购物车移除商品失败，请稍后再试');
    }
  };

  // 清空购物车
  const clearCart = async () => {
    try {
      await apiService.cart.clearCart();
      setCartItems([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Error clearing cart:', err);
      alert('清空购物车失败，请稍后再试');
    }
  };

  // 切换显示购物车模态框
  const toggleCartModal = () => {
    setShowCartModal(prev => !prev);
  };

  // 计算购物车总金额
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      // 确保 price 和 quantity 是数字
      const price = typeof item.price === 'number' ? item.price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + (price * quantity);
    }, 0);
  };

  // 计算购物车中的物品总数
  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // 处理筛选变更
  const handleFilterChange = (type: string, value: string) => {
    if (type === 'type') setSelectedType(value);
    else if (type === 'capacity') setSelectedCapacity(value);
    else if (type === 'price') setSelectedPrice(value);
    
    // 在实际应用中，这里会根据筛选条件从API获取数据
    // 在当前模拟环境中，我们保持原始数据
  };

  // 处理排序变更
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sortBy = event.target.value;
    setSelectedSort(sortBy);
    
    // 应用排序
    const sortedProducts = [...products];
    if (sortBy === '价格从低到高') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === '价格从高到低') {
      sortedProducts.sort((a, b) => b.price - a.price);
    }
    // 默认排序则保持原始顺序
    
    setProducts(sortedProducts);
  };

  // 处理复选框变更
  const handleCheckboxChange = (productId: string) => {
    if (selectedItems.includes(productId)) {
      // 如果已选中，则移除
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      // 如果未选中，则添加
      setSelectedItems([...selectedItems, productId]);
    }
  };

  // 计算当前价格
  const getPrice = (product: typeof mockProducts[0]) => {
    if (userRole === 'partner') {
      return product.partnerPrice;
    }
    return product.price;
  };

  // 处理用户角色切换（仅用于演示）
  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRole(event.target.value);
  };

  // 处理切换标签页
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // 可以在这里添加根据标签筛选产品的逻辑
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of product list
    const productList = document.querySelector('.product-list');
    if (productList) {
      productList.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get current products for displayed page
  const getCurrentPageProducts = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return products.slice(indexOfFirstItem, indexOfLastItem);
  };

  // 加载中状态显示
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载产品数据...</p>
      </div>
    );
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="error-container">
        <h2>出错了</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <>
      {/* 面包屑导航 */}
      <div className="container mx-auto px-4 py-2">
        <div className="breadcrumb">
          <Link to="/">首页</Link> &gt; <span>产品选购</span>
        </div>
      </div>

      {/* 页面内容 */}
      <div className="products-page">
        {/* 角色切换（仅用于演示） */}
        <div className="role-switcher">
          <select value={userRole} onChange={handleRoleChange}>
            <option value="customer">客户</option>
            <option value="partner">合作伙伴</option>
            <option value="admin">管理员</option>
          </select>
        </div>

        {/* 主要内容区域 */}
        <div className="container">
          {/* 订单表单标题 */}
          <div className="order-title">
            <h1>BJT 包装设备选型</h1>
            <p>选择最适合您业务需求的包装解决方案</p>
          </div>
          
          {/* 筛选区域 */}
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>设备类型:</label>
                <div className="filter-options">
                  {filterOptions.type.map(type => (
                    <label key={type} className="filter-option">
                      <input 
                        type="radio" 
                        name="type"
                        checked={selectedType === type}
                        onChange={() => handleFilterChange('type', type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>产能需求:</label>
                <div className="filter-options">
                  {filterOptions.capacity.map(capacity => (
                    <label key={capacity} className="filter-option">
                      <input 
                        type="radio" 
                        name="capacity"
                        checked={selectedCapacity === capacity}
                        onChange={() => handleFilterChange('capacity', capacity)}
                      />
                      {capacity}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>价格区间:</label>
                <div className="filter-options">
                  {filterOptions.price.map(price => (
                    <label key={price} className="filter-option">
                      <input 
                        type="radio" 
                        name="price"
                        checked={selectedPrice === price}
                        onChange={() => handleFilterChange('price', price)}
                      />
                      {price}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 排序和选择区域 */}
          <div className="sort-select-bar">
            <div className="sorting">
              <select onChange={handleSortChange} value={selectedSort}>
                <option value="默认排序">默认排序</option>
                <option value="价格从低到高">价格从低到高</option>
                <option value="价格从高到低">价格从高到低</option>
              </select>
            </div>
            
            <div className="selected-info">
              已选择 {selectedItems.length} 台设备
              {selectedItems.length > 0 && (
                <button className="compare-btn">对比所选</button>
              )}
            </div>
          </div>
          
          {/* 产品列表 */}
          <div className="product-list">
            {getCurrentPageProducts().map(product => (
              <div key={product.id} className="product-item">
                <div className="item-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(product.id)}
                    onChange={() => handleCheckboxChange(product.id)}
                  />
                </div>
                
                <div className="item-image">
                  <img src={product.image} alt={product.name} />
                </div>
                
                <div className="item-details">
                  <div className="item-model">
                    {product.name}
                    <span className={`stock-badge ${product.stock.status}`}>
                      {product.stock.text}
                      {product.stock.days > 0 && ` (${product.stock.days}天)`}
                    </span>
                  </div>
                  
                  <div className="item-description">
                    {product.description}
                  </div>
                  
                  <div className="item-features">
                    {product.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        ✓ {feature}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="item-pricing">
                  <div className="price-wrapper">
                    <div className="current-price">¥{safeToLocaleString(getPrice(product))}</div>
                    {userRole === 'partner' && (
                      <div className="original-price">¥{safeToLocaleString(product.price)}</div>
                    )}
                  </div>
                  
                  <Link to={`/products/${product.id}`} className="view-detail-btn">
                    查看详情
                  </Link>
                  
                  <button className="add-to-quote-btn">
                    加入询价单
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-button"
              >
                上一页
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                下一页
              </button>
              
              <div className="items-per-page">
                <span>每页显示:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="items-per-page-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* 购物车浮动图标 */}
        <div className="cart-floating" onClick={toggleCartModal}>
          <span>🛒</span>
          <div className="cart-count" id="cartCount">{cartItemCount}</div>
        </div>
        
        {/* 购物车弹窗 */}
        {showCartModal && (
          <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
              <span className="modal-close" onClick={toggleCartModal}>×</span>
              <h3>购物车</h3>
              
              {cartItems.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                  购物车为空
                </div>
              ) : (
                <>
                  {/* 机器类别标题 */}
                  {cartItems.some(item => item.type === 'machine') && (
                    <div className="cart-type-heading">主机</div>
                  )}
                  
                  {/* 机器类别商品 */}
                  <div className="cart-items">
                    {cartItems
                      .filter(item => item.type === 'machine')
                      .map((item, index) => (
                        <div key={`machine-${index}`} className="cart-item">
                          <img 
                            src={item.image || placeholderImage} 
                            alt={item.name} 
                            className="cart-item-image"
                          />
                          <div className="cart-item-info">
                            <div className="cart-item-title">{item.name}</div>
                            <div className="cart-item-specs">
                              {item.specs.partNumber && (
                                <span className="cart-item-spec">料号: {item.specs.partNumber}</span>
                              )}
                              {item.specs.voltage && item.specs.voltage !== 'N/A' && (
                                <span className="cart-item-spec">电压: {item.specs.voltage}</span>
                              )}
                              {item.specs.frequency && item.specs.frequency !== 'N/A' && (
                                <span className="cart-item-spec">频率: {item.specs.frequency}</span>
                              )}
                            </div>
                            <div className="cart-item-price">¥{safeToLocaleString(item.price, 'en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} × {item.quantity}</div>
                          </div>
                          <div className="cart-item-actions">
                            <div className="cart-item-subtotal">
                              ¥{safeToLocaleString(item.price * item.quantity, 'en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                            <button 
                              className="cart-btn-delete"
                              onClick={() => removeFromCart(item.id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* 配件类别标题 */}
                  {cartItems.some(item => item.type === 'accessory') && (
                    <div className="cart-type-heading">配件</div>
                  )}
                  
                  {/* 配件类别商品 */}
                  <div className="cart-items">
                    {cartItems
                      .filter(item => item.type === 'accessory')
                      .map((item, index) => (
                        <div key={`accessory-${index}`} className="cart-item">
                          <img 
                            src={item.image || placeholderImage} 
                            alt={item.name} 
                            className="cart-item-image"
                          />
                          <div className="cart-item-info">
                            <div className="cart-item-title">{item.name}</div>
                            <div className="cart-item-specs">
                              {item.specs.model && (
                                <span className="cart-item-spec">型号: {item.specs.model}</span>
                              )}
                              {item.specs.partNumber && (
                                <span className="cart-item-spec">料号: {item.specs.partNumber}</span>
                              )}
                              {item.specs.voltage && item.specs.voltage !== 'N/A' && (
                                <span className="cart-item-spec">电压: {item.specs.voltage}</span>
                              )}
                            </div>
                            <div className="cart-item-price">¥{safeToLocaleString(item.price, 'en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} × {item.quantity}</div>
                          </div>
                          <div className="cart-item-actions">
                            <div className="cart-item-subtotal">
                              ¥{safeToLocaleString(item.price * item.quantity, 'en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                            <button 
                              className="cart-btn-delete"
                              onClick={() => removeFromCart(item.id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  <div className="cart-summary">
                    <div className="cart-total">
                      <div className="cart-total-label">总计:</div>
                      <div className="cart-total-amount">¥{safeToLocaleString(calculateTotal(), 'en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="cart-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={cartItems.length === 0}
                >
                  <span>
                    清空购物车
                  </span>
                </button>
                <button 
                  className="cart-checkout-btn"
                  disabled={cartItems.length === 0}
                  onClick={() => alert('前往结算页面')}
                >
                  <span>结算</span>
                </button>
              </div>
              
              {/* 清空购物车确认面板 */}
              {showClearConfirm && (
                <div className="cart-confirm">
                  <div className="cart-confirm-icon">
                    🗑️
                  </div>
                  <div className="cart-confirm-title">确认清空购物车</div>
                  <div className="cart-confirm-text">
                    清空购物车后，所有商品将被移除且无法恢复。确定要继续吗？
                  </div>
                  <div className="cart-confirm-buttons">
                    <button 
                      className="cart-confirm-button cart-confirm-cancel"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      取消
                    </button>
                    <button 
                      className="cart-confirm-button cart-confirm-proceed"
                      onClick={clearCart}
                    >
                      确认清空
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 使用模拟数据提示 */}
      {USE_MOCK_API && (
        <div style={{
          position: 'fixed', 
          bottom: '10px', 
          left: '10px', 
          background: '#ffeeba', 
          padding: '5px 10px', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404',
          zIndex: 900
        }}>
          使用模拟数据进行开发
        </div>
      )}
    </>
  );
};

export default Products; 