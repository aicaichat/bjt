import { renderHook, act } from '@testing-library/react';
import { useSmartUnitSystem } from '../useSmartUnitSystem';

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    getPreferredUnit: jest.fn().mockReturnValue('metric')
  }),
  UnitSystem: {
    METRIC: 'metric',
    IMPERIAL: 'imperial'
  }
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('useSmartUnitSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  test('should return metric as default unit system', () => {
    const { result } = renderHook(() => useSmartUnitSystem());
    expect(result.current.preferredUnitSystem).toBe('metric');
  });

  test('should map smart field keys correctly for metric system', () => {
    const { result } = renderHook(() => useSmartUnitSystem());
    
    expect(result.current.getSmartFieldKey('package_size')).toBe('package_size_cm');
    expect(result.current.getSmartFieldKey('net_weight')).toBe('net_weight_kg');
    expect(result.current.getSmartFieldKey('pallet_size')).toBe('pallet_size_cm');
  });

  test('should map smart field keys correctly for imperial system', () => {
    // Mock imperial preference
    require('../../contexts/AuthContext').useAuth.mockReturnValue({
      getPreferredUnit: jest.fn().mockReturnValue('imperial')
    });

    const { result } = renderHook(() => useSmartUnitSystem());
    
    expect(result.current.getSmartFieldKey('package_size')).toBe('package_size_inch');
    expect(result.current.getSmartFieldKey('net_weight')).toBe('net_weight_lbs');
    expect(result.current.getSmartFieldKey('pallet_size')).toBe('pallet_size_inch');
  });

  test('should return correct units for fields', () => {
    const { result } = renderHook(() => useSmartUnitSystem());
    
    expect(result.current.getFieldUnit('package_size')).toBe('cm');
    expect(result.current.getFieldUnit('net_weight')).toBe('kg');
    expect(result.current.getFieldUnit('bubble_diameter')).toBe('mm');
    expect(result.current.getFieldUnit('thickness')).toBe('μm / gsm');
  });

  test('should handle temporary unit override', () => {
    const { result } = renderHook(() => useSmartUnitSystem());
    
    act(() => {
      result.current.setTemporaryUnit('imperial');
    });
    
    expect(result.current.preferredUnitSystem).toBe('imperial');
    expect(result.current.isTemporaryOverride).toBe(true);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('temp_unit_override', 'imperial');
  });

  test('should clear temporary unit override', () => {
    const { result } = renderHook(() => useSmartUnitSystem());
    
    act(() => {
      result.current.setTemporaryUnit('imperial');
    });
    
    act(() => {
      result.current.setTemporaryUnit(null);
    });
    
    expect(result.current.preferredUnitSystem).toBe('metric');
    expect(result.current.isTemporaryOverride).toBe(false);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('temp_unit_override');
  });

  test('should restore temporary override from sessionStorage', () => {
    mockSessionStorage.getItem.mockReturnValue('imperial');
    
    const { result } = renderHook(() => useSmartUnitSystem());
    
    expect(result.current.preferredUnitSystem).toBe('imperial');
    expect(result.current.isTemporaryOverride).toBe(true);
  });

  test('should handle unknown field keys gracefully', () => {
    const { result } = renderHook(() => useSmartUnitSystem());
    
    expect(result.current.getSmartFieldKey('unknown_field')).toBe('unknown_field');
    expect(result.current.getFieldUnit('unknown_field')).toBe('');
  });
}); 