/**
 * 主机列表行：按 wp_bjt_parts + host-models 关联逻辑解析规格 PDF 并打开。
 * 从 ProductLine1Page 抽离，供「规格说明」按钮与 Figma 文案链复用。
 */
import type { MachinePart } from '../../types/machines';

export type HostModelRow = {
  id: number;
  model: string;
  title_zh: string;
  title_en: string;
  type?: string;
  [key: string]: unknown;
};

function cleanString(str: string): string {
  if (!str) return '';
  return str.replace(/^["']+|["']+$/g, '').trim();
}

export function findHostModelForMachinePart(
  machine: MachinePart,
  hostModels: HostModelRow[]
): HostModelRow | undefined {
  return hostModels.find(model => {
    const cleanMachineModel = cleanString(machine.model || '');
    const cleanMachineName = cleanString(machine.name_zh || '');
    const cleanHostModel = cleanString(model.model || '');
    const cleanHostCode = cleanString(String((model as any).code || ''));
    const cleanHostTitleZh = cleanString(model.title_zh || '');
    const cleanHostTitleEn = cleanString(model.title_en || '');

    if ((model as any).machine_id === machine.id) return true;
    if ((model as any).part_number === machine.part_number) return true;

    if (cleanHostCode && cleanMachineModel && cleanHostCode === cleanMachineModel) return true;
    if (cleanHostModel && cleanMachineModel && cleanHostModel === cleanMachineModel) return true;
    if (cleanHostTitleZh && cleanMachineName && cleanHostTitleZh === cleanMachineName) return true;
    if (cleanHostTitleEn && cleanMachineName && cleanHostTitleEn === cleanMachineName) return true;

    const cleanVersionMachineModel = cleanMachineModel?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
    const cleanVersionHostModel = cleanHostModel?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();
    const cleanVersionHostCode = cleanHostCode?.replace(/\s*(V\d+\.?\d*|测试|test)$/i, '').trim();

    if (
      cleanVersionMachineModel &&
      cleanVersionHostModel &&
      cleanVersionMachineModel.length > 3 &&
      cleanVersionMachineModel === cleanVersionHostModel
    ) {
      return true;
    }
    if (
      cleanVersionMachineModel &&
      cleanVersionHostCode &&
      cleanVersionMachineModel.length > 3 &&
      cleanVersionMachineModel === cleanVersionHostCode
    ) {
      return true;
    }

    const getBaseModel = (modelStr: string) => (modelStr ? modelStr.split('(')[0].trim() : '');
    const machineBaseModel = getBaseModel(cleanMachineModel);
    const hostBaseModel = getBaseModel(cleanHostModel);
    const hostBaseCode = getBaseModel(cleanHostCode);

    if (machineBaseModel && hostBaseModel && machineBaseModel.length > 6 && machineBaseModel === hostBaseModel) {
      const hasExactMatch = hostModels.some(
        m =>
          cleanString(String((m as any).code || '')) === cleanMachineModel ||
          cleanString(m.model || '') === cleanMachineModel
      );
      if (!hasExactMatch) return true;
    }
    if (machineBaseModel && hostBaseCode && machineBaseModel.length > 6 && machineBaseModel === hostBaseCode) {
      const hasExactMatch = hostModels.some(
        m =>
          cleanString(String((m as any).code || '')) === cleanMachineModel ||
          cleanString(m.model || '') === cleanMachineModel
      );
      if (!hasExactMatch) return true;
    }

    const baseMachineModel = cleanMachineModel?.split(/[\s(]/)[0];
    const baseHostModel = cleanHostModel?.split(/[\s(]/)[0];
    const baseHostCode = cleanHostCode?.split(/[\s(]/)[0];

    if (baseMachineModel && baseHostModel && baseMachineModel.length > 4 && baseMachineModel === baseHostModel) {
      const hasExactMatch = hostModels.some(
        m =>
          cleanString(String((m as any).code || '')) === cleanMachineModel ||
          cleanString(m.model || '') === cleanMachineModel
      );
      if (!hasExactMatch) return true;
    }
    if (baseMachineModel && baseHostCode && baseMachineModel.length > 4 && baseMachineModel === baseHostCode) {
      const hasExactMatch = hostModels.some(
        m =>
          cleanString(String((m as any).code || '')) === cleanMachineModel ||
          cleanString(m.model || '') === cleanMachineModel
      );
      if (!hasExactMatch) return true;
    }

    return false;
  });
}

export function openMachineSpecificationPdf(
  machine: MachinePart,
  hostModels: HostModelRow[],
  showInfoToast: (msg: string) => void,
  t: (key: string) => string
): void {
  const hostModel = findHostModelForMachinePart(machine, hostModels);
  const pdfUrl = hostModel
    ? (hostModel as any).spec_pdf || (hostModel as any).explosion_diagram_pdf || (hostModel as any).model_explosion_diagram_pdf
    : null;

  if (pdfUrl && typeof pdfUrl === 'string' && !pdfUrl.includes('placeholder')) {
    let finalPdfUrl = pdfUrl;
    if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
      let cleanPath = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
      cleanPath = cleanPath.replace('/frontend/public', '');
      finalPdfUrl = window.location.origin + cleanPath;
    }
    window.open(finalPdfUrl, '_blank');
  } else {
    showInfoToast(t('noSpecPdf') || '暂无规格说明文档');
  }
}
