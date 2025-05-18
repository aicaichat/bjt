import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, Form, Button, Select, Table, Space, Input,
  message, Typography, Alert, Divider, Radio, Checkbox
} from 'antd';
import { SearchOutlined, ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import adminRelationService from '../../services/admin-relation.service';
import adminPartService, { Part } from '../../services/admin-part.service';

const { Title, Text } = Typography;
const { Option } = Select;

const RelationEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get('parent_id');
  const level = searchParams.get('level');
  
  const [searchText, setSearchText] = useState('');
  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  const [parentPart, setParentPart] = useState<Part | null>(null);
  
  // 验证URL参数
  useEffect(() => {
    if (!parentId || !level) {
      message.error('缺少必要的参数');
      navigate('/admin/relations');
    }
  }, [parentId, level, navigate]);
  
  // 加载父级料号信息
  useEffect(() => {
    const loadParentPart = async () => {
      if (parentId) {
        try {
          const part = await adminPartService.getPart(Number(parentId));
          setParentPart(part);
        } catch (error) {
          message.error('无法加载父级料号信息');
        }
      }
    };
    
    loadParentPart();
  }, [parentId]);
  
  // 获取可关联的配件列表
  const {
    data: partsData,
    loading: partsLoading,
    updateParams: updatePartsParams
  } = useAdminApi(
    adminPartService.getParts.bind(adminPartService),
    {
      page: 1,
      page_size: 20,
      search: searchText,
      // 这里可以添加其他筛选条件，例如不包括已经关联的配件
    }
  );
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    updatePartsParams({
      search: value,
      page: 1
    });
  };
  
  // 处理表格分页
  const handleTableChange = (pagination: any) => {
    updatePartsParams({
      page: pagination.current,
      page_size: pagination.pageSize
    });
  };
  
  // 处理选择变化
  const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedPartIds(selectedRowKeys.map(key => Number(key)));
  };
  
  // 提交表单
  const handleSubmit = async () => {
    if (selectedPartIds.length === 0) {
      message.warning('请至少选择一个配件');
      return;
    }
    
    try {
      await adminRelationService.batchCreateRelations(
        Number(parentId),
        selectedPartIds,
        Number(level)
      );
      
      message.success('配件关联创建成功');
      navigate(`/admin/relations?part_id=${parentId}`);
    } catch (error) {
      message.error('配件关联创建失败');
    }
  };
  
  // 表格列配置
  const columns = [
    {
      title: '料号',
      dataIndex: 'pn',
      key: 'pn',
      width: 150,
    },
    {
      title: '名称',
      key: 'name',
      render: (_: any, record: Part) => (
        <div>
          <div>{record.name.zh}</div>
          <div className="text-gray-500 text-sm">{record.name.en}</div>
        </div>
      ),
    },
    {
      title: '规格',
      key: 'specs',
      render: (_: any, record: Part) => (
        <div className="truncate max-w-md" title={record.specs.zh}>
          {record.specs.zh}
        </div>
      ),
    }
  ];
  
  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys: selectedPartIds,
    onChange: handleSelectionChange,
  };
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title="添加配件关联"
        onBack={() => navigate(`/admin/relations?part_id=${parentId}`)}
      />
      
      <Card className="mb-6">
        <Title level={5}>当前料号信息</Title>
        {parentPart ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text strong>料号: </Text>
              <Text>{parentPart.pn}</Text>
            </div>
            <div>
              <Text strong>名称: </Text>
              <Text>{parentPart.name.zh}</Text>
            </div>
            <div>
              <Text strong>型号: </Text>
              <Text>{parentPart.model_name}</Text>
            </div>
            <div>
              <Text strong>关联层级: </Text>
              <Text>{level}</Text>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Text>正在加载...</Text>
          </div>
        )}
      </Card>
      
      <Card title="选择关联配件">
        <div className="mb-4 flex justify-between items-center">
          <Input.Search
            placeholder="搜索料号或名称"
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton
          />
          
          <div>
            <Text>已选择 {selectedPartIds.length} 个配件</Text>
          </div>
        </div>
        
        <Table
          rowKey="id"
          columns={columns}
          dataSource={partsData?.items || []}
          loading={partsLoading}
          rowSelection={rowSelection}
          pagination={{
            current: partsData?.page || 1,
            pageSize: partsData?.page_size || 20,
            total: partsData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
        
        <div className="mt-4 flex justify-end">
          <Space>
            <Button onClick={() => navigate(`/admin/relations?part_id=${parentId}`)}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              disabled={selectedPartIds.length === 0}
              icon={<LinkOutlined />}
            >
              创建关联关系
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default RelationEditPage; 