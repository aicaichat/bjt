# 多语言国际化最佳实践

## 📋 目录
- [🎯 核心原则](#core-principles)
- [📁 文件组织](#file-organization)
- [🔤 命名规范](#naming-conventions)
- [💡 编码技巧](#coding-tips)
- [🚀 性能优化](#performance)
- [🐛 常见陷阱](#common-pitfalls)

---

## 🎯 核心原则 {#core-principles}

### 1. **单一职责原则**
- 一个翻译key只负责一个含义
- 避免在不同上下文中复用同一个key

```json
// ❌ 不好的做法
{
  "confirm": "确认"  // 在删除、保存、提交等场景都用这个key
}

// ✅ 好的做法
{
  "actions": {
    "confirmDelete": "确认删除",
    "confirmSave": "确认保存", 
    "confirmSubmit": "确认提交"
  }
}
```

### 2. **语义化命名**
- 使用描述性的key名称
- 体现内容的语义而非显示形式

```json
// ❌ 不好的做法
{
  "redButton": "删除",
  "bigTitle": "欢迎"
}

// ✅ 好的做法
{
  "actions": {
    "delete": "删除"
  },
  "titles": {
    "welcome": "欢迎"
  }
}
```

### 3. **分层组织**
- 按功能域分组翻译内容
- 控制嵌套层级深度（建议不超过3层）

```json
{
  "pages": {
    "profile": {
      "title": "个人资料",
      "fields": {
        "name": "姓名",
        "email": "邮箱"
      }
    }
  }
}
```

---

## 📁 文件组织 {#file-organization}

### 1. **目录结构**
```
frontend/src/i18n/
├── locales/
│   ├── zh/                 # 中文翻译
│   │   ├── common.json     # 通用翻译
│   │   ├── machines.json   # 机器页面
│   │   ├── profile.json    # 个人资料页面
│   │   └── errors.json     # 错误信息
│   └── en/                 # 英文翻译
│       ├── common.json
│       ├── machines.json
│       ├── profile.json
│       └── errors.json
├── index.ts               # i18n配置入口
└── resources.ts           # 资源配置
```

### 2. **文件拆分策略**
- **按页面拆分**: 每个主要页面一个文件
- **按功能域拆分**: 相关功能合并到一个文件
- **通用内容单独文件**: common.json存放共享内容

### 3. **文件大小控制**
- 单个翻译文件建议不超过200个key
- 过大的文件应按子功能拆分

---

## 🔤 命名规范 {#naming-conventions}

### 1. **文件命名**
```bash
# 页面翻译文件
machines.json       # 机器页面
profile.json        # 个人资料页面
product-detail.json # 产品详情页面（kebab-case）

# 功能翻译文件
common.json         # 通用翻译
errors.json         # 错误信息
validations.json    # 验证信息
```

### 2. **Key命名规范**
```json
{
  // 页面标题
  "pageTitle": "页面标题",
  
  // 字段标签
  "fields": {
    "firstName": "名字",
    "lastName": "姓氏",
    "emailAddress": "邮箱地址"
  },
  
  // 操作动作
  "actions": {
    "addToCart": "添加到购物车",
    "removeFromCart": "从购物车移除"
  },
  
  // 状态消息
  "messages": {
    "loadingData": "正在加载数据",
    "saveSuccess": "保存成功",
    "deleteFailed": "删除失败"
  },
  
  // 提示信息
  "prompts": {
    "confirmDelete": "确认删除此项目？",
    "unsavedChanges": "您有未保存的更改"
  }
}
```

### 3. **层级结构建议**
```json
{
  "pages": {
    "machines": {
      "title": "机器管理",
      "tabs": {
        "list": "机器列表",
        "accessories": "配件管理"
      }
    }
  },
  "components": {
    "navigation": {
      "home": "首页",
      "products": "产品"
    }
  }
}
```

---

## 💡 编码技巧 {#coding-tips}

### 1. **使用TypeScript类型安全**
```typescript
// 定义翻译key的类型
type TranslationKeys = 
  | 'fields.model'
  | 'fields.price'
  | 'actions.addToCart'
  | 'messages.saveSuccess';

// 使用时有类型检查
const { t } = useTranslation<TranslationKeys>('machines');
const modelLabel = t('fields.model'); // 类型安全
```

### 2. **条件翻译处理**
```typescript
// ❌ 不好的做法
const getStatusText = (status: string) => {
  if (status === 'active') return '激活';
  if (status === 'inactive') return '未激活';
  return '未知';
};

// ✅ 好的做法
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: t('status.active'),
    inactive: t('status.inactive'),
    unknown: t('status.unknown')
  };
  return statusMap[status] || t('status.unknown');
};
```

### 3. **参数化翻译**
```typescript
// 翻译文件
{
  "messages": {
    "itemsCount": "共 {{count}} 个项目",
    "welcomeUser": "欢迎，{{name}}！"
  }
}

// 使用
t('messages.itemsCount', { count: items.length })
t('messages.welcomeUser', { name: user.name })
```

### 4. **复数形式处理**
```typescript
// 翻译文件
{
  "cart": {
    "itemCount_zero": "购物车为空",
    "itemCount_one": "购物车中有 {{count}} 个商品", 
    "itemCount_other": "购物车中有 {{count}} 个商品"
  }
}

// 使用
t('cart.itemCount', { count: cartItems.length })
```

---

## 🚀 性能优化 {#performance}

### 1. **延迟加载翻译文件**
```typescript
// 按需加载翻译文件
const loadNamespaces = async (namespaces: string[]) => {
  await i18n.loadNamespaces(namespaces);
};

// 页面级别按需加载
useEffect(() => {
  loadNamespaces(['machines', 'common']);
}, []);
```

### 2. **翻译缓存策略**
```typescript
// 配置翻译缓存
i18n.init({
  // 缓存翻译资源
  saveMissing: false,
  saveMissingTo: 'fallback',
  
  // 缓存配置
  cache: {
    enabled: true,
    prefix: 'i18n_res_',
    expirationTime: 7 * 24 * 60 * 60 * 1000 // 7天
  }
});
```

### 3. **减少重复渲染**
```typescript
// ❌ 避免在渲染函数中频繁调用t()
const Component = () => {
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {t('fields.name')}: {item.name}  {/* 每次渲染都调用t() */}
        </div>
      ))}
    </div>
  );
};

// ✅ 提前获取翻译文本
const Component = () => {
  const nameLabel = t('fields.name');
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {nameLabel}: {item.name}
        </div>
      ))}
    </div>
  );
};
```

---

## 🐛 常见陷阱 {#common-pitfalls}

### 1. **避免字符串拼接**
```typescript
// ❌ 错误做法
const message = t('hello') + ', ' + t('world') + '!';

// ✅ 正确做法
// 翻译文件: { "greeting": "你好，{{target}}！" }
const message = t('greeting', { target: t('world') });
```

### 2. **避免在翻译key中使用变量**
```typescript
// ❌ 错误做法  
const key = `status.${currentStatus}`;
const statusText = t(key);

// ✅ 正确做法
const statusTexts = {
  active: t('status.active'),
  inactive: t('status.inactive')
};
const statusText = statusTexts[currentStatus];
```

### 3. **避免翻译文件循环依赖**
```typescript
// ❌ 错误做法 - a.json引用b.json，b.json又引用a.json

// ✅ 正确做法 - 提取公共内容到common.json
// common.json
{
  "shared": {
    "confirm": "确认",
    "cancel": "取消"
  }
}
```

### 4. **避免硬编码降级文本**
```typescript
// ❌ 错误做法
const text = t('some.key') || '默认文本';

// ✅ 正确做法
const text = t('some.key', { defaultValue: t('common.defaultText') });
```

### 5. **避免在useEffect中修改翻译**
```typescript
// ❌ 错误做法
useEffect(() => {
  i18n.changeLanguage('en'); // 可能导致无限循环
}, [someState]);

// ✅ 正确做法
const handleLanguageChange = useCallback((lang: string) => {
  i18n.changeLanguage(lang);
}, []);
```

---

## 📝 检查清单

### 开发阶段
- [ ] 翻译key使用语义化命名
- [ ] 避免硬编码文本
- [ ] 参数化动态内容
- [ ] 处理复数形式
- [ ] 添加适当的fallback

### 代码审查
- [ ] 检查翻译key的一致性
- [ ] 验证所有语言文件的完整性
- [ ] 确认没有遗漏的翻译
- [ ] 检查参数化翻译的正确性

### 上线前检查
- [ ] 多语言切换功能正常
- [ ] 所有页面翻译完整
- [ ] 错误信息正确显示
- [ ] 性能表现良好

---

**遵循这些最佳实践，可以构建出高质量、易维护的多语言应用！** 🌍 