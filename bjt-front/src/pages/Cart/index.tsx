import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Cart.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

// 临时占位图片
const placeholderImage = 'https://via.placeholder.com/120x100';

// 开发阶段使用模拟数据
const USE_MOCK_DATA = true;

// 定义数据类型
interface CartItem {
  id: number;
  model: string;
  type: 'machine' | 'accessory' | 'consumable' | 'spare';
  typeLabel: string;
  image_url: string;
  sku: string;
  price: number;
  originalPrice?: number;
  priceRanges: PriceRange[];
  properties: Record<string, string>;
  quantity: number;
  checked: boolean;
  tooltipInfo?: TooltipInfo;
}

interface PriceRange {
  min: number;
  max: number | null; // null 表示无上限 (">min")
  price: number;
}

interface TooltipInfo {
  title: string;
  sections: TooltipSection[];
}

interface TooltipSection {
  title?: string;
  properties: Record<string, string>;
}

// 模拟购物车数据
const mockCartItems: CartItem[] = [
  {
    id: 1,
    model: 'LA-E5P',
    type: 'machine',
    typeLabel: '主机',
    image_url: `${placeholderImage}?text=LA-E5P`,
    sku: 'BJT-LA-E5P-2023',
    price: 3600,
    originalPrice: 4000,
    priceRanges: [
      { min: 1, max: 5, price: 3600 },
      { min: 6, max: 20, price: 3400 },
      { min: 21, max: null, price: 3200 }
    ],
    properties: {
      '料号': 'BJT-LA-E5P-2023',
      '电压': '220V',
      '产品名称': '全自动高速包装机',
      '托盘尺寸': '120 × 80 × 80 cm',
      '一托数量': '1台'
    },
    quantity: 2,
    checked: true,
    tooltipInfo: {
      title: 'LA-E5P 详细信息',
      sections: [
        {
          properties: {
            '包装尺寸': '120 × 80 × 80 cm',
            '包装毛重': '130 kg',
            '打托后总高度': '90 cm'
          }
        }
      ]
    }
  },
  {
    id: 2,
    model: 'EC2007 控制板',
    type: 'accessory',
    typeLabel: '配件',
    image_url: `${placeholderImage}?text=EC2007`,
    sku: 'BJT-EC2007-2023',
    price: 420,
    originalPrice: 450,
    priceRanges: [
      { min: 1, max: 10, price: 420 },
      { min: 11, max: 100, price: 380 }
    ],
    properties: {
      '型号': 'EC2007',
      '料号': 'BJT-EC2007-2023',
      '产品名称': '高级控制面板',
      '电压': '220V/110V',
      '频率': '50Hz/60Hz',
      '兼容型号': 'LA-E5P, LA-E4S',
      '托盘尺寸': '80 × 60 × 20 cm',
      '一托数量': '100个'
    },
    quantity: 1,
    checked: false,
    tooltipInfo: {
      title: 'EC2007 控制板详细信息',
      sections: [
        {
          properties: {
            '包装尺寸': '20 × 15 × 5 cm',
            '包装毛重': '0.3 kg',
            '打托后总高度': '60 cm'
          }
        }
      ]
    }
  },
  {
    id: 3,
    model: '填充气泡膜-SS',
    type: 'consumable',
    typeLabel: '耗材',
    image_url: `${placeholderImage}?text=SS`,
    sku: 'BJT-SS-2023',
    price: 150,
    originalPrice: 180,
    priceRanges: [
      { min: 1, max: 10, price: 150 },
      { min: 11, max: 50, price: 130 },
      { min: 51, max: null, price: 110 }
    ],
    properties: {
      '适配机型': 'ALL',
      '料号': 'BJT-SS-2023',
      '规格': '300mm×200m',
      '材质': 'HDPE'
    },
    quantity: 1,
    checked: true,
    tooltipInfo: {
      title: '填充气泡膜-SS 详细信息',
      sections: [
        {
          properties: {
            '包装材质': 'HDPE高密度聚乙烯'
          }
        },
        {
          title: '公制规格',
          properties: {
            '厚度': '0.05mm',
            '克重': '45g/m²',
            '膜宽': '300mm',
            '袋长': '200m'
          }
        },
        {
          title: '英制规格',
          properties: {
            '厚度': '2 mil',
            '克重': '1.3 oz/yd²',
            '膜宽': '11.8 inch',
            '袋长': '656 ft'
          }
        }
      ]
    }
  },
  {
    id: 4,
    model: '压力滚轮 PR-001',
    type: 'accessory',
    typeLabel: '备件',
    image_url: `${placeholderImage}?text=PR-001`,
    sku: 'BJT-PR-33-2023',
    price: 150,
    originalPrice: 170,
    priceRanges: [
      { min: 1, max: 10, price: 150 },
      { min: 11, max: 100, price: 140 },
      { min: 101, max: null, price: 130 }
    ],
    properties: {
      '适配机型': 'LP-V1, LP-F1',
      '料号': 'BJT-PR-33-2023',
      '名称': '包装机压力滚轮',
      '适配序列号': '20001-30000',
      '包装尺寸': '30 × 10 × 10 cm',
      '包装毛重': '0.8 kg'
    },
    quantity: 2,
    checked: true
  }
];

