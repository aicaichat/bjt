import { ExtendedCartItem } from '../contexts/CartContext';
import { SparePart } from '../types/spareParts';

export interface RequiredPartItem {
  part_number: string;
  quantity: number;
}

export interface RequiredPartRelation {
  mainPartNumber: string;
  requiredPartNumber: string;
  quantityPerMain: number;
  totalQuantityInCart: number;
}

/**
 * 必选备件关系管理器
 */
export class RequiredPartsManager {
  private cartItems: ExtendedCartItem[];
  private allSpareParts: SparePart[];

  constructor(cartItems: ExtendedCartItem[], allSpareParts: SparePart[]) {
    this.cartItems = cartItems;
    this.allSpareParts = allSpareParts;
  }

  /**
   * 解析必选备件字符串
   */
  parseRequiredParts(
    requiredParts: string | null | undefined,
    requiredQuantity: string | null | undefined
  ): RequiredPartItem[] {
    if (!requiredParts || !requiredQuantity) {
      return [];
    }

    const partNumbers = requiredParts.split(',').map(p => p.trim()).filter(p => p);
    const quantities = requiredQuantity.split(',').map(q => parseInt(q.trim(), 10)).filter(q => !isNaN(q));

    if (partNumbers.length !== quantities.length) {
      console.warn('必选备件料号和数量不匹配:', { requiredParts, requiredQuantity });
      return [];
    }

    return partNumbers.map((part_number, index) => ({
      part_number,
      quantity: quantities[index]
    }));
  }

  /**
   * 根据料号查找备件信息
   */
  findSparePartByPartNumber(partNumber: string): SparePart | null {
    return this.allSpareParts.find(part => 
      part.part_number === partNumber ||
      part.part_number?.toLowerCase() === partNumber.toLowerCase()
    ) || null;
  }

  /**
   * 递归获取所有必选备件（包括必选备件的必选备件）
   */
  getAllRequiredParts(
    sparePart: SparePart,
    baseQuantity: number = 1,
    processedParts: Set<string> = new Set()
  ): RequiredPartItem[] {
    const result: RequiredPartItem[] = [];
    
    // 防止循环依赖
    if (processedParts.has(sparePart.part_number)) {
      console.warn('检测到循环依赖:', sparePart.part_number);
      return result;
    }
    
    processedParts.add(sparePart.part_number);
    
    // 解析当前备件的必选备件
    const requiredParts = this.parseRequiredParts(sparePart.required_parts, sparePart.required_quantity);
    
    for (const requiredPart of requiredParts) {
      // 计算实际需要的数量
      const actualQuantity = requiredPart.quantity * baseQuantity;
      
      // 添加到结果中（去重合并）
      const existingIndex = result.findIndex(r => r.part_number === requiredPart.part_number);
      if (existingIndex >= 0) {
        result[existingIndex].quantity += actualQuantity;
      } else {
        result.push({
          part_number: requiredPart.part_number,
          quantity: actualQuantity
        });
      }
      
      // 递归处理必选备件的必选备件
      const requiredSparePartInfo = this.findSparePartByPartNumber(requiredPart.part_number);
      if (requiredSparePartInfo) {
        const nestedRequired = this.getAllRequiredParts(
          requiredSparePartInfo,
          actualQuantity,
          new Set(processedParts) // 传递副本避免影响其他分支
        );
        
        // 合并嵌套的必选备件
        for (const nestedPart of nestedRequired) {
          const existingIndex = result.findIndex(r => r.part_number === nestedPart.part_number);
          if (existingIndex >= 0) {
            result[existingIndex].quantity += nestedPart.quantity;
          } else {
            result.push(nestedPart);
          }
        }
      }
    }
    
    return result;
  }

  /**
   * 获取购物车中所有必选备件关系
   */
  getAllRequiredPartRelations(): RequiredPartRelation[] {
    const relations: RequiredPartRelation[] = [];

    // 遍历购物车中的所有备件
    for (const cartItem of this.cartItems) {
      if (cartItem.product_type !== 'spare_part') continue;

      const sparePart = this.findSparePartByPartNumber(cartItem.part_number);
      if (!sparePart) continue;

      const requiredParts = this.parseRequiredParts(
        sparePart.required_parts, 
        sparePart.required_quantity
      );

      // 为每个必选备件创建关系记录
      for (const requiredPart of requiredParts) {
        const existingRelation = relations.find(r => 
          r.mainPartNumber === cartItem.part_number && 
          r.requiredPartNumber === requiredPart.part_number
        );

        if (existingRelation) {
          existingRelation.totalQuantityInCart += requiredPart.quantity * cartItem.quantity;
        } else {
          relations.push({
            mainPartNumber: cartItem.part_number,
            requiredPartNumber: requiredPart.part_number,
            quantityPerMain: requiredPart.quantity,
            totalQuantityInCart: requiredPart.quantity * cartItem.quantity
          });
        }
      }
    }

    return relations;
  }

  /**
   * 计算删除主备件后需要减少的必选备件数量
   */
  calculateRequiredPartsToRemove(
    mainPartNumber: string, 
    quantityToRemove: number
  ): RequiredPartItem[] {
    const sparePart = this.findSparePartByPartNumber(mainPartNumber);
    if (!sparePart) return [];

    const requiredParts = this.parseRequiredParts(
      sparePart.required_parts, 
      sparePart.required_quantity
    );

    return requiredParts.map(reqPart => ({
      part_number: reqPart.part_number,
      quantity: reqPart.quantity * quantityToRemove
    }));
  }

  /**
   * 计算必选备件的实际可移除数量
   * 考虑到该必选备件可能被多个主备件依赖
   */
  calculateSafeRemovalQuantity(
    requiredPartNumber: string,
    requestedRemovalQuantity: number
  ): number {
    const relations = this.getAllRequiredPartRelations();
    
    // 计算该必选备件被其他主备件依赖的总数量
    const totalRequiredByOthers = relations
      .filter(r => r.requiredPartNumber === requiredPartNumber)
      .reduce((sum, r) => sum + r.totalQuantityInCart, 0);

    // 获取购物车中该必选备件的当前数量
    const currentCartItem = this.cartItems.find(item => 
      item.part_number === requiredPartNumber && 
      item.product_type === 'spare_part'
    );
    
    const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;
    
    // 计算可以安全移除的数量
    const safeRemovalQuantity = Math.min(
      requestedRemovalQuantity,
      currentQuantity - totalRequiredByOthers + requestedRemovalQuantity
    );

    return Math.max(0, safeRemovalQuantity);
  }

  /**
   * 检查备件是否被其他备件依赖
   */
  isRequiredByOthers(partNumber: string): boolean {
    const relations = this.getAllRequiredPartRelations();
    return relations.some(r => r.requiredPartNumber === partNumber);
  }

  /**
   * 检查备件是否有必选备件
   */
  hasRequiredParts(partNumber: string): boolean {
    const sparePart = this.findSparePartByPartNumber(partNumber);
    if (!sparePart) return false;
    
    const requiredParts = this.parseRequiredParts(sparePart.required_parts, sparePart.required_quantity);
    return requiredParts.length > 0;
  }

  /**
   * 获取备件的依赖信息摘要
   */
  getDependencySummary(partNumber: string): {
    hasRequiredParts: boolean;
    isRequiredByOthers: boolean;
    requiredParts: RequiredPartItem[];
    dependentParts: string[];
  } {
    const relations = this.getAllRequiredPartRelations();
    const sparePart = this.findSparePartByPartNumber(partNumber);
    
    const requiredParts = sparePart ? 
      this.parseRequiredParts(sparePart.required_parts, sparePart.required_quantity) : [];
    
    const dependentParts = relations
      .filter(r => r.requiredPartNumber === partNumber)
      .map(r => r.mainPartNumber);

    return {
      hasRequiredParts: requiredParts.length > 0,
      isRequiredByOthers: dependentParts.length > 0,
      requiredParts,
      dependentParts
    };
  }
} 