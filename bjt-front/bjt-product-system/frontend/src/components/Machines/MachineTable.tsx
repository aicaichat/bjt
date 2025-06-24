import React from 'react';
import { Table, Button, Spin } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { MachineProduct } from '../../types/machines';
import { useTranslation } from 'react-i18next';
import './MachineTable.css';

interface MachineTableProps {
  machines: MachineProduct[];
  loading: boolean;
  quantities: Record<string, number>;
  userRegion: string;
  selectedMachine: number | string;
  isSales: boolean;
  isVIP: boolean;
  handleQuantityChange: (productId: string | number, value: number) => void;
  handleAddToCart: (product: MachineProduct) => void;
  handleViewDetails: (machineId: string | number) => void;
  handleMachineSelection: (machineId: string | number) => void;
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
          className={`model-cell ${String(selectedMachine) === String(record.id) ? 'selected-machine' : ''}`}
          onClick={() => handleMachineSelection(record.id)}
          tabIndex={0}
          role="button"
          aria-pressed={String(selectedMachine) === String(record.id)}
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
        let price = record.prices?.base || 0;
        if (isSales) {
          price = record.prices?.tier1 || 0;
        }
        if (isVIP) {
          price = record.prices?.vip || 0;
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
              className={`status-badge ${status.className}`}
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
      width: 150,
      render: (_: any, record: MachineProduct) => {
        const inventory = getRegionInventory(record, userRegion);
        const currentQuantity = quantities[String(record.id)] || 1;
        const isAtMinimum = currentQuantity <= 1;
        const isAtMaximum = currentQuantity >= inventory;
        
        return (
          <div className="quantity-control">
            <Button
              icon={<MenuOutlined />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isAtMinimum) {
                  handleQuantityChange(record.id, currentQuantity - 1);
                }
              }}
              disabled={isAtMinimum}
              className="quantity-btn"
              aria-label={t('buttons.decreaseQuantity')}
            />
            <input
              className="quantity-input"
              type="text"
              value={String(currentQuantity)}
              readOnly
              aria-label={`${t('machines.tableHeaders.quantity')}: ${currentQuantity}`}
            />
            <Button
              icon={<PlusOutlined />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isAtMaximum) {
                  handleQuantityChange(record.id, currentQuantity + 1);
                }
              }}
              disabled={isAtMaximum}
              className="quantity-btn"
              aria-label={t('buttons.increaseQuantity')}
            />
          </div>
        );
      }
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
              disabled={false}
              className="add-cart-btn"
              aria-label={`${t('buttons.addToCart')} ${record.name}`}
              aria-disabled={false}
            >
              {t('buttons.addToCart')}
            </Button>
            <Button
              type="link"
              icon={<InfoCircleOutlined />}
              size="small"
              onClick={() => handleViewDetails(record.id)}
              className="details-btn"
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
          rowClassName={(record: MachineProduct) => String(selectedMachine) === String(record.id) ? 'selected-row' : ''}
          onRow={(record: MachineProduct) => ({
            onClick: () => handleMachineSelection(record.id),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleMachineSelection(record.id);
                e.preventDefault();
              }
            },
            tabIndex: 0,
            'aria-selected': String(selectedMachine) === String(record.id),
            role: 'row'
          })}
          aria-live="polite"
        />
      </Spin>
    </div>
  );
};

export default MachineTable; 