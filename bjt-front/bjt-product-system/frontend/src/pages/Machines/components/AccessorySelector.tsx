import React, { useCallback } from 'react';
import { Button, Spin, Empty, Tag, Tabs, Popover } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachineAccessory } from '../../../types/machines';

const { TabPane } = Tabs;

interface AccessorySelectorProps {
  selectedMachine: string;
  accessories: MachineAccessory[];
  level2Accessories: MachineAccessory[];
  level3Accessories: MachineAccessory[];
  level4Accessories: MachineAccessory[];
  level5Accessories: MachineAccessory[];
  selectedAccessories: Record<string, string>;
  selectedAccessoryNames: Record<string, string>;
  loadingStates: {
    level2: boolean;
    level3: boolean;
    level4: boolean;
    level5: boolean;
  };
  onAccessorySelect: (level: number, accessoryId: string, accessoryName: string) => void;
  onAddToCart: (accessory: MachineAccessory) => void;
  getMachineName: (machine: any) => string;
}

export const AccessorySelector: React.FC<AccessorySelectorProps> = ({
  selectedMachine,
  accessories,
  level2Accessories,
  level3Accessories,
  level4Accessories,
  level5Accessories,
  selectedAccessories,
  selectedAccessoryNames,
  loadingStates,
  onAccessorySelect,
  onAddToCart,
  getMachineName
}) => {
  const { t } = useTranslation();

  const renderAccessoryPath = useCallback((level: number) => {
    const pathItems = [];
    
    for (let i = 1; i <= level; i++) {
      const selectedAccessoryName = selectedAccessoryNames[`level${i}`];
      if (selectedAccessoryName) {
        pathItems.push(
          <span key={i} className="path-item">
            {selectedAccessoryName}
          </span>
        );
        
        if (i < level) {
          pathItems.push(
            <RightOutlined key={`arrow-${i}`} className="path-arrow" />
          );
        }
      }
    }
    
    return pathItems.length > 0 ? (
      <div className="accessory-path">
        <span className="path-label">{t('accessory.path')}:</span>
        {pathItems}
      </div>
    ) : null;
  }, [selectedAccessoryNames, t]);

  const renderAccessoryInfo = useCallback((accessory: MachineAccessory) => (
    <div className="accessory-info-popover">
      <div className="info-section">
        <h4>{t('accessory.details')}</h4>
        <p><strong>{t('accessory.level')}:</strong> {accessory.level || 'N/A'}</p>
        {accessory.description_zh && (
          <p><strong>{t('accessory.description')}:</strong> {accessory.description_zh}</p>
        )}
      </div>
      {accessory.specifications && (
        <div className="info-section">
          <h4>{t('accessory.specifications')}</h4>
          <pre>{JSON.stringify(accessory.specifications, null, 2)}</pre>
        </div>
      )}
    </div>
  ), [t]);

  const renderAccessory = useCallback((accessory: MachineAccessory, level: number) => (
    <div
      key={accessory.id}
      className={`accessory-item ${
        selectedAccessories[`level${level}`] === accessory.id.toString() ? 'selected' : ''
      }`}
      onClick={() => onAccessorySelect(level, accessory.id.toString(), accessory.name_zh || accessory.name_en || 'N/A')}
    >
      <div className="accessory-content">
        <div className="accessory-header">
          <h4 className="accessory-name">
            {accessory.name_zh || accessory.name_en || 'N/A'}
          </h4>
          {accessory.part_number && (
            <span className="accessory-code">{accessory.part_number}</span>
          )}
        </div>

        <div className="accessory-description">
          {accessory.description_zh || accessory.description_en || ''}
        </div>

        <div className="accessory-meta">
          <Tag color="blue">Level {level}</Tag>
          {accessory.price && (
            <Tag color="green">¥{accessory.price}</Tag>
          )}
        </div>

        <div className="accessory-actions">
          <Popover
            content={renderAccessoryInfo(accessory)}
            title={t('accessory.details')}
            trigger="hover"
            placement="top"
          >
            <Button
              icon={<InfoCircleOutlined />}
              size="small"
              type="text"
              onClick={(e) => e.stopPropagation()}
            >
              {t('moreInfo')}
            </Button>
          </Popover>

          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(accessory);
            }}
          >
            {t('addToCart')}
          </Button>
        </div>
      </div>
    </div>
  ), [selectedAccessories, onAccessorySelect, onAddToCart, renderAccessoryInfo, t]);

  const renderAccessoryLevel = useCallback((accessories: MachineAccessory[], level: number, loading: boolean) => {
    if (loading) {
      return (
        <div className="accessory-level-loading">
          <Spin size="small" />
          <span>{t('accessory.loading')}</span>
        </div>
      );
    }

    if (accessories.length === 0) {
      return (
        <div className="accessory-level-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('accessory.noItems')}
          />
        </div>
      );
    }

    return (
      <div className="accessory-level">
        {renderAccessoryPath(level)}
        <div className="accessory-grid">
          {accessories.map(accessory => renderAccessory(accessory, level))}
        </div>
      </div>
    );
  }, [renderAccessoryPath, renderAccessory, t]);

  if (!selectedMachine) {
    return (
      <div className="accessory-selector-empty">
        <Empty
          description={t('accessory.selectMachine')}
        />
      </div>
    );
  }

  return (
    <div className="accessory-selector">
      <div className="accessory-header">
        <h3>{t('accessory.title')}</h3>
        <p>{t('accessory.selectFor')}</p>
      </div>

      <Tabs
        defaultActiveKey="level1"
        type="card"
        className="accessory-tabs"
      >
        {accessories.length > 0 && (
          <TabPane
            tab={`${t('accessory.level')} 1 (${accessories.length})`}
            key="level1"
          >
            {renderAccessoryLevel(accessories, 1, false)}
          </TabPane>
        )}

        {(level2Accessories.length > 0 || loadingStates.level2) && (
          <TabPane
            tab={`${t('accessory.level')} 2 (${level2Accessories.length})`}
            key="level2"
          >
            {renderAccessoryLevel(level2Accessories, 2, loadingStates.level2)}
          </TabPane>
        )}

        {(level3Accessories.length > 0 || loadingStates.level3) && (
          <TabPane
            tab={`${t('accessory.level')} 3 (${level3Accessories.length})`}
            key="level3"
          >
            {renderAccessoryLevel(level3Accessories, 3, loadingStates.level3)}
          </TabPane>
        )}

        {(level4Accessories.length > 0 || loadingStates.level4) && (
          <TabPane
            tab={`${t('accessory.level')} 4 (${level4Accessories.length})`}
            key="level4"
          >
            {renderAccessoryLevel(level4Accessories, 4, loadingStates.level4)}
          </TabPane>
        )}

        {(level5Accessories.length > 0 || loadingStates.level5) && (
          <TabPane
            tab={`${t('accessory.level')} 5 (${level5Accessories.length})`}
            key="level5"
          >
            {renderAccessoryLevel(level5Accessories, 5, loadingStates.level5)}
          </TabPane>
        )}
      </Tabs>
    </div>
  );
}; 