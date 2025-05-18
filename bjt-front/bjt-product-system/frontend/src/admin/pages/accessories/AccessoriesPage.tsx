import React, { useState } from 'react';
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
  const [modelSearchText, setModelSearchText] = useState<string>('');
  const [accessorySearchText, setAccessorySearchText] = useState<string>('');
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>(undefined);
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined);
  
  // 获取产品线列表
  const {
    data: productLineData,
    loading: productLineLoading
  } = useAdminApi(
    adminProductLineService.getProductLines.bind(adminProductLineService),
    {
      page: 1,
      page_size: 100,
      status: 'publish'
    }
  );
  
  // 获取配件型号列表
  const {
    data: accessoryModelData,
    loading: accessoryModelLoading,
    updateParams: updateModelParams,
    refetch: refetchModels
  } = useAdminApi(
    accessoryModelService.getAccessoryModels.bind(accessoryModelService),
    {
      page: 1,
      page_size: 10,
      search: modelSearchText,
      product_line_id: selectedProductLineId
    },
    [modelSearchText, selectedProductLineId]
  );
  
  // 获取配件料号列表
  const {
    data: accessoryData,
    loading: accessoryLoading,
    updateParams: updateAccessoryParams,
    refetch: refetchAccessories
  } = useAdminApi(
    accessoryService.getAccessories.bind(accessoryService),
    {
      page: 1,
      page_size: 10,
      search: accessorySearchText,
      model_id: selectedModelId,
      product_line_id: selectedProductLineId
    },
    [accessorySearchText, selectedModelId, selectedProductLineId]
  );
  
  // 处理配件型号搜索
  const handleModelSearch = (value: string) => {
    setModelSearchText(value);
  };
  
  // 处理配件料号搜索
  const handleAccessorySearch = (value: string) => {
    setAccessorySearchText(value);
  };
  
  // 处理产品线选择
  const handleProductLineChange = (value: number | undefined) => {
    setSelectedProductLineId(value);
  };
  
  // 处理配件型号选择
  const handleModelChange = (value: number | undefined) => {
    setSelectedModelId(value);
  };
  
  // 处理配件型号表格分页
  const handleModelTableChange = (pagination: any) => {
    updateModelParams({
      page: pagination.current,
      page_size: pagination.pageSize
    });
  };
  
  // 处理配件料号表格分页
  const handleAccessoryTableChange = (pagination: any) => {
    updateAccessoryParams({
      page: pagination.current,
      page_size: pagination.pageSize
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
  
  // 配件型号表格列配置
  const modelColumns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '型号名称',
      dataIndex: 'model',
      key: 'model',
      width: 180,
    },
    {
      title: '产品线',
      dataIndex: 'product_line_name',
      key: 'product_line_name',
      width: 150,
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
  
  // 配件料号表格列配置
  const accessoryColumns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '型号',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 120,
    },
    {
      title: '料号',
      dataIndex: 'pn',
      key: 'pn',
      width: 150,
    },
    {
      title: '名称',
      key: 'name',
      render: (_: any, record: Accessory) => (
        <div>
          <div>{record.name.zh}</div>
          <div className="text-gray-500 text-sm">{record.name.en}</div>
        </div>
      ),
    },
    {
      title: '产品线',
      dataIndex: 'product_line_name',
      key: 'product_line_name',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
            <Search
              placeholder="搜索型号名称"
              allowClear
              onSearch={handleModelSearch}
              style={{ width: 200 }}
            />
            <Select
              placeholder="选择产品线"
              allowClear
              style={{ width: 200 }}
              onChange={handleProductLineChange}
              loading={productLineLoading}
            >
              {productLineData?.items?.map((productLine: any) => (
                <Option key={productLine.id} value={productLine.id}>{productLine.title.zh}</Option>
              ))}
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
          dataSource={accessoryModelData?.items || []}
          rowKey="id"
          loading={accessoryModelLoading}
          pagination={{
            current: accessoryModelData?.page || 1,
            pageSize: accessoryModelData?.page_size || 10,
            total: accessoryModelData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
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
            <Search
              placeholder="搜索料号/名称"
              allowClear
              onSearch={handleAccessorySearch}
              style={{ width: 200 }}
            />
            <Select
              placeholder="选择产品线"
              allowClear
              style={{ width: 180 }}
              onChange={handleProductLineChange}
              loading={productLineLoading}
              value={selectedProductLineId}
            >
              {productLineData?.items?.map((productLine: any) => (
                <Option key={productLine.id} value={productLine.id}>{productLine.title.zh}</Option>
              ))}
            </Select>
            <Select
              placeholder="选择型号"
              allowClear
              style={{ width: 180 }}
              onChange={handleModelChange}
              loading={accessoryModelLoading}
              value={selectedModelId}
            >
              {accessoryModelData?.items?.map((model: AccessoryModel) => (
                <Option key={model.id} value={model.id}>{model.model}</Option>
              ))}
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
          pagination={{
            current: accessoryData?.page || 1,
            pageSize: accessoryData?.page_size || 10,
            total: accessoryData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
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