# API默认语言修改说明

## 🎯 问题描述

用户反馈在英文环境下，购物车页面仍然显示中文产品名称。经过分析发现，前端API请求的默认语言参数设置为中文。

## 🔍 问题定位

### 前端语言设置问题
1. **base.service.ts** 中 `addCommonParams` 函数默认语言为 `'zh'`
2. **i18n/index.ts** 中 i18next 配置默认语言为 `'zh'`

这导致即使在英文环境下，API请求仍然发送 `{"lang":"zh"}` 参数。

## 🛠️ 解决方案

### 1. 修改API服务默认语言

**文件**: `frontend/src/api/services/base.service.ts`

```typescript
// 修改前
let currentLang = 'zh'; // 默认中文
const i18nextLang = localStorage.getItem('i18nextLng') || 'zh';
const docLang = document.documentElement.lang || 'zh';

// 修改后  
let currentLang = 'en'; // 默认英文
const i18nextLang = localStorage.getItem('i18nextLng') || 'en';
const docLang = document.documentElement.lang || 'en';
```

### 2. 修改i18n配置默认语言

**文件**: `frontend/src/i18n/index.ts`

```typescript
// 修改前
lng: 'zh', // 设置默认语言为中文
fallbackLng: 'en',

// 修改后
lng: 'en', // 设置默认语言为英文
fallbackLng: 'zh',
```

## 📊 修改效果

### API请求语言参数
- **修改前**: `{"lang":"zh"}` (默认中文)
- **修改后**: `{"lang":"en"}` (默认英文)

### 购物车产品名称显示
- **中文环境**: 仍然正常显示中文名称
- **英文环境**: 现在显示英文名称

## 🔄 语言切换逻辑

### 优先级顺序
1. **用户手动设置**: localStorage中的 `i18nextLng` 值
2. **浏览器语言**: `document.documentElement.lang` 
3. **系统默认**: 英文 (`'en'`)

### 语言检测规则
```typescript
// 如果localStorage或浏览器语言以'zh'开头，使用中文
currentLang = i18nextLang.startsWith('zh') ? 'zh' : 'en';
```

## ✅ 验证结果

### 测试场景
| 场景 | localStorage | 浏览器语言 | API参数 | 产品名称 |
|------|-------------|-----------|---------|----------|
| 默认情况 | 无 | 无 | `lang=en` | 英文 |
| 中文用户 | `zh` | `zh-CN` | `lang=zh` | 中文 |
| 英文用户 | `en` | `en-US` | `lang=en` | 英文 |

### 后端处理
- **中文请求** (`lang=zh`): 返回 `name_zh` 字段
- **英文请求** (`lang=en`): 返回英文名称或生成英文标题

## 🎯 用户体验改进

### ✅ 改进点
- 英文环境下默认显示英文产品名称
- 保持中文用户的正常使用体验
- 支持用户手动切换语言
- API请求语言参数与界面语言保持一致

### 🔄 向后兼容
- 不影响现有中文用户的使用
- 语言切换功能正常工作
- 所有现有功能保持不变

## 📝 注意事项

1. **清除缓存**: 用户可能需要清除浏览器缓存以应用新的默认设置
2. **语言持久化**: 用户的语言选择会保存在localStorage中
3. **服务器重启**: 前端开发服务器需要重启以应用配置更改

## ✅ 解决状态

- ✅ API请求默认使用英文语言参数
- ✅ 英文环境下显示英文产品标题  
- ✅ 中文环境下保持中文显示
- ✅ 语言切换功能正常工作
- ✅ 向后兼容性良好

**问题已解决**: 购物车页面现在在英文环境下默认显示英文产品名称。 