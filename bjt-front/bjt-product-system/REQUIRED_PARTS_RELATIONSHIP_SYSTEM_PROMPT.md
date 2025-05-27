# 必选备件关系系统实现提示词

## 系统概述

实现一个完整的必选备件关系系统，支持主机、配件和备件三种产品类型的必选备件管理。系统需要处理不同的数据来源和关联关系，确保在购物车中自动添加必选备件。

## 数据结构说明

### 1. 主机 (Host Models)
- **表**: `wp_bjt_parts` (主机表)
- **特点**: 主机本身**没有必选备件**
- **料号格式**: `60A01xxx` (如: `60A01143`, `60A01141`)
- **作用**: 作为配件关系的顶级父级

### 2. 配件 (Accessories)
- **表**: `wp_bjt_accessories` (配件表)
- **必选备件来源**: `wp_bjt_relations` 表中的 `required_parts` 和 `required_quantity` 字段
- **关系逻辑**: 配件的必选备件取决于它搭配的上一级配件或主机
- **料号格式**: `60Axxxxx` (如: `60A04038`, `60A11002`)

### 3. 备件 (Spare Parts)
- **表**: `wp_bjt_spare_parts` (备件表)
- **必选备件来源**: 通过 `wp_bjt_relations` 表查询，使用 `child_part_number` 匹配备件料号
- **料号格式**: 多种格式 (如: `08A0105795`, `11A0103002`)

## 关系表结构 (wp_bjt_relations)

```sql
-- 关键字段说明
product_line_id         -- 产品线ID
part_number            -- 当前配件/备件料号
parent_part_number     -- 父级料号 (主机或上级配件)
child_part_number      -- 子级料号 (下级配件或备件)
level                  -- 层级 (1=直接子级, 2=二级子级, 3=三级子级)
required_parts         -- 必选备件料号列表 (逗号分隔)
required_quantity      -- 必选备件数量列表 (逗号分隔)
```

## 实现要求

### 1. API控制器增强

#### 1.1 配件控制器 (Accessory Controller)
```php
// 在 format_item_for_response 方法中添加
protected function format_item_for_response($item_db_object) {
    // ... 现有代码 ...
    
    // 获取配件的必选备件 (基于关系表)
    $required_parts_data = $this->get_accessory_required_parts(
        $item_db_object->part_number,
        $request->get_param('parent_part_number') // 可选的父级料号
    );
    
    if ($required_parts_data) {
        $formatted_item['required_parts'] = $required_parts_data['required_parts'];
        $formatted_item['required_quantity'] = $required_parts_data['required_quantity'];
        $formatted_item['required_parts_details'] = $this->get_required_parts_details(
            $required_parts_data['required_parts']
        );
    }
    
    return $formatted_item;
}

private function get_accessory_required_parts($part_number, $parent_part_number = null) {
    global $wpdb;
    $relations_table = $wpdb->prefix . 'bjt_relations';
    
    // 查询条件：当前配件作为part_number，且有必选备件
    $sql = "SELECT required_parts, required_quantity 
            FROM {$relations_table} 
            WHERE part_number = %s 
            AND required_parts IS NOT NULL 
            AND required_parts != ''";
    
    $params = [$part_number];
    
    // 如果提供了父级料号，添加额外的筛选条件
    if ($parent_part_number) {
        $sql .= " AND parent_part_number = %s";
        $params[] = $parent_part_number;
    }
    
    $sql .= " ORDER BY id ASC LIMIT 1";
    
    return $wpdb->get_row($wpdb->prepare($sql, $params), ARRAY_A);
}
```

#### 1.2 备件控制器 (Spare Parts Controller) - 已实现
```php
// 当前已实现的逻辑
protected function format_item_for_response($item_db_object) {
    // 通过 child_part_number 查询必选备件
    $required_parts_data = $wpdb->get_row($wpdb->prepare(
        "SELECT required_parts, required_quantity 
         FROM {$relations_table} 
         WHERE child_part_number = %s 
         AND required_parts IS NOT NULL 
         AND required_parts != '' 
         ORDER BY id ASC LIMIT 1",
        $item_db_object->part_number
    ));
}
```

### 2. 前端购物车逻辑增强

