import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminProductLineService, { ProductLine } from '../../services/admin-product-line.service';
import PageHeader from '../../components/common/PageHeader';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const ProductLinesPage: React.FC = () => {
  const { t } = useAdminI18n();
  const [loading, setLoading] = useState<boolean>(false);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  
  const navigate = useNavigate();
  
  const fetchProductLines = async () => {
    try {
      setLoading(true);
      console.log('Fetching product lines...');
      
      const response = await adminProductLineService.getProductLines({
        page: pagination.current,
        per_page: pagination.pageSize,
      });
      
      console.log('API Response:', response);
      
      // 处理实际API返回的数据格式
      if (Array.isArray(response)) {
        // API直接返回数组的情况
        setProductLines(response);
        setTotal(response.length);
      } else if (response && Array.isArray((response as any).data)) {
        // API返回格式：{ success: true, data: [...], total: 3, page: 1, per_page: 10, total_pages: 1 }
        const responseData = response as any;
        setProductLines(responseData.data);
        setTotal(responseData.total || responseData.data.length);
      } else if (response && response.items && Array.isArray(response.items)) {
        // 备用格式：{ success: true, data: { items: [...], total: 3, ... } }
        setProductLines(response.items);
        setTotal(response.total || response.items.length);
      } else {
        console.warn('Unexpected API response format:', response);
        setProductLines([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch product lines:', error);
      message.error(t('messages.error', { ns: 'productLines' }) || '获取产品线失败');
      setProductLines([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProductLines();
  }, [pagination.current, pagination.pageSize]);
  
  const handleTableChange = (pagination: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
  
  const handleDelete = async (id: number) => {
    // 禁用删除功能，只显示消息
    message.info('删除功能已禁用');
  };
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: t('table.columns.name', { ns: 'productLines' }) || '名称',
      dataIndex: 'title_zh',
      key: 'title_zh',
      render: (text: string, record: ProductLine) => {
        // 处理不同的数据结构，ProductLine接口中没有title属性
        // 直接使用title_zh
        return text || record.title_zh || '未命名产品线';
      }
    },
    {
      title: t('table.columns.code', { ns: 'productLines' }) || '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: t('table.columns.image', { ns: 'productLines' }) || '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (image_url: string) => (
        image_url ? <img src={image_url} alt="产品线图片" style={{ width: 80, height: 80, objectFit: 'cover' }} /> : '无图片'
      ),
    },
    {
      title: t('table.columns.status', { ns: 'productLines' }) || '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'publish' ? 'green' : status === 'draft' ? 'blue' : 'red'}>
          {status === 'publish' ? (t('filters.status.publish', { ns: 'productLines' }) || '已发布') : 
           status === 'draft' ? (t('filters.status.draft', { ns: 'productLines' }) || '草稿') : 
           (t('filters.status.trash', { ns: 'productLines' }) || '回收站')}
        </Tag>
      ),
    },
    {
      title: t('table.columns.createTime', { ns: 'productLines' }) || '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: t('actions.title', { ns: 'productLines' }) || '操作',
      key: 'action',
      render: (_: any, record: ProductLine) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/admin/product-lines/edit/${record.id}`)}
          >
            {t('actions.edit', { ns: 'productLines' }) || '编辑'}
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            disabled={true} // 禁用删除按钮
            onClick={() => message.info('删除功能已禁用')}
          >
            {t('actions.delete', { ns: 'productLines' }) || '删除'}
          </Button>
        </Space>
      ),
    },
  ];
  
  return (
    <div className="product-lines-page">
      <PageHeader 
        title={t('title', { ns: 'productLines' }) || '产品线管理'} 
        extra={[
          <Button 
            key="add" 
            type="primary" 
            icon={<PlusOutlined />} 
            disabled={true} // 禁用新增按钮
            onClick={() => message.info('新增功能已禁用')}
          >
            {t('actions.add', { ns: 'productLines' }) || '新增产品线'}
          </Button>
        ]} 
      />
      
      <Table 
        columns={columns} 
        dataSource={productLines} 
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total: number) => (t('messages.total', { ns: 'productLines', total }) || `共 ${total} 条`),
        }}
        onChange={handleTableChange}
        loading={loading}
      />
    </div>
  );
};

export default ProductLinesPage; 