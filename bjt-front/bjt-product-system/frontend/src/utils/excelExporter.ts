import { UnifiedOrder, UnifiedProduct } from '../types/product.types';
import { OrderNumberManager } from './orderNumberUtils';

// 多语言标签映射
const EXCEL_LABELS = {
  zh: {
    purchaseOrder: '采购订单',
    purchaseOrderNumber: '采购订单编号',
    date: '日期',
    paymentMethod: '付款方式',
    buyerInformation: '买方信息',
    companyName: '公司名称',
    contactPerson: '联系人',
    address: '地址',
    phone: '电话',
    vendorInformation: '供应商信息',
    shipToInformation: '收货方信息',
    company: '公司',
    city: '城市',
    partNo: '零件号',
    item: '项目',
    model: '型号',
    itemDescription: '项目描述',
    brandName: '品牌名称',
    quantity: '数量',
    unitPrice: '单价',
    amount: '金额',
    total: '小计',
    freightCharge: '运费',
    totalAmount: '总计',
    notes: '备注'
  },
  en: {
    purchaseOrder: 'PURCHASE ORDER',
    purchaseOrderNumber: 'Purchase Order Number',
    date: 'Date',
    paymentMethod: 'Payment Method',
    buyerInformation: 'Buyer Information',
    companyName: 'Company Name',
    contactPerson: 'Contact Person',
    address: 'Address',
    phone: 'Phone',
    vendorInformation: 'Vendor Information',
    shipToInformation: 'Ship To Information',
    company: 'Company',
    city: 'City',
    partNo: 'Part No.',
    item: 'Item',
    model: 'Model',
    itemDescription: 'Item description',
    brandName: 'Brand Name',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    amount: 'Amount',
    total: 'Total',
    freightCharge: 'Freight charge',
    totalAmount: 'Total amount',
    notes: 'Notes'
  }
};

export interface ExcelExportData {
  poNumber: string;
  date: string;
  paymentMethod: string;
  language: 'zh' | 'en';
  customer: {
    companyName: string;
    contactName: string;
    address: string;
    phone: string;
  };
  vendor: {
    companyName: string;
    address: string;
    city: string;
  };
  shipTo: {
    companyName: string;
    contactName: string;
    address: string;
    phone: string;
    notes?: string;
  };
  items: Array<{
    partNumber: string;
    itemName: string;
    model: string;
    description: string;
    brandName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totals: {
    subtotal: number;
    freightCharge: number;
    totalAmount: number;
  };
}

export class ExcelExporter {
  /**
   * 公英制转换工具
   */
  private static convertUnits(text: string): string {
    if (!text) return text;
    
    // 长度转换 (英制 -> 公制)
    text = text.replace(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in|")/gi, (match, value) => {
      const cm = (parseFloat(value) * 2.54).toFixed(2);
      return `${value}" (${cm}cm)`;
    });
    
    text = text.replace(/(\d+(?:\.\d+)?)\s*(?:foot|feet|ft|')/gi, (match, value) => {
      const m = (parseFloat(value) * 0.3048).toFixed(2);
      return `${value}' (${m}m)`;
    });
    
    // 重量转换 (英制 -> 公制)
    text = text.replace(/(\d+(?:\.\d+)?)\s*(?:pound|pounds|lbs?|lb)/gi, (match, value) => {
      const kg = (parseFloat(value) * 0.453592).toFixed(2);
      return `${value}lbs (${kg}kg)`;
    });
    
    text = text.replace(/(\d+(?:\.\d+)?)\s*(?:ounce|ounces|oz)/gi, (match, value) => {
      const g = (parseFloat(value) * 28.3495).toFixed(2);
      return `${value}oz (${g}g)`;
    });
    
    // 温度转换 (华氏 -> 摄氏)
    text = text.replace(/(\d+(?:\.\d+)?)\s*(?:fahrenheit|°f|f)/gi, (match, value) => {
      const celsius = ((parseFloat(value) - 32) * 5/9).toFixed(2);
      return `${value}°F (${celsius}°C)`;
    });
    
