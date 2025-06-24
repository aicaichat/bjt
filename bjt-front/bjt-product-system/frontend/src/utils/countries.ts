// 完整的国家列表数据
export interface Country {
  code: string;
  name_zh: string;
  name_en: string;
  name_ja?: string;
}

// 按字母顺序排列的完整国家列表
export const countries: Country[] = [
  { code: 'AF', name_zh: '阿富汗', name_en: 'Afghanistan' },
  { code: 'AL', name_zh: '阿尔巴尼亚', name_en: 'Albania' },
  { code: 'DZ', name_zh: '阿尔及利亚', name_en: 'Algeria' },
  { code: 'AD', name_zh: '安道尔', name_en: 'Andorra' },
  { code: 'AO', name_zh: '安哥拉', name_en: 'Angola' },
  { code: 'AG', name_zh: '安提瓜和巴布达', name_en: 'Antigua and Barbuda' },
  { code: 'AR', name_zh: '阿根廷', name_en: 'Argentina' },
  { code: 'AM', name_zh: '亚美尼亚', name_en: 'Armenia' },
  { code: 'AU', name_zh: '澳大利亚', name_en: 'Australia' },
  { code: 'AT', name_zh: '奥地利', name_en: 'Austria' },
  { code: 'AZ', name_zh: '阿塞拜疆', name_en: 'Azerbaijan' },
  { code: 'BS', name_zh: '巴哈马', name_en: 'Bahamas' },
  { code: 'BH', name_zh: '巴林', name_en: 'Bahrain' },
  { code: 'BD', name_zh: '孟加拉国', name_en: 'Bangladesh' },
  { code: 'BB', name_zh: '巴巴多斯', name_en: 'Barbados' },
  { code: 'BY', name_zh: '白俄罗斯', name_en: 'Belarus' },
  { code: 'BE', name_zh: '比利时', name_en: 'Belgium' },
  { code: 'BZ', name_zh: '伯利兹', name_en: 'Belize' },
  { code: 'BJ', name_zh: '贝宁', name_en: 'Benin' },
  { code: 'BT', name_zh: '不丹', name_en: 'Bhutan' },
  { code: 'BO', name_zh: '玻利维亚', name_en: 'Bolivia' },
  { code: 'BA', name_zh: '波斯尼亚和黑塞哥维那', name_en: 'Bosnia and Herzegovina' },
  { code: 'BW', name_zh: '博茨瓦纳', name_en: 'Botswana' },
  { code: 'BR', name_zh: '巴西', name_en: 'Brazil' },
  { code: 'BN', name_zh: '文莱', name_en: 'Brunei' },
  { code: 'BG', name_zh: '保加利亚', name_en: 'Bulgaria' },
  { code: 'BF', name_zh: '布基纳法索', name_en: 'Burkina Faso' },
  { code: 'BI', name_zh: '布隆迪', name_en: 'Burundi' },
  { code: 'KH', name_zh: '柬埔寨', name_en: 'Cambodia' },
  { code: 'CM', name_zh: '喀麦隆', name_en: 'Cameroon' },
  { code: 'CA', name_zh: '加拿大', name_en: 'Canada' },
  { code: 'CV', name_zh: '佛得角', name_en: 'Cape Verde' },
  { code: 'CF', name_zh: '中非共和国', name_en: 'Central African Republic' },
  { code: 'TD', name_zh: '乍得', name_en: 'Chad' },
  { code: 'CL', name_zh: '智利', name_en: 'Chile' },
  { code: 'CN', name_zh: '中国', name_en: 'China' },
  { code: 'CO', name_zh: '哥伦比亚', name_en: 'Colombia' },
  { code: 'KM', name_zh: '科摩罗', name_en: 'Comoros' },
  { code: 'CG', name_zh: '刚果共和国', name_en: 'Congo' },
  { code: 'CD', name_zh: '刚果民主共和国', name_en: 'Congo, Democratic Republic' },
  { code: 'CR', name_zh: '哥斯达黎加', name_en: 'Costa Rica' },
  { code: 'CI', name_zh: '科特迪瓦', name_en: 'Côte d\'Ivoire' },
  { code: 'HR', name_zh: '克罗地亚', name_en: 'Croatia' },
  { code: 'CU', name_zh: '古巴', name_en: 'Cuba' },
  { code: 'CY', name_zh: '塞浦路斯', name_en: 'Cyprus' },
  { code: 'CZ', name_zh: '捷克共和国', name_en: 'Czech Republic' },
  { code: 'DK', name_zh: '丹麦', name_en: 'Denmark' },
  { code: 'DJ', name_zh: '吉布提', name_en: 'Djibouti' },
  { code: 'DM', name_zh: '多米尼克', name_en: 'Dominica' },
  { code: 'DO', name_zh: '多米尼加共和国', name_en: 'Dominican Republic' },
  { code: 'EC', name_zh: '厄瓜多尔', name_en: 'Ecuador' },
  { code: 'EG', name_zh: '埃及', name_en: 'Egypt' },
  { code: 'SV', name_zh: '萨尔瓦多', name_en: 'El Salvador' },
  { code: 'GQ', name_zh: '赤道几内亚', name_en: 'Equatorial Guinea' },
  { code: 'ER', name_zh: '厄立特里亚', name_en: 'Eritrea' },
  { code: 'EE', name_zh: '爱沙尼亚', name_en: 'Estonia' },
  { code: 'ET', name_zh: '埃塞俄比亚', name_en: 'Ethiopia' },
  { code: 'FJ', name_zh: '斐济', name_en: 'Fiji' },
  { code: 'FI', name_zh: '芬兰', name_en: 'Finland' },
  { code: 'FR', name_zh: '法国', name_en: 'France' },
  { code: 'GA', name_zh: '加蓬', name_en: 'Gabon' },
  { code: 'GM', name_zh: '冈比亚', name_en: 'Gambia' },
  { code: 'GE', name_zh: '格鲁吉亚', name_en: 'Georgia' },
  { code: 'DE', name_zh: '德国', name_en: 'Germany' },
  { code: 'GH', name_zh: '加纳', name_en: 'Ghana' },
  { code: 'GR', name_zh: '希腊', name_en: 'Greece' },
  { code: 'GD', name_zh: '格林纳达', name_en: 'Grenada' },
  { code: 'GT', name_zh: '危地马拉', name_en: 'Guatemala' },
  { code: 'GN', name_zh: '几内亚', name_en: 'Guinea' },
  { code: 'GW', name_zh: '几内亚比绍', name_en: 'Guinea-Bissau' },
  { code: 'GY', name_zh: '圭亚那', name_en: 'Guyana' },
  { code: 'HT', name_zh: '海地', name_en: 'Haiti' },
  { code: 'HN', name_zh: '洪都拉斯', name_en: 'Honduras' },
  { code: 'HU', name_zh: '匈牙利', name_en: 'Hungary' },
  { code: 'IS', name_zh: '冰岛', name_en: 'Iceland' },
  { code: 'IN', name_zh: '印度', name_en: 'India' },
  { code: 'ID', name_zh: '印度尼西亚', name_en: 'Indonesia' },
  { code: 'IR', name_zh: '伊朗', name_en: 'Iran' },
  { code: 'IQ', name_zh: '伊拉克', name_en: 'Iraq' },
  { code: 'IE', name_zh: '爱尔兰', name_en: 'Ireland' },
  { code: 'IL', name_zh: '以色列', name_en: 'Israel' },
  { code: 'IT', name_zh: '意大利', name_en: 'Italy' },
  { code: 'JM', name_zh: '牙买加', name_en: 'Jamaica' },
  { code: 'JP', name_zh: '日本', name_en: 'Japan' },
  { code: 'JO', name_zh: '约旦', name_en: 'Jordan' },
  { code: 'KZ', name_zh: '哈萨克斯坦', name_en: 'Kazakhstan' },
  { code: 'KE', name_zh: '肯尼亚', name_en: 'Kenya' },
  { code: 'KI', name_zh: '基里巴斯', name_en: 'Kiribati' },
  { code: 'KP', name_zh: '朝鲜', name_en: 'North Korea' },
  { code: 'KR', name_zh: '韩国', name_en: 'South Korea' },
  { code: 'KW', name_zh: '科威特', name_en: 'Kuwait' },
  { code: 'KG', name_zh: '吉尔吉斯斯坦', name_en: 'Kyrgyzstan' },
  { code: 'LA', name_zh: '老挝', name_en: 'Laos' },
  { code: 'LV', name_zh: '拉脱维亚', name_en: 'Latvia' },
  { code: 'LB', name_zh: '黎巴嫩', name_en: 'Lebanon' },
  { code: 'LS', name_zh: '莱索托', name_en: 'Lesotho' },
  { code: 'LR', name_zh: '利比里亚', name_en: 'Liberia' },
  { code: 'LY', name_zh: '利比亚', name_en: 'Libya' },
  { code: 'LI', name_zh: '列支敦士登', name_en: 'Liechtenstein' },
  { code: 'LT', name_zh: '立陶宛', name_en: 'Lithuania' },
  { code: 'LU', name_zh: '卢森堡', name_en: 'Luxembourg' },
  { code: 'MG', name_zh: '马达加斯加', name_en: 'Madagascar' },
  { code: 'MW', name_zh: '马拉维', name_en: 'Malawi' },
  { code: 'MY', name_zh: '马来西亚', name_en: 'Malaysia' },
  { code: 'MV', name_zh: '马尔代夫', name_en: 'Maldives' },
  { code: 'ML', name_zh: '马里', name_en: 'Mali' },
  { code: 'MT', name_zh: '马耳他', name_en: 'Malta' },
  { code: 'MH', name_zh: '马绍尔群岛', name_en: 'Marshall Islands' },
  { code: 'MR', name_zh: '毛里塔尼亚', name_en: 'Mauritania' },
  { code: 'MU', name_zh: '毛里求斯', name_en: 'Mauritius' },
  { code: 'MX', name_zh: '墨西哥', name_en: 'Mexico' },
  { code: 'FM', name_zh: '密克罗尼西亚', name_en: 'Micronesia' },
  { code: 'MD', name_zh: '摩尔多瓦', name_en: 'Moldova' },
  { code: 'MC', name_zh: '摩纳哥', name_en: 'Monaco' },
  { code: 'MN', name_zh: '蒙古', name_en: 'Mongolia' },
  { code: 'ME', name_zh: '黑山', name_en: 'Montenegro' },
  { code: 'MA', name_zh: '摩洛哥', name_en: 'Morocco' },
  { code: 'MZ', name_zh: '莫桑比克', name_en: 'Mozambique' },
  { code: 'MM', name_zh: '缅甸', name_en: 'Myanmar' },
  { code: 'NA', name_zh: '纳米比亚', name_en: 'Namibia' },
  { code: 'NR', name_zh: '瑙鲁', name_en: 'Nauru' },
  { code: 'NP', name_zh: '尼泊尔', name_en: 'Nepal' },
  { code: 'NL', name_zh: '荷兰', name_en: 'Netherlands' },
  { code: 'NZ', name_zh: '新西兰', name_en: 'New Zealand' },
  { code: 'NI', name_zh: '尼加拉瓜', name_en: 'Nicaragua' },
  { code: 'NE', name_zh: '尼日尔', name_en: 'Niger' },
  { code: 'NG', name_zh: '尼日利亚', name_en: 'Nigeria' },
  { code: 'NO', name_zh: '挪威', name_en: 'Norway' },
  { code: 'OM', name_zh: '阿曼', name_en: 'Oman' },
  { code: 'PK', name_zh: '巴基斯坦', name_en: 'Pakistan' },
  { code: 'PW', name_zh: '帕劳', name_en: 'Palau' },
  { code: 'PA', name_zh: '巴拿马', name_en: 'Panama' },
  { code: 'PG', name_zh: '巴布亚新几内亚', name_en: 'Papua New Guinea' },
  { code: 'PY', name_zh: '巴拉圭', name_en: 'Paraguay' },
  { code: 'PE', name_zh: '秘鲁', name_en: 'Peru' },
  { code: 'PH', name_zh: '菲律宾', name_en: 'Philippines' },
  { code: 'PL', name_zh: '波兰', name_en: 'Poland' },
  { code: 'PT', name_zh: '葡萄牙', name_en: 'Portugal' },
  { code: 'QA', name_zh: '卡塔尔', name_en: 'Qatar' },
  { code: 'RO', name_zh: '罗马尼亚', name_en: 'Romania' },
  { code: 'RU', name_zh: '俄罗斯', name_en: 'Russia' },
  { code: 'RW', name_zh: '卢旺达', name_en: 'Rwanda' },
  { code: 'KN', name_zh: '圣基茨和尼维斯', name_en: 'Saint Kitts and Nevis' },
  { code: 'LC', name_zh: '圣卢西亚', name_en: 'Saint Lucia' },
  { code: 'VC', name_zh: '圣文森特和格林纳丁斯', name_en: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name_zh: '萨摩亚', name_en: 'Samoa' },
  { code: 'SM', name_zh: '圣马力诺', name_en: 'San Marino' },
  { code: 'ST', name_zh: '圣多美和普林西比', name_en: 'São Tomé and Príncipe' },
  { code: 'SA', name_zh: '沙特阿拉伯', name_en: 'Saudi Arabia' },
  { code: 'SN', name_zh: '塞内加尔', name_en: 'Senegal' },
  { code: 'RS', name_zh: '塞尔维亚', name_en: 'Serbia' },
  { code: 'SC', name_zh: '塞舌尔', name_en: 'Seychelles' },
  { code: 'SL', name_zh: '塞拉利昂', name_en: 'Sierra Leone' },
  { code: 'SG', name_zh: '新加坡', name_en: 'Singapore' },
  { code: 'SK', name_zh: '斯洛伐克', name_en: 'Slovakia' },
  { code: 'SI', name_zh: '斯洛文尼亚', name_en: 'Slovenia' },
  { code: 'SB', name_zh: '所罗门群岛', name_en: 'Solomon Islands' },
  { code: 'SO', name_zh: '索马里', name_en: 'Somalia' },
  { code: 'ZA', name_zh: '南非', name_en: 'South Africa' },
  { code: 'SS', name_zh: '南苏丹', name_en: 'South Sudan' },
  { code: 'ES', name_zh: '西班牙', name_en: 'Spain' },
  { code: 'LK', name_zh: '斯里兰卡', name_en: 'Sri Lanka' },
  { code: 'SD', name_zh: '苏丹', name_en: 'Sudan' },
  { code: 'SR', name_zh: '苏里南', name_en: 'Suriname' },
  { code: 'SZ', name_zh: '斯威士兰', name_en: 'Eswatini' },
  { code: 'SE', name_zh: '瑞典', name_en: 'Sweden' },
  { code: 'CH', name_zh: '瑞士', name_en: 'Switzerland' },
  { code: 'SY', name_zh: '叙利亚', name_en: 'Syria' },
  { code: 'TW', name_zh: '台湾', name_en: 'Taiwan' },
  { code: 'TJ', name_zh: '塔吉克斯坦', name_en: 'Tajikistan' },
  { code: 'TZ', name_zh: '坦桑尼亚', name_en: 'Tanzania' },
  { code: 'TH', name_zh: '泰国', name_en: 'Thailand' },
  { code: 'TL', name_zh: '东帝汶', name_en: 'Timor-Leste' },
  { code: 'TG', name_zh: '多哥', name_en: 'Togo' },
  { code: 'TO', name_zh: '汤加', name_en: 'Tonga' },
  { code: 'TT', name_zh: '特立尼达和多巴哥', name_en: 'Trinidad and Tobago' },
  { code: 'TN', name_zh: '突尼斯', name_en: 'Tunisia' },
  { code: 'TR', name_zh: '土耳其', name_en: 'Turkey' },
  { code: 'TM', name_zh: '土库曼斯坦', name_en: 'Turkmenistan' },
  { code: 'TV', name_zh: '图瓦卢', name_en: 'Tuvalu' },
  { code: 'UG', name_zh: '乌干达', name_en: 'Uganda' },
  { code: 'UA', name_zh: '乌克兰', name_en: 'Ukraine' },
  { code: 'AE', name_zh: '阿联酋', name_en: 'United Arab Emirates' },
  { code: 'GB', name_zh: '英国', name_en: 'United Kingdom' },
  { code: 'US', name_zh: '美国', name_en: 'United States' },
  { code: 'UY', name_zh: '乌拉圭', name_en: 'Uruguay' },
  { code: 'UZ', name_zh: '乌兹别克斯坦', name_en: 'Uzbekistan' },
  { code: 'VU', name_zh: '瓦努阿图', name_en: 'Vanuatu' },
  { code: 'VA', name_zh: '梵蒂冈', name_en: 'Vatican City' },
  { code: 'VE', name_zh: '委内瑞拉', name_en: 'Venezuela' },
  { code: 'VN', name_zh: '越南', name_en: 'Vietnam' },
  { code: 'YE', name_zh: '也门', name_en: 'Yemen' },
  { code: 'ZM', name_zh: '赞比亚', name_en: 'Zambia' },
  { code: 'ZW', name_zh: '津巴布韦', name_en: 'Zimbabwe' }
];

// 根据语言获取国家名称
export const getCountryName = (countryCode: string, language: string = 'en'): string => {
  const country = countries.find(c => c.code === countryCode);
  if (!country) return countryCode;
  
  switch (language) {
    case 'zh':
    case 'zh-CN':
    case 'zh-TW':
      return country.name_zh;
    case 'ja':
    case 'ja-JP':
      return country.name_ja || country.name_en;
    default:
      return country.name_en;
  }
};

// 根据语言获取排序后的国家列表
export const getSortedCountries = (language: string = 'en'): Country[] => {
  return [...countries].sort((a, b) => {
    const nameA = getCountryName(a.code, language);
    const nameB = getCountryName(b.code, language);
    return nameA.localeCompare(nameB, language);
  });
};

// 根据国家代码获取国家对象
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

// 根据国家名称搜索国家
export const searchCountries = (query: string, language: string = 'en'): Country[] => {
  const lowerQuery = query.toLowerCase();
  return countries.filter(country => {
    const name = getCountryName(country.code, language).toLowerCase();
    const code = country.code.toLowerCase();
    return name.includes(lowerQuery) || code.includes(lowerQuery);
  });
}; 