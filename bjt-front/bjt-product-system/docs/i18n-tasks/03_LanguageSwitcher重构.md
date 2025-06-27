# LanguageSwitcher 重构

⏱ 预计：0.5 人天

## 需求
- 下拉菜单列出 11 种语言，带国旗 Emoji
- 当前语言高亮
- 选择后调用 `i18n.changeLanguage(code)`

## 参考实现（Ant Design）
```tsx
const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ja', label: '日本語',  flag: '🇯🇵' },
  { code: 'ko', label: '한국어',  flag: '🇰🇷' },
  { code: 'fr', label: 'français',flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'italiano',flag: '🇮🇹' },
  { code: 'ru', label: 'русский', flag: '🇷🇺' },
  { code: 'pt', label: 'português',flag: '🇵🇹' },
  { code: 'th', label: 'ไทย',     flag: '🇹🇭' },
  { code: 'vi', label: 'tiếng việt',flag: '🇻🇳' },
];
```

## 步骤
1. 新建 `src/components/LanguageSwitcher.tsx`（若已存在则修改）。
2. 使用 UI 库 Dropdown 或自定义 `<select>`。
3. 去掉 Header 里硬编码的 zh/en 切换逻辑，替换为组件。
4. 手动测试：切换语言刷新后仍保持。 