import { MachinePart } from '../../../types/machines';
import { MachineFilterState } from '../hooks/useMachineFilters';

/**
 * 检查机器是否匹配所有过滤条件
 */
export const matchesFilters = (machine: MachinePart, filters: MachineFilterState): boolean => {
  // 型号筛选
  const typeMatch = filters.type === 'all' || machine.model === filters.type;
  
  // 电压筛选
  const voltageMatch = filters.voltage === 'ALL' || !filters.voltage || machine.voltage === filters.voltage;
  
  // 区域库存筛选
  const regionMatch = filters.region === 'ALL' || !filters.region || 
    machine.inventory?.some(inv => inv.region === filters.region && inv.quantity > 0);
  
  // 搜索筛选
  const searchMatch = !filters.search || 
    machine.part_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
    machine.name_zh?.toLowerCase().includes(filters.search.toLowerCase()) ||
    machine.name_en?.toLowerCase().includes(filters.search.toLowerCase()) ||
    machine.model?.toLowerCase().includes(filters.search.toLowerCase());
  
  return typeMatch && voltageMatch && regionMatch && searchMatch;
};

/**
 * 获取过滤后的机器列表
 */
export const getFilteredMachines = (
  machines: MachinePart[],
  filters: MachineFilterState
): MachinePart[] => {
  if (!Array.isArray(machines)) return [];
  return machines.filter(machine => matchesFilters(machine, filters));
};

/**
 * 获取可用的过滤选项
 */
export const getAvailableFilterOptions = (machines: MachinePart[]) => {
  if (!Array.isArray(machines)) return {
    types: [],
    voltages: [],
    regions: []
  };

  const types = Array.from(new Set(machines.map(m => m.model).filter(Boolean)));
  const voltages = Array.from(new Set(machines.map(m => m.voltage).filter(Boolean)));
  const regions = Array.from(new Set(
    machines.flatMap(m => m.inventory?.map(inv => inv.region) || []).filter(Boolean)
  ));

  return {
    types: types.map(type => ({ value: type, label: type })),
    voltages: voltages.map(voltage => ({ value: voltage, label: voltage })),
    regions: regions.map(region => ({ value: region, label: region }))
  };
}; 