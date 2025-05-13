// src/pages/Machines/index.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Spin, message, Button, Select, InputNumber, Tabs, Tag } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// 导入API服务
import machinesService from '../../services/machinesService';
import { MachineProduct, MachineListData, MachineAccessory, MachinePart, MachinePartListData } from '../../types/machines';
import { useMockData, DEFAULT_REGION } from '../../config/env';
import { REGIONS, getDefaultVoltageByRegion, getStockStatus, getCurrencySymbol } from '../../config/constants';
import { safeToLocaleString } from '../../utils/priceUtils';
import { delay } from '../../utils/delay';

import './Machines.css';
import './accessibility.css';

const { Option } = Select;
const { TabPane } = Tabs;

const MachinesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  // 产品和过滤相关状态
  const [machines, setMachines] = useState<MachinePart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>(user?.region || DEFAULT_REGION);
  
  // 用户交互相关状态
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedVoltage, setSelectedVoltage] = useState<string>(getDefaultVoltageByRegion(user?.region || DEFAULT_REGION));
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationProduct, setNotificationProduct] = useState<string>('');
  const [notificationQuantity, setNotificationQuantity] = useState<number>(1);
  const [cartCount, setCartCount] = useState<number>(0);
  
  // 配件相关状态
  const [accessories, setAccessories] = useState<MachineAccessory[]>([]);
  const [accessoriesLoading, setAccessoriesLoading] = useState<boolean>(false);
  const [selectedAccessories, setSelectedAccessories] = useState<Record<string, string>>({});
  const [selectedAccessoryNames, setSelectedAccessoryNames] = useState<Record<string, string>>({});
  const [level2Accessories, setLevel2Accessories] = useState<MachineAccessory[]>([]);
  const [level3Accessories, setLevel3Accessories] = useState<MachineAccessory[]>([]);
  const [level4Accessories, setLevel4Accessories] = useState<MachineAccessory[]>([]);
  const [level5Accessories, setLevel5Accessories] = useState<MachineAccessory[]>([]);
  const [level2Loading, setLevel2Loading] = useState<boolean>(false);
  const [level3Loading, setLevel3Loading] = useState<boolean>(false);
  const [level4Loading, setLevel4Loading] = useState<boolean>(false);
  const [level5Loading, setLevel5Loading] = useState<boolean>(false);
  
  // 判断用户角色和权限
  const isSales = user && (user.role === 'sales' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';
  const isVIP = user && (user.vipLevel ? user.vipLevel >= 2 : user.type === 'vip');
  const userRegion = filterRegion || user?.region || DEFAULT_REGION;
  
  // 修改默认视图为表格模式
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  
  const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';

  const getMachineName = (machine: MachinePart): string => {
    const name = currentLanguage === 'zh' ? machine.name_zh : machine.name_en;
    return name || machine.model || 'N/A';
  };

  const getMachineDescription = (machine: MachinePart): string => {
    const desc = currentLanguage === 'zh' ? machine.model_description_zh : machine.model_description_en;
    return desc || '';
  };

  // 从API获取设备列表
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch MachinePartListData object for Product Line 1
        const machineListData: MachinePartListData = await machinesService.getMachines({
          region: userRegion,
          product_line_id: 1 // Filter for Product Line 1
        });
      
        // Check if data and items exist
        if (machineListData && Array.isArray(machineListData.items)) {
          const machinesArray = machineListData.items;
          setMachines(machinesArray);
          const initialQuantities: Record<string, number> = {};
          // Iterate over MachinePart[] from items property
          machinesArray.forEach((machine: MachinePart) => { 
            initialQuantities[machine.id.toString()] = 1;
          });
          setQuantities(initialQuantities);
          
          if (machinesArray.length > 0) {
            setSelectedMachine(machinesArray[0].id.toString());
            // Potentially set pagination state here if you add pagination controls
            // setTotalMachines(machineListData.total);
            // setCurrentPage(machineListData.page);
            // setTotalPages(machineListData.total_pages);
          }
        } else {
          // Handle the case where data or items is not as expected
          console.warn('Received unexpected data structure from getMachines:', machineListData);
          setMachines([]); // Set to empty array to avoid further errors
          setQuantities({});
          // Optionally set an error state here if appropriate
          // setError(t('errors.invalidData')); 
        }

      } catch (err: any) {
        setError(err.message || t('errors.systemError'));
        message.error(err.message || t('errors.systemError'));
        console.error('Failed to fetch machines:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachines();
  }, [userRegion, t, i18n.language]);
  
  // 过滤产品
  const filteredMachines = React.useMemo(() => {
    if (filterType === 'all') {
      return machines;
    }
    return machines.filter(machine => {
      const name = getMachineName(machine).toLowerCase();
      const identifier = machine.part_number.toLowerCase();
      return identifier.includes(filterType.toLowerCase()) || 
             name.includes(filterType.toLowerCase());
    });
  }, [machines, filterType, currentLanguage]);
  
  // 格式化日期
  const formatDate = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `今日 ${hours}:${minutes}`;
  };
  
  // 格式化价格
  const formatPrice = (price: number): string => {
    return safeToLocaleString(price);
  };
  
  // 获取区域库存
  const getRegionInventory = (product: MachinePart, region: string): number => {
    const regionInventory = product.inventory?.find(inv => inv.region === region);
    return regionInventory ? regionInventory.quantity : 0;
  };
  
  // 处理数量变更
  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities({
      ...quantities,
      [productId]: value
    });
  };
  
  // 渲染购物车通知
  const renderCartNotification = () => {
    if (!showNotification) return null;
    
    return (
      <div 
        className="cart-notification" 
        role="alert" 
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="notification-icon" aria-hidden="true">
          <ShoppingCartOutlined />
        </div>
        <div className="notification-content">
          <div className="notification-title">
            {notificationProduct} {t('machines.notification.added')}
          </div>
          <div className="notification-details">
            {t('machines.notification.quantity')}: {notificationQuantity}
          </div>
        </div>
        <button 
          className="notification-close" 
          onClick={hideCartNotification}
          aria-label={t('buttons.close')}
        >
          {t('buttons.close')}
        </button>
        <div className="notification-actions">
          <button 
            className="go-to-cart-btn" 
            onClick={goToCart}
            aria-label={t('buttons.checkout')}
          >
            <ShoppingCartOutlined aria-hidden="true" /> {t('buttons.checkout')}
          </button>
        </div>
      </div>
    );
  };

  // 隐藏购物车通知
  const hideCartNotification = () => {
    setShowNotification(false);
  };
  
  // 添加到购物车
  const handleAddToCart = async (product: MachinePart | MachineAccessory, productType: 'machine' | 'accessory' = 'machine') => {
    try {
      const quantity = quantities[product.id.toString()] || 1;
      const isMachineProduct = (p: MachinePart | MachineAccessory): p is MachinePart => productType === 'machine';

      let properties: Record<string, any> = {};
      let itemSpecs: Record<string, any> | undefined = undefined;

      if (isMachineProduct(product)) {
        properties = {
          '料号': product.part_number,
          '型号': product.model,
          '电压': product.voltage,
          '规格': product.spec,
          '规格(英制)': product.spec_imperial,
          '选择的电压': selectedVoltage
        };
        itemSpecs = {
          '料号': product.part_number,
          '型号': product.model,
          '电压': product.voltage,
          '规格': product.spec,
          '规格(英制)': product.spec_imperial,
          '净重(kg)': product.net_weight_kg,
        };
      } else {
        const partSpecs = product.parts?.[0]?.specs;
        if (partSpecs) {
          properties = { ...partSpecs };
          itemSpecs = partSpecs;
        }
      }

      const cartResponse = await machinesService.addToCart({
        product_id: product.id.toString(),
        product_type: productType,
        quantity: quantity,
        voltage: productType === 'machine' ? selectedVoltage : undefined,
        properties: properties
      });

      const productName = isMachineProduct(product) ? getMachineName(product) : product.title;
      const productCode = isMachineProduct(product) ? product.part_number : product.model;
      const productImage = product.image_url || '';
      const productCategory = productType === 'machine' ? '设备' : '配件';
      const productIdNum = typeof product.id === 'number' ? product.id : parseInt(product.id, 10);
      
      let price = 0;
      let priceTiers: any[] = [];

      if (isMachineProduct(product)) {
        if (product.prices && product.prices.length > 0 && product.prices[0].tiers && product.prices[0].tiers.length > 0) {
          price = product.prices[0].tiers[0].base_price;
          priceTiers = product.prices[0].tiers.map(t => ({ 
            min: t.min_quantity, 
            max: t.max_quantity, 
            price: t.base_price,
            discount_rate: t.discount_rate
          }));
        } else {
          price = 0; 
          priceTiers = [];
        }
      } else {
        const accessoryPrices = product.parts?.[0]?.prices;
        if (accessoryPrices) {
          price = accessoryPrices.base || 0;
          priceTiers = [
            { min: 1, max: 4, price: accessoryPrices.base },
            { min: 5, max: 9, price: accessoryPrices.tier1 },
            { min: 10, max: null, price: accessoryPrices.tier2 }
          ];
        } else {
          price = 0;
          priceTiers = [];
        }
      }

      addItem({
        id: product.id.toString(),
        name: productName,
        code: productCode,
        partNumber: productCode || '',
        image: productImage,
        category: productCategory,
        productId: productIdNum,
        price: price,
        quantity,
        selected: true,
        priceTiers: priceTiers,
        properties: properties,
        specs: itemSpecs || {}
      });
      
      setNotificationProduct(productName);
      setNotificationQuantity(quantity);
      setShowNotification(true);
      setTimeout(hideCartNotification, 3000);
      message.success(t('messages.addedToCart'));

    } catch (err: any) {
      message.error(err.message || t('errors.systemError'));
      console.error('Error adding to cart:', err);
    }
  };
  
  // 处理机器选择
  const handleMachineSelection = async (machineId: string | number) => {
    const currentMachineIdStr = typeof machineId === 'number' ? machineId.toString() : machineId;
    setSelectedMachine(currentMachineIdStr);
    setSelectedAccessories({});
    
    // Find the selected machine object from the state to get its part_number
    const selectedMachineObject = machines.find(m => m.id.toString() === currentMachineIdStr);

    if (!selectedMachineObject) {
      console.error(`Machine with ID ${currentMachineIdStr} not found in state.`);
      message.error(t('errors.productNotFound'));
      setAccessoriesLoading(false); // Ensure loading stops
      return; // Stop execution if machine not found
    }

    const parentPartNumber = selectedMachineObject.part_number;
    console.log(`[handleMachineSelection] Found part number: ${parentPartNumber} for machine ID: ${currentMachineIdStr}`); // Log the part number

    // 隐藏所有配件层级
    for (let i = 1; i <= 5; i++) {
      const accessoryDiv = document.getElementById(`accessory-level-${i}`);
      if (accessoryDiv) {
        accessoryDiv.style.display = 'none';
      }
    }
    
    // 显示加载状态
    setAccessoriesLoading(true);
    
    try {
      // Use the found parentPartNumber to fetch accessories
      const accessoriesData = await machinesService.getMachineAccessories(parentPartNumber, { level: 1 });
      
      setAccessories(accessoriesData.items);
      setLevel2Accessories([]);
      setLevel3Accessories([]);
      setLevel4Accessories([]);
      setLevel5Accessories([]);
      
      const contextMessage = document.getElementById('level1-context-message');
      if (contextMessage) {
        const machine = machines.find(m => m.id.toString() === currentMachineIdStr);
        contextMessage.textContent = `${t('machines.accessory.selectFor')} ${machine ? getMachineName(machine) : ''}`;
      }
      
      const level1Div = document.getElementById('accessory-level-1');
      if (level1Div && accessoriesData.items.length > 0) {
        level1Div.style.display = 'block';
      } else if (level1Div) {
        message.info(t('messages.noAccessoriesAvailable'));
      }
    } catch (err: any) {
      console.error('Failed to fetch accessories for part number:', parentPartNumber, err);
      message.error(err.message || t('errors.systemError'));
    } finally {
      setAccessoriesLoading(false);
    }
  };
  
  // 查看配件详情
  const handleViewAccessory = (accessoryId: string) => {
    // 实现查看配件详情功能
  };
  
  // 查看产品详情
  const handleViewDetails = (machineId: string) => {
    // 可以跳转到详情页
    navigate(`/product-detail/${machineId}`);
  };
  
  // 前往购物车
  const goToCart = () => {
    navigate('/cart');
  };
  
  // 渲染机器表格
  const renderMachinesTable = () => {
    return (
      <table 
        className="machines-table"
        role="grid"
        aria-labelledby="machines-table-caption"
      >
        <caption id="machines-table-caption" className="sr-only">{t('machines.pageTitle')}</caption>
        <thead>
          <tr>
            <th className="selection-cell" scope="col">{t('machines.tableHeaders.selection')}</th>
            <th className="machine-image-cell" scope="col">{t('machines.tableHeaders.image')}</th>
            <th className="machine-info-cell" scope="col">{t('machines.tableHeaders.model')}</th>
            <th className="specs-cell" scope="col">{t('machines.tableHeaders.specs')}</th>
            <th className="price-cell" scope="col">{t('machines.tableHeaders.price')}</th>
            {isSales && <th className="inventory-cell" scope="col">{t('machines.tableHeaders.inventory')}</th>}
            <th className="actions-cell" scope="col">{t('machines.tableHeaders.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredMachines.map(machine => (
            <tr key={machine.id} tabIndex={0} aria-selected={selectedMachine === machine.id.toString()}>
              <td className="selection-cell">
                <input 
                  type="radio" 
                  name="machine" 
                  id={`machine-select-${machine.id}`}
                  checked={selectedMachine === machine.id.toString()}
                  onChange={() => handleMachineSelection(machine.id)}
                  aria-label={`${t('machines.tableHeaders.selection')} ${getMachineName(machine)}`}
                />
                <label htmlFor={`machine-select-${machine.id}`} className="sr-only">
                  {t('machines.tableHeaders.selection')} {getMachineName(machine)}
                </label>
              </td>
              <td className="machine-image-cell">
                <img 
                  className="machine-image" 
                  src={machine.image_url || '/images/placeholder.jpg'}
                  alt={getMachineName(machine)}
                  aria-labelledby={`machine-name-${machine.id}`}
                />
              </td>
              <td className="machine-info-cell">
                <div className="machine-header">
                  <span className="machine-code" title="Part Number">{machine.part_number}</span>
                  <span className="machine-name" id={`machine-name-${machine.id}`}>{getMachineName(machine)}</span>
                  <span className="machine-model" title="Model">({machine.model})</span>
                  <span className="machine-type">{machine.model_type || 'N/A'}</span>
                </div>
                
                <div className="accessory-specs-container">
                  <span className="accessory-spec-item"><strong>电压:</strong> {machine.voltage || 'N/A'}</span>
                  <span className="accessory-spec-item"><strong>规格:</strong> {machine.spec || 'N/A'}</span>
                </div>
                
                <div className="more-info-section">
                  <button 
                    className="specification-link" 
                    onClick={() => handleViewDetails(machine.id.toString())}
                    aria-label={`${t('buttons.viewDetails')} ${getMachineName(machine)}`}
                  >
                    规格详情
                  </button>
                  <button 
                    className="more-info-link" 
                    onClick={() => handleViewDetails(machine.id.toString())}
                    aria-label={`${t('buttons.viewDetails')} ${getMachineName(machine)}`}
                  >
                    更多信息
                  </button>
                  {machine.model_explosion_diagram_pdf && (
                    <a
                      href={machine.model_explosion_diagram_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pdf-download-link"
                      aria-label={`${t('buttons.downloadPdf')} ${getMachineName(machine)}`}
                    >
                      PDF资料下载
                    </a>
                  )}
                </div>
              </td>
              <td className="specs-cell">
                <table className="specs-table" aria-label={`${t('machines.tableHeaders.specs')} ${getMachineName(machine)}`}>
                  <tbody>
                    <tr className="specs-row"><th className="specs-label" scope="row">料号:</th><td className="specs-value">{machine.part_number}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">型号:</th><td className="specs-value">{machine.model}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">电压:</th><td className="specs-value">{machine.voltage || 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">规格:</th><td className="specs-value">{machine.spec || 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">规格(英制):</th><td className="specs-value">{machine.spec_imperial || 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">包装(cm):</th><td className="specs-value">{machine.package_size_cm || 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">净重(kg):</th><td className="specs-value">{machine.net_weight_kg !== null && machine.net_weight_kg !== undefined ? machine.net_weight_kg : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">净重(lbs):</th><td className="specs-value">{machine.net_weight_lbs !== null && machine.net_weight_lbs !== undefined ? machine.net_weight_lbs : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">每箱数量:</th><td className="specs-value">{machine.pcs_per_box !== null && machine.pcs_per_box !== undefined ? machine.pcs_per_box : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">托盘尺寸(cm):</th><td className="specs-value">{machine.pallet_size_cm || 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">托盘尺寸(inch):</th><td className="specs-value">{machine.pallet_size_inch || 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">每托盘数量:</th><td className="specs-value">{machine.pcs_per_pallet !== null && machine.pcs_per_pallet !== undefined ? machine.pcs_per_pallet : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">托盘高度(cm):</th><td className="specs-value">{machine.pallet_height_cm !== null && machine.pallet_height_cm !== undefined ? machine.pallet_height_cm : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">托盘高度(inch):</th><td className="specs-value">{machine.pallet_height_inch !== null && machine.pallet_height_inch !== undefined ? machine.pallet_height_inch : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">托盘毛重(kg):</th><td className="specs-value">{machine.pallet_gross_weight_kg !== null && machine.pallet_gross_weight_kg !== undefined ? machine.pallet_gross_weight_kg : 'N/A'}</td></tr>
                    <tr className="specs-row"><th className="specs-label" scope="row">托盘毛重(lbs):</th><td className="specs-value">{machine.pallet_gross_weight_lbs !== null && machine.pallet_gross_weight_lbs !== undefined ? machine.pallet_gross_weight_lbs : 'N/A'}</td></tr>
                  </tbody>
                </table>
              </td>
              <td className="price-cell">
                {(machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0) ? (
                  <div className="price-tiers" aria-label={`${t('machines.tableHeaders.price')} ${getMachineName(machine)}`}>
                    <div className="price-title" id={`price-title-${machine.id}`}>
                      {t('machines.tableHeaders.price')} ({machine.prices[0].currency})
                    </div>
                    {machine.prices[0].tiers.map((tier, index) => (
                      <div className="price-tier" key={index}>
                        <span className="price-range">{`数量 ${tier.min_quantity}${tier.max_quantity ? '-' + tier.max_quantity : '+'}` }</span>
                        <span className="price-value">
                          {getCurrencySymbol(machine.prices[0].region)}{formatPrice(tier.base_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>{t('machines.priceInDetailView', '-')}</span>
                )}
              </td>
              {isSales ? (
                <td className="inventory-cell">
                  <div className="inventory-tiers" aria-labelledby={`inventory-title-${machine.id}`}>
                    <div className="inventory-title" id={`inventory-title-${machine.id}`}>{t('machines.tableHeaders.inventory')}</div>
                    {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => (
                      <div className="inventory-region" key={regionKey}>
                        <span className="region-label">{REGIONS[regionKey].nameCn}</span>
                        <span>
                          <span 
                            className={`region-value ${getStockStatus(getRegionInventory(machine, regionKey)).className}`}
                            aria-label={`${REGIONS[regionKey].nameCn} ${getRegionInventory(machine, regionKey)}`}
                          >
                            {getRegionInventory(machine, regionKey)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              ) : null}
              <td className="actions-cell">
                <div className="quantity-selector" role="group" aria-label={`${t('machines.tableHeaders.quantity')} ${getMachineName(machine)}`}>
                  <button 
                    className="qty-btn" 
                    onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) - 1)}
                    disabled={(quantities[machine.id.toString()] || 1) <= 1}
                    aria-label={t('decrease quantity')}
                  >
                    <MinusOutlined aria-hidden="true" />
                  </button>
                  <label htmlFor={`quantity-input-${machine.id}`} className="sr-only">
                    {t('machines.tableHeaders.quantity')}
                  </label>
                  <input
                    id={`quantity-input-${machine.id}`}
                    type="number"
                    min="1"
                    value={quantities[machine.id.toString()] || 1} 
                    onChange={(e) => handleQuantityChange(machine.id.toString(), parseInt(e.target.value) || 1)}
                    className="quantity-input"
                    aria-label={`${t('machines.tableHeaders.quantity')} ${getMachineName(machine)}`}
                  />
                  <button 
                    className="qty-btn" 
                    onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) + 1)}
                    aria-label={t('increase quantity')}
                  >
                    <PlusOutlined aria-hidden="true" />
                  </button>
                </div>
                <button 
                  onClick={() => handleAddToCart(machine, 'machine')}
                  className="btn-add"
                  disabled={getRegionInventory(machine, userRegion) <= 0}
                  aria-label={`${t('buttons.addToCart')} ${getMachineName(machine)}`}
                >
                  <ShoppingCartOutlined aria-hidden="true" /> {t('buttons.addToCart')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // 处理配件选择
  const handleAccessorySelection = async (level: number, accessoryId: string, accessoryName: string) => {
    setSelectedAccessories(prev => ({
      ...prev,
      [`level${level}`]: accessoryId
    }));
    setSelectedAccessoryNames(prev => ({
      ...prev,
      [`level${level}`]: accessoryName
    }));

    for (let i = 1; i <= 5; i++) {
      const accessoryDiv = document.getElementById(`accessory-level-${i}`);
      if (accessoryDiv) {
        if (i <= level) {
          // accessoryDiv.style.display = 'block'; // Keep current level visible
        } else if (i === level + 1) {
          // Next level will be shown after API call, hide for now to prevent old data flashing
          accessoryDiv.style.display = 'none'; 
        } else {
          accessoryDiv.style.display = 'none';
        }
      }
    }
    
    setSelectedAccessories(prev => {
      const newState = { ...prev };
      for (let i = level + 1; i <= 5; i++) {
        if (newState[`level${i}`]) delete newState[`level${i}`];
        // Also clear UI for higher levels that might have been manually opened
        const higherLevelDiv = document.getElementById(`accessory-level-${i}`);
        if (higherLevelDiv) higherLevelDiv.style.display = 'none';
      }
      return newState;
    });
    
    const nextLevel = level + 1;
    if (nextLevel <= 5) {
      const contextMessage = document.getElementById(`level${nextLevel}-context-message`);
      if (contextMessage) {
        let contextText = `${accessoryName} 的适配配件`;
        if (level > 1) contextText = `${level}级配件 ${accessoryName} 的下级适配件`;
        contextMessage.textContent = contextText;
      }
    }

    // --- Find the part_number of the selected accessory --- START
    let parentPartNumber: string | undefined;
    let currentLevelAccessories: MachineAccessory[] = [];

    if (level === 1) currentLevelAccessories = accessories;
    else if (level === 2) currentLevelAccessories = level2Accessories;
    else if (level === 3) currentLevelAccessories = level3Accessories;
    else if (level === 4) currentLevelAccessories = level4Accessories;
    // Level 5 doesn't need to fetch children

    const selectedAccessoryObject = currentLevelAccessories.find(acc => acc.id === accessoryId);

    if (selectedAccessoryObject && selectedAccessoryObject.parts.length > 0) {
      // Use the part_number of the first part as the identifier for fetching children
      parentPartNumber = selectedAccessoryObject.parts[0].part_number;
      console.log(`[handleAccessorySelection] Found parentPartNumber: ${parentPartNumber} for accessoryId: ${accessoryId}`);
    } else {
      console.error(`Could not find selected accessory object or its parts for ID: ${accessoryId} at level ${level}`);
      message.error(t('errors.productNotFound'));
      // Optionally reset loading states if applicable
      return; // Stop if we can't find the part number
    }
    // --- Find the part_number of the selected accessory --- END

    let setLoadingState: React.Dispatch<React.SetStateAction<boolean>> = () => {};
    if (level === 1) setLoadingState = setLevel2Loading; 
    else if (level === 2) setLoadingState = setLevel3Loading;
    else if (level === 3) setLoadingState = setLevel4Loading;
    else if (level === 4) setLoadingState = setLevel5Loading;

    try {
      setLoadingState(true);
      // Use the found parentPartNumber for the API call
      const accessoriesData = await machinesService.getAccessories({
        parent_id: parentPartNumber, // Pass the correct part_number
        machine_id: selectedMachine,
        level: level + 1
      });

      let setNextLevelAccessories: React.Dispatch<React.SetStateAction<MachineAccessory[]>> = () => {};
      let nextLevelDivId = '';

      if (level === 1) { setNextLevelAccessories = setLevel2Accessories; nextLevelDivId = 'accessory-level-2'; }
      else if (level === 2) { setNextLevelAccessories = setLevel3Accessories; nextLevelDivId = 'accessory-level-3'; }
      else if (level === 3) { setNextLevelAccessories = setLevel4Accessories; nextLevelDivId = 'accessory-level-4'; }
      else if (level === 4) { setNextLevelAccessories = setLevel5Accessories; nextLevelDivId = 'accessory-level-5'; }

      if (setNextLevelAccessories && nextLevelDivId) {
        setNextLevelAccessories(accessoriesData.items);
        const nextDiv = document.getElementById(nextLevelDivId);
        if (nextDiv) {
          if (accessoriesData.items.length > 0) {
            nextDiv.style.display = 'block';
          } else {
            nextDiv.style.display = 'none'; // Hide if no items
            message.info(`${accessoryName} 没有下级配件`);
          }
        }
      }
    } catch (err: any) {
      message.error(err.message || '获取配件失败');
      console.error(`Failed to fetch level ${level + 1} accessories for parent part ${parentPartNumber}:`, err);
    } finally {
      setLoadingState(false);
    }
  };

  // 处理电压选择
  const handleVoltageChange = (voltage: string) => {
    setSelectedVoltage(voltage);
  };

  // 渲染配件导航路径组件
  const renderAccessoryPath = (level: number) => {
    if (level <= 1) return null;
    
    return (
      <div className="accessory-path">
        {Array.from({ length: level - 1 }).map((_, index) => {
          const pathLevel = index + 1;
          const accessoryId = selectedAccessories[`level${pathLevel}`];
          const accessoryName = selectedAccessoryNames[`level${pathLevel}`];
          
          return accessoryId ? (
            <div key={accessoryId} className="accessory-path-item">
              <span className="accessory-path-level">L{pathLevel}:</span>
              <span className="accessory-path-name">{accessoryName || accessoryId}</span>
            </div>
          ) : null;
        })}
      </div>
    );
  };

  // 显示加载中状态
  const showLoading = () => {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip={t('loading')}>
          <div style={{ height: '50px' }} />
        </Spin>
      </div>
    );
  };

  // 显示错误状态
  const showError = () => {
    if (!error) return null;
    
    return (
      <div className="error-container" role="alert" aria-live="assertive">
        <div className="error-icon" aria-hidden="true">
          <ExclamationCircleOutlined />
        </div>
        <div className="error-message">
          <h3>{t('errors.loadingFailed')}</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-retry"
            aria-label={t('retry loading machines')}
          >
            <ReloadOutlined aria-hidden="true" /> {t('retry')}
          </button>
        </div>
      </div>
    );
  };

  // 显示配件部分
  const showAccessoryLevels = () => {
    return (
      <>
        <div id="accessory-level-1" className="accessory-level accessory-level-1" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 一级配件</span></h2>
            <span id="level1-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-1');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
          </div>
          <div className="accessory-content">
            {accessoriesLoading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                  </div>
                </Spin>
              </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map(accessory => renderAccessory(accessory, 1))}
                  {accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div id="accessory-level-2" className="accessory-level accessory-level-2" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 二级配件</span></h2>
            <span id="level2-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-2');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
          </div>
          <div className="accessory-content">
            {renderAccessoryPath(2)}
            
            {level2Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                  </div>
                </Spin>
              </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level2Accessories.map(accessory => renderAccessory(accessory, 2))}
                  {level2Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div id="accessory-level-3" className="accessory-level accessory-level-3" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 三级配件</span></h2>
            <span id="level3-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-3');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
          </div>
          <div className="accessory-content">
            {renderAccessoryPath(3)}
            
            {level3Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                  </div>
                </Spin>
              </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level3Accessories.map(accessory => renderAccessory(accessory, 3))}
                  {level3Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div id="accessory-level-4" className="accessory-level accessory-level-4" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 四级配件</span></h2>
            <span id="level4-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-4');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
          </div>
          <div className="accessory-content">
            {renderAccessoryPath(4)}
            
            {level4Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                  </div>
                </Spin>
              </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level4Accessories.map(accessory => renderAccessory(accessory, 4))}
                  {level4Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        <div id="accessory-level-5" className="accessory-level accessory-level-5" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 五级配件</span></h2>
            <span id="level5-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-5');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
          </div>
          <div className="accessory-content">
            {renderAccessoryPath(5)}
            
            {level5Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                  </div>
                </Spin>
              </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level5Accessories.map(accessory => renderAccessory(accessory, 5))}
                  {level5Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
    );
  };

  // 渲染配件部分
  const renderAccessory = (accessory: MachineAccessory, level: number) => {
    const accessoryPart = accessory.parts?.[0];
    const partSpecs = accessoryPart?.specs;
    const partPrices = accessoryPart?.prices;
    const partInventory = accessoryPart?.inventory;

    return (
      <tr key={accessory.id}>
        <td className="selection-cell">
          <input 
            type="radio" 
            name={`accessory-level-${level}`}
            checked={selectedAccessories[`level${level}`] === accessory.id.toString()}
            onChange={() => handleAccessorySelection(level, accessory.id.toString(), accessory.title)}
          />
        </td>
        <td className="accessory-image-cell">
          <img 
            className="accessory-image" 
            src={accessory.image_url || '/images/placeholder.jpg'} 
            alt={accessory.title}
          />
        </td>
        <td className="accessory-info-cell">
          <div className="accessory-header">
            <span className="accessory-code">{accessory.model}</span>
            <span className="accessory-name">{accessory.title}</span>
          </div>
          <div className="accessory-specs-container">
            {partSpecs && Object.keys(partSpecs).length > 0 ? Object.entries(partSpecs).map(([key, value]: [string, any]) => (
              <span className="accessory-spec-item" key={key}>
                <strong>{key}:</strong> {String(value)}
              </span>
            )) : <p>{t('machines.specsNotAvailable')}</p>}
          </div>
          <div className="more-info-section">
            {/* <a className="specification-link" onClick={() => handleViewAccessory(accessory.id)}>规格详情</a> */}
            {/* Placeholder: Implement accessory detail view or PDF link if available */}
          </div>
        </td>
        {isSales ? (
          <td className="inventory-cell">
            <div className="inventory-status">
              <div className="inventory-regions">
                {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => (
                  <div className="inventory-region" key={regionKey}>
                    <span className="region-label">{REGIONS[regionKey].nameCn}</span>
                    <span className={`region-value ${getStockStatus(partInventory?.find(i => i.region === regionKey)?.amount || 0).className}`}>
                      {partInventory?.find(i => i.region === regionKey)?.amount || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        ) : null}
        <td className="price-cell">
          <div className="price-info">
            <div className="price-title">价格：</div>
            <div className="price-value">
              {getCurrencySymbol(userRegion)}{formatPrice(partPrices?.base || 0)}
            </div>
          </div>
        </td>
        <td className="actions-cell">
          <div className="quantity-selector">
            <button 
              className="qty-btn" 
              onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
              disabled={(quantities[accessory.id.toString()] || 1) <= 1}
            >
              <MinusOutlined />
            </button>
            <input
              type="number"
              min="1"
              value={quantities[accessory.id.toString()] || 1} 
              onChange={(e) => handleQuantityChange(accessory.id.toString(), parseInt(e.target.value) || 1)}
              className="quantity-input"
            />
            <button 
              className="qty-btn"
              onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) + 1)}
            >
              <PlusOutlined />
            </button>
          </div>
          <button onClick={() => handleAddToCart(accessory, 'accessory')} className="btn-add">
            <ShoppingCartOutlined aria-hidden="true" /> 加入购物车
          </button>
        </td>
      </tr>
    );
  };

  // Return the main component JSX
  return (
    <div className="machines-page">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      {renderCartNotification()}
      <div className="machines-filter">
        {/* Filter controls would go here */}
      </div>
      <main id="main-content" className="machines-container" tabIndex={-1}>
        {loading ? showLoading() : error ? showError() : renderMachinesTable()}
      </main>
      {showAccessoryLevels()}
    </div>
  );
};

export default MachinesPage;