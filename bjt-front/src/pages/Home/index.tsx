import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { ProductLine } from '../../services/api';

// 开发阶段使用模拟数据
const USE_MOCK_DATA = true;

// 临时占位图片路径
const placeholderImage = '/images/placeholders/placeholder-300x200.svg';

// 模拟产品线数据
const mockProductLines: ProductLine[] = [
  {
    id: 1,
    title_en: 'Air Cushioning System',
    title_cn: '气垫包装系统',
    description_en: 'Our Air Cushioning System provides superior protection for your products during shipping. Designed for efficiency and versatility, this system creates customized air cushions that perfectly protect your items.',
    description_cn: '我们的气垫包装系统为您的产品在运输过程中提供卓越的保护。该系统专为高效和多功能而设计，可以创建完美保护您物品的定制气垫。',
    subitem1_en: 'Air Cushion Machine & Accessory',
    subitem1_cn: '气垫机及配件',
    subitem2_en: 'Film options',
    subitem2_cn: '气垫膜选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: placeholderImage,
    status: 'publish',
    menu_order: 1
  },
  {
    id: 2,
    title_en: 'Paper Cushioning System',
    title_cn: '纸垫包装系统',
    description_en: 'Our Paper Cushioning System offers an eco-friendly packaging solution that provides excellent protection. The system converts paper into a strong, flexible cushioning material ideal for various packaging needs.',
    description_cn: '我们的纸垫包装系统提供环保的包装解决方案，提供卓越的保护效果。该系统将纸张转化为坚固、灵活的缓冲材料，适用于各种包装需求。',
    subitem1_en: 'Paper Cushion Machine & Accessories',
    subitem1_cn: '纸垫机及配件',
    subitem2_en: 'Paper Options',
    subitem2_cn: '纸张选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: placeholderImage,
    status: 'publish',
    menu_order: 2
  },
  {
    id: 3,
    title_en: 'Water Cushioning System',
    title_cn: '水胶带包装系统',
    description_en: 'Our Water Activated Tape System provides a secure, tamper-evident seal for your packaging. The tape forms a strong bond with carton surfaces and is ideal for heavy packages.',
    description_cn: '我们的水胶带系统为您的包装提供安全、防篡改的密封。胶带与纸箱表面形成牢固的粘合，非常适合重型包装。',
    subitem1_en: 'Water Activated Tape Dispenser & Accessory',
    subitem1_cn: '水胶带分配器及配件',
    subitem2_en: 'Water Activated Tape options',
    subitem2_cn: '水胶带选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: placeholderImage,
    status: 'publish',
    menu_order: 3
  }
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [language] = useState<'en' | 'cn'>('en'); // 默认英文，可以通过Context扩展

  // 获取产品线数据
  useEffect(() => {
    const fetchProductLines = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_DATA) {
          // 使用模拟数据
          setTimeout(() => {
            setProductLines(mockProductLines);
            setLoading(false);
          }, 500);
        } else {
          // 从API获取数据
          const data = await apiService.getProductLines();
          setProductLines(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch product lines:', error);
        setError('Failed to load product information. Please try again later.');
        setLoading(false);
      }
    };

    fetchProductLines();
  }, []);

  // 处理产品链接点击事件
  const handleProductLinkClick = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      alert('Please login to access this content');
    }
  };

  // 根据当前语言获取标题
  const getTitle = (line: ProductLine) => language === 'en' ? line.title_en : line.title_cn;
  
  // 根据当前语言获取描述
  const getDescription = (line: ProductLine) => language === 'en' ? line.description_en : line.description_cn;
  
  // 根据当前语言获取子项
  const getSubitem1 = (line: ProductLine) => language === 'en' ? line.subitem1_en : line.subitem1_cn;
  const getSubitem2 = (line: ProductLine) => language === 'en' ? line.subitem2_en : line.subitem2_cn;
  const getSubitem3 = (line: ProductLine) => language === 'en' ? line.subitem3_en : line.subitem3_cn;

  if (loading) {
    return (
      <div className="home-page">
        <div className="container">
          <div className="loading-state">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="container">
          <div className="error-state">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <main className="container">
        {productLines.map((line) => (
          <div key={line.id} className="product-section">
            <div className="section-header">
              {getTitle(line)}
            </div>
            <div className="section-content">
              <div className="section-text">
                <p className="introduction">Introduction</p>
                <div className="divider"></div>
                <p>{getDescription(line)}</p>
                
                <div className="product-links">
                  <Link 
                    to={`/machines?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `/machines?category=${line.id}`)}
                  >
                    {getSubitem1(line)}
                  </Link>
                  <Link 
                    to={`/consumables?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `/consumables?category=${line.id}`)}
                  >
                    {getSubitem2(line)}
                  </Link>
                  <Link 
                    to={`/spare-parts?category=${line.id}`} 
                    className="product-link" 
                    onClick={(e) => handleProductLinkClick(e, `/spare-parts?category=${line.id}`)}
                  >
                    {getSubitem3(line)}
                  </Link>
                </div>
              </div>
              <div className="section-image">
                <img src={line.image_url || placeholderImage} alt={getTitle(line)} />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Home; 