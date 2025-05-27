import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Card, Tree, Button, Space, Select, message, 
  Typography, Divider, Modal, Form, InputNumber,
  Row, Col, Tag, Tooltip, Input, Radio, Alert, Badge, Spin
} from 'antd';
import { 
  PlusOutlined, ArrowLeftOutlined, 
  LinkOutlined, ReloadOutlined, DeleteOutlined, EditOutlined,
  BranchesOutlined, SettingOutlined, ExclamationCircleOutlined,
  AppstoreOutlined, BuildOutlined
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import adminRelationService, { Relation } from '../../services/admin-relation.service';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// 固定产品线ID
const FIXED_PRODUCT_LINE_ID = 1;

// 扩展的树节点接口
interface RelationTreeNode extends DataNode {
  key: string;
  title: React.ReactNode;
  children?: RelationTreeNode[];
  icon?: React.ReactNode;
  relation?: Relation;
  nodeType: 'host' | 'component' | 'dependency';
  partNumber: string;
  partName?: string;
  quantity?: number;
  childType?: 'accessory' | 'spare_part';
  dependencies?: string[];
  dependencyQuantities?: number[];
}

// 主机型号选项接口
interface HostOption {
  value: string;
  label: string;
  host_part_number: string;
}

const RelationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  
  // 从URL中获取查询参数
  const partIdFromUrl = searchParams.get('part_id');
  
  // 状态变量
  const [hostOptions, setHostOptions] = useState<HostOption[]>([]);
  const [selectedHostPartNumber, setSelectedHostPartNumber] = useState<string | undefined>(undefined);
  
  const [relationTree, setRelationTree] = useState<RelationTreeNode[]>([]);
  const [relationsList, setRelationsList] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  
  // 树状态
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null);

  // 初始化数据
  useEffect(() => {
    loadHostOptions();
  }, []);

  useEffect(() => {
    if (selectedHostPartNumber) {
      loadRelationTree();
    }
  }, [selectedHostPartNumber]);

  // 加载主机选项
  const loadHostOptions = async () => {
    try {
      setLoading(true);
      console.log('RelationsPage: Starting to load host options...');
      
      // 获取所有关系数据 - 通过多次API调用确保获取完整数据
      let allRelations: Relation[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const response = await adminRelationService.getRelations({
          page: currentPage, 
          per_page: 100, // 使用per_page而不是page_size
        });
        
        console.log(`RelationsPage: Page ${currentPage} API response:`, response);
        
        if (!response || !response.items || !Array.isArray(response.items)) {
          console.warn('API返回的数据结构不正确:', response);
          break;
        }
        
        allRelations = allRelations.concat(response.items);
        totalPages = response.total_pages || 1;
        currentPage++;
        
        console.log(`RelationsPage: Loaded page ${currentPage - 1}/${totalPages}, total relations so far: ${allRelations.length}`);
      } while (currentPage <= totalPages);
      
      console.log('RelationsPage: All relations loaded:', allRelations.length);
      
      // 从关联关系中提取产品线1下的唯一主机料号
      const hostPartNumbers = new Set<string>();
      const hostOptionsMap = new Map<string, HostOption>();
      
      allRelations.forEach((relation: Relation, index: number) => {
        if (index < 5) {
          console.log(`RelationsPage: Relation ${index}:`, relation);
        }
        
        if (relation.product_line_id === FIXED_PRODUCT_LINE_ID && relation.host_part_number) {
          const hostPartNumber = relation.host_part_number.toString();
          if (!hostPartNumbers.has(hostPartNumber)) {
            hostPartNumbers.add(hostPartNumber);
            hostOptionsMap.set(hostPartNumber, {
              value: hostPartNumber,
              label: `主机料号: ${hostPartNumber}`,
              host_part_number: hostPartNumber
            });
            console.log('RelationsPage: Added host option:', hostPartNumber);
          }
        }
      });
      
      const hostOptionsArray = Array.from(hostOptionsMap.values());
      console.log('RelationsPage: Final host options array:', hostOptionsArray);
      console.log('RelationsPage: Host options count:', hostOptionsArray.length);
      setHostOptions(hostOptionsArray);
      
      // 不自动选择，让用户手动选择
      // 如果URL中有指定的主机料号，则选择它
      const urlHostPartNumber = searchParams.get('host_part_number');
      if (urlHostPartNumber && hostOptionsArray.some(option => option.value === urlHostPartNumber)) {
        setSelectedHostPartNumber(urlHostPartNumber);
        console.log('RelationsPage: Auto-selected from URL:', urlHostPartNumber);
      }
    } catch (error) {
      console.error('加载主机选项失败:', error);
      message.error('加载主机选项失败');
      setHostOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载关系树
  const loadRelationTree = async () => {
    if (!selectedHostPartNumber) return;
    
    try {
      setTreeLoading(true);
      
      // 获取所有关系数据 - 通过多次API调用确保获取完整数据
      let allRelations: Relation[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const response = await adminRelationService.getRelations({
          page: currentPage,
          per_page: 100, // 使用per_page而不是page_size
        });
        
        if (!response || !response.items || !Array.isArray(response.items)) {
          console.warn('API返回的数据结构不正确:', response);
          break;
        }
        
        allRelations = allRelations.concat(response.items);
        totalPages = response.total_pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);
      
      // 筛选出指定产品线和主机料号的关联关系
      const filteredRelations = allRelations.filter((relation: Relation) => 
        relation.product_line_id === FIXED_PRODUCT_LINE_ID && 
        relation.host_part_number?.toString() === selectedHostPartNumber
      );
      
      console.log('RelationsPage: Filtered relations for host', selectedHostPartNumber, ':', filteredRelations);
      setRelationsList(filteredRelations);
      buildRelationTree(filteredRelations);
    } catch (error) {
      console.error('加载关联关系失败:', error);
      message.error('加载关联关系失败');
      setRelationTree([]);
    } finally {
      setTreeLoading(false);
    }
  };

  // 构建关系树 - 修复逻辑
  const buildRelationTree = useCallback((relations: Relation[]) => {
    if (!selectedHostPartNumber) return;

    console.log('buildRelationTree: Building tree for relations:', relations);

    // 创建主机根节点
    const hostNode: RelationTreeNode = {
      key: `host-${selectedHostPartNumber}`,
      title: (
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center space-x-2">
            <Tag color="blue">主机</Tag>
            <Text strong>{selectedHostPartNumber}</Text>
          </div>
          <div className="flex items-center space-x-1">
            <Tooltip title="添加配件">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAddChild('accessory', selectedHostPartNumber)}
              />
            </Tooltip>
            <Tooltip title="添加备件">
              <Button
                type="text"
                size="small"
                icon={<BuildOutlined />}
                onClick={() => handleAddChild('spare_part', selectedHostPartNumber)}
              />
            </Tooltip>
          </div>
        </div>
      ),
      nodeType: 'host',
      partNumber: selectedHostPartNumber,
      children: []
    };

    // 按层级构建树形结构
    const builtChildren = buildTreeNodes(relations, selectedHostPartNumber);
    hostNode.children = builtChildren;

    // 自动展开主机节点和有子节点的节点
    const keysToExpand = [`host-${selectedHostPartNumber}`];
    
    // 递归收集所有有子节点的key
    const collectExpandableKeys = (nodes: RelationTreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          keysToExpand.push(node.key);
          collectExpandableKeys(node.children);
        }
      });
    };
    
    collectExpandableKeys(builtChildren);
    setExpandedKeys(keysToExpand);
    setRelationTree([hostNode]);
  }, [selectedHostPartNumber]);

  // 构建树节点 - 根据正确的数据结构：parent_part_number → part_number → child_part_number
  const buildTreeNodes = (relations: Relation[], parentPartNumber: string): RelationTreeNode[] => {
    console.log(`buildTreeNodes: Building tree for parent ${parentPartNumber}`);
    
    // 找到所有以parentPartNumber为父级的关系
    const childRelations = relations.filter(relation => {
      if (parentPartNumber === selectedHostPartNumber) {
        // 主机层级：找到parent_part_number为null且part_number为主机料号的记录
        // 这些记录的child_part_number就是主机的直接子组件
        return relation.parent_part_number === null && relation.part_number === selectedHostPartNumber;
      } else {
        // 其他层级：找到part_number等于当前节点料号的记录
        // 这些记录的child_part_number就是当前节点的子组件
        return relation.part_number === parentPartNumber;
      }
    });

    console.log(`buildTreeNodes: For parent ${parentPartNumber}, found child relations:`, childRelations);

    // 为每个关系创建节点
    const nodes: RelationTreeNode[] = [];
    
    childRelations.forEach(relation => {
      // 子节点的料号就是child_part_number
      const nodePartNumber = relation.child_part_number;
      if (!nodePartNumber) return;

      // 解析依赖关系
      const dependencies = relation.required_parts ? relation.required_parts.split(',').map(s => s.trim()) : [];
      const dependencyQuantities = relation.required_quantity ? 
        relation.required_quantity.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [];

      // 获取子级类型图标和颜色
      const getTypeInfo = () => {
        if (relation.child_type === 'spare_part') {
          return { icon: <BuildOutlined />, color: 'orange', typeName: '备件' };
        } else if (relation.child_type === 'accessory') {
          return { icon: <AppstoreOutlined />, color: 'green', typeName: '配件' };
        } else {
          return { icon: <SettingOutlined />, color: 'purple', typeName: '组件' };
        }
      };

      const typeInfo = getTypeInfo();

      // 递归构建子节点 - 使用nodePartNumber作为下一级的parent
      const grandChildren = buildTreeNodes(relations, nodePartNumber);

      const node: RelationTreeNode = {
        key: `${selectedHostPartNumber}-${relation.id}-${nodePartNumber}`,
        title: (
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center space-x-2">
              <Tag color={typeInfo.color} icon={typeInfo.icon}>
                {typeInfo.typeName}
              </Tag>
              <Text strong>{nodePartNumber}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                (ID: {relation.id}, Level: {relation.level})
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {relation.part_number} → {relation.child_part_number}
              </Text>
              {relation.quantity > 1 && (
                <Badge count={relation.quantity} size="small" color="blue" />
              )}
              {dependencies.length > 0 && (
                <Tooltip title={`依赖料号: ${dependencies.join(', ')}`}>
                  <Tag color="red" size="small">
                    依赖{dependencies.length}项
                  </Tag>
                </Tooltip>
              )}
              {grandChildren.length > 0 && (
                <Tag color="cyan" size="small">
                  子级{grandChildren.length}项
                </Tag>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleEditRelation(relation);
                  }}
                />
              </Tooltip>
              <Tooltip title="添加子组件">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleAddChild('accessory', nodePartNumber);
                  }}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDeleteRelation(relation);
                  }}
                />
              </Tooltip>
            </div>
          </div>
        ),
        icon: typeInfo.icon,
        relation: relation,
        nodeType: 'component',
        partNumber: nodePartNumber,
        quantity: relation.quantity,
        childType: relation.child_type,
        dependencies: dependencies,
        dependencyQuantities: dependencyQuantities,
        children: grandChildren.length > 0 ? grandChildren : undefined
      };

      nodes.push(node);
    });

    return nodes;
  };

  // 处理主机料号变化
  const handleHostPartNumberChange = (value: string) => {
    setSelectedHostPartNumber(value);
  };

  // 重置
  const handleReset = () => {
    setSelectedHostPartNumber(undefined);
    setRelationTree([]);
    setRelationsList([]);
    setExpandedKeys([]);
    setSelectedKeys([]);
  };

  // 添加子级
  const handleAddChild = (childType: 'accessory' | 'spare_part', parentPartNumber: string) => {
    setModalMode('create');
    setEditingRelation(null);
    form.setFieldsValue({
      product_line_id: FIXED_PRODUCT_LINE_ID,
      host_part_number: selectedHostPartNumber,
      parent_part_number: parentPartNumber === selectedHostPartNumber ? null : parentPartNumber,
      child_type: childType,
      quantity: 1,
      sort_order: 0,
      status: 'publish'
    });
    setIsModalVisible(true);
  };

  // 编辑关系
  const handleEditRelation = (relation: Relation) => {
    setModalMode('edit');
    setEditingRelation(relation);
    
    // 解析依赖关系
    const requiredPartsArray = adminRelationService.parseRequiredParts(relation.required_parts);
    const requiredQuantityArray = adminRelationService.parseRequiredQuantity(relation.required_quantity);
    
    form.setFieldsValue({
      ...relation,
      required_parts_display: requiredPartsArray.join(', '),
      required_quantity_display: requiredQuantityArray.join(', ')
    });
    setIsModalVisible(true);
  };

  // 删除关系
  const handleDeleteRelation = (relation: Relation) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除关系 "${relation.part_number} -> ${relation.child_part_number}" 吗？`,
      onOk: async () => {
        try {
          await adminRelationService.deleteRelation(relation.id);
          message.success('删除成功');
          loadRelationTree();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理依赖关系
      const requiredPartsArray = values.required_parts_display 
        ? values.required_parts_display.split(',').map((s: string) => s.trim()).filter((s: string) => s)
        : [];
      const requiredQuantityArray = values.required_quantity_display
        ? values.required_quantity_display.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
        : [];

      const submitData = {
        ...values,
        required_parts_array: requiredPartsArray,
        required_quantity_array: requiredQuantityArray
      };

      delete submitData.required_parts_display;
      delete submitData.required_quantity_display;

      if (modalMode === 'create') {
        await adminRelationService.createRelation(submitData);
        message.success('创建成功');
      } else {
        await adminRelationService.updateRelation(editingRelation!.id, submitData);
        message.success('更新成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      loadRelationTree();
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败');
    }
  };

  return (
    <div className="relations-page">
      <AdminPageHeader
        title="关联关系管理"
        description="管理产品的多级配件关系和备件关系（产品线：1）"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadRelationTree} disabled={!selectedHostPartNumber}>
              刷新
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        }
      />

      {/* 选择器区域 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>主机料号:</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="选择主机料号"
                value={selectedHostPartNumber}
                onChange={handleHostPartNumberChange}
                disabled={hostOptions.length === 0}
                loading={loading}
                showSearch
                filterOption={(input: string, option: any) => 
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {hostOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col span={16}>
            <Alert
              message="提示"
              description="产品线固定为1。请选择主机料号以查看关联关系树。数据来源于关联关系表，树形结构支持最多5级配件嵌套，备件固定为1级。"
              type="info"
              showIcon
              className="mb-0"
            />
          </Col>
        </Row>
      </Card>

      {/* 关系树区域 */}
      {selectedHostPartNumber && (
        <Card title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BranchesOutlined />
              <span>关系结构树</span>
              <Tag color="blue">主机料号: {selectedHostPartNumber}</Tag>
              <Tag color="purple">关系数量: {relationsList.length}</Tag>
              <Tag color="cyan">产品线: {FIXED_PRODUCT_LINE_ID}</Tag>
            </div>
            <div className="flex items-center space-x-2">
              <Text type="secondary">图例:</Text>
              <Tag color="blue" size="small">主机</Tag>
              <Tag color="green" size="small">配件</Tag>
              <Tag color="orange" size="small">备件</Tag>
            </div>
          </div>
        }>
          <Spin spinning={treeLoading}>
            {relationTree.length > 0 ? (
              <Tree
                treeData={relationTree}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={setExpandedKeys}
                onSelect={setSelectedKeys}
                showIcon
                className="relation-tree"
                style={{ minHeight: '400px' }}
              />
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">
                  暂无关联关系数据，请点击主机节点的"+"按钮添加配件或备件
                </Text>
              </div>
            )}
          </Spin>
        </Card>
      )}

      {/* 编辑模态框 */}
      <Modal
        title={`${modalMode === 'create' ? '新增' : '编辑'}关联关系`}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            quantity: 1,
            status: 'publish',
            sort_order: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_line_id"
                label="产品线ID"
              >
                <InputNumber disabled style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="host_part_number"
                label="主机料号"
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="child_type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Radio.Group>
                  <Radio value="accessory">配件</Radio>
                  <Radio value="spare_part">备件</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parent_part_number"
                label="父项料号"
                help="留空表示直接属于主机"
              >
                <Input placeholder="请输入父项料号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="part_number"
                label="自身料号"
                rules={[{ required: true, message: '请输入自身料号' }]}
              >
                <Input placeholder="请输入当前记录的料号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="child_part_number"
                label="子项料号"
                rules={[{ required: true, message: '请输入子项料号' }]}
              >
                <Input placeholder="请输入子项料号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sort_order"
                label="排序"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="publish">已发布</Option>
                  <Option value="draft">草稿</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="required_parts_display"
                label="依赖料号"
                help="多个料号用逗号分隔"
              >
                <Input placeholder="例如: PN001,PN002,PN003" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="required_quantity_display"
                label="依赖数量"
                help="与依赖料号一一对应，用逗号分隔"
              >
                <Input placeholder="例如: 1,2,1" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default RelationsPage; 