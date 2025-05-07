import React, { useEffect, useState } from 'react';
import { Table, Spin, Input, Select, Button, Row, Col, Card, Tag, Typography, Space, message, Image } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { accessoriesMock } from '../../mock/accessoriesMock';
import { AccessoryProduct } from '../../types/accessories';
import './styles.less';

const { Option } = Select;

const AccessoriesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [filteredAccessories, setFilteredAccessories] = useState<AccessoryProduct[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

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
        setAccessories(accessoriesMock);
      } else {
      // In a real app, this would be an API call
        // For now, still using mock data until API implementation
        console.log('Using API for accessories (fallback to mock for now)');
      setAccessories(accessoriesMock);
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
  const handleAddToCart = (record: AccessoryProduct) => {
    message.success(`Added ${record.name_en} to cart`);
    // In a real app, this would add the item to the cart
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
    <div>
      {/* Add your existing code here */}
    </div>
  );
};

export default AccessoriesPage;