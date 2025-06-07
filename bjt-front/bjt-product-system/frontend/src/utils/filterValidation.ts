/**
 * 筛选功能验证工具
 * 用于追踪从数据库到前端显示的完整数据流
 */

export interface FilterValidationReport {
  timestamp: string;
  step: string;
  data: any;
  filters: any;
  count: number;
  issues: string[];
  recommendations: string[];
}

export interface ValidationResult {
  success: boolean;
  reports: FilterValidationReport[];
  summary: {
    totalSteps: number;
    issuesFound: number;
    dataLoss: { step: string; before: number; after: number }[];
    recommendedFixes: string[];
  };
}

export class FilterValidationService {
  private reports: FilterValidationReport[] = [];
  private startTime: string = '';

  constructor() {
    this.startTime = new Date().toISOString();
  }

  /**
   * 步骤1: 验证API请求参数
   */
  validateApiRequest(url: string, params: URLSearchParams, filters: any): FilterValidationReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查URL格式
    if (!url.includes('/spare-parts')) {
      issues.push('API端点错误：不是备件接口');
    }

    // 检查必要参数
    const requiredParams = ['page', 'per_page', 'lang', 'status'];
    requiredParams.forEach(param => {
      if (!params.has(param)) {
        issues.push(`缺少必要参数: ${param}`);
      }
    });

    // 检查筛选参数格式
    if (filters.selectedModel && filters.selectedModel !== 'all') {
      if (!params.has('app_model')) {
        issues.push('selectedModel有值但没有传递app_model参数');
        recommendations.push('确保selectedModel筛选条件正确传递给API');
      } else if (params.get('app_model') !== filters.selectedModel) {
        issues.push(`app_model参数值不匹配: 期望${filters.selectedModel}, 实际${params.get('app_model')}`);
      }
    }

    if (filters.selectedIsConsumable !== null) {
      if (!params.has('is_consumable')) {
        issues.push('selectedIsConsumable有值但没有传递is_consumable参数');
        recommendations.push('确保is_consumable筛选条件正确传递给API');
      } else if (parseInt(params.get('is_consumable')!) !== filters.selectedIsConsumable) {
        issues.push(`is_consumable参数值不匹配: 期望${filters.selectedIsConsumable}, 实际${params.get('is_consumable')}`);
      }
    }

    if (filters.currentProductType && filters.currentProductType !== 'all') {
      if (!params.has('product_type')) {
        issues.push('currentProductType有值但没有传递product_type参数');
        recommendations.push('确保product_type筛选条件正确传递给API');
      } else if (params.get('product_type') !== filters.currentProductType) {
        issues.push(`product_type参数值不匹配: 期望${filters.currentProductType}, 实际${params.get('product_type')}`);
      }
    }

    const report: FilterValidationReport = {
      timestamp: new Date().toISOString(),
      step: 'API_REQUEST',
      data: {
        url,
        params: Object.fromEntries(params),
        filters
      },
      filters,
      count: 0,
      issues,
      recommendations
    };

