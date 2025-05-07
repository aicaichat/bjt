# Internationalization (i18n) Guide

This guide explains how to use the translation system in the BJT Frontend application.

## Basic Usage

The application uses `react-i18next` for translations. There are two main ways to use translations in components:

### 1. Using the `useTranslation` hook (Recommended)

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  // 使用默认命名空间
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('home')}</h1>  // 使用通用翻译
    </div>
  );
};
```

### 2. 使用特定命名空间的翻译

```tsx
import { useTranslation } from 'react-i18next';

const OrderListPage = () => {
  // 指定 'orderList' 命名空间
  const { t } = useTranslation('orderList');
  
  return (
    <div>
      <h1>{t('title')}</h1>  // 访问orderList命名空间下的title
      <p>{t('loading')}</p>  // 访问orderList命名空间下的loading
    </div>
  );
};
```

### 3. 使用自定义 `useLanguage` 钩子

```tsx
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      {/* 访问默认命名空间中的翻译 */}
      <h1>{t('home')}</h1>
      
      {/* 访问特定命名空间中的翻译 */}
      <h2>{t('orderList:title')}</h2>
      
      <p>Current language: {language}</p>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('cn')}>中文</button>
    </div>
  );
};
```

## Translation Files Structure

Translations are organized in the following structure:

```
src/i18n/
  ├── index.ts                # i18n配置
  ├── locales/
  │   ├── en.json             # 通用英文翻译
  │   ├── zh.json             # 通用中文翻译
  │   ├── en/                 # 特定功能的英文翻译
  │   │   ├── consumables.json
  │   │   ├── orderList.json
  │   │   └── ...
  │   └── zh/                 # 特定功能的中文翻译
  │       ├── consumables.json
  │       ├── orderList.json
  │       └── ...
```

## Adding New Translations

1. 在`src/i18n/locales/[lang]/[feature].json`中创建不同语言的翻译文件
2. 在`src/i18n/index.ts`中导入并注册这些文件
3. 在组件中使用翻译键访问翻译

## 重要提示：命名空间的使用

当使用命名空间时，按照以下方式访问翻译：

```tsx
// 1. 指定命名空间方式
const { t } = useTranslation('orderList');
t('title');  // 访问orderList命名空间下的title

// 2. 不指定命名空间，使用完整路径方式
const { t } = useTranslation();
t('orderList:title');  // 使用命名空间前缀访问
```

## Dynamic Values and Interpolation

可以在翻译中包含变量：

```tsx
// 在翻译文件中:
// "welcomeMessage": "Hello, {{name}}!"

// 在组件中:
const { t } = useTranslation();
const username = "John";

return <p>{t('welcomeMessage', { name: username })}</p>;
// 渲染结果: "Hello, John!"
```

## Pluralization

对于复数形式，使用count参数：

```tsx
// 在翻译文件中:
// "itemCount": "{{count}} item",
// "itemCount_plural": "{{count}} items"

// 在组件中:
const { t } = useTranslation();
const count = 5;

return <p>{t('itemCount', { count })}</p>;
// 渲染结果: "5 items"
```

## Changing Language

更改当前语言：

```tsx
// 使用useTranslation
const { i18n } = useTranslation();
i18n.changeLanguage('zh');

// 或使用自定义钩子
const { setLanguage } = useLanguage();
setLanguage('cn');
```

## Best Practices

1. 使用有意义的键层次结构，如`feature.section.item`（例如status.pending）
2. 按功能组织翻译文件
3. 在所有语言文件中使用相同的翻译键结构
4. 在翻译文件中添加注释，为翻译人员提供上下文
5. 始终为缺失的翻译提供后备文本 