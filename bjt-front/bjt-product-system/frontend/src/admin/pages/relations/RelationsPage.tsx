import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Card, Table, Button, Space, Select, message, 
  Typography, Divider, Radio, Breadcrumb, Alert 
} from 'antd';
import { 
  PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, 
  LinkOutlined, ReloadOutlined, DeleteOutlined 
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useAdminApi } from '../../hooks/useAdminApi';
import adminRelationService, { Relation } from '../../services/admin-relation.service';
import adminMachineService from '../../services/admin-machine.service';
import adminPartService, { Part } from '../../services/admin-part.service';

const { Title, Text } = Typography;
const { Option } = Select;

const RelationsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // 从URL中获取查询参数，如果有的话
  const partIdFromUrl = searchParams.get('part_id');
  
  // 状态变量
  const [rootMachineId, setRootMachineId] = useState<number | undefined>(undefined);
  const [selectedMachinePart, setSelectedMachinePart] = useState<Part | null>(null);
  const [showingLevel, setShowingLevel] = useState<number>(1); // 当前显示的配件层级
  const [parentPartId, setParentPartId] = useState<number | null>(null);
  const [breadcrumbParts, setBreadcrumbParts] = useState<Part[]>([]);
  
  // 获取所有机型数据
  const { 
    data: machineData,
    loading: machineLoading
  } = useAdminApi(
    adminMachineService.getMachines.bind(adminMachineService),
    {
      page: 1,
      page_size: 100,
      status: 'publish'
    }
  );
  
  // 获取机型对应的料号列表
  const {
    data: machineParts,
    loading: machinePartsLoading,
    updateParams: updateMachinePartsParams
  } = useAdminApi(
    adminPartService.getParts.bind(adminPartService),
    {
      page: 1,
      page_size: 100,
      model_id: rootMachineId
    },
    [rootMachineId]
  );
  
  // 获取当前显示的配件关联关系
  const {
    data: relationData,
    loading: relationLoading,
    updateParams: updateRelationParams,
    refetch: refetchRelations
  } = useAdminApi(
    adminRelationService.getRelations.bind(adminRelationService),
    {
      page: 1,
      page_size: 50,
      parent_id: parentPartId,
      level: showingLevel
    },
    [parentPartId, showingLevel]
  );
  
  // 当URL中有part_id参数时，尝试加载该料号
  useEffect(() => {
    const loadPartFromUrl = async () => {
      if (partIdFromUrl) {
        try {
          // 获取料号信息
          const part = await adminPartService.getPart(Number(partIdFromUrl));
          if (part) {
            setSelectedMachinePart(part);
            setRootMachineId(part.model_id);
            setParentPartId(Number(partIdFromUrl));
            setBreadcrumbParts([part]);
          }
        } catch (error) {
          message.error('无法加载指定的料号');
        }
      }
    };
    
    loadPartFromUrl();
  }, [partIdFromUrl]);
  
  // 处理机型选择
  const handleMachineChange = (value: number) => {
    setRootMachineId(value);
    setSelectedMachinePart(null);
    setParentPartId(null);
    setBreadcrumbParts([]);
    setShowingLevel(1);
  };
  
  // 处理机型料号选择
  const handleMachinePartChange = (value: number) => {
    const part = machineParts?.items?.find((item: Part) => item.id === value) || null;
    setSelectedMachinePart(part);
    if (part) {
      setParentPartId(part.id);
      setBreadcrumbParts([part]);
      setShowingLevel(1);
    } else {
      setParentPartId(null);
      setBreadcrumbParts([]);
    }
  };
  
  // 处理重置选择
  const handleReset = () => {
    setSelectedMachinePart(null);
    setParentPartId(null);
    setBreadcrumbParts([]);
    setShowingLevel(1);
  };
  
  // 查看下一级配件
  const handleViewSubParts = async (record: Relation) => {
    try {
      // 获取配件详细信息
      const part = await adminPartService.getPart(record.part_id);
      if (part) {
        setParentPartId(part.id);
        setShowingLevel(showingLevel + 1);
        setBreadcrumbParts([...breadcrumbParts, part]);
      }
    } catch (error) {
      message.error('无法加载配件信息');
    }
  };
  
  // 返回上一层
  const handleGoBack = () => {
    if (breadcrumbParts.length > 1) {
      const newBreadcrumbs = [...breadcrumbParts];
      newBreadcrumbs.pop();
      const parentPart = newBreadcrumbs[newBreadcrumbs.length - 1];
      setBreadcrumbParts(newBreadcrumbs);
      setParentPartId(parentPart.id);
      setShowingLevel(showingLevel - 1);
    } else {
      // 回到根层级
      handleReset();
    }
  };
  
  // 导航到特定层级
  const handleNavigateToBreadcrumb = (index: number) => {
    if (index < breadcrumbParts.length) {
      const newBreadcrumbs = breadcrumbParts.slice(0, index + 1);
      const part = newBreadcrumbs[index];
      setBreadcrumbParts(newBreadcrumbs);
      setParentPartId(part.id);
      setShowingLevel(index + 1);
    }
  };
  
  // 新增配件关联
  const handleAddRelation = () => {
    if (!parentPartId) {
      message.error('请先选择一个主机料号');
      return;
    }
    navigate(`/admin/relations/add?parent_id=${parentPartId}&level=${showingLevel}`);
  };
  
  // 删除配件关联
  const handleDeleteRelation = async (id: number) => {
    try {
      await adminRelationService.deleteRelation(id);
      message.success('删除关联成功');
      refetchRelations();
    } catch (error) {
      message.error('删除关联失败');
    }
  };
  
  // 表格列配置
  const columns = [
    {
      title: '',
      key: 'radio',
      width: 50,
      render: (_: any, record: Relation) => (
        <Radio />
      )
    },
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '型号/料号',
      key: 'part_info',
      render: (_: any, record: Relation) => (
        <div>
          <div>{record.part_pn}</div>
          <div className="text-gray-500">{record.part_name}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Relation) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => handleViewSubParts(record)}
          >
            查看下级配件
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRelation(record.id)}
          />
        </Space>
      ),
    },
  ];
  
  return (
    <div className="p-6">
      <AdminPageHeader
        title="关联关系管理"
      />
      
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Title level={5}>当前机型和料号</Title>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Text strong>机型：</Text>
            <Select
              placeholder="选择机型"
              loading={machineLoading}
              style={{ width: 240, marginLeft: 8 }}
              value={rootMachineId}
              onChange={handleMachineChange}
            >
              {machineData?.items?.map((machine: any) => (
                <Option key={machine.id} value={machine.id}>{machine.model}</Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Text strong>料号：</Text>
            <Select
              placeholder="选择料号"
              loading={machinePartsLoading}
              style={{ width: 240, marginLeft: 8 }}
              value={selectedMachinePart?.id}
              onChange={handleMachinePartChange}
              disabled={!rootMachineId}
            >
              {machineParts?.items?.map((part: Part) => (
                <Option key={part.id} value={part.id}>{part.pn} - {part.name.zh}</Option>
              ))}
            </Select>
          </div>
        </div>
        
        {!selectedMachinePart && (
          <Alert
            message="请选择机型和料号以查看关联关系"
            type="info"
            showIcon
          />
        )}
      </Card>
      
      {parentPartId && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <Breadcrumb
                items={[
                  {
                    title: '主机',
                    onClick: () => handleReset(),
                  },
                  ...breadcrumbParts.map((part, index) => ({
                    title: `${part.pn} (${part.name.zh})`,
                    onClick: () => handleNavigateToBreadcrumb(index),
                  })),
                ]}
              />
              <div className="mt-2">
                <Text type="secondary">当前层级: {showingLevel}</Text>
              </div>
            </div>
            
            <Space>
              {breadcrumbParts.length > 1 && (
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleGoBack}
                >
                  返回上级
                </Button>
              )}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddRelation}
              >
                新增配件关联
              </Button>
            </Space>
          </div>
          
          <Table
            rowKey="id"
            columns={columns}
            dataSource={relationData?.items || []}
            loading={relationLoading}
            pagination={{
              current: relationData?.page || 1,
              pageSize: relationData?.page_size || 50,
              total: relationData?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={(pagination) => {
              updateRelationParams({
                page: pagination.current,
                page_size: pagination.pageSize,
              });
            }}
          />
        </>
      )}
    </div>
  );
};

export default RelationsPage; 