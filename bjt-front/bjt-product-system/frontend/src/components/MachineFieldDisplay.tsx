/**
 * 机器页面字段显示组件
 * 基于耗材页面成功经验，实现标准化的单位显示
 * 
 * 核心原则：标题包含单位，内容显示纯数值，避免重复
 */

import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { MachinePart } from '../types/machines';
import { useMachineFieldDisplay, MachineFieldDisplayResult } from '../hooks/useMachineFieldDisplay';
import { MACHINE_FEATURE_FLAGS } from '../config/machine-display-config';

// 单个字段显示组件属性
interface MachineFieldProps {
  field: MachineFieldDisplayResult;
  layout?: 'horizontal' | 'vertical';
  showEmptyFields?: boolean;
  className?: string;
}

// 多字段显示组件属性
interface MachineFieldsProps {
  machine: MachinePart;
  scenario?: string;
  layout?: 'grid' | 'list' | 'compact';
  columns?: number;
  showEmptyFields?: boolean;
  className?: string;
}

// 产品图片组件属性
interface MachineImageProps {
  machine: MachinePart;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fallbackImage?: string;
}

/**
 * 单个字段显示组件
 * 严格遵循"标题含单位，内容纯数值"的标准
 */
export const MachineField: React.FC<MachineFieldProps> = ({
  field,
  layout = 'horizontal',
  showEmptyFields = false,
  className = ''
}) => {
  // 空值处理
  if (field.isEmpty && !showEmptyFields) {
    return null;
  }

  const displayValue = field.isEmpty ? 'N/A' : field.value;

  if (layout === 'vertical') {
    return (
      <div className={`machine-field-vertical ${className}`}>
        <div className="text-xs text-gray-600 font-medium mb-1">
          {field.label}
        </div>
        <div className="text-sm text-gray-800 font-semibold">
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center machine-field-horizontal ${className}`}>
      <strong className="w-24 text-gray-600 font-medium text-sm mr-2">
        {field.label}:
      </strong>
      <span className="text-gray-800 font-medium text-sm">
        {displayValue}
      </span>
    </div>
  );
};

/**
 * 机器产品图片组件
 */
export const MachineImage: React.FC<MachineImageProps> = ({
  machine,
  size = 'medium',
  className = '',
  fallbackImage = '/images/placeholder.jpg'
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const imageUrl = machine.image_url || machine.model_image1_url || fallbackImage;

  return (
    <img
      src={imageUrl}
      alt={machine.part_number || machine.model}
      className={`object-contain border-2 border-gray-200 rounded-lg bg-gray-50 p-2 shadow-sm hover:shadow-md transition-shadow duration-200 ${sizeClasses[size]} ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackImage) {
          target.src = fallbackImage;
        }
      }}
    />
  );
};

/**
 * 多字段显示组件
 * 支持不同布局和场景
 */
export const MachineFields: React.FC<MachineFieldsProps> = ({
  machine,
  scenario = 'productCard',
  layout = 'grid',
  columns = 2,
  showEmptyFields = false,
  className = ''
}) => {
  const { formatMachineFields, validateDisplayStandard } = useMachineFieldDisplay({
    scenario,
    enableDebug: MACHINE_FEATURE_FLAGS.ENABLE_DEBUG_INFO
  });

  const fields = formatMachineFields(machine, scenario);
  const visibleFields = showEmptyFields ? fields : fields.filter(f => !f.isEmpty);

  // 开发环境下验证显示标准
  if (MACHINE_FEATURE_FLAGS.ENABLE_DEBUG_INFO) {
    const validation = validateDisplayStandard(fields);
    if (!validation.isValid) {
      console.warn('[MachineFields] 显示标准验证失败:', validation.issues);
    }
  }

  if (visibleFields.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        暂无可显示的字段信息
      </div>
    );
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return `grid grid-cols-${columns} gap-3`;
      case 'list':
        return 'space-y-2';
      case 'compact':
        return 'flex flex-wrap gap-4';
      default:
        return `grid grid-cols-${columns} gap-3`;
    }
  };

  return (
    <div className={`machine-fields ${getLayoutClasses()} ${className}`}>
      {visibleFields.map((field) => (
        <MachineField
          key={`${field.key}-${scenario}`}
          field={field}
          layout={layout === 'list' ? 'horizontal' : 'vertical'}
          showEmptyFields={showEmptyFields}
        />
      ))}
    </div>
  );
};