#### 2.1 增强的必选备件处理函数
```typescript
// utils/requiredPartsUtils.ts
export interface RequiredPart {
  part_number: string;
  quantity: number;
  name_zh: string;
  name_en: string;
  type: 'host' | 'accessory' | 'spare_part';
}

// 完整的必选备件信息接口 (包含所有备件字段)
export interface RequiredPartWithFullDetails extends RequiredPart {
  // 基础信息
  id: number;
  product_line_id: number;
  model: string | null;
  is_consumable: boolean;
  image_url: string;
  spec: string;
  spec_imperial: string;
  app_model: string;
  app_sn: string;
  unit: string;
  status: string;
  
  // 包装信息
  package_size_cm: string | null;
  package_size_inch: string | null;
  net_weight_kg: number | null;
  net_weight_lbs: number | null;
  gross_weight_kg: number | null;
  gross_weight_lbs: number | null;
  pcs_per_box: number | null;
  
  // 定价和库存信息
  pricing?: PricingTier[];
  inventory?: InventoryInfo[];
  
  // 必选备件信息
  required_parts: string | null;
  required_quantity: string | null;
}

export function parseRequiredParts(
  required_parts: string | null,
  required_quantity: string | null
): RequiredPart[] {
  if (!required_parts || !required_quantity) return [];
  
  const partNumbers = required_parts.split(',').map(p => p.trim());
  const quantities = required_quantity.split(',').map(q => parseInt(q.trim()));
  
  return partNumbers.map((partNumber, index) => ({
    part_number: partNumber,
    quantity: quantities[index] || 1,
    name_zh: '', // 需要通过API获取
    name_en: '',
    type: determinePartType(partNumber)
  }));
}

function determinePartType(partNumber: string): 'host' | 'accessory' | 'spare_part' {
  if (partNumber.startsWith('60A01')) return 'host';
  if (partNumber.startsWith('60A')) return 'accessory';
  return 'spare_part';
}

// 获取必选备件的完整详细信息
export async function getRequiredPartsFullDetails(
  requiredParts: RequiredPart[]
): Promise<RequiredPartWithFullDetails[]> {
  const promises = requiredParts.map(async (part) => {
    try {
      let response;
      switch (part.type) {
        case 'host':
          response = await api.get(`/parts/${part.part_number}`);
          break;
        case 'accessory':
          response = await api.get(`/accessories/${part.part_number}`);
          break;
        case 'spare_part':
          response = await api.get(`/spare-parts/${part.part_number}`);
          break;
      }
      
      // 返回完整的备件信息，包含所有字段
      return {
        ...part,
        ...response.data, // 包含所有API返回的字段
        quantity: part.quantity // 保持原始数量
      } as RequiredPartWithFullDetails;
    } catch (error) {
      console.warn(`Failed to fetch details for ${part.part_number}:`, error);
      // 返回基础信息作为fallback
      return {
        ...part,
        id: 0,
        product_line_id: 1,
        model: null,
        is_consumable: false,
        image_url: '',
        spec: '',
        spec_imperial: '',
        app_model: '',
        app_sn: '',
        unit: 'pcs',
        status: 'publish',
        package_size_cm: null,
        package_size_inch: null,
        net_weight_kg: null,
        net_weight_lbs: null,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: null,
        required_parts: null,
        required_quantity: null
      } as RequiredPartWithFullDetails;
    }
  });
  
  return Promise.all(promises);
}

// 简化版本 - 仅获取基础信息用于显示
export async function getRequiredPartsDetails(
  requiredParts: RequiredPart[]
): Promise<RequiredPart[]> {
  const promises = requiredParts.map(async (part) => {
    try {
      let response;
      switch (part.type) {
        case 'host':
          response = await api.get(`/parts/${part.part_number}`);
          break;
        case 'accessory':
          response = await api.get(`/accessories/${part.part_number}`);
          break;
        case 'spare_part':
          response = await api.get(`/spare-parts/${part.part_number}`);
          break;
      }
      
      return {
        ...part,
        name_zh: response.data.name_zh || response.data.title_zh,
        name_en: response.data.name_en || response.data.title_en
      };
    } catch (error) {
      console.warn(`Failed to fetch details for ${part.part_number}:`, error);
      return part;
    }
  });
  
  return Promise.all(promises);
}
```

