// 统一产品信息查询服务
export interface ProductInfo {
  id: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  image_url: string;
  spec?: string;
  spec_imperial?: string;
  product_type: 'host' | 'accessory' | 'spare_part' | 'consumable';
  product_line_id?: number;
  brand?: string;
  voltage?: string;
  frequency?: string;
  unit?: string;
  status?: string;
}

export interface ProductBatchResponse {
  found: ProductInfo[];
  notFound: string[];
}

class ProductInfoService {
  private cache = new Map<string, ProductInfo>();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存
  private cacheTimestamps = new Map<string, number>();

  /**
   * 根据料号自动识别产品类型
   */
  private identifyProductType(partNumber: string): 'host' | 'accessory' | 'spare_part' | 'consumable' {
    // 主机：60A01xxx
    if (partNumber.match(/^60A01\d{3}$/)) {
      return 'host';
    }
    
    // 配件：60Axxxxx（除主机外的60A开头）
    if (partNumber.match(/^60A\d{5}$/) && !partNumber.match(/^60A01\d{3}$/)) {
      return 'accessory';
    }
    
    // 耗材：增强识别逻辑
    // 1. MEX/MFC/MFB等开头的料号
    if (partNumber.match(/^(MEX|MFC|MFB|MEY|MFF|MEZ)-/i)) {
      return 'consumable';
    }
    
    // 2. 包含连字符的料号 (通常是耗材)
    if (partNumber.includes('-') && partNumber.match(/^[A-Z]{2,4}-[A-Z0-9-]+$/i)) {
      return 'consumable';
    }
    
    // 3. 以数字+字母组合开头且长度较长的料号
    if (partNumber.match(/^\d{1,3}[A-Z]\d{5,}$/i)) {
      return 'consumable';
    }
    
    // 4. 特定的耗材料号模式 (根据实际数据调整)
    if (partNumber.match(/^[0-9]{2}[A-Z]\d{5}$/)) {
      return 'consumable';
    }
    
    // 其他情况默认为备件
    return 'spare_part';
  }

  /**
   * 检查缓存是否过期
   */
  private isCacheValid(partNumber: string): boolean {
    const timestamp = this.cacheTimestamps.get(partNumber);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_EXPIRY;
  }

  /**
   * 从缓存获取产品信息
   */
  private getFromCache(partNumber: string): ProductInfo | null {
    if (!this.isCacheValid(partNumber)) {
      this.cache.delete(partNumber);
      this.cacheTimestamps.delete(partNumber);
      return null;
    }
    return this.cache.get(partNumber) || null;
  }

  /**
   * 将产品信息存入缓存
   */
  private setCache(partNumber: string, info: ProductInfo): void {
    this.cache.set(partNumber, info);
    this.cacheTimestamps.set(partNumber, Date.now());
  }

  /**
   * 单个产品信息查询
   */
  async getProductInfo(partNumber: string, lang: 'zh' | 'en' = 'zh'): Promise<ProductInfo | null> {
    // 先检查缓存
    const cached = this.getFromCache(partNumber);
    if (cached) {
      return cached;
    }

    try {
      // 自动识别产品类型
      const productType = this.identifyProductType(partNumber);
      
      console.log('[ProductInfoService] 查询产品信息:', {
        partNumber,
        identifiedType: productType,
        lang
      });
      
      // 构建API路径
      const apiPaths = {
        host: '/wp-json/bjt/v1/host-parts',
        accessory: '/wp-json/bjt/v1/accessories', 
        spare_part: '/wp-json/bjt/v1/spare-parts',
        consumable: '/wp-json/bjt/v1/consumables'
      };

      // 查询对应的API
      const apiUrl = `${apiPaths[productType]}?part_number=${partNumber}&lang=${lang}`;
      console.log('[ProductInfoService] API查询:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.warn(`[ProductInfoService] Product not found in ${productType} table: ${partNumber}, status: ${response.status}`);
        
        // 如果在预期类型中没找到，尝试其他类型
        for (const [type, path] of Object.entries(apiPaths)) {
          if (type === productType) continue;
          
          try {
            const fallbackUrl = `${path}?part_number=${partNumber}&lang=${lang}`;
            console.log(`[ProductInfoService] 尝试备用查询 ${type}:`, fallbackUrl);
            
            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              if (data.success && data.data && data.data.items && data.data.items.length > 0) {
                console.log(`[ProductInfoService] ✅ 在 ${type} 表中找到产品:`, data.data.items[0]);
                const item = data.data.items[0];
                const productInfo = this.normalizeProductInfo(item, type as any);
                this.setCache(partNumber, productInfo);
                return productInfo;
              }
            }
          } catch (error) {
            console.warn(`[ProductInfoService] Error checking ${type} for ${partNumber}:`, error);
          }
        }
        
        console.error(`[ProductInfoService] ❌ 所有表都未找到产品: ${partNumber}`);
        return null;
      }

      const data = await response.json();
      console.log('[ProductInfoService] API响应:', data);
      
      if (!data.success || !data.data) {
        console.warn('[ProductInfoService] API返回失败或无数据:', data);
        return null;
      }

      // 处理响应数据格式
      let item;
      if (data.data.items && data.data.items.length > 0) {
        item = data.data.items[0];
      } else if (data.data.id) {
        item = data.data;
      } else {
        console.warn('[ProductInfoService] 响应数据格式不正确:', data.data);
        return null;
      }

      console.log('[ProductInfoService] ✅ 产品信息获取成功:', item);
      const productInfo = this.normalizeProductInfo(item, productType);
      this.setCache(partNumber, productInfo);
      
      return productInfo;
    } catch (error) {
      console.error(`[ProductInfoService] ❌ 查询产品信息异常 ${partNumber}:`, error);
      return null;
    }
  }

  /**
   * 批量产品信息查询
   */
  async getBatchProductInfo(partNumbers: string[], lang: 'zh' | 'en' = 'zh'): Promise<ProductBatchResponse> {
    const found: ProductInfo[] = [];
    const notFound: string[] = [];
    
    // 并发查询所有产品
    const promises = partNumbers.map(async (partNumber) => {
      const info = await this.getProductInfo(partNumber, lang);
      if (info) {
        found.push(info);
      } else {
        notFound.push(partNumber);
      }
    });
    
    await Promise.all(promises);
    
    return { found, notFound };
  }

  /**
   * 标准化产品信息格式
   */
  private normalizeProductInfo(item: any, productType: 'host' | 'accessory' | 'spare_part' | 'consumable'): ProductInfo {
    return {
      id: String(item.id || ''),
      part_number: item.part_number || '',
      name_zh: item.name_zh || item.name || '',
      name_en: item.name_en || item.name || '',
      image_url: this.normalizeImageUrl(item.image_url),
      spec: item.spec || '',
      spec_imperial: item.spec_imperial || '',
      product_type: productType,
      product_line_id: item.product_line_id,
      brand: item.brand || '',
      voltage: item.voltage || '',
      frequency: item.frequency || '',
      unit: item.unit || 'pcs',
      status: item.status || 'publish'
    };
  }

  /**
   * 标准化图片URL
   */
  private normalizeImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl || imageUrl === '' || imageUrl === 'null' || imageUrl === 'undefined') {
      // 返回默认占位图
      return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%22120%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    }
    
    // 如果是相对路径，添加基础URL
    if (imageUrl.startsWith('/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    
    return imageUrl;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * 预加载常用产品信息
   */
  async preloadProducts(partNumbers: string[]): Promise<void> {
    await this.getBatchProductInfo(partNumbers);
  }
}

// 导出单例实例
export const productInfoService = new ProductInfoService();
export default productInfoService; 