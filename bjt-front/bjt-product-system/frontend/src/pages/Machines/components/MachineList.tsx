import React, { useState, useCallback } from 'react';
import { Button, InputNumber, Popover, Tag, message } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachinePart } from '../../../types/machines';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { ASSETS } from '../../../config/appConfig';

interface MachineListProps {
  machines: MachinePart[];
  loading: boolean;
  viewMode: 'card' | 'table';
  selectedMachine: string;
  quantities: Record<string, number>;
  userRegion: string;
  isSales: boolean;
  isVIP: boolean;
  onMachineSelect: (machineId: string) => void;
  onQuantityChange: (productId: string, value: number) => void;
  onAddToCart: (product: MachinePart) => void;
  onViewDetails: (machineId: string) => void;
  getMachineName: (machine: MachinePart) => string;
  getMachineDescription: (machine: MachinePart) => string;
  formatPrice: (price: number) => string;
  getCurrencySymbol: (region: string) => string;
}

export const MachineList: React.FC<MachineListProps> = ({
  machines,
  loading,
  viewMode,
  selectedMachine,
  quantities,
  userRegion,
  isSales,
  isVIP,
  onMachineSelect,
  onQuantityChange,
  onAddToCart,
  onViewDetails,
  getMachineName,
  getMachineDescription,
  formatPrice,
  getCurrencySymbol
}) => {
  const { t } = useTranslation();

  const renderMoreInfoContent = useCallback((machine: MachinePart) => (
    <div className="machine-info-popover">
      <div className="info-section">
        <h4>{t('packaging.title')}</h4>
        <p><strong>{t('packaging.size')}:</strong> {machine.package_size_cm || 'N/A'}</p>
        <p><strong>{t('packaging.weight')}:</strong> {machine.gross_weight_kg || 'N/A'} kg</p>
      </div>
      <div className="info-section">
        <h4>{t('pallet.title')}</h4>
        <p><strong>{t('pallet.size')}:</strong> {machine.pallet_size_cm || 'N/A'}</p>
        <p><strong>{t('pallet.height')}:</strong> {machine.pallet_height_cm || 'N/A'} cm</p>
        <p><strong>{t('pallet.quantity')}:</strong> {machine.pcs_per_pallet || 'N/A'} pcs</p>
      </div>
    </div>
  ), [t]);

  const renderMachineCard = useCallback((machine: MachinePart) => (
    <div 
      key={machine.id}
      className={`machine-card ${selectedMachine === machine.id.toString() ? 'selected' : ''}`}
      onClick={() => onMachineSelect(machine.id.toString())}
    >
      <div className="machine-image">
        {machine.model_image1_url ? (
          <img 
            src={machine.model_image1_url} 
            alt={getMachineName(machine)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== ASSETS.DEFAULT_IMAGE) {
                target.src = ASSETS.DEFAULT_IMAGE;
              }
            }}
          />
        ) : (
          <div className="image-placeholder">
            <span>{t('noImage')}</span>
          </div>
        )}
      </div>

      <div className="machine-content">
        <div className="machine-header">
          <h3 className="machine-name">{getMachineName(machine)}</h3>
          <span className="machine-code">{machine.part_number}</span>
        </div>

        <div className="machine-description">
          {getMachineDescription(machine)}
        </div>

        <div className="machine-specs">
          {machine.voltage && (
            <Tag color="blue">{t('voltage')}: {machine.voltage}</Tag>
          )}
          {machine.model_type && (
            <Tag color="green">{t('type')}: {machine.model_type}</Tag>
          )}
        </div>

        <div className="machine-actions">
          <div className="quantity-control">
            <label>{t('quantity')}:</label>
            <InputNumber
              min={1}
              max={999}
              value={quantities[machine.id.toString()] || 1}
              onChange={(value) => onQuantityChange(machine.id.toString(), value || 1)}
              size="small"
            />
          </div>

          <div className="action-buttons">
            <Popover
              content={renderMoreInfoContent(machine)}
              title={t('moreInfo')}
              trigger="hover"
              placement="top"
            >
              <Button
                icon={<InfoCircleOutlined />}
                size="small"
                type="text"
              >
                {t('moreInfo')}
              </Button>
            </Popover>

            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(machine);
              }}
              size="small"
            >
              {t('addToCart')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ), [
    selectedMachine, quantities, t, onMachineSelect, onQuantityChange, 
    onAddToCart, getMachineName, getMachineDescription, renderMoreInfoContent
  ]);

  const renderMachineTable = useCallback(() => (
    <div className="machine-table-container">
      <table className="machine-table">
        <thead>
          <tr>
            <th>{t('image')}</th>
            <th>{t('name')}</th>
            <th>{t('code')}</th>
            <th>{t('type')}</th>
            <th>{t('specs')}</th>
            <th>{t('quantity')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => (
            <tr 
              key={machine.id}
              className={`machine-row ${selectedMachine === machine.id.toString() ? 'selected' : ''}`}
              onClick={() => onMachineSelect(machine.id.toString())}
            >
              <td className="image-cell">
                {machine.model_image1_url ? (
                  <img 
                    src={machine.model_image1_url} 
                    alt={getMachineName(machine)}
                    className="machine-thumbnail"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== ASSETS.DEFAULT_IMAGE) {
                        target.src = ASSETS.DEFAULT_IMAGE;
                      }
                    }}
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <span>N/A</span>
                  </div>
                )}
              </td>
              
              <td className="name-cell">
                <div className="machine-name-container">
                  <span className="machine-name">{getMachineName(machine)}</span>
                  <span className="machine-description">{getMachineDescription(machine)}</span>
                </div>
              </td>
              
              <td className="code-cell">
                <span className="machine-code">{machine.part_number}</span>
              </td>
              
              <td className="type-cell">
                <Tag color="blue">{machine.model_type || 'N/A'}</Tag>
              </td>
              
              <td className="specs-cell">
                <div className="specs-container">
                  {machine.voltage && <Tag>{machine.voltage}</Tag>}
                  {machine.model_type && <Tag>{machine.model_type}</Tag>}
                </div>
              </td>
              
              <td className="quantity-cell">
                <InputNumber
                  min={1}
                  max={999}
                  value={quantities[machine.id.toString()] || 1}
                  onChange={(value) => onQuantityChange(machine.id.toString(), value || 1)}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              
              <td className="actions-cell">
                <div className="table-actions">
                  <Popover
                    content={renderMoreInfoContent(machine)}
                    title={t('moreInfo')}
                    trigger="hover"
                  >
                    <Button
                      icon={<InfoCircleOutlined />}
                      size="small"
                      type="text"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popover>
                  
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(machine);
                    }}
                  >
                    {t('add')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [
    machines, selectedMachine, quantities, t, onMachineSelect, onQuantityChange,
    onAddToCart, getMachineName, getMachineDescription, renderMoreInfoContent
  ]);

  if (loading) {
    return (
      <div className="machine-list-loading">
        <div className="loading-spinner">
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="machine-list-empty">
        <div className="empty-content">
          <h3>{t('noMachines')}</h3>
          <p>{t('noMachinesDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`machine-list machine-list-${viewMode}`}>
      {viewMode === 'card' ? (
        <div className="machine-cards-grid">
          {machines.map(renderMachineCard)}
        </div>
      ) : (
        renderMachineTable()
      )}
    </div>
  );
}; 