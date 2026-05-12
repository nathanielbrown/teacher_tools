import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from '../utils/storage';

describe('StorageWrapper', () => {
  beforeEach(() => {
    // Clear everything before each test
    window.localStorage.clear();
    storage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should handle GDPR consent correctly', () => {
    expect(storage.hasGDPRConsent()).toBe(false);
    storage.setGDPRConsent(true);
    expect(storage.hasGDPRConsent()).toBe(true);
    expect(window.localStorage.getItem('gdprConsent')).toBe('true');
  });

  it('should store data in memory when no GDPR consent is given', () => {
    storage.setItem('test_key', 'test_value');
    expect(window.localStorage.getItem('test_key')).toBe(null);
    expect(storage.getItem('test_key')).toBe('test_value');
  });

  it('should store data in localStorage when GDPR consent is given', () => {
    storage.setGDPRConsent(true);
    storage.setItem('test_key', 'test_value');
    expect(window.localStorage.getItem('test_key')).toBe('test_value');
    expect(storage.getItem('test_key')).toBe('test_value');
  });

  it('should migrate memory store to localStorage when GDPR consent is granted', () => {
    storage.setItem('temp_key', 'temp_value');
    expect(window.localStorage.getItem('temp_key')).toBe(null);
    
    storage.setGDPRConsent(true);
    expect(window.localStorage.getItem('temp_key')).toBe('temp_value');
    expect(storage.getItem('temp_key')).toBe('temp_value');
  });

  it('should clear all data (except consent) when clear is called with consent', () => {
    storage.setGDPRConsent(true);
    storage.setItem('key1', 'val1');
    storage.setItem('key2', 'val2');
    
    storage.clear();
    
    expect(storage.getItem('key1')).toBe(null);
    expect(storage.getItem('key2')).toBe(null);
    expect(storage.hasGDPRConsent()).toBe(true);
  });

  it('should remove items correctly', () => {
    storage.setItem('remove_me', 'value');
    storage.removeItem('remove_me');
    expect(storage.getItem('remove_me')).toBe(null);

    storage.setGDPRConsent(true);
    storage.setItem('remove_me_persistent', 'value');
    storage.removeItem('remove_me_persistent');
    expect(window.localStorage.getItem('remove_me_persistent')).toBe(null);
  });

  it('should return correct length and keys', () => {
    storage.setItem('a', '1');
    storage.setItem('b', '2');
    expect(storage.length).toBe(2);
    
    // Key order in Map vs localStorage might differ, but we check presence
    const keys = [storage.key(0), storage.key(1)];
    expect(keys).toContain('a');
    expect(keys).toContain('b');

    storage.setGDPRConsent(true);
    storage.setItem('c', '3');
    // keys in localStorage: 'gdprConsent', 'a', 'b', 'c'
    expect(storage.length).toBe(4); 
    
    const allKeys = [];
    for (let i = 0; i < storage.length; i++) {
      allKeys.push(storage.key(i));
    }
    expect(allKeys).toContain('gdprConsent');
    expect(allKeys).toContain('a');
    expect(allKeys).toContain('b');
    expect(allKeys).toContain('c');
  });
});
