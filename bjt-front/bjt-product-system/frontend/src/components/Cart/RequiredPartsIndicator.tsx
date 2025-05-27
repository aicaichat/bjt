import React from 'react';
import { ExtendedCartItem } from '../../contexts/CartContext';
import { SparePart } from '../../types/spareParts';
import { RequiredPartsManager } from '../../utils/requiredPartsManager';

interface RequiredPartsIndicatorProps {
  item: ExtendedCartItem;
  allItems: ExtendedCartItem[];
  allSpareParts: SparePart[];
}

/**
 * 必选备件关系指示器
 */
export const RequiredPartsIndicator: React.FC<RequiredPartsIndicatorProps> = ({
  item,
  allItems,
  allSpareParts
}) => {
  const manager = new RequiredPartsManager(allItems, allSpareParts);
  
  // 获取备件的依赖信息摘要
  const dependencySummary = manager.getDependencySummary(item.part_number);

  if (!dependencySummary.hasRequiredParts && !dependencySummary.isRequiredByOthers) {
    return null;
  }

  return (
    <div className="required-parts-indicator">
      {dependencySummary.hasRequiredParts && (
        <span 
          className="has-required-badge" 
          title={`此备件包含 ${dependencySummary.requiredParts.length} 个必选备件: ${dependencySummary.requiredParts.map(p => p.part_number).join(', ')}`}
        >
          📦 含必选件
        </span>
      )}
      {dependencySummary.isRequiredByOthers && (
        <span 
          className="is-required-badge" 
          title={`此备件被以下备件依赖: ${dependencySummary.dependentParts.join(', ')}`}
        >
          🔗 被依赖
        </span>
      )}
    </div>
  );
};

// 添加对应的CSS样式
export const RequiredPartsIndicatorStyles = `
.required-parts-indicator {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.has-required-badge,
.is-required-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  cursor: help;
}

.has-required-badge {
  background: #fff2e8;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.is-required-badge {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.has-required-badge:hover,
.is-required-badge:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}
`; 