    this.reports.push(report);
    return report;
  }

  /**
   * 步骤2: 验证API响应数据
   */
  validateApiResponse(response: any, filters: any): FilterValidationReport {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let dataArray: any[] = [];

    // 检查响应格式
    if (!response) {
      issues.push('API响应为空');
      return this.createReport('API_RESPONSE', [], filters, issues, recommendations);
    }

    // 提取数据数组
    if (Array.isArray(response)) {
      dataArray = response;
    } else if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        dataArray = response.data.items;
      } else {
        issues.push('响应数据格式异常：无法找到有效的数据数组');
      }
    } else {
      issues.push('响应格式不符合预期');
    }

    // 检查数据完整性
    if (dataArray.length === 0) {
      issues.push('API返回空数组');
      recommendations.push('检查数据库中是否有匹配的数据');
      recommendations.push('检查API筛选逻辑是否过于严格');
    }

    // 验证每条记录的必要字段
    const missingFields: { [key: string]: number } = {};
    dataArray.forEach((item, index) => {
      const requiredFields = ['id', 'part_number', 'name_zh', 'name_en'];
      requiredFields.forEach(field => {
        if (!item[field]) {
          missingFields[field] = (missingFields[field] || 0) + 1;
        }
      });

      // 检查筛选相关字段
      if (filters.selectedModel && !item.app_model) {
        issues.push(`记录${index}: 缺少app_model字段，但设置了型号筛选`);
      }

      if (filters.selectedIsConsumable !== null && typeof item.is_consumable === 'undefined') {
        issues.push(`记录${index}: 缺少is_consumable字段，但设置了易损筛选`);
      }
    });

    // 报告缺失字段
    Object.entries(missingFields).forEach(([field, count]) => {
      issues.push(`${count}条记录缺少${field}字段`);
    });

    const report = this.createReport('API_RESPONSE', dataArray, filters, issues, recommendations);
    this.reports.push(report);
    return report;
  }

  /**
   * 步骤3: 验证前端筛选逻辑
   */
  validateFrontendFiltering(originalData: any[], filteredData: any[], filters: any): FilterValidationReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查数据数量变化
    if (originalData.length === 0) {
      issues.push('输入数据为空，无法进行前端筛选验证');
      return this.createReport('FRONTEND_FILTERING', filteredData, filters, issues, recommendations);
    }

    console.log('🔍 [FilterValidation] Frontend filtering validation:', {
      originalCount: originalData.length,
      filteredCount: filteredData.length,
      filters
    });

    // 验证型号筛选
    if (filters.selectedModel && filters.selectedModel !== 'all' && filters.selectedModel !== '') {
      const matchingItems = originalData.filter(item => {
        if (!item.app_model) return false;
        
        const normalizeString = (str: string) => str.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '').trim();
        const normalizedSelectedModel = normalizeString(filters.selectedModel);
        
        if (Array.isArray(item.app_model)) {
          return item.app_model.some(model => {
            const normalizedModel = normalizeString(model);
            return normalizedModel === normalizedSelectedModel || normalizedModel.includes(normalizedSelectedModel);
          });
        } else {
          const modelString = String(item.app_model);
          const modelArray = modelString.replace(/['"]/g, '').split(',').map(m => m.trim()).filter(Boolean);
          return modelArray.some(model => {
            const normalizedModel = normalizeString(model);
            return normalizedModel === normalizedSelectedModel || normalizedModel.includes(normalizedSelectedModel);
          });
        }
      });

      console.log('🔍 [FilterValidation] Model filtering analysis:', {
        selectedModel: filters.selectedModel,
        expectedMatches: matchingItems.length,
        actualFiltered: filteredData.length,
        sampleMatchingItems: matchingItems.slice(0, 3).map(item => ({
          part_number: item.part_number,
          app_model: item.app_model
        }))
      });

      if (matchingItems.length !== filteredData.length) {
        issues.push(`型号筛选结果不一致：预期${matchingItems.length}条，实际${filteredData.length}条`);
        recommendations.push('检查前端型号筛选逻辑是否正确');
      }
    }

    // 验证易损筛选
    if (filters.selectedIsConsumable !== null) {
      const matchingItems = originalData.filter(item => item.is_consumable === filters.selectedIsConsumable);
      
      console.log('🔍 [FilterValidation] Consumable filtering analysis:', {
        selectedIsConsumable: filters.selectedIsConsumable,
        expectedMatches: matchingItems.length,
        actualFiltered: filteredData.length,
        sampleData: originalData.slice(0, 3).map(item => ({
          part_number: item.part_number,
          is_consumable: item.is_consumable,
          is_consumable_type: typeof item.is_consumable
        }))
      });

      if (matchingItems.length !== filteredData.length && !filters.selectedModel && !filters.currentProductType) {
        issues.push(`易损筛选结果不一致：预期${matchingItems.length}条，实际${filteredData.length}条`);
        recommendations.push('检查is_consumable字段类型和值是否正确');
      }
    }

    // 验证产品类型筛选
    if (filters.currentProductType && filters.currentProductType !== 'all') {
      const matchingItems = originalData.filter(item => {
        if (item.product_type) {
          return item.product_type.toLowerCase() === filters.currentProductType.toLowerCase();
        }
        
        if (item.product_line_id) {
          const isMainProduct = item.product_line_id === 1;
          return (filters.currentProductType === 'machine' && isMainProduct) || 
                 (filters.currentProductType === 'accessory' && !isMainProduct);
        }
        
        return true;
      });

      console.log('🔍 [FilterValidation] Product type filtering analysis:', {
        currentProductType: filters.currentProductType,
        expectedMatches: matchingItems.length,
        actualFiltered: filteredData.length,
        sampleData: originalData.slice(0, 3).map(item => ({
          part_number: item.part_number,
          product_type: item.product_type,
          product_line_id: item.product_line_id
        }))
      });

      if (matchingItems.length !== filteredData.length && !filters.selectedModel && !filters.selectedIsConsumable) {
        issues.push(`产品类型筛选结果不一致：预期${matchingItems.length}条，实际${filteredData.length}条`);
        recommendations.push('检查product_type或product_line_id字段映射逻辑');
      }
    }

    const report = this.createReport('FRONTEND_FILTERING', filteredData, filters, issues, recommendations);
    this.reports.push(report);
    return report;
  }

  /**
   * 步骤4: 验证数据字段完整性
   */
  validateDataFields(data: any[], filters: any): FilterValidationReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (data.length === 0) {
      issues.push('验证数据为空');
      return this.createReport('DATA_FIELDS', data, filters, issues, recommendations);
    }

    // 统计字段缺失情况
    const fieldStats: { [key: string]: { missing: number; total: number; samples: any[] } } = {};
    const importantFields = [
      'id', 'part_number', 'name_zh', 'name_en', 'app_model', 'is_consumable', 
      'product_type', 'product_line_id', 'spec', 'spec_imperial', 'app_sn',
      'package_size_cm', 'package_size_inch', 'net_weight_kg', 'net_weight_lbs', 'pcs_per_box'
    ];

    importantFields.forEach(field => {
      fieldStats[field] = { missing: 0, total: data.length, samples: [] };
    });

    data.forEach((item, index) => {
      importantFields.forEach(field => {
        const value = item[field];
        if (value === null || value === undefined || value === '') {
          fieldStats[field].missing++;
        } else if (fieldStats[field].samples.length < 3) {
          fieldStats[field].samples.push({ index, value, type: typeof value });
        }
      });
    });

    // 生成字段完整性报告
    Object.entries(fieldStats).forEach(([field, stats]) => {
      const missingRate = (stats.missing / stats.total) * 100;
      if (missingRate > 50) {
        issues.push(`字段${field}缺失率过高: ${missingRate.toFixed(1)}% (${stats.missing}/${stats.total})`);
        recommendations.push(`检查${field}字段的数据源和API返回逻辑`);
      } else if (missingRate > 0 && missingRate <= 50) {
        console.log(`⚠️ [FilterValidation] 字段${field}部分缺失: ${missingRate.toFixed(1)}%`);
      }
    });

    // 检查关键筛选字段的数据质量
    if (filters.selectedModel && fieldStats.app_model.missing > 0) {
      issues.push(`app_model字段有${fieldStats.app_model.missing}条记录缺失，影响型号筛选`);
    }

    if (filters.selectedIsConsumable !== null && fieldStats.is_consumable.missing > 0) {
      issues.push(`is_consumable字段有${fieldStats.is_consumable.missing}条记录缺失，影响易损筛选`);
    }

    const report = this.createReport('DATA_FIELDS', data, filters, issues, recommendations);
    report.data = {
      fieldStats,
      sampleData: data.slice(0, 2)
    };
    this.reports.push(report);
    return report;
  }

  /**
   * 生成完整验证报告
   */
  generateReport(): ValidationResult {
    const totalSteps = this.reports.length;
    const issuesFound = this.reports.reduce((sum, report) => sum + report.issues.length, 0);
    
    const dataLoss: { step: string; before: number; after: number }[] = [];
    for (let i = 1; i < this.reports.length; i++) {
      const prevCount = this.reports[i - 1].count;
      const currentCount = this.reports[i].count;
      if (currentCount < prevCount) {
        dataLoss.push({
          step: this.reports[i].step,
          before: prevCount,
          after: currentCount
        });
      }
    }

    const recommendedFixes = Array.from(new Set(
      this.reports.flatMap(report => report.recommendations)
    ));

    return {
      success: issuesFound === 0,
      reports: this.reports,
      summary: {
        totalSteps,
        issuesFound,
        dataLoss,
        recommendedFixes
      }
    };
  }

  /**
   * 创建报告记录
   */
  private createReport(
    step: string, 
    data: any[], 
    filters: any, 
    issues: string[], 
    recommendations: string[]
  ): FilterValidationReport {
    return {
      timestamp: new Date().toISOString(),
      step,
      data: data.slice(0, 2), // 只保存前两条作为样本
      filters,
      count: data.length,
      issues,
      recommendations
    };
  }

  /**
   * 打印详细验证报告
   */
  printDetailedReport(): void {
    console.log('\n🔍 ==================== 筛选功能验证报告 ====================');
    console.log(`📅 验证时间: ${this.startTime}`);
    console.log(`📊 总步骤数: ${this.reports.length}`);
    
    this.reports.forEach((report, index) => {
      console.log(`\n📋 步骤 ${index + 1}: ${report.step}`);
      console.log(`🕒 时间: ${report.timestamp}`);
      console.log(`📦 数据量: ${report.count} 条`);
      console.log(`🎯 筛选条件:`, report.filters);
      
      if (report.issues.length > 0) {
        console.log(`❌ 发现问题 (${report.issues.length}个):`);
        report.issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log(`✅ 无问题发现`);
      }
      
      if (report.recommendations.length > 0) {
        console.log(`💡 建议:`);
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
    });

    const finalReport = this.generateReport();
    console.log('\n📈 ==================== 验证总结 ====================');
    console.log(`✅ 验证状态: ${finalReport.success ? '通过' : '失败'}`);
    console.log(`🐛 问题总数: ${finalReport.summary.issuesFound}`);
    
    if (finalReport.summary.dataLoss.length > 0) {
      console.log(`📉 数据丢失步骤:`);
      finalReport.summary.dataLoss.forEach(loss => {
        console.log(`   - ${loss.step}: ${loss.before} → ${loss.after} (丢失 ${loss.before - loss.after} 条)`);
      });
    }
    
    if (finalReport.summary.recommendedFixes.length > 0) {
      console.log(`🔧 推荐修复措施:`);
      finalReport.summary.recommendedFixes.forEach(fix => console.log(`   - ${fix}`));
    }

    console.log('\n🔍 ============================================================');
  }
}

/**
 * 全局验证服务实例
 */
export const filterValidationService = new FilterValidationService(); 