/**
 * 机器产品卡片组件（预配置）
 * 主要产品展示场景使用
 */
export const MachineProductCard: React.FC<{
  machine: MachinePart;
  showImage?: boolean;
  className?: string;
}> = ({
  machine,
  showImage = true,
  className = ''
}) => {
  return (
    <div className={`machine-product-card bg-gray-50 rounded-lg p-4 shadow-sm ${className}`}>
      {showImage && (
        <div className="flex justify-center mb-4">
          <MachineImage machine={machine} size="medium" />
        </div>
      )}
      <MachineFields
        machine={machine}
        scenario="productCard"
        layout="grid"
        columns={2}
        showEmptyFields={false}
      />
    </div>
  );
};

/**
 * 机器Tooltip组件（预配置）
 * 详细信息悬浮框使用
 */
export const MachineTooltip: React.FC<{
  machine: MachinePart;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}> = ({
  machine,
  children,
  placement = 'topRight'
}) => {
  return (
    <Tooltip
      title={
        <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md">
          <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
            <InfoCircleOutlined className="text-blue-500 mr-2" />
            <span className="font-bold text-gray-800 text-sm">详细信息</span>
          </div>
          <MachineFields
            machine={machine}
            scenario="tooltip"
            layout="list"
            showEmptyFields={false}
            className="space-y-2"
          />
        </div>
      }
      placement={placement}
      overlayStyle={{
        maxWidth: '400px',
        zIndex: 1000
      }}
      color="white"
      arrow={true}
    >
      {children}
    </Tooltip>
  );
};

/**
 * 机器购物车项组件（预配置）
 * 购物车显示使用
 */
export const MachineCartItem: React.FC<{
  machine: MachinePart;
  showImage?: boolean;
  compact?: boolean;
  className?: string;
}> = ({
  machine,
  showImage = true,
  compact = false,
  className = ''
}) => {
  return (
    <div className={`machine-cart-item flex items-center gap-4 ${className}`}>
      {showImage && (
        <MachineImage machine={machine} size="small" />
      )}
      <div className="flex-1">
        <MachineFields
          machine={machine}
          scenario="cart"
          layout={compact ? 'compact' : 'list'}
          showEmptyFields={false}
        />
      </div>
    </div>
  );
};

/**
 * 机器PO页面组件（预配置）
 * PO页面显示使用
 */
export const MachinePOPage: React.FC<{
  machine: MachinePart;
  className?: string;
}> = ({
  machine,
  className = ''
}) => {
  return (
    <div className={`machine-po-page ${className}`}>
      <MachineFields
        machine={machine}
        scenario="po"
        layout="grid"
        columns={3}
        showEmptyFields={false}
      />
    </div>
  );
};

/**
 * 机器字段显示验证组件
 * 开发环境下显示验证结果
 */
export const MachineFieldValidator: React.FC<{
  machine: MachinePart;
  scenario?: string;
}> = ({
  machine,
  scenario = 'productCard'
}) => {
  const { formatMachineFields, validateDisplayStandard } = useMachineFieldDisplay({
    scenario,
    enableDebug: true
  });

  if (!MACHINE_FEATURE_FLAGS.ENABLE_DEBUG_INFO) {
    return null;
  }

  const fields = formatMachineFields(machine, scenario);
  const validation = validateDisplayStandard(fields);

  return (
    <div className="machine-field-validator mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="text-sm font-semibold text-yellow-800 mb-2">
        字段显示标准验证
      </h4>
      <div className="text-sm">
        <div className={`mb-1 ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
          状态: {validation.isValid ? '✅ 通过' : '❌ 失败'}
        </div>
        <div className="text-gray-600">
          字段数量: {fields.length} | 空字段: {fields.filter(f => f.isEmpty).length}
        </div>
        {validation.issues.length > 0 && (
          <div className="mt-2">
            <div className="text-red-600 font-medium">问题列表:</div>
            <ul className="list-disc list-inside text-red-600 text-xs">
              {validation.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// 导出所有组件
export default {
  MachineField,
  MachineImage,
  MachineFields,
  MachineProductCard,
  MachineTooltip,
  MachineCartItem,
  MachinePOPage,
  MachineFieldValidator
}; 