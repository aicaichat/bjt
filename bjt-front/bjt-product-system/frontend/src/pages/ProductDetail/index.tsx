import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ProductDetail.css';
import ProductPriceInventory from '../../components/ProductPriceInventory';

// Interfaces for product details
interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

interface Specification {
  name: string;
  value: string;
}

interface Feature {
  title: string;
  description: string;
}

interface PriceTier {
  range: string;
  price: number;
}

interface ProductStock {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  quantity: number;
  text: string;
}

interface Product {
  id: string;
  type: 'machine' | 'consumable' | 'spare';
  name: string;
  model: string;
  partNumber: string;
  description: string;
  shortDescription: string;
  images: ProductImage[];
  price: {
    original: number;
    current: number;
    discount?: number;
    tiers: PriceTier[];
  };
  rating: {
    average: number;
    count: number;
  };
  stock: ProductStock;
  specifications: Specification[];
  features: Feature[];
  compatibleModels: string[];
  related: string[];
}

// URL parameter interface - using Record to fix type error
type ProductDetailParams = Record<string, string | undefined>;

// Mock function to get product by ID (replace with real API call)
const getMockProduct = (id: string, type: string = 'machine'): Product => {
  return {
    id,
    type: type as 'machine' | 'consumable' | 'spare',
    name: 'LP-V1 全自动触摸屏标签打印贴标一体机',
    model: 'LP-V1-C3H',
    partNumber: 'BJT20230001',
    description: '这是一款高品质的全自动触摸屏标签打印贴标一体机，适用于工业环境下的标签打印和贴标需求。该设备集成了打印和贴标功能，操作简单，效率高，是工厂自动化的理想选择。',
    shortDescription: '集成打印贴标功能，7英寸触摸屏，热转印/热敏双模式，支持多种通信接口。',
    images: [
      { id: '1', url: 'https://via.placeholder.com/600x600?text=Machine+LP-V1', alt: 'LP-V1 主图' },
      { id: '2', url: 'https://via.placeholder.com/600x600?text=LP-V1+Side', alt: 'LP-V1 侧面图' },
      { id: '3', url: 'https://via.placeholder.com/600x600?text=LP-V1+Display', alt: 'LP-V1 显示屏' },
      { id: '4', url: 'https://via.placeholder.com/600x600?text=LP-V1+Connector', alt: 'LP-V1 接口' }
    ],
    price: {
      original: 12800,
      current: 11800,
      discount: 7.8,
      tiers: [
        { range: '1', price: 11800 },
        { range: '2-5', price: 11500 },
        { range: '6-10', price: 11000 },
        { range: '>10', price: 10500 }
      ]
    },
    rating: {
      average: 4.8,
      count: 32
    },
    stock: {
      status: 'in_stock',
      quantity: 15,
      text: '有货'
    },
    specifications: [
      { name: '尺寸', value: '400 × 300 × 350 mm' },
      { name: '重量', value: '15 kg' },
      { name: '功率', value: '120W' },
      { name: '打印分辨率', value: '203/300 dpi' },
      { name: '打印速度', value: '最高 300 mm/s' },
      { name: '打印宽度', value: '104 mm' },
      { name: '打印模式', value: '热转印/热敏' },
      { name: '通信接口', value: 'USB, RS-232, LAN, Wi-Fi (可选)' },
      { name: '显示屏', value: '7英寸彩色触摸屏' },
      { name: '材质', value: '铝合金+工程塑料' }
    ],
    features: [
      { 
        title: '一体化设计', 
        description: '集成打印和贴标功能，减少设备占用空间，提高工作效率。' 
      },
      { 
        title: '智能触控', 
        description: '7英寸彩色触摸屏，操作简单直观，支持多种语言界面。' 
      },
      { 
        title: '双模式打印', 
        description: '支持热转印和热敏两种打印模式，适应不同标签材质需求。' 
      },
      { 
        title: '高兼容性', 
        description: '支持多种通信接口，可与各类系统和设备无缝对接。' 
      }
    ],
    compatibleModels: ['LP-V1', 'LP-F1', 'LP-E5P', 'EC2007'],
    related: ['spare-1', 'spare-2', 'consumable-1']
  };
};

