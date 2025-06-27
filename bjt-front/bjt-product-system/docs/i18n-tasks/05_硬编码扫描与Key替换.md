# 硬编码扫描与 Key 替换

⏱ 预计：0.5 人天

## 步骤
1. 运行 i18n-scanner
```bash
npm run i18n:extract      # 对应 tools/i18n-scanner 配置
```

2. 处理 `untranslated.csv`
   - 查看 `src/scripts/replace-i18n-keys.ts` 是否支持自动替换。
   - 对扫描出的硬编码文本批量替换为 `t('key')` 调用。

3. 提交 MR：
   - 说明替换的文件范围。
   - CI 通过后合并。

4. 再次执行 `npm run i18n:extract`，确认无新增硬编码。 