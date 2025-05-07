import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Image,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import type { ProductLine } from '@/utils/api';

const { Option } = Select;

type ProductLineStatus = 'publish' | 'draft' | 'trash';

const statusMap: Record<ProductLineStatus, { color: string; text: string }> = {
  publish: { color: 'success', text: 'Published' },
  draft: { color: 'warning', text: 'Draft' },
  trash: { color: 'error', text: 'Trash' },
};

const ProductLineList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductLine[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<ProductLine[]>([]);
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<ProductLineStatus>('publish');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.productLine.getList({
        page: current,
        page_size: pageSize,
        search: searchText,
        status,
      });
      setData(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch product lines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [current, pageSize, searchText, status]);

  const handleStatusChange = async (record: ProductLine, newStatus: ProductLineStatus) => {
    try {
      await api.productLine.update(record.id, { status: newStatus });
      message.success('Status updated successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.productLine.delete(id);
      message.success('Product line deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete product line:', error);
    }
  };

  const handleBatchAction = async (action: ProductLineStatus) => {
    try {
      const ids = selectedRows.map(row => row.id);
      await api.productLine.batch(ids, action);
      message.success('Batch operation completed successfully');
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      console.error('Failed to perform batch operation:', error);
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => (
        url ? <Image src={url} alt="Product Line" width={80} height={80} /> : '-'
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: ProductLineStatus) => {
        const status = statusMap[text];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'Products',
      dataIndex: 'products_count',
      key: 'products_count',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: ProductLine) => (
        <Space>
          <Button
            type="link"
            onClick={() => navigate(`/product-lines/edit/${record.id}`)}
          >
            Edit
          </Button>
          <Select
            value={record.status}
            style={{ width: 100 }}
            onChange={(value: ProductLineStatus) => handleStatusChange(record, value)}
          >
            <Option value="publish">Publish</Option>
            <Option value="draft">Draft</Option>
            <Option value="trash">Trash</Option>
          </Select>
          <Popconfirm
            title="Are you sure to delete this product line?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Search product lines"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={status}
            onChange={(value: ProductLineStatus) => setStatus(value)}
            style={{ width: 120 }}
          >
            <Option value="publish">Published</Option>
            <Option value="draft">Draft</Option>
            <Option value="trash">Trash</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/product-lines/create')}
          >
            Add Product Line
          </Button>
        </Space>
      </div>

      {selectedRows.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button onClick={() => handleBatchAction('publish')}>
              Publish Selected
            </Button>
            <Button onClick={() => handleBatchAction('draft')}>
              Move to Draft
            </Button>
            <Button danger onClick={() => handleBatchAction('trash')}>
              Move to Trash
            </Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current,
          pageSize,
          total,
          onChange: (page, size) => {
            setCurrent(page);
            setPageSize(size || 10);
          },
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        rowSelection={{
          selectedRowKeys: selectedRows.map(row => row.id),
          onChange: (_, rows) => setSelectedRows(rows as ProductLine[]),
        }}
      />
    </Card>
  );
};

export default ProductLineList; 