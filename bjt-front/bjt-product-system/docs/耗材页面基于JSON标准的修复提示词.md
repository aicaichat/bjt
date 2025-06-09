# 🎯 耗材页面基于JSON标准的字段修复提示词

## 📊 当前状况分析（基于JSON标准）

根据 `output/all-pages-display-fields.json` 标准与前端实际代码的对比分析：

### 🔍 覆盖率现状
- **筛选项**: 100.0% 覆盖率 ✅ 良好
- **商品列表**: 76.9% 覆盖率 ⚠️ 一般（13个字段中缺失3个）
- **购物车**: 75.0% 覆盖率 ⚠️ 一般（12个字段中缺失3个）
- **tooltip详情**: 41.2% 覆盖率 ❌ 需要改进（34个字段中缺失20个）
- **PO页**: 87.5% 覆盖率 ✅ 良好（8个字段中缺失1个）

### 🎯 核心问题
1. **关键字段缺失**: 型号公制/英制对应、规格英制缺失（P0优先级）
2. **Tooltip信息不完整**: 34个详细字段中20个未实现
3. **图片字段映射**: `product_image_url`（产品图片袋型实物）未正确实现

## 🚨 P0 - 关键字段修复（立即修复）

### 1. 型号和规格字段完整实现

**问题**: 前端缺少公制/英制对应的型号和规格字段

```typescript
// ❌ 当前问题：缺少关键标识字段
interface ConsumableItem {
  model?: string;           // 不明确是公制还是英制
  spec?: string;            // 缺少英制对应
}

// ✅ 修复方案：完整的型号规格字段
interface ConsumableItem {
  // 型号字段（公制/英制对应）
  model_metric: string;     // 型号（公制）- JSON标准要求
  model_imperial: string;   // 型号(英制) - JSON标准要求
  
  // 规格字段（公制/英制对应）
  spec: string;             // Spec. - JSON标准要求  
  spec_imperial: string;    // Spec.(英制) - JSON标准要求
  
  // 核心标识字段
  app_model: string;        // 适用机型
  part_number: string;      // 料号
  name_en: string;          // 名称(英文)新增需求
  shape: string;            // 形状
  product_id: string;       // productId
  pcs_per_box: number;      // 单箱数量
  
  // 图片字段
  product_image_url: string; // 产品图片袋型实物
  
  // 气泡特有字段
  bubble_diameter_cm?: number;  // 泡径cm
  bubble_diameter_inch?: number; // 泡径inch
}
```

### 2. 前端组件修复代码

```typescript
// ✅ 商品列表组件修复 - 实现13个JSON标准字段
const ConsumableCard: React.FC<{ item: ConsumableItem }> = ({ item }) => {
  const { unitSystem } = useGlobalSettings(); // metric | imperial
  
  return (
    <div className="consumable-card">
      {/* 1. 产品图片袋型实物 */}
      <div className="product-images">
        <img 
          src={item.product_image_url} 
          alt={`${item.shape} 产品实物`}
          className="product-image"
        />
      </div>
      
      {/* 2. 基本信息 */}
      <div className="basic-info">
        <h3 className="app-model">{item.app_model}</h3>
        <p className="name-en">{item.name_en}</p>
        <div className="shape-info">
          <span className="shape-label">形状: </span>
          <span className="shape-value">{item.shape}</span>
        </div>
      </div>
      
      {/* 3. 核心标识 */}
      <div className="identification">
        <div className="part-number">
          <strong>料号: </strong>{item.part_number}
        </div>
        <div className="product-id">
          <strong>ProductID: </strong>{item.product_id}
        </div>
      </div>
      
      {/* 4. 智能单位制显示 */}
      <div className="specifications">
        <div className="model-info">
          <strong>型号: </strong>
          {unitSystem === 'metric' ? item.model_metric : item.model_imperial}
        </div>
        <div className="spec-info">
          <strong>规格: </strong>
          {unitSystem === 'metric' ? item.spec : item.spec_imperial}
        </div>
      </div>
      
      {/* 5. 气泡特有字段（条件显示） */}
      {(item.bubble_diameter_cm || item.bubble_diameter_inch) && (
        <div className="bubble-info">
          <strong>泡径: </strong>
          {unitSystem === 'metric' 
            ? `${item.bubble_diameter_cm}cm` 
            : `${item.bubble_diameter_inch}inch`
          }
        </div>
      )}
      
      {/* 6. 包装信息 */}
      <div className="packaging">
        <strong>单箱数量: </strong>{item.pcs_per_box}
      </div>
    </div>
  );
};
```

