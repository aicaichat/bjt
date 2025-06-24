import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';
import jaTranslation from './locales/ja.json';

// 导入各页面的翻译文件
import enConsumables from './locales/en/consumables.json';
import zhConsumables from './locales/zh/consumables.json';
import jaConsumables from './locales/ja/consumables.json';
import enOrderList from './locales/en/orderList.json';
import zhOrderList from './locales/zh/orderList.json';
import jaOrderList from './locales/ja/orderList.json';
import enPO from './locales/en/po.json';
import zhPO from './locales/zh/po.json';
import jaPO from './locales/ja/po.json';
import enSpareParts from './locales/en/spareParts.json';
import zhSpareParts from './locales/zh/spareParts.json';
import jaSpareParts from './locales/ja/spareParts.json';
import enHome from './locales/en/home.json';
import zhHome from './locales/zh/home.json';
import jaHome from './locales/ja/home.json';
import enMachines from './locales/en/machines.json';
import zhMachines from './locales/zh/machines.json';
import jaMachines from './locales/ja/machines.json';
import enProducts from './locales/en/products.json';
import zhProducts from './locales/zh/products.json';
import jaProducts from './locales/ja/products.json';
import enCart from './locales/en/cart.json';
import zhCart from './locales/zh/cart.json';
import enOrder from './locales/en/order.json';
import zhOrder from './locales/zh/order.json';
import enLogin from './locales/en/login.json';
import zhLogin from './locales/zh/login.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
        consumables: enConsumables,
        orderList: enOrderList,
        po: enPO,
        spareParts: enSpareParts,
        home: enHome,
        machines: enMachines,
        products: enProducts,
        cart: enCart,
        order: enOrder,
        login: enLogin
      },
      zh: {
        translation: zhTranslation,
        consumables: zhConsumables,
        orderList: zhOrderList,
        po: zhPO,
        spareParts: zhSpareParts,
        home: zhHome,
        machines: zhMachines,
        products: zhProducts,
        cart: zhCart,
        order: zhOrder,
        login: zhLogin
      },
      ja: {
        translation: jaTranslation,
        consumables: jaConsumables,
        orderList: jaOrderList,
        po: jaPO,
        spareParts: jaSpareParts,
        home: jaHome,
        machines: jaMachines,
        products: jaProducts
      }
    },
    lng: 'zh', // 设置默认语言为中文
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    keySeparator: '.',
    nsSeparator: false,
    returnObjects: true, // Allow returning objects for nested translations
    defaultNS: 'translation',
    ns: ['translation', 'home', 'consumables', 'orderList', 'po', 'spareParts', 'machines', 'products', 'cart', 'order', 'login'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18n;