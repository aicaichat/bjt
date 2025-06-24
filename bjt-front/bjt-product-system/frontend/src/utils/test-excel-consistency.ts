/**
 * Excel导出与PO页面数据一致性测试工具
 * 用于验证Excel导出的订单号、buyer信息和商品描述是否与PO页面显示一致
 */

import { UnifiedProduct } from '../types/product.types';
import { ExcelExporter } from './excelExporter';

export interface TestData {
  poNumber: string;
  poDate: string;
  paymentMethod: string;
  customerInfo: {
    companyName: string;
    contactName: string;
    address: string;
    phone: string;
  };
  products: UnifiedProduct[];
  language: 'zh' | 'en';
}

export class ExcelConsistencyTester {
  
  /**
   * 测试订单号一致性
   */
  static testOrderNumberConsistency(poPageData: TestData, excelData: any): boolean {
    console.log('🧪 [Excel Consistency Test] 测试订单号一致性');
    console.log('PO页面订单号:', poPageData.poNumber);
    console.log('Excel导出订单号:', excelData.poNumber);
    
    const isConsistent = poPageData.poNumber === excelData.poNumber;
    console.log('订单号一致性:', isConsistent ? '✅ 通过' : '❌ 失败');
    
    return isConsistent;
  }
  
  /**
   * 测试Buyer信息一致性
   */
  static testBuyerInfoConsistency(poPageData: TestData, excelData: any): boolean {
    console.log('🧪 [Excel Consistency Test] 测试Buyer信息一致性');
    
    const poCustomer = poPageData.customerInfo;
    const excelCustomer = excelData.customer;
    
    console.log('PO页面Buyer信息:', poCustomer);
    console.log('Excel导出Buyer信息:', excelCustomer);
    
    const checks = {
      companyName: poCustomer.companyName === excelCustomer.companyName,
      contactName: poCustomer.contactName === excelCustomer.contactName,
      address: poCustomer.address === excelCustomer.address,
      phone: poCustomer.phone === excelCustomer.phone
    };
    
    console.log('Buyer信息一致性检查:', checks);
    
    const allConsistent = Object.values(checks).every(check => check);
    console.log('Buyer信息一致性:', allConsistent ? '✅ 通过' : '❌ 失败');
    
    return allConsistent;
  }
  
  /**
   * 测试商品描述一致性
   */
  static testProductDescriptionConsistency(poPageData: TestData, excelData: any): boolean {
    console.log('🧪 [Excel Consistency Test] 测试商品描述一致性');
    
    const poProducts = poPageData.products;
    const excelProducts = excelData.items;
    
    if (poProducts.length !== excelProducts.length) {
      console.log('❌ 商品数量不一致:', poProducts.length, 'vs', excelProducts.length);
      return false;
    }
    
    let allConsistent = true;
    
    for (let i = 0; i < poProducts.length; i++) {
      const poProduct = poProducts[i];
      const excelProduct = excelProducts[i];
      
      // 模拟PO页面的商品描述生成逻辑
      const poDescription = this.generatePOPageDescription(poProduct, poPageData.language);
      const excelDescription = excelProduct.description;
      
      console.log(`商品 ${i + 1}:`);
      console.log('  PO页面描述:', poDescription);
      console.log('  Excel导出描述:', excelDescription);
      
      const isConsistent = poDescription === excelDescription;
      console.log('  描述一致性:', isConsistent ? '✅ 通过' : '❌ 失败');
      
      if (!isConsistent) {
        allConsistent = false;
      }
      
      // 同时检查其他关键字段
      const checks = {
        partNumber: (poProduct.code || poProduct.sku) === excelProduct.partNumber,
        model: (poProduct.model || '-') === excelProduct.model,
        brand: (poProduct.brand || 'Lockedair') === excelProduct.brandName
      };
      
      console.log('  其他字段一致性:', checks);
      
      if (!Object.values(checks).every(check => check)) {
        allConsistent = false;
      }
    }
    
    console.log('商品描述一致性:', allConsistent ? '✅ 通过' : '❌ 失败');
    
    return allConsistent;
  }
  
  /**
   * 生成PO页面的商品描述（模拟PO页面逻辑）
   */
  private static generatePOPageDescription(product: UnifiedProduct, language: 'zh' | 'en'): string {
    const descriptions = [];
    
    // 按照PO页面的逻辑：优先使用spec字段（单数）
    if (product.spec && typeof product.spec === 'string') {
      descriptions.push(product.spec);
    } else if (product.specs && typeof product.specs === 'string') {
      descriptions.push(product.specs);
    } else if (product.specs && typeof product.specs === 'object') {
      const specsText = Object.entries(product.specs)
        .filter(([k, v]) => v && v !== 'N/A' && v !== 'Not Specified')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (specsText) {
        descriptions.push(specsText);
      }
    }
    
    // 从properties中添加关键规格
    if (product.properties) {
      const importantSpecs = [];
      if (product.properties.voltage && product.properties.voltage !== 'N/A') {
        importantSpecs.push(`${product.properties.voltage}${product.properties.voltage.includes('V') ? '' : 'V'}`);
      }
      if (product.properties.frequency && product.properties.frequency !== 'N/A') {
        importantSpecs.push(`${product.properties.frequency}${product.properties.frequency.includes('Hz') ? '' : 'Hz'}`);
      }
      if (importantSpecs.length > 0) {
        descriptions.push(importantSpecs.join(', '));
      }
    }
    
    return descriptions.length > 0 ? descriptions.join(' | ') : '-';
  }
  
  /**
   * 运行完整的一致性测试
   */
  static runFullConsistencyTest(poPageData: TestData): boolean {
    console.log('🧪 [Excel Consistency Test] 开始完整一致性测试');
    
    // 1. 创建订单数据
    const orderData = {
      id: Date.now().toString(),
      orderNumber: poPageData.poNumber,
      date: poPageData.poDate,
      status: 'pending' as const,
      paymentMethod: poPageData.paymentMethod,
      total: 0,
      shippingInfo: {
        companyName: poPageData.customerInfo.companyName,
        contactName: poPageData.customerInfo.contactName,
        address: poPageData.customerInfo.address,
        phone: poPageData.customerInfo.phone,
        notes: ''
      },
      language: poPageData.language,
      items: poPageData.products
    };
    
    // 2. 转换为Excel数据
    const excelData = ExcelExporter.convertOrderToExcelData(orderData);
    
    // 3. 运行各项测试
    const orderNumberTest = this.testOrderNumberConsistency(poPageData, excelData);
    const buyerInfoTest = this.testBuyerInfoConsistency(poPageData, excelData);
    const productDescTest = this.testProductDescriptionConsistency(poPageData, excelData);
    
    const allTestsPassed = orderNumberTest && buyerInfoTest && productDescTest;
    
    console.log('🧪 [Excel Consistency Test] 测试结果总结:');
    console.log('  订单号一致性:', orderNumberTest ? '✅' : '❌');
    console.log('  Buyer信息一致性:', buyerInfoTest ? '✅' : '❌');
    console.log('  商品描述一致性:', productDescTest ? '✅' : '❌');
    console.log('  总体结果:', allTestsPassed ? '✅ 全部通过' : '❌ 存在不一致');
    
    return allTestsPassed;
  }
} 