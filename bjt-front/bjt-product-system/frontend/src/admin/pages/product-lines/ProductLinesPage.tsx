import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminProductLineService, { ProductLine } from '../../services/admin-product-line.service';
import PageHeader from '../../components/common/PageHeader';

const ProductLinesPage: React.FC = () => {
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
      message.error('获取产品线列表失败');
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
      message.success('产品线删除成功');
      fetchProductLines();
    } catch (error) {
      console.error('Failed to delete product line:', error);
      message.error('产品线删除失败');
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: {zh: string, en: string}) => title.zh,
    },
    {
      title: '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (image_url: string) => (
        image_url ? <img src={image_url} alt="产品线图片" style={{ width: 80, height: 80, objectFit: 'cover' }} /> : '无图片'
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'publish' ? 'green' : status === 'draft' ? 'blue' : 'red'}>
          {status === 'publish' ? '已发布' : status === 'draft' ? '草稿' : '回收站'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProductLine) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/admin/product-lines/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个产品线吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div className="product-lines-page">
      <PageHeader 
        title="产品线管理" 
        extra={[
          <Button 
            key="add" 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/admin/product-lines/create')}
          >
            添加产品线
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
        }}
        onChange={handleTableChange}
        loading={loading}
      />
    </div>
  );
};

export default ProductLinesPage; 