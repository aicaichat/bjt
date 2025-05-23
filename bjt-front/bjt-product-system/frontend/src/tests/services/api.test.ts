import { describe, it, expect, jest, beforeEach, afterEach } from 'jest';
import { machineService, accessoryService } from '@/api/services';
import { MachineListData, AccessoryListData, MachineQueryParams, AccessoryQueryParams } from '@/types/api.types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('MachineService', () => {
    it('应该正确获取设备列表', async () => {
      const mockResponse: MachineListData = {
        items: [
          {
            id: 1,
            code: 'BJT-M001',
            title_zh: '测试设备',
            title_en: 'Test Machine',
            product_line_id: 1,
            type: 'automatic',
            image_url: '/images/machine1.jpg',
            status: 'publish',
            sort_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: mockResponse
        })
      });

      const params: MachineQueryParams = {
        product_line_id: 1,
        region: 'CN',
        lang: 'zh'
      };

      const result = await machineService.getMachines(params);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/machines?product_line_id=1'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('应该正确处理API错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          message: 'Not Found'
        })
      });

      await expect(
        machineService.getMachines({ product_line_id: 999 })
      ).rejects.toThrow();
    });

    it('应该正确处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        machineService.getMachines({ product_line_id: 1 })
      ).rejects.toThrow('Network Error');
    });
  });

  describe('AccessoryService', () => {
    it('应该正确获取配件列表', async () => {
      const mockResponse: AccessoryListData = {
        items: [
          {
            id: 1,
            product_line_id: 1,
            model: 'BJT-A001',
            brand: 'BJT',
            part_number: 'ACC-001',
            name: '测试配件',
            spec: '220V/50Hz',
            spec_imperial: '110V/60Hz',
            image_url: '/images/accessory1.jpg',
            status: 'publish',
            unit: 'pcs',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        page: 1,
        page_size: 10,
        total_pages: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: mockResponse
        })
      });

      const params: AccessoryQueryParams = {
        product_line_id: 1,
        model: 'BJT-M001'
      };

      const result = await accessoryService.getAccessories(params);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('认证和授权', () => {
    it('应该在请求中包含认证头', async () => {
      const mockToken = 'test-token-123';
      localStorage.setItem('auth_token', mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { items: [] }
        })
      });

      await machineService.getMachines({ product_line_id: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('应该在未认证时使用默认头', async () => {
      localStorage.removeItem('auth_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { items: [] }
        })
      });

      await machineService.getMachines({ product_line_id: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('错误处理', () => {
    const errorCases = [
      { status: 400, message: '请求参数错误' },
      { status: 401, message: '您的登录已过期，请重新登录。' },
      { status: 403, message: '您没有权限执行此操作。' },
      { status: 404, message: '请求的资源不存在。' },
      { status: 500, message: '服务器错误，请稍后重试。' }
    ];

    errorCases.forEach(({ status, message }) => {
      it(`应该正确处理${status}错误`, async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          json: () => Promise.resolve({
            success: false,
            message: `HTTP ${status} Error`
          })
        });

        await expect(
          machineService.getMachines({ product_line_id: 1 })
        ).rejects.toThrow();
      });
    });
  });

  describe('缓存机制', () => {
    it('应该支持缓存配置', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 0
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: mockResponse
        })
      });

      // 第一次调用
      await machineService.getMachines({ product_line_id: 1 });
      
      // 第二次调用相同参数
      await machineService.getMachines({ product_line_id: 1 });

      // 应该调用两次（因为还没有实现缓存）
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
}); 