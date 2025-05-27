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
  UploadOutlined,
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

const { Title, Text } = Typography;
const { confirm } = Modal;

const ConsumablesDictionaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
      1: '气垫机',
      2: '纸机', 
      3: '胶带机'
    };
    return productLineNames[productLineId] || `产品线${productLineId}`;
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
      shape: '形状',
      material: '材料',
      specification: '规格'
    };

    confirm({
      title: `确认删除${typeNames[type as keyof typeof typeNames]}？`,
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除"${record.name_zh || record.spec_type}"吗？此操作无法撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          switch (type) {
            case 'shape':
              await adminShapeService.deleteShape(record.id);
              message.success('形状删除成功');
              fetchShapes();
              break;
            case 'material':
              await adminMaterialService.deleteMaterial(record.id);
              message.success('材料删除成功');
              fetchMaterials();
              break;
            case 'specification':
              await adminSpecificationService.deleteSpecification(record.id);
              message.success('规格删除成功');
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
    message.success('数据已刷新');
  };

  // 形状表格列定义
  const shapeColumns: ColumnsType<ShapeData> = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string, record: ShapeData) => {
        // 优先显示API返回的name字段，否则显示中文名称
        return name || record.name_zh || record.name_en || '-';
      },
    },
    {
      title: '中文名称',
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 150,
    },
    {
      title: '英文名称',
      dataIndex: 'name_en',
      key: 'name_en',
      width: 150,
    },
    {
      title: '主图',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => url ? <Tag color="green">有图</Tag> : <Tag color="gray">无图</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return <Tag color="default">未设置</Tag>;
        return (
          <Tag color={status === 'publish' ? 'green' : 'orange'}>
            {status === 'publish' ? '已发布' : '草稿'}
          </Tag>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '操作',
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
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('shape', record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 材料表格列定义
  const materialColumns: ColumnsType<MaterialData> = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string, record: MaterialData) => {
        // 优先显示API返回的name字段，否则显示中文名称
        return name || record.name_zh || record.name_en || '-';
      },
    },
    {
      title: '中文名称',
      dataIndex: 'name_zh',
      key: 'name_zh',
      width: 150,
    },
    {
      title: '英文名称',
      dataIndex: 'name_en',
      key: 'name_en',
      width: 150,
    },
    {
      title: '基材',
      dataIndex: 'base_material',
      key: 'base_material',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return <Tag color="default">未设置</Tag>;
        return (
          <Tag color={status === 'publish' ? 'green' : 'orange'}>
            {status === 'publish' ? '已发布' : '草稿'}
          </Tag>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '操作',
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
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('material', record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 规格表格列定义
  const specificationColumns: ColumnsType<SpecificationData> = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          thickness: { text: '厚度', color: 'blue' },
          width: { text: '宽度', color: 'green' },
          length: { text: '长度', color: 'orange' },
          weight: { text: '重量', color: 'purple' },
        };
        const { text, color } = typeMap[code] || { text: code, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '公制值',
      dataIndex: 'metric_value',
      key: 'metric_value',
      width: 120,
      render: (value: number, record: SpecificationData) => `${value} ${record.metric_unit}`,
    },
    {
      title: '英制值',
      dataIndex: 'imperial_value',
      key: 'imperial_value',
      width: 120,
      render: (value: number, record: SpecificationData) => `${value} ${record.imperial_unit}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return <Tag color="default">未设置</Tag>;
        return (
          <Tag color={status === 'publish' ? 'green' : 'orange'}>
            {status === 'publish' ? '已发布' : '草稿'}
          </Tag>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '操作',
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
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('specification', record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="consumables-dictionary-page">
      <AdminPageHeader
        title="耗材字典管理"
        description={`管理${getProductLineName()}的形状、材料和规格字典`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefreshAll}>
              刷新全部
            </Button>
            <Button icon={<UploadOutlined />}>
              批量导入
            </Button>
            <Button icon={<DownloadOutlined />}>
              批量导出
            </Button>
          </Space>
        }
      />

      {/* 当前产品线提示 */}
      <Card size="small" className="mb-4" style={{ backgroundColor: '#f0f8ff' }}>
        <Text strong>当前产品线：</Text>
        <Text style={{ color: '#1890ff', fontSize: '16px', marginLeft: '8px' }}>
          {getProductLineName()}
        </Text>
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          (ID: {productLineId})
        </Text>
        {typeFromUrl && (
          <Text style={{ marginLeft: '16px', color: '#52c41a' }}>
            来源: {typeFromUrl === 'air-cushion' ? '气垫机' : typeFromUrl === 'paper' ? '纸机' : '胶带机'}
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
                <span>形状管理</span>
                <Badge count={shapes.length} showZero style={{ marginLeft: 12 }} />
              </div>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleCreate('shape')}
              >
                新增形状
              </Button>
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
              showTotal: (total: number) => `共 ${total} 条`,
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
                <span>材料管理</span>
                <Badge count={materials.length} showZero style={{ marginLeft: 12 }} />
              </div>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleCreate('material')}
              >
                新增材料
              </Button>
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
              showTotal: (total: number) => `共 ${total} 条`,
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
                <span>规格管理</span>
                <Badge count={specifications.length} showZero style={{ marginLeft: 12 }} />
              </div>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleCreate('specification')}
              >
                新增规格
              </Button>
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
              showTotal: (total: number) => `共 ${total} 条`,
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