const CartPage: React.FC = () => {
  const { user } = useAuth();
  // 使用购物车上下文
  const { 
    cartItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    toggleItemCheck, 
    toggleAllCheck 
  } = useCart();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 计算选中的商品数量
  const selectedCount = cartItems.reduce((count, item) => 
    item.checked ? count + item.quantity : count, 0);
  
  // 检查是否全部选中
  const isAllSelected = cartItems.length > 0 && cartItems.every(item => item.checked);

  // 处理全选
  const handleSelectAll = () => {
    toggleAllCheck(!isAllSelected);
  };

  // 处理单个商品选择
  const handleItemSelect = (id: number) => {
    toggleItemCheck(id);
  };

  // 减少数量
  const handleDecrease = (id: number) => {
    const item = cartItems.find(item => item.id === id);
    if (item && item.quantity > 1) {
      updateQuantity(id, item.quantity - 1);
    }
  };

  // 增加数量
  const handleIncrease = (id: number) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      updateQuantity(id, item.quantity + 1);
    }
  };

  // 处理数量输入变化
  const handleQuantityChange = (id: number, value: string) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity >= 1) {
      updateQuantity(id, quantity);
    }
  };

  // 删除商品
  const handleDelete = (id: number) => {
    if (window.confirm('确定要删除此商品吗？')) {
      removeFromCart(id);
    }
  };

  // 提交订单
  const handleSubmitOrder = () => {
    const selectedItems = cartItems.filter(item => item.checked);
    
    if (selectedItems.length === 0) {
      alert('请至少选择一件商品');
      return;
    }
    
    alert(`已选择 ${selectedItems.length} 种商品，准备提交订单`);
    console.log(selectedItems);
    
    // 这里将来会调用API提交订单
  };

  // 格式化价格显示
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className={styles['cart-container']}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          正在加载购物车数据...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['cart-container']}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'red' }}>
          {error}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles['cart-container']}>
        <div className={styles['empty-cart']}>
          <div className={styles['empty-cart-icon']}>🛒</div>
          <h2>购物车空空如也</h2>
          <p>快去挑选你喜欢的商品吧！</p>
          <Link to="/machines" className={styles['continue-shopping-btn']}>
            浏览商品
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['cart-container']}>
      <h1 className={styles['cart-title']}>购物车</h1>
      
      <div className={styles['cart-content']}>
        <div className={styles['cart-list']}>
          <div className={styles['cart-header']}>
            <div className={styles['cart-select-all']}>
              <div 
                className={`${styles['cart-checkbox']} ${isAllSelected ? styles['checked'] : ''}`}
                onClick={handleSelectAll}
              ></div>
              <span>全选</span>
            </div>
            <div className={styles['cart-column-names']}>
              <div className={styles['cart-column-product']}>商品信息</div>
              <div className={styles['cart-column-price']}>单价</div>
              <div className={styles['cart-column-quantity']}>数量</div>
              <div className={styles['cart-column-total']}>小计</div>
              <div className={styles['cart-column-action']}>操作</div>
            </div>
          </div>
          
          {cartItems.map(item => (
            <div className={styles['cart-order-item']} key={item.id}>
              <div className={styles['cart-item-checkbox']}>
                <div 
                  className={`${styles['cart-checkbox-custom']} ${item.checked ? styles['checked'] : ''}`}
                  onClick={() => handleItemSelect(item.id)}
                ></div>
              </div>
              <div className={styles['cart-item-image']}>
                <img src={item.image_url} alt={`${item.model}产品图片`} />
              </div>
              <div className={styles['cart-item-details']}>
                <div className={styles['cart-item-model']}>
                  {item.model}
                  <span className={`${styles['cart-item-type-tag']} ${
                    item.type === 'machine' 
                      ? styles['cart-tag-machine'] 
                      : item.type === 'consumable' 
                        ? styles['cart-tag-consumable'] 
                        : styles['cart-tag-accessory']
                    }`}
                  >
                    {item.typeLabel}
                  </span>
                </div>
                <div className={styles['cart-item-sku']}>
                  SKU: {item.sku}
                </div>
                
                <div className={styles['cart-item-specs']}>
                  {Object.entries(item.properties).map(([key, value], index) => (
                    <span key={index} className={styles['cart-item-spec']}>
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={styles['cart-item-price']}>
                <div className={styles['item-current-price']}>
                  ¥{formatPrice(item.price)}
                </div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className={styles['item-original-price']}>
                    ¥{formatPrice(item.originalPrice)}
                  </div>
                )}
              </div>
              
              <div className={styles['cart-item-quantity']}>
                <div className={styles['quantity-adjuster']}>
                  <button 
                    className={styles['quantity-decrease']} 
                    onClick={() => handleDecrease(item.id)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className={styles['quantity-input']} 
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  />
                  <button 
                    className={styles['quantity-increase']} 
                    onClick={() => handleIncrease(item.id)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className={styles['cart-item-subtotal']}>
                ¥{formatPrice(item.price * item.quantity)}
              </div>
              
              <div className={styles['cart-item-actions']}>
                <button 
                  className={styles['delete-button']}
                  onClick={() => handleDelete(item.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles['cart-summary']}>
          <div className={styles['cart-summary-section']}>
            <h3 className={styles['summary-title']}>订单摘要</h3>
            <div className={styles['summary-row']}>
              <span>已选商品数量：</span>
              <span>{selectedCount} 件</span>
            </div>
            <div className={styles['summary-row']}>
              <span>商品总价：</span>
              <span className={styles['summary-price']}>¥{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles['summary-row']}>
              <span>运费：</span>
              <span>+ ¥0.00</span>
            </div>
            <div className={`${styles['summary-row']} ${styles['summary-total']}`}>
              <span>合计：</span>
              <span className={styles['summary-price']}>¥{formatPrice(totalPrice)}</span>
            </div>
            <button 
              className={styles['submit-order-btn']}
              onClick={handleSubmitOrder}
              disabled={selectedCount === 0}
            >
              结算 ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 