    // 压力转换 (psi -> bar/kPa)
    text = text.replace(/(\d+(?:\.\d+)?)\s*psi/gi, (match, value) => {
      const bar = (parseFloat(value) * 0.0689476).toFixed(2);
      const kPa = (parseFloat(value) * 6.89476).toFixed(2);
      return `${value}psi (${bar}bar/${kPa}kPa)`;
    });
    
    return text;
  }

  /**
   * 提取和处理规格信息
   */
  private static extractSpecs(item: UnifiedProduct): string {
    console.log('🔧 [ExcelExporter] 开始提取规格信息:', {
      itemSpecs: item.specs,
      propertiesSpecs: item.properties?.specs,
      propertiesSpecifications: item.properties?.specifications,
      propertiesDescription: item.properties?.description
    });
    
    const specParts = [];
    
    // 从多个可能的字段中提取规格信息
    const sources = [
      item.spec, // 优先使用单数形式的spec字段
      item.specs,
      item.spec_imperial, // 英制规格信息
      item.properties?.specs,
      item.properties?.specifications,
      item.properties?.description
    ];
    
    for (const source of sources) {
      if (source && typeof source === 'string' && source.trim() !== '') {
        const processed = this.processSpecsString(source);
        if (processed) {
          specParts.push(processed);
        }
      } else if (source && typeof source === 'object') {
        const processed = this.processSpecsObject(source);
        if (processed) {
          specParts.push(processed);
        }
      }
    }
    
    // 合并和去重
    const uniqueSpecs = [...new Set(specParts)];
    let finalSpecs = uniqueSpecs.join(' | ');
    
    // 应用公英制转换
    finalSpecs = this.convertUnits(finalSpecs);
    
    console.log('🔧 [ExcelExporter] 最终规格信息:', finalSpecs);
    return finalSpecs;
  }

