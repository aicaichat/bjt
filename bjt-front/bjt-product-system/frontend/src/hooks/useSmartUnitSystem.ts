import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSmartUnitSystem = () => {
  const { getPreferredUnit } = useAuth();
  
  // 直接基于用户账户设置的单位制偏好
  const preferredUnitSystem = useMemo((): 'metric' | 'imperial' => {
    const authPreference = getPreferredUnit?.();
    if (authPreference && ['metric', 'imperial'].includes(authPreference)) {
      return authPreference as 'metric' | 'imperial';
    }
    
    // 默认值：全球默认使用公制
    return 'metric';
  }, [getPreferredUnit]);
  
  return {
    preferredUnitSystem,
    accountUnitSetting: getPreferredUnit?.() || 'metric'
  };
}; 