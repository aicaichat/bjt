import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  message,
  Typography,
  Tag,
  Modal,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  SettingOutlined,
  AppstoreOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { 
  ShapeData, 
  MaterialData, 
  SpecificationData,
  adminShapeService,
  adminMaterialService,
  adminSpecificationService
} from '../../services/admin-dictionary.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import DataImporter from '../../components/importer/DataImporter';
import { importRequired } from '../../../constants/importRequired';

const { Title, Text } = Typography;
const { confirm } = Modal;

const ConsumablesDictionaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAdminI18n();
  
  // 从URL参数获取产品线ID，默认为1（气垫机）
  const productLineId = parseInt(searchParams.get('product_line_id') || '1');
  const typeFromUrl = searchParams.get('type');

  // 数据状态
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [specifications, setSpecifications] = useState<SpecificationData[]>([]);

  // Loading状态
  const [shapesLoading, setShapesLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [specificationsLoading, setSpecificationsLoading] = useState(false);

  // 获取产品线名称
  const getProductLineName = () => {
    const productLineNames: Record<number, string> = {
      1: t('types.airCushion', { ns: 'navigation' }),
      2: t('types.paper', { ns: 'navigation' }), 
      3: t('types.tape', { ns: 'navigation' })
    };
    return productLineNames[productLineId] || `${t('fields.productLine', { ns: 'dictionary' })}${productLineId}`;
  };

  // 获取形状数据
  const fetchShapes = useCallback(async () => {
    setShapesLoading(true);
    try {
      const response = await adminShapeService.getShapes({
        lang: 'zh'
      });
      console.log('形状API响应:', response);
      setShapes(response?.data?.items || []);
    } catch (error) {
      console.error('获取形状数据失败:', error);
      message.error('获取形状数据失败');
      setShapes([]); // 设置为空数组避免渲染错误
    } finally {
      setShapesLoading(false);
    }
  }, []);

  // 获取材料数据
  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      const response = await adminMaterialService.getMaterials({
        lang: 'zh'
      });
      console.log('材料API响应:', response);
      setMaterials(response?.data?.items || []);
    } catch (error) {
      console.error('获取材料数据失败:', error);
      message.error('获取材料数据失败');
      setMaterials([]); // 设置为空数组避免渲染错误
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  // 获取规格数据
  const fetchSpecifications = useCallback(async () => {
    setSpecificationsLoading(true);
    try {
      const response = await adminSpecificationService.getSpecifications({
        lang: 'zh'
      });
      console.log('规格API响应:', response);
      setSpecifications(response?.data?.items || []);
    } catch (error) {
      console.error('获取规格数据失败:', error);
      message.error('获取规格数据失败');
      setSpecifications([]); // 设置为空数组避免渲染错误
    } finally {
      setSpecificationsLoading(false);
    }
  }, []);

  // 初始化数据加载
  useEffect(() => {
    fetchShapes();
    fetchMaterials();
    fetchSpecifications();
  }, [fetchShapes, fetchMaterials, fetchSpecifications]);

  // 处理新增操作
  const handleCreate = (type: string) => {
    navigate(`/admin/consumables/dictionary/${type}/create?product_line_id=${productLineId}`);
  };

  // 处理编辑操作
  const handleEdit = (type: string, record: any) => {
    navigate(`/admin/consumables/dictionary/${type}/edit/${record.id}?product_line_id=${productLineId}`);
  };

  // 处理删除操作
  const handleDelete = async (type: string, record: any) => {
    const typeNames = {
      shape: t('shape.name', { ns: 'dictionary' }),
      material: t('material.name', { ns: 'dictionary' }),
      specification: t('specification.name', { ns: 'dictionary' })
    };

    confirm({
      title: `${t('message.deleteConfirm', { ns: 'dictionary' })}${typeNames[type as keyof typeof typeNames]}？`,
      icon: <ExclamationCircleOutlined />,
      content: `${t('message.deleteWarning', { ns: 'dictionary' })}"${record.name_zh || record.spec_type}"？${t('message.deleteWarning', { ns: 'dictionary' })}`,
      okText: t('actions.confirm', { ns: 'dictionary' }),
      okType: 'danger',
      cancelText: t('actions.cancel', { ns: 'dictionary' }),
      async onOk() {
        try {
          switch (type) {
            case 'shape':
              await adminShapeService.deleteShape(record.id);
              message.success(t('message.shapeDeleteSuccess', { ns: 'dictionary' }));
              fetchShapes();
              break;
            case 'material':
              await adminMaterialService.deleteMaterial(record.id);
              message.success(t('message.materialDeleteSuccess', { ns: 'dictionary' }));
              fetchMaterials();
              break;
            case 'specification':
              await adminSpecificationService.deleteSpecification(record.id);
              message.success(t('message.specDeleteSuccess', { ns: 'dictionary' }));
              fetchSpecifications();
              break;
          }
        } catch (error) {
          console.error(`删除${typeNames[type as keyof typeof typeNames]}失败:`, error);
          message.error(`删除${typeNames[type as keyof typeof typeNames]}失败`);
        }
      },
    });
  };

  // 刷新全部数据
  const handleRefreshAll = () => {
    fetchShapes();
    fetchMaterials();
    fetchSpecifications();
    message.success(t('message.refreshSuccess', { ns: 'dictionary' }));
  };

  // 形状表格列定义
  const shapeColumns: ColumnsType<ShapeData> = [
    {
      title: t('fields.id', { ns: 'dictionary' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.code', { ns: 'dictionary' }),
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: t('fields.name', { ns: 'dictionary' }),
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string, record: ShapeData) => {
        // 优先显示API返回的name字段，否则显示中文名称
        return name || record.name_zh || record.name_en || '-';
      },
    },
    {
      title: t('fields.nameZh', { ns: 'dictionary' }),
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 150,
    },
    {
      title: t('fields.nameEn', { ns: 'dictionary' }),
      dataIndex: 'name_en',
      key: 'name_en',
      width: 150,
    },
    {
      title: t('fields.imageUrl', { ns: 'dictionary' }),
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => url ? <Tag color="green">{t('imageStatus.hasImage', { ns: 'dictionary' })}</Tag> : <Tag color="gray">{t('imageStatus.noImage', { ns: 'dictionary' })}</Tag>,
    },
    {
      title: t('fields.status', { ns: 'dictionary' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return <Tag color="default">{t('status.notSet', { ns: 'dictionary' })}</Tag>;
        return (
          <Tag color={status === 'publish' ? 'green' : 'orange'}>
            {status === 'publish' ? t('status.publish', { ns: 'dictionary' }) : t('status.draft', { ns: 'dictionary' })}
          </Tag>
        );
      },
    },
    {
      title: t('fields.sortOrder', { ns: 'dictionary' }),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: t('fields.action', { ns: 'dictionary' }),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit('shape', record)}
          >
            {t('actions.edit', { ns: 'dictionary' })}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('shape', record)}
          >
            {t('actions.delete', { ns: 'dictionary' })}
          </Button>
        </Space>
      ),
    },
  ];

  // 材料表格列定义
  const materialColumns: ColumnsType<MaterialData> = [
    {
      title: t('fields.id', { ns: 'dictionary' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.code', { ns: 'dictionary' }),
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: t('fields.name', { ns: 'dictionary' }),
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string, record: MaterialData) => {
        // 优先显示API返回的name字段，否则显示中文名称
        return name || record.name_zh || record.name_en || '-';
      },
    },
    {
      title: t('fields.nameZh', { ns: 'dictionary' }),
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 150,
    },
    {
      title: t('fields.nameEn', { ns: 'dictionary' }),
      dataIndex: 'name_en',
      key: 'name_en',
      width: 150,
    },
    {
      title: t('fields.baseMaterial', { ns: 'dictionary' }),
      dataIndex: 'base_material',
      key: 'base_material',
      width: 120,
    },
    {
      title: t('fields.status', { ns: 'dictionary' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return <Tag color="default">{t('status.notSet', { ns: 'dictionary' })}</Tag>;
        return (
          <Tag color={status === 'publish' ? 'green' : 'orange'}>
            {status === 'publish' ? t('status.publish', { ns: 'dictionary' }) : t('status.draft', { ns: 'dictionary' })}
          </Tag>
        );
      },
    },
    {
      title: t('fields.sortOrder', { ns: 'dictionary' }),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: t('fields.action', { ns: 'dictionary' }),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit('material', record)}
          >
            {t('actions.edit', { ns: 'dictionary' })}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('material', record)}
          >
            {t('actions.delete', { ns: 'dictionary' })}
          </Button>
        </Space>
      ),
    },
  ];

  // 规格表格列定义
  const specificationColumns: ColumnsType<SpecificationData> = [
    {
      title: t('fields.id', { ns: 'dictionary' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('fields.type', { ns: 'dictionary' }),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          thickness: { text: '厚度', color: 'blue' },
          weight: { text: '克重', color: 'cyan' },
          width: { text: '宽度', color: 'green' },
          length: { text: '虚线间距', color: 'orange' },
        };
        const { text, color } = typeMap[code] || { text: code, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: t('fields.name', { ns: 'dictionary' }),
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: t('fields.metricValue', { ns: 'dictionary' }),
      dataIndex: 'metric_value',
      key: 'metric_value',
      width: 120,
      render: (value: number, record: SpecificationData) => `${value} ${record.metric_unit}`,
    },
    {
      title: t('fields.imperialValue', { ns: 'dictionary' }),
      dataIndex: 'imperial_value',
      key: 'imperial_value',
      width: 120,
      render: (value: number, record: SpecificationData) => `${value} ${record.imperial_unit}`,
    },
    {
      title: t('fields.status', { ns: 'dictionary' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return <Tag color="default">{t('status.notSet', { ns: 'dictionary' })}</Tag>;
        return (
          <Tag color={status === 'publish' ? 'green' : 'orange'}>
            {status === 'publish' ? t('status.publish', { ns: 'dictionary' }) : t('status.draft', { ns: 'dictionary' })}
          </Tag>
        );
      },
    },
    {
      title: t('fields.sortOrder', { ns: 'dictionary' }),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: t('fields.action', { ns: 'dictionary' }),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit('specification', record)}
          >
            {t('actions.edit', { ns: 'dictionary' })}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('specification', record)}
          >
            {t('actions.delete', { ns: 'dictionary' })}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="consumables-dictionary-page">
      <AdminPageHeader
        title={t('consumables.title', { ns: 'dictionary' })}
        description={`${t('consumables.description', { ns: 'dictionary' })}${getProductLineName()}`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>
              {t('actions.refreshAll', { ns: 'dictionary' })}
            </Button>
            <Button icon={<DownloadOutlined />}>
              {t('actions.batchExport', { ns: 'dictionary' })}
            </Button>
          </Space>
        }
      />

      {/* 当前产品线提示 */}
      <Card size="small" className="mb-4" style={{ backgroundColor: '#f0f8ff' }}>
        <Text strong>{t('consumables.currentProductLine', { ns: 'dictionary' })}：</Text>
        <Text style={{ color: '#1890ff', fontSize: '16px', marginLeft: '8px' }}>
          {getProductLineName()}
        </Text>
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          (ID: {productLineId})
        </Text>
        {typeFromUrl && (
          <Text style={{ marginLeft: '16px', color: '#52c41a' }}>
            {t('consumables.source', { ns: 'dictionary' })}: {typeFromUrl === 'air-cushion' ? t('types.airCushion', { ns: 'navigation' }) : typeFromUrl === 'paper' ? t('types.paper', { ns: 'navigation' }) : t('types.tape', { ns: 'navigation' })}
          </Text>
        )}
      </Card>

      {/* 数据字典管理 - 纵向排列 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 形状管理 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AppstoreOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <span>{t('shape.management', { ns: 'dictionary' })}</span>
                <Badge count={shapes.length} showZero style={{ marginLeft: 12 }} />
              </div>
              <Space>
                <DataImporter
                  entity="shape"
                  requiredFields={importRequired.shape}
                  onSuccess={fetchShapes}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreate('shape')}
                >
                  {t('shape.create', { ns: 'dictionary' })}
                </Button>
              </Space>
            </div>
          }
          styles={{ body: { padding: '16px' } }}
        >
          <Table
            columns={shapeColumns}
            dataSource={shapes}
            rowKey="id"
            loading={shapesLoading}
            pagination={{
              size: 'small',
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => t('pagination.total', { total, ns: 'dictionary' }),
              pageSizeOptions: ['10', '20', '50'],
              defaultPageSize: 10,
            }}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {/* 材料管理 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ExperimentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <span>{t('material.management', { ns: 'dictionary' })}</span>
                <Badge count={materials.length} showZero style={{ marginLeft: 12 }} />
              </div>
              <Space>
                <DataImporter
                  entity="material"
                  requiredFields={importRequired.material}
                  onSuccess={fetchMaterials}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreate('material')}
                >
                  {t('material.create', { ns: 'dictionary' })}
                </Button>
              </Space>
            </div>
          }
          styles={{ body: { padding: '16px' } }}
        >
          <Table
            columns={materialColumns}
            dataSource={materials}
            rowKey="id"
            loading={materialsLoading}
            pagination={{
              size: 'small',
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => t('pagination.total', { total, ns: 'dictionary' }),
              pageSizeOptions: ['10', '20', '50'],
              defaultPageSize: 10,
            }}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {/* 规格管理 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SettingOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                <span>{t('specification.management', { ns: 'dictionary' })}</span>
                <Badge count={specifications.length} showZero style={{ marginLeft: 12 }} />
              </div>
              <Space>
                <DataImporter
                  entity="specification"
                  requiredFields={importRequired.specification}
                  onSuccess={fetchSpecifications}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreate('specification')}
                >
                  {t('specification.create', { ns: 'dictionary' })}
                </Button>
              </Space>
            </div>
          }
          styles={{ body: { padding: '16px' } }}
        >
          <Table
            columns={specificationColumns}
            dataSource={specifications}
            rowKey="id"
            loading={specificationsLoading}
            pagination={{
              size: 'small',
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => t('pagination.total', { total, ns: 'dictionary' }),
              pageSizeOptions: ['10', '20', '50'],
              defaultPageSize: 10,
            }}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ConsumablesDictionaryPage; 