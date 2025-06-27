# 脚本 auto-translate 实现

⏱ 预计：1 人天

## 目的
- 读取 `untranslated.csv`，把缺失 key 用机器翻译生成 10 种语言 JSON。
- 支持缓存，避免重复扣费。

## 技术选型
- 优先 OpenAI GPT-4o：价格低、支持 95+ 语言。
- 备选 DeepL / Google Cloud。

## 关键要点
1. **占位符保护**：正则 `/{{\s*\w+\s*}}|<\d+>|%[sd]/` 在翻译前后恢复。
2. **缓存**：SQLite `cache.db`，键 = `sha256(text+lang)`。
3. **输出**：写入 `src/i18n/locales/{lang}/{ns}.json`，并追加 `"__AUTO__": true` 标记。
4. **错误重试**：指数回退 + 日志。

## 伪代码
```ts
const csv = parseCSV('untranslated.csv');
for (const { key, zh, ns } of csv) {
  for (const lang of TARGET_LANGS) {
    const val = await getTranslation(zh, lang);
    writeJson(lang, ns, key, val);
  }
}
```

## 交付物
- `scripts/auto-translate.ts`
- `README` 内使用说明
- 单元测试：占位符不被破坏 