import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';

export interface MachineFilterState {
  type: string;
  region: string;
  voltage: string;
  search: string;
}

export interface MachineFilterOptions {
  types: Array<{ value: string; label: string }>;
  regions: Array<{ value: string; label: string }>;
  voltages: Array<{ value: string; label: string }>;
}

const DEFAULT_FILTERS: MachineFilterState = {
  type: 'all',
  region: 'CN',
  voltage: '220V',
  search: ''
};

export const useMachineFilters = (initialOptions: MachineFilterOptions) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filter state from URL or defaults
  const [filters, setFilters] = useState<MachineFilterState>(() => {
    const type = searchParams.get('type') || DEFAULT_FILTERS.type;
    const region = searchParams.get('region') || DEFAULT_FILTERS.region;
    const voltage = searchParams.get('voltage') || DEFAULT_FILTERS.voltage;
    const search = searchParams.get('search') || DEFAULT_FILTERS.search;
    
    return { type, region, voltage, search };
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (filters.type !== DEFAULT_FILTERS.type) {
      params.set('type', filters.type);
    } else {
      params.delete('type');
    }
    
    if (filters.region !== DEFAULT_FILTERS.region) {
      params.set('region', filters.region);
    } else {
      params.delete('region');
    }
    
    if (filters.voltage !== DEFAULT_FILTERS.voltage) {
      params.set('voltage', filters.voltage);
    } else {
      params.delete('voltage');
    }
    
    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Debounced search handler
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 300),
    []
  );

  // Filter change handlers
  const handleTypeChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, type: value }));
  }, []);

  const handleRegionChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, region: value }));
  }, []);

  const handleVoltageChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, voltage: value }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Filter options
  const filterOptions: MachineFilterOptions = {
    types: [
      { value: 'all', label: t('filters.allModels') },
      ...initialOptions.types
    ],
    regions: initialOptions.regions,
    voltages: [
      { value: 'ALL', label: t('filters.all') },
      ...initialOptions.voltages
    ]
  };

  return {
    filters,
    filterOptions,
    handleTypeChange,
    handleRegionChange,
    handleVoltageChange,
    handleSearchChange,
    resetFilters
  };
}; 