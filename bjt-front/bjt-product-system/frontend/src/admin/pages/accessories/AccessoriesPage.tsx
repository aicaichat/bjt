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
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Option } = Select;
const { Search } = Input;

const AccessoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAdminI18n();
  
  // 状态变量
  const [activeTab, setActiveTab] = useState<string>('models');
  const [selectedLanguage, setSelectedLanguage] = useState<'zh' | 'en'>('zh');
  const [selectedRegion, setSelectedRegion] = useState<'CN' | 'EU' | 'NA' | 'AU' | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<'publish' | 'draft' | undefined>(undefined);
  
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
    region: selectedRegion,
    status: selectedStatus
  }), [selectedLanguage, selectedRegion, selectedStatus]);
  
  // 获取配件型号列表
  const {
    data: modelDataRaw,
    loading: modelLoading,
    updateParams: updateModelParams,
    refetch: refetchModels
  } = useAdminApi(
    accessoryModelService.getAccessoryModels.bind(accessoryModelService),
    modelParams
  );
  const modelData = modelDataRaw as { items: AccessoryModel[]; total: number; page: number; page_size: number } | undefined;
  
  // 获取配件料号列表
  const {
    data: accessoryDataRaw,
    loading: accessoryLoading,
    updateParams: updateAccessoryParams,
    refetch: refetchAccessories
  } = useAdminApi(
    accessoryService.getAccessories.bind(accessoryService),
    accessoryParams
  );
  const accessoryData = accessoryDataRaw as { items: Accessory[]; total: number; page: number; page_size: number } | undefined;
  
  // 处理语言切换
  const handleLanguageChange = (value: 'zh' | 'en') => {
    setSelectedLanguage(value);
  };
  
  // 处理区域切换
  const handleRegionChange = (value: 'CN' | 'EU' | 'NA' | 'AU' | undefined) => {
    setSelectedRegion(value);
  };
  
  // 处理状态切换
  const handleStatusChange = (value: 'publish' | 'draft' | undefined) => {
    setSelectedStatus(value);
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
      message.success(t('message.deleteSuccess', { ns: 'accessories' }));
      refetchModels();
    } catch (error) {
      message.error(t('message.deleteFailed', { ns: 'accessories' }));
    }
  };
  
  // 删除配件料号
  const handleDeleteAccessory = async (id: number) => {
    try {
      await accessoryService.deleteAccessory(id);
      message.success(t('message.deleteSuccess', { ns: 'accessories' }));
      refetchAccessories();
    } catch (error) {
      message.error(t('message.deleteFailed', { ns: 'accessories' }));
    }
  };
  
  // 配件型号表格列配置 - 显示完整数据库字段
  const modelColumns = [
    {
      title: t('fields.id', { ns: 'accessories' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: t('fields.model', { ns: 'accessories' }),
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: t('fields.title_zh', { ns: 'accessories' }),
      dataIndex: 'title_zh',
      key: 'title_zh',
      width: 200,
    },
    {
      title: t('fields.title_en', { ns: 'accessories' }),
      dataIndex: 'title_en',
      key: 'title_en',
      width: 200,
    },
    {
      title: t('fields.type', { ns: 'accessories' }),
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: t('fields.description_zh', { ns: 'accessories' }),
      dataIndex: 'description_zh',
      key: 'description_zh',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('fields.description_en', { ns: 'accessories' }),
      dataIndex: 'description_en',
      key: 'description_en',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('fields.image1_url', { ns: 'accessories' }),
      dataIndex: 'image1_url',
      key: 'image1_url',
      width: 100,
      render: (url: string) => url ? (
        <img src={url} alt={t('fields.image1_url', { ns: 'accessories' })} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: t('fields.image2_url', { ns: 'accessories' }),
      dataIndex: 'image2_url',
      key: 'image2_url',
      width: 100,
      render: (url: string) => url ? (
        <img src={url} alt={t('fields.image2_url', { ns: 'accessories' })} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: t('fields.status', { ns: 'accessories' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: t('status.publish', { ns: 'accessories' }), color: 'green' },
          draft: { text: t('status.draft', { ns: 'accessories' }), color: 'orange' },
          trash: { text: t('status.trash', { ns: 'accessories' }), color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: t('status.unknown', { ns: 'accessories' }), color: 'gray' };
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: t('fields.sort_order', { ns: 'accessories' }),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: true,
    },
    {
      title: t('fields.action', { ns: 'accessories' }),
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
            {t('actions.edit', { ns: 'accessories' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteModel(record.id)}
          >
            {t('actions.delete', { ns: 'accessories' })}
          </Button>
        </Space>
      ),
    },
  ];
  
  // 配件料号表格列配置 - 显示完整数据库字段
  const accessoryColumns = [
    {
      title: t('fields.id', { ns: 'accessories' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: t('fields.model', { ns: 'accessories' }),
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: t('fields.part_number', { ns: 'accessories' }),
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
    },
    {
      title: t('fields.name_zh', { ns: 'accessories' }),
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 200,
    },
    {
      title: t('fields.name_en', { ns: 'accessories' }),
      dataIndex: 'name_en',
      key: 'name_en',
      width: 200,
    },
    {
      title: t('fields.brand', { ns: 'accessories' }),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: t('fields.spec', { ns: 'accessories' }),
      dataIndex: 'spec',
      key: 'spec',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('fields.spec_imperial', { ns: 'accessories' }),
      dataIndex: 'spec_imperial',
      key: 'spec_imperial',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('fields.voltage', { ns: 'accessories' }),
      dataIndex: 'voltage',
      key: 'voltage',
      width: 80,
    },
    {
      title: t('fields.frequency', { ns: 'accessories' }),
      dataIndex: 'frequency',
      key: 'frequency',
      width: 80,
    },
    {
      title: t('fields.unit', { ns: 'accessories' }),
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: t('fields.pcs_per_box', { ns: 'accessories' }),
      dataIndex: 'pcs_per_box',
      key: 'pcs_per_box',
      width: 100,
    },
    {
      title: t('fields.net_weight_kg', { ns: 'accessories' }),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 100,
    },
    {
      title: t('fields.net_weight_lbs', { ns: 'accessories' }),
      dataIndex: 'net_weight_lbs',
      key: 'net_weight_lbs',
      width: 100,
    },
    {
      title: t('fields.gross_weight_kg', { ns: 'accessories' }),
      dataIndex: 'gross_weight_kg',
      key: 'gross_weight_kg',
      width: 120,
    },
    {
      title: t('fields.gross_weight_lbs', { ns: 'accessories' }),
      dataIndex: 'gross_weight_lbs',
      key: 'gross_weight_lbs',
      width: 120,
    },
    {
      title: t('fields.pcs_per_pallet', { ns: 'accessories' }),
      dataIndex: 'pcs_per_pallet',
      key: 'pcs_per_pallet',
      width: 100,
    },
    {
      title: t('fields.image_url', { ns: 'accessories' }),
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => url ? (
        <img src={url} alt={t('fields.image_url', { ns: 'accessories' })} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : '-',
    },
    {
      title: t('fields.status', { ns: 'accessories' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: t('status.publish', { ns: 'accessories' }), color: 'green' },
          draft: { text: t('status.draft', { ns: 'accessories' }), color: 'orange' },
          trash: { text: t('status.trash', { ns: 'accessories' }), color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: t('status.unknown', { ns: 'accessories' }), color: 'gray' };
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: t('fields.action', { ns: 'accessories' }),
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
            {t('actions.edit', { ns: 'accessories' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAccessory(record.id)}
          >
            {t('actions.delete', { ns: 'accessories' })}
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
              placeholder={t('list.selectLanguage', { ns: 'accessories' })}
              value={selectedLanguage}
              style={{ width: 120 }}
              onChange={handleLanguageChange}
            >
              <Option value="zh">中文</Option>
              <Option value="en">English</Option>
            </Select>
            <Select
              placeholder={t('list.selectRegion', { ns: 'accessories' })}
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
            <Select
              placeholder="选择状态"
              allowClear
              value={selectedStatus}
              style={{ width: 120 }}
              onChange={handleStatusChange}
            >
              <Option value="publish">已发布</Option>
              <Option value="draft">草稿</Option>
            </Select>
          </Space>
          <Space>
            <ImportExportButtons
              onImport={async (file) => {
                message.info(t('actions.import', { ns: 'accessories' }) + `: ${file.name}`);
                // TODO: 实现导入功能
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info(t('actions.export', { ns: 'accessories' }));
                // TODO: 实现导出功能
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/accessories/models/create')}
            >
              {t('actions.addModel', { ns: 'accessories' })}
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
            showTotal: (total: number) => t('pagination.total', { ns: 'accessories', total }),
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
              placeholder={t('list.selectLanguage', { ns: 'accessories' })}
              value={selectedLanguage}
              style={{ width: 120 }}
              onChange={handleLanguageChange}
            >
              <Option value="zh">中文</Option>
              <Option value="en">English</Option>
            </Select>
            <Select
              placeholder={t('list.selectRegion', { ns: 'accessories' })}
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
                message.info(t('actions.import', { ns: 'accessories' }) + `: ${file.name}`);
                // TODO: 实现导入功能
                return Promise.resolve();
              }}
              onExport={async () => {
                message.info(t('actions.export', { ns: 'accessories' }));
                // TODO: 实现导出功能
                return Promise.resolve();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/accessories/create')}
            >
              {t('actions.addAccessory', { ns: 'accessories' })}
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
            showTotal: (total: number) => t('pagination.total', { ns: 'accessories', total }),
          }}
          onChange={handleAccessoryTableChange}
        />
      </>
    );
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title={t('list.title', { ns: 'accessories' })}
      />
      
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'models',
              label: t('list.models', { ns: 'accessories' }),
              children: renderAccessoryModelsTable()
            },
            {
              key: 'accessories',
              label: t('list.accessories', { ns: 'accessories' }),
              children: renderAccessoriesTable()
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default AccessoriesPage; 