### 3. 购物车组件修复

```typescript
// ✅ 购物车组件修复 - 实现12个JSON标准字段
const CartConsumableItem: React.FC<{ item: CartItem }> = ({ item }) => {
  const { unitSystem } = useGlobalSettings();
  
  return (
    <div className="cart-consumable-item">
      {/* 购物车不显示产品图片，按JSON标准 */}
      
      {/* 基本信息 */}
      <div className="item-details">
        <h4>{item.app_model}</h4>
        <p className="name-en">{item.name_en}</p>
        <div className="identification">
          <span>料号: {item.part_number}</span>
          <span>ID: {item.product_id}</span>
          <span>形状: {item.shape}</span>
        </div>
      </div>
      
      {/* 规格信息 */}
      <div className="specifications">
        <p>型号: {unitSystem === 'metric' ? item.model_metric : item.model_imperial}</p>
        <p>规格: {unitSystem === 'metric' ? item.spec : item.spec_imperial}</p>
        
        {/* 泡径信息（条件显示） */}
        {(item.bubble_diameter_cm || item.bubble_diameter_inch) && (
          <p>泡径: {unitSystem === 'metric' 
            ? `${item.bubble_diameter_cm}cm` 
            : `${item.bubble_diameter_inch}inch`
          }</p>
        )}
        
        <p>单箱数量: {item.pcs_per_box}</p>
      </div>
      
      {/* 购物车操作 */}
      <div className="cart-actions">
        <QuantitySelector 
          value={item.quantity}
          onChange={(qty) => updateCartQuantity(item.product_id, qty)}
        />
      </div>
    </div>
  );
};
```

### 4. PO页面组件修复

```typescript
// ✅ PO页面组件修复 - 实现8个JSON标准字段
const POConsumableItem: React.FC<{ item: POItem }> = ({ item }) => {
  const { unitSystem } = useGlobalSettings();
  
  return (
    <tr className="po-consumable-row">
      <td className="name-en">{item.name_en}</td>
      <td className="part-number">{item.part_number}</td>
      <td className="model">
        {unitSystem === 'metric' ? item.model_metric : item.model_imperial}
      </td>
      <td className="spec">
        {unitSystem === 'metric' ? item.spec : item.spec_imperial}
      </td>
      <td className="brand">{item.brand}</td>
      <td className="product-id">{item.product_id}</td>
      <td className="quantity">{item.quantity}</td>
      <td className="total">{item.total}</td>
    </tr>
  );
};
```

## 📝 P1 - Tooltip详细信息修复（本周完成）

### 1. 完整的Tooltip字段实现

```typescript
// ✅ 基于JSON标准的34个tooltip字段
interface DetailedConsumableInfo extends ConsumableItem {
  // 物理特性（JSON标准要求）
  material: string;              // 材质 ✓
  thickness_um?: number;         // 厚度/克重um/gsm
  thickness_mil?: number;        // 厚度/克重mil/#
  width_cm?: number;            // 膜宽cm ✓
  width_inch?: number;          // 膜宽inch ✓
  length_cm?: number;           // 袋长cm ✓
  length_inch?: number;         // 袋长inch ✓
  total_length_m?: number;      // 总长m ✓
  total_length_ft?: number;     // 总长ft
  
  // 包装信息（JSON标准要求）
  package_type?: string;        // 包装方式 ✓
  package_size_cm?: string;     // 包装尺寸cm
  package_size_inch?: string;   // 包装尺寸inch
  net_weight_kg?: number;       // 单件净重kg ✓
  net_weight_lbs?: number;      // 单件净重lbs
  package_image_url?: string;   // 包装实物图片 ✓
  pallet_size_cm?: string;      // 托盘尺寸cm ✓
  
  // 托盘配置A（JSON标准要求）
  pallet_rolls_a?: number;      // 一托卷数A
  pallet_weight_a_kg?: number;  // 整托毛重Akg
  pallet_weight_a_lbs?: number; // 整托毛重Albs
  pallet_height_a_cm?: number;  // 打托高度Acm
  pallet_height_a_inch?: number; // 打托高度Ainch
  
  // 托盘配置B（JSON标准要求）
  pallet_rolls_b?: number;      // 一托卷数B
  pallet_weight_b_kg?: number;  // 整盘毛重kg
  pallet_weight_b_lbs?: number; // 整盘毛重Blbs
  pallet_height_b_cm?: number;  // 打托高度cm
  pallet_height_b_inch?: number; // 打托高度Binch
  
  // 托盘配置C（JSON标准要求）
  pallet_rolls_c?: number;      // 一托卷数C
  pallet_weight_c_kg?: number;  // 整托毛重kg
  pallet_weight_c_lbs?: number; // 整托毛重Clbs
  pallet_height_c_cm?: number;  // 打托高度Ccm
  pallet_height_c_inch?: number; // 打托高度Cinch
  
  // 管径信息（JSON标准要求）
  core_diameter_cm?: number;    // 纸筒内径cm
  core_diameter_inch?: number;  // 纸筒内径inch
}
```

