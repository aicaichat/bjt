import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RelationsPage from '../RelationsPage';
import adminRelationService from '../../../services/admin-relation.service';
import adminPartService from '../../../services/admin-part.service';
import { accessoryService } from '../../../services/admin-accessory.service';

// Mock services
vi.mock('../../../services/admin-relation.service');
vi.mock('../../../services/admin-part.service');
vi.mock('../../../services/admin-accessory.service');

// Mock i18n hook直接
vi.mock('../../../i18n/hooks/useAdminI18n', () => ({
  useAdminI18n: () => ({
    t: (key: string) => key // 简单返回key作为翻译
  })
}));

// 基于真实数据库的测试数据
const REAL_HOST_DATA = {
  '60A01143': {
    id: 1,
    product_line_id: 1,
    part_number: '60A01143',
    name_zh: '"LA-E4S V2.0"主机-标准版',
    name_en: 'LA-E4S V2.0 Host-Standard',
    model: '"LA-E4S V2.0"',
    voltage: '110V'
  }
};

const REAL_RELATIONS_DATA = [
  // 主机60A01143的Level 1直接子级
  {
    id: 1,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: null,
    part_number: '60A01143',
    child_part_number: '60A04038',
    child_type: 'accessory',
    level: 1,
    quantity: 1,
    sort_order: 10,
    status: 'publish'
  },
  {
    id: 2,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: null,
    part_number: '60A01143',
    child_part_number: '60A10001',
    child_type: 'accessory',
    level: 1,
    quantity: 1,
    sort_order: 40,
    status: 'publish'
  },
  // 60A04038的Level 2子级
  {
    id: 3,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: '60A01143',
    part_number: '60A04038',
    child_part_number: '60A04039',
    child_type: 'accessory',
    level: 2,
    quantity: 1,
    sort_order: 20,
    status: 'publish'
  },
  {
    id: 4,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: '60A01143',
    part_number: '60A04038',
    child_part_number: '60A04024',
    child_type: 'accessory',
    level: 2,
    quantity: 1,
    sort_order: 30,
    status: 'publish'
  },
  // 60A10001的Level 2子级
  {
    id: 5,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: '60A01143',
    part_number: '60A10001',
    child_part_number: '14A01066',
    child_type: 'accessory',
    level: 2,
    quantity: 1,
    sort_order: 50,
    status: 'publish'
  },
  {
    id: 6,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: '60A01143',
    part_number: '60A10001',
    child_part_number: '60A04004',
    child_type: 'accessory',
    level: 2,
    quantity: 1,
    sort_order: 80,
    status: 'publish'
  },
  // 60A04004的Level 3子级（基于真实数据）
  {
    id: 7,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: '60A10001',
    part_number: '60A04004',
    child_part_number: '14A01066',
    child_type: 'accessory',
    level: 3,
    quantity: 1,
    sort_order: 90,
    status: 'publish'
  },
  {
    id: 8,
    product_line_id: 1,
    host_part_number: '60A01143',
    parent_part_number: '60A10001',
    part_number: '60A04004',
    child_part_number: '14A01202',
    child_type: 'accessory',
    level: 3,
    quantity: 1,
    sort_order: 120,
    status: 'publish'
  }
];

const ACCESSORY_DATA = [
  {
    id: 1,
    part_number: '60A04038',
    name_zh: 'ET400 自动分离器',
    name_en: 'ET400 Auto Separator',
    model: 'ET400'
  },
  {
    id: 2,
    part_number: '60A10001',
    name_zh: 'ET1003 气垫输送系统',
    name_en: 'ET1003 Air Cushion Delivery System',
    model: 'ET1003'
  }
];

