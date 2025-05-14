// src/pages/Machines/index.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Spin, message, Button, Select, InputNumber, Tabs, Tag, Popover, Empty } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined, ExclamationCircleOutlined, ReloadOutlined, CloseOutlined, RightOutlined } from '@ant-design/icons';
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
  const [autoLoadedAccessories, setAutoLoadedAccessories] = useState<boolean>(false);
  
  // 使用ref来跟踪上一次选择的机器，避免不必要的重复加载
  const previousMachineRef = useRef<string>('');
  
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
  
  // 当有机器被选中时自动加载其配件
  useEffect(() => {
    if (selectedMachine && !loading && machines.length > 0) {
      // 如果是同一个机器被重复选择，避免重复加载
      if (previousMachineRef.current === selectedMachine) {
        return;
      }
      
      // 更新上一次选择的机器引用
      previousMachineRef.current = selectedMachine;
      
      // 查找选中的机器对象，以获取其part_number
      const selectedMachineObject = machines.find(m => m.id.toString() === selectedMachine);
      
      if (selectedMachineObject) {
        const fetchAccessories = async () => {
          const parentPartNumber = selectedMachineObject.part_number;
          console.log(`[Auto-loading accessories] Loading accessories for machine ${parentPartNumber}`);
          
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
            // 使用找到的parentPartNumber获取配件
            const accessoriesData = await machinesService.getMachineAccessories(parentPartNumber, { level: 1 });
            
            setAccessories(accessoriesData.items);
            setLevel2Accessories([]);
            setLevel3Accessories([]);
            setLevel4Accessories([]);
            setLevel5Accessories([]);
            
            const contextMessage = document.getElementById('level1-context-message');
            if (contextMessage) {
              contextMessage.textContent = `${t('machines.accessory.selectFor')} ${getMachineName(selectedMachineObject)}`;
            }
            
            const level1Div = document.getElementById('accessory-level-1');
            if (level1Div && accessoriesData.items.length > 0) {
              level1Div.style.display = 'block'; // 自动显示一级配件
              setAutoLoadedAccessories(true);
              
              // 显示友好通知消息，但是只在第一次加载时显示
              if (!autoLoadedAccessories) {
                message.info(`已为您自动加载 ${getMachineName(selectedMachineObject)} 的配件`);
              }
            } else if (accessoriesData.items.length === 0) {
              setAutoLoadedAccessories(false);
              message.info(`${getMachineName(selectedMachineObject)} 暂无配件信息`);
            }
          } catch (err: any) {
            console.error('Failed to auto-fetch accessories:', err);
            setAutoLoadedAccessories(false);
          } finally {
            setAccessoriesLoading(false);
          }
        };
        
        fetchAccessories();
      }
    }
  }, [selectedMachine, loading, machines, t, autoLoadedAccessories]);
  
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
            base_price: t.base_price,
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
            { min: 1, max: 4, base_price: accessoryPrices.base },
            { min: 5, max: 9, base_price: accessoryPrices.tier1 },
            { min: 10, max: null, base_price: accessoryPrices.tier2 }
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
    setAutoLoadedAccessories(false); // Reset auto-load flag
    previousMachineRef.current = ''; // Reset previous machine reference
    
    // The rest of the accessory loading is now handled by the useEffect hook that watches selectedMachine
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
      <div className="grid grid-cols-1 gap-4">
        {filteredMachines.map(machine => (
          <div 
            key={machine.id} 
            className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-border text-content"
          >
            <div className="flex flex-col md:flex-row p-4">
              {/* Column 1: Image & Selection */}
              <div className="w-full md:w-1/6 flex flex-col items-center md:items-start mb-4 md:mb-0">
                <img 
                  src={machine.image_url || '/images/placeholder.jpg'} 
                  alt={getMachineName(machine)}
                  className="w-24 h-24 object-contain mb-3 border border-border rounded bg-card-alt p-1"
                />
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="machine" 
                    className="form-radio text-primary"
                    checked={selectedMachine === machine.id.toString()}
                    onChange={() => handleMachineSelection(machine.id)}
                    aria-label={`${t('machines.tableHeaders.selection')} ${getMachineName(machine)}`}
                  />
                  <span className="ml-2 text-sm text-content-light">选择</span>
                </label>
              </div>

              {/* Column 2: Info & Specs */}
              <div className="w-full md:w-3/6 md:px-4">
                <div className="mb-1">
                  <span className="inline-block bg-primary text-white px-2 py-1 text-xs font-bold rounded">{machine.part_number}</span>
                  <h3 className="text-lg font-semibold text-title mt-1">{getMachineName(machine)}</h3>
                  <div className="text-sm text-content-light">
                    {machine.model && <span className="mr-2">({machine.model})</span>}
                    {machine.model_type && <span>{machine.model_type}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 my-2">
                  {machine.voltage && (
                    <span className="inline-flex items-center px-2 py-1 bg-background rounded text-xs">
                      <strong className="text-label mr-1">电压:</strong> 
                      <span className="text-content">{machine.voltage}</span>
                    </span>
                  )}
                  {machine.spec && (
                    <span className="inline-flex items-center px-2 py-1 bg-background rounded text-xs">
                      <strong className="text-label mr-1">规格:</strong> 
                      <span className="text-content">{machine.spec}</span>
                    </span>
                  )}
                </div>

                <div className="bg-card-alt rounded-md p-3 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex">
                      <strong className="w-20 text-label">料号:</strong>
                      <span className="text-content">{machine.part_number}</span>
                    </div>
                    <div className="flex">
                      <strong className="w-20 text-label">型号:</strong>
                      <span className="text-content">{machine.model}</span>
                    </div>
                    <div className="flex">
                      <strong className="w-20 text-label">电压:</strong>
                      <span className="text-content">{machine.voltage || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <strong className="w-20 text-label">规格:</strong>
                      <span className="text-content">{machine.spec || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <strong className="w-20 text-label">规格(英制):</strong>
                      <span className="text-content">{machine.spec_imperial || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <strong className="w-20 text-label">每箱数量:</strong>
                      <span className="text-content">{machine.pcs_per_box !== null && machine.pcs_per_box !== undefined ? machine.pcs_per_box : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button 
                    size="small"
                    icon={<InfoCircleOutlined />}
                    onClick={() => handleViewDetails(machine.id.toString())}
                    className="bg-secondary-light text-secondary hover:bg-secondary"
                  >
                    规格详情
                  </Button>
                  
                  <Popover
                    title={`${getMachineName(machine)} - 详细信息`}
                    content={
                      <div className="max-w-xs">
                        {userRegion === 'US' || userRegion === 'UK' ? (
                          <>
                            <p><strong>包装尺寸 inch:</strong> {machine.package_size_inch || 'N/A'}</p>
                            <p><strong>单件净重 lbs:</strong> {machine.net_weight_lbs !== null ? machine.net_weight_lbs : 'N/A'}</p>
                            <p><strong>打托高度 inch:</strong> {machine.pallet_height_inch || 'N/A'}</p>
                            <p><strong>整托毛重 lbs:</strong> {machine.pallet_gross_weight_lbs || 'N/A'}</p>
                          </>
                        ) : (
                          <>
                            <p><strong>包装尺寸 cm:</strong> {machine.package_size_cm || 'N/A'}</p>
                            <p><strong>单件净重 kg:</strong> {machine.net_weight_kg !== null ? machine.net_weight_kg : 'N/A'}</p>
                            <p><strong>打托高度 cm:</strong> {machine.pallet_height_cm || 'N/A'}</p>
                            <p><strong>整托毛重 kg:</strong> {machine.pallet_gross_weight_kg || 'N/A'}</p>
                          </>
                        )}
                      </div>
                    }
                    trigger="hover"
                  >
                    <Button 
                      size="small"
                      icon={<InfoCircleOutlined />}
                      className="bg-accent-light text-accent hover:bg-accent"
                    >
                      更多信息
                    </Button>
                  </Popover>
                </div>
              </div>

              {/* Column 3: Price, Stock, Actions */}
              <div className="w-full md:w-2/6 md:pl-4 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div className="mb-3">
                  <div className="font-medium text-xs text-label mb-1">
                    价格 ({getCurrencySymbol(userRegion)}):
                  </div>
                  
                  <div className="text-lg font-bold text-price">
                    {getCurrencySymbol(userRegion)}{formatPrice((machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0) ? machine.prices[0].tiers[0].base_price : 0)}
                  </div>
                  
                  {machine.prices && machine.prices.length > 0 && machine.prices[0].tiers && machine.prices[0].tiers.length > 0 && (
                    <div className="text-xs text-content-light mt-1">
                      {machine.prices[0].tiers.map((tier, index) => (
                        <div key={index}>
                          {getCurrencySymbol(userRegion)}{formatPrice(tier.base_price)} ({tier.min_quantity}-{tier.max_quantity || '+'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {isSales && (
                  <div className="mb-3">
                    <div className="font-medium text-xs text-label mb-1">
                      库存:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(REGIONS) as Array<keyof typeof REGIONS>).map((regionKey) => (
                        <Tag 
                          key={regionKey}
                          color={getStockStatus(getRegionInventory(machine, regionKey)).colorClass}
                        >
                          {REGIONS[regionKey].nameCn}: {getRegionInventory(machine, regionKey)}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Button 
                      icon={<MinusOutlined />}
                      onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) - 1)}
                      disabled={(quantities[machine.id.toString()] || 1) <= 1}
                      size="small"
                      className="border-border bg-button text-content hover:border-primary"
                    />
                    <InputNumber
                      min={1}
                      value={quantities[machine.id.toString()] || 1}
                      onChange={(value) => handleQuantityChange(machine.id.toString(), value as number)}
                      className="w-16 text-center bg-input border-border text-content focus:border-primary"
                      size="small"
                    />
                    <Button 
                      icon={<PlusOutlined />}
                      onClick={() => handleQuantityChange(machine.id.toString(), (quantities[machine.id.toString()] || 1) + 1)}
                      size="small"
                      className="border-border bg-button text-content hover:border-primary"
                    />
                  </div>
                  
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(machine, 'machine')}
                    className="w-full bg-primary hover:bg-primary-dark text-white"
                  >
                    {t('buttons.addToCart')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
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

  // 渲染配件路径导航
  const renderAccessoryPath = (level: number) => {
    // 只有二级及以上配件才需要显示路径
    if (level < 2) return null;
    
    const pathItems = [];
    
    // 添加主机
    if (selectedMachine) {
      const machine = machines.find(m => m.id.toString() === selectedMachine);
      if (machine) {
        pathItems.push(
          <div key="machine" className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-background rounded mr-1">主机</span>
            <span className="text-content">{getMachineName(machine)}</span>
          </div>
        );
      }
    }
    
    // 添加各级配件
    for (let i = 1; i < level; i++) {
      const accessoryId = selectedAccessories[`level${i}`];
      const accessoryName = selectedAccessoryNames[`level${i}`];
      
      if (accessoryId && accessoryName) {
        pathItems.push(
          <div key={`accessory-${i}`} className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-background rounded mr-1">{i}级配件</span>
            <span className="text-content">{accessoryName}</span>
          </div>
        );
      }
    }
    
    return (
      <div className="bg-card p-3 rounded-lg shadow-sm mb-4 flex flex-wrap items-center border border-border transition-colors duration-300">
        {pathItems.map((item, index) => (
          <React.Fragment key={`path-item-${index}`}>
            {item}
            {index < pathItems.length - 1 && (
              <span className="mx-2 text-content-light">
                <RightOutlined style={{ fontSize: '10px' }} />
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // 显示加载状态
  const showLoading = () => {
    return (
      <div className="flex justify-center items-center p-16 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
        <Spin tip={t('loading.machines')} size="large">
          <div className="p-16 text-content"></div>
        </Spin>
      </div>
    );
  };

  // 显示错误状态
  const showError = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-md border border-border transition-all duration-300">
        <ExclamationCircleOutlined className="text-error text-4xl mb-4" />
        <h3 className="text-lg font-semibold text-title mb-2">
          {t('errors.loadingFailed')}
        </h3>
        <p className="text-content mb-4 text-center max-w-md">
          {error || t('errors.systemError')}
        </p>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary-dark border-none"
        >
          {t('buttons.retry')}
        </Button>
      </div>
    );
  };

  // 显示配件部分
  const showAccessoryLevels = () => {
    return (
      <>
        <div id="accessory-level-1" className="accessory-level accessory-level-1 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded">一级配件</span>
              </h2>
              <span id="level1-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-1');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {accessoriesLoading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <Spin tip="加载配件中...">
                  <div className="p-12 text-content"></div>
                </Spin>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {accessories.map(accessory => renderAccessory(accessory, 1))}
                {accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <Empty description={<span className="text-content-light">无可用配件</span>} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-2" className="accessory-level accessory-level-2 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-white rounded">二级配件</span>
              </h2>
              <span id="level2-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-2');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(2)}
            
            {level2Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <Spin tip="加载配件中...">
                  <div className="p-12 text-content"></div>
                </Spin>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {level2Accessories.map(accessory => renderAccessory(accessory, 2))}
                {level2Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <Empty description={<span className="text-content-light">无可用配件</span>} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-3" className="accessory-level accessory-level-3 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-accent text-white rounded">三级配件</span>
              </h2>
              <span id="level3-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-3');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(3)}
            
            {level3Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <Spin tip="加载配件中...">
                  <div className="p-12 text-content"></div>
                </Spin>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {level3Accessories.map(accessory => renderAccessory(accessory, 3))}
                {level3Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <Empty description={<span className="text-content-light">无可用配件</span>} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-4" className="accessory-level accessory-level-4 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-warning text-white rounded">四级配件</span>
              </h2>
              <span id="level4-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-4');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(4)}
            
            {level4Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <Spin tip="加载配件中...">
                  <div className="p-12 text-content"></div>
                </Spin>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {level4Accessories.map(accessory => renderAccessory(accessory, 4))}
                {level4Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <Empty description={<span className="text-content-light">无可用配件</span>} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div id="accessory-level-5" className="accessory-level accessory-level-5 mt-6" style={{display: 'none'}}>
          <div className="bg-card rounded-lg shadow-md p-4 mb-4 flex justify-between items-center border border-border transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold flex items-center text-title">
                配件选择 
                <span className="ml-2 px-2 py-0.5 text-xs bg-error text-white rounded">五级配件</span>
              </h2>
              <span id="level5-context-message" className="text-sm text-content-light"></span>
            </div>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => {
                const accessoryDiv = document.getElementById('accessory-level-5');
                if (accessoryDiv) accessoryDiv.style.display = 'none';
              }}
              className="bg-button text-content border-border hover:bg-button-hover"
            >
              关闭
            </Button>
          </div>
          
          <div className="accessory-content">
            {renderAccessoryPath(5)}
            
            {level5Loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg shadow-md border border-border transition-colors duration-300">
                <Spin tip="加载配件中...">
                  <div className="p-12 text-content"></div>
                </Spin>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {level5Accessories.map(accessory => renderAccessory(accessory, 5))}
                {level5Accessories.length === 0 && (
                  <div className="bg-card-alt p-12 text-center rounded-lg border border-border">
                    <Empty description={<span className="text-content-light">无可用配件</span>} />
                  </div>
                )}
              </div>
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
      <div key={accessory.id} className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-border text-content mb-3">
        <div className="flex flex-col md:flex-row p-4">
          {/* Column 1: Image & Selection */}
          <div className="w-full md:w-1/6 flex flex-col items-center md:items-start mb-4 md:mb-0">
            <img 
              src={accessory.image_url || '/images/placeholder.jpg'} 
              alt={accessory.title}
              className="w-24 h-24 object-contain mb-3 border border-border rounded bg-card-alt p-1"
            />
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="radio" 
                name={`accessory-level-${level}`}
                className="form-radio text-primary"
                checked={selectedAccessories[`level${level}`] === accessory.id.toString()}
                onChange={() => handleAccessorySelection(level, accessory.id.toString(), accessory.title)}
              />
              <span className="ml-2 text-sm text-content-light">选择</span>
            </label>
          </div>

          {/* Column 2: Info & Specs */}
          <div className="w-full md:w-3/6 md:px-4">
            <div className="mb-1">
              <span className="inline-block bg-primary text-white px-2 py-1 text-xs font-bold rounded">{accessory.model}</span>
              <h3 className="text-lg font-semibold text-title mt-1">{accessory.title}</h3>
            </div>

            <div className="bg-card-alt rounded-md p-3 mt-2">
              <div className="flex flex-wrap gap-2">
                {partSpecs && Object.keys(partSpecs).length > 0 ? Object.entries(partSpecs).map(([key, value]: [string, any], index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-background rounded text-xs">
                    <strong className="text-label mr-1">{key}:</strong> 
                    <span className="text-content">{String(value)}</span>
                  </span>
                )) : <p className="text-sm text-content-light">{t('machines.specsNotAvailable')}</p>}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button 
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => handleViewAccessory(accessory.id)}
                className="bg-secondary-light text-secondary hover:bg-secondary"
              >
                规格详情
              </Button>
            </div>
          </div>

          {/* Column 3: Price, Stock, Actions */}
          <div className="w-full md:w-2/6 md:pl-4 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            {/* Price */}
            <div className="mb-3">
              <div className="font-medium text-xs text-label mb-1">
                价格:
              </div>
              
              <div className="text-lg font-bold text-price">
                {getCurrencySymbol(userRegion)}{formatPrice(partPrices?.base || 0)}
              </div>
            </div>
            
            {/* Inventory (Sales View) */}
            {isSales && partInventory && partInventory.length > 0 && (
              <div className="mb-3">
                <div className="font-medium text-xs text-label mb-1">
                  库存:
                </div>
                <div className="flex flex-wrap gap-1">
                  {partInventory.map((inv, index) => (
                    <Tag 
                      key={index}
                      color={getStockStatus(inv.amount).colorClass}
                    >
                      {inv.region}: {inv.amount}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  icon={<MinusOutlined />}
                  onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) - 1)}
                  disabled={(quantities[accessory.id.toString()] || 1) <= 1}
                  size="small"
                  className="border-border bg-button text-content hover:border-primary"
                />
                <InputNumber
                  min={1}
                  value={quantities[accessory.id.toString()] || 1}
                  onChange={(value) => handleQuantityChange(accessory.id.toString(), value as number)}
                  className="w-16 text-center bg-input border-border text-content focus:border-primary"
                  size="small"
                />
                <Button 
                  icon={<PlusOutlined />}
                  onClick={() => handleQuantityChange(accessory.id.toString(), (quantities[accessory.id.toString()] || 1) + 1)}
                  size="small"
                  className="border-border bg-button text-content hover:border-primary"
                />
              </div>
              
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleAddToCart(accessory, 'accessory')}
                className="w-full bg-primary hover:bg-primary-dark text-white"
              >
                {t('buttons.addToCart')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Return the main component JSX
  return (
    <div className="p-4 md:p-6 bg-background min-h-screen transition-colors duration-300">
      <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
      {renderCartNotification()}
      
      {/* Filter Section */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6 text-content border border-border transition-colors duration-300">
        <h1 className="text-xl font-bold mb-4 text-title">{t('machines.pageTitle')}</h1>
        
        <div className="flex flex-wrap gap-4">
          {/* Voltage Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {t('machines.filters.voltage')}
            </label>
            <Select
              value={selectedVoltage}
              onChange={handleVoltageChange}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={[
                { value: '220V', label: '220V' },
                { value: '110V', label: '110V' }
              ]}
            />
          </div>
          
          {/* Region Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {t('machines.filters.region')}
            </label>
            <Select
              value={filterRegion}
              onChange={(value) => setFilterRegion(value)}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={Object.keys(REGIONS).map(key => ({
                value: key,
                label: REGIONS[key as keyof typeof REGIONS].nameCn
              }))}
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-label">
              {t('machines.filters.type')}
            </label>
            <Select
              value={filterType}
              onChange={(value) => setFilterType(value)}
              style={{ width: 120 }}
              className="bg-input text-content border-border hover:border-primary"
              options={[
                { value: 'all', label: t('machines.filters.all') },
                { value: 'small', label: t('machines.filters.small') },
                { value: 'medium', label: t('machines.filters.medium') },
                { value: 'large', label: t('machines.filters.large') }
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main id="main-content" className="mb-8" tabIndex={-1}>
        {loading ? showLoading() : error ? showError() : renderMachinesTable()}
      </main>
      
      {/* Accessories Sections */}
      {showAccessoryLevels()}
    </div>
  );
};

export default MachinesPage;