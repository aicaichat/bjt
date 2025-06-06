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
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Option } = Select;
const { Search } = Input;

const SparePartsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAdminI18n();
  
  // 状态变量
  const [activeTab, setActiveTab] = useState<string>('models');
  const [modelSearchText, setModelSearchText] = useState<string>('');
  const [sparePartSearchText, setSparePartSearchText] = useState<string>('');
  const [selectedProductLineId, setSelectedProductLineId] = useState<number | undefined>(undefined);
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined);
  const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
  
  // 获取产品线列表
  const {
    data: productLineDataRaw,
    loading: productLineLoading
  } = useAdminApi(
    adminProductLineService.getProductLines.bind(adminProductLineService),
    {
      page: 1,
      page_size: 100,
      status: 'publish'
    }
  );
  const productLineData = productLineDataRaw as { items: any[]; total: number; page: number; page_size: number } | undefined;
  
  // 获取备件型号列表
  const {
    data: sparePartModelDataRaw,
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
  const sparePartModelData = sparePartModelDataRaw as { items: SparePartModel[]; total: number; page: number; page_size: number } | undefined;
  
  // 获取备件料号列表
  const {
    data: sparePartDataRaw,
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
  const sparePartData = sparePartDataRaw as { items: SparePart[]; total: number; page: number; page_size: number } | undefined;
  
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
      message.success(t('message.modelDeleteSuccess', { ns: 'spare-parts' }));
      refetchModels();
    } catch (error) {
      message.error(t('message.modelDeleteFailed', { ns: 'spare-parts' }));
    }
  };
  
  // 删除备件料号
  const handleDeleteSparePart = async (id: number) => {
    try {
      await sparePartService.deleteSparePart(id);
      message.success(t('message.deleteSuccess', { ns: 'spare-parts' }));
      refetchSpareParts();
    } catch (error) {
      message.error(t('message.deleteFailed', { ns: 'spare-parts' }));
    }
  };
  
  // 备件型号表格列配置
  const modelColumns = [
    {
      title: t('fields.id', { ns: 'spare-parts' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.model_name', { ns: 'spare-parts' }),
      dataIndex: 'model',
      key: 'model',
      width: 180,
    },
    {
      title: t('fields.product_line_name', { ns: 'spare-parts' }),
      dataIndex: 'product_line_name',
      key: 'product_line_name',
      width: 150,
    },
    {
      title: t('fields.status', { ns: 'spare-parts' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: t('status.publish', { ns: 'spare-parts' }), color: 'green' },
          draft: { text: t('status.draft', { ns: 'spare-parts' }), color: 'orange' },
          trash: { text: t('status.trash', { ns: 'spare-parts' }), color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: t('status.unknown', { ns: 'spare-parts' }), color: 'gray' };
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: t('fields.action', { ns: 'spare-parts' }),
      key: 'action',
      width: 200,
      render: (_: any, record: SparePartModel) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/spare-parts/models/edit/${record.id}`)}
          >
            {t('actions.edit', { ns: 'spare-parts' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteModel(record.id)}
          >
            {t('actions.delete', { ns: 'spare-parts' })}
          </Button>
        </Space>
      ),
    },
  ];
  
  // 备件料号表格列配置
  const sparePartColumns = [
    {
      title: t('fields.id', { ns: 'spare-parts' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.part_number', { ns: 'spare-parts' }),
      dataIndex: 'part_number',
      key: 'part_number',
      width: 120,
      render: (text: string) => <span className="font-mono">{text}</span>,
    },
    {
      title: t('fields.part_name_zh', { ns: 'spare-parts' }),
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 150,
    },
    {
      title: t('fields.part_name_en', { ns: 'spare-parts' }),
      dataIndex: 'name_en',
      key: 'name_en',
      width: 150,
    },
    {
      title: t('fields.model_name', { ns: 'spare-parts' }),
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: t('fields.is_consumable', { ns: 'spare-parts' }),
      dataIndex: 'is_consumable',
      key: 'is_consumable',
      width: 100,
      render: (isConsumable: boolean) => (
        <Tag color={isConsumable ? 'orange' : 'blue'}>
          {isConsumable ? '易损' : '标准'}
        </Tag>
      ),
    },
    {
      title: t('fields.app_model', { ns: 'spare-parts' }),
      dataIndex: 'app_model',
      key: 'app_model',
      width: 150,
      render: (text: string) => {
        if (!text) return '-';
        const models = text.split(',').slice(0, 2);
        const hasMore = text.split(',').length > 2;
        return (
          <div>
            {models.map((model, index) => (
              <Tag key={index} size="small">{model.trim()}</Tag>
            ))}
            {hasMore && <Tag size="small">...</Tag>}
          </div>
        );
      },
    },
    {
      title: t('fields.net_weight_kg', { ns: 'spare-parts' }),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 100,
      render: (weight: number) => weight ? `${weight.toFixed(3)}` : '-',
    },
    {
      title: t('fields.status', { ns: 'spare-parts' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: t('status.publish', { ns: 'spare-parts' }), color: 'green' },
          draft: { text: t('status.draft', { ns: 'spare-parts' }), color: 'orange' },
          trash: { text: t('status.trash', { ns: 'spare-parts' }), color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: t('status.unknown', { ns: 'spare-parts' }), color: 'gray' };
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: t('fields.action', { ns: 'spare-parts' }),
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: SparePart) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/spare-parts/edit/${record.id}`)}
          >
            {t('actions.edit', { ns: 'spare-parts' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSparePart(record.id)}
          >
            {t('actions.delete', { ns: 'spare-parts' })}
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
              placeholder={t('list.searchPlaceholder', { ns: 'spare-parts' })}
              allowClear
              onSearch={handleModelSearch}
              style={{ width: 200 }}
            />
            <Select
              placeholder={t('placeholders.selectProductLine', { ns: 'spare-parts' })}
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
                message.info(t('actions.import', { ns: 'spare-parts' }) + `: ${file.name}`);
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info(t('actions.export', { ns: 'spare-parts' }));
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/spare-parts/models/create')}
            >
              {t('actions.addModel', { ns: 'spare-parts' })}
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
            showTotal: (total: number) => t('pagination.total', { ns: 'spare-parts', total }),
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
              placeholder={t('list.searchPlaceholder', { ns: 'spare-parts' })}
              allowClear
              onSearch={handleSparePartSearch}
              style={{ width: 200 }}
            />
            <Select
              placeholder={t('placeholders.selectProductLine', { ns: 'spare-parts' })}
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
              placeholder={t('placeholders.selectModel', { ns: 'spare-parts' })}
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
              <span>{t('list.criticalOnly', { ns: 'spare-parts' })}</span>
            </Space>
          </Space>
          <Space>
            <ImportExportButtons
              onImport={async (file) => {
                message.info(t('actions.import', { ns: 'spare-parts' }) + `: ${file.name}`);
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info(t('actions.export', { ns: 'spare-parts' }));
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/spare-parts/create')}
            >
              {t('actions.addSparePart', { ns: 'spare-parts' })}
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
            showTotal: (total: number) => t('pagination.total', { ns: 'spare-parts', total }),
          }}
          onChange={handleSparePartTableChange}
        />
      </>
    );
  };
  
  const productLines = productLineData?.items || [];

  return (
    <div className="p-6">
      <AdminPageHeader
        title={t('list.title', { ns: 'spare-parts' })}
      />
      
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'models',
              label: t('list.models', { ns: 'spare-parts' }),
              children: renderSparePartModelsTable()
            },
            {
              key: 'spare-parts',
              label: t('list.spareParts', { ns: 'spare-parts' }),
              children: renderSparePartsTable()
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default SparePartsPage; 