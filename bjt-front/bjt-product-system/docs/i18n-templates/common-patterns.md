# 常见多语言模式和解决方案

## 📋 目录
- [🎯 常见问题模式](#common-patterns)
- [🔧 标准解决方案](#solutions)
- [📝 代码模板](#templates)
- [🚀 自动化脚本](#automation)

---

## 🎯 常见问题模式 {#common-patterns}

### 1. **硬编码中文文本**

#### 🔍 识别模式
```javascript
// 常见硬编码模式
'型号: ' + value
"加载失败，请稍后再试"
`${name}更新成功`
message.success('操作完成')
console.log('处理中...')
```

#### ✅ 标准解决方案
```javascript
// 字段标签
{t('fields.model')}: {value}

// 错误消息
t('messages.loadFailed')

// 动态消息
t('messages.updateSuccess', { name })

// 通知消息
message.success(t('messages.operationComplete'))

// 日志消息 (可选择性翻译)
console.log(t('debug.processing'))
```

### 2. **单位重复显示**

#### 🔍 识别模式
```javascript
// 单位重复问题
<span>净重(kg): {weight} kg</span>
<span>尺寸(cm): {size} cm</span>
`电压(V): ${voltage}V`
```

#### ✅ 标准解决方案
```javascript
// 方案1: 分离单位显示
<span>{t('fields.netWeight')} ({t('units.kg')}): {weight}</span>

// 方案2: 智能单位函数
const formatWithUnit = (value, unitType) => {
  const unit = unitSystem === 'metric' ? t(`units.${unitType}`) : t(`units.${unitType}_imperial`);
  return `${value} ${unit}`;
};

// 方案3: 标题包含单位，值不重复
<span>{t('fields.netWeightKg')}: {weight}</span>  // 标题: "净重(kg)"
```

### 3. **条件文本显示**

#### 🔍 识别模式
```javascript
// 硬编码条件文本
status === 'active' ? '激活' : '未激活'
type === 'success' ? '成功' : type === 'error' ? '失败' : '处理中'
```

#### ✅ 标准解决方案
```javascript
// 方案1: 映射对象
const statusMap = {
  active: t('status.active'),
  inactive: t('status.inactive')
};
const statusText = statusMap[status] || t('status.unknown');

// 方案2: 动态key构建
const getStatusText = (status) => {
  const key = `status.${status}`;
  return t(key, { defaultValue: t('status.unknown') });
};

// 方案3: 翻译文件中预定义所有状态
// translations/zh.json
{
  "status": {
    "active": "激活",
    "inactive": "未激活", 
    "pending": "待处理",
    "unknown": "未知状态"
  }
}
```

---

## 🔧 标准解决方案 {#solutions}

### 1. **翻译文件结构模板**

```json
{
  "pageTitle": "页面标题",
  "loading": "加载中...",
  "error": "加载失败",
  "noData": "暂无数据",
  
  "fields": {
    "model": "型号",
    "price": "价格",
    "voltage": "电压",
    "netWeight": "净重",
    "packageSize": "包装尺寸"
  },
  
  "units": {
    "kg": "kg",
    "lbs": "lbs", 
    "cm": "cm",
    "inch": "inch",
    "V": "V",
    "Hz": "Hz"
  },
  
  "actions": {
    "add": "添加",
    "edit": "编辑",
    "delete": "删除",
    "save": "保存",
    "cancel": "取消",
    "confirm": "确认",
    "addToCart": "添加到购物车"
  },
  
  "messages": {
    "loadFailed": "加载失败",
    "saveSuccess": "保存成功",
    "deleteSuccess": "删除成功",
    "addToCartSuccess": "已添加到购物车",
    "updateSuccess": "{{name}}更新成功",
    "itemCount": "共 {{count}} 个项目"
  },
  
  "prompts": {
    "confirmDelete": "确认删除此项目？",
    "unsavedChanges": "您有未保存的更改",
    "pleaseSelect": "请选择",
    "pleaseInput": "请输入"
  },
  
  "validation": {
    "required": "此字段为必填项",
    "invalidFormat": "格式不正确",
    "tooShort": "内容过短",
    "tooLong": "内容过长"
  },
  
  "status": {
    "active": "激活",
    "inactive": "未激活",
    "pending": "待处理",
    "success": "成功", 
    "failed": "失败",
    "processing": "处理中"
  }
}
```

### 2. **组件翻译集成模板**

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ComponentProps {
  // props定义
}

const Component: React.FC<ComponentProps> = (props) => {
  // 1. 引入翻译函数
  const { t } = useTranslation('namespace'); // 指定命名空间
  
  // 2. 预处理翻译文本（避免重复调用）
  const labels = {
    title: t('pageTitle'),
    fields: {
      model: t('fields.model'),
      price: t('fields.price')
    },
    actions: {
      save: t('actions.save'),
      cancel: t('actions.cancel')
    }
  };
  
  // 3. 处理动态翻译
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: t('status.active'),
      inactive: t('status.inactive'),
      pending: t('status.pending')
    };
    return statusMap[status] || t('status.unknown');
  };
  
  // 4. 处理带参数的翻译
  const showSuccessMessage = (itemName: string) => {
    message.success(t('messages.updateSuccess', { name: itemName }));
  };
  
  return (
    <div>
      <h1>{labels.title}</h1>
      
      {/* 字段标签 */}
      <div>
        <label>{labels.fields.model}:</label>
        <span>{props.model}</span>
      </div>
      
      {/* 条件文本 */}
      <div>
        状态: {getStatusText(props.status)}
      </div>
      
      {/* 操作按钮 */}
      <button onClick={() => showSuccessMessage(props.name)}>
        {labels.actions.save}
      </button>
    </div>
  );
};

export default Component;
```

### 3. **单位制处理模板**

```typescript
// 单位制处理hook
const useUnitSystem = () => {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  
  const unitSystem = user?.preferredUnit || 'metric';
  
  const getUnitLabel = (fieldType: 'weight' | 'size' | 'voltage') => {
    const unitMap = {
      weight: unitSystem === 'metric' ? t('units.kg') : t('units.lbs'),
      size: unitSystem === 'metric' ? t('units.cm') : t('units.inch'),
      voltage: t('units.V') // 电压单位通常不变
    };
    return unitMap[fieldType];
  };
  
  const formatValue = (metricValue: number, imperialValue: number, fieldType: 'weight' | 'size') => {
    const value = unitSystem === 'metric' ? metricValue : imperialValue;
    const unit = getUnitLabel(fieldType);
    return { value, unit, formatted: `${value} ${unit}` };
  };
  
  const getFieldLabel = (fieldKey: string, fieldType?: 'weight' | 'size' | 'voltage') => {
    const baseLabel = t(`fields.${fieldKey}`);
    if (fieldType) {
      const unit = getUnitLabel(fieldType);
      return `${baseLabel} (${unit})`;
    }
    return baseLabel;
  };
  
  return {
    unitSystem,
    getUnitLabel,
    formatValue,
    getFieldLabel
  };
};

// 使用示例
const Component = () => {
  const { getFieldLabel, formatValue } = useUnitSystem();
  
  return (
    <div>
      {/* 字段标签自动包含单位 */}
      <label>{getFieldLabel('netWeight', 'weight')}:</label>
      
      {/* 值显示不重复单位 */}
      <span>{formatValue(machine.netWeightKg, machine.netWeightLbs, 'weight').value}</span>
    </div>
  );
};
```

---

## 📝 代码模板 {#templates}

### 1. **页面组件完整模板**

```typescript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, message } from 'antd';

// 页面组件模板
const PageTemplate: React.FC = () => {
  const { t } = useTranslation('pageName'); // 替换为实际页面名
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // 预处理翻译文本
  const texts = {
    title: t('pageTitle'),
    loading: t('loading'),
    noData: t('noData'),
    fields: {
      name: t('fields.name'),
      status: t('fields.status')
    },
    actions: {
      add: t('actions.add'),
      edit: t('actions.edit'),
      delete: t('actions.delete')
    },
    messages: {
      loadFailed: t('messages.loadFailed'),
      saveSuccess: t('messages.saveSuccess')
    }
  };
  
  // API调用
  const fetchData = async () => {
    setLoading(true);
    try {
      // API调用逻辑
      const response = await api.getData();
      setData(response.data);
    } catch (error) {
      message.error(texts.messages.loadFailed);
    } finally {
      setLoading(false);
    }
  };
  
  // 事件处理
  const handleSave = async (item: any) => {
    try {
      await api.saveItem(item);
      message.success(texts.messages.saveSuccess);
      fetchData(); // 刷新数据
    } catch (error) {
      message.error(texts.messages.loadFailed);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  if (loading) {
    return <div>{texts.loading}</div>;
  }
  
  return (
    <div>
      <h1>{texts.title}</h1>
      
      {data.length === 0 ? (
        <div>{texts.noData}</div>
      ) : (
        <div>
          {data.map(item => (
            <div key={item.id}>
              <span>{texts.fields.name}: {item.name}</span>
              <Button onClick={() => handleSave(item)}>
                {texts.actions.save}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageTemplate;
```

### 2. **表单组件模板**

```typescript
import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';

interface FormData {
  name: string;
  email: string;
}

const FormTemplate: React.FC = () => {
  const { t } = useTranslation('forms');
  const [form] = Form.useForm();
  
  // 翻译文本
  const labels = {
    fields: {
      name: t('fields.name'),
      email: t('fields.email')
    },
    actions: {
      submit: t('actions.submit'),
      reset: t('actions.reset')
    },
    validation: {
      required: t('validation.required'),
      invalidEmail: t('validation.invalidEmail')
    },
    messages: {
      submitSuccess: t('messages.submitSuccess'),
      submitFailed: t('messages.submitFailed')
    }
  };
  
  const onFinish = async (values: FormData) => {
    try {
      await api.submit(values);
      message.success(labels.messages.submitSuccess);
      form.resetFields();
    } catch (error) {
      message.error(labels.messages.submitFailed);
    }
  };
  
  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item
        label={labels.fields.name}
        name="name"
        rules={[
          { required: true, message: labels.validation.required }
        ]}
      >
        <Input placeholder={t('prompts.pleaseInput')} />
      </Form.Item>
      
      <Form.Item
        label={labels.fields.email}
        name="email"
        rules={[
          { required: true, message: labels.validation.required },
          { type: 'email', message: labels.validation.invalidEmail }
        ]}
      >
        <Input placeholder={t('prompts.pleaseInput')} />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {labels.actions.submit}
        </Button>
        <Button onClick={() => form.resetFields()}>
          {labels.actions.reset}
        </Button>
      </Form.Item>
    </Form>
  );
};
```

---

## 🚀 自动化脚本 {#automation}

### 1. **批量修复脚本**

```bash
#!/bin/bash
# 批量修复页面多语言问题

PAGES_DIR="frontend/src/pages"
PAGES=("Profile" "Cart" "ProductDetail" "Machines" "Consumables")

echo "🚀 开始批量修复多语言问题..."

for page in "${PAGES[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 处理页面: $page"
    
    # 1. 扫描问题
    echo "🔍 扫描问题..."
    ./tools/i18n-scanner/i18n-tools.sh scan-file "$PAGES_DIR/$page/index.tsx"
    
    # 2. 生成翻译文件
    echo "🏗️ 生成翻译文件..."
    ./tools/i18n-fixer/generate-i18n-files.sh "${page,,}" page
    
    # 3. 提示手动修复
    echo "✋ 请手动修复硬编码文本，然后按回车继续..."
    read -r
    
    # 4. 验证修复结果
    echo "✅ 验证修复结果..."
    ./tools/i18n-scanner/i18n-tools.sh scan-file "$PAGES_DIR/$page/index.tsx"
    
    echo "📄 $page 处理完成！"
    echo ""
done

echo "🎉 批量修复完成！"
```

### 2. **翻译文件同步脚本**

```bash
#!/bin/bash
# 同步中英文翻译文件的key结构

LOCALES_DIR="frontend/src/i18n/locales"

echo "🔄 同步翻译文件结构..."

for zh_file in "$LOCALES_DIR/zh"/*.json; do
    filename=$(basename "$zh_file")
    en_file="$LOCALES_DIR/en/$filename"
    
    echo "🔍 检查文件: $filename"
    
    if [ ! -f "$en_file" ]; then
        echo "❌ 英文文件不存在: $en_file"
        continue
    fi
    
    # 检查key一致性
    zh_keys=$(jq -r 'paths(scalars) as $p | $p | join(".")' "$zh_file" | sort)
    en_keys=$(jq -r 'paths(scalars) as $p | $p | join(".")' "$en_file" | sort)
    
    missing_in_en=$(comm -23 <(echo "$zh_keys") <(echo "$en_keys"))
    missing_in_zh=$(comm -13 <(echo "$zh_keys") <(echo "$en_keys"))
    
    if [ -n "$missing_in_en" ]; then
        echo "⚠️ 英文文件缺少的key:"
        echo "$missing_in_en"
    fi
    
    if [ -n "$missing_in_zh" ]; then
        echo "⚠️ 中文文件缺少的key:"
        echo "$missing_in_zh"
    fi
    
    if [ -z "$missing_in_en" ] && [ -z "$missing_in_zh" ]; then
        echo "✅ $filename 结构一致"
    fi
done

echo "🔄 同步检查完成！"
```

---

## 📋 使用清单

### 开发阶段
- [ ] 使用翻译文件结构模板
- [ ] 集成组件翻译模板
- [ ] 实现单位制处理
- [ ] 避免硬编码文本

### 修复阶段  
- [ ] 运行扫描工具发现问题
- [ ] 使用标准解决方案修复
- [ ] 应用代码模板重构
- [ ] 运行自动化脚本验证

### 维护阶段
- [ ] 定期运行同步脚本
- [ ] 检查翻译文件一致性
- [ ] 更新模板和解决方案
- [ ] 培训团队使用规范

---

**使用这些模板和解决方案，可以高效地解决常见的多语言问题！** 🎯 