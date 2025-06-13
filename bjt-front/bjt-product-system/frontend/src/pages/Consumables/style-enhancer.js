/**
 * 耗材页面样式增强脚本
 * 在页面加载后动态应用现代化样式
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎨 开始应用耗材页面样式增强...');
  
  // 应用页面容器增强
  enhancePageContainer();
  
  // 应用页面标题增强
  enhancePageHeader();
  
  // 应用筛选容器增强
  enhanceFilterContainer();
  
  // 应用产品卡片增强
  enhanceProductCards();
  
  // 应用购物车按钮增强
  enhanceCartButtons();
  
  // 应用库存状态增强
  enhanceInventoryStatus();
  
  // 应用动画效果
  applyAnimations();
  
  console.log('✅ 耗材页面样式增强完成！');
});

function enhancePageContainer() {
  const pageContainer = document.querySelector('.consumables-page');
  if (pageContainer) {
    pageContainer.classList.add('consumables-page-enhanced');
    console.log('📦 页面容器增强完成');
  }
  
  const container = document.querySelector('.container');
  if (container) {
    container.classList.add('container-enhanced');
  }
}

function enhancePageHeader() {
  const sectionTitle = document.querySelector('.section-title');
  if (sectionTitle) {
    sectionTitle.classList.add('page-header-enhanced');
    
    // 添加渐变顶部边框
    const gradientBorder = document.createElement('div');
    gradientBorder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8);
    `;
    sectionTitle.style.position = 'relative';
    sectionTitle.appendChild(gradientBorder);
    
    console.log('📋 页面标题增强完成');
  }
}

function enhanceFilterContainer() {
  const filterContainer = document.querySelector('.filter-container');
  if (filterContainer) {
    filterContainer.classList.add('filter-container-enhanced');
    
    // 添加筛选图标到标题
    const filterTitle = filterContainer.querySelector('h3');
    if (filterTitle && !filterTitle.querySelector('.filter-icon')) {
      const icon = document.createElement('span');
      icon.className = 'filter-icon';
      icon.innerHTML = '🔍';
      icon.style.marginRight = '8px';
      filterTitle.insertBefore(icon, filterTitle.firstChild);
    }
    
    console.log('🔍 筛选容器增强完成');
  }
}

function enhanceProductCards() {
  const productCards = document.querySelectorAll('.bg-card');
  productCards.forEach((card, index) => {
    card.classList.add('product-card-enhanced', 'fade-in-up');
    
    // 添加延迟动画
    card.style.animationDelay = `${index * 0.1}s`;
    
    // 添加悬停效果
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  console.log(`🎴 ${productCards.length} 个产品卡片增强完成`);
}

function enhanceCartButtons() {
  const cartButtons = document.querySelectorAll('.cart-add-button, .ant-btn-primary');
  cartButtons.forEach(button => {
    if (button.textContent?.includes('购物车') || button.textContent?.includes('Cart')) {
      button.classList.add('cart-add-button-enhanced');
      
      // 添加购物车图标
      if (!button.querySelector('.cart-icon')) {
        const icon = document.createElement('span');
        icon.className = 'cart-icon';
        icon.innerHTML = '🛒';
        icon.style.marginRight = '6px';
        button.insertBefore(icon, button.firstChild);
      }
      
      // 添加光泽效果
      const shimmer = document.createElement('div');
      shimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
        pointer-events: none;
      `;
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(shimmer);
      
      button.addEventListener('mouseenter', function() {
        shimmer.style.left = '100%';
      });
      
      button.addEventListener('mouseleave', function() {
        shimmer.style.left = '-100%';
      });
    }
  });
  
  console.log('🛒 购物车按钮增强完成');
}

function enhanceInventoryStatus() {
  const inventoryElements = document.querySelectorAll('.inventory-status');
  inventoryElements.forEach(element => {
    element.classList.add('inventory-status-enhanced');
    
    // 添加状态指示点
    if (!element.querySelector('.status-dot')) {
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      dot.style.cssText = `
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 6px;
      `;
      
      // 根据状态设置颜色
      if (element.classList.contains('in-stock')) {
        dot.style.backgroundColor = '#10b981';
      } else if (element.classList.contains('low-stock')) {
        dot.style.backgroundColor = '#f59e0b';
      } else if (element.classList.contains('out-of-stock')) {
        dot.style.backgroundColor = '#ef4444';
      }
      
      element.insertBefore(dot, element.firstChild);
    }
  });
  
  console.log('📊 库存状态增强完成');
}

function applyAnimations() {
  // 添加CSS动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .product-card-enhanced {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .cart-add-button-enhanced {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .cart-add-button-enhanced:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .inventory-status-enhanced {
      transition: all 0.2s ease;
    }
    
    .inventory-status-enhanced:hover {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
  
  console.log('✨ 动画效果应用完成');
}

// 导出增强函数供外部调用
window.enhanceConsumablesPage = {
  enhancePageContainer,
  enhancePageHeader,
  enhanceFilterContainer,
  enhanceProductCards,
  enhanceCartButtons,
  enhanceInventoryStatus,
  applyAnimations
}; 