#### 2.2 购物车添加逻辑
```typescript
// hooks/useCart.ts
export const useCart = () => {
  const addToCart = async (
    item: HostModel | AccessoryModel | SparePart,
    quantity: number = 1,
    parentPartNumber?: string
  ) => {
    try {
      // 1. 添加主要商品到购物车
      const cartItem = createCartItem(item, quantity);
      dispatch({ type: 'ADD_ITEM', payload: cartItem });
      
      // 2. 处理必选备件
      if (item.required_parts && item.required_quantity) {
        const requiredParts = parseRequiredParts(
          item.required_parts,
          item.required_quantity
        );
        
        // 3. 获取必选备件详细信息 (完整的备件数据)
        const requiredPartsWithDetails = await getRequiredPartsFullDetails(requiredParts);
        
        // 4. 自动添加必选备件到购物车 (使用完整的备件字段)
        for (const requiredPart of requiredPartsWithDetails) {
          const requiredCartItem = createRequiredPartCartItem(
            requiredPart,
            requiredPart.quantity * quantity,
            item.part_number
          );
          
          dispatch({ type: 'ADD_ITEM', payload: requiredCartItem });
        }
        
        // 5. 显示必选备件添加提示
        showRequiredPartsNotification(requiredPartsWithDetails);
      }
      
      showSuccessMessage(`${item.name_zh || item.title_zh} 已添加到购物车`);
    } catch (error) {
      console.error('添加到购物车失败:', error);
      showErrorMessage('添加到购物车失败，请重试');
    }
  };
  
  return { addToCart, /* 其他方法 */ };
};

// 创建必选备件购物车项目 (使用完整的备件字段)
function createRequiredPartCartItem(
  requiredPart: RequiredPartWithFullDetails,
  quantity: number,
  parentPartNumber: string
): CartItem {
  return {
    id: `required_${requiredPart.part_number}_${Date.now()}`,
    part_number: requiredPart.part_number,
    name_zh: requiredPart.name_zh,
    name_en: requiredPart.name_en,
    quantity: quantity,
    type: 'spare_part',
    is_required: true,
    parent_part_number: parentPartNumber,
    
    // 备件完整字段信息
    image_url: requiredPart.image_url,
    spec: requiredPart.spec,
    spec_imperial: requiredPart.spec_imperial,
    app_model: requiredPart.app_model,
    app_sn: requiredPart.app_sn,
    is_consumable: requiredPart.is_consumable,
    unit: requiredPart.unit,
    
    // 包装信息
    package_size_cm: requiredPart.package_size_cm,
    package_size_inch: requiredPart.package_size_inch,
    net_weight_kg: requiredPart.net_weight_kg,
    net_weight_lbs: requiredPart.net_weight_lbs,
    gross_weight_kg: requiredPart.gross_weight_kg,
    gross_weight_lbs: requiredPart.gross_weight_lbs,
    pcs_per_box: requiredPart.pcs_per_box,
    
    // 定价信息 (如果有)
    pricing: requiredPart.pricing || [],
    inventory: requiredPart.inventory || [],
    
    // 状态
    status: requiredPart.status || 'publish'
  };
}
```

### 3. 数据验证和完整性检查

#### 3.1 必选备件存在性验证
```php
// 在API控制器中添加验证方法
private function validate_required_parts($required_parts_string) {
    if (empty($required_parts_string)) return true;
    
    $part_numbers = array_map('trim', explode(',', $required_parts_string));
    $missing_parts = [];
    
    foreach ($part_numbers as $part_number) {
        if (!$this->part_exists($part_number)) {
            $missing_parts[] = $part_number;
        }
    }
    
    if (!empty($missing_parts)) {
        return new WP_Error(
            'required_parts_not_found',
            '必选备件不存在: ' . implode(', ', $missing_parts),
            ['status' => 400]
        );
    }
    
    return true;
}

private function part_exists($part_number) {
    global $wpdb;
    
    // 检查是否在备件表中
    $spare_parts_table = $wpdb->prefix . 'bjt_spare_parts';
    $count = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$spare_parts_table} WHERE part_number = %s",
        $part_number
    ));
    
    if ($count > 0) return true;
    
    // 检查是否在配件表中
    $accessories_table = $wpdb->prefix . 'bjt_accessories';
    $count = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$accessories_table} WHERE part_number = %s",
        $part_number
    ));
    
    return $count > 0;
}
```