  /**
   * 处理字符串格式的规格信息
   */
  private static processSpecsString(specs: string): string {
    if (!specs) return '';
    
    // 如果是JSON格式，尝试解析
    if (specs.startsWith('{') && specs.includes('partNumber')) {
      try {
        const parsed = JSON.parse(specs);
        return this.processSpecsObject(parsed);
      } catch (e) {
        // 继续字符串处理
      }
    }
    
    // 提取有用的规格信息
    const parts = [];
    
    // 电压信息
    const voltageMatch = specs.match(/(\d+V(?:\s*[-~]\s*\d+V)?)/gi);
    if (voltageMatch) {
      parts.push(...voltageMatch.map(v => v.trim()));
    }
    
    // 频率信息
    const frequencyMatch = specs.match(/(\d+Hz(?:\s*[-~]\s*\d+Hz)?)/gi);
    if (frequencyMatch) {
      parts.push(...frequencyMatch.map(f => f.trim()));
    }
    
    // 功率信息
    const powerMatch = specs.match(/(\d+(?:\.\d+)?\s*(?:W|KW|MW|watt|kilowatt|megawatt))/gi);
    if (powerMatch) {
      parts.push(...powerMatch.map(p => p.trim()));
    }
    
    // 压力信息
    const pressureMatch = specs.match(/(\d+(?:\.\d+)?\s*(?:psi|bar|kPa|MPa|pascal))/gi);
    if (pressureMatch) {
      parts.push(...pressureMatch.map(p => p.trim()));
    }
    
    // 尺寸信息
    const dimensionMatch = specs.match(/(\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|in|ft|"|')(?:\s*[x×]\s*\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|in|ft|"|'))*)/gi);
    if (dimensionMatch) {
      parts.push(...dimensionMatch.map(d => d.trim()));
    }
    
    // 温度信息
    const tempMatch = specs.match(/(\d+(?:\.\d+)?\s*(?:°C|°F|celsius|fahrenheit))/gi);
    if (tempMatch) {
      parts.push(...tempMatch.map(t => t.trim()));
    }
    
    return parts.join(' | ');
  }

  /**
   * 处理对象格式的规格信息
   */
  private static processSpecsObject(specs: any): string {
    if (!specs || typeof specs !== 'object') return '';
    
    const parts = [];
    
    // 常见的规格字段
    const specFields = [
      'voltage', 'frequency', 'power', 'pressure', 'temperature',
      'dimensions', 'weight', 'material', 'capacity', 'speed',
      'efficiency', 'rating', 'specification', 'specs'
    ];
    
    for (const field of specFields) {
      if (specs[field] && specs[field] !== 'Not Found') {
        parts.push(`${field}: ${specs[field]}`);
      }
    }
    
    // 如果没有找到标准字段，尝试其他字段
    if (parts.length === 0) {
      Object.keys(specs).forEach(key => {
        if (specs[key] && specs[key] !== 'Not Found' && 
            !['productName', 'partNumber', 'id', 'name'].includes(key)) {
          parts.push(`${key}: ${specs[key]}`);
        }
      });
    }
    
    return parts.join(' | ');
  }

  /**
   * 将订单数据转换为Excel导出格式
   */
  static convertOrderToExcelData(order: UnifiedOrder): ExcelExportData {
    // 🔧 统一：使用业务订单号，优先从orderNumber字段获取
    let poNumber = order.orderNumber || order.order_number;
    
    // 🔧 修复：如果没有业务订单号，抛出错误而不是生成
    if (!poNumber) {
      throw new Error('订单缺少业务订单号，无法导出Excel。订单号必须由后端API提供。');
    }
    
    // 格式化日期 - 使用与PO页面一致的格式
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // 🔧 修复：处理客户信息和shipping信息，与PO页面显示逻辑保持一致
    let customer, shipTo;
    
    if (typeof order.shippingInfo === 'string') {
      // 旧格式：字符串
      const shippingParts = order.shippingInfo.split('|').map(s => s.trim());
      customer = {
        companyName: shippingParts[0] || 'Hangzhou Bingjia Tech. Co., Ltd.',
        contactName: 'John Doe',
        address: shippingParts[1] || 'daf',
        phone: shippingParts[2] || '13057101000'
      };
      shipTo = { ...customer, notes: '' };
    } else if (order.shippingInfo && typeof order.shippingInfo === 'object') {
      // 新格式：对象 - 使用与PO页面完全相同的字段映射
      customer = {
        companyName: order.shippingInfo.companyName || 'Hangzhou Bingjia Tech. Co., Ltd.',
        contactName: order.shippingInfo.contactName || 'John Doe',
        address: order.shippingInfo.address || 'daf',
        phone: order.shippingInfo.phone || '13057101000'
      };
      shipTo = {
        companyName: order.shippingInfo.companyName || customer.companyName,
        contactName: order.shippingInfo.contactName || customer.contactName,
        address: order.shippingInfo.address || customer.address,
        phone: order.shippingInfo.phone || customer.phone,
        notes: order.shippingInfo.notes || ''
      };
    } else {
      // 默认值
      customer = {
        companyName: 'Hangzhou Bingjia Tech. Co., Ltd.',
        contactName: 'John Doe',
        address: 'daf',
        phone: '13057101000'
      };
      shipTo = { ...customer, notes: '' };
    }

    // 供应商信息
    const vendor = {
      companyName: 'BJT Pack, Inc.',
      address: '5275 Naiman Parkway, Suite B',
      city: 'Solon, Ohio 44139'
    };

    // 🔧 修复：处理商品项目，使用与PO页面完全一致的逻辑
    const items = order.items.map((item: UnifiedProduct) => {
      console.log('🔧 [ExcelExporter] 处理商品项目:', item);
      
      // 🔧 修复：使用与PO页面一致的产品名称处理逻辑
      let itemName = '';
      if (item.name && typeof item.name === 'string' && !item.name.startsWith('unknown-')) {
        itemName = item.name;
      } else if (typeof item.name === 'object') {
        // 使用与PO页面相同的语言选择逻辑
        const language = order.language || 'en';
        itemName = item.name[language === 'zh' ? 'zh-CN' : 'en-US'] || 
                  item.name['en-US'] || 
                  item.name['en'] || 
                  JSON.stringify(item.name);
      }
      
      // 🔧 修复：如果name是unknown格式或为空，使用备用字段
      if (!itemName || itemName.startsWith('unknown-')) {
        itemName = item.model || item.code || item.sku || 'Unknown Product';
      }
      
      // 🔧 修复：使用与PO页面完全一致的商品描述处理逻辑
      let cleanDescription = '';
      
      // 🔧 按照PO页面的逻辑构建Item description
      const descriptionParts = [];
      
      // 添加partNumber信息（如果存在）
      if (item.code || item.sku || item.part_number) {
        descriptionParts.push(`partNumber: ${item.code || item.sku || item.part_number}`);
      }
      
      // 添加productName信息
      if (itemName && itemName !== 'Unknown Product') {
        descriptionParts.push(`productName: ${itemName}`);
      }
      
      // 添加规格信息（按照PO页面的优先级）
      const specDescriptions = [];
      
      // 🔧 优先使用spec字段，然后是description字段
      if (item.spec && typeof item.spec === 'string' && item.spec.trim() !== '') {
        specDescriptions.push(item.spec);
      } else if ((item as any).description && typeof (item as any).description === 'string' && (item as any).description.trim() !== '') {
        specDescriptions.push((item as any).description);
      } else if (item.specs && typeof item.specs === 'string' && item.specs.trim() !== '') {
        specDescriptions.push(item.specs);
      } else if (item.specs && typeof item.specs === 'object') {
        const specsText = Object.entries(item.specs)
          .filter(([k, v]) => v && v !== 'N/A' && v !== 'Not Specified')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        if (specsText) {
          specDescriptions.push(specsText);
        }
      }
      
      // 从properties中添加关键规格（与PO页面逻辑一致）
      if (item.properties && typeof item.properties === 'object') {
        const importantSpecs = [];
        if (item.properties.voltage && item.properties.voltage !== 'N/A') {
          importantSpecs.push(`${item.properties.voltage}${item.properties.voltage.includes('V') ? '' : 'V'}`);
        }
        if (item.properties.frequency && item.properties.frequency !== 'N/A') {
          importantSpecs.push(`${item.properties.frequency}${item.properties.frequency.includes('Hz') ? '' : 'Hz'}`);
        }
        if (importantSpecs.length > 0) {
          specDescriptions.push(importantSpecs.join(', '));
        }
      }
      
      // 🔧 如果仍然没有描述，使用产品名称或型号作为备用
      if (specDescriptions.length === 0) {
        const fallbackDescription = itemName || item.model || '产品规格待补充';
        specDescriptions.push(fallbackDescription);
      }
      
      // 将规格信息添加到描述部分
      if (specDescriptions.length > 0) {
        descriptionParts.push(specDescriptions.join(' | '));
      }
      
      // 最终组合所有描述部分
      cleanDescription = descriptionParts.join(' | ');
      
      console.log('🔧 [ExcelExporter] Item description构建过程:', {
        partNumber: item.code || item.sku || item.part_number,
        productName: itemName,
        spec: item.spec,
        description: (item as any).description,
        specs: item.specs,
        properties: item.properties,
        finalDescription: cleanDescription
      });
      
      // 🔧 修复：品牌信息使用与PO页面一致的逻辑
      const brandName = item.brand || 'Lockedair';
      
      return {
        partNumber: item.code || item.sku || item.part_number || '',
        itemName: itemName,
        model: item.model || '-',
        description: cleanDescription,
        brandName: brandName,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || item.price || 0,
        amount: (item.unit_price || item.price || 0) * (item.quantity || 1)
      };
    });

    // 计算总计
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const freightCharge = 150.00; // 固定运费
    const totalAmount = subtotal + freightCharge;

    return {
      poNumber,
      date,
      paymentMethod: order.paymentMethod || 'Bank Transfer',
      language: (order.language || 'en') as 'zh' | 'en',
      customer,
      vendor,
      shipTo,
      items,
      totals: {
        subtotal,
        freightCharge,
        totalAmount
      }
    };
  }

  /**
   * 清理产品名称
   */
  private static cleanProductName(name: string): string {
    if (!name) return 'Unknown Product';
    
    // 移除重复的产品编号和不必要的文本
    let cleaned = name
      .replace(/^Not Available\s*/i, '')  // 移除开头的"Not Available"
      .replace(/\s*\d{10,}\s*$/, '')       // 移除末尾的长数字
      .replace(/\s*unknown-\d+\s*$/, '')   // 移除unknown-数字格式
      .trim();
    
    return cleaned || 'Unknown Product';
  }

  /**
   * 清理模型名称
   */
  private static cleanModel(model: string): string {
    if (!model) return 'N/A';
    
    // 如果模型与part_number相同，尝试提取更有意义的模型名
    let cleaned = model
      .replace(/^unknown-\d+$/, 'N/A')     // 替换unknown-数字格式
      .trim();
    
    return cleaned || 'N/A';
  }

  /**
   * 清理描述文本，保留有用的规格信息
   */
  private static cleanDescription(description: string): string {
    if (!description) return '';
    
    // 如果描述是JSON对象格式，尝试解析并构建完整的描述
    if (description.startsWith('{') && description.includes('partNumber')) {
      try {
        const parsed = JSON.parse(description);
        const parts = [];
        
        if (parsed.productName && parsed.productName !== 'Not Found') {
          parts.push(parsed.productName);
        }
        
        if (parsed.partNumber) {
          parts.push(`Part: ${parsed.partNumber}`);
        }
        
        // 检查是否有其他有用的规格信息
        Object.keys(parsed).forEach(key => {
          if (!['productName', 'partNumber'].includes(key) && parsed[key] && parsed[key] !== 'Not Found') {
            parts.push(`${key}: ${parsed[key]}`);
          }
        });
        
        return parts.join(' | ') || '';
      } catch (e) {
        // 如果解析失败，继续使用字符串处理
      }
    }
    
    // 如果描述包含结构化信息，提取并重新组织
    if (description.includes('partNumber:') || description.includes('productName:')) {
      const parts = [];
      
      // 提取产品名称
      const productNameMatch = description.match(/productName:\s*"([^"]+)"/);
      if (productNameMatch && productNameMatch[1] !== 'Not Found') {
        parts.push(productNameMatch[1].trim());
      }
      
      // 提取部件号
      const partNumberMatch = description.match(/partNumber:\s*"?([^",}\s]+)"?/);
      if (partNumberMatch) {
        parts.push(`Part: ${partNumberMatch[1].trim()}`);
      }
      
      // 保留电压、频率等技术规格信息（不删除，因为这些是重要的规格）
      const voltageMatch = description.match(/(\d+V[^,|}]*)/);
      if (voltageMatch) {
        parts.push(voltageMatch[1].trim());
      }
      
