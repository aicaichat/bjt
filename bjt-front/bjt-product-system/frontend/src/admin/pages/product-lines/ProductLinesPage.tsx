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
      const response = await adminProductLineService.getProductLines({
        page: pagination.current,
        per_page: pagination.pageSize,
      });
      
      setProductLines(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch product lines:', error);
      message.error(t('messages.error', { ns: 'productLines' }));
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
    try {
      setLoading(true);
      await adminProductLineService.deleteProductLine(id);
      message.success(t('messages.success.deleted', { ns: 'productLines' }));
      fetchProductLines();
    } catch (error) {
      console.error('Failed to delete product line:', error);
      message.error(t('messages.error.delete', { ns: 'productLines' }));
    } finally {
      setLoading(false);
    }
  };
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: t('table.columns.name', { ns: 'productLines' }),
      dataIndex: 'title',
      key: 'title',
      render: (title: {zh: string, en: string}) => title.zh,
    },
    {
      title: t('table.columns.image', { ns: 'productLines' }),
      dataIndex: 'image_url',
      key: 'image_url',
      render: (image_url: string) => (
        image_url ? <img src={image_url} alt={t('table.columns.image', { ns: 'productLines' })} style={{ width: 80, height: 80, objectFit: 'cover' }} /> : t('messages.noData', { ns: 'productLines' })
      ),
    },
    {
      title: t('table.columns.status', { ns: 'productLines' }),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'publish' ? 'green' : status === 'draft' ? 'blue' : 'red'}>
          {status === 'publish' ? t('filters.status.publish', { ns: 'productLines' }) : 
           status === 'draft' ? t('filters.status.draft', { ns: 'productLines' }) : 
           t('filters.status.trash', { ns: 'productLines' })}
        </Tag>
      ),
    },
    {
      title: t('table.columns.createTime', { ns: 'productLines' }),
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: t('actions.title', { ns: 'productLines' }),
      key: 'action',
      render: (_: any, record: ProductLine) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/admin/product-lines/edit/${record.id}`)}
          >
            {t('actions.edit', { ns: 'productLines' })}
          </Button>
          <Popconfirm
            title={t('messages.deleteConfirm', { ns: 'productLines' })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('actions.confirm', { ns: 'productLines' })}
            cancelText={t('actions.cancel', { ns: 'productLines' })}
          >
            <Button danger icon={<DeleteOutlined />}>{t('actions.delete', { ns: 'productLines' })}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div className="product-lines-page">
      <PageHeader 
        title={t('title', { ns: 'productLines' })} 
        extra={[
          <Button 
            key="add" 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/admin/product-lines/create')}
          >
            {t('actions.add', { ns: 'productLines' })}
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
          showTotal: (total: number) => t('messages.total', { ns: 'productLines', total }),
        }}
        onChange={handleTableChange}
        loading={loading}
      />
    </div>
  );
};

export default ProductLinesPage; 