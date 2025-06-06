import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Card, Tree, Button, Space, Select, message, 
  Typography, Divider, Modal, Form, InputNumber,
  Row, Col, Tag, Tooltip, Input, Radio, Alert, Badge, Spin, AutoComplete
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
import adminPartService from '../../services/admin-part.service';
import { accessoryService } from '../../services/admin-accessory.service';
import { sparePartService } from '../../services/admin-spare-part.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// 产品线类型映射
const PRODUCT_LINE_TYPE_MAP = {
  'air-cushion': 1,
  'paper': 2,
  'tape': 3,
} as const;

// 🔧 数据质量检查工具
const useDataQualityCheck = (relationsList: Relation[], selectedHostPartNumber: string) => {
  const [qualityIssues, setQualityIssues] = useState<Array<{
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    relatedIds: number[];
  }>>([]);

  const checkDataQuality = useCallback(() => {
    if (!selectedHostPartNumber || relationsList.length === 0) {
      setQualityIssues([]);
      return;
    }

    const issues: typeof qualityIssues = [];

    // 检查1：host_part_number一致性
    const inconsistentHostRecords = relationsList.filter(
      relation => relation.host_part_number?.toString() !== selectedHostPartNumber
    );
    if (inconsistentHostRecords.length > 0) {
      issues.push({
        type: 'error',
        title: '主机料号不一致',
        description: `发现${inconsistentHostRecords.length}条记录的host_part_number与当前选择的主机不一致`,
        relatedIds: inconsistentHostRecords.map(r => r.id)
      });
    }

    // 检查2：孤儿关系（父级不存在）- 修正逻辑
    const orphanRelations = relationsList.filter(relation => {
      if (!relation.parent_part_number) return false; // 主机直接子级不算孤儿
      
      // 检查parent_part_number是否存在于其他记录的child_part_number中
      // 或者parent_part_number是否就是主机料号
      const parentExists = relation.parent_part_number === selectedHostPartNumber ||
        relationsList.some(parent => parent.child_part_number === relation.parent_part_number);
      
      return !parentExists;
    });
    if (orphanRelations.length > 0) {
      issues.push({
        type: 'warning',
        title: '孤儿关系',
        description: `发现${orphanRelations.length}条记录的父级料号在关系表中不存在`,
        relatedIds: orphanRelations.map(r => r.id)
      });
    }

    // 检查3：循环引用
    const circularRefs = relationsList.filter(relation => 
      relation.part_number === relation.child_part_number
    );
    if (circularRefs.length > 0) {
      issues.push({
        type: 'error',
        title: '循环引用',
        description: `发现${circularRefs.length}条记录存在循环引用`,
        relatedIds: circularRefs.map(r => r.id)
      });
    }

    // 检查4：重复关系 - 修正逻辑，考虑完整上下文
    const relationMap = new Map<string, Relation[]>();
    relationsList.forEach(relation => {
      // 使用完整的上下文作为key，包括host, parent, part, child
      const key = `${relation.host_part_number}-${relation.parent_part_number || 'NULL'}-${relation.part_number}-${relation.child_part_number}`;
      if (!relationMap.has(key)) {
        relationMap.set(key, []);
      }
      relationMap.get(key)!.push(relation);
    });
    
    const duplicates = Array.from(relationMap.values()).filter(group => group.length > 1);
    if (duplicates.length > 0) {
      const totalDuplicates = duplicates.reduce((sum, group) => sum + group.length, 0);
      issues.push({
        type: 'warning',
        title: '重复关系',
        description: `发现${duplicates.length}组完全相同的关系记录，共${totalDuplicates}条记录`,
        relatedIds: duplicates.flat().map(r => r.id)
      });
      
      // 添加详细的重复关系信息到控制台
      console.log('数据质量检查 - 重复关系详情:', duplicates.map(group => ({
        key: `${group[0].host_part_number}-${group[0].parent_part_number || 'NULL'}-${group[0].part_number}-${group[0].child_part_number}`,
        count: group.length,
        ids: group.map(r => r.id),
        relations: group.map(r => ({
          id: r.id,
          host: r.host_part_number,
          parent: r.parent_part_number,
          part: r.part_number,
          child: r.child_part_number
        }))
      })));
    }

    // 检查5：层级异常
    const levelIssues = relationsList.filter(relation => {
      if (relation.child_type === 'spare_part' && relation.level !== 1) {
        return true; // 备件应该是Level 1
      }
      if (!relation.parent_part_number && relation.level > 1) {
        return true; // 主机直接子级应该是Level 1
      }
      return false;
    });
    if (levelIssues.length > 0) {
      issues.push({
        type: 'warning',
        title: '层级设置异常',
        description: `发现${levelIssues.length}条记录的层级设置不符合规则`,
        relatedIds: levelIssues.map(r => r.id)
      });
    }

    setQualityIssues(issues);
  }, [relationsList, selectedHostPartNumber]);

  useEffect(() => {
    checkDataQuality();
  }, [checkDataQuality]);

  return { qualityIssues, checkDataQuality };
};

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
  name_zh?: string;    // 中文名称
  name_en?: string;    // 英文名称  
  model?: string;      // 型号
}

const RelationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const { t } = useAdminI18n();
  
  // 从URL中获取查询参数
  const typeFromUrl = searchParams.get('type') as keyof typeof PRODUCT_LINE_TYPE_MAP;
  const partIdFromUrl = searchParams.get('part_id');
  
  // 根据type参数确定产品线ID
  const productLineId = typeFromUrl && PRODUCT_LINE_TYPE_MAP[typeFromUrl] 
    ? PRODUCT_LINE_TYPE_MAP[typeFromUrl] 
    : 1; // 默认为气垫机产品线
  
  // 检查是否有无效的type参数
  const isValidType = !typeFromUrl || Object.keys(PRODUCT_LINE_TYPE_MAP).includes(typeFromUrl);
  
  // 产品线类型显示名称
  const getProductLineTypeName = (type: string | null) => {
    switch (type) {
      case 'air-cushion': return '气垫机 (Air Cushion Machine)';
      case 'paper': return '纸机 (Paper Machine)';
      case 'tape': return '胶带机 (Tape Machine)';
      default: return '气垫机 (Air Cushion Machine)';
    }
  };
  
  // 状态变量
  const [hostOptions, setHostOptions] = useState<HostOption[]>([]);
  const [selectedHostPartNumber, setSelectedHostPartNumber] = useState<string | undefined>(undefined);
  
  const [relationTree, setRelationTree] = useState<RelationTreeNode[]>([]);
  const [relationsList, setRelationsList] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 树状态
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null);

  // 子级料号智能提示相关状态
  const [childPartOptions, setChildPartOptions] = useState<{ value: string; label: string; type: string }[]>([]);
  const [loadingChildParts, setLoadingChildParts] = useState(false);
  
  // 必选备件料号智能提示相关状态
  const [requiredPartsOptions, setRequiredPartsOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingRequiredParts, setLoadingRequiredParts] = useState(false);

  // 🔧 使用数据质量检查
  const { qualityIssues, checkDataQuality } = useDataQualityCheck(relationsList, selectedHostPartNumber || '');

  // ✅ 修复1: URL参数初始化 - 检查URL中的主机料号参数
  useEffect(() => {
    const urlHostPartNumber = searchParams.get('host_part_number');
    if (urlHostPartNumber) {
      console.log('RelationsPage: Found host_part_number in URL:', urlHostPartNumber);
      setSelectedHostPartNumber(urlHostPartNumber);
    }
  }, [searchParams]);

  // 初始化数据
  useEffect(() => {
    loadHostOptions();
  }, []);

  useEffect(() => {
    if (selectedHostPartNumber) {
      loadRelationTree(false); // 初始加载时使用默认展开逻辑
    }
  }, [selectedHostPartNumber]);

  // 返回到对应的主机管理页面
  const handleBack = () => {
    const typeParam = typeFromUrl ? `?type=${typeFromUrl}` : '?type=air-cushion';
    navigate(`/admin/machines${typeParam}`);
  };

  // 加载主机选项
  const loadHostOptions = async () => {
    try {
      setLoading(true);
      console.log(`RelationsPage: Loading host options from parts table for product line ${productLineId}...`);
      
      // ✅ 修复：从真正的主机料号表（wp_bjt_parts）中读取数据
      let allParts: any[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const response = await adminPartService.getParts({
          page: currentPage, 
          page_size: 100,
          product_line_id: productLineId, // 按产品线过滤
        });
        
        console.log(`RelationsPage: Parts API page ${currentPage} response:`, response);
        
        if (!response || !response.items || !Array.isArray(response.items)) {
          console.warn('RelationsPage: Parts API返回的数据结构不正确:', response);
          break;
        }
        
        allParts = allParts.concat(response.items);
        totalPages = response.total_pages || 1;
        currentPage++;
        
        console.log(`RelationsPage: Loaded parts page ${currentPage - 1}/${totalPages}, total parts so far: ${allParts.length}`);
      } while (currentPage <= totalPages);
      
      console.log(`RelationsPage: All parts loaded for product line ${productLineId}:`, allParts.length);
      
      // 从主机料号表中提取唯一料号作为主机选项
      const hostOptionsMap = new Map<string, HostOption>();
      
      allParts.forEach((part: any, index: number) => {
        if (index < 3) {
          console.log(`RelationsPage: Sample part ${index}:`, {
            id: part.id,
            product_line_id: part.product_line_id,
            part_number: part.part_number,
            name_zh: part.name_zh,
            model: part.model
          });
        }
        
        // 确保产品线匹配且有料号
        if (part.product_line_id === productLineId && part.part_number) {
          const partNumber = part.part_number.toString();
          if (!hostOptionsMap.has(partNumber)) {
            hostOptionsMap.set(partNumber, {
              value: partNumber,
              label: `${partNumber}${part.name_zh ? ` - ${part.name_zh}` : ''}${part.model ? ` (${part.model})` : ''}`,
              host_part_number: partNumber,
              name_zh: part.name_zh,
              name_en: part.name_en,
              model: part.model
            });
            console.log('RelationsPage: Added host option from parts table:', {
              partNumber,
              name_zh: part.name_zh,
              model: part.model
            });
          }
        }
      });
      
      const hostOptionsArray = Array.from(hostOptionsMap.values());
      console.log(`RelationsPage: Final host options from parts table for product line ${productLineId}:`, hostOptionsArray);
      console.log('RelationsPage: Host options count:', hostOptionsArray.length);
      setHostOptions(hostOptionsArray);
      
      // 如果URL中有指定的主机料号，则选择它
      const urlHostPartNumber = searchParams.get('host_part_number');
      if (urlHostPartNumber && hostOptionsArray.some(option => option.value === urlHostPartNumber)) {
        setSelectedHostPartNumber(urlHostPartNumber);
        console.log('RelationsPage: Auto-selected from URL:', urlHostPartNumber);
      } else if (hostOptionsArray.length > 0) {
        // ✅ 默认选中第一个主机选项，确保用户进入页面后立即看到树形结构
        setSelectedHostPartNumber(hostOptionsArray[0].value);
        console.log('RelationsPage: Auto-selected first available option:', hostOptionsArray[0].value);
      } else {
        console.log('RelationsPage: No host options available for auto-selection');
      }
    } catch (error) {
      console.error('RelationsPage: 加载主机选项失败:', error);
      message.error('加载主机选项失败');
      setHostOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载关系树
  const loadRelationTree = async (preserveExpandedState = false, newNodePath?: string) => {
    if (!selectedHostPartNumber) return;
    
    try {
      setTreeLoading(true);
      console.log(`RelationsPage: Loading relation tree for host ${selectedHostPartNumber}, product line ${productLineId}`);
      
      let allRelations: Relation[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const response = await adminRelationService.getRelations({
          page: currentPage,
          per_page: 100,
          product_line_id: productLineId,
        });
        
        if (!response || !response.items || !Array.isArray(response.items)) {
          console.warn('RelationsPage: API返回的数据结构不正确:', response);
          break;
        }
        
        allRelations = allRelations.concat(response.items);
        totalPages = response.total_pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);
      
      // 双重过滤确保数据准确性
      const filteredRelations = allRelations.filter((relation: Relation) => 
        relation.product_line_id === productLineId && 
        relation.host_part_number?.toString() === selectedHostPartNumber
      );
      
      console.log(`RelationsPage: Filtered relations for host ${selectedHostPartNumber}:`, {
        total: filteredRelations.length,
        sample: filteredRelations.slice(0, 3).map(r => ({
          id: r.id,
          part_number: r.part_number,
          parent_part_number: r.parent_part_number,
          child_part_number: r.child_part_number,
          child_type: r.child_type,
          level: r.level
        }))
      });
      
      setRelationsList(filteredRelations);
      buildRelationTree(filteredRelations, preserveExpandedState, newNodePath);
    } catch (error) {
      console.error('RelationsPage: 加载关联关系失败:', error);
      message.error('加载关联关系失败');
      setRelationTree([]);
    } finally {
      setTreeLoading(false);
    }
  };

  // 构建关系树
  const buildRelationTree = useCallback((relations: Relation[], preserveExpandedState = false, newNodePath?: string) => {
    if (!selectedHostPartNumber) return;

    console.log('buildRelationTree: Building tree for relations:', relations);

    // 获取选中主机的详细信息
    const selectedHostInfo = hostOptions.find(option => option.value === selectedHostPartNumber);
    const hostDisplayName = selectedHostInfo ? selectedHostInfo.label : selectedHostPartNumber;

    // 创建主机根节点
    const hostNode: RelationTreeNode = {
      key: `host-${selectedHostPartNumber}`,
      title: (
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center space-x-2">
            <Tag color="blue">主机</Tag>
            <Text strong>{hostDisplayName}</Text>
            {selectedHostInfo?.model && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                型号: {selectedHostInfo.model}
              </Text>
            )}
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
          </div>
        </div>
      ),
      nodeType: 'host',
      partNumber: selectedHostPartNumber,
      children: []
    };

    // 构建子节点
    const builtChildren = buildTreeNodes(relations, selectedHostPartNumber, null);
    hostNode.children = builtChildren;

    // 处理展开状态
    let keysToExpand: React.Key[] = [];
    
    if (preserveExpandedState && expandedKeys.length > 0) {
      keysToExpand = [...expandedKeys];
    } else {
      keysToExpand = [`host-${selectedHostPartNumber}`];
    }
    
    if (newNodePath) {
      // 展开到新节点的路径
      const expandNewNodePath = (nodes: RelationTreeNode[], targetPartNumber: string, currentPath: React.Key[] = []): void => {
        nodes.forEach(node => {
          const nodePath = [...currentPath, node.key];
          
          if (node.partNumber === targetPartNumber) {
            currentPath.forEach(pathKey => {
              if (!keysToExpand.includes(pathKey)) {
                keysToExpand.push(pathKey);
              }
            });
          }
          
          if (node.children && node.children.length > 0) {
            expandNewNodePath(node.children, targetPartNumber, nodePath);
          }
        });
      };
      
      expandNewNodePath(builtChildren, newNodePath);
    }
    
    if (!keysToExpand.includes(`host-${selectedHostPartNumber}`)) {
      keysToExpand.unshift(`host-${selectedHostPartNumber}`);
    }
    
    console.log('buildRelationTree: Final expanded keys:', keysToExpand);
    setExpandedKeys(keysToExpand);
    setRelationTree([hostNode]);
  }, [selectedHostPartNumber, hostOptions]);

  // 构建树节点 - 添加循环检测，修复查询逻辑
  const buildTreeNodes = (relations: Relation[], currentPartNumber: string, currentParentPartNumber: string | null, visitedNodes: Set<string> = new Set()): RelationTreeNode[] => {
    console.log(`buildTreeNodes: Building for current=${currentPartNumber}, parent=${currentParentPartNumber}, host=${selectedHostPartNumber}`);
    console.log(`buildTreeNodes: Visited nodes so far:`, Array.from(visitedNodes));
    
    // 🔧 循环检测：如果当前节点已经在访问路径中，则停止递归
    if (visitedNodes.has(currentPartNumber)) {
      console.warn(`buildTreeNodes: Detected cycle at node ${currentPartNumber}, stopping recursion`);
      return [];
    }
    
    // 添加当前节点到访问集合
    const newVisitedNodes = new Set(visitedNodes);
    newVisitedNodes.add(currentPartNumber);
    
    console.log(`buildTreeNodes: Total relations to search:`, relations.length);
    
    // 🔧 修正逻辑：查找 part_number = 当前节点料号的记录
    // 这些记录的 child_part_number 就是当前节点的子级
    const childRelations = relations.filter(relation => {
      // 首先确保是同一个主机
      const isSameHost = relation.host_part_number?.toString() === selectedHostPartNumber;
      if (!isSameHost) {
        return false;
      }
      
      if (currentPartNumber === selectedHostPartNumber) {
        // 对于主机节点：查找 parent_part_number = null 且 part_number = 主机料号
        const isHostDirectChild = relation.parent_part_number === null && 
                                 relation.part_number === selectedHostPartNumber;
        
        console.log(`buildTreeNodes: Checking host direct child for relation ${relation.id}: parent_part_number=${relation.parent_part_number}, part_number=${relation.part_number}, isHostDirectChild=${isHostDirectChild}`);
        
        if (isHostDirectChild) {
          console.log(`buildTreeNodes: Found host direct child ${relation.id}: ${relation.part_number} → ${relation.child_part_number}`);
        }
        
        return isHostDirectChild;
      } else {
        // 🔧 修正逻辑：查找 part_number = 当前节点料号的记录
        // 这些记录的 child_part_number 就是当前节点的子级
        const isCurrentNodeRelation = relation.part_number === currentPartNumber;
        
        console.log(`buildTreeNodes: Checking relation for current node ${currentPartNumber}: relation ${relation.id}, part_number=${relation.part_number}, isCurrentNodeRelation=${isCurrentNodeRelation}`);
        
        if (isCurrentNodeRelation) {
          console.log(`buildTreeNodes: Found child for node ${currentPartNumber}: ${relation.child_part_number} (relation ${relation.id})`);
        }
        
        return isCurrentNodeRelation;
      }
    });

    console.log(`buildTreeNodes: Found ${childRelations.length} child relations for ${currentPartNumber} (as parent) under host ${selectedHostPartNumber}`);
    
    // 打印详细的关系信息用于调试
    if (childRelations.length > 0) {
      console.log(`buildTreeNodes: Child relations details:`, childRelations.map(r => ({
        id: r.id,
        host_part_number: r.host_part_number,
        parent_part_number: r.parent_part_number,
        part_number: r.part_number,
        child_part_number: r.child_part_number,
        level: r.level
      })));
    }

    // 为每个子关系创建节点
    const nodes: RelationTreeNode[] = [];
    
    childRelations.forEach(relation => {
      const childPartNumber = relation.child_part_number;
      if (!childPartNumber) return;

      // 获取子级类型信息
      const getTypeInfo = () => {
        if (relation.child_type === 'spare_part') {
          return { icon: <BuildOutlined />, color: 'orange', typeName: '必选备件' };
        } else if (relation.child_type === 'accessory') {
          return { icon: <AppstoreOutlined />, color: 'green', typeName: '配件' };
        } else {
          return { icon: <SettingOutlined />, color: 'purple', typeName: '组件' };
        }
      };

      const typeInfo = getTypeInfo();

      // 🔧 修正递归调用：传递 child_part_number 作为下一级的 currentPartNumber
      // 因为我们要查找以 child_part_number 为 part_number 的关系
      const grandChildren = buildTreeNodes(relations, relation.child_part_number, currentPartNumber, newVisitedNodes);
      
      const node: RelationTreeNode = {
        key: `${selectedHostPartNumber}-${relation.id}-${relation.child_part_number}`,
        title: (
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center space-x-2">
              <Tag color={typeInfo.color} icon={typeInfo.icon}>
                {typeInfo.typeName}
              </Tag>
              <Text strong>{relation.child_part_number}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                (ID: {relation.id}, Level: {relation.level})
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                链路: {relation.parent_part_number || 'ROOT'} → {relation.part_number} → {relation.child_part_number}
              </Text>
              <Text type="secondary" style={{ fontSize: '10px', color: '#999' }}>
                Host: {relation.host_part_number}
              </Text>
              {relation.quantity > 1 && (
                <Badge count={relation.quantity} size="small" color="blue" />
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
              {relation.child_type === 'accessory' && (
                <Tooltip title="添加子配件">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleAddChild('accessory', relation.child_part_number);
                    }}
                  />
                </Tooltip>
              )}
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
        partNumber: relation.child_part_number, // 🔧 修正：使用 child_part_number 作为节点的 partNumber
        quantity: relation.quantity,
        childType: relation.child_type,
        children: grandChildren.length > 0 ? grandChildren : undefined
      };

      nodes.push(node);
    });

    console.log(`buildTreeNodes: Created ${nodes.length} tree nodes for ${currentPartNumber} under host ${selectedHostPartNumber}`);
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

  // 添加子级 - 修正关系理解
  const handleAddChild = (childType: 'accessory' | 'spare_part', clickedPartNumber: string) => {
    setModalMode('create');
    setEditingRelation(null);
    
    // 🔧 正确理解关系结构：
    // 每条记录表示：当前节点(part_number)有一个子级(child_part_number)
    // - host_part_number: 根节点（主机料号）
    // - parent_part_number: 当前节点的父级料号（为空表示当前节点直接连到根节点）
    // - part_number: 当前节点的料号
    // - child_part_number: 当前节点的子级料号
    
    // 关系类型：主要为主机和配件的层级关系，只有必选备件才涉及备件
    
    let parentPartNumber: string | null = null;
    let partNumber: string = clickedPartNumber;
    
    if (clickedPartNumber === selectedHostPartNumber) {
      // 用户点击主机节点，要为主机添加直接子级
      // 新建的关系中：当前节点就是主机，父级为空
      parentPartNumber = null; // 主机节点没有父级
      partNumber = selectedHostPartNumber; // 当前节点就是主机
    } else {
      // 用户点击某个配件节点，要为该配件添加子级
      // 需要找到被点击节点的父级料号
      const clickedNodeRelation = relationsList.find(relation => 
        relation.child_part_number === clickedPartNumber
      );
      
      if (clickedNodeRelation) {
        // 被点击的节点在某个关系中是child，那么它的父级就是那个关系的part_number
        parentPartNumber = clickedNodeRelation.part_number;
      } else {
        // 如果找不到，可能是主机的直接子级
        parentPartNumber = selectedHostPartNumber;
      }
      partNumber = clickedPartNumber; // 当前节点就是被点击的配件
    }
    
    // 根据层级确定下一级的level
    const currentNodeLevel = clickedPartNumber === selectedHostPartNumber ? 0 : 
      (relationsList.find(r => r.child_part_number === clickedPartNumber)?.level || 1);
    const nextLevel = childType === 'spare_part' ? 1 : Math.min(currentNodeLevel + 1, 5);
    
    console.log(`handleAddChild: clicked=${clickedPartNumber}, parent=${parentPartNumber}, part=${partNumber}, nextLevel=${nextLevel}`);

    // 设置表单值
    form.setFieldsValue({
      product_line_id: productLineId,
      host_part_number: selectedHostPartNumber,
      parent_part_number: parentPartNumber,
      part_number: partNumber,
      child_part_number: '', // 用户需要输入的新子级料号
      child_type: childType,
      level: nextLevel,
      quantity: 1,
      sort_order: 0,
      status: 'publish'
    });
    
    // 显示操作提示
    const typeLabel = childType === 'spare_part' ? '必选备件' : '配件';
    const relationshipHint = clickedPartNumber === selectedHostPartNumber 
      ? `为主机 "${selectedHostPartNumber}" 添加直接${typeLabel}子级`
      : `为配件 "${clickedPartNumber}" 添加${typeLabel}子级`;
    
    message.info(relationshipHint);
    
    // 只为配件类型加载选项，必选备件有专门的字段
    if (childType === 'accessory') {
      loadChildPartOptions(childType);
    }
    loadRequiredPartsOptions();
    
    setIsModalVisible(true);
  };

  // 编辑关系
  const handleEditRelation = (relation: Relation) => {
    setModalMode('edit');
    setEditingRelation(relation);
    
    // 解析依赖关系
    const requiredPartsArray = relation.required_parts ? 
      relation.required_parts.split(',').map(s => s.trim()).filter(s => s) : [];
    const requiredQuantityArray = relation.required_quantity ? 
      relation.required_quantity.split(',').map(s => s.trim()).filter(s => s) : [];
    
    form.setFieldsValue({
      product_line_id: relation.product_line_id,
      host_part_number: relation.host_part_number,
      parent_part_number: relation.parent_part_number,
      part_number: relation.part_number,
      child_part_number: relation.child_part_number,
      child_type: relation.child_type,
      level: relation.level,
      quantity: relation.quantity,
      sort_order: relation.sort_order,
      status: relation.status,
      required_parts_display: requiredPartsArray.join(', '),
      required_quantity_display: requiredQuantityArray.join(', ')
    });
    
    if (relation.child_type && relation.child_type === 'accessory') {
      loadChildPartOptions(relation.child_type);
    }
    loadRequiredPartsOptions();
    
    setIsModalVisible(true);
  };

  // 删除关系
  const handleDeleteRelation = (relation: Relation) => {
    confirm({
      title: '确认删除关系',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除关系 "${relation.part_number} → ${relation.child_part_number}" 吗？`,
      onOk: async () => {
        try {
          await adminRelationService.deleteRelation(relation.id, { cascade: true });
          message.success('删除成功');
          await loadRelationTree(true);
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
      setSubmitting(true);
      const values = await form.validateFields();
      
      console.log('RelationsPage.handleFormSubmit - Original form values:', values);

      // 1. 处理依赖关系字段
      const requiredPartsArray = values.required_parts_display 
        ? String(values.required_parts_display).split(',').map((s: string) => s.trim()).filter((s: string) => s)
        : [];
      const requiredQuantityArray = values.required_quantity_display
        ? String(values.required_quantity_display).split(',').map((s: string) => s.trim()).filter((s: string) => s)
        : [];

      // 2. 转换表单数据为API格式
      const submitData = {
        product_line_id: values.product_line_id ? Number(values.product_line_id) : productLineId,
        host_part_number: values.host_part_number ? String(values.host_part_number) : selectedHostPartNumber,
        parent_part_number: values.parent_part_number ? String(values.parent_part_number) : null,
        part_number: String(values.part_number || ''),
        child_part_number: String(values.child_part_number || ''),
        child_type: values.child_type || 'accessory',
        level: values.level ? Number(values.level) : 1,
        quantity: values.quantity ? Number(values.quantity) : 1,
        sort_order: values.sort_order ? Number(values.sort_order) : 0,
        status: values.status || 'publish',
        // 处理必选备件依赖
        required_parts: requiredPartsArray.length > 0 ? requiredPartsArray.join(',') : null,
        required_quantity: requiredQuantityArray.length > 0 ? requiredQuantityArray.join(',') : null,
      };

      // 3. 移除空值但保留必填字段
      const requiredFields = ['product_line_id', 'host_part_number', 'part_number', 'child_part_number', 'child_type', 'level', 'quantity', 'sort_order', 'status'];
      const finalData = Object.fromEntries(
        Object.entries(submitData).filter(([key, value]) => {
          return requiredFields.includes(key) || (value !== null && value !== undefined && value !== '');
        })
      );

      console.log('RelationsPage.handleFormSubmit - Final data to submit:', finalData);

      // 🔧 验证必需字段
      const requiredFieldsValidation = {
        product_line_id: finalData.product_line_id,
        host_part_number: finalData.host_part_number,
        part_number: finalData.part_number,
        child_part_number: finalData.child_part_number,
        child_type: finalData.child_type,
        level: finalData.level,
        quantity: finalData.quantity,
        status: finalData.status
      };
      
      console.log('RelationsPage.handleFormSubmit - Required fields validation:', requiredFieldsValidation);
      
      // 检查是否有缺失的必需字段
      const missingFields = Object.entries(requiredFieldsValidation)
        .filter(([key, value]) => value === undefined || value === null || value === '')
        .map(([key]) => key);
      
      if (missingFields.length > 0) {
        console.error('RelationsPage.handleFormSubmit - Missing required fields:', missingFields);
        message.error(`缺少必需字段: ${missingFields.join(', ')}`);
        return;
      }

      // 4. API调用
      if (modalMode === 'create') {
        console.log('RelationsPage.handleFormSubmit - About to call createRelation API');
        console.log('RelationsPage.handleFormSubmit - API endpoint:', '/wp-json/bjt/v1/relations');
        console.log('RelationsPage.handleFormSubmit - Request data:', JSON.stringify(finalData, null, 2));
        
        const result = await adminRelationService.createRelation(finalData);
        console.log('RelationsPage.handleFormSubmit - API response:', result);
        message.success('创建关系成功');
        
        // 🔧 修复自动展开逻辑：展开到新创建关系的父级路径
        // 新创建的关系结构是：part_number -> child_part_number
        // 我们需要确保包含这个关系的父级节点路径被展开，这样用户就能看到新创建的关系
        const relationParentPath = finalData.part_number; // 关系的父级节点
        console.log('RelationsPage.handleFormSubmit - Auto-expanding to relation parent path:', relationParentPath);
        await loadRelationTree(true, relationParentPath);
      } else if (editingRelation) {
        console.log('RelationsPage.handleFormSubmit - About to call updateRelation API');
        console.log('RelationsPage.handleFormSubmit - API endpoint:', `/wp-json/bjt/v1/relations/${editingRelation.id}`);
        console.log('RelationsPage.handleFormSubmit - Request data:', JSON.stringify(finalData, null, 2));
        
        await adminRelationService.updateRelation(editingRelation.id, finalData);
        message.success('更新关系成功');
        await loadRelationTree(true);
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('RelationsPage.handleFormSubmit - Error:', error);
      
      // 🔧 增强错误处理 - 输出更详细的错误信息用于调试
      console.error('RelationsPage.handleFormSubmit - Detailed error info:', {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorString: String(error),
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        response: error?.response,
        responseData: error?.response?.data,
        responseStatus: error?.response?.status,
        responseStatusText: error?.response?.statusText,
        stack: error?.stack
      });
      
      // 详细错误处理
      let errorMessage = '操作失败';
      
      try {
        if (error instanceof Error) {
          errorMessage = `操作失败: ${error.message}`;
          console.log('RelationsPage: Error is instance of Error:', error.message);
        } else if (typeof error === 'object' && error !== null) {
          const errorObj = error as any;
          
          // 检查HTTP响应错误
          if (errorObj.response?.data?.message) {
            errorMessage = errorObj.response.data.message;
            console.log('RelationsPage: Found response.data.message:', errorMessage);
          } else if (errorObj.response?.data?.error) {
            errorMessage = errorObj.response.data.error;
            console.log('RelationsPage: Found response.data.error:', errorMessage);
          } else if (errorObj.response?.data) {
            try {
              errorMessage = `API错误: ${JSON.stringify(errorObj.response.data)}`;
              console.log('RelationsPage: Found response.data (JSON):', errorObj.response.data);
            } catch (jsonError) {
              errorMessage = `API错误: ${String(errorObj.response.data)}`;
              console.log('RelationsPage: Found response.data (String):', errorObj.response.data);
            }
          } else if (errorObj.message) {
            errorMessage = errorObj.message;
            console.log('RelationsPage: Found error.message:', errorMessage);
          } else if (errorObj.error) {
            errorMessage = errorObj.error;
            console.log('RelationsPage: Found error.error:', errorMessage);
          } else {
            // 如果都找不到，尝试转换为字符串
            try {
              errorMessage = `未知错误: ${JSON.stringify(errorObj)}`;
              console.log('RelationsPage: Unknown error (JSON):', errorObj);
            } catch (jsonError) {
              errorMessage = `未知错误: ${String(errorObj)}`;
              console.log('RelationsPage: Unknown error (String):', errorObj);
            }
          }
        } else {
          errorMessage = `未知类型错误: ${String(error)}`;
          console.log('RelationsPage: Non-object error:', error);
        }
      } catch (parseError) {
        console.error('RelationsPage: Error parsing error message:', parseError);
        errorMessage = '错误处理失败，请检查控制台日志';
      }
      
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 加载子级料号选项
  const loadChildPartOptions = async (childType: 'accessory' | 'spare_part') => {
    try {
      setLoadingChildParts(true);
      console.log(`RelationsPage: Loading ${childType} options for product line ${productLineId}`);
      
      let options: { value: string; label: string; type: string }[] = [];
      
      if (childType === 'accessory') {
        // 获取配件料号
        let allAccessories: any[] = [];
        let currentPage = 1;
        let totalPages = 1;
        
        do {
          const response = await accessoryService.getAccessories({
            page: currentPage,
            per_page: 100,
            product_line_id: productLineId,
            status: 'publish'
          });
          
          if (response && response.items && Array.isArray(response.items)) {
            allAccessories = allAccessories.concat(response.items);
            totalPages = Math.ceil((response as any).total / (response as any).page_size) || 1;
            currentPage++;
          } else {
            break;
          }
        } while (currentPage <= totalPages);
        
        options = allAccessories.map((accessory: any) => ({
          value: accessory.part_number,
          label: `${accessory.part_number} - ${accessory.name_zh || accessory.name_en || ''}`,
          type: 'accessory'
        }));
        
        console.log(`RelationsPage: Loaded ${options.length} accessory options`);
      } else if (childType === 'spare_part') {
        // 获取备件料号
        let allSpareParts: any[] = [];
        let currentPage = 1;
        let totalPages = 1;
        
        do {
          const response = await sparePartService.getSpareParts({
            page: currentPage,
            page_size: 100,
            product_line_id: productLineId,
            status: 'publish'
          });
          
          if (response && response.items && Array.isArray(response.items)) {
            allSpareParts = allSpareParts.concat(response.items);
            totalPages = Math.ceil((response as any).total / (response as any).page_size) || 1;
            currentPage++;
          } else {
            break;
          }
        } while (currentPage <= totalPages);
        
        options = allSpareParts.map((sparePart: any) => ({
          value: sparePart.part_number,
          label: `${sparePart.part_number} - ${sparePart.name_zh || sparePart.name_en || ''}`,
          type: 'spare_part'
        }));
        
        console.log(`RelationsPage: Loaded ${options.length} spare part options`);
      }
      
      setChildPartOptions(options);
    } catch (error) {
      console.error(`RelationsPage: 加载${childType === 'accessory' ? '配件' : '备件'}料号失败:`, error);
      message.error(`加载${childType === 'accessory' ? '配件' : '备件'}料号失败`);
      setChildPartOptions([]);
    } finally {
      setLoadingChildParts(false);
    }
  };

  // 加载必选备件料号选项（is_consumable = 0的备件）
  const loadRequiredPartsOptions = async () => {
    try {
      setLoadingRequiredParts(true);
      console.log(`RelationsPage: Loading required spare parts (is_consumable = 0) for product line ${productLineId}`);
      
      let allRequiredSpareParts: any[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const response = await sparePartService.getSpareParts({
          page: currentPage,
          page_size: 100,
          product_line_id: productLineId,
          is_consumable: false, // 筛选非易损备件（is_consumable = 0）
          status: 'publish'
        });
        
        if (response && response.items && Array.isArray(response.items)) {
          allRequiredSpareParts = allRequiredSpareParts.concat(response.items);
          totalPages = Math.ceil((response as any).total / (response as any).page_size) || 1;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= totalPages);
      
      const options = allRequiredSpareParts.map((sparePart: any) => ({
        value: sparePart.part_number,
        label: `${sparePart.part_number} - ${sparePart.name_zh || sparePart.name_en || ''} (必选备件)`,
      }));
      
      console.log(`RelationsPage: Loaded ${options.length} required spare part options (is_consumable = 0)`);
      setRequiredPartsOptions(options);
    } catch (error) {
      console.error('RelationsPage: 加载必选备件料号失败:', error);
      message.error('加载必选备件料号失败');
      setRequiredPartsOptions([]);
    } finally {
      setLoadingRequiredParts(false);
    }
  };

  return (
    <div className="relations-page">
      <AdminPageHeader
        title={`${t('list.title', { ns: 'relations' })} - ${getProductLineTypeName(typeFromUrl)}`}
        description={`管理 ${getProductLineTypeName(typeFromUrl)} 产品线的层级关联关系`}
        onBack={handleBack}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => loadRelationTree(true)} disabled={!selectedHostPartNumber}>
              {t('list.refresh', { ns: 'relations' })}
            </Button>
            <Button onClick={handleReset}>
              {t('list.reset', { ns: 'relations' })}
            </Button>
            {qualityIssues.length > 0 && (
              <Button 
                type="primary" 
                danger={qualityIssues.some(issue => issue.type === 'error')}
                icon={<SettingOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '数据质量修复',
                    icon: <ExclamationCircleOutlined />,
                    content: (
                      <div>
                        <p>检测到 {qualityIssues.length} 个数据质量问题，是否需要查看详细信息并尝试修复？</p>
                        <div style={{ marginTop: '12px' }}>
                          {qualityIssues.map((issue, index) => (
                            <Tag key={index} color={issue.type === 'error' ? 'red' : 'orange'} className="mb-1">
                              {issue.title}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    ),
                    onOk: () => {
                      message.info('数据质量修复功能开发中，请手动检查相关记录');
                    }
                  });
                }}
              >
                修复数据 ({qualityIssues.length})
              </Button>
            )}
          </Space>
        }
      />

      {/* 无效类型警告 */}
      {!isValidType && (
        <Alert
          message="无效的产品线类型"
          description={`URL参数 "type=${typeFromUrl}" 无效。支持的类型: air-cushion, paper, tape。已自动使用默认类型。`}
          type="warning"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* 选择器区域 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t('list.hostPartNumber', { ns: 'relations' })}:</Text>
              <Select
                style={{ width: '100%' }}
                placeholder={hostOptions.length === 0 ? '暂无可用主机选项' : t('list.selectHost', { ns: 'relations' })}
                value={selectedHostPartNumber}
                onChange={handleHostPartNumberChange}
                disabled={hostOptions.length === 0}
                loading={loading}
                showSearch
                filterOption={(input: string, option: any) => 
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent={hostOptions.length === 0 ? (
                  <div className="text-center py-4">
                    <Text type="secondary">
                      该产品线暂无关联关系数据
                    </Text>
                  </div>
                ) : null}
              >
                {hostOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              {hostOptions.length === 0 && !loading && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  请先在主机管理页面创建主机型号和关联关系
                </Text>
              )}
            </Space>
          </Col>
          
          <Col span={16}>
            <Alert
              message={`产品线已固定为: ${getProductLineTypeName(typeFromUrl)}`}
              description={`当前正在管理 ${getProductLineTypeName(typeFromUrl)} 的关联关系。产品线ID: ${productLineId}`}
              type="info"
              showIcon
              className="mb-0"
            />
          </Col>
        </Row>
      </Card>

      {/* 关系树区域 */}
      {selectedHostPartNumber && (
        <>
          {/* 🔧 数据质量状态面板 */}
          {qualityIssues.length > 0 && (
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <span style={{ fontWeight: 'bold' }}>数据质量检查</span>
                  <Tag color="orange">发现 {qualityIssues.length} 个问题</Tag>
                </div>
                <Button size="small" onClick={checkDataQuality} icon={<ReloadOutlined />}>
                  重新检查
                </Button>
              </div>
              
              <div className="space-y-2">
                {qualityIssues.map((issue, index) => (
                  <Alert
                    key={index}
                    message={issue.title}
                    description={
                      <div>
                        <p>{issue.description}</p>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          相关记录ID: {issue.relatedIds.join(', ')}
                        </div>
                      </div>
                    }
                    type={issue.type === 'error' ? 'error' : 'warning'}
                    showIcon
                    size="small"
                    className="mb-2"
                  />
                ))}
              </div>
            </Card>
          )}

          <Card title={
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BranchesOutlined />
                <span>{t('list.relationshipTree', { ns: 'relations' })}</span>
                <Tag color="blue">{t('list.hostPartNumber', { ns: 'relations' })}: {selectedHostPartNumber}</Tag>
                <Tag color="purple">{t('list.relationshipCount', { ns: 'relations' })}: {relationsList.length}</Tag>
                <Tag color="cyan">{t('list.productLine', { ns: 'relations' })}: {productLineId}</Tag>
              </div>
              <div className="flex items-center space-x-2">
                <Text type="secondary">{t('list.legend', { ns: 'relations' })}:</Text>
                <Tag color="blue" size="small">{t('tags.host', { ns: 'relations' })}</Tag>
                <Tag color="green" size="small">配件</Tag>
                <Tag color="orange" size="small">必选备件</Tag>
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
              ) : !treeLoading ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <BranchesOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                  </div>
                  <div className="mb-4">
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                      主机 "{selectedHostPartNumber}" 暂无关联关系
                    </Text>
                  </div>
                  <div className="mb-4">
                    <Text type="secondary">
                      您可以开始为此主机添加配件组件
                    </Text>
                  </div>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => handleAddChild('accessory', selectedHostPartNumber)}
                    >
                      添加配件
                    </Button>
                  </Space>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Text type="secondary">
                    {t('empty.noData', { ns: 'relations' })}
                  </Text>
                </div>
              )}
            </Spin>
          </Card>
        </>
      )}

      {/* 编辑模态框 */}
      <Modal
        title={modalMode === 'create' ? t('create.title', { ns: 'relations' }) : t('edit.title', { ns: 'relations' })}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Divider orientation="left">基本信息 (Basic Information)</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="product_line_id"
                label="产品线 (Product Line)"
                rules={[{ required: true, message: '请选择产品线' }]}
              >
                <InputNumber disabled value={productLineId} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="host_part_number"
                label="🏠 主机料号 (Host Part Number)"
                rules={[{ required: true, message: '主机料号不能为空' }]}
                extra="整棵关系树的根节点"
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="level"
                label="层级 (Level)"
                rules={[{ required: true, message: '请设置层级' }]}
                extra="配件按嵌套层级递增，必选备件固定为1"
              >
                <InputNumber min={1} max={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">🔗 关系结构 (Relationship Structure)</Divider>
          
          {/* 关系预览组件 */}
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1890ff' }}>📊 当前关系预览:</div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <span style={{ padding: '4px 8px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginRight: '8px' }}>
                🏠 {form.getFieldValue('host_part_number') || '主机'}
              </span>
              <span style={{ margin: '0 8px' }}>→</span>
              {form.getFieldValue('parent_part_number') && (
                <>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f3e5f5', borderRadius: '4px', marginRight: '8px' }}>
                    🔗 {form.getFieldValue('parent_part_number')}
                  </span>
                  <span style={{ margin: '0 8px' }}>→</span>
                </>
              )}
              <span style={{ padding: '4px 8px', backgroundColor: '#e8f5e8', borderRadius: '4px', marginRight: '8px' }}>
                📦 {form.getFieldValue('part_number') || '当前节点'}
              </span>
              <span style={{ margin: '0 8px' }}>→</span>
              <span style={{ padding: '4px 8px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                ➕ {form.getFieldValue('child_part_number') || '新子级'}
              </span>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="parent_part_number"
                label="🔗 父级料号 (Parent Part Number)"
                extra="当前节点的父级料号，为空表示直接连接主机"
              >
                <Input placeholder="自动设置或留空" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="part_number"
                label="📦 当前节点料号 (Part Number)"
                rules={[{ required: true, message: '请输入当前节点料号' }]}
                extra="当前关系记录所代表的节点"
              >
                <Input placeholder="例如: 421343214123412343212142141" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="child_part_number"
                label="➕ 子级料号 (Child Part Number)"
                rules={[{ required: true, message: '请输入子级料号' }]}
                extra="要添加到当前节点下的子级"
              >
                {form.getFieldValue('child_type') === 'accessory' ? (
                  <AutoComplete
                    options={childPartOptions}
                    placeholder="输入配件料号"
                    filterOption={(inputValue, option) =>
                      option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1 ||
                      option?.label?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    loading={loadingChildParts}
                  />
                ) : (
                  <Input placeholder="输入必选备件料号" />
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="child_type"
                label="子级类型 (Child Type)"
                rules={[{ required: true, message: '请选择子级类型' }]}
                extra="配件支持嵌套，必选备件不支持"
              >
                <Select placeholder="选择子级类型" onChange={(value) => {
                  if (value === 'accessory') {
                    loadChildPartOptions(value);
                  }
                }}>
                  <Option value="accessory">🔧 配件 (Accessory)</Option>
                  <Option value="spare_part">🛠️ 必选备件 (Required Spare Part)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="数量 (Quantity)"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态 (Status)"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="publish">✅ 发布 (Published)</Option>
                  <Option value="draft">📝 草稿 (Draft)</Option>
                  <Option value="trash">🗑️ 回收站 (Trash)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序 (Sort Order)"
                rules={[{ required: true, message: '请输入排序号' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">🔧 依赖管理 (Dependency Management)</Divider>
          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fffbe6', borderRadius: '4px', fontSize: '13px' }}>
            💡 <strong>说明:</strong> 此处配置的是"必选备件"依赖关系，用于指定当前配件必须配套的备件及数量
          </div>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="required_parts_display"
                label="必选备件料号 (Required Parts)"
                extra="多个料号用逗号分隔，例如: 13A00001,13A00002"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="例如: 13A00001,13A00002"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="required_quantity_display"
                label="对应数量 (Required Quantity)"
                extra="与料号一一对应的数量，例如: 2,1"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="例如: 2,1"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end space-x-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>
              {t('buttons.cancel', { ns: 'relations' })}
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {modalMode === 'create' ? t('buttons.create', { ns: 'relations' }) : t('buttons.update', { ns: 'relations' })}
            </Button>
          </div>

          {/* 🔧 使用指南面板 */}
          <Card 
            size="small" 
            title="📖 关系管理使用指南 - 修正版" 
            style={{ marginTop: '24px', backgroundColor: '#f9f9f9' }}
            className="user-guide-panel"
          >
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>🔍 字段说明 (修正版)</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>host_part_number</strong>：根节点（主机料号），整棵树的根基</li>
                  <li><strong>part_number</strong>：当前节点的料号（不是父级！）</li>
                  <li><strong>parent_part_number</strong>：当前节点的父级料号，为空表示直接连到根节点</li>
                  <li><strong>child_part_number</strong>：当前节点的子级料号（用户要添加的新料号）</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#52c41a' }}>📊 关系类型说明</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>主要关系</strong>：主机与配件的层级关系</li>
                  <li><strong>配件</strong>：主机的各级配件组件，支持多层嵌套</li>
                  <li><strong>必选备件</strong>：仅涉及必选备件，不包含普通备件</li>
                  <li><strong>层级规则</strong>：配件按实际嵌套层级递增，必选备件始终为Level 1</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#faad14' }}>⚠️ 数据结构示例</h4>
                <div style={{ backgroundColor: '#fafafa', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
                  <div><strong>记录示例：</strong></div>
                  <div>• host_part_number: "421343214123412343212142141" (主机)</div>
                  <div>• parent_part_number: null (表示当前节点是主机直接子级)</div>
                  <div>• part_number: "421343214123412343212142141" (当前节点=主机)</div>
                  <div>• child_part_number: "434131" (主机的子配件)</div>
                  <div><strong>含义：</strong>主机"421343214123412343212142141"有一个直接子配件"434131"</div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ff4d4f' }}>❌ 常见错误修正</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>❌ 误解：part_number是父级 → ✅ 正确：part_number是当前节点</li>
                  <li>❌ 混淆：所有备件都添加到关系中 → ✅ 正确：仅必选备件参与关系管理</li>
                  <li>❌ 错误：备件可以有子级 → ✅ 正确：只有配件可以有子级嵌套</li>
                  <li>❌ 层级混乱：备件设为Level 2+ → ✅ 正确：必选备件固定Level 1</li>
                </ul>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#722ed1' }}>🎯 操作建议</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>从主机开始，逐级添加配件关系</li>
                  <li>必选备件作为独立项目添加，不参与配件嵌套</li>
                  <li>确保host_part_number在所有记录中保持一致</li>
                  <li>定期使用数据质量检查工具验证数据完整性</li>
                </ul>
              </div>
            </div>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default RelationsPage; 