const ProductDetail: React.FC = () => {
  const params = useParams<ProductDetailParams>();
  const { id, type } = params;
  const navigate = useNavigate();
  
  // State declarations
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [inWishlist, setInWishlist] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('description');
  
  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // In a real app, this would be an API call
        // const response = await api.getProductById(id);
        // setProduct(response.data);
        
        // Simulate API delay
        setTimeout(() => {
          if (id) {
            const productData = getMockProduct(id, type);
            setProduct(productData);
            setActiveImage(productData.images[0].id);
            setLoading(false);
          } else {
            throw new Error('Product ID is required');
          }
        }, 800);
        
      } catch (err) {
        console.error('Failed to fetch product details:', err);
        setError('无法加载产品信息，请稍后再试');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, type]);
  
  // Handlers
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    setQuantity(value);
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    
    // Find the appropriate price tier based on quantity
    const tier = product.price.tiers.find(t => {
      if (t.range.includes('-')) {
        const [min, max] = t.range.split('-').map(n => parseInt(n));
        return quantity >= min && quantity <= max;
      } else if (t.range.includes('>')) {
        const min = parseInt(t.range.replace('>', ''));
        return quantity > min;
      } else {
        return parseInt(t.range) === quantity;
      }
    }) || product.price.tiers[0];
    
    const cartItem = {
      id: product.id,
      name: product.name,
      model: product.model,
      image: product.images[0].url,
      price: tier.price,
      quantity,
      type: product.type
    };
    
    // In a real app, dispatch to store or API
    console.log('Adding to cart:', cartItem);
    
    // Show toast notification
    alert(`已添加 ${quantity} 件 ${product.name} 到购物车`);
  };
  
  const toggleWishlist = () => {
    setInWishlist(!inWishlist);
    
    // In a real app, dispatch to store or API
    if (!inWishlist) {
      console.log('Added to wishlist:', product?.id);
    } else {
      console.log('Removed from wishlist:', product?.id);
    }
  };
  
  const handleShare = () => {
    // In a real app, implement sharing functionality
    // For now, just copy the URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('产品链接已复制到剪贴板'))
      .catch(err => console.error('Could not copy link:', err));
  };
  
  // Render product price and inventory section
  const renderProductPriceInventory = () => {
    if (!product || !id) return null;
    
    // Check if we should use real-time component or standard display
    const useRealTimeComponent = true; // This could be a feature flag or config setting
    
    if (useRealTimeComponent) {
      // Convert internal type to API type
      const productType = product.type === 'spare' ? 'spare-part' : product.type;
      
      return (
        <ProductPriceInventory 
          productId={id} 
          productType={productType as 'machine' | 'spare-part' | 'consumable' | 'accessory'} 
          quantity={quantity}
        />
      );
    }
    
    // Fallback to standard display
    return (
      <div className="product-price-block">
        <div className="product-price">
          <span className="current-price">¥{product.price.current}</span>
          {product.price.discount && (
            <span className="original-price">¥{product.price.original}</span>
          )}
          {product.price.discount && (
            <span className="discount-tag">-{product.price.discount}%</span>
          )}
        </div>
        <div className="price-tiers">
          <span className="tier-title">数量折扣：</span>
          {product.price.tiers.map((tier, index) => (
            <span key={index} className="tier-item">
              {tier.range}: ¥{tier.price}
            </span>
          ))}
        </div>
        <div className="stock-info">
          <span className={`stock-status ${product.stock.status}`}>
            {product.stock.text}
          </span>
          {product.stock.status === 'in_stock' && (
            <span className="stock-quantity">
              库存: {product.stock.quantity}
            </span>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>正在加载产品信息...</p>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="product-detail-error">
        <h2>很抱歉，出现了错误</h2>
        <p>{error || '无法找到该产品'}</p>
        <button onClick={() => navigate(-1)}>返回上一页</button>
      </div>
    );
  }
  
  // Find current image
  const currentImage = product.images.find(img => img.id === activeImage) || product.images[0];
  
  return (
    <div className="product-detail-container">
      {/* Breadcrumb */}
      <div className="product-detail-breadcrumb">
        <Link to="/">首页</Link> &gt; 
        <Link to={`/${product.type}s`}> {
          product.type === 'machine' ? '设备' : 
          product.type === 'consumable' ? '耗材' : '备件'
        }</Link> &gt; 
        <span>{product.name}</span>
      </div>
      
      {/* Product Detail Content */}
      <div className="product-detail-content">
        {/* Left: Gallery */}
        <div className="product-detail-gallery">
          <div className="product-main-image">
            <img src={currentImage.url} alt={currentImage.alt} />
          </div>
          
          <div className="product-thumbnails">
            {product.images.map(image => (
              <div 
                key={image.id}
                className={`thumbnail ${activeImage === image.id ? 'active' : ''}`}
                onClick={() => setActiveImage(image.id)}
              >
                <img src={image.url} alt={image.alt} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Right: Product Info */}
        <div className="product-detail-info">
          <h1 className="product-name">{product.name}</h1>
          
          <div className="product-meta">
            <div>型号: <span>{product.model}</span></div>
            <div>产品编号: <span>{product.partNumber}</span></div>
          </div>
          
          <p className="product-short-description">{product.shortDescription}</p>
          
          <div className="product-rating">
            {/* Display stars based on rating */}
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`star ${i < Math.round(product.rating.average) ? 'filled' : ''}`}>★</span>
            ))}
            <span className="rating-count">({product.rating.count}条评价)</span>
          </div>
          
          {/* Price Section */}
          {renderProductPriceInventory()}
          
          {/* Compatibility */}
          {product.compatibleModels.length > 0 && (
            <div className="product-compatibility">
              <span>兼容型号:</span>
              <div className="compatible-models">
                {product.compatibleModels.map((model, index) => (
                  <span key={index} className="compatible-model">{model}</span>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="product-actions">
            {/* Quantity Selector */}
            <div className="quantity-selector">
              <label>数量:</label>
              <div className="quantity-input-container">
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                />
                <button onClick={() => handleQuantityChange(quantity + 1)}>
                  +
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock.status === 'out_of_stock'}
              >
                {product.stock.status === 'out_of_stock' ? '缺货中' : '加入购物车'}
              </button>
              
              <button 
                className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`}
                onClick={toggleWishlist}
              >
                {inWishlist ? '❤️ 已收藏' : '♡ 收藏'}
              </button>
              
              <button className="share-btn" onClick={handleShare}>
                分享
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="product-detail-tabs">
        <div className="tab-header">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            产品描述
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            规格参数
          </button>
          <button 
            className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            特性与优势
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            用户评价 ({product.rating.count})
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="tab-pane">
              <p>{product.description}</p>
            </div>
          )}
          
          {activeTab === 'specifications' && (
            <div className="tab-pane specifications-table">
              <table>
                <tbody>
                  {product.specifications.map((spec, index) => (
                    <tr key={index}>
                      <th>{spec.name}</th>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'features' && (
            <div className="tab-pane">
              <div className="features-list">
                {product.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="tab-pane">
              <p>用户评价功能即将上线，敬请期待。</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products */}
      {product.related.length > 0 && (
        <div className="related-products">
          <h2>相关产品</h2>
          <div className="related-products-grid">
            {/* Related products would be rendered here */}
            <div className="related-product-placeholder">
              <p>相关产品展示即将上线</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail; 