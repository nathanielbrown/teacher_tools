import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { storage } from '../utils/storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('should use the initial value if storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test_key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should load an existing value from storage', () => {
    storage.setItem('test_key', JSON.stringify('stored_value'));
    const { result } = renderHook(() => useLocalStorage('test_key', 'default'));
    expect(result.current[0]).toBe('stored_value');
  });

  it('should update storage when state changes', () => {
    const { result } = renderHook(() => useLocalStorage('test_key', 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(storage.getItem('test_key')).toBe(JSON.stringify('updated'));
  });

  it('should handle complex objects', () => {
    const complex = { a: 1, b: [2, 3] };
    const { result } = renderHook(() => useLocalStorage('complex_key', {}));

    act(() => {
      result.current[1](complex);
    });

    expect(result.current[0]).toEqual(complex);
    expect(storage.getItem('complex_key')).toBe(JSON.stringify(complex));
  });

  it('should handle storage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Corrupt JSON in storage
    storage.setItem('corrupt_key', 'invalid-json');
    
    const { result } = renderHook(() => useLocalStorage('corrupt_key', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
