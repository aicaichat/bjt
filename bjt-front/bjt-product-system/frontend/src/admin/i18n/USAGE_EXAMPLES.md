# 管理后台多语言使用示例

## 基础使用 (保持现有行为)

```typescript
// 现有代码完全不变，功能正常
<MultilingualInput
  value={formData.title}
  onChange={handleTitleChange}
  required={true}
/>
```

## 启用新功能 (可选)

```typescript
// 只需添加新属性，启用增强功能
<MultilingualInput
  value={formData.title}
  onChange={handleTitleChange}
  required={true}
  // 🆕 新功能
  enableI18nUI={true}        // 启用界面多语言
  showCopyButton={true}      // 启用复制功能
  showTranslateHint={true}   // 启用翻译提示
/>
```

## 在页面中使用界面多语言

```typescript
import { useAdminI18n } from '../../i18n/hooks/useAdminI18n';
import LanguageSwitch from '../../i18n/components/LanguageSwitch';

const MyPage: React.FC = () => {
  const { tc, tf } = useAdminI18n();

  return (
    <Card 
      title={tf('fields.name')}
      extra={<LanguageSwitch size="small" />}
    >
      <Button type="primary">
        {tc('actions.save')}
      </Button>
    </Card>
  );
};
```

## 回滚方案

如需回滚到原有状态：
1. 恢复备份文件: `cp MultilingualInput.tsx.backup MultilingualInput.tsx`
2. 删除新增目录: `rm -rf frontend/src/admin/i18n/ frontend/src/admin/contexts/`
