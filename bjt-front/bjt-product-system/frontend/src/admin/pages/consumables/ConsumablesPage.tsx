import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Tag,
  Typography,
  Row,
  Col,
  message,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Consumable } from '../../services/admin-consumable.service';
import { useAdminApi } from '../../hooks/useAdminApi';
import { consumableService } from '../../services/admin-consumable.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Title, Text } = Typography;
const { Option } = Select;

// 简化的数据类型，与API返回的格式一致
interface ConsumableData {
  id: number;
  product_line_id: number;
  model: string;
  part_number: string;
  spec?: string;
  spec_imperial?: string;
  brand?: string;
  app_model?: string;
  bag_type?: string;
  material?: string;
  thickness_met?: number;
  thickness_imp?: number;
  width_met?: number;
  width_imp?: number;
  length_met?: number;
  length_imp?: number;
  bubble_diameter_met?: number;
  bubble_diameter_imp?: number;
  total_length_met?: number;
  total_length_imp?: number;
  package_type?: string;
  package_size_cm?: string;
  package_size_inch?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  pcs_per_box?: number;
  image_url?: string;
  package_image_url?: string;
  status: string;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

const ConsumablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAdminI18n();
  
  // 获取产品线ID - 从URL参数或默认值
  const productLineId = useMemo(() => {
    // 首先尝试获取 productLine 参数
    const paramId = searchParams.get('productLine');
    if (paramId) {
      return parseInt(paramId);
    }
    
    // 如果没有 productLine 参数，尝试获取 type 参数并映射到产品线ID
    const typeParam = searchParams.get('type');
    if (typeParam) {
      const typeToProductLineMap: Record<string, number> = {
        'air-cushion': 1, // 气垫机
        'bubble-machine': 2, // 气泡机 (如果有的话)
        'packaging': 3, // 包装机 (如果有的话)
      };
      
      return typeToProductLineMap[typeParam] || 1;
    }
    
    return 1; // 默认为1（气垫机）
  }, [searchParams]);

  // 添加调试日志
  console.log('ConsumablesPage: URL search params:', Object.fromEntries(searchParams.entries()));
  console.log('ConsumablesPage: Resolved productLineId:', productLineId);

  // 添加排序和筛选状态
  const [sorter, setSorter] = useState<{
    field?: string;
    order?: 'ascend' | 'descend';
  }>({});