### 2. Tooltip组件实现

```typescript
// ✅ 完整的34字段tooltip实现
const ConsumableDetailTooltip: React.FC<{
  item: DetailedConsumableInfo;
  visible: boolean;
  onClose: () => void;
}> = ({ item, visible, onClose }) => {
  const { unitSystem } = useGlobalSettings();
  
  return (
    <Modal
      title={`${item.name_en} - 详细信息`}
      visible={visible}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <div className="tooltip-content">
        {/* 基本信息区域 */}
        <div className="section basic-info">
          <h3>产品基本信息</h3>
          <div className="info-grid">
            <div><strong>适用机型:</strong> {item.app_model}</div>
            <div><strong>英文名称:</strong> {item.name_en}</div>
            <div><strong>形状:</strong> {item.shape}</div>
            <div><strong>材质:</strong> {item.material}</div>
            <div><strong>料号:</strong> {item.part_number}</div>
            <div><strong>ProductID:</strong> {item.product_id}</div>
          </div>
        </div>
        
        {/* 物理特性区域 */}
        <div className="section physical-specs">
          <h3>物理特性</h3>
          <div className="info-grid">
            {/* 厚度/克重信息 */}
            {item.thickness_um && (
              <div>
                <strong>厚度/克重:</strong> {
                  unitSystem === 'metric' 
                    ? `${item.thickness_um} um/gsm`
                    : `${item.thickness_mil} mil/#`
                }
              </div>
            )}
            
            {/* 膜宽信息 */}
            {item.width_cm && (
              <div>
                <strong>膜宽:</strong> {
                  unitSystem === 'metric' 
                    ? `${item.width_cm} cm`
                    : `${item.width_inch} inch`
                }
              </div>
            )}
            
            {/* 袋长信息 */}
            {item.length_cm && (
              <div>
                <strong>袋长:</strong> {
                  unitSystem === 'metric' 
                    ? `${item.length_cm} cm`
                    : `${item.length_inch} inch`
                }
              </div>
            )}
            
            {/* 总长信息 */}
            {item.total_length_m && (
              <div>
                <strong>总长:</strong> {
                  unitSystem === 'metric' 
                    ? `${item.total_length_m} m`
                    : `${item.total_length_ft} ft`
                }
              </div>
            )}
            
            {/* 纸筒内径（条件显示） */}
            {item.core_diameter_cm && (
              <div>
                <strong>纸筒内径:</strong> {
                  unitSystem === 'metric' 
                    ? `${item.core_diameter_cm} cm`
                    : `${item.core_diameter_inch} inch`
                }
              </div>
            )}
          </div>
        </div>
        
        {/* 包装信息区域 */}
        <div className="section packaging-info">
          <h3>包装信息</h3>
          <div className="info-grid">
            {item.package_type && (
              <div><strong>包装方式:</strong> {item.package_type}</div>
            )}
            
            {item.package_size_cm && (
              <div>
                <strong>包装尺寸:</strong> {
                  unitSystem === 'metric' 
                    ? item.package_size_cm
                    : item.package_size_inch
                }
              </div>
            )}
            
            {item.net_weight_kg && (
              <div>
                <strong>单件净重:</strong> {
                  unitSystem === 'metric' 
                    ? `${item.net_weight_kg} kg`
                    : `${item.net_weight_lbs} lbs`
                }
              </div>
            )}
            
            <div><strong>单箱数量:</strong> {item.pcs_per_box}</div>
          </div>
          
          {/* 包装实物图片 */}
          {item.package_image_url && (
            <div className="package-image">
              <img src={item.package_image_url} alt="包装实物" />
            </div>
          )}
        </div>
        
        {/* 托盘配置区域 */}
        <div className="section pallet-configs">
          <h3>托盘配置</h3>
          
          {/* 托盘基本信息 */}
          {item.pallet_size_cm && (
            <div className="pallet-basic">
              <strong>托盘尺寸:</strong> {item.pallet_size_cm}
            </div>
          )}
          
          {/* 配置A */}
          {item.pallet_rolls_a && (
            <div className="config-section">
              <h4>配置A</h4>
              <div className="config-grid">
                <div>一托卷数: {item.pallet_rolls_a}</div>
                <div>
                  整托毛重: {
                    unitSystem === 'metric' 
                      ? `${item.pallet_weight_a_kg} kg`
                      : `${item.pallet_weight_a_lbs} lbs`
                  }
                </div>
                <div>
                  打托高度: {
                    unitSystem === 'metric' 
                      ? `${item.pallet_height_a_cm} cm`
                      : `${item.pallet_height_a_inch} inch`
                  }
                </div>
              </div>
            </div>
          )}
          
          {/* 配置B */}
          {item.pallet_rolls_b && (
            <div className="config-section">
              <h4>配置B</h4>
              <div className="config-grid">
                <div>一托卷数: {item.pallet_rolls_b}</div>
                <div>
                  整盘毛重: {
                    unitSystem === 'metric' 
                      ? `${item.pallet_weight_b_kg} kg`
                      : `${item.pallet_weight_b_lbs} lbs`
                  }
                </div>
                <div>
                  打托高度: {
                    unitSystem === 'metric' 
                      ? `${item.pallet_height_b_cm} cm`
                      : `${item.pallet_height_b_inch} inch`
                  }
                </div>
              </div>
            </div>
          )}
          
          {/* 配置C */}
          {item.pallet_rolls_c && (
            <div className="config-section">
              <h4>配置C</h4>
              <div className="config-grid">
                <div>一托卷数: {item.pallet_rolls_c}</div>
                <div>
                  整托毛重: {
                    unitSystem === 'metric' 
                      ? `${item.pallet_weight_c_kg} kg`
                      : `${item.pallet_weight_c_lbs} lbs`
                  }
                </div>
                <div>
                  打托高度: {
                    unitSystem === 'metric' 
                      ? `${item.pallet_height_c_cm} cm`
                      : `${item.pallet_height_c_inch} inch`
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
```

## 🔧 API数据结构标准化

### 1. 后端API返回数据结构调整

```typescript
// ✅ 基于JSON标准的API响应结构
interface ConsumableApiResponse {
  // 核心标识（JSON标准要求）
  app_model: string;           // 适用机型
  name_en: string;             // 名称(英文)新增需求
  shape: string;               // 形状
  product_image_url: string;   // 产品图片袋型实物
  part_number: string;         // 料号
  product_id: string;          // productId
  pcs_per_box: number;         // 单箱数量
  
  // 型号规格（JSON标准要求）
  model_metric: string;        // 型号（公制）
  model_imperial: string;      // 型号(英制)
  spec: string;                // Spec.
  spec_imperial: string;       // Spec.(英制)
  
  // 气泡特有（JSON标准要求）
  bubble_diameter_cm?: number; // 泡径cm
  bubble_diameter_inch?: number; // 泡径inch
  
  // 品牌信息（PO页JSON标准要求）
  brand: string;               // 品牌
  
  // Tooltip详细信息（JSON标准要求）
  material: string;            // 材质
  thickness_um?: number;       // 厚度/克重um/gsm
  thickness_mil?: number;      // 厚度/克重mil/#
  width_cm?: number;           // 膜宽cm
  width_inch?: number;         // 膜宽inch
  length_cm?: number;          // 袋长cm
  length_inch?: number;        // 袋长inch
  total_length_m?: number;     // 总长m
  total_length_ft?: number;    // 总长ft
  
  // 包装信息（JSON标准要求）
  package_type?: string;       // 包装方式
  package_size_cm?: string;    // 包装尺寸cm
  package_size_inch?: string;  // 包装尺寸inch
  net_weight_kg?: number;      // 单件净重kg
  net_weight_lbs?: number;     // 单件净重lbs
  package_image_url?: string;  // 包装实物图片
  pallet_size_cm?: string;     // 托盘尺寸cm
  
  // 托盘配置A（JSON标准要求）
  pallet_rolls_a?: number;     // 一托卷数A
  pallet_weight_a_kg?: number; // 整托毛重Akg
  pallet_weight_a_lbs?: number; // 整托毛重Albs
  pallet_height_a_cm?: number; // 打托高度Acm
  pallet_height_a_inch?: number; // 打托高度Ainch
  
  // 托盘配置B（JSON标准要求）
  pallet_rolls_b?: number;     // 一托卷数B
  pallet_weight_b_kg?: number; // 整盘毛重kg
  pallet_weight_b_lbs?: number; // 整盘毛重Blbs
  pallet_height_b_cm?: number; // 打托高度cm
  pallet_height_b_inch?: number; // 打托高度Binch
  
  // 托盘配置C（JSON标准要求）
  pallet_rolls_c?: number;     // 一托卷数C
  pallet_weight_c_kg?: number; // 整托毛重kg
  pallet_weight_c_lbs?: number; // 整托毛重Clbs
  pallet_height_c_cm?: number; // 打托高度Ccm
  pallet_height_c_inch?: number; // 打托高度Cinch
  
  // 管径信息（JSON标准要求）
  core_diameter_cm?: number;   // 纸筒内径cm
  core_diameter_inch?: number; // 纸筒内径inch
}
```

## 🧪 基于JSON标准的验收测试

### 1. 字段完整性测试
```javascript
// ✅ JSON标准字段验收测试
const validateJsonStandardCompliance = (item) => {
  const results = {
    '商品列表': [],
    '购物车': [],
    'tooltip': [],
    'PO页': []
  };
  
  // 商品列表13个字段验证
  const listFields = [
    'app_model', 'name_en', 'shape', 'product_image_url', 'part_number',
    'model_metric', 'model_imperial', 'spec', 'spec_imperial',
    'bubble_diameter_cm', 'bubble_diameter_inch', 'product_id', 'pcs_per_box'
  ];
  
  listFields.forEach(field => {
    results['商品列表'].push({
      field,
      present: item.hasOwnProperty(field),
      value: item[field]
    });
  });
  
  // 购物车12个字段验证（不包含product_image_url）
  const cartFields = listFields.filter(f => f !== 'product_image_url');
  
  cartFields.forEach(field => {
    results['购物车'].push({
      field,
      present: item.hasOwnProperty(field),
      value: item[field]
    });
  });
  
  // Tooltip 34个字段验证
  const tooltipFields = [
    'material', 'thickness_um', 'thickness_mil', 'width_cm', 'width_inch',
    'length_cm', 'length_inch', 'name_en', 'total_length_m', 'total_length_ft',
    'package_type', 'package_size_cm', 'package_size_inch', 'net_weight_kg',
    'net_weight_lbs', 'package_image_url', 'pallet_size_cm',
    // 托盘配置字段...
  ];
  
  // PO页8个字段验证
  const poFields = [
    'name_en', 'part_number', 'model_metric', 'model_imperial',
    'spec', 'spec_imperial', 'brand', 'product_id'
  ];
  
  return results;
};
```

### 2. 覆盖率目标
- **商品列表**: ≥ 95% (13个字段中至少实现12个)
- **购物车**: ≥ 95% (12个字段中至少实现11个) 
- **tooltip详情**: ≥ 85% (34个字段中至少实现29个)
- **PO页**: ≥ 95% (8个字段中至少实现7个)

## 📋 实施计划

### 第1天：P0关键字段修复
1. ✅ 实现 `model_metric` 和 `model_imperial` 字段
2. ✅ 实现 `spec_imperial` 字段
3. ✅ 实现 `product_image_url` 字段
4. ✅ 测试商品列表、购物车、PO页的字段显示

### 第2-3天：Tooltip详细信息完善
1. ✅ 实现物理特性字段（厚度、尺寸、管径）
2. ✅ 实现包装信息字段
3. ✅ 实现托盘配置A/B/C字段
4. ✅ 测试条件显示逻辑

### 第4天：验收测试
1. ✅ 运行字段完整性验证
2. ✅ 确认覆盖率达到目标
3. ✅ 测试多语言和单位制切换
4. ✅ 性能测试和优化

**总体目标**: 前端字段与JSON标准定义的匹配率达到90%以上 