### 4. 前端UI增强

#### 4.1 必选备件显示组件
```tsx
// components/RequiredPartsDisplay.tsx
interface RequiredPartsDisplayProps {
  requiredParts: string | null;
  requiredQuantity: string | null;
  className?: string;
}

export const RequiredPartsDisplay: React.FC<RequiredPartsDisplayProps> = ({
  requiredParts,
  requiredQuantity,
  className
}) => {
  const [partsDetails, setPartsDetails] = useState<RequiredPart[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (requiredParts && requiredQuantity) {
      loadRequiredPartsDetails();
    }
  }, [requiredParts, requiredQuantity]);
  
  const loadRequiredPartsDetails = async () => {
    setLoading(true);
    try {
      const parsedParts = parseRequiredParts(requiredParts, requiredQuantity);
      const detailedParts = await getRequiredPartsDetails(parsedParts);
      setPartsDetails(detailedParts);
    } catch (error) {
      console.error('加载必选备件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!requiredParts || partsDetails.length === 0) return null;
  
  return (
    <div className={`required-parts-display ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        必选备件 (Required Parts)
      </h4>
      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : (
        <ul className="space-y-1">
          {partsDetails.map((part, index) => (
            <li key={index} className="text-sm text-gray-600 flex justify-between">
              <span>{part.name_zh || part.part_number}</span>
              <span className="text-gray-400">×{part.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 5. 测试用例

#### 5.1 配件必选备件测试
```javascript
// 测试配件 60A11002 (FR8002 收卷车) 的必选备件
// 预期: required_parts = "05A0101289,05A0101290", required_quantity = "2,2"

const testAccessoryRequiredParts = async () => {
  const response = await fetch('/wp-json/bjt/v1/accessories/60A11002');
  const accessory = await response.json();
  
  console.log('配件必选备件:', {
    part_number: accessory.part_number,
    required_parts: accessory.required_parts,
    required_quantity: accessory.required_quantity
  });
  
  // 验证必选备件是否正确解析
  const parsedParts = parseRequiredParts(
    accessory.required_parts,
    accessory.required_quantity
  );
  
  console.log('解析后的必选备件:', parsedParts);
};
```

#### 5.2 备件必选备件测试
```javascript
// 测试备件 01A0101038 (去皱硅胶) 的必选备件
// 预期: required_parts = "11A0103002,11A0101003", required_quantity = "2,2"

const testSparePartRequiredParts = async () => {
  const response = await fetch('/wp-json/bjt/v1/spare-parts/01A0101038');
  const sparePart = await response.json();
  
  console.log('备件必选备件:', {
    part_number: sparePart.part_number,
    required_parts: sparePart.required_parts,
    required_quantity: sparePart.required_quantity
  });
};
```

## 实施步骤

### 第一阶段：API增强
1. ✅ 备件控制器已实现必选备件查询
2. 🔄 配件控制器添加必选备件查询逻辑
3. 🔄 主机控制器确认无必选备件逻辑

### 第二阶段：前端工具函数
1. 🔄 创建必选备件解析工具函数
2. 🔄 实现必选备件详情批量查询
3. 🔄 添加必选备件类型判断逻辑

### 第三阶段：购物车集成
1. 🔄 修改购物车添加逻辑
2. 🔄 实现必选备件自动添加
3. 🔄 添加必选备件标识和关联

### 第四阶段：UI组件
1. 🔄 创建必选备件显示组件
2. 🔄 在产品详情页显示必选备件
3. 🔄 在购物车中标识必选备件

### 第五阶段：测试验证
1. 🔄 单元测试必选备件解析
2. 🔄 集成测试购物车功能
3. 🔄 端到端测试用户流程

## 注意事项

1. **数据一致性**: 确保 `wp_bjt_relations` 表中的必选备件料号在对应的产品表中存在
2. **性能优化**: 批量查询必选备件详情，避免N+1查询问题
3. **错误处理**: 优雅处理必选备件不存在或API调用失败的情况
4. **用户体验**: 清晰显示必选备件信息，让用户了解自动添加的原因
5. **库存检查**: 在添加必选备件时检查库存可用性
6. **价格计算**: 确保必选备件的价格正确计算到订单总额中

## 数据示例

### 配件必选备件示例
```sql
-- 配件 60A11002 (FR8002 收卷车) 需要脚垫钣金
part_number: "60A11002"
required_parts: "05A0101289,05A0101290"
required_quantity: "2,2"
```

### 备件必选备件示例
```sql
-- 备件 01A0101038 (去皱硅胶) 需要螺钉和垫圈
part_number: "01A0101038"
required_parts: "11A0103002,11A0101003"
required_quantity: "2,2"
```

这个系统确保了主机、配件和备件的必选备件关系能够正确处理，为用户提供完整的产品配置体验。

### 6. 购物车UI组件增强

#### 6.1 必选备件购物车项目显示组件
```tsx
// components/Cart/RequiredPartCartItem.tsx
interface RequiredPartCartItemProps {
  item: CartItem & { is_required: true };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  language: 'zh' | 'en';
}

export const RequiredPartCartItem: React.FC<RequiredPartCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  language
}) => {
  const displayName = language === 'zh' ? item.name_zh : item.name_en;
  const displaySpec = language === 'zh' ? item.spec : item.spec_imperial;
  
  return (
    <div className="required-part-cart-item border-l-4 border-orange-400 bg-orange-50 p-4 rounded-lg">
      {/* 必选备件标识 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
          必选备件 Required Part
        </span>
        <span className="text-xs text-gray-500">
          (配套 {item.parent_part_number})
        </span>
      </div>
      
      <div className="flex gap-4">
        {/* 产品图片 */}
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={item.image_url || '/images/placeholder.jpg'}
            alt={displayName}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        
        {/* 产品信息 */}
        <div className="flex-1 min-w-0">
          {/* 基础信息 */}
          <div className="mb-2">
            <h4 className="font-medium text-gray-900 truncate">
              {displayName}
            </h4>
            <p className="text-sm text-gray-600">
              料号: {item.part_number}
            </p>
            {displaySpec && (
              <p className="text-sm text-gray-600">
                规格: {displaySpec}
              </p>
            )}
          </div>
          
          {/* 适用机型 */}
          {item.app_model && (
            <div className="mb-2">
              <span className="text-xs text-gray-500">适用机型:</span>
              <span className="text-xs text-gray-700 ml-1">{item.app_model}</span>
            </div>
          )}
          
          {/* 序列号兼容性 */}
          {item.app_sn && (
            <div className="mb-2">
              <span className="text-xs text-gray-500">序列号:</span>
              <span className="text-xs text-gray-700 ml-1">{item.app_sn}</span>
            </div>
          )}
          
          {/* 包装信息 */}
          <div className="flex gap-4 text-xs text-gray-500 mb-2">
            {item.package_size_cm && (
              <span>包装: {item.package_size_cm}</span>
            )}
            {item.net_weight_kg && (
              <span>重量: {item.net_weight_kg}kg</span>
            )}
            {item.pcs_per_box && (
              <span>装箱: {item.pcs_per_box}{item.unit}</span>
            )}
          </div>
          
          {/* 耗材标识 */}
          {item.is_consumable && (
            <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              耗材 Consumable
            </span>
          )}
        </div>
        
        {/* 数量和操作 */}
        <div className="flex flex-col items-end gap-2">
          {/* 数量控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center border rounded-md hover:bg-gray-50"
              disabled={item.quantity <= 1}
            >
              -
            </button>
            <span className="w-12 text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border rounded-md hover:bg-gray-50"
            >
              +
            </button>
          </div>
          
          {/* 单位 */}
          <span className="text-xs text-gray-500">{item.unit}</span>
          
          {/* 价格信息 */}
          {item.pricing && item.pricing.length > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium">
                ¥{item.pricing[0].price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                单价 / {item.unit}
              </div>
            </div>
          )}
          
          {/* 删除按钮 */}
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 text-sm"
            title="移除必选备件"
          >
            移除
          </button>
        </div>
      </div>
      
      {/* 库存信息 */}
      {item.inventory && item.inventory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">库存:</span>
            {item.inventory.map((inv, index) => (
              <span key={index} className="ml-2">
                {inv.region}: {inv.quantity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 6.2 购物车主组件更新
```tsx
// components/Cart/CartList.tsx
export const CartList: React.FC<CartListProps> = ({
  items,
  onUpdateQuantity,
  onRemove,
  language = 'zh'
}) => {
  // 分组显示：主要商品和必选备件
  const mainItems = items.filter(item => !item.is_required);
  const requiredItems = items.filter(item => item.is_required);
  
  return (
    <div className="cart-list space-y-4">
      {/* 主要商品 */}
      <div className="main-items">
        <h3 className="text-lg font-medium mb-4">主要商品</h3>
        {mainItems.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            language={language}
          />
        ))}
      </div>
      
      {/* 必选备件 */}
      {requiredItems.length > 0 && (
        <div className="required-items">
          <h3 className="text-lg font-medium mb-4 text-orange-700">
            必选备件 (Required Parts)
          </h3>
          <div className="space-y-3">
            {requiredItems.map(item => (
              <RequiredPartCartItem
                key={item.id}
                item={item as CartItem & { is_required: true }}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                language={language}
              />
            ))}
          </div>
          
          {/* 必选备件说明 */}
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>说明:</strong> 必选备件是配套主要商品使用的必需组件，
              建议与主要商品一起购买以确保设备正常运行。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 6.3 购物车项目类型定义
```typescript
// types/cart.ts
export interface CartItem {
  id: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  quantity: number;
  type: 'host' | 'accessory' | 'spare_part';
  is_required?: boolean;
  parent_part_number?: string;
  
  // 备件完整字段信息
  image_url?: string;
  spec?: string;
  spec_imperial?: string;
  app_model?: string;
  app_sn?: string;
  is_consumable?: boolean;
  unit?: string;
  status?: string;
  
  // 包装信息
  package_size_cm?: string | null;
  package_size_inch?: string | null;
  net_weight_kg?: number | null;
  net_weight_lbs?: number | null;
  gross_weight_kg?: number | null;
  gross_weight_lbs?: number | null;
  pcs_per_box?: number | null;
  
  // 定价和库存信息
  pricing?: PricingTier[];
  inventory?: InventoryInfo[];
}

export interface PricingTier {
  range: string;
  price: number;
  regionalPricing?: RegionalPricing[];
}

export interface RegionalPricing {
  region: string;
  price: number;
  currency: string;
}

export interface InventoryInfo {
  region: string;
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}
```

## 7. 必选备件展示要求总结

### 7.1 购物车中必选备件应显示的完整字段

根据备件API接口规范，必选备件在购物车中应该显示以下完整信息：

#### 基础信息
- `part_number`: 料号
- `name_zh` / `name_en`: 中英文名称
- `spec` / `spec_imperial`: 中英文规格
- `app_model`: 适用机型
- `app_sn`: 适用序列号
- `is_consumable`: 是否为耗材
- `unit`: 单位
- `image_url`: 产品图片

#### 包装信息
- `package_size_cm` / `package_size_inch`: 包装尺寸
- `net_weight_kg` / `net_weight_lbs`: 净重
- `gross_weight_kg` / `gross_weight_lbs`: 毛重
- `pcs_per_box`: 装箱数量

#### 定价和库存
- `pricing`: 定价层级信息
- `inventory`: 库存信息

#### 关系信息
- `is_required`: 标识为必选备件
- `parent_part_number`: 关联的主商品料号

### 7.2 显示特点

1. **视觉区分**: 使用橙色边框和背景区分必选备件
2. **标识清晰**: 显示"必选备件"标签和关联的主商品料号
3. **信息完整**: 显示所有备件相关的技术参数和规格
4. **操作便捷**: 支持数量调整和移除操作
5. **说明提示**: 提供必选备件的使用说明

这样确保了必选备件在购物车中按照完整的备件字段要求进行展示，为用户提供详细的产品信息。 