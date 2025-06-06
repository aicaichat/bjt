import { useTranslation } from 'react-i18next';
import { useAdminI18nContext } from '../components/AdminI18nProvider';

export const useAdminI18n = () => {
  const context = useAdminI18nContext();
  const { t, i18n } = useTranslation(['common', 'forms', 'accessories', 'spare-parts', 'machines', 'consumables']);

  // 通用翻译函数 - 支持accessories:xxx、forms:xxx、common:xxx
  const tc = (key: string, options?: any) => {
    try {
      // 如果key已经包含命名空间前缀，直接使用
      if (key.includes(':')) {
        return t(key, options) || key;
      }
      // 否则添加common前缀
      return t(`common.${key}`, options) || key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  };

  // 表单翻译函数 - 从forms命名空间
  const tf = (key: string, options?: any) => {
    try {
      // 如果key已经包含命名空间前缀，直接使用
      if (key.includes(':')) {
        return t(key, options) || key;
      }
      // 否则添加forms前缀，但不要重复添加forms.前缀
      const translationKey = key.startsWith('forms.') ? key : `forms.${key}`;
      return t(translationKey, options) || key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  };

  // 当前语言
  const language = context?.language || i18n.language || 'zh';

  // 切换语言
  const changeLanguage = async (lang: string) => {
    if (context?.changeLanguage) {
      await context.changeLanguage(lang);
    } else {
      await i18n.changeLanguage(lang);
    }
  };

  return {
    tc,
    tf,
    t, // 原始翻译函数
    language,
    changeLanguage,
    i18n,
    isReady: context?.isReady ?? true,
  };
};

export const useLanguage = () => {
  const context = useAdminI18nContext();
  
  return {
    language: context.language,
    changeLanguage: context.changeLanguage,
    isReady: context.isReady,
  };
};
