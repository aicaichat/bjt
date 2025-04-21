// 模拟产品数据
const PRODUCTS = [
  {
    id: 1,
    title: "数控车床 CNC6140",
    shortDescription: "高精度数控车床，适用于精密零件加工",
    description: "CNC6140是一款高性能数控车床，采用先进的控制系统和精密机械结构，可实现高精度、高效率的金属切削加工。配备自动换刀系统和多轴联动功能，适用于各类复杂零件的加工制造。",
    price: 158000,
    oldPrice: 178000,
    currency: "CNY",
    category: "machining",
    tags: ["车床", "数控", "金属加工"],
    specs: {
      "型号": "CNC6140",
      "控制系统": "FANUC 0i-TF",
      "最大回转直径": "400mm",
      "最大加工长度": "1000mm",
      "主轴转速": "50-4500rpm",
      "主轴电机功率": "11kW",
      "刀架形式": "电动刀塔",
      "刀位数": "8位",
      "定位精度": "0.008mm",
      "重复定位精度": "0.005mm",
      "机床重量": "约3200kg",
      "外形尺寸": "3200×1650×1800mm"
    },
    images: [
      "images/products/cnc6140-1.jpg",
      "images/products/cnc6140-2.jpg",
      "images/products/cnc6140-3.jpg",
      "images/products/cnc6140-4.jpg"
    ],
    featured: true,
    inStock: true,
    relatedProducts: [2, 5, 8]
  },
  {
    id: 2,
    title: "立式加工中心 VMC850",
    shortDescription: "高效立式加工中心，适用于模具制造",
    description: "VMC850立式加工中心采用高刚性铸件底座和精密线性导轨，配备高速主轴和快速换刀系统，可实现高效率、多工序加工。支持三轴联动，适用于模具、精密零件等复杂工件的加工。",
    price: 245000,
    currency: "CNY",
    category: "machining",
    tags: ["加工中心", "立式", "模具加工"],
    specs: {
      "型号": "VMC850",
      "控制系统": "SIEMENS 828D",
      "工作台尺寸": "1000×500mm",
      "X/Y/Z轴行程": "850/500/550mm",
      "主轴转速": "10000rpm",
      "主轴电机功率": "11kW",
      "刀库容量": "24把",
      "最大刀具重量": "7kg",
      "定位精度": "0.01mm",
      "重复定位精度": "0.005mm",
      "机床重量": "约5500kg",
      "外形尺寸": "2800×2200×2700mm"
    },
    images: [
      "images/products/vmc850-1.jpg",
      "images/products/vmc850-2.jpg",
      "images/products/vmc850-3.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [1, 3, 4]
  },
  {
    id: 3,
    title: "卧式加工中心 HMC630",
    shortDescription: "高性能卧式加工中心，提供卓越的加工能力",
    description: "HMC630卧式加工中心采用高刚性结构设计，配备高精度回转工作台和大容量刀库，实现四轴联动加工能力。适用于大型复杂零件的高效率加工，特别是需要多面加工的工件。",
    price: 385000,
    currency: "CNY",
    category: "machining",
    tags: ["加工中心", "卧式", "重型加工"],
    specs: {
      "型号": "HMC630",
      "控制系统": "FANUC 0i-MF",
      "工作台尺寸": "630×630mm",
      "X/Y/Z轴行程": "900/800/800mm",
      "工作台载重": "800kg",
      "主轴转速": "8000rpm",
      "主轴电机功率": "22kW",
      "刀库容量": "60把",
      "最大刀具直径": "125mm",
      "换刀时间": "2.5秒",
      "机床重量": "约12000kg",
      "外形尺寸": "4500×3800×3000mm"
    },
    images: [
      "images/products/hmc630-1.jpg",
      "images/products/hmc630-2.jpg",
      "images/products/hmc630-3.jpg"
    ],
    featured: true,
    inStock: true,
    relatedProducts: [2, 4, 5]
  },
  {
    id: 4,
    title: "数控铣床 XK7136",
    shortDescription: "经济型数控铣床，适合小批量生产",
    description: "XK7136数控铣床是一款经济型加工设备，采用台湾进口滚珠丝杠和线性导轨，配备国产数控系统，适合小型零件加工和教学使用。操作简单，维护成本低，是小型加工企业的理想选择。",
    price: 78000,
    oldPrice: 85000,
    currency: "CNY",
    category: "machining",
    tags: ["铣床", "数控", "教学设备"],
    specs: {
      "型号": "XK7136",
      "控制系统": "广州数控GSK980TDi",
      "工作台尺寸": "800×320mm",
      "X/Y/Z轴行程": "600/300/400mm",
      "主轴转速": "50-3500rpm",
      "主轴电机功率": "4kW",
      "刀柄规格": "BT40",
      "定位精度": "0.02mm",
      "重复定位精度": "0.01mm",
      "机床重量": "约1800kg",
      "外形尺寸": "2000×1700×2100mm"
    },
    images: [
      "images/products/xk7136-1.jpg",
      "images/products/xk7136-2.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [1, 2, 5]
  },
  {
    id: 5,
    title: "电火花成形机 D7150",
    shortDescription: "高精度电火花成形机，适用于模具加工",
    description: "D7150电火花成形机采用伺服控制系统和高精度C3级滚珠丝杠，加工精度高，表面质量好。配备先进的脉冲电源和自动寻边功能，适用于精密模具零件、复杂型腔等加工场合。",
    price: 168000,
    currency: "CNY",
    category: "edm",
    tags: ["电火花", "模具", "精密加工"],
    specs: {
      "型号": "D7150",
      "工作台尺寸": "600×400mm",
      "X/Y/Z轴行程": "500/350/350mm",
      "主轴行程": "200mm",
      "最大工件重量": "500kg",
      "电极重量": "≤100kg",
      "脉冲电源": "50A",
      "最小加工间隙": "0.01mm",
      "表面粗糙度": "Ra0.4μm",
      "机床重量": "约2800kg",
      "外形尺寸": "1800×1650×2200mm"
    },
    images: [
      "images/products/d7150-1.jpg",
      "images/products/d7150-2.jpg",
      "images/products/d7150-3.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [6, 7, 8]
  },
  {
    id: 6,
    title: "线切割机床 DK7763",
    shortDescription: "中走丝线切割机床，高精度多次切割",
    description: "DK7763中走丝线切割机床采用全闭环控制系统，配备进口高精度光栅尺，实现高精度加工。多次切割功能可获得极佳的表面光洁度，适用于复杂模具、精密零件的加工制造。",
    price: 198000,
    currency: "CNY",
    category: "edm",
    tags: ["线切割", "走丝", "精密模具"],
    specs: {
      "型号": "DK7763",
      "控制系统": "台湾F3100",
      "工作台尺寸": "630×500mm",
      "X/Y轴行程": "400×300mm",
      "U/V轴行程": "±32mm",
      "最大工件重量": "300kg",
      "最大工件厚度": "300mm",
      "定位精度": "0.005mm",
      "加工精度": "±0.008mm",
      "最小线径": "0.12mm",
      "机床重量": "约3000kg",
      "外形尺寸": "1800×1650×1800mm"
    },
    images: [
      "images/products/dk7763-1.jpg",
      "images/products/dk7763-2.jpg"
    ],
    featured: true,
    inStock: true,
    relatedProducts: [5, 7, 8]
  },
  {
    id: 7,
    title: "数控折弯机 WC67K-100T/3200",
    shortDescription: "液压数控折弯机，适用于金属板材加工",
    description: "WC67K-100T/3200数控折弯机采用电液同步控制系统，确保折弯精度和重复精度。配备高精度背档，可实现复杂工件的连续折弯。适用于各种金属板材的折弯加工，广泛应用于机箱机柜、电梯、车辆制造等领域。",
    price: 205000,
    currency: "CNY",
    category: "sheet",
    tags: ["折弯机", "数控", "板材加工"],
    specs: {
      "型号": "WC67K-100T/3200",
      "控制系统": "DA66T",
      "公称压力": "100吨",
      "工作台长度": "3200mm",
      "最大折弯厚度": "6mm(不锈钢)",
      "最大折弯角度": "135°",
      "行程": "200mm",
      "开口高度": "400mm",
      "主电机功率": "7.5kW",
      "油箱容量": "220L",
      "机床重量": "约7500kg",
      "外形尺寸": "3400×1650×2200mm"
    },
    images: [
      "images/products/wc67k-1.jpg",
      "images/products/wc67k-2.jpg",
      "images/products/wc67k-3.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [8, 9, 10]
  },
  {
    id: 8,
    title: "数控剪板机 QC12K-8×3200",
    shortDescription: "液压摆式数控剪板机，高效精准",
    description: "QC12K-8×3200数控剪板机采用液压传动，摆式剪切，确保剪切质量和精度。配备先进的数控系统和光电保护装置，操作安全便捷。适用于各种金属板材的精确剪切，是钣金加工的理想设备。",
    price: 165000,
    oldPrice: 185000,
    currency: "CNY",
    category: "sheet",
    tags: ["剪板机", "数控", "板材加工"],
    specs: {
      "型号": "QC12K-8×3200",
      "控制系统": "E21S",
      "最大剪切厚度": "8mm(碳钢)",
      "最大剪切长度": "3200mm",
      "剪切角度": "0.5°-2.5°",
      "剪切次数": "12次/分钟",
      "后档行程": "20-750mm",
      "主电机功率": "11kW",
      "工作台高度": "800mm",
      "机床重量": "约6800kg",
      "外形尺寸": "3900×1800×1500mm"
    },
    images: [
      "images/products/qc12k-1.jpg",
      "images/products/qc12k-2.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [7, 9, 10]
  },
  {
    id: 9,
    title: "激光切割机 TQL-3015",
    shortDescription: "光纤激光切割机，高效低耗能",
    description: "TQL-3015光纤激光切割机采用进口光纤激光器和高精度传动系统，切割速度快，精度高，能耗低。适用于碳钢、不锈钢、铝合金等多种金属材料的切割加工，广泛应用于汽车制造、机械加工、广告制作等行业。",
    price: 410000,
    currency: "CNY",
    category: "laser",
    tags: ["激光", "切割", "光纤"],
    specs: {
      "型号": "TQL-3015",
      "激光类型": "光纤激光器",
      "激光功率": "2000W",
      "工作幅面": "3000×1500mm",
      "最大切割速度": "35m/min",
      "定位精度": "±0.05mm",
      "重复定位精度": "±0.03mm",
      "最大切割厚度": "碳钢16mm/不锈钢8mm/铝合金6mm",
      "冷却方式": "水冷",
      "功耗": "约15kW",
      "外形尺寸": "4500×2500×1800mm"
    },
    images: [
      "images/products/tql3015-1.jpg",
      "images/products/tql3015-2.jpg",
      "images/products/tql3015-3.jpg"
    ],
    featured: true,
    inStock: true,
    relatedProducts: [7, 8, 10]
  },
  {
    id: 10,
    title: "数控等离子切割机 HPNC-3000",
    shortDescription: "高精度数控等离子切割机，适合厚板切割",
    description: "HPNC-3000数控等离子切割机采用精密导轨和齿轮齿条传动，配备高功率等离子电源，能够切割各种金属材料，特别适合中厚板材的切割。配备自动调高系统和穿孔检测功能，切割质量稳定可靠。",
    price: 125000,
    currency: "CNY",
    category: "plasma",
    tags: ["等离子", "切割", "厚板加工"],
    specs: {
      "型号": "HPNC-3000",
      "控制系统": "起重F2100B",
      "切割范围": "3000×1500mm",
      "等离子电源": "美国海宝65A",
      "最大切割厚度": "22mm(碳钢)",
      "最高切割速度": "12m/min",
      "定位精度": "±0.1mm",
      "火焰切割头": "1套(选配)",
      "自动调高": "电容调高",
      "传动方式": "齿轮齿条",
      "机床重量": "约2200kg",
      "外形尺寸": "4200×2100×1500mm"
    },
    images: [
      "images/products/hpnc3000-1.jpg",
      "images/products/hpnc3000-2.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [7, 8, 9]
  },
  {
    id: 11,
    title: "自动焊接机器人 KR-10",
    shortDescription: "六轴工业焊接机器人，高效自动化焊接",
    description: "KR-10工业焊接机器人采用六轴设计，运动灵活，焊接精度高。配备先进的离线编程软件和碰撞检测功能，操作安全可靠。适用于汽车零部件、机械设备等领域的自动化焊接，大幅提高生产效率和焊接质量。",
    price: 350000,
    currency: "CNY",
    category: "welding",
    tags: ["焊接", "机器人", "自动化"],
    specs: {
      "型号": "KR-10",
      "控制系统": "KRC4",
      "轴数": "6轴",
      "最大负载": "10kg",
      "工作半径": "1420mm",
      "重复定位精度": "±0.05mm",
      "工作温度": "5°C-45°C",
      "防护等级": "IP54",
      "焊接电源": "500A",
      "编程方式": "示教盒/离线编程",
      "机器人重量": "约670kg",
      "外形尺寸": "焊接系统约3000×2500×2200mm"
    },
    images: [
      "images/products/kr10-1.jpg",
      "images/products/kr10-2.jpg",
      "images/products/kr10-3.jpg"
    ],
    featured: true,
    inStock: false,
    relatedProducts: [12, 13, 14]
  },
  {
    id: 12,
    title: "数控冲床 HPE-30",
    shortDescription: "高性能数控转塔冲床，多工位加工",
    description: "HPE-30数控转塔冲床采用伺服电机驱动，转塔设计，可实现多工位快速切换。配备自动定位系统和材料夹持装置，加工精度高，生产效率大幅提升。适用于各种金属板材的冲孔、成形加工。",
    price: 320000,
    currency: "CNY",
    category: "sheet",
    tags: ["冲床", "数控", "多工位"],
    specs: {
      "型号": "HPE-30",
      "控制系统": "FANUC 0i-PF",
      "冲压力": "300kN",
      "工作范围": "1250×2500mm",
      "工作台高度": "900mm",
      "冲头行程": "8-80mm可调",
      "冲压速度": "最高600次/分钟",
      "工位数": "32工位",
      "最大板厚": "6.35mm",
      "定位精度": "±0.1mm",
      "重复定位精度": "±0.05mm",
      "机床重量": "约12000kg",
      "外形尺寸": "5600×4800×2150mm"
    },
    images: [
      "images/products/hpe30-1.jpg",
      "images/products/hpe30-2.jpg"
    ],
    featured: false,
    inStock: true,
    relatedProducts: [7, 8, 10]
  }
];

// 模拟类别数据
const CATEGORIES = [
  {
    id: "all",
    name: "全部产品",
    description: "浏览所有机械设备产品"
  },
  {
    id: "machining",
    name: "机床加工",
    description: "包括数控车床、铣床、加工中心等金属切削设备"
  },
  {
    id: "edm",
    name: "电加工设备",
    description: "包括电火花成形机、线切割等特种加工设备"
  },
  {
    id: "sheet",
    name: "钣金设备",
    description: "包括剪板机、折弯机、冲床等板材加工设备"
  },
  {
    id: "laser",
    name: "激光加工",
    description: "包括激光切割机、激光焊接等设备"
  },
  {
    id: "plasma",
    name: "等离子切割",
    description: "包括各种等离子切割设备"
  },
  {
    id: "welding",
    name: "焊接设备",
    description: "包括焊接机器人、自动焊接系统等"
  }
];

// 模拟用户评论数据
const REVIEWS = [
  {
    id: 1,
    productId: 1,
    userId: 2,
    username: "张工",
    rating: 5,
    title: "性价比超高的数控车床",
    content: "购买这台CNC6140已经使用了半年，精度稳定，操作简单，维护成本低，加工效率提高了30%以上。非常满意这次购买。",
    date: "2023-09-15",
    verified: true
  },
  {
    id: 2,
    productId: 1,
    userId: 5,
    username: "李经理",
    rating: 4,
    title: "质量不错，售后有待提高",
    content: "设备本身质量不错，精度和稳定性都很好。但安装调试时遇到一些问题，售后响应不够及时。总体来说还是值得推荐的产品。",
    date: "2023-08-22",
    verified: true
  },
  {
    id: 3,
    productId: 2,
    userId: 3,
    username: "王师傅",
    rating: 5,
    title: "加工中心性能优异",
    content: "VMC850加工中心运行平稳，精度高，尤其是在模具加工方面表现出色。刀库容量足够日常使用，换刀速度快，大大提高了我们的生产效率。",
    date: "2023-10-05",
    verified: true
  },
  {
    id: 4,
    productId: 9,
    userId: 7,
    username: "刘总",
    rating: 5,
    title: "激光切割机表现优异",
    content: "TQL-3015激光切割机购买半年多了，切割精度和速度都很满意，特别是对不锈钢的切割效果非常好，边缘光滑，几乎不需要后续处理。设备稳定性也很好，推荐购买。",
    date: "2023-11-12",
    verified: true
  }
];

// 导出数据
const data = {
  products: PRODUCTS,
  categories: CATEGORIES,
  reviews: REVIEWS
};

export default data; 