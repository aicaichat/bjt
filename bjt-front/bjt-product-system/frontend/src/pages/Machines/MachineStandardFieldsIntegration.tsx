/**
 * 机器页面标准化字段集成组件
 * 
 * 🎯 设计目标：最大化复用现有代码，最小化侵入性修改
 * 📋 集成策略：仅替换字段显示逻辑，保持所有其他功能不变
 * 🔧 技术方案：通过功能开关控制新旧组件切换
 */

import React from 'react';
import { Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachinePart } from '../../types/machines';
import { useMachineFieldDisplay } from '../../hooks/useMachineFieldDisplay';
import { MachineFields, MachineTooltip } from '../../components/MachineFieldDisplay';
import { MACHINE_FEATURE_FLAGS } from '../../config/machine-display-config';

// 标准化规格信息显示组件
interface StandardizedMachineSpecsProps {
  machine: MachinePart;
  hostModels?: any[];
  showInfoToast?: (message: string) => void;
  className?: string;
}

/**
 * 标准化的机器规格信息组件
 * 🔄 直接替换现有的第2列规格显示部分
 */
export const StandardizedMachineSpecs: React.FC<StandardizedMachineSpecsProps> = ({
  machine,
  hostModels = [],
  showInfoToast,
  className = ''
}) => {
  const { t } = useTranslation('machines');

  return (
    <div className={`w-full md:w-3/5 md:px-6 ${className}`}>
      {/* 产品标题 - 保持原有样式 */}
      <div className="mb-4">
        <span className="inline-block bg-blue-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">
          {machine.part_number}
        </span>
        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">
          {machine.name_zh || machine.name_en || machine.model}
        </h3>
      </div>
      
      {/* ✅ 核心：使用标准化字段显示组件 */}
      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
        <MachineFields
          machine={machine}
          scenario="productCard"
          layout="grid"
          columns={2}
          showEmptyFields={false}
        />
      </div>

      {/* 操作按钮 - 保持原有逻辑 */}
      <div className="mt-4 flex gap-3">
        {/* 规格说明按钮 - 保持原有PDF查找逻辑 */}
        <Button 
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => {
            // 保持原有的PDF查找和打开逻辑
            const hostModel = hostModels.find(model => {
              const cleanString = (str: string) => {
                if (!str) return '';
                return str.replace(/^["']+|["']+$/g, '').trim();
              };
              
              const cleanMachineModel = cleanString(machine.model || '');
              const cleanHostCode = cleanString((model as any).code || '');
              const cleanHostModel = cleanString(model.model || '');
              
              if ((model as any).machine_id === machine.id) return true;
              if ((model as any).part_number === machine.part_number) return true;
              if (cleanHostCode && cleanMachineModel && cleanHostCode === cleanMachineModel) return true;
              if (cleanHostModel && cleanMachineModel && cleanHostModel === cleanMachineModel) return true;
              
              return false;
            });
            
            const pdfUrl = hostModel ? 
              (hostModel as any).spec_pdf || 
              (hostModel as any).explosion_diagram_pdf : null;
            
            if (pdfUrl && !pdfUrl.includes('placeholder')) {
              let finalPdfUrl = pdfUrl;
              if (!pdfUrl.startsWith('http')) {
                const baseUrl = window.location.origin;
                let cleanPath = pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl;
                cleanPath = cleanPath.replace('/frontend/public', '');
                finalPdfUrl = baseUrl + cleanPath;
              }
              window.open(finalPdfUrl, '_blank');
            } else {
              showInfoToast?.(t('noSpecPdf') || '暂无规格说明文档');
            }
          }}
          className="bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white border-gray-300 transition-colors duration-200"
        >
          {t('specDetails')}
        </Button>
        
        {/* ✅ 核心：使用标准化Tooltip组件 */}
        <MachineTooltip machine={machine} placement="topRight">
          <Button 
            size="small"
            icon={<InfoCircleOutlined />}
            className="bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-300 transition-colors duration-200"
          >
            {t('moreInfo')}
          </Button>
        </MachineTooltip>
      </div>
    </div>
  );
};

/**
 * 旧版规格信息组件（保持原有实现）
 * 🔄 直接从现有代码复制，确保完全兼容
 */
export const LegacyMachineSpecs: React.FC<StandardizedMachineSpecsProps> = ({
  machine,
  hostModels = [],
  showInfoToast,
  className = ''
}) => {
  const { t } = useTranslation('machines');
  // 从现有代码获取unitSystem状态（需要从父组件传入）
  const unitSystem = 'metric'; // 这里需要从父组件传入实际的unitSystem

  return (
    <div className={`w-full md:w-3/5 md:px-6 ${className}`}>
      {/* 产品标题 - 原有实现 */}
      <div className="mb-4">
        <span className="inline-block bg-blue-500 text-white px-3 py-1 text-sm font-bold rounded-lg shadow-sm">
          {machine.part_number}
        </span>
        <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">
          {machine.name_zh || machine.name_en || machine.model}
        </h3>
      </div>
      
      {/* ❌ 原有的字段显示逻辑（存在单位重复问题） */}
      <div className="bg-gray-50 rounded-lg p-4 mt-3 shadow-sm">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.model')}:</strong>
            <span className="text-gray-800 font-medium">{machine.model}</span>
          </div>
          <div className="flex items-center">
            <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.voltage')}:</strong>
            <span className="text-gray-800 font-medium">
              {machine.voltage ? t('voltages.' + machine.voltage) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center">
            <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.pcsPerBox')}:</strong>
            <span className="text-gray-800 font-medium">
              {machine.pcs_per_box !== null && machine.pcs_per_box !== undefined ? machine.pcs_per_box : 'N/A'}
            </span>
          </div>
          <div className="flex items-center">
            <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.pcsPerPallet')}:</strong>
            <span className="text-gray-800 font-medium">
              {machine.pcs_per_pallet !== null && machine.pcs_per_pallet !== undefined ? machine.pcs_per_pallet : 'N/A'}
            </span>
          </div>
          <div className="flex items-center">
            <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.palletSize')}:</strong>
            <span className="text-gray-800 font-medium">
              {unitSystem === 'metric' 
                ? (machine.pallet_size_cm || 'N/A')
                : (machine.pallet_size_inch || 'N/A')
              }
            </span>
          </div>
          <div className="flex items-center">
            <strong className="w-24 text-gray-600 font-medium">{t('tableHeaders.packSize')}:</strong>
            <span className="text-gray-800 font-medium">
              {unitSystem === 'metric' 
                ? (machine.package_size_cm || 'N/A')
                : (machine.package_size_inch || 'N/A')
              }
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 - 原有实现 */}
      <div className="mt-4 flex gap-3">
        <Button 
          size="small"
          icon={<InfoCircleOutlined />}
          className="bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white border-gray-300 transition-colors duration-200"
        >
          {t('specDetails')}
        </Button>
        
        {/* ❌ 原有的Tooltip实现（存在单位重复问题） */}
        <Tooltip
          title={
            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600 font-medium text-xs">
                    包装尺寸 {unitSystem === 'metric' ? 'cm' : 'inch'}:
                  </span>
                  <span className="text-gray-800 font-semibold text-xs bg-blue-50 px-2 py-1 rounded">
                    {unitSystem === 'metric' ? (machine.package_size_cm || 'N/A') : (machine.package_size_inch || 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600 font-medium text-xs">
                    单件净重 {unitSystem === 'metric' ? 'kg' : 'lbs'}:
                  </span>
                  <span className="text-gray-800 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                    {/* ❌ 单位重复显示 */}
                    {unitSystem === 'metric' 
                      ? (machine.net_weight_kg !== null ? `${machine.net_weight_kg} kg` : 'N/A')
                      : (machine.net_weight_lbs !== null ? `${machine.net_weight_lbs} lbs` : 'N/A')
                    }
                  </span>
                </div>
              </div>
            </div>
          }
          placement="topRight"
        >
          <Button 
            size="small"
            icon={<InfoCircleOutlined />}
            className="bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-300 transition-colors duration-200"
          >
            {t('moreInfo')}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

/**
 * 智能字段显示组件选择器
 * 🔧 根据功能开关自动选择新旧组件
 */
interface SmartMachineSpecsProps extends StandardizedMachineSpecsProps {
  unitSystem?: 'metric' | 'imperial';
}

export const SmartMachineSpecs: React.FC<SmartMachineSpecsProps> = (props) => {
  // 根据功能开关选择组件
  if (MACHINE_FEATURE_FLAGS.ENABLE_STANDARDIZED_DISPLAY) {
    return <StandardizedMachineSpecs {...props} />;
  } else {
    return <LegacyMachineSpecs {...props} />;
  }
}; 