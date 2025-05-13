import React, { useState, useEffect } from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { ShoppingCartOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './FloatingActions.css';

interface FloatingActionsProps {
  cartCount: number;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({ cartCount }) => {
  const { t } = useTranslation();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="floating-actions">
      <Tooltip title={t('buttons.viewCart')} placement="left">
        <Badge count={cartCount} overflowCount={99}>
          <Link to="/cart" className="floating-action cart-action" aria-label={t('buttons.viewCart')}>
            <ShoppingCartOutlined />
          </Link>
        </Badge>
      </Tooltip>
      
      {showBackToTop && (
        <Tooltip title={t('buttons.backToTop')} placement="left">
          <Button 
            type="primary" 
            className="floating-action top-action"
            icon={<ArrowUpOutlined />} 
            onClick={scrollToTop}
            aria-label={t('buttons.backToTop')}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default FloatingActions; 