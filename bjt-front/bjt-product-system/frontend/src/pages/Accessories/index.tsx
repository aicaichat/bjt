import React, { useEffect, useState } from 'react';
import { Table, Spin, Input, Select, Button, Row, Col, Card, Tag, Typography, Space, message, Image } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { accessoriesMock } from '../../mock/accessoriesMock';
import { AccessoryProduct } from '../../types/accessories';
import { RequiredPartsDisplay } from '../../components/RequiredPartsDisplay';
import { useCart } from '../../contexts/CartContext';
import { fetchRequiredPartsFullInfo, createRequiredPartCartItem, parseRequiredParts } from '../../utils/requiredPartsUtils';
import './styles.less';

const { Option } = Select;

const AccessoriesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [filteredAccessories, setFilteredAccessories] = useState<AccessoryProduct[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // 使用购物车上下文
  const { addItem } = useCart();

  // Fetch accessories on component mount
  useEffect(() => {
    fetchAccessories();
  }, []);

  // Filter accessories when search criteria changes
  useEffect(() => {
    filterAccessories();
  }, [accessories, searchText, selectedType, selectedModel]);

  // Function to fetch accessories (using mock data for now)
  const fetchAccessories = async () => {
    setLoading(true);
    try {
      // Check if we should use mock data
      if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        console.log('Using mock data for accessories');
        // setAccessories(accessoriesMock);
        setAccessories([]); // 临时使用空数组，直到mock文件可用
      } else {
      // In a real app, this would be an API call
        // For now, still using mock data until API implementation
        console.log('Using API for accessories (fallback to mock for now)');
        setAccessories([]);
        // TODO: Replace with actual API call when available
        // const response = await axios.get('/api/accessories');
        // setAccessories(response.data);
      }
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch accessories');
      setLoading(false);
    }
  };

  // Function to filter accessories based on search criteria
  const filterAccessories = () => {
    let filtered = [...accessories];
    
    if (searchText) {
      filtered = filtered.filter(
        item => 
          item.name.toLowerCase().includes(searchText.toLowerCase()) || 
          item.name_en.toLowerCase().includes(searchText.toLowerCase()) ||
          item.code.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter(item => item.type === selectedType);
    }
    
    if (selectedModel) {
      filtered = filtered.filter(item => item.model === selectedModel);
    }
    
    setFilteredAccessories(filtered);
  };

  // Get unique types for filter dropdown
  const getUniqueTypes = () => {
    const types = [...new Set(accessories.map(item => item.type))];
    return types;
  };

  // Get unique models for filter dropdown
  const getUniqueModels = () => {
    const models = [...new Set(accessories.map(item => item.model))];
    return models;
  };

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle type selection change
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  // Handle model selection change
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  // Handle add to cart button click
  const handleAddToCart = async (record: AccessoryProduct) => {
    try {
      // 1. 添加主配件到购物车
      const mainCartItem = {
        id: record.id,
        name: record.name,
        name_zh: record.name,
        name_en: record.name_en,
        part_number: record.part_number,
        code: record.code,
        partNumber: record.part_number,
        image: record.image_url,
        image_url: record.image_url,
        category: 'accessory',
        product_type: 'accessory',
        productId: parseInt(record.id),
        product_id: parseInt(record.id),
        item_id: parseInt(record.id),
        quantity: 1,
        unit_price: record.prices?.current || 0,
        price: record.prices?.current || 0,
        priceTiers: [],
        selected: false,
        type: 'accessory' as const,
        specs: {
          partNumber: record.part_number,
          productName: record.name
        },
        properties: {
          spec: record.spec,
          spec_imperial: record.spec_imperial,
          model: record.model,
          type: record.type,
          brand: record.brand,
          voltage: record.voltage,
          frequency: record.frequency
        }
      };

      await addItem(mainCartItem);
      
      // 2. 检查并添加必选备件
      if (record.required_parts && record.required_quantity) {
        await addRequiredPartsToCart(record, 1);
      }
      
      message.success(`Added ${record.name_en} to cart`);
    } catch (error) {
      console.error('Failed to add accessory to cart:', error);
      message.error('Failed to add item to cart');
    }
  };

  // 添加必选备件到购物车
  const addRequiredPartsToCart = async (mainAccessory: AccessoryProduct, mainQuantity: number) => {
    if (!mainAccessory.required_parts || !mainAccessory.required_quantity) {
      console.log('📝 [addRequiredPartsToCart] No required parts found');
      return;
    }

    console.log('📋 [addRequiredPartsToCart] Processing required parts for:', {
      part_number: mainAccessory.part_number,
      required_parts: mainAccessory.required_parts,
      required_quantity: mainAccessory.required_quantity,
      mainQuantity
    });

    try {
      // 获取必选备件的完整信息
      const requiredPartsFullInfo = await fetchRequiredPartsFullInfo(
        mainAccessory.required_parts,
        mainAccessory.required_quantity,
        mainAccessory.part_number
      );

      console.log('📦 [addRequiredPartsToCart] Fetched required parts full info:', requiredPartsFullInfo);

      const addedParts = [];
      const failedParts = [];

      // 添加每个必选备件到购物车
      for (const requiredPart of requiredPartsFullInfo) {
        try {
          const totalQuantity = requiredPart.quantity * mainQuantity;
          const cartItem = createRequiredPartCartItem(requiredPart, totalQuantity);
          
          await addItem(cartItem);
          addedParts.push(requiredPart.part_number);
          console.log(`➕ [addRequiredPartsToCart] Added required part: ${requiredPart.part_number}`);
        } catch (error) {
          failedParts.push(requiredPart.part_number);
          console.error(`❌ [addRequiredPartsToCart] Failed to add required part ${requiredPart.part_number}:`, error);
        }
      }

      if (addedParts.length > 0) {
        console.log('✅ [addRequiredPartsToCart] Successfully added required parts:', addedParts);
      }

      if (failedParts.length > 0) {
        console.warn('⚠️ [addRequiredPartsToCart] Failed to add some required parts:', failedParts);
      }
    } catch (error) {
      console.error('❌ [addRequiredPartsToCart] Error processing required parts:', error);
    }
  };

  // Handle view details button click
  const handleViewDetails = (record: AccessoryProduct) => {
    message.info(`Viewing details for ${record.name_en}`);
    // In a real app, this would navigate to the details page
  };

  // Get inventory status tag
  const getInventoryTag = (inventory: number) => {
    if (inventory > 100) {
      return <Tag color="green">In Stock</Tag>;
    } else if (inventory > 0) {
      return <Tag color="orange">Limited Stock</Tag>;
    } else {
      return <Tag color="red">Out of Stock</Tag>;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Image',
      dataIndex: 'image_url',
      key: 'image',
      width: 100,
      render: (url: string) => (
        <Image 
          src={url} 
          alt="Accessory" 
          width={80} 
          height={80}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Required Parts',
      key: 'required_parts',
      width: 300,
      render: (_: any, record: AccessoryProduct) => (
        <RequiredPartsDisplay
          requiredParts={record.required_parts}
          requiredQuantity={record.required_quantity}
          language="en"
        />
      ),
    },
    {
      title: 'Inventory',
      dataIndex: 'inventory',
      key: 'inventory',
      render: getInventoryTag,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: AccessoryProduct) => (
        <Space>
          <Button type="primary" onClick={() => handleAddToCart(record)}>
            Add to Cart
          </Button>
          <Button type="primary" onClick={() => handleViewDetails(record)}>
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="accessories-page" style={{ padding: '24px' }}>
      <Typography.Title level={2}>Accessories</Typography.Title>
      
      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Search accessories..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Select Type"
              style={{ width: '100%' }}
              value={selectedType}
              onChange={handleTypeChange}
              allowClear
            >
              {getUniqueTypes().map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Select Model"
              style={{ width: '100%' }}
              value={selectedModel}
              onChange={handleModelChange}
              allowClear
            >
              {getUniqueModels().map(model => (
                <Option key={model} value={model}>{model}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredAccessories}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} accessories`,
          }}
        />
      </Card>
    </div>
  );
};

export default AccessoriesPage;