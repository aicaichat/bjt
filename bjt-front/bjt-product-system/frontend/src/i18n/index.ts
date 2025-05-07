import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// 导入各页面的翻译文件
import enConsumables from './locales/en/consumables.json';
import zhConsumables from './locales/zh/consumables.json';
import enOrderList from './locales/en/orderList.json';
import zhOrderList from './locales/zh/orderList.json';
import enPO from './locales/en/po.json';
import zhPO from './locales/zh/po.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
        consumables: enConsumables,
        orderList: enOrderList,
        po: enPO
      },
      zh: {
        translation: zhTranslation,
        consumables: zhConsumables,
        orderList: zhOrderList,
        po: zhPO
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    keySeparator: '.',
    nsSeparator: false,
    returnObjects: true // 允许返回对象类型的翻译
  });

export default i18n;