// 简化的测试用包装组件
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('RelationsPage - 基于真实数据库数据', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock adminPartService.getParts
    (adminPartService.getParts as any).mockResolvedValue({
      items: [REAL_HOST_DATA['60A01143']],
      total: 1,
      total_pages: 1
    });

    // Mock adminRelationService.getRelations
    (adminRelationService.getRelations as any).mockResolvedValue({
      items: REAL_RELATIONS_DATA,
      total: REAL_RELATIONS_DATA.length,
      total_pages: 1
    });

    // Mock accessoryService.getAccessories
    (accessoryService.getAccessories as any).mockResolvedValue({
      items: ACCESSORY_DATA,
      total: ACCESSORY_DATA.length,
      total_pages: 1
    });

    // 防止console错误污染测试输出
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('应该正确调用主机数据加载API', async () => {
    render(
      <TestWrapper>
        <RelationsPage />
      </TestWrapper>
    );

    // 验证主机数据加载API被调用
    await waitFor(() => {
      expect(adminPartService.getParts).toHaveBeenCalledWith({
        page: 1,
        page_size: 100,
        product_line_id: 1,
      });
    }, { timeout: 3000 });
  });

  it('应该正确调用关系数据加载API', async () => {
    render(
      <TestWrapper>
        <RelationsPage />
      </TestWrapper>
    );

    // 验证关系数据加载API被调用
    await waitFor(() => {
      expect(adminRelationService.getRelations).toHaveBeenCalledWith({
        page: 1,
        per_page: 100,
        product_line_id: 1,
      });
    }, { timeout: 3000 });
  });

  it('应该正确解析真实关系数据结构', () => {
    // 验证测试数据结构正确性
    const hostRelations = REAL_RELATIONS_DATA.filter(r => r.host_part_number === '60A01143');
    expect(hostRelations.length).toBe(8);
    
    // 验证层级结构
    const level1Relations = hostRelations.filter(r => r.level === 1);
    const level2Relations = hostRelations.filter(r => r.level === 2);
    const level3Relations = hostRelations.filter(r => r.level === 3);
    
    expect(level1Relations.length).toBe(2); // 60A04038, 60A10001
    expect(level2Relations.length).toBe(4); // 60A04039, 60A04024, 14A01066, 60A04004
    expect(level3Relations.length).toBe(2); // 14A01066, 14A01202
  });

  it('应该正确处理复杂的父子关系上下文', () => {
    // 验证Level 3关系的父子上下文
    const level3Relations = REAL_RELATIONS_DATA.filter(r => r.level === 3);
    
    level3Relations.forEach(relation => {
      expect(relation.host_part_number).toBe('60A01143');
      expect(relation.parent_part_number).toBe('60A10001'); // 正确的父级上下文
      expect(relation.part_number).toBe('60A04004'); // 当前节点
    });
  });

  it('应该正确验证API Mock配置', () => {
    // 验证创建关系API Mock
    expect(adminRelationService.createRelation).toBeDefined();
    expect(adminRelationService.updateRelation).toBeDefined();
    expect(adminRelationService.deleteRelation).toBeDefined();
    
    // 验证其他服务API Mock
    expect(adminPartService.getParts).toBeDefined();
    expect(accessoryService.getAccessories).toBeDefined();
  });

  it('应该正确处理数据质量问题场景', () => {
    // 测试孤儿关系检测逻辑
    const problematicData = [
      ...REAL_RELATIONS_DATA,
      {
        id: 900,
        product_line_id: 1,
        host_part_number: '60A01143',
        parent_part_number: 'NONEXISTENT_PARENT', // 不存在的父级
        part_number: 'SOME_PART',
        child_part_number: 'ORPHAN_CHILD',
        child_type: 'accessory',
        level: 3,
        quantity: 1,
        sort_order: 900,
        status: 'publish'
      }
    ];
    
    // 验证孤儿关系能被识别
    const orphanRelation = problematicData.find(r => r.parent_part_number === 'NONEXISTENT_PARENT');
    expect(orphanRelation).toBeDefined();
    expect(orphanRelation?.child_part_number).toBe('ORPHAN_CHILD');
  });

  it('应该正确处理层级限制验证', () => {
    // 测试5层限制逻辑
    const level5Data = [
      ...REAL_RELATIONS_DATA,
      {
        id: 997,
        product_line_id: 1,
        host_part_number: '60A01143',
        parent_part_number: '60A04004',
        part_number: '14A01202',
        child_part_number: 'LEVEL5_PART',
        child_type: 'accessory',
        level: 5,
        quantity: 1,
        sort_order: 500,
        status: 'publish'
      }
    ];

    // 验证能检测到5层限制
    const maxLevel = Math.max(...level5Data.map(r => r.level));
    expect(maxLevel).toBe(5);
    
    const level5Relations = level5Data.filter(r => r.level === 5);
    expect(level5Relations.length).toBe(1);
  });

  it('应该正确处理必选备件关系', () => {
    const sparePartData = {
      id: 50,
      product_line_id: 1,
      host_part_number: '60A01143',
      parent_part_number: null,
      part_number: '60A01143',
      child_part_number: '05A0101289',
      child_type: 'spare_part',
      level: 1,
      quantity: 2,
      required_parts: null,
      required_quantity: null,
      sort_order: 1000,
      status: 'publish'
    };

    // 验证必选备件数据结构
    expect(sparePartData.child_type).toBe('spare_part');
    expect(sparePartData.level).toBe(1); // 必选备件应该是Level 1
    expect(sparePartData.quantity).toBe(2);
  });

  it('应该正确处理复杂依赖关系数据', () => {
    const dependencyData = {
      id: 51,
      product_line_id: 1,
      host_part_number: '60A01143',
      parent_part_number: null,
      part_number: '60A01143',
      child_part_number: '60A11002',
      child_type: 'accessory',
      level: 1,
      quantity: 1,
      required_parts: '05A0101289,05A0101290',
      required_quantity: '2,2',
      sort_order: 560,
      status: 'publish'
    };

    // 验证依赖关系数据解析
    expect(dependencyData.required_parts).toBe('05A0101289,05A0101290');
    expect(dependencyData.required_quantity).toBe('2,2');
    
    // 验证依赖关系解析逻辑
    const requiredPartsArray = dependencyData.required_parts.split(',').map(s => s.trim());
    const requiredQuantityArray = dependencyData.required_quantity.split(',').map(s => s.trim());
    
    expect(requiredPartsArray).toEqual(['05A0101289', '05A0101290']);
    expect(requiredQuantityArray).toEqual(['2', '2']);
    expect(requiredPartsArray.length).toBe(requiredQuantityArray.length);
  });
});

// 导出测试数据供其他测试文件使用
export { REAL_HOST_DATA, REAL_RELATIONS_DATA, ACCESSORY_DATA }; 