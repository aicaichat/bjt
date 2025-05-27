import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Space, Input, Select, message, Card, Tabs
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import ImportExportButtons from '../../components/common/ImportExportButtons';
import { useAdminApi } from '../../hooks/useAdminApi';
import { accessoryModelService, accessoryService, AccessoryModel, Accessory } from '../../services/admin-accessory.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { Search } = Input;

const AccessoriesPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态变量
  const [activeTab, setActiveTab] = useState<string>('models');
  const [selectedLanguage, setSelectedLanguage] = useState<'zh' | 'en'>('zh');
  const [selectedRegion, setSelectedRegion] = useState<'CN' | 'EU' | 'NA' | 'AU' | undefined>(undefined);
  
  // 获取产品线列表
  const {
    data: productLineData,
    loading: productLineLoading
  } = useAdminApi(
    adminProductLineService.getProductLines.bind(adminProductLineService),
    {
      page: 1,
      per_page: 100,
      status: 'publish'
    }
  );
  
  // 使用useMemo稳定参数对象引用，避免无限循环
  const modelParams = useMemo(() => ({
    page: 1,
    per_page: 10,
    lang: selectedLanguage,
    region: selectedRegion
  }), [selectedLanguage, selectedRegion]);
  
  const accessoryParams = useMemo(() => ({
    page: 1,
    per_page: 10,
    lang: selectedLanguage,
    region: selectedRegion
  }), [selectedLanguage, selectedRegion]);
  
  // 获取配件型号列表
  const {
    data: modelData,
    loading: modelLoading,
    updateParams: updateModelParams,
    refetch: refetchModels
  } = useAdminApi(
    accessoryModelService.getAccessoryModels.bind(accessoryModelService),
    modelParams
  );
  
  // 获取配件料号列表
  const {
    data: accessoryData,
    loading: accessoryLoading,
    updateParams: updateAccessoryParams,
    refetch: refetchAccessories
  } = useAdminApi(
    accessoryService.getAccessories.bind(accessoryService),
    accessoryParams
  );
  
  // 处理语言切换
  const handleLanguageChange = (value: 'zh' | 'en') => {
    setSelectedLanguage(value);
  };
  
  // 处理区域切换
  const handleRegionChange = (value: 'CN' | 'EU' | 'NA' | 'AU' | undefined) => {
    setSelectedRegion(value);
  };
  
  // 处理配件型号表格分页
  const handleModelTableChange = (pagination: any) => {
    updateModelParams({
      page: pagination.current,
      per_page: pagination.pageSize
    });
  };
  
  // 处理配件料号表格分页
  const handleAccessoryTableChange = (pagination: any) => {
    updateAccessoryParams({
      page: pagination.current,
      per_page: pagination.pageSize
    });
  };
  
  // 删除配件型号
  const handleDeleteModel = async (id: number) => {
    try {
      await accessoryModelService.deleteAccessoryModel(id);
      message.success('配件型号删除成功');
      refetchModels();
    } catch (error) {
      message.error('配件型号删除失败');
    }
  };
  
  // 删除配件料号
  const handleDeleteAccessory = async (id: number) => {
    try {
      await accessoryService.deleteAccessory(id);
      message.success('配件料号删除成功');
      refetchAccessories();
    } catch (error) {
      message.error('配件料号删除失败');
    }
  };
  
  // 配件型号表格列配置 - 显示完整数据库字段
  const modelColumns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '型号编码',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: '中文名称',
      dataIndex: 'title_zh',
      key: 'title_zh',
      width: 200,
    },
    {
      title: '英文名称',
      dataIndex: 'title_en',
      key: 'title_en',
      width: 200,
    },
    {
      title: '配件类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '中文描述',
      dataIndex: 'description_zh',
      key: 'description_zh',
      width: 200,
      ellipsis: true,
    },
    {
      title: '英文描述',
      dataIndex: 'description_en',
      key: 'description_en',
      width: 200,
      ellipsis: true,
    },
    {
      title: '主图',
      dataIndex: 'image1_url',
      key: 'image1_url',
      width: 100,
      render: (url: string) => url ? (
        <img src={url} alt="主图" style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: '副图',
      dataIndex: 'image2_url',
      key: 'image2_url',
      width: 100,
      render: (url: string) => url ? (
        <img src={url} alt="副图" style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: '已发布', color: 'green' },
          draft: { text: '草稿', color: 'orange' },
          trash: { text: '已删除', color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: '未知', color: 'gray' };
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: AccessoryModel) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/accessories/models/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteModel(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];
  
  // 配件料号表格列配置 - 显示完整数据库字段
  const accessoryColumns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '料号',
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
    },
    {
      title: '中文名称',
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 200,
    },
    {
      title: '英文名称',
      dataIndex: 'name_en',
      key: 'name_en',
      width: 200,
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: '公制规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 150,
      ellipsis: true,
    },
    {
      title: '英制规格',
      dataIndex: 'spec_imperial',
      key: 'spec_imperial',
      width: 150,
      ellipsis: true,
    },
    {
      title: '电压',
      dataIndex: 'voltage',
      key: 'voltage',
      width: 80,
    },
    {
      title: '频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 80,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '单箱数量',
      dataIndex: 'pcs_per_box',
      key: 'pcs_per_box',
      width: 100,
    },
    {
      title: '净重(kg)',
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 100,
    },
    {
      title: '净重(lbs)',
      dataIndex: 'net_weight_lbs',
      key: 'net_weight_lbs',
      width: 100,
    },
    {
      title: '包装毛重(kg)',
      dataIndex: 'gross_weight_kg',
      key: 'gross_weight_kg',
      width: 120,
    },
    {
      title: '包装毛重(lbs)',
      dataIndex: 'gross_weight_lbs',
      key: 'gross_weight_lbs',
      width: 120,
    },
    {
      title: '一托数量',
      dataIndex: 'pcs_per_pallet',
      key: 'pcs_per_pallet',
      width: 100,
    },
    {
      title: '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => url ? (
        <img src={url} alt="产品图片" style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: '已发布', color: 'green' },
          draft: { text: '草稿', color: 'orange' },
          trash: { text: '已删除', color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: '未知', color: 'gray' };
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Accessory) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/accessories/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAccessory(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];
  
  // 渲染配件型号表格
  const renderAccessoryModelsTable = () => {
    return (
      <>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Select
              placeholder="选择语言"
              value={selectedLanguage}
              style={{ width: 120 }}
              onChange={handleLanguageChange}
            >
              <Option value="zh">中文</Option>
              <Option value="en">English</Option>
            </Select>
            <Select
              placeholder="选择区域"
              allowClear
              value={selectedRegion}
              style={{ width: 150 }}
              onChange={handleRegionChange}
            >
              <Option value="CN">中国</Option>
              <Option value="EU">欧洲</Option>
              <Option value="NA">北美</Option>
              <Option value="AU">澳洲</Option>
            </Select>
          </Space>
          <Space>
            <ImportExportButtons
              onImport={async (file) => {
                message.info(`导入文件: ${file.name}`);
                // TODO: 实现导入功能
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info('导出配件型号数据');
                // TODO: 实现导出功能
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/accessories/models/create')}
            >
              新增型号
            </Button>
          </Space>
        </div>
        
        <Table
          columns={modelColumns}
          dataSource={modelData?.items || []}
          rowKey="id"
          loading={modelLoading}
          scroll={{ x: 1800 }}
          pagination={{
            current: modelData?.page || 1,
            pageSize: modelData?.page_size || 10,
            total: modelData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条记录`,
          }}
          onChange={handleModelTableChange}
        />
      </>
    );
  };
  
  // 渲染配件料号表格
  const renderAccessoriesTable = () => {
    return (
      <>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Select
              placeholder="选择语言"
              value={selectedLanguage}
              style={{ width: 120 }}
              onChange={handleLanguageChange}
            >
              <Option value="zh">中文</Option>
              <Option value="en">English</Option>
            </Select>
            <Select
              placeholder="选择区域"
              allowClear
              value={selectedRegion}
              style={{ width: 150 }}
              onChange={handleRegionChange}
            >
              <Option value="CN">中国</Option>
              <Option value="EU">欧洲</Option>
              <Option value="NA">北美</Option>
              <Option value="AU">澳洲</Option>
            </Select>
          </Space>
          <Space>
            <ImportExportButtons
              onImport={async (file) => {
                message.info(`导入文件: ${file.name}`);
                // TODO: 实现导入功能
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info('导出配件料号数据');
                // TODO: 实现导出功能
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/accessories/create')}
            >
              新增料号
            </Button>
          </Space>
        </div>
        
        <Table
          columns={accessoryColumns}
          dataSource={accessoryData?.items || []}
          rowKey="id"
          loading={accessoryLoading}
          scroll={{ x: 2400 }}
          pagination={{
            current: accessoryData?.page || 1,
            pageSize: accessoryData?.page_size || 10,
            total: accessoryData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条记录`,
          }}
          onChange={handleAccessoryTableChange}
        />
      </>
    );
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title="配件管理"
      />
      
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'models',
              label: '配件型号',
              children: renderAccessoryModelsTable()
            },
            {
              key: 'accessories',
              label: '配件料号',
              children: renderAccessoriesTable()
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default AccessoriesPage; 