  // 过滤条件状态
  const [filters, setFilters] = useState({
    search: '',
    model: '',
    bag_type: '',
    material: '',
    status: '',
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  // 使用 useMemo 确保查询参数稳定，避免无限循环
  const queryParams = useMemo(() => {
    const params = {
      page: pagination.current,
      per_page: pagination.pageSize,
      product_line_id: productLineId,
      search: filters.search || undefined,
      model: filters.model || undefined,
      bag_type: filters.bag_type || undefined,
      material: filters.material || undefined,
      status: filters.status || undefined,
      // 添加排序参数
      sort_field: sorter.field || undefined,
      sort_order: (sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined) as 'asc' | 'desc' | undefined,
    };
    console.log('ConsumablesPage: Query params:', params);
    return params;
  }, [pagination.current, pagination.pageSize, productLineId, filters, sorter]);

  // 使用现代 hook 获取数据
  const { 
    data: response, 
    loading, 
    error, 
    refetch 
  } = useAdminApi(
    () => consumableService.getConsumables(queryParams),
    [queryParams] // 依赖queryParams，当查询条件变化时重新获取
  );

  // 添加响应调试日志
  console.log('ConsumablesPage: API response:', response);
  console.log('ConsumablesPage: Loading state:', loading);
  console.log('ConsumablesPage: Error state:', error);

  // 同步分页状态：当API响应的page与本地状态不一致时，更新本地状态
  useEffect(() => {
    if (response && response.page !== pagination.current) {
      console.log(`ConsumablesPage: Syncing pagination - API page: ${response.page}, Local page: ${pagination.current}`);
      setPagination(prev => ({
        ...prev,
        current: response.page
      }));
    }
  }, [response, pagination.current]);

  // 处理数据
  const dataSource = useMemo(() => {
    console.log('ConsumablesPage: dataSource useMemo called with:', {
      hasResponse: !!response,
      itemsCount: response?.items?.length || 0,
      sorter,
      filters
    });
    
    if (!response?.items) return [];
    
    let mappedData = response.items.map((item: Consumable) => ({
      ...item,
      key: item.id.toString(),
    }));

    // 如果API返回的数据数量等于总数，说明API可能不支持筛选，需要前端筛选
    const needsFrontendFiltering = response.total === response.items.length && (
      filters.search || 
      filters.model || 
      filters.bag_type || 
      filters.material || 
      filters.status
    );

    if (needsFrontendFiltering) {
      console.log('ConsumablesPage: Applying frontend filtering...');
      
      mappedData = mappedData.filter(item => {
        // 搜索筛选
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const searchFields = [
            item.model,
            item.part_number,
            item.spec,
            item.brand
          ].filter(Boolean);
          
          const matches = searchFields.some(field => 
            field && field.toLowerCase().includes(searchLower)
          );
          if (!matches) return false;
        }

        // 型号筛选
        if (filters.model && item.model !== filters.model) {
          return false;
        }

        // 消耗品类型筛选
        if (filters.bag_type && item.bag_type !== filters.bag_type) {
          return false;
        }

        // 材质筛选
        if (filters.material && item.material !== filters.material) {
          return false;
        }

        // 状态筛选
        if (filters.status && item.status !== filters.status) {
          return false;
        }

        return true;
      });

      console.log(`ConsumablesPage: Frontend filtering applied. Filtered from ${response.items.length} to ${mappedData.length} items`);
    }

    // 如果有排序设置，在前端进行排序（用于API不支持排序的情况）
    if (sorter.field && sorter.order) {
      mappedData = [...mappedData].sort((a, b) => {
        const aValue = a[sorter.field as keyof ConsumableData];
        const bValue = b[sorter.field as keyof ConsumableData];
        
        // 处理不同类型的排序
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          // 处理 null/undefined 值
          if (aValue == null && bValue == null) comparison = 0;
          else if (aValue == null) comparison = 1;
          else if (bValue == null) comparison = -1;
          else comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sorter.order === 'ascend' ? comparison : -comparison;
      });
      
      console.log(`ConsumablesPage: Applied frontend sorting by ${sorter.field} ${sorter.order}`);
    }

    return mappedData;
  }, [response, sorter, filters]);

  // 计算总数：如果使用了前端筛选，则使用筛选后的数据数量
  const totalCount = useMemo(() => {
    if (!response) return 0;
    
    const needsFrontendFiltering = response.total === response.items.length && (
      filters.search || 
      filters.model || 
      filters.bag_type || 
      filters.material || 
      filters.status
    );
    
    return needsFrontendFiltering ? dataSource.length : response.total;
  }, [response, dataSource.length, filters]);

  // 调试分页状态
  console.log('ConsumablesPage: Pagination config:', {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: totalCount,
    apiPage: response?.page,
    apiPerPage: response?.per_page
  });

  // 调试排序状态
  console.log('ConsumablesPage: Sorter state:', sorter);
  console.log('ConsumablesPage: Filters state:', filters);

  // 表格列定义
  const columns: ColumnsType<ConsumableData> = useMemo(() => [
    {
      title: t('fields.id', { ns: 'consumables' }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
      sortOrder: sorter.field === 'id' ? sorter.order : null,
    },
    {
      title: t('fields.model', { ns: 'consumables' }),
      dataIndex: 'model',
      key: 'model',
      width: 180,
      sorter: true,
      sortOrder: sorter.field === 'model' ? sorter.order : null,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: t('fields.part_number', { ns: 'consumables' }),
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
      sorter: true,
      sortOrder: sorter.field === 'part_number' ? sorter.order : null,
    },
    {
      title: t('fields.consumableType', { ns: 'consumables' }),
      dataIndex: 'bag_type',
      key: 'bag_type',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'bag_type' ? sorter.order : null,
    },
    {
      title: t('fields.material', { ns: 'consumables' }),
      dataIndex: 'material',
      key: 'material',
      width: 100,
      sorter: true,
      sortOrder: sorter.field === 'material' ? sorter.order : null,
    },
    {
      title: t('fields.thickness', { ns: 'consumables' }) + '(μm)',
      dataIndex: 'thickness_met',
      key: 'thickness_met',
      width: 100,
      sorter: true,
      sortOrder: sorter.field === 'thickness_met' ? sorter.order : null,
      render: (value) => value ? `${value} μm` : '-',
    },
    {
      title: t('fields.size', { ns: 'consumables' }) + '(mm)',
      dataIndex: 'width_met',
      key: 'width_met',
      width: 100,
      sorter: true,
      sortOrder: sorter.field === 'width_met' ? sorter.order : null,
      render: (value) => value ? `${value} mm` : '-',
    },
    {
      title: t('fields.size', { ns: 'consumables' }) + '(m)',
      dataIndex: 'length_met',
      key: 'length_met',
      width: 100,
      sorter: true,
      sortOrder: sorter.field === 'length_met' ? sorter.order : null,
      render: (value) => value ? `${value} m` : '-',
    },
    {
      title: t('fields.spec', { ns: 'consumables' }),
      dataIndex: 'spec',
      key: 'spec',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('fields.brand', { ns: 'consumables' }),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      sorter: true,
      sortOrder: sorter.field === 'brand' ? sorter.order : null,
    },
    {
      title: t('fields.status', { ns: 'consumables' }),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          publish: { text: t('status.publish', { ns: 'consumables' }), color: 'success' },
          draft: { text: t('status.draft', { ns: 'consumables' }), color: 'warning' },
          trash: { text: t('status.trash', { ns: 'consumables' }), color: 'error' },
        };
        const { text, color } = statusMap[status] || { text: t('status.unknown', { ns: 'consumables' }), color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: t('fields.action', { ns: 'consumables' }),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title={t('actions.edit', { ns: 'consumables' })}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record)}
            title={t('actions.delete', { ns: 'consumables' })}
          />
        </Space>
      ),
    },
  ], [sorter, t]);

  // 事件处理函数
  const handleFilterChange = (key: string, value: string | undefined) => {
    console.log(`ConsumablesPage: handleFilterChange called - ${key}:`, value);
    
    // 清理输入值，移除制表符和前后空白
    const cleanValue = value ? value.replace(/[\t\r\n]/g, '').trim() : '';
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: cleanValue,
      };
      console.log('ConsumablesPage: New filters state:', newFilters);
      return newFilters;
    });
    // 重置到第一页
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (
    paginationInfo: TablePaginationConfig,
    filters: Record<string, any> | null,
    sorterInfo: any
  ) => {
    console.log('ConsumablesPage: Table change - pagination:', paginationInfo, 'sorter:', sorterInfo);
    
    // 处理分页变化
    setPagination({
      current: paginationInfo.current || 1,
      pageSize: paginationInfo.pageSize || 50,
    });

    // 处理排序变化
    if (sorterInfo) {
      const newSorter = {
        field: sorterInfo.field || undefined,
        order: sorterInfo.order || undefined,
      };
      console.log('ConsumablesPage: Setting new sorter:', newSorter);
      setSorter(newSorter);
    } else {
      // 清除排序
      console.log('ConsumablesPage: Clearing sorter');
      setSorter({});
    }
  };

  const handleAdd = () => {
    const params = new URLSearchParams();
    params.append('productLine', productLineId.toString());
    navigate(`/admin/consumables/create?${params.toString()}`);
  };

  const handleEdit = (record: ConsumableData) => {
    const params = new URLSearchParams();
    params.append('productLine', productLineId.toString());
    navigate(`/admin/consumables/edit/${record.id}?${params.toString()}`);
  };

  const handleDelete = async (record: ConsumableData) => {
    try {
      await consumableService.deleteConsumable(record.id);
      message.success(t('message.deleteSuccess', { ns: 'consumables' }));
      refetch(); // 重新获取数据
    } catch (error) {
      console.error('Delete error:', error);
      message.error(t('message.deleteFailed', { ns: 'consumables' }));
    }
  };

  const handleGoToDictionary = () => {
    navigate('/admin/consumables/dictionary');
  };

  // 更多操作菜单
  const moreActionsItems = [
    {
      key: 'dictionary',
      label: t('actions.addModel', { ns: 'consumables' }),
      icon: <SettingOutlined />,
      onClick: handleGoToDictionary,
    },
    {
      key: 'export',
      label: t('actions.export', { ns: 'consumables' }),
      icon: <DownloadOutlined />,
      onClick: () => message.info(t('actions.export', { ns: 'consumables' }) + ' ' + t('message.createFailed', { ns: 'consumables' })),
    },
    {
      key: 'import',
      label: t('actions.import', { ns: 'consumables' }),
      icon: <UploadOutlined />,
      onClick: () => message.info(t('actions.import', { ns: 'consumables' }) + ' ' + t('message.createFailed', { ns: 'consumables' })),
    },
  ];

  return (
    <div className="consumables-page">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={4} className="mb-2">{t('list.title', { ns: 'consumables' })}</Title>
            <Text type="secondary">
              {t('list.consumables', { ns: 'consumables' })} ({totalCount} {t('empty.noData', { ns: 'consumables' }).replace('暂无耗材数据', '条记录')})
            </Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              {t('actions.addConsumable', { ns: 'consumables' })}
            </Button>
            <Dropdown menu={{ items: moreActionsItems }} placement="bottomRight">
              <Button icon={<SettingOutlined />}>
                {t('actions.export', { ns: 'consumables' })}
              </Button>
            </Dropdown>
          </Space>
        </div>

        {/* 过滤条件 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col span={6}>
            <Input.Search
              placeholder={t('list.searchPlaceholder', { ns: 'consumables' })}
              allowClear
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // 实时更新输入框显示，但不立即搜索
                const cleanValue = e.target.value.replace(/[\t\r\n]/g, '').trim();
                setFilters(prev => ({ ...prev, search: cleanValue }));
              }}
              onSearch={(value: string) => {
                // 当用户按回车或点击搜索按钮时才执行搜索
                const cleanValue = value.replace(/[\t\r\n]/g, '').trim();
                console.log('ConsumablesPage: Search triggered with value:', cleanValue);
                handleFilterChange('search', cleanValue);
              }}
              enterButton
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('fields.model', { ns: 'consumables' })}
              allowClear
              style={{ width: '100%' }}
              value={filters.model || undefined}
              onChange={(value: string) => handleFilterChange('model', value)}
            >
              {/* 这里可以添加型号选项 */}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('fields.consumableType', { ns: 'consumables' })}
              allowClear
              style={{ width: '100%' }}
              value={filters.bag_type || undefined}
              onChange={(value: string) => handleFilterChange('bag_type', value)}
            >
              <Option value="Tube">Tube</Option>
              <Option value="Bubble">Bubble</Option>
              <Option value="Pillow">Pillow</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('fields.material', { ns: 'consumables' })}
              allowClear
              style={{ width: '100%' }}
              value={filters.material || undefined}
              onChange={(value: string) => handleFilterChange('material', value)}
            >
              <Option value="HDPE">HDPE</Option>
              <Option value="PAPER">PAPER</Option>
              <Option value="50% HDPE">50% HDPE</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('placeholders.selectStatus', { ns: 'consumables' })}
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(value: string) => handleFilterChange('status', value)}
            >
              <Option value="publish">{t('status.publish', { ns: 'consumables' })}</Option>
              <Option value="draft">{t('status.draft', { ns: 'consumables' })}</Option>
              <Option value="trash">{t('status.trash', { ns: 'consumables' })}</Option>
            </Select>
          </Col>
        </Row>

        {/* 错误状态显示 */}
        {error && (
          <div style={{ 
            marginBottom: 16, 
            padding: 16, 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 6 
          }}>
            <Text type="danger">
              加载失败: {error instanceof Error ? error.message : String(error)}
            </Text>
            <br />
            <Button 
              type="link" 
              onClick={refetch} 
              style={{ padding: 0, marginTop: 8 }}
            >
              重新加载
            </Button>
          </div>
        )}

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: response?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `${range[0]}-${range[1]} / ${t('pagination.total', { ns: 'consumables', total })}`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default ConsumablesPage; 