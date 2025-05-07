import React from 'react';
import { Table, Button, InputNumber, Tag, Spin } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { MachineProduct } from '../../types/machines';
import { useTranslation } from 'react-i18next';
import './MachineTable.css';

interface MachineTableProps {
  machines: MachineProduct[];
  loading: boolean;
  quantities: Record<string, number>;
  userRegion: string;
  selectedMachine: string;
  isSales: boolean;
  isVIP: boolean;
  handleQuantityChange: (productId: string, value: number) => void;
  handleAddToCart: (product: MachineProduct) => void;
  handleViewDetails: (machineId: string) => void;
  handleMachineSelection: (machineId: string) => void;
  formatPrice: (price: number) => string;
  getCurrencySymbol: (region: string) => string;
  getStockStatus: (amount: number) => { className: string; colorClass: string };
  getRegionInventory: (product: MachineProduct, region: string) => number;
}

const MachineTable: React.FC<MachineTableProps> = ({
  machines,
  loading,
  quantities,
  userRegion,
  selectedMachine,
  isSales,
  isVIP,
  handleQuantityChange,
  handleAddToCart,
  handleViewDetails,
  handleMachineSelection,
  formatPrice,
  getCurrencySymbol,
  getStockStatus,
  getRegionInventory
}) => {
  const { t } = useTranslation();
  
  const columns = [
    {
      title: t('machines.tableHeaders.index'),
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: t('machines.tableHeaders.model'),
      dataIndex: 'model',
      key: 'model',
      render: (text: string, record: MachineProduct) => (
        <div 
          className={`model-cell ${selectedMachine === record.id ? 'selected-machine' : ''}`}
          onClick={() => handleMachineSelection(record.id)}
          tabIndex={0}
          role="button"
          aria-pressed={selectedMachine === record.id}
          aria-label={`${t('machines.tableHeaders.model')}: ${text}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleMachineSelection(record.id);
              e.preventDefault();
            }
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: t('machines.tableHeaders.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('machines.tableHeaders.price'),
      dataIndex: 'prices',
      key: 'prices',
      render: (_: any, record: MachineProduct) => {
        // 根据用户角色和VIP状态显示不同价格
        let price = record.prices.base;
        if (isSales) {
          price = record.prices.tier1;
        }
        if (isVIP) {
          price = record.prices.vip;
        }

        return (
          <span className="price" aria-label={`${t('machines.tableHeaders.price')}: ${getCurrencySymbol(userRegion)}${formatPrice(price)}`}>
            {getCurrencySymbol(userRegion)}{formatPrice(price)}
          </span>
        );
      }
    },
    {
      title: t('machines.tableHeaders.inventory'),
      dataIndex: 'inventory',
      key: 'inventory',
      render: (_: any, record: MachineProduct) => {
        const inventory = getRegionInventory(record, userRegion);
        const status = getStockStatus(inventory);
        const stockLabel = inventory <= 0 
          ? t('machines.stock.outOfStock') 
          : inventory <= 5 
            ? t('machines.stock.lowStock')
            : inventory <= 20
              ? t('machines.stock.mediumStock')
              : t('machines.stock.highStock');
        
        return (
          <div className={`inventory ${status.colorClass}`}>
            <span 
              className={status.className}
              aria-label={`${t('machines.tableHeaders.inventory')}: ${inventory <= 0 ? t('machines.stock.outOfStock') : inventory}, ${stockLabel}`}
            >
              {inventory <= 0 ? t('machines.stock.outOfStock') : inventory}
            </span>
          </div>
        );
      }
    },
    {
      title: t('machines.tableHeaders.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: MachineProduct) => (
        <InputNumber
          min={1}
          max={getRegionInventory(record, userRegion)}
          value={quantities[record.id] || 1}
          onChange={(value) => handleQuantityChange(record.id, value as number)}
          size="small"
          style={{ width: 60 }}
          aria-label={`${t('machines.tableHeaders.quantity')} ${record.name}`}
          aria-valuemin={1}
          aria-valuemax={getRegionInventory(record, userRegion)}
          aria-valuenow={quantities[record.id] || 1}
        />
      )
    },
    {
      title: t('machines.tableHeaders.actions'),
      key: 'actions',
      width: 180,
      render: (_: any, record: MachineProduct) => {
        const inventory = getRegionInventory(record, userRegion);
        const isOutOfStock = inventory <= 0;
        
        return (
          <div className="actions-column">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              size="small"
              onClick={() => handleAddToCart(record)}
              disabled={isOutOfStock}
              aria-label={`${t('buttons.addToCart')} ${record.name}`}
              aria-disabled={isOutOfStock}
            >
              {t('buttons.addToCart')}
            </Button>
            <Button
              type="link"
              icon={<InfoCircleOutlined />}
              size="small"
              onClick={() => handleViewDetails(record.id)}
              aria-label={`${t('buttons.viewDetails')} ${record.name}`}
            >
              {t('buttons.viewDetails')}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="machine-table-container" role="region" aria-label={t('machines.pageTitle')}>
      <Spin spinning={loading} tip={t('loading.machines')}>
        <Table
          dataSource={machines}
          columns={columns}
          rowKey="id"
          pagination={false}
          rowClassName={(record) => selectedMachine === record.id ? 'selected-row' : ''}
          onRow={(record) => ({
            onClick: () => handleMachineSelection(record.id),
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleMachineSelection(record.id);
                e.preventDefault();
              }
            },
            tabIndex: 0,
            'aria-selected': selectedMachine === record.id,
            role: 'row'
          })}
          aria-live="polite"
        />
      </Spin>
    </div>
  );
};

export default MachineTable; 