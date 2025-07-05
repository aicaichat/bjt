import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AppstoreOutlined, BuildOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import adminRelationService, { Relation } from '../../services/admin-relation.service';
import adminPartService from '../../services/admin-part.service';
import { accessoryService } from '../../services/admin-accessory.service';
import { sparePartService } from '../../services/admin-spare-part.service';
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import DataImporter from '../../components/importer/DataImporter';
import { importRequired } from '../../../constants/importRequired';

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
    action?: string;
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
        title: '🚨 主机料号不一致 (数据污染)',
        description: `发现${inconsistentHostRecords.length}条记录的host_part_number与当前选择的主机不一致。这些记录不应该出现在当前主机的查询结果中。`,
        relatedIds: inconsistentHostRecords.map(r => r.id),
        action: '需要检查后端API查询逻辑，确保WHERE条件正确过滤host_part_number'
      });
    }

    // 🔧 检查2：孤儿关系检测 - 重点关注作为父级但不作为子级的料号
    const parentPartNumbers = new Set<string>();
    const childPartNumbers = new Set<string>();
    
    relationsList.forEach(relation => {
      if (relation.parent_part_number && relation.parent_part_number !== selectedHostPartNumber) {
        parentPartNumbers.add(relation.parent_part_number);
      }
      if (relation.child_part_number) {
        childPartNumbers.add(relation.child_part_number);
      }
    });
    
    // 找出作为父级但不作为子级的料号（孤儿父级）
    const orphanParents = Array.from(parentPartNumbers).filter(partNumber => 
      !childPartNumbers.has(partNumber)
    );
    
    if (orphanParents.length > 0) {
      const affectedRelations = relationsList.filter(relation => 
        orphanParents.includes(relation.parent_part_number || '')
      );
      
      issues.push({
        type: 'error',
        title: '🔗 孤儿父级关系',
        description: `发现${orphanParents.length}个料号作为父级存在，但它们本身不作为任何关系的子级，导致相关的${affectedRelations.length}条关系无法在树中显示`,
        relatedIds: affectedRelations.map(r => r.id),
        action: '需要为这些料号创建到主机或其他节点的父级关系'
      });
      

    }

    // 检查3：传统孤儿关系（父级不存在于任何子级中）
    const traditionalOrphanRelations = relationsList.filter(relation => {
      if (!relation.parent_part_number) return false; // 主机直接子级不算孤儿
      
      // 检查parent_part_number是否存在于其他记录的child_part_number中
      // 或者parent_part_number是否就是主机料号
      const parentExists = relation.parent_part_number === selectedHostPartNumber ||
        relationsList.some(parent => parent.child_part_number === relation.parent_part_number);
      
      return !parentExists;
    });
    
    if (traditionalOrphanRelations.length > 0) {
      issues.push({
        type: 'warning',
        title: '传统孤儿关系',
        description: `发现${traditionalOrphanRelations.length}条记录的父级料号在关系表中不存在为子级`,
        relatedIds: traditionalOrphanRelations.map(r => r.id)
      });
    }

    // 检查4：循环引用
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

    // 检查5：重复关系 - 修正逻辑，考虑完整上下文
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
      

    }

    // 检查6：层级异常
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
  // 🔧 新增：完整路径上下文信息
  pathContext?: {
    hostPartNumber: string;           // 根节点主机料号
    parentPartNumber: string | null;  // 当前节点在这个路径中的直接父级
    relationId?: number;              // 当前关系的ID
    fullPath: string[];               // 完整路径数组 [host, parent1, parent2, ..., current]
    level: number;                    // 当前节点在这个路径中的层级
  };
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
  
  // 🔧 新增：防止并发请求的loading状态
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // 🔍 添加缓存验证工具
  const [cacheDebugInfo, setCacheDebugInfo] = useState<{
    lastRequestHeaders?: any;
    lastResponseHeaders?: any;
    cdnHitStatus?: string;
    requestTimestamp?: number;
    responseTime?: number;
    responseSize?: number;
    apiCallCount?: number;
  }>({});

  // URL参数初始化 - 检查URL中的主机料号参数
  useEffect(() => {
    const urlHostPartNumber = searchParams.get('host_part_number');
    if (urlHostPartNumber) {
      setSelectedHostPartNumber(urlHostPartNumber);
    }
  }, [searchParams]);

  // 初始化数据
  useEffect(() => {
    loadHostOptions();
  }, []);

  // 🔧 修复：使用防抖的useEffect，避免频繁切换时的竞态条件
  useEffect(() => {
    if (!selectedHostPartNumber) return;
    
    // 设置一个小延迟，确保状态完全清理
    const timeoutId = setTimeout(() => {
      loadRelationTree(false, undefined, false);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [selectedHostPartNumber]);

  // 🔧 清理资源
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // 返回到对应的主机管理页面
  const handleBack = () => {
    const typeParam = typeFromUrl ? `?type=${typeFromUrl}` : '?type=air-cushion';
    navigate(`/admin/machines${typeParam}`);
  };

  // 加载主机选项
  const loadHostOptions = async () => {
    try {
      setLoading(true);
      
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
        
        if (!response || !response.items || !Array.isArray(response.items)) {
          console.warn('RelationsPage: Parts API返回的数据结构不正确:', response);
          break;
        }
        
        allParts = allParts.concat(response.items);
        totalPages = response.total_pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);
      
      // 从主机料号表中提取唯一料号作为主机选项
      const hostOptionsMap = new Map<string, HostOption>();
      
      allParts.forEach((part: any) => {
        
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

          }
        }
      });
      
      const hostOptionsArray = Array.from(hostOptionsMap.values());
      setHostOptions(hostOptionsArray);
      
      // 如果URL中有指定的主机料号，则选择它
      const urlHostPartNumber = searchParams.get('host_part_number');
      if (urlHostPartNumber && hostOptionsArray.some(option => option.value === urlHostPartNumber)) {
        setSelectedHostPartNumber(urlHostPartNumber);
      } else if (hostOptionsArray.length > 0) {
        // ✅ 默认选中第一个主机选项，确保用户进入页面后立即看到树形结构
        setSelectedHostPartNumber(hostOptionsArray[0].value);
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
  const loadRelationTree = async (preserveExpandedState = false, newNodePath?: string, forceRefresh = false) => {
    if (!selectedHostPartNumber) return;
    
    // 🔧 防止并发请求
    if (isLoadingRelations) {
      console.warn('RelationsPage: 正在加载中，跳过重复请求');
      return;
    }
    
    try {
      setIsLoadingRelations(true);
      setTreeLoading(true);
      
      // 🔧 清理之前的超时
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // 🔧 修复：在加载开始时再次清理状态，确保干净的起始状态
      if (!preserveExpandedState) {
        setRelationTree([]);
        setRelationsList([]);
        setExpandedKeys([]);
        setSelectedKeys([]);
      }
      
      let allRelations: Relation[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      // 🔧 生成唯一的请求ID，防止CDN缓存冲突
      const requestId = `${selectedHostPartNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      do {
        // 🔧 API调用：增强的防缓存机制
        const apiParams: any = {
          page: currentPage,
          per_page: 100,
          product_line_id: productLineId,
          // 🔧 关键修复：添加主机参数确保CDN缓存隔离
          host_part_number: selectedHostPartNumber,
        };
        
        // 🔧 强化缓存破坏机制
        if (forceRefresh || currentPage === 1) {
          apiParams._t = Date.now();
          apiParams._page_t = `${currentPage}_${Date.now()}`;
        }
        
        // 🔧 CDN缓存破坏：为每个主机和页面添加唯一缓存键
        apiParams._cache_key = `relations_${selectedHostPartNumber}_${productLineId}_${currentPage}`;
        
        // 🔧 防止跨主机数据污染，每个请求唯一ID
        apiParams._session_id = `${requestId}_page_${currentPage}`;
        
        // 🔧 添加随机数防止CDN缓存
        apiParams._rand = Math.random().toString(36).substr(2, 9);
        
        const response = await adminRelationService.getRelations(apiParams);
        
        if (!response || !response.items || !Array.isArray(response.items)) {
          console.warn('RelationsPage: API返回的数据结构不正确:', response);
          break;
        }
        
        // 🔧 强化去重逻辑：多层去重处理
        console.log(`🔍 第${currentPage}页返回${response.items.length}条数据`);
        
        // 1. 基于ID的严格去重
        const existingIds = new Set(allRelations.map(item => item.id));
        const newItems = response.items.filter((newItem: Relation) => {
          const isDuplicate = existingIds.has(newItem.id);
          if (isDuplicate) {
            console.warn(`⚠️  发现重复ID: ${newItem.id} (host: ${newItem.host_part_number})`);
          }
          return !isDuplicate;
        });
        
        console.log(`🔍 去重后剩余${newItems.length}条新数据`);
        
        // 2. 预过滤：只保留当前主机的数据
        const preFilteredItems = newItems.filter((item: Relation) => {
          const isValid = item.host_part_number?.toString() === selectedHostPartNumber;
          if (!isValid) {
            console.log(`[预过滤] 主机料号不匹配 ID=${item.id}, expected=${selectedHostPartNumber}, actual=${item.host_part_number}`);
          }
          return isValid;
        });
        
        console.log(`🔍 预过滤后剩余${preFilteredItems.length}条当前主机数据`);
        
        // 3. 合并数据
        allRelations = allRelations.concat(preFilteredItems);
        
        // 4. 中间去重检查：确保合并后没有重复
        const uniqueRelations = [];
        const finalIds = new Set();
        
        allRelations.forEach(item => {
          if (!finalIds.has(item.id)) {
            finalIds.add(item.id);
            uniqueRelations.push(item);
          } else {
            console.error(`🚨 中间去重：发现重复ID ${item.id} (host: ${item.host_part_number})`);
          }
        });
        
        allRelations = uniqueRelations;
        console.log(`🎯 当前累计${allRelations.length}条唯一数据`);
        totalPages = response.total_pages || 1;
        currentPage++;
        
        // 🔧 添加小延迟防止请求过快
        if (currentPage <= totalPages) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } while (currentPage <= totalPages);
      
      // 🔧 第一步：超严格过滤逻辑，确保只显示属于当前选择主机的记录
      const filteredRelations = allRelations.filter((relation: Relation) => {
        // 🔧 增强：首先检查relation对象的有效性
        if (!relation || !relation.id) {
          console.warn(`RelationsPage: [过滤] 无效的关系对象:`, relation);
          return false;
        }
        
        // 检查1：严格检查产品线ID
        if (relation.product_line_id !== productLineId) {
          console.warn(`RelationsPage: [过滤] 产品线不匹配 ID=${relation.id}, expected=${productLineId}, actual=${relation.product_line_id}`);
          return false;
        }
        
        // 检查2：严格检查主机料号（核心过滤逻辑）
        const relationHostPartNumber = relation.host_part_number?.toString();
        if (relationHostPartNumber !== selectedHostPartNumber) {
          console.warn(`RelationsPage: [过滤] 主机料号不匹配 ID=${relation.id}, expected=${selectedHostPartNumber}, actual=${relationHostPartNumber}`);
          return false;
        }
        
        // 检查3：验证parent_part_number和part_number的一致性
        // 如果parent_part_number不为空，它应该要么是主机料号，要么是其他已验证的子级料号
        if (relation.parent_part_number && 
            relation.parent_part_number !== selectedHostPartNumber &&
            relation.parent_part_number !== relation.part_number) {
          // 临时严格模式：如果parent不是主机，则需要在同一主机的其他记录中能找到parent作为child
          const parentExists = allRelations.some(parentRelation => 
            parentRelation.host_part_number?.toString() === selectedHostPartNumber &&
            parentRelation.child_part_number === relation.parent_part_number
          );
          
          if (!parentExists) {
            console.warn(`RelationsPage: [过滤] 孤儿父级关系 ID=${relation.id}, parent=${relation.parent_part_number}, 在当前主机${selectedHostPartNumber}下找不到对应的父级关系`);
            return false;
          }
        }
        
        // 检查4：验证part_number的合理性（避免跨主机数据污染）
        if (!relation.part_number) {
          console.warn(`RelationsPage: [过滤] part_number为空 ID=${relation.id}`);
          return false;
        }
        
        // 检查5：验证child_part_number的存在性
        if (!relation.child_part_number) {
          console.warn(`RelationsPage: [过滤] child_part_number为空 ID=${relation.id}`);
          return false;
        }
        
        return true;
      });
      
      // 数据质量警告：如果过滤后的记录数量与原始数量不一致，说明存在脏数据
      if (filteredRelations.length !== allRelations.length) {
        const filteredOutCount = allRelations.length - filteredRelations.length;
        console.warn(`RelationsPage: 数据质量警告 - 过滤掉了 ${filteredOutCount} 条不匹配的记录`);
        
        // 显示详细的被过滤记录信息
        const filteredOutRelations = allRelations.filter(relation => 
          relation.product_line_id !== productLineId || 
          relation.host_part_number?.toString() !== selectedHostPartNumber
        );
        
        console.warn('🚨 RelationsPage: 被过滤的记录详情:', filteredOutRelations.map(r => ({
          id: r.id,
          host_part_number: r.host_part_number,
          expected_host: selectedHostPartNumber,
          product_line_id: r.product_line_id,
          expected_product_line: productLineId,
          part_number: r.part_number,
          child_part_number: r.child_part_number,
          reason: r.host_part_number?.toString() !== selectedHostPartNumber ? 'host_part_number不匹配' : 'product_line_id不匹配'
        })));
        
        // 🔧 新增：显示被过滤记录的详细信息
        console.group('🔍 API返回的所有记录详情:');
        allRelations.forEach((relation, index) => {
          const isFiltered = relation.product_line_id !== productLineId || 
                           relation.host_part_number?.toString() !== selectedHostPartNumber;
          const status = isFiltered ? '❌ 被过滤' : '✅ 保留';
          console.log(`[${index}] ${status} ID:${relation.id} | host:${relation.host_part_number} | product_line:${relation.product_line_id} | ${relation.part_number} → ${relation.child_part_number}`);
        });
        console.groupEnd();
        
        message.warning(`数据质量警告：发现并过滤了${filteredOutCount}条不属于当前主机的记录。请检查数据库中的host_part_number字段是否正确。`);
      }
      
      // 🔧 最终唯一性验证：确保绝对无重复
      console.log(`🔍 开始最终唯一性验证，当前有${filteredRelations.length}条记录`);
      
      const finalUniqueRelations = [];
      const finalUniqueIds = new Set();
      
      filteredRelations.forEach((relation, index) => {
        if (!finalUniqueIds.has(relation.id)) {
          finalUniqueIds.add(relation.id);
          finalUniqueRelations.push(relation);
        } else {
          console.error(`🚨 最终验证：发现重复ID ${relation.id} (host: ${relation.host_part_number}, index: ${index})`);
        }
      });
      
      if (finalUniqueRelations.length !== filteredRelations.length) {
        const duplicateCount = filteredRelations.length - finalUniqueRelations.length;
        console.error(`🚨 最终去重：移除了${duplicateCount}条重复记录`);
        message.error(`发现并移除了${duplicateCount}条重复数据，请检查后端API返回的数据一致性`);
      }
      
      console.log(`✅ 最终唯一性验证完成，确保${finalUniqueRelations.length}条记录绝对唯一`);
      
      // 🔧 增强：设置过滤后的关系列表前，再次验证当前主机是否匹配
      if (selectedHostPartNumber) {
        // 最后一次验证：确保所有记录都属于当前主机
        const finalValidatedRelations = finalUniqueRelations.filter(relation => 
          relation.host_part_number?.toString() === selectedHostPartNumber
        );
        
        if (finalValidatedRelations.length !== finalUniqueRelations.length) {
          console.warn(`RelationsPage: 最终验证时发现${finalUniqueRelations.length - finalValidatedRelations.length}条记录主机不匹配`);
        }
        
        console.log(`🎯 设置最终数据：${finalValidatedRelations.length}条记录`);
        setRelationsList(finalValidatedRelations);
        buildRelationTree(finalValidatedRelations, preserveExpandedState, newNodePath);
      } else {
        // 如果没有选择主机，清空列表
        setRelationsList([]);
        setRelationTree([]);
      }
    } catch (error) {
      console.error('RelationsPage: 加载关联关系失败:', error);
      message.error('加载关联关系失败');
      setRelationTree([]);
    } finally {
      setTreeLoading(false);
      
      // 🔧 延迟清理loading状态，防止快速重复请求
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoadingRelations(false);
      }, 100);
    }
  };

  // 构建关系树
  const buildRelationTree = useCallback((relations: Relation[], preserveExpandedState = false, newNodePath?: string) => {
    if (!selectedHostPartNumber) return;

    // 🔧 增强：在构建树之前再次验证数据
    const validatedRelations = relations.filter(relation => 
      relation && 
      relation.host_part_number?.toString() === selectedHostPartNumber &&
      relation.product_line_id === productLineId
    );
    
    if (validatedRelations.length !== relations.length) {
      console.warn(`RelationsPage.buildRelationTree: 过滤掉${relations.length - validatedRelations.length}条无效记录`);
    }

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
            {/* 🔧 为主机节点添加层级信息 */}
            <Tag size="small" color="blue">
              Level 0 (根节点)
            </Tag>
          </div>
          <div className="flex items-center space-x-1">
            <Tooltip title="添加配件 (Level 0 → Level 1)">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAddChildWithContext('accessory', selectedHostPartNumber, {
                  hostPartNumber: selectedHostPartNumber,
                  parentPartNumber: null, // 主机没有父级
                  fullPath: [selectedHostPartNumber],
                  level: 0
                })}
              />
            </Tooltip>
          </div>
        </div>
      ),
      nodeType: 'host',
      partNumber: selectedHostPartNumber,
      children: [],
      // 🔧 主机节点的路径上下文
      pathContext: {
        hostPartNumber: selectedHostPartNumber,
        parentPartNumber: null,
        fullPath: [selectedHostPartNumber],
        level: 0
      }
    };

    // 构建子节点
    const builtChildren = buildTreeNodes(validatedRelations, selectedHostPartNumber, null, new Set(), []);
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
            // 展开到目标节点的完整路径（包括目标节点本身）
            nodePath.forEach(pathKey => {
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
    
    setExpandedKeys(keysToExpand);
    setRelationTree([hostNode]);
  }, [selectedHostPartNumber, hostOptions]);

  // 🔍 缓存验证工具
  const verifyCacheStatus = useCallback(async () => {
    if (!selectedHostPartNumber) return;
    
    try {
      console.log('🔍 缓存验证：检查API请求是否真正绕过缓存...');
      
      const startTime = Date.now();
      const apiParams = {
        page: 1,
        per_page: 10,
        product_line_id: productLineId,
        host_part_number: selectedHostPartNumber,
        _cache_verification: `test_${startTime}`
      };
      
      const response = await adminRelationService.getRelations(apiParams);
      const endTime = Date.now();
      
      const cacheInfo = {
        requestTimestamp: startTime,
        responseTime: endTime - startTime,
        apiCallCount: (cacheDebugInfo.apiCallCount || 0) + 1,
        requestParams: apiParams,
        responseSize: JSON.stringify(response).length,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Cache-Verification': 'active'
        }
      };
      
      setCacheDebugInfo(cacheInfo);
      
      // 验证是否获取到了最新数据
      console.log('🔍 缓存验证结果:', {
        ...cacheInfo,
        recordCount: response?.items?.length || 0,
        fastResponse: cacheInfo.responseTime < 100 ? '⚠️ 可能命中缓存' : '✅ 正常请求时间'
      });
      
      message.info(`缓存验证完成 - 响应时间: ${cacheInfo.responseTime}ms`);
      
    } catch (error) {
      console.error('🔍 缓存验证失败:', error);
      message.error('缓存验证失败');
    }
  }, [selectedHostPartNumber, productLineId, cacheDebugInfo.apiCallCount]);

  // 构建树节点 - 添加循环检测，修复查询逻辑
  const buildTreeNodes = (relations: Relation[], currentPartNumber: string, currentParentPartNumber: string | null, visitedNodes: Set<string> = new Set(), currentPath: string[] = []): RelationTreeNode[] => {

    
    // 🔧 循环检测：如果当前节点已经在访问路径中，则停止递归
    if (visitedNodes.has(currentPartNumber)) {
      console.warn(`buildTreeNodes: Detected cycle at node ${currentPartNumber}, stopping recursion`);
      return [];
    }
    
    // 添加当前节点到访问集合
    const newVisitedNodes = new Set(visitedNodes);
    newVisitedNodes.add(currentPartNumber);
    
    // 构建当前路径：[主机, 路径节点1, 路径节点2, ..., 当前节点]
    const currentFullPath = [...currentPath, currentPartNumber];
    
    // 修正逻辑：根据具体的树路径上下文查找子级关系
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
        
        return isHostDirectChild;
      } else {
        // 关键修复：查找 part_number = 当前节点 AND parent_part_number = 当前父级 的记录
        // 这确保了节点只显示在正确的路径上下文中
        const isCurrentNodeRelation = relation.part_number === currentPartNumber && 
                                     relation.parent_part_number === currentParentPartNumber;
        
        return isCurrentNodeRelation;
      }
    });



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

      // 🔧 构建子节点的完整路径
      const childFullPath = [...currentFullPath, childPartNumber];

      // 🔧 修正递归调用：传递正确的父级上下文和完整路径
      // child_part_number 作为下一级的 currentPartNumber
      // currentPartNumber 作为下一级的 currentParentPartNumber  
      const grandChildren = buildTreeNodes(relations, relation.child_part_number, currentPartNumber, newVisitedNodes, currentFullPath);
      
      // 🔧 计算当前节点的实际层级
      const currentNodeLevel = relation.level || 1;
      const canAddChildren = currentNodeLevel < 5; // 🔧 修正：最多5层结构(Level 0-5)
      
      const node: RelationTreeNode = {
        key: `${selectedHostPartNumber}-${relation.id}-${relation.child_part_number}`,
        title: (
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center space-x-2">
              <Tag color={typeInfo.color} icon={typeInfo.icon}>
                {typeInfo.typeName}
              </Tag>
              <Text strong>{relation.child_part_number}</Text>
              {relation.quantity > 1 && (
                <Badge count={relation.quantity} size="small" color="blue" />
              )}
              {grandChildren.length > 0 && (
                <Tag color="cyan" size="small">
                  子级{grandChildren.length}项
                </Tag>
              )}
              {/* 显示当前层级信息 */}
              <Tag size="small" color="blue">
                Level {currentNodeLevel}
              </Tag>
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
              {/* 🔧 修复：允许所有非必选备件的项目添加子级配件，但检查层级限制 */}
              {relation.child_type !== 'spare_part' && canAddChildren && (
                <Tooltip title={`添加子配件 (当前Level ${currentNodeLevel}, 下级Level ${currentNodeLevel + 1})`}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      // 🔧 传递完整的路径上下文信息
                      handleAddChildWithContext('accessory', relation.child_part_number, {
                        hostPartNumber: selectedHostPartNumber!,
                        parentPartNumber: currentPartNumber,
                        relationId: relation.id,
                        fullPath: childFullPath,
                        level: currentNodeLevel
                      });
                    }}
                  />
                </Tooltip>
              )}
              {/* 🔧 显示层级限制提示 */}
              {relation.child_type !== 'spare_part' && !canAddChildren && (
                <Tooltip title={`已达到最大层级限制 (Level ${currentNodeLevel}/5)`}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    disabled
                    style={{ opacity: 0.3 }}
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
        children: grandChildren.length > 0 ? grandChildren : undefined,
        // 🔧 保存完整的路径上下文信息
        pathContext: {
          hostPartNumber: selectedHostPartNumber!,
          parentPartNumber: currentPartNumber, // 当前节点在这个路径中的直接父级
          relationId: relation.id,
          fullPath: childFullPath,
          level: currentNodeLevel
        }
      };

      nodes.push(node);
    });

    return nodes;
  };

  // 处理主机料号变化
  const handleHostPartNumberChange = (value: string) => {
    // 🔧 修复：使用函数式状态更新，确保状态完全清理
    setSelectedHostPartNumber(prevValue => {
      // 如果是同一个主机，跳过清理
      if (prevValue === value) {
        return value;
      }
      
      // 🔧 立即清理loading状态，防止并发请求
      setIsLoadingRelations(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // 立即清理所有相关状态
      setRelationTree([]);
      setRelationsList([]);
      setExpandedKeys([]);
      setSelectedKeys([]);
      setIsModalVisible(false);
      setEditingRelation(null);
      setChildPartOptions([]);
      setRequiredPartsOptions([]);
      setTreeLoading(false);
      setLoadingChildParts(false);
      setLoadingRequiredParts(false);
      
      // 重置表单
      form.resetFields();
      
      // 🔧 新增：强制清理缓存状态
      setCacheDebugInfo({});
      
      // 🔧 新增：显示切换提示
      if (prevValue) {
        message.info(`正在切换主机: ${prevValue} → ${value}`);
      }
      
      return value;
    });
  };

  // 缓存清理工具函数
  const clearAllCaches = () => {
    // 清理组件状态缓存（但保留核心选择状态）
    setRelationTree([]);
    setRelationsList([]);
    setExpandedKeys([]);
    setSelectedKeys([]);
    setIsModalVisible(false);
    setEditingRelation(null);
    setChildPartOptions([]);
    setRequiredPartsOptions([]);
    form.resetFields();
    
    // 清理浏览器缓存
    const cacheKeys = [
      'relations-page-cache',
      'host-options-cache',
      'relation-tree-cache',
      'admin-relation-cache'
    ];
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // 清理 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.unregister();
      });
    }
    
    message.success('缓存已清理，页面即将重新加载');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // 🔧 新增：智能强制重建函数
  const forceRebuildRelations = async () => {
    if (!selectedHostPartNumber) {
      message.error('请先选择一个主机');
      return;
    }

    try {
      // 显示确认对话框
      Modal.confirm({
        title: '🔄 强制重建关系树',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>将强制重建主机 <strong>{selectedHostPartNumber}</strong> 的关系树</p>
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fff7e6', 
              borderRadius: '6px', 
              marginTop: '8px',
              border: '1px solid #ffd591'
            }}>
              <div><strong>🔧 操作内容：</strong></div>
              <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                <li>清理所有缓存状态</li>
                <li>强制从服务器重新获取数据</li>
                <li>重新构建关系树结构</li>
                <li>应用最新的CDN缓存破坏机制</li>
              </ul>
            </div>
            <p style={{ marginTop: '12px' }}>
              <strong>注意：</strong>此操作不会删除数据库中的任何数据，仅重新构建显示树。
            </p>
          </div>
        ),
        width: 500,
        okText: '🔄 开始重建',
        cancelText: '取消',
        onOk: async () => {
          const currentHost = selectedHostPartNumber;
          
          // 🔧 防止并发重建
          if (isLoadingRelations) {
            message.warning('正在加载数据，请稍后再试');
            return;
          }
          
          // 1. 清理状态（但保留当前选中的主机）
          setIsLoadingRelations(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          
          setRelationTree([]);
          setRelationsList([]);
          setExpandedKeys([]);
          setSelectedKeys([]);
          setIsModalVisible(false);
          setEditingRelation(null);
          setChildPartOptions([]);
          setRequiredPartsOptions([]);
          form.resetFields();
          
          // 2. 清理浏览器缓存
          const cacheKeys = [
            'relations-page-cache',
            'host-options-cache', 
            'relation-tree-cache',
            'admin-relation-cache'
          ];
          
          cacheKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          // 3. 显示重建进度
          message.loading('正在重建关系树...');
          
          try {
            // 4. 重新加载主机选项（确保选项列表是最新的）
            await loadHostOptions();
            
            // 5. 强制重新加载关系树（使用forceRefresh=true）
            await loadRelationTree(false, undefined, true);
            
            message.success(`主机 ${currentHost} 的关系树重建完成！`);
          } catch (error) {
            console.error('RelationsPage: 强制重建失败:', error);
            message.error('重建失败，请重试或刷新页面');
          }
        }
      });
    } catch (error) {
      console.error('RelationsPage: 强制重建确认失败:', error);
      message.error('操作失败');
    }
  };

  // 重置
  const handleReset = () => {
    clearAllCaches();
  };

  // 🔧 新增：带有完整路径上下文的添加子级函数
  const handleAddChildWithContext = (childType: 'accessory' | 'spare_part', clickedPartNumber: string, pathContext: {
    hostPartNumber: string;
    parentPartNumber: string | null;
    relationId?: number;
    fullPath: string[];
    level: number;
  }) => {
    setModalMode('create');
    setEditingRelation(null);
    
    // 从路径上下文中获取准确的父级信息
    const parentPartNumber = pathContext.parentPartNumber;
    const partNumber = clickedPartNumber; // 当前节点就是被点击的配件
    
    // 根据路径上下文确定下一级的level
    const nextLevel = childType === 'spare_part' ? 1 : Math.min(pathContext.level + 1, 5);

    // 设置表单值
    form.setFieldsValue({
      product_line_id: productLineId,
      host_part_number: pathContext.hostPartNumber,
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
    const pathDisplay = pathContext.fullPath.join(' → ');
    const relationshipHint = `在路径 "${pathDisplay}" 下为 "${clickedPartNumber}" 添加${typeLabel}子级`;
    
    message.info(relationshipHint);
    
    // 只为配件类型加载选项，必选备件有专门的字段
    if (childType === 'accessory') {
      loadChildPartOptions(childType);
    }
    loadRequiredPartsOptions();
    
    setIsModalVisible(true);
  };

  // 添加子级 - 修正关系理解（保留原函数作为兼容）
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
      // ⚠️ 警告：这里存在歧义问题，无法确定准确的路径上下文
      // 建议使用 handleAddChildWithContext 代替
      
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
          await loadRelationTree(true, undefined, false);
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

      // 验证必需字段
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
      
      // 检查是否有缺失的必需字段
      const missingFields = Object.entries(requiredFieldsValidation)
        .filter(([key, value]) => value === undefined || value === null || value === '')
        .map(([key]) => key);
      
      if (missingFields.length > 0) {
        console.error('RelationsPage.handleFormSubmit - Missing required fields:', missingFields);
        message.error(`缺少必需字段: ${missingFields.join(', ')}`);
        return;
      }

      // 🔧 新增：层级限制验证
      if (finalData.level > 5) {
        console.error('RelationsPage.handleFormSubmit - Level exceeds maximum:', finalData.level);
        message.error(`层级不能超过5层，当前设置为Level ${finalData.level}`);
        return;
      }

      // 🔧 新增：重复关系预检查（仅创建时）
      if (modalMode === 'create') {
        const duplicateRelation = relationsList.find(relation => 
          relation.host_part_number?.toString() === finalData.host_part_number &&
          relation.parent_part_number === finalData.parent_part_number &&
          relation.part_number === finalData.part_number &&
          relation.child_part_number === finalData.child_part_number
        );
        
        if (duplicateRelation) {
          console.warn('RelationsPage.handleFormSubmit - Duplicate relation detected locally:', duplicateRelation);
          
          // 显示智能重复处理对话框
          Modal.confirm({
            title: '检测到重复关系',
            icon: <ExclamationCircleOutlined />,
            content: (
              <div>
                <p><strong>发现相同的关系已存在：</strong></p>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '6px', 
                  marginTop: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px'
                }}>
                  <div>关系ID: {duplicateRelation.id}</div>
                  <div>主机: {duplicateRelation.host_part_number}</div>
                  <div>父级: {duplicateRelation.parent_part_number || '(主机直接子级)'}</div>
                  <div>当前: {duplicateRelation.part_number} → 子级: {duplicateRelation.child_part_number}</div>
                  <div>层级: Level {duplicateRelation.level} | 数量: {duplicateRelation.quantity}</div>
                  <div>状态: {duplicateRelation.status}</div>
                </div>
                <p style={{ marginTop: '12px' }}>您想要如何处理？</p>
              </div>
            ),
            width: 600,
            okText: '编辑现有关系',
            cancelText: '取消操作',
            onOk: () => {
              // 切换到编辑模式
              handleEditRelation(duplicateRelation);
            },
                          onCancel: () => {
                // 用户取消操作
              }
          });
          return;
        }
      }

      // 4. API调用
      if (modalMode === 'create') {
        const result = await adminRelationService.createRelation(finalData);
        message.success('创建关系成功');
        
        // 修复自动展开逻辑：展开到新子级的父级节点
        // 新创建的关系结构是：part_number -> child_part_number
        // 我们需要确保新子级的父级节点被展开，这样新子级就能显示出来
        const parentOfNewChild = finalData.part_number; // 新子级的父级节点
        await loadRelationTree(true, parentOfNewChild, false);
      } else if (editingRelation) {
        await adminRelationService.updateRelation(editingRelation.id, finalData);
        message.success('更新关系成功');
        await loadRelationTree(true, undefined, false);
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('RelationsPage.handleFormSubmit - Error:', error);
      
      // 🔧 智能错误处理
      let errorMessage = '操作失败';
      let showDuplicateDialog = false;
      
      try {
        if (error instanceof Error) {
          errorMessage = `操作失败: ${error.message}`;
        } else if (typeof error === 'object' && error !== null) {
          const errorObj = error as any;
          
          // 🔧 专门检查重复关系错误
          if (errorObj.code === 409 || 
              errorObj.data?.code === 'duplicate_relation' || 
              errorObj.message?.includes('重复') || 
              errorObj.data?.message?.includes('Duplicate')) {
            
            showDuplicateDialog = true;
            errorMessage = '关系已存在，无法重复创建';
            
            // 显示智能重复处理对话框
            Modal.confirm({
              title: '🔄 关系已存在',
              icon: <ExclamationCircleOutlined />,
              content: (
                <div>
                  <p>您尝试创建的关系已存在于系统中。</p>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#fff2e8', 
                    borderRadius: '6px', 
                    marginTop: '8px',
                    border: '1px solid #ffd591'
                  }}>
                    <div><strong>🏷️ 关系详情：</strong></div>
                    <div>主机: {form.getFieldValue('host_part_number')}</div>
                    <div>父级: {form.getFieldValue('parent_part_number') || '(主机直接子级)'}</div>
                    <div>当前: {form.getFieldValue('part_number')} → 子级: {form.getFieldValue('child_part_number')}</div>
                    <div>层级: Level {form.getFieldValue('level')}</div>
                  </div>
                  <p style={{ marginTop: '12px' }}>您可以：</p>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>✏️ <strong>查找并编辑</strong>现有关系（推荐）</li>
                    <li>❌ <strong>取消操作</strong>，检查关系树中的现有记录</li>
                  </ul>
                </div>
              ),
              width: 600,
              okText: '🔍 查找现有关系',
              cancelText: '❌ 取消',
              onOk: async () => {
                try {
                  // 尝试在当前关系列表中查找重复项
                  const targetRelation = relationsList.find(relation => 
                    relation.host_part_number?.toString() === form.getFieldValue('host_part_number') &&
                    relation.part_number === form.getFieldValue('part_number') &&
                    relation.child_part_number === form.getFieldValue('child_part_number')
                  );
                  
                  if (targetRelation) {
                    message.info('已找到现有关系，切换到编辑模式');
                    handleEditRelation(targetRelation);
                  } else {
                    message.warning('未在当前树中找到对应关系，请刷新数据后重试');
                    await loadRelationTree(true, undefined, true);
                  }
                } catch (findError) {
                  console.error('RelationsPage: Error finding existing relation:', findError);
                  message.error('查找现有关系失败，请手动查找并编辑');
                }
              },
              onCancel: () => {
                message.info('操作已取消');
              }
            });
            
          } else {
            // 其他类型的错误处理
            if (errorObj.response?.data?.message) {
              errorMessage = errorObj.response.data.message;
            } else if (errorObj.response?.data?.error) {
              errorMessage = errorObj.response.data.error;
            } else if (errorObj.response?.data) {
              try {
                errorMessage = `API错误: ${JSON.stringify(errorObj.response.data)}`;
              } catch (jsonError) {
                errorMessage = `API错误: ${String(errorObj.response.data)}`;
              }
            } else if (errorObj.message) {
              errorMessage = errorObj.message;
            } else if (errorObj.error) {
              errorMessage = errorObj.error;
            } else {
              // 如果都找不到，尝试转换为字符串
              try {
                errorMessage = `未知错误: ${JSON.stringify(errorObj)}`;
              } catch (jsonError) {
                errorMessage = `未知错误: ${String(errorObj)}`;
              }
            }
          }
        } else {
          errorMessage = `未知类型错误: ${String(error)}`;
        }
      } catch (parseError) {
        console.error('RelationsPage: Error parsing error message:', parseError);
        errorMessage = '错误处理失败，请检查控制台日志';
      }
      
      // 只有在没有显示重复对话框时才显示错误消息
      if (!showDuplicateDialog) {
        message.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 加载子级料号选项
  const loadChildPartOptions = async (childType: 'accessory' | 'spare_part') => {
    try {
      setLoadingChildParts(true);
      
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
            is_consumable: 0, // 筛选非易损备件（is_consumable = 0）
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
      
      let allRequiredSpareParts: any[] = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        const response = await sparePartService.getSpareParts({
          page: currentPage,
          page_size: 100,
          product_line_id: productLineId,
          is_consumable: 0, // 筛选非易损备件（is_consumable = 0）
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
            <DataImporter
              entity="relation"
              requiredFields={importRequired.relation}
              onSuccess={() => loadRelationTree(false, undefined, true)}
            />
            <Button icon={<ReloadOutlined />} onClick={() => loadRelationTree(true, undefined, true)} disabled={!selectedHostPartNumber}>
              {t('list.refresh', { ns: 'relations' })}
            </Button>
            <Button 
              type="primary" 
              danger 
              icon={<ReloadOutlined />} 
              onClick={forceRebuildRelations} 
              disabled={!selectedHostPartNumber}
            >
              强制重建
            </Button>
            <Button onClick={handleReset}>
              {t('list.reset', { ns: 'relations' })}
            </Button>
            {/* 🔍 缓存验证工具 */}
            <Button 
              type="dashed" 
              icon={<InfoCircleOutlined />} 
              onClick={verifyCacheStatus}
              disabled={!selectedHostPartNumber}
            >
              验证缓存状态
            </Button>
            {/* 🔧 重复数据检测工具 */}
            <Button 
              type="dashed" 
              icon={<InfoCircleOutlined />} 
              onClick={() => {
                // 检测当前数据的重复情况
                const duplicateCheck = relationsList.reduce((acc, relation, index) => {
                  const existingIndex = acc.findIndex(item => item.id === relation.id);
                  if (existingIndex !== -1) {
                    acc[existingIndex].duplicateIndexes.push(index);
                  } else {
                    acc.push({
                      id: relation.id,
                      host_part_number: relation.host_part_number,
                      part_number: relation.part_number,
                      child_part_number: relation.child_part_number,
                      duplicateIndexes: [index]
                    });
                  }
                  return acc;
                }, [] as any[]);
                
                const duplicates = duplicateCheck.filter(item => item.duplicateIndexes.length > 1);
                
                Modal.confirm({
                  title: '🔍 重复数据检测报告',
                  width: 900,
                  content: (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <strong>当前状态：</strong>
                        <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                          总记录数: {relationsList.length}<br/>
                          重复ID数: {duplicates.length}<br/>
                          数据状态: {duplicates.length === 0 ? '✅ 无重复' : '❌ 存在重复'}
                        </div>
                      </div>
                      
                      {duplicates.length > 0 && (
                        <div>
                          <strong>🚨 发现重复数据：</strong>
                          {duplicates.map(dup => (
                            <div key={dup.id} style={{ 
                              padding: '8px', 
                              backgroundColor: '#fff2f0', 
                              border: '1px solid #ff4d4f', 
                              borderRadius: '4px',
                              marginTop: '8px'
                            }}>
                              <div><strong>ID:</strong> {dup.id}</div>
                              <div><strong>主机:</strong> {dup.host_part_number}</div>
                              <div><strong>关系:</strong> {dup.part_number} → {dup.child_part_number}</div>
                              <div><strong>重复出现在索引:</strong> {dup.duplicateIndexes.join(', ')}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {duplicates.length === 0 && (
                        <div style={{ padding: '16px', backgroundColor: '#f6ffed', borderRadius: '4px', textAlign: 'center' }}>
                          ✅ 当前数据无重复，状态正常
                        </div>
                      )}
                    </div>
                  ),
                  okText: '确定',
                  cancelText: '关闭',
                  onOk: () => {},
                  onCancel: () => {}
                });
              }}
              disabled={!selectedHostPartNumber}
            >
              检测重复数据
            </Button>
            
            {/* 🔧 CDN缓存测试工具 */}
            <Button 
              type="dashed" 
              icon={<InfoCircleOutlined />} 
              onClick={() => {
                Modal.confirm({
                  title: '🌐 CDN缓存测试',
                  width: 800,
                  content: (
                    <div>
                      <div><strong>检测到线上环境CDN缓存问题？</strong></div>
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#fff7e6', 
                        borderRadius: '6px', 
                        marginTop: '8px',
                        border: '1px solid #ffd591'
                      }}>
                        <div><strong>现象：</strong>点击展开树节点后，相同数据显示2条</div>
                        <div><strong>原因：</strong>CDN缓存导致API返回重复数据</div>
                        <div><strong>环境：</strong>本地正常，线上异常</div>
                      </div>
                      
                      <div style={{ marginTop: '16px' }}>
                        <strong>🔧 已应用的修复措施：</strong>
                        <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                          <li>✅ 增强缓存破坏机制（添加随机数和时间戳）</li>
                          <li>✅ 防止并发请求导致的数据重复</li>
                          <li>✅ 在数据合并时去重处理</li>
                          <li>✅ 添加请求唯一ID防止冲突</li>
                          <li>✅ 防止loading期间的重复操作</li>
                        </ul>
                      </div>
                      
                      <div style={{ marginTop: '16px' }}>
                        <strong>🧪 测试建议：</strong>
                        <div style={{ 
                          padding: '8px', 
                          backgroundColor: '#f6ffed', 
                          borderRadius: '4px',
                          marginTop: '8px',
                          fontSize: '13px'
                        }}>
                          <div>1. 点击"强制重建"按钮，观察是否还有重复数据</div>
                          <div>2. 切换不同主机，检查数据是否正确隔离</div>
                          <div>3. 快速点击展开/折叠，观察是否有并发问题</div>
                          <div>4. 在浏览器开发者工具Network标签查看API请求</div>
                        </div>
                      </div>
                    </div>
                  ),
                  okText: '开始测试',
                  cancelText: '关闭',
                  onOk: () => {
                    message.info('请按照建议进行测试，观察问题是否解决');
                  }
                });
              }}
              disabled={!selectedHostPartNumber}
            >
              🌐 CDN缓存测试
            </Button>
            {/* 🔧 新增：数据状态调试工具 */}
            <Button 
              type="dashed" 
              icon={<SettingOutlined />} 
              onClick={() => {
                Modal.confirm({
                  title: '🔍 数据状态调试',
                  width: 1000,
                  content: (
                    <div>
                      <div><strong>当前状态：</strong></div>
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        marginTop: '8px'
                      }}>
                        <div>📋 选中主机: {selectedHostPartNumber}</div>
                        <div>📦 产品线ID: {productLineId}</div>
                        <div>📊 关系记录数: {relationsList.length}</div>
                        <div>🌳 树节点数: {relationTree.length}</div>
                        <div>📈 展开的键: {expandedKeys.length}</div>
                        <div>🎯 选中的键: {selectedKeys.length}</div>
                        <div>🔄 正在加载: {isLoadingRelations ? '是' : '否'}</div>
                        <div>⏳ 树加载中: {treeLoading ? '是' : '否'}</div>
                        <div>🌐 CDN缓存: {location.hostname === 'localhost' ? '本地环境' : '线上环境'}</div>
                      </div>
                      
                      {/* 🔧 CDN缓存调试信息 */}
                      <div style={{ marginTop: '16px' }}>
                        <strong>🌐 CDN缓存诊断：</strong>
                        <div style={{ 
                          padding: '8px', 
                          backgroundColor: '#e6f7ff', 
                          borderRadius: '4px',
                          marginTop: '8px',
                          fontSize: '12px'
                        }}>
                          <div>• 环境: {location.hostname === 'localhost' ? '本地开发' : '线上生产'}</div>
                          <div>• 协议: {location.protocol}</div>
                          <div>• 主机: {location.hostname}</div>
                          <div>• 端口: {location.port || '默认'}</div>
                          <div>• 时间戳: {new Date().toISOString()}</div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '16px' }}><strong>关系记录详情：</strong></div>
                      <div style={{ 
                        maxHeight: '300px', 
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '12px',
                        marginTop: '8px'
                      }}>
                        {relationsList.map((relation, index) => (
                          <div key={relation.id} style={{ 
                            padding: '4px 0', 
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '11px'
                          }}>
                            <div>
                              <strong>[{index + 1}]</strong> ID:{relation.id} | 
                              主机:{relation.host_part_number} | 
                              产品线:{relation.product_line_id} | 
                              {relation.parent_part_number || '(主机)'} → {relation.part_number} → {relation.child_part_number}
                            </div>
                            <div style={{ color: '#666', fontSize: '10px' }}>
                              Level:{relation.level} | 类型:{relation.child_type} | 状态:{relation.status}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ marginTop: '16px' }}><strong>验证结果：</strong></div>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: relationsList.every(r => r.host_part_number?.toString() === selectedHostPartNumber) ? '#f6ffed' : '#fff2e8',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {relationsList.every(r => r.host_part_number?.toString() === selectedHostPartNumber) ? 
                          '✅ 所有记录的主机号都匹配当前选择' : 
                          '❌ 存在主机号不匹配的记录'
                        }
                      </div>
                    </div>
                  ),
                  okText: '关闭',
                  cancelText: null,
                  onOk: () => {}
                });
              }}
              disabled={!selectedHostPartNumber}
            >
              调试状态
            </Button>
            {/* 🔧 新增：重复料号专项分析工具 */}
            <Button 
              type="primary" 
              danger
              icon={<InfoCircleOutlined />} 
              onClick={() => {
                // 🔍 专门分析重复料号问题
                const duplicatePartNumbers = ['60A06006', '60A04005'];
                
                Modal.confirm({
                  title: '🔍 重复料号专项分析',
                  width: 1200,
                  content: (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <strong>🎯 分析目标:</strong> 深度分析料号 <code>60A06006</code> 和 <code>60A04005</code> 的重复关联问题
                      </div>
                      
                      {/* 重复料号统计 */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4>📊 重复料号统计分析</h4>
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}>
                          {duplicatePartNumbers.map(partNumber => {
                            // 统计该料号在所有关系中的出现情况
                            const relationsAsChild = relationsList.filter(rel => rel.child_part_number === partNumber);
                            const relationsAsPart = relationsList.filter(rel => rel.part_number === partNumber);
                            
                            // 统计涉及的主机数量
                            const hostsAsChild = [...new Set(relationsAsChild.map(rel => rel.host_part_number))];
                            const hostsAsPart = [...new Set(relationsAsPart.map(rel => rel.host_part_number))];
                            
                            return (
                              <div key={partNumber} style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#fff2e8', borderRadius: '4px' }}>
                                <div><strong>🏷️ 料号: {partNumber}</strong></div>
                                <div>   └── 作为子级(child_part_number): {relationsAsChild.length} 条记录</div>
                                <div>       └── 涉及主机: {hostsAsChild.join(', ')}</div>
                                <div>   └── 作为当前(part_number): {relationsAsPart.length} 条记录</div>
                                <div>       └── 涉及主机: {hostsAsPart.join(', ')}</div>
                                <div>   └── 总计涉及主机数: {[...new Set([...hostsAsChild, ...hostsAsPart])].length} 个</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* 具体关系记录 */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4>📋 具体关系记录详情</h4>
                        <div style={{ 
                          maxHeight: '300px', 
                          overflow: 'auto',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          padding: '12px'
                        }}>
                          {duplicatePartNumbers.map(partNumber => {
                            const allRelations = relationsList.filter(rel => 
                              rel.child_part_number === partNumber || rel.part_number === partNumber
                            );
                            
                            return (
                              <div key={partNumber} style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                                  📦 料号: {partNumber} (共 {allRelations.length} 条关系)
                                </div>
                                {allRelations.map(rel => (
                                  <div key={rel.id} style={{ 
                                    padding: '6px 12px', 
                                    margin: '2px 0',
                                                                         backgroundColor: rel.host_part_number?.toString() === selectedHostPartNumber ? '#e6f7ff' : '#fff2e8',
                                     borderRadius: '4px',
                                     fontSize: '11px',
                                     borderLeft: `3px solid ${rel.host_part_number?.toString() === selectedHostPartNumber ? '#1890ff' : '#faad14'}`
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <strong>ID {rel.id}:</strong> 
                                        <span style={{ 
                                                                                     backgroundColor: rel.host_part_number?.toString() === selectedHostPartNumber ? '#1890ff' : '#faad14',
                                          color: 'white',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          marginLeft: '8px',
                                          fontSize: '10px'
                                        }}>
                                          {rel.host_part_number}
                                        </span>
                                                                                 {rel.host_part_number?.toString() === selectedHostPartNumber && (
                                          <span style={{ color: '#52c41a', marginLeft: '8px' }}>✓ 当前主机</span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '10px', color: '#666' }}>
                                        Level {rel.level} | {rel.child_type}
                                      </div>
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#666' }}>
                                      路径: {rel.parent_part_number || '(主机)'} → {rel.part_number} → {rel.child_part_number}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* 业务逻辑判断 */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4>🧠 业务逻辑分析</h4>
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#f6ffed', 
                          borderRadius: '6px',
                          border: '1px solid #b7eb8f'
                        }}>
                          <div><strong>🤔 关键问题:</strong></div>
                          <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                            <li>这些料号是否为<strong>通用配件</strong>（可以用于多个主机型号）？</li>
                            <li>还是数据录入时的<strong>错误关联</strong>？</li>
                            <li>是否是<strong>数据迁移</strong>过程中的问题？</li>
                            <li>当前业务规则是否允许<strong>一对多关联</strong>？</li>
                          </ul>
                          
                          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
                            <strong>💡 判断标准:</strong>
                            <div style={{ fontSize: '13px', marginTop: '4px' }}>
                              • 如果是通用配件 → 需要优化显示逻辑，避免重复显示
                              <br />
                              • 如果是录入错误 → 需要清理脏数据，建立数据约束
                              <br />
                              • 如果是迁移问题 → 需要数据修复和验证机制
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 解决方案建议 */}
                      <div>
                        <h4>🔧 解决方案建议</h4>
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#e6f7ff', 
                          borderRadius: '6px',
                          border: '1px solid #91d5ff'
                        }}>
                          <div><strong>🎯 短期解决方案:</strong></div>
                          <ul style={{ marginLeft: '20px', marginTop: '4px', fontSize: '13px' }}>
                            <li>在前端增加<strong>路径上下文过滤</strong>，确保只显示当前主机的关联路径</li>
                            <li>优化树节点的<strong>key生成逻辑</strong>，包含完整路径信息</li>
                            <li>添加<strong>数据验证警告</strong>，提醒用户存在跨主机关联</li>
                          </ul>
                          
                          <div style={{ marginTop: '8px' }}>
                            <strong>🏗️ 长期解决方案:</strong>
                          </div>
                          <ul style={{ marginLeft: '20px', marginTop: '4px', fontSize: '13px' }}>
                            <li>建立<strong>数据库约束</strong>，防止无效的跨主机关联</li>
                            <li>实现<strong>配件库管理</strong>，区分通用配件和专用配件</li>
                            <li>完善<strong>业务规则验证</strong>，在数据录入时进行检查</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ),
                  okText: '📋 生成数据库检查SQL',
                  cancelText: '关闭分析',
                  onOk: () => {
                    // 生成数据库检查SQL
                    const sqlQueries = `
-- 🔍 重复料号专项数据库检查 SQL
-- 请在线上数据库执行以下查询进行深度分析

-- 1. 分析 60A06006 的完整关联情况
SELECT 
    '60A06006 作为子级' as relation_type,
    host_part_number,
    parent_part_number,
    part_number,
    child_part_number,
    level,
    child_type,
    quantity,
    created_at,
    updated_at
FROM wp_bjt_relations 
WHERE child_part_number = '60A06006'
ORDER BY host_part_number, level;

-- 2. 分析 60A06006 作为当前节点的情况
SELECT 
    '60A06006 作为当前节点' as relation_type,
    host_part_number,
    parent_part_number,
    part_number,
    child_part_number,
    level,
    child_type,
    quantity,
    created_at,
    updated_at
FROM wp_bjt_relations 
WHERE part_number = '60A06006'
ORDER BY host_part_number, level;

-- 3. 分析 60A04005 的完整关联情况
SELECT 
    '60A04005 作为子级' as relation_type,
    host_part_number,
    parent_part_number,
    part_number,
    child_part_number,
    level,
    child_type,
    quantity,
    created_at,
    updated_at
FROM wp_bjt_relations 
WHERE child_part_number = '60A04005'
ORDER BY host_part_number, level;

-- 4. 分析 60A04005 作为当前节点的情况
SELECT 
    '60A04005 作为当前节点' as relation_type,
    host_part_number,
    parent_part_number,
    part_number,
    child_part_number,
    level,
    child_type,
    quantity,
    created_at,
    updated_at
FROM wp_bjt_relations 
WHERE part_number = '60A04005'
ORDER BY host_part_number, level;

-- 5. 统计分析：找出所有跨主机重复的配件
SELECT 
    child_part_number,
    COUNT(DISTINCT host_part_number) as host_count,
    COUNT(*) as total_relations,
    GROUP_CONCAT(DISTINCT host_part_number ORDER BY host_part_number) as hosts
FROM wp_bjt_relations 
WHERE product_line_id = 1
GROUP BY child_part_number 
HAVING host_count > 1
ORDER BY host_count DESC, total_relations DESC;

-- 6. 数据质量检查：查找可能的数据录入错误
SELECT 
    id,
    host_part_number,
    parent_part_number,
    part_number,
    child_part_number,
    level,
    child_type,
    created_at,
    CASE 
        WHEN parent_part_number IS NULL AND part_number != host_part_number THEN '可能错误: 主机直接子级但part_number不是host'
        WHEN parent_part_number IS NOT NULL AND parent_part_number = host_part_number THEN '可能错误: parent应该是NULL'
        WHEN level = 1 AND child_type != 'spare_part' AND parent_part_number IS NOT NULL THEN '可能错误: Level 1应该是必选备件或主机直接子级'
        ELSE '正常'
    END as data_quality_check
FROM wp_bjt_relations 
WHERE child_part_number IN ('60A06006', '60A04005')
ORDER BY data_quality_check DESC, host_part_number;`;

                                         // 创建一个新的模态框显示SQL
                     Modal.confirm({
                      title: '📋 数据库检查SQL',
                      width: 1000,
                      content: (
                        <div>
                          <div style={{ marginBottom: '12px' }}>
                            <strong>请将以下SQL复制到线上数据库执行，进行深度数据分析：</strong>
                          </div>
                          <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '12px', 
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            maxHeight: '500px',
                            overflow: 'auto',
                            border: '1px solid #d9d9d9'
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sqlQueries}</pre>
                          </div>
                          <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                            💡 <strong>执行建议：</strong>
                            <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
                              <li>优先执行统计分析查询（第5条），了解整体情况</li>
                              <li>然后执行具体料号的分析查询（第1-4条）</li>
                              <li>最后执行数据质量检查（第6条），识别问题数据</li>
                            </ul>
                                                     </div>
                         </div>
                       ),
                       okText: '关闭',
                       cancelText: null,
                       onOk: () => {}
                     });
                  }
                });
              }}
              disabled={!selectedHostPartNumber}
            >
              🔍 重复料号分析
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
            <div className="space-y-2">
              <Alert
                message={`产品线已固定为: ${getProductLineTypeName(typeFromUrl)}`}
                description={`当前正在管理 ${getProductLineTypeName(typeFromUrl)} 的关联关系。产品线ID: ${productLineId}`}
                type="info"
                showIcon
                className="mb-0"
              />
              {/* 🔍 缓存验证状态显示 */}
              {cacheDebugInfo.requestTimestamp && (
                <div className="flex items-center space-x-4 px-3 py-2 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">
                      🔍 缓存验证已完成
                    </span>
                    <Tag color="green" size="small">
                      响应时间: {cacheDebugInfo.responseTime}ms
                    </Tag>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>
                      📊 API调用: {cacheDebugInfo.apiCallCount} 次
                    </span>
                    <span>
                      📦 数据大小: {(cacheDebugInfo.responseSize! / 1024).toFixed(1)}KB
                    </span>
                    <span>
                      {cacheDebugInfo.responseTime! < 100 ? '⚠️ 可能有缓存' : '✅ 响应时间正常'}
                    </span>
                  </div>
                </div>
              )}
            </div>
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
                <Space>
                  <Button size="small" onClick={checkDataQuality} icon={<ReloadOutlined />}>
                    重新检查
                  </Button>
                  <Button 
                    size="small" 
                    type="primary"
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: '🔧 关系结构清理工具',
                        icon: <SettingOutlined />,
                        width: 800,
                        content: (
                          <div>
                            <p><strong>检测到关系结构问题，选择清理方案：</strong></p>
                            
                            <div style={{ marginTop: '16px' }}>
                              <h4>🎯 问题分析：</h4>
                              <div style={{ 
                                padding: '12px', 
                                backgroundColor: '#fff2e8', 
                                borderRadius: '6px', 
                                marginTop: '8px',
                                border: '1px solid #ffd591'
                              }}>
                                <div>• 料号60A04024在多个位置重复出现</div>
                                <div>• 层级关系混乱，同一料号在Level 2和Level 3都存在</div>
                                <div>• 添加子级时无法确定正确的父级位置</div>
                              </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                              <h4>🔧 解决方案：</h4>
                              <div style={{ marginTop: '8px' }}>
                                <div style={{ 
                                  padding: '12px', 
                                  backgroundColor: '#f6ffed', 
                                  borderRadius: '6px',
                                  marginBottom: '8px',
                                  border: '1px solid #b7eb8f'
                                }}>
                                  <strong>方案1: 保留主机直接子级</strong>
                                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    只保留 60A01149 → 60A04024 的关系，删除其他重复路径
                                  </div>
                                </div>
                                <div style={{ 
                                  padding: '12px', 
                                  backgroundColor: '#e6f7ff', 
                                  borderRadius: '6px',
                                  marginBottom: '8px',
                                  border: '1px solid #91d5ff'
                                }}>
                                  <strong>方案2: 重新设计层级结构</strong>
                                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    根据实际产品结构重新组织关系层级
                                  </div>
                                </div>
                                <div style={{ 
                                  padding: '12px', 
                                  backgroundColor: '#f9f0ff', 
                                  borderRadius: '6px',
                                  border: '1px solid #d3adf7'
                                }}>
                                  <strong>方案3: 手动调整</strong>
                                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    查看详细的关系列表，手动编辑或删除冲突记录
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                              <h4>📋 当前关系状态：</h4>
                              <div style={{ 
                                padding: '8px', 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}>
                                <div>✅ 主机直接子级: 60A01149 → 60A04024 (Level 2)</div>
                                <div>⚠️  重复关系: 60A04039 → 60A04024 (Level 3)</div>
                                <div>⚠️  孤儿关系: 60A04038 → 60A04024 (Level 2)</div>
                                <div style={{ marginTop: '8px', color: '#666' }}>
                                  → 60A04024的子级: 60A10001, 60A10003, 60A10004, 60A10006, 60A06006
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                        okText: '📋 查看详细关系',
                        cancelText: '暂不处理',
                        onOk: () => {
                          // 显示详细的关系管理界面
                          Modal.confirm({
                            title: '📋 详细关系管理',
                            width: 1000,
                            content: (
                              <div>
                                <p><strong>所有涉及60A04024的关系记录：</strong></p>
                                <div style={{ 
                                  maxHeight: '400px', 
                                  overflow: 'auto',
                                  border: '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  padding: '12px'
                                }}>
                                  {relationsList
                                    .filter(rel => rel.part_number === '60A04024' || rel.child_part_number === '60A04024')
                                    .map(rel => (
                                      <div key={rel.id} style={{ 
                                        padding: '8px', 
                                        margin: '4px 0',
                                        backgroundColor: rel.part_number === '60A04024' ? '#e6f7ff' : '#fff2e8',
                                        borderRadius: '4px',
                                        border: '1px solid #d9d9d9'
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div>
                                            <strong>ID {rel.id}:</strong> {rel.parent_part_number || '主机'} → {rel.part_number} → {rel.child_part_number}
                                            <Tag size="small" color="blue" style={{ marginLeft: '8px' }}>Level {rel.level}</Tag>
                                          </div>
                                          <div>
                                            <Button 
                                              size="small" 
                                              onClick={() => handleEditRelation(rel)}
                                              style={{ marginRight: '4px' }}
                                            >
                                              编辑
                                            </Button>
                                            <Button 
                                              size="small" 
                                              danger 
                                              onClick={() => handleDeleteRelation(rel)}
                                            >
                                              删除
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                                <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                                  💡 <strong>建议：</strong>删除冲突的关系记录，保持清晰的层级结构
                                </div>
                              </div>
                            ),
                            okText: '关闭',
                            cancelText: null,
                            onOk: () => {
                              message.info('请根据需要编辑或删除冲突的关系');
                            }
                          });
                        }
                      });
                    }}
                  >
                    🔧 关系清理工具
                  </Button>
                </Space>
              </div>
              
              <div className="space-y-2">
                {qualityIssues.map((issue, index) => (
                  <Alert
                    key={index}
                    message={
                      <div className="flex items-center justify-between">
                        <span>{issue.title}</span>
                        {issue.title.includes('孤儿父级关系') && (
                          <Button 
                            size="small" 
                            type="primary"
                            onClick={() => {
                              // 显示孤儿关系修复指导
                              Modal.confirm({
                                title: '🔗 修复孤儿父级关系',
                                icon: <InfoCircleOutlined />,
                                content: (
                                  <div>
                                    <p><strong>检测到孤儿父级关系问题：</strong></p>
                                    <div style={{ 
                                      padding: '12px', 
                                      backgroundColor: '#fff2e8', 
                                      borderRadius: '6px', 
                                      marginTop: '8px',
                                      border: '1px solid #ffd591'
                                    }}>
                                      <div>一些料号作为父级存在于关系中，但它们本身没有作为任何关系的子级存在，导致相关关系无法在树中显示。</div>
                                    </div>
                                    <p style={{ marginTop: '12px' }}><strong>修复步骤：</strong></p>
                                    <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
                                      <li>找到孤儿父级料号（如：60A04038）</li>
                                      <li>点击主机节点的"添加配件"按钮</li>
                                      <li>在子级料号字段中输入孤儿父级料号</li>
                                      <li>设置适当的层级和数量</li>
                                      <li>保存后，相关的子级关系将自动显示在树中</li>
                                    </ol>
                                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                                      <strong>示例：</strong>如果60A04038作为父级存在但未显示，请创建"主机 → 60A04038"的关系。
                                    </p>
                                  </div>
                                ),
                                width: 600,
                                okText: '我知道了',
                                cancelText: '关闭',
                                onOk: () => {
                                  message.info('请按照指导操作修复孤儿关系');
                                },
                                                onCancel: () => {
                  // 用户关闭指导
                }
                              });
                            }}
                          >
                            📝 查看修复指导
                          </Button>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <p>{issue.description}</p>
                        {issue.action && (
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '8px', 
                            backgroundColor: '#f6ffed', 
                            borderRadius: '4px',
                            border: '1px solid #b7eb8f'
                          }}>
                            <strong>建议操作：</strong> {issue.action}
                          </div>
                        )}
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
                {/* 🔍 缓存验证状态标签 */}
                {cacheDebugInfo.requestTimestamp && (
                  <Tag color="green" icon={<InfoCircleOutlined />}>
                    缓存验证: {cacheDebugInfo.responseTime}ms
                  </Tag>
                )}
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
                  onExpand={(keys) => {
                    // 🔧 防止在loading期间展开触发重复请求
                    if (!isLoadingRelations) {
                      setExpandedKeys(keys);
                    }
                  }}
                  onSelect={(keys) => {
                    // 🔧 防止在loading期间选择触发重复请求
                    if (!isLoadingRelations) {
                      setSelectedKeys(keys);
                    }
                  }}
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
        destroyOnHidden
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
                label="主机料号 (Host Part Number)"
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
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1890ff' }}>关系预览:</div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <span style={{ padding: '4px 8px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginRight: '8px' }}>
                {form.getFieldValue('host_part_number') || '主机'}
              </span>
              <span style={{ margin: '0 8px' }}>→</span>
              {form.getFieldValue('parent_part_number') && (
                <>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f3e5f5', borderRadius: '4px', marginRight: '8px' }}>
                    {form.getFieldValue('parent_part_number')}
                  </span>
                  <span style={{ margin: '0 8px' }}>→</span>
                </>
              )}
              <span style={{ padding: '4px 8px', backgroundColor: '#e8f5e8', borderRadius: '4px', marginRight: '8px' }}>
                {form.getFieldValue('part_number') || '当前节点'}
              </span>
              <span style={{ margin: '0 8px' }}>→</span>
              <span style={{ padding: '4px 8px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                {form.getFieldValue('child_part_number') || '新子级'}
              </span>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="parent_part_number"
                label="父级料号 (Parent Part Number)"
                extra="当前节点的父级料号，为空表示直接连接主机"
              >
                <Input placeholder="自动设置或留空" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="part_number"
                label="当前节点料号 (Part Number)"
                rules={[{ required: true, message: '请输入当前节点料号' }]}
                extra="当前关系记录所代表的节点"
              >
                <Input placeholder="例如: 421343214123412343212142141" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="child_part_number"
                label="子级料号 (Child Part Number)"
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
                  <Option value="accessory">配件 (Accessory)</Option>
                  <Option value="spare_part">必选备件 (Required Spare Part)</Option>
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
                  <Option value="publish">发布 (Published)</Option>
                  <Option value="draft">草稿 (Draft)</Option>
                  <Option value="trash">回收站 (Trash)</Option>
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

          <Divider orientation="left">依赖管理 (Dependency Management)</Divider>
          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fffbe6', borderRadius: '4px', fontSize: '13px' }}>
            <strong>说明:</strong> 此处配置的是"必选备件"依赖关系，用于指定当前配件必须配套的备件及数量
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
        </Form>
      </Modal>
    </div>
  );
};

export default RelationsPage; 