      const frequencyMatch = description.match(/(\d+Hz[^,|}]*)/);
      if (frequencyMatch) {
        parts.push(frequencyMatch[1].trim());
      }
      
      if (parts.length > 0) {
        return parts.join(' | ');
      }
    }
    
    // 对于其他格式的描述，进行基本清理但保留重要信息
    let cleaned = description
      .replace(/^[{}\s,]+|[{}\s,]+$/g, '') // 移除开头和结尾的大括号、逗号、空格
      .replace(/partNumber:\s*/gi, 'Part: ')
      .replace(/productName:\s*/gi, '')
      .replace(/["{}]/g, '') // 移除引号和大括号
      .replace(/,\s*([A-Za-z])/g, ' | $1') // 将逗号分隔转换为管道符分隔
      .trim();
    
    // 如果清理后为空或只是"Not Found"，返回空字符串
    if (!cleaned || cleaned === 'Not Found' || cleaned === 'Part: Not Found') {
      return '';
    }
    
    return cleaned;
  }

  /**
   * 转义CSV字段中的特殊字符
   */
  private static escapeCsvField(value: string): string {
    if (!value) return '';
    
    // 转换为字符串并清理
    let cleaned = String(value).trim();
    
    // 如果字段包含逗号、双引号、换行符，需要用双引号包围
    if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n') || cleaned.includes('\r')) {
      // 双引号需要转义为两个双引号
      cleaned = cleaned.replace(/"/g, '""');
      // 用双引号包围整个字段
      return `"${cleaned}"`;
    }
    
    return cleaned;
  }

  /**
   * 生成CSV格式的Excel数据
   */
  static generateCSV(data: ExcelExportData): string {
    const lines: string[] = [];
    const labels = EXCEL_LABELS[data.language];
    
    // 标题行
    lines.push(labels.purchaseOrder);
    lines.push('');
    
    // PO信息
    lines.push(`${labels.purchaseOrderNumber}:,${this.escapeCsvField(data.poNumber)}`);
    lines.push(`${labels.date}:,${this.escapeCsvField(data.date)}`);
    lines.push(`${labels.paymentMethod}:,${this.escapeCsvField(data.paymentMethod)}`);
    lines.push('');
    
    // 🔧 修复：买方信息 - 与PO页面Buyer区域格式保持一致
    lines.push(labels.buyerInformation);
    lines.push(`${labels.companyName}:,${this.escapeCsvField(data.customer.companyName)}`);
    lines.push(`${labels.contactPerson}:,${this.escapeCsvField(data.customer.contactName)}`);
    lines.push(`${labels.address}:,${this.escapeCsvField(data.customer.address)}`);
    lines.push(`${labels.phone}:,${this.escapeCsvField(data.customer.phone)}`);
    lines.push('');
    
    // 供应商信息
    lines.push(labels.vendorInformation);
    lines.push(`${labels.company}:,${this.escapeCsvField(data.vendor.companyName)}`);
    lines.push(`${labels.address}:,${this.escapeCsvField(data.vendor.address)}`);
    lines.push(`${labels.city}:,${this.escapeCsvField(data.vendor.city)}`);
    lines.push('');
    
    // 🔧 修复：Ship To信息 - 与PO页面Ship To区域格式保持一致
    lines.push(labels.shipToInformation);
    lines.push(`${labels.companyName}:,${this.escapeCsvField(data.shipTo.companyName)}`);
    lines.push(`${labels.contactPerson}:,${this.escapeCsvField(data.shipTo.contactName)}`);
    lines.push(`${labels.address}:,${this.escapeCsvField(data.shipTo.address)}`);
    lines.push(`${labels.phone}:,${this.escapeCsvField(data.shipTo.phone)}`);
    if (data.shipTo.notes) {
      lines.push(`${labels.notes || 'Notes'}:,${this.escapeCsvField(data.shipTo.notes)}`);
    }
    lines.push('');
    
    // 🔧 修复：商品表头 - 与PO页面表格列名完全一致
    lines.push(`${labels.partNo},${labels.item},${labels.model},${labels.itemDescription},${labels.brandName},${labels.quantity},${labels.unitPrice},${labels.amount}`);
    
    // 🔧 修复：商品明细 - 正确处理特殊字符
    data.items.forEach(item => {
      const row = [
        this.escapeCsvField(item.partNumber),
        this.escapeCsvField(item.itemName),
        this.escapeCsvField(item.model),
        this.escapeCsvField(item.description), // 🔧 Item description正确转义
        this.escapeCsvField(item.brandName),
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.amount.toFixed(2)
      ];
      lines.push(row.join(','));
    });
    
    lines.push('');
    
    // 🔧 修复：合计信息 - 与PO页面Summary区域格式保持一致
    lines.push(`,,,,,,${labels.total},${data.totals.subtotal.toFixed(2)}`);
    lines.push(`,,,,,,${labels.freightCharge},${data.totals.freightCharge.toFixed(2)}`);
    lines.push(`,,,,,,${labels.totalAmount},${data.totals.totalAmount.toFixed(2)}`);
    
    return lines.join('\n');
  }

  /**
   * 创建并下载Excel文件
   */
  static async exportToExcel(order: UnifiedOrder): Promise<void> {
    console.log('🔧 [ExcelExporter] 开始导出订单:', order);
    
    try {
      // 转换数据格式
      const excelData = this.convertOrderToExcelData(order);
      console.log('🔧 [ExcelExporter] 转换后的Excel数据:', excelData);
      
      // 生成CSV内容
      const csvContent = this.generateCSV(excelData);
      console.log('🔧 [ExcelExporter] 生成的CSV内容:', csvContent);
      
      // 创建Blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${excelData.poNumber}.csv`);
      link.style.visibility = 'hidden';
      
      // 添加到DOM并点击
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('🔧 [ExcelExporter] Excel文件下载完成');
    } catch (error) {
      console.error('🔧 [ExcelExporter] 导出Excel时出错:', error);
      throw error;
    }
  }
} 