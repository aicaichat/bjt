import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Space, Input, Select, message, Card, Tabs, Tag, Switch
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import ImportExportButtons from '../../components/common/ImportExportButtons';
import { useAdminApi } from '../../hooks/useAdminApi';
import { sparePartModelService, sparePartService, SparePartModel, SparePart } from '../../services/admin-spare-part.service';
import adminProductLineService from '../../services/admin-product-line.service';

const { Option } = Select;
const { Search } = Input;

const SparePartsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态变量
  const [activeTab, setActiveTab] = useState<string>('models');
  const [modelSearchText, setModelSearchText] = useState<string>('');
  const [sparePartSearchText, setSparePartSearchText] = useState<string>('');
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>(undefined);
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined);
  const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
  
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
  
  // 获取备件型号列表
  const {
    data: sparePartModelData,
    loading: sparePartModelLoading,
    updateParams: updateModelParams,
    refetch: refetchModels
  } = useAdminApi(
    sparePartModelService.getSparePartModels.bind(sparePartModelService),
    {
      page: 1,
      page_size: 10,
      search: modelSearchText,
      product_line_id: selectedProductLineId
    },
    [modelSearchText, selectedProductLineId]
  );
  
  // 获取备件料号列表
  const {
    data: sparePartData,
    loading: sparePartLoading,
    updateParams: updateSparePartParams,
    refetch: refetchSpareParts
  } = useAdminApi(
    sparePartService.getSpareParts.bind(sparePartService),
    {
      page: 1,
      page_size: 10,
      search: sparePartSearchText,
      model_id: selectedModelId,
      product_line_id: selectedProductLineId,
      is_critical: showCriticalOnly || undefined
    },
    [sparePartSearchText, selectedModelId, selectedProductLineId, showCriticalOnly]
  );
  
  // 处理备件型号搜索
  const handleModelSearch = (value: string) => {
    setModelSearchText(value);
  };
  
  // 处理备件料号搜索
  const handleSparePartSearch = (value: string) => {
    setSparePartSearchText(value);
  };
  
  // 处理产品线选择
  const handleProductLineChange = (value: number | undefined) => {
    setSelectedProductLineId(value);
  };
  
  // 处理备件型号选择
  const handleModelChange = (value: number | undefined) => {
    setSelectedModelId(value);
  };
  
  // 处理关键备件过滤
  const handleCriticalOnlyChange = (checked: boolean) => {
    setShowCriticalOnly(checked);
  };
  
  // 处理备件型号表格分页
  const handleModelTableChange = (pagination: any) => {
    updateModelParams({
      page: pagination.current,
      page_size: pagination.pageSize
    });
  };
  
  // 处理备件料号表格分页
  const handleSparePartTableChange = (pagination: any) => {
    updateSparePartParams({
      page: pagination.current,
      page_size: pagination.pageSize
    });
  };
  
  // 删除备件型号
  const handleDeleteModel = async (id: number) => {
    try {
      await sparePartModelService.deleteSparePartModel(id);
      message.success('备件型号删除成功');
      refetchModels();
    } catch (error) {
      message.error('备件型号删除失败');
    }
  };
  
  // 删除备件料号
  const handleDeleteSparePart = async (id: number) => {
    try {
      await sparePartService.deleteSparePart(id);
      message.success('备件料号删除成功');
      refetchSpareParts();
    } catch (error) {
      message.error('备件料号删除失败');
    }
  };
  
  // 备件型号表格列配置
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
      render: (_: any, record: SparePartModel) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/spare-parts/models/edit/${record.id}`)}
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
  
  // 备件料号表格列配置
  const sparePartColumns = [
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
      render: (_: any, record: SparePart) => (
        <div>
          <div>{record.name.zh}</div>
          <div className="text-gray-500 text-sm">{record.name.en}</div>
        </div>
      ),
    },
    {
      title: '关键备件',
      dataIndex: 'is_critical',
      key: 'is_critical',
      width: 100,
      render: (isCritical: boolean) => {
        return isCritical ? 
          <Tag icon={<WarningOutlined />} color="red">关键</Tag> : 
          <Tag color="default">普通</Tag>;
      },
    },
    {
      title: '采购周期',
      dataIndex: 'lead_time',
      key: 'lead_time',
      width: 100,
      render: (leadTime: number | undefined) => {
        if (!leadTime) return <span>-</span>;
        return <Tag color="blue">{leadTime}天</Tag>;
      },
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
      render: (_: any, record: SparePart) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/spare-parts/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSparePart(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];
  
  // 渲染备件型号表格
  const renderSparePartModelsTable = () => {
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
                message.info('导出备件型号数据');
                // TODO: 实现导出功能
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/spare-parts/models/create')}
            >
              新增型号
            </Button>
          </Space>
        </div>
        
        <Table
          columns={modelColumns}
          dataSource={sparePartModelData?.items || []}
          rowKey="id"
          loading={sparePartModelLoading}
          pagination={{
            current: sparePartModelData?.page || 1,
            pageSize: sparePartModelData?.page_size || 10,
            total: sparePartModelData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleModelTableChange}
        />
      </>
    );
  };
  
  // 渲染备件料号表格
  const renderSparePartsTable = () => {
    return (
      <>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Search
              placeholder="搜索料号/名称"
              allowClear
              onSearch={handleSparePartSearch}
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
              loading={sparePartModelLoading}
              value={selectedModelId}
            >
              {sparePartModelData?.items?.map((model: SparePartModel) => (
                <Option key={model.id} value={model.id}>{model.model}</Option>
              ))}
            </Select>
            <Space>
              <Switch 
                checked={showCriticalOnly} 
                onChange={handleCriticalOnlyChange}
              />
              <span>仅显示关键备件</span>
            </Space>
          </Space>
          <Space>
            <ImportExportButtons
              onImport={async (file) => {
                message.info(`导入文件: ${file.name}`);
                // TODO: 实现导入功能
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info('导出备件料号数据');
                // TODO: 实现导出功能
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/spare-parts/create')}
            >
              新增料号
            </Button>
          </Space>
        </div>
        
        <Table
          columns={sparePartColumns}
          dataSource={sparePartData?.items || []}
          rowKey="id"
          loading={sparePartLoading}
          pagination={{
            current: sparePartData?.page || 1,
            pageSize: sparePartData?.page_size || 10,
            total: sparePartData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleSparePartTableChange}
        />
      </>
    );
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title="备件管理"
      />
      
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'models',
              label: '备件型号',
              children: renderSparePartModelsTable()
            },
            {
              key: 'spare-parts',
              label: '备件料号',
              children: renderSparePartsTable()
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default SparePartsPage; 