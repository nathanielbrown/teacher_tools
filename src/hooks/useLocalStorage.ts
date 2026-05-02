import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { storage } from '../utils/storage';

/**
 * A hook to manage state in localStorage.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value if nothing is found in storage.
 * @returns A stateful value and a function to update it.
 */
export const useLocalStorage = <T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading storage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing storage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};
