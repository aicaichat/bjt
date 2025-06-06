import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入翻译资源
import zhCommon from './locales/zh/common.json';
import enCommon from './locales/en/common.json';
import zhForms from './locales/zh/forms.json';
import enForms from './locales/en/forms.json';
import zhAccessories from './locales/zh/accessories.json';
import enAccessories from './locales/en/accessories.json';
import zhSpareParts from './locales/zh/spare-parts.json';
import enSpareParts from './locales/en/spare-parts.json';
import zhMachines from './locales/zh/machines.json';
import enMachines from './locales/en/machines.json';
import zhConsumables from './locales/zh/consumables.json';
import enConsumables from './locales/en/consumables.json';
import relationsZh from './locales/zh/relations.json';
import relationsEn from './locales/en/relations.json';
import dictionaryZh from './locales/zh/dictionary.json';
import dictionaryEn from './locales/en/dictionary.json';
import navigationZh from './locales/zh/navigation.json';
import navigationEn from './locales/en/navigation.json';

// Import productLines from main i18n
import productLinesZh from '../../i18n/locales/zh/productLines.json';
import productLinesEn from '../../i18n/locales/en/productLines.json';

// 创建独立的admin i18n实例
const adminI18n = i18n.createInstance();

adminI18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: zhCommon,
        forms: zhForms,
        accessories: zhAccessories,
        'spare-parts': zhSpareParts,
        machines: zhMachines,
        consumables: zhConsumables,
        relations: relationsZh,
        dictionary: dictionaryZh,
        navigation: navigationZh,
        productLines: productLinesZh,
      },
      en: {
        common: enCommon,
        forms: enForms,
        accessories: enAccessories,
        'spare-parts': enSpareParts,
        machines: enMachines,
        consumables: enConsumables,
        relations: relationsEn,
        dictionary: dictionaryEn,
        navigation: navigationEn,
        productLines: productLinesEn,
      },
    },
    lng: 'zh', // 默认语言
    fallbackLng: 'zh',
    debug: process.env.NODE_ENV === 'development',
    
    // 独立的存储键
    saveMissing: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    // 确保实例独立
    defaultNS: 'common',
    ns: ['common', 'forms', 'accessories', 'spare-parts', 'machines', 'consumables', 'relations', 'dictionary', 'navigation'],
    
    // 防止与主应用i18n冲突
    keySeparator: '.',
    nsSeparator: '.',
    
    react: {
      useSuspense: false, // 关闭Suspense模式
    },
  });

export default adminI18n;
