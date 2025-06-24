// 购物车Bug修复功能开关
// 通过功能开关逐步启用修复，确保每个修复都可以独立回滚

export interface CartBugFixFlags {
  // P0级 - 紧急修复
  fixProductIdDisplay: boolean;        // 修复ProductID显示缺失
  fixOrderVisibility: boolean;         // 修复纽约订单显示问题
  fixExcelDataCorruption: boolean;     // 修复Excel数据错乱
  
  // P1级 - 高优先级修复
  fixFieldNameMapping: boolean;        // 修复字段名称错误
  fixI18nConsistency: boolean;         // 修复中英文显示混乱
  fixSpecsDisplay: boolean;            // 修复规格信息缺失
  
  // P2级 - 中等优先级修复
  fixUnitNormalization: boolean;       // 修复单位格式(lbs->lb)
  fixDuplicateFields: boolean;         // 修复重复字段显示
  fixFieldAlignment: boolean;          // 修复字段对齐问题
}

// 默认所有修复都关闭，需要手动启用
export const DEFAULT_CART_BUG_FIX_FLAGS: CartBugFixFlags = {
  // P0级修复 - 谨慎启用
  fixProductIdDisplay: false,
  fixOrderVisibility: false, 
  fixExcelDataCorruption: false,
  
  // P1级修复 - 逐步启用
  fixFieldNameMapping: false,
  fixI18nConsistency: false,
  fixSpecsDisplay: false,
  
  // P2级修复 - 最后启用
  fixUnitNormalization: false,
  fixDuplicateFields: false,
  fixFieldAlignment: false,
};

// 运行时功能开关控制
export class CartBugFixController {
  private static flags: CartBugFixFlags = {
    ...DEFAULT_CART_BUG_FIX_FLAGS,
    // 可以通过环境变量或localStorage覆盖
    ...(typeof window !== 'undefined' && window.localStorage.getItem('cartBugFixFlags') 
      ? JSON.parse(window.localStorage.getItem('cartBugFixFlags')!) 
      : {}),
  };
  
  // 安全检查：某个修复是否已启用
  static isFixEnabled(fixName: keyof CartBugFixFlags): boolean {
    return this.flags[fixName] === true;
  }
  
  // 逐步启用修复（带确认）
  static enableFix(fixName: keyof CartBugFixFlags, confirm: boolean = false): boolean {
    if (!confirm) {
      console.warn(`⚠️ [CartBugFix] 尝试启用修复 "${fixName}"，需要确认参数`);
      return false;
    }
    
    console.log(`✅ [CartBugFix] 启用修复: ${fixName}`);
    this.flags[fixName] = true;
    
    // 保存到localStorage用于调试
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cartBugFixFlags', JSON.stringify(this.flags));
    }
    
    return true;
  }
  
  // 紧急回滚：立即禁用某个修复
  static disableFix(fixName: keyof CartBugFixFlags): void {
    console.log(`🔄 [CartBugFix] 回滚修复: ${fixName}`);
    this.flags[fixName] = false;
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cartBugFixFlags', JSON.stringify(this.flags));
    }
  }
  
  // 紧急情况：禁用所有修复
  static emergencyDisableAll(): void {
    console.warn(`🚨 [CartBugFix] 紧急情况：禁用所有购物车修复`);
    Object.keys(this.flags).forEach(key => {
      this.flags[key as keyof CartBugFixFlags] = false;
    });
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cartBugFixFlags', JSON.stringify(this.flags));
    }
  }
  
  // 获取当前所有修复状态
  static getFixStatus(): CartBugFixFlags {
    return { ...this.flags };
  }
}

// 便捷方法：检查修复是否启用
export const isCartFixEnabled = (fixName: keyof CartBugFixFlags): boolean => {
  return CartBugFixController.isFixEnabled(fixName);
};

// 调试工具：显示当前修复状态
export const debugCartFixes = (): void => {
  console.table(CartBugFixController.getFixStatus());
}; 