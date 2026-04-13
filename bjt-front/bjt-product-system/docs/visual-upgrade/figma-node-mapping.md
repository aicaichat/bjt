# Figma 节点映射表（实时获取）

> 更新时间: 2026-04-11
> 来源: Figma API (fileKey: QluTLuKXbauHIiCN8AZUGJ)

## 页面结构

| 页面 | Figma Page ID | 关键 Frame |
|------|---------------|------------|
| Page 1 | 0:1 | 基础组件 |
| **Page 2** | **2443:17459** | 所有主要页面 |

## 关键 Frame 节点映射

| 页面 | 路由 | Frame 名称 | Node ID | 尺寸 |
|------|------|------------|---------|------|
| Home | `/` | Home 主页页面 | 2679:24930 | 1920x1638 |
| Machines P1 | `/machines/product-line-1` | 气垫机器选型页面 | **2679:22612** | 1920x1599 |
| Machines P2 | `/machines/product-line-2` | 纸垫机器选型页面 | 2700:20514 | 1920x1359 |
| Machines P3 | `/machines/product-line-3` | 纸垫机器选型页面 | 2723:21749 | 1920x1385 |
| Consumables P1 | `/consumables` | Film options 膜产品选型页面 | 2679:22464 | 1920x2554 |
| Consumables P2 | `/consumables/product-line-2` | Paper options 纸耗材产品选型页面 | 2700:20416 | 1920x2114 |
| Consumables P3 | `/consumables/product-line-3` | Film options 纸耗材产品选型页面 | 2723:21652 | 1920x1482 |
| Spare Parts | `/spare-parts` | 气垫机备件页面 | 2679:22569 | 1920x1257 |
| Cart | `/cart` | Shopping Cart 当前购物车页面 | 2700:16715 | 1920x2565 |
| Order | `/orders` | 进入个人账户页面-打开完成的订单界面 | 2700:16877 | 1920x2374 |
| Profile | `/profile` | 个人账户页面 | 2700:16841 | 1920x459 |

## 壳层组件规格

### Header
| 属性 | 值 |
|------|-----|
| Node ID | 2679:22645 |
| 尺寸 | 1617x60 |
| 内部组件 | Frame 522 (271x32), Frame 17 (74x32), Frame 18 (95x32), Frame 753 (150x36) |

### Sidebar
| 属性 | 值 |
|------|-----|
| 宽度 | **303px** |
| 实例 | Frame 1013 (Machine Selection), 侧面导航栏 (Home) |
| 高度 | 自适应 (~853-875px) |

### 主内容区
| 属性 | 值 |
|------|-----|
| Frame ID | Frame 529 |
| 宽度 | **1617px** (1920 - 303) |
| 位置 | Sidebar 右侧 |

## 关键尺寸规范

```
总宽度: 1920px
├── Sidebar: 303px
└── 主内容区: 1617px

Header: 60px 高度
```

## 颜色提取

从 Figma 节点提取的原始颜色:
- 白色: `#ffffff`
- 主背景: `#f9fafb` (来自 site-wide.json)
- 强调色: `#00338d` (来自 site-wide.json)
