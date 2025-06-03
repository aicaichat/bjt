import { useTranslation } from 'react-i18next';

const { t } = useTranslation('orders');

// 替换所有静态文本为t调用
// 例如：
// 将 <h1>订单列表</h1> 替换为 <h1>{t('orders:pageTitle')}</h1>
// 将 <span>订单号</span> 替换为 <span>{t('orders:tableHeaders.orderNumber')}</span>
// 将 <span>客户</span> 替换为 <span>{t('orders:tableHeaders.customer')}</span>
// 将 <span>日期</span> 替换为 <span>{t('orders:tableHeaders.date')}</span>
// 将 <span>状态</span> 替换为 <span>{t('orders:tableHeaders.status')}</span>
// 将 <span>金额</span> 替换为 <span>{t('orders:tableHeaders.amount')}</span>
// 将 <span>操作</span> 替换为 <span>{t('orders:tableHeaders.actions')}</span>
// 将 <span>无订单</span> 替换为 <span>{t('orders:noOrders')}</span>
// 将 <span>查看详情</span> 替换为 <span>{t('orders:viewDetails')}</span>
// 将 <span>编辑</span> 替换为 <span>{t('orders:edit')}</span>
// 将 <span>删除</span> 替换为 <span>{t('orders:delete')}</span>
// 将 <span>关闭</span> 替换为 <span>{t